import { getSupabaseAdmin } from './supabase';
import type { Document, Flashcard, MCQ, ChatMessage, Note, UserNote } from '@/types';

// Document queries
export const getDocuments = async (userId: string): Promise<Document[]> => {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  return (data || []).map((doc: any) => ({
    ...doc,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  })) as Document[];
};

export const getDocument = async (id: string, userId: string): Promise<Document | null> => {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching document:', error);
    throw new Error(`Failed to fetch document: ${error.message}`);
  }

  return data as Document;
};

export const createDocument = async (
  doc: Omit<Document, 'created_at' | 'updated_at'>,
  userId: string
): Promise<Document> => {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('documents')
    .insert({
      id: doc.id,
      title: doc.title,
      filename: doc.filename,
      content_type: doc.content_type,
      user_id: userId,
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating document:', error);
    throw new Error(`Failed to create document: ${error.message}`);
  }

  return data as Document;
};

export const deleteDocument = async (id: string, userId: string): Promise<boolean> => {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting document:', error);
    throw new Error(`Failed to delete document: ${error.message}`);
  }

  return true;
};

// Flashcard queries
export const getFlashcardsByDocument = async (documentId: string, userId: string): Promise<Flashcard[]> => {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('document_id', documentId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching flashcards:', error);
    throw new Error(`Failed to fetch flashcards: ${error.message}`);
  }

  return (data || []) as Flashcard[];
};

