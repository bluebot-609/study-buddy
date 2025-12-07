import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDocument } from '@/lib/db';
import { upsertNote } from '@/lib/db';
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

    // Get comprehensive chunks from the document
    const queryTerms = [
      'key concepts and main ideas',
      'important topics and themes',
      'definitions and explanations',
      'relationships and connections',
      'examples and applications'
    ];

    const allChunks: Array<{ text: string; documentId: string; chunkIndex: number; distance: number }> = [];
    const seenChunkIndices = new Set<number>();

    // Get chunks from different query perspectives
    for (const queryTerm of queryTerms) {
      const queryEmbedding = await generateEmbedding(queryTerm);
      const chunks = await queryChunks(user.id, queryEmbedding, documentId, 15);
      
      for (const chunk of chunks) {
        if (!seenChunkIndices.has(chunk.chunkIndex)) {
          allChunks.push(chunk);
          seenChunkIndices.add(chunk.chunkIndex);
        }
      }
    }

    // Get additional chunks if needed
    if (allChunks.length < 30) {
      const genericEmbedding = await generateEmbedding('study material content');
      const additionalChunks = await queryChunks(user.id, genericEmbedding, documentId, 50);
      
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

    // Generate concise, well-organized notes
    const systemPrompt = `You are an expert note-taker. Create short, concise, and well-organized notes that summarize the key points from study material. 
- Focus on the most important concepts, definitions, and relationships
- Use clear headings and bullet points for organization
- Keep notes concise but comprehensive
- Organize by topics/sections
- Include key definitions and important points
- Make it easy to review and reference later`;

    const prompt = `Based on the following study material, create short, concise, and well-organized notes for future reference.

Requirements:
- Keep notes SHORT and CONCISE - focus on key points only
- Organize by topics with clear headings
- Use bullet points and lists for clarity
- Include important definitions and concepts
- Focus on essential information that's worth remembering
- Make it easy to quickly review and reference

Study Material:
${context}

Create comprehensive but concise notes that capture all the important information from this material. Format with clear headings, bullet points, and organized sections.

Return the notes in markdown format with proper headings, bullet points, and organization.`;
    
    const notesContent = await generateChat(prompt, systemPrompt, 0.7);

    // Store notes in database
    const note = await upsertNote({
      id: uuidv4(),
      document_id: documentId,
      content: notesContent,
    }, user.id);

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error generating notes:', error);
    return NextResponse.json(
      { error: 'Failed to generate notes' },
      { status: 500 }
    );
  }
}

