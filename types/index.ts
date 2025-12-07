export interface Document {
  id: string;
  title: string;
  filename: string | null;
  content_type: 'pdf' | 'text';
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: string;
  document_id: string;
  front: string;
  back: string;
  created_at: string;
}

export interface MCQ {
  id: string;
  document_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  document_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Note {
  id: string;
  document_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface UserNote {
  id: string;
  document_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}