export const createFlashcard = async (
  flashcard: Omit<Flashcard, 'created_at'>,
  userId: string
): Promise<Flashcard> => {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('flashcards')
    .insert({
      id: flashcard.id,
      document_id: flashcard.document_id,
      front: flashcard.front,
      back: flashcard.back,
      user_id: userId,
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating flashcard:', error);
    throw new Error(`Failed to create flashcard: ${error.message}`);
  }

  return data as Flashcard;
};

export const createFlashcards = async (
  flashcards: Omit<Flashcard, 'created_at'>[],
  userId: string
): Promise<Flashcard[]> => {
  const supabase = getSupabaseAdmin();
  
  const flashcardData = flashcards.map(card => ({
    id: card.id,
    document_id: card.document_id,
    front: card.front,
    back: card.back,
    user_id: userId,
  }));

  const { data, error } = await supabase
    .from('flashcards')
    .insert(flashcardData as any)
    .select();

  if (error) {
    console.error('Error creating flashcards:', error);
    throw new Error(`Failed to create flashcards: ${error.message}`);
  }

  return (data || []) as Flashcard[];
};

// MCQ queries
export const getMCQsByDocument = async (documentId: string, userId: string): Promise<MCQ[]> => {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('mcqs')
    .select('*')
    .eq('document_id', documentId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching MCQs:', error);
    throw new Error(`Failed to fetch MCQs: ${error.message}`);
  }

  return (data || []).map((mcq: any) => ({
    ...mcq,
    options: Array.isArray(mcq.options) ? mcq.options : JSON.parse(mcq.options as string),
  })) as MCQ[];
};

export const createMCQ = async (mcq: Omit<MCQ, 'created_at'>, userId: string): Promise<MCQ> => {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('mcqs')
    .insert({
      id: mcq.id,
      document_id: mcq.document_id,
      question: mcq.question,
      options: mcq.options,
      correct_answer: mcq.correct_answer,
      explanation: mcq.explanation,
      user_id: userId,
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating MCQ:', error);
    throw new Error(`Failed to create MCQ: ${error.message}`);
  }

  return {
    ...(data as any),
    options: Array.isArray((data as any).options) ? (data as any).options : JSON.parse((data as any).options as string),
  } as MCQ;
};

export const createMCQs = async (mcqs: Omit<MCQ, 'created_at'>[], userId: string): Promise<MCQ[]> => {
  const supabase = getSupabaseAdmin();
  
  const mcqData = mcqs.map(q => ({
    id: q.id,
    document_id: q.document_id,
    question: q.question,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    user_id: userId,
  }));

  const { data, error } = await supabase
    .from('mcqs')
    .insert(mcqData as any)
    .select();

  if (error) {
    console.error('Error creating MCQs:', error);
    throw new Error(`Failed to create MCQs: ${error.message}`);
  }

  return (data || []).map((mcq: any) => ({
    ...mcq,
    options: Array.isArray(mcq.options) ? mcq.options : JSON.parse(mcq.options as string),
  })) as MCQ[];
};

// Chat message queries
export const getChatMessagesByDocument = async (documentId: string, userId: string): Promise<ChatMessage[]> => {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('document_id', documentId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching chat messages:', error);
    throw new Error(`Failed to fetch chat messages: ${error.message}`);
  }

  return (data || []) as ChatMessage[];
};

export const createChatMessage = async (
  message: Omit<ChatMessage, 'created_at'>,
  userId: string
): Promise<ChatMessage> => {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      id: message.id,
      document_id: message.document_id,
      role: message.role,
      content: message.content,
      user_id: userId,
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating chat message:', error);
    throw new Error(`Failed to create chat message: ${error.message}`);
  }

  return data as ChatMessage;
};

// Note queries
export const getNoteByDocument = async (documentId: string, userId: string): Promise<Note | null> => {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('document_id', documentId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching note:', error);
    throw new Error(`Failed to fetch note: ${error.message}`);
  }

  return data as Note;
};

export const createNote = async (
  note: Omit<Note, 'created_at' | 'updated_at'>,
  userId: string
): Promise<Note> => {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('notes')
    .insert({
      id: note.id,
      document_id: note.document_id,
      content: note.content,
      user_id: userId,
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating note:', error);
    throw new Error(`Failed to create note: ${error.message}`);
  }

  return data as Note;
};

export const updateNote = async (
  documentId: string,
  content: string,
  userId: string
): Promise<Note> => {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await (supabase
    .from('notes') as any)
    .update({ content, updated_at: new Date().toISOString() })
    .eq('document_id', documentId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating note:', error);
    throw new Error(`Failed to update note: ${error.message}`);
  }

  return data as Note;
};

export const upsertNote = async (
  note: Omit<Note, 'created_at' | 'updated_at'>,
  userId: string
): Promise<Note> => {
  const existing = await getNoteByDocument(note.document_id, userId);
  if (existing) {
    return updateNote(note.document_id, note.content, userId);
  } else {
    return createNote(note, userId);
  }
};

// User note queries
export const getUserNotesByDocument = async (documentId: string, userId: string): Promise<UserNote[]> => {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('user_notes')
    .select('*')
    .eq('document_id', documentId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user notes:', error);
    throw new Error(`Failed to fetch user notes: ${error.message}`);
  }

  return (data || []) as UserNote[];
};

export const getUserNote = async (id: string, userId: string): Promise<UserNote | null> => {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('user_notes')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching user note:', error);
    throw new Error(`Failed to fetch user note: ${error.message}`);
  }

  return data as UserNote;
};

export const createUserNote = async (
  note: Omit<UserNote, 'created_at' | 'updated_at'>,
  userId: string
): Promise<UserNote> => {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('user_notes')
    .insert({
      id: note.id,
      document_id: note.document_id,
      title: note.title,
      content: note.content,
      user_id: userId,
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating user note:', error);
    throw new Error(`Failed to create user note: ${error.message}`);
  }

  return data as UserNote;
};

export const updateUserNote = async (
  id: string,
  title: string,
  content: string,
  userId: string
): Promise<UserNote> => {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await (supabase
    .from('user_notes') as any)
    .update({
      title,
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user note:', error);
    throw new Error(`Failed to update user note: ${error.message}`);
  }

  return data as UserNote;
};

export const deleteUserNote = async (id: string, userId: string): Promise<boolean> => {
  const supabase = getSupabaseAdmin();
  
  const { error } = await supabase
    .from('user_notes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting user note:', error);
    throw new Error(`Failed to delete user note: ${error.message}`);
  }

  return true;
};
