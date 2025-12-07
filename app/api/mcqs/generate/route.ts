import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDocument } from '@/lib/db';
import { createMCQs } from '@/lib/db';
import { queryChunks } from '@/lib/supabase';
import { generateEmbedding } from '@/lib/gemini';
import { generateChat } from '@/lib/deepseek';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { documentId, count = 15 } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify document exists and belongs to user
    const document = await getDocument(documentId, user.id);
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get more chunks to ensure good coverage for 15 questions
    const sampleEmbedding = await generateEmbedding('study notes content');
    const chunks = await queryChunks(user.id, sampleEmbedding, documentId, Math.min(count * 3, 50));

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No content found in document' },
        { status: 400 }
      );
    }

    // Combine chunks into context
    const context = chunks.map(chunk => chunk.text).join('\n\n');

    // Generate MCQs with detailed, thoughtful questions and explanations
    const systemPrompt = `You are an expert educational content creator. Create high-quality multiple choice questions that:
- Test deep understanding, not just memorization
- Have plausible distractors (wrong answers) that test common misconceptions
- Include comprehensive explanations that teach, not just state the answer
- Cover important concepts, relationships, and applications
- Are challenging but fair`;

    const prompt = `Based on the following study material, generate ${count} high-quality multiple choice questions. Each question should:
1. Test understanding of key concepts from the material
2. Have 4 options where only one is clearly correct
3. Include plausible distractors that test common misconceptions
4. Have a detailed explanation that:
   - Explains why the correct answer is right
   - Explains why the wrong answers are incorrect (when relevant)
   - Provides additional context or examples to deepen understanding
   - References key concepts from the material

Study Material:
${context}

Focus on the most important concepts, relationships, and applications. Make questions that require thinking and understanding, not just recall.

Return ONLY a JSON array in this exact format (no markdown, no code blocks, just pure JSON):
[
  {
    "question": "Well-formulated question that tests understanding?",
    "options": ["Option A (plausible distractor)", "Option B (correct answer)", "Option C (plausible distractor)", "Option D (plausible distractor)"],
    "correct_answer": 1,
    "explanation": "Detailed explanation of why B is correct, why other options are wrong, and additional educational context to help the student learn."
  }
]`;

    const response = await generateChat(prompt, systemPrompt, 0.7);

    // Parse the JSON response
    let mcqsData: Array<{
      question: string;
      options: string[];
      correct_answer: number;
      explanation: string;
    }>;
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        mcqsData = JSON.parse(jsonMatch[0]);
      } else {
        mcqsData = JSON.parse(response);
      }
    } catch (parseError) {
      console.error('Error parsing MCQs response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse generated MCQs' },
        { status: 500 }
      );
    }

    // Limit to requested count and validate format
    mcqsData = mcqsData.slice(0, count).map(mcq => ({
      question: mcq.question,
      options: mcq.options.slice(0, 4), // Ensure exactly 4 options
      correct_answer: Math.max(0, Math.min(3, mcq.correct_answer)), // Ensure valid index
      explanation: mcq.explanation,
    }));

    // Create MCQs in database
    const mcqs = await createMCQs(
      mcqsData.map(mcq => ({
        id: uuidv4(),
        document_id: documentId,
        question: mcq.question,
        options: mcq.options,
        correct_answer: mcq.correct_answer,
        explanation: mcq.explanation,
      })),
      user.id
    );

    return NextResponse.json({ mcqs });
  } catch (error) {
    console.error('Error generating MCQs:', error);
    return NextResponse.json(
      { error: 'Failed to generate MCQs' },
      { status: 500 }
    );
  }
}


