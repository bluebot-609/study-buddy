import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDocument } from '@/lib/db';
import { createFlashcards } from '@/lib/db';
import { queryChunks } from '@/lib/supabase';
import { generateEmbedding } from '@/lib/gemini';
import { generateChat } from '@/lib/deepseek';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();

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

    // Get all chunks from the document for comprehensive coverage
    // Use multiple queries to get diverse chunks covering all topics
    const queryTerms = [
      'key concepts and definitions',
      'important topics and themes',
      'main ideas and principles',
      'relationships and applications',
      'examples and case studies'
    ];

    const allChunks: Array<{ text: string; documentId: string; chunkIndex: number; distance: number }> = [];
    const seenChunkIndices = new Set<number>();

    // Get chunks from different query perspectives to ensure comprehensive coverage
    for (const queryTerm of queryTerms) {
      const queryEmbedding = await generateEmbedding(queryTerm);
      const chunks = await queryChunks(user.id, queryEmbedding, documentId, 10);
      
      for (const chunk of chunks) {
        if (!seenChunkIndices.has(chunk.chunkIndex)) {
          allChunks.push(chunk);
          seenChunkIndices.add(chunk.chunkIndex);
        }
      }
    }

    // If we still don't have enough, get more chunks
    if (allChunks.length < 20) {
      const genericEmbedding = await generateEmbedding('study material content');
      const additionalChunks = await queryChunks(user.id, genericEmbedding, documentId, 30);
      
      for (const chunk of additionalChunks) {
        if (!seenChunkIndices.has(chunk.chunkIndex)) {
          allChunks.push(chunk);
          seenChunkIndices.add(chunk.chunkIndex);
        }
      }
    }

    if (allChunks.length === 0) {
      return NextResponse.json(
        { error: 'No content found in document' },
        { status: 400 }
      );
    }

    // Combine all chunks into context
    const context = allChunks.map(chunk => chunk.text).join('\n\n');

    // Generate comprehensive, topic-wise flashcards
    const systemPrompt = `You are an expert educational content creator. Create comprehensive, topic-wise flashcards that cover ALL important concepts from the study material. 
- Analyze the material to identify all major topics, subtopics, and key concepts
- Create flashcards for each important topic, not a fixed number
- Questions should test understanding of key concepts, not just recall
- Answers should be clear, detailed, and educational
- Cover all important concepts, definitions, relationships, and applications
- Organize flashcards by topics to ensure comprehensive coverage
- The number of flashcards should match the breadth and depth of the content`;

    const prompt = `Based on the following study material, analyze ALL topics and concepts, then generate comprehensive flashcards covering EVERY important topic. 

IMPORTANT: 
- Do NOT limit yourself to a specific number of flashcards
- Generate flashcards for ALL major topics and key concepts you find
- Create multiple flashcards per topic if needed to cover it thoroughly
- Ensure comprehensive coverage - no important topics should be missed
- The number of flashcards should reflect the actual content breadth

Each flashcard should have:
- Front: A clear, well-formulated question that tests understanding
- Back: A detailed, educational answer that explains the concept thoroughly

Study Material:
${context}

Analyze the material comprehensively and create flashcards for all important topics. Return a JSON array with all flashcards covering every significant concept.

Return ONLY a JSON array in this exact format (no markdown, no code blocks, just pure JSON):
[
  {"front": "What is the key concept X?", "back": "Detailed explanation of X with context and examples"},
  {"front": "How does Y relate to Z?", "back": "Comprehensive explanation of the relationship"},
  {"front": "What are the main characteristics of A?", "back": "Detailed explanation of characteristics"},
  ...
]`;

    const response = await generateChat(prompt, systemPrompt, 0.7);

    // Parse the JSON response
    let flashcardsData: Array<{ front: string; back: string }>;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        flashcardsData = JSON.parse(jsonMatch[0]);
      } else {
        flashcardsData = JSON.parse(response);
      }
    } catch (parseError) {
      console.error('Error parsing flashcards response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse generated flashcards' },
        { status: 500 }
      );
    }

    // Use all generated flashcards (no limit)

    // Create flashcards in database
    const flashcards = await createFlashcards(
      flashcardsData.map((fc, index) => ({
        id: uuidv4(),
        document_id: documentId,
        front: fc.front,
        back: fc.back,
      })),
      user.id
    );

    return NextResponse.json({ flashcards });
  } catch (error) {
    console.error('Error generating flashcards:', error);
    return NextResponse.json(
      { error: 'Failed to generate flashcards' },
      { status: 500 }
    );
  }
}


