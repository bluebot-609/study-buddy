# Study Buddy

A personal AI study companion app that helps you learn from your documents using DeepSeek AI and vector databases.

## Features

- **Document Upload**: Upload PDFs or paste text to create study documents
- **AI Tutor**: Ask questions about your documents and get detailed, well-explained contextual answers using RAG
- **Flashcards**: Auto-generate high-quality flashcards with thoughtful questions and comprehensive answers
- **MCQs**: Generate multiple choice questions with detailed explanations
- **Persistent Storage**: All your documents, flashcards, MCQs, and chat history are saved locally

## Prerequisites

Before running the app, make sure you have:

1. **Node.js 18+** installed
2. **DeepSeek API Key** - Get one from [DeepSeek Platform](https://platform.deepseek.com/)
3. **Gemini API Key** - Get one from [Google AI Studio](https://makersuite.google.com/app/apikey) (for embeddings)
4. **Supabase Account** - Sign up at [supabase.com](https://supabase.com) for database and vector storage

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the migration file from `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor
   - Get your project URL and API keys from the project settings

3. Create a `.env.local` file in the root directory:
```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_API_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat

SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

GEMINI_API_KEY=your_gemini_api_key
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Required environment variables (create `.env.local` file):

- `DEEPSEEK_API_KEY` - Your DeepSeek API key (required)
- `DEEPSEEK_API_URL` - DeepSeek API endpoint (default: https://api.deepseek.com/v1)
- `DEEPSEEK_MODEL` - DeepSeek model to use (default: deepseek-chat)
- `SUPABASE_URL` - Your Supabase project URL (required)
- `SUPABASE_ANON_KEY` - Your Supabase anonymous/public key (required)
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (required)
- `NEXT_PUBLIC_SUPABASE_URL` - Same as SUPABASE_URL (required for client-side)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Same as SUPABASE_ANON_KEY (required for client-side)
- `GEMINI_API_KEY` - Your Gemini API key for embeddings (required)

## Usage

1. **Create a Document**:
   - Go to Documents → New Document
   - Upload a PDF or paste text
   - The document will be processed and stored

2. **Chat with AI Tutor**:
   - Open a document
   - Click on "Tutor"
   - Ask questions about the document

3. **Generate Flashcards**:
   - Open a document
   - Click on "Flashcards"
   - Click "Generate Flashcards"
   - Review flashcards with flip animation

4. **Practice with MCQs**:
   - Open a document
   - Click on "MCQs"
   - Click "Generate MCQs"
   - Answer questions and see explanations

## Data Storage

- **Supabase**: Cloud PostgreSQL database storing all documents, flashcards, MCQs, chat history, and document chunks with vector embeddings
- All data is stored securely in your Supabase project

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL with pgvector extension)
- **Vector DB**: Supabase (pgvector for semantic search and RAG)
- **LLM**: DeepSeek API (for thoughtful, well-explained responses)
- **Embeddings**: Google Gemini API (text-embedding-004)
- **PDF Processing**: pdf-parse

## Troubleshooting

### DeepSeek API Issues
- Verify your API key is correct in `.env.local`
- Check your DeepSeek account balance and rate limits
- Ensure `DEEPSEEK_API_KEY` is set correctly

### Gemini API Issues
- Verify your API key is correct in `.env.local`
- Check your Google Cloud account and API quotas
- Ensure `GEMINI_API_KEY` is set correctly
- Verify the key has access to the Generative Language API

### Supabase Connection Issues
- Verify your Supabase project URL and keys are correct in `.env.local`
- Check that you've run the migration SQL in your Supabase SQL editor
- Ensure the `match_document_chunks` function exists (created by migration)
- Check Supabase project status and any service limits

### API Key Errors
- Make sure all required API keys are set in `.env.local`
- Restart the dev server after adding/changing environment variables
- Check the console for specific error messages
- Verify all Supabase environment variables are correctly set


