import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDocument } from '@/lib/db';
import { getChatMessagesByDocument, createChatMessage } from '@/lib/db';
import { generateChat } from '@/lib/deepseek';
import { generateEmbedding } from '@/lib/gemini';
import { queryChunks } from '@/lib/supabase';
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
    const messages = await getChatMessagesByDocument(id, user.id);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
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
    const document = await getDocument(id, user.id);
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get recent conversation history for context (last 6 messages = 3 exchanges)
    const allMessages = await getChatMessagesByDocument(id, user.id);
    const recentHistory = allMessages.slice(-6).map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Save user message
    const userMessageId = uuidv4();
    await createChatMessage({
      id: userMessageId,
      document_id: id,
      role: 'user',
      content: message,
    }, user.id);

    // Generate embedding for the question
    const questionEmbedding = await generateEmbedding(message);

    // Retrieve relevant chunks from Supabase (filtered by documentId and user)
    const relevantChunks = await queryChunks(user.id, questionEmbedding, id, 5);

    // Build context from chunks
    const context = relevantChunks
      .map(chunk => chunk.text)
      .join('\n\n');

    // Build prompt with context - requesting detailed, thoughtful explanations
    const systemPrompt = `You are an expert tutor helping a student understand their study material. Provide clear, detailed, and well-explained answers. 

IMPORTANT: Maintain conversation context - if the student asks a follow-up question or refers to previous messages, use the conversation history to understand what they're referring to.

Structure your responses with:
1. A direct answer to the question
2. Detailed explanation with relevant context
3. Key concepts or principles involved
4. Examples or applications when helpful
5. Any related information that would deepen understanding

Be thorough but concise. Use clear language and break down complex ideas into understandable parts.`;
    
    // Build conversation context summary if there's history
    let conversationContext = '';
    if (recentHistory.length > 0) {
      conversationContext = `\n\nPrevious Conversation Context:
${recentHistory.map(msg => `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}`).join('\n\n')}`;
    }
    
    const prompt = `Based on the following context from the study document${recentHistory.length > 0 ? ' and the conversation history' : ''}, provide a comprehensive and well-explained answer to the student's question.

Context from Document:
${context}${conversationContext}

Student's Current Question: ${message}

${recentHistory.length > 0 ? 'Note: This may be a follow-up question. Use the conversation history to understand what the student is referring to if they mention previous topics or ask for clarification.' : ''}

Please provide a detailed, thoughtful answer that helps the student fully understand the topic. Include explanations, key concepts, and relevant details from the context.`;

    // Generate answer using DeepSeek with system prompt and conversation history for context
    const answer = await generateChat(prompt, systemPrompt, 0.7, recentHistory);

    // Save assistant response
    const assistantMessageId = uuidv4();
    await createChatMessage({
      id: assistantMessageId,
      document_id: id,
      role: 'assistant',
      content: answer,
    }, user.id);

    return NextResponse.json({
      message: answer,
      userMessage: {
        id: userMessageId,
        role: 'user',
        content: message,
      },
      assistantMessage: {
        id: assistantMessageId,
        role: 'assistant',
        content: answer,
      },
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

