import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDocuments, createDocument } from '@/lib/db';
import { extractTextFromPDF } from '@/lib/pdf';
import { chunkText } from '@/lib/chunking';
import { generateEmbedding } from '@/lib/gemini';
import { addChunks } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

// Increase body size limit for large documents
export const maxDuration = 300; // 5 minutes max
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const documents = await getDocuments(user.id);
    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const text = formData.get('text') as string | null;
    const title = (formData.get('title') as string) || 'Untitled Document';

    let extractedText: string;
    let contentType: 'pdf' | 'text';
    let filename: string | null = null;

    if (file) {
      // Check file size (25MB maximum)
      const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File size exceeds 25MB limit. Maximum file size is 25MB. For best performance, we recommend files between 10-15MB.' },
          { status: 400 }
        );
      }

      // Handle PDF upload
      const buffer = Buffer.from(await file.arrayBuffer());
      extractedText = await extractTextFromPDF(buffer);
      contentType = 'pdf';
      filename = file.name;
    } else if (text) {
      // Handle text paste
      extractedText = text;
      contentType = 'text';
    } else {
      return NextResponse.json(
        { error: 'Either file or text must be provided' },
        { status: 400 }
      );
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text content found' },
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

    // Create document in database
    const documentId = uuidv4();
    const document = await createDocument({
      id: documentId,
      title: title || filename || 'Untitled Document',
      filename,
      content_type: contentType,
    }, user.id);

    // Chunk the text (larger chunks for better context, but still manageable)
    const chunks = chunkText(extractedText, 2000, 400);

    // Generate embeddings for all chunks (batch processing for better performance)
    const embeddings: number[][] = [];
    
    // Process in batches to avoid overwhelming Gemini API
    const batchSize = 5;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map(chunk => generateEmbedding(chunk.text))
      );
      embeddings.push(...batchEmbeddings);
    }

    // Store chunks in Supabase
    await addChunks(user.id, documentId, chunks, embeddings);

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}

