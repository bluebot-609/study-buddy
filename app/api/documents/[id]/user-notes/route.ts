import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDocument } from '@/lib/db';
import { getUserNotesByDocument, createUserNote, updateUserNote, deleteUserNote, getUserNote } from '@/lib/db';
import { generateChat } from '@/lib/deepseek';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userNotes = await getUserNotesByDocument(id, user.id);
    
    return NextResponse.json({ userNotes });
  } catch (error) {
    console.error('Error fetching user notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user notes' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
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

    let formattedContent = content.trim();

    // Detect if content looks like a table (has tab-separated or multiple columns)
    const lines = formattedContent.split('\n');
    const hasTableStructure = lines.some(line => {
      // Check for tab-separated values, multiple spaces, or pipe-like structure
      const tabCount = (line.match(/\t/g) || []).length;
      const multipleSpaces = line.match(/\s{2,}/g);
      return tabCount >= 2 || (multipleSpaces && multipleSpaces.length >= 2);
    });

    // If it looks like a table, format it properly using AI
    if (hasTableStructure) {
      try {
        const tableSystemPrompt = 'You are a helpful assistant that converts text selections into properly formatted markdown tables.';
        const tablePrompt = `Convert the following text into a properly formatted markdown table. Preserve all data and structure. Return ONLY the markdown table, nothing else.

Text to convert:
${formattedContent}`;

        const formattedTable = await generateChat(tablePrompt, tableSystemPrompt, 0.3);
        if (formattedTable && formattedTable.trim().length > 0) {
          formattedContent = formattedTable.trim();
        }
      } catch (error) {
        console.error('Error formatting table:', error);
        // If table formatting fails, use original content
      }
    }

    // Check if there's an existing note for this document
    const existingNotes = await getUserNotesByDocument(documentId, user.id);
    const existingNote = existingNotes.length > 0 ? existingNotes[0] : null;

    let userNote: any;

    if (existingNote) {
      // Append to existing note with a separator
      const timestamp = new Date().toLocaleString();
      const separator = `\n\n---\n\n*Added: ${timestamp}*\n\n`;
      const updatedContent = existingNote.content + separator + formattedContent;
      
      // Update existing note
      userNote = await updateUserNote(existingNote.id, existingNote.title, updatedContent, user.id);
    } else {
      // Generate title using AI for new note
      const systemPrompt = 'You are a helpful assistant that creates brief, descriptive titles for study notes.';
      const prompt = `Create a brief, descriptive title (maximum 60 characters) for this note content. Return only the title, nothing else.

Content:
${formattedContent.substring(0, 500)}`;

      const generatedTitle = await generateChat(prompt, systemPrompt, 0.5);
      const title = generatedTitle.trim().slice(0, 60) || 'My Notes';

      // Create new user note
      userNote = await createUserNote({
        id: uuidv4(),
        document_id: documentId,
        title,
        content: formattedContent,
      }, user.id);
    }

    return NextResponse.json({ userNote });
  } catch (error) {
    console.error('Error creating user note:', error);
    return NextResponse.json(
      { error: 'Failed to create user note' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const { id, title, content } = await request.json();

    if (!id || !title || !content) {
      return NextResponse.json(
        { error: 'ID, title, and content are required' },
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

    // Verify note exists and belongs to document and user
    const existingNote = await getUserNote(id, user.id);
    if (!existingNote || existingNote.document_id !== documentId) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Update user note
    const userNote = await updateUserNote(id, title.trim(), content.trim(), user.id);

    return NextResponse.json({ userNote });
  } catch (error) {
    console.error('Error updating user note:', error);
    return NextResponse.json(
      { error: 'Failed to update user note' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('id');

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
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

    // Verify note exists and belongs to document and user
    const existingNote = await getUserNote(noteId, user.id);
    if (!existingNote || existingNote.document_id !== documentId) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Delete user note
    const deleted = await deleteUserNote(noteId, user.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete note' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user note:', error);
    return NextResponse.json(
      { error: 'Failed to delete user note' },
      { status: 500 }
    );
  }
}

