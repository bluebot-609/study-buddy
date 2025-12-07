<!-- 28f3bd7f-f90d-41ba-a3da-9a5c5d662965 0204497f-d93e-4cfc-b6a4-d8989f025d4b -->
# Backend Migration: ChromaDB + SQLite → Supabase + Gemini (with Image PDF Support)

## Overview

Complete migration to Supabase for Vercel hosting compatibility. Replace ChromaDB with Supabase pgvector, migrate all SQLite data to Supabase, replace Ollama embeddings with Gemini API, add Supabase email authentication, and add support for image PDFs using Gemini Vision API.

## Key Requirements

- **Vercel deployment**: SQLite not compatible (serverless), all data must be in Supabase
- **Vector storage**: Supabase with pgvector extension
- **Embeddings**: Gemini API (`text-embedding-004`) for text and images
- **Image processing**: Extract images from PDFs, analyze with Gemini Vision, generate embeddings
- **Chat**: Keep DeepSeek (confirmed by user), include image context in responses
- **Authentication**: Supabase email auth with RLS

## Implementation Steps

### 1. Install Dependencies

- Add `@supabase/supabase-js` for Supabase client
- Add `@supabase/ssr` for Next.js server-side auth
- Add `@google/generative-ai` for Gemini API (text + vision)
- Add `pdfjs-dist` or `pdf-lib` for extracting images from PDFs
- Add `sharp` for image processing (resize, format conversion)
- Remove `chromadb`, `chromadb-default-embed`, `better-sqlite3` packages
- Remove `@types/better-sqlite3` from devDependencies
- Update `package.json`

### 2. Environment Configuration

- Update `env.example` with:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for server-side operations)
- `GEMINI_API_KEY`
- Keep `DEEPSEEK_API_KEY`, `DEEPSEEK_API_URL`, `DEEPSEEK_MODEL`
- Remove `CHROMA_BASE_URL`, `OLLAMA_BASE_URL`, `OLLAMA_EMBEDDING_MODEL`

### 3. Create Supabase Database Schema

- Create migration SQL file (`supabase/migrations/001_initial_schema.sql`):
- Enable `pgvector` extension: `CREATE EXTENSION IF NOT EXISTS vector;`
- Create `documents` table with `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE`
- Create `document_chunks` table:
- `id UUID PRIMARY KEY`
- `document_id UUID REFERENCES documents(id) ON DELETE CASCADE`
- `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE`
- `chunk_index INTEGER`
- `text TEXT`
- `embedding vector(768)` (Gemini embedding dimension)
- `chunk_type TEXT CHECK(chunk_type IN ('text', 'image')) DEFAULT 'text'`
- `image_url TEXT` - Supabase Storage URL for image chunks
- `image_description TEXT` - Gemini Vision description of image content
- Create `flashcards`, `mcqs`, `chat_messages`, `notes`, `user_notes` tables (all with `user_id`)
- Add vector similarity index: `CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`
- Add RLS policies: Enable RLS on all tables, create policies for SELECT/INSERT/UPDATE/DELETE based on `user_id = auth.uid()`
- Set up Supabase Storage bucket `document-images` with RLS policies

### 4. Create Supabase Client Library (`lib/supabase.ts`)

- Initialize Supabase admin client (server-side) using service role key
- Create helper functions for vector operations:
- `addChunks(userId, documentId, chunks, embeddings, chunkTypes?, imageUrls?, imageDescriptions?)` - Insert chunks with user_id, support text and image chunks
- `queryChunks(userId, queryEmbedding, documentId?, nResults)` - Vector similarity search with RLS, returns chunks with type and image info
- `deleteDocumentChunks(userId, documentId)` - Remove chunks with ownership check
- `uploadImageToStorage(userId, documentId, imageBuffer, filename): Promise<string>` - Upload image to Supabase Storage, return URL
- Use `pgvector` cosine similarity: `1 - (embedding <=> query_embedding)`
- Handle Supabase errors and response types
- Update return types to include `chunk_type`, `image_url`, `image_description` fields

### 5. Create Gemini Embeddings Library (`lib/gemini.ts`)

- Replace `generateEmbedding()` function
- Use `@google/generative-ai` with `text-embedding-004` model
- Handle API errors, rate limiting, and retries
- Match function signature: `generateEmbedding(text: string): Promise<number[]>`
- Return 768-dimensional vectors
- Add `generateImageEmbedding(imageBase64: string, mimeType: string): Promise<number[]>` for image embeddings
- Add `analyzeImage(imageBase64: string, mimeType: string, prompt?: string): Promise<string>` for image OCR/description using Gemini Vision API

### 6. Create PDF Image Extraction Library (`lib/pdf-images.ts`)

- Extract images from PDF using `pdfjs-dist` or `pdf-lib`
- Function: `extractImagesFromPDF(buffer: Buffer): Promise<Array<{data: Buffer, width: number, height: number, format: string}>>`
- Process images: convert to base64, resize if needed using `sharp`
- Return array of image data ready for Gemini Vision processing

### 7. Migrate Database Layer (`lib/db.ts`)

- **Complete rewrite**: Remove all SQLite code
- Initialize Supabase admin client (service role for server-side)
- Convert all functions to accept `userId` parameter:
- `getDocuments(userId)` - Filter by user_id
- `getDocument(id, userId)` - Verify ownership
- `createDocument(doc, userId)` - Include user_id
- `deleteDocument(id, userId)` - Verify ownership, cascade deletes chunks
- All other functions similarly updated
- Use Supabase query builder: `.eq()`, `.insert()`, `.update()`, `.delete()`, `.select()`
- Handle Supabase response types and errors
- Remove all file system operations and SQLite initialization

### 8. Add Authentication Library (`lib/auth.ts`)

- Create `getServerUser()` - Extract user from Next.js request headers/cookies
- Create `requireAuth()` - Middleware helper to protect API routes
- Use `@supabase/ssr` for server-side auth
- Handle JWT tokens and session management

### 9. Update PDF Processing (`lib/pdf.ts`)

- Keep existing `extractTextFromPDF()` function
- Add new function: `processPDFWithImages(buffer: Buffer): Promise<{text: string, images: Array<{data: Buffer, format: string}>}>`
- Extract both text and images from PDF
- Return structured data for processing

### 10. Update API Routes

All routes need auth and updated imports:

- **`app/api/documents/route.ts`**: 
- Add `requireAuth()` check
- Replace `generateEmbedding` import: `lib/deepseek` → `lib/gemini`
- Replace `addChunks` import: `lib/chroma` → `lib/supabase`
- Update PDF processing:
- Extract both text and images from PDF
- For text: chunk and generate embeddings (existing flow)
- For images: analyze with Gemini Vision, generate embeddings, upload to Supabase Storage
- Create image chunks alongside text chunks with `chunk_type='image'`
- Pass `userId` to `createDocument()` and `addChunks()`
- Handle mixed content: text chunks + image chunks with descriptions

- **`app/api/documents/[id]/chat/route.ts`**:
- Add `requireAuth()` check
- Replace `generateEmbedding` import: `lib/deepseek` → `lib/gemini`
- Replace `queryChunks` import: `lib/chroma` → `lib/supabase`
- Pass `userId` to all database operations
- Verify document ownership before chat
- Update context building:
- Include image descriptions when image chunks are retrieved
- Include image URLs in response for frontend display
- Format context to distinguish text vs image content

- **`app/api/notes/generate/route.ts`**:
- Add `requireAuth()` check
- Replace imports to `lib/gemini` and `lib/supabase`
- Pass `userId` to all operations
- Include image context when generating notes

- **`app/api/flashcards/generate/route.ts`**:
- Add `requireAuth()` check
- Replace imports to `lib/gemini` and `lib/supabase`
- Pass `userId` to all operations
- Include image context when generating flashcards

- **`app/api/mcqs/generate/route.ts`**:
- Add `requireAuth()` check
- Replace imports to `lib/gemini` and `lib/supabase`
- Pass `userId` to all operations
- Include image context when generating MCQs

### 11. Update Frontend Authentication

- Install `@supabase/ssr` for client-side
- Create `lib/supabase-client.ts` for browser client
- Add login/signup pages (`app/auth/login/page.tsx`, `app/auth/signup/page.tsx`)
- Create auth context/provider (`app/providers/auth-provider.tsx`)
- Protect document routes - redirect to login if not authenticated
- Update layout to include auth provider

### 12. Update Chat UI

- Display images in chat responses when image URLs are provided
- Show image thumbnails or full images based on context
- Update chat message component to handle image content

### 13. Cleanup

- Remove `lib/chroma.ts`
- Remove `lib/ollama.ts`
- Update `lib/deepseek.ts` - Remove `generateEmbedding()` function, keep only `generateChat()`
- Remove `data/` directory and SQLite references
- Remove `chroma_data/` directory references
- Update any imports that reference removed files

## Files to Create

- `lib/supabase.ts` - Supabase client and vector operations
- `lib/gemini.ts` - Gemini embeddings and vision
- `lib/auth.ts` - Auth helpers
- `lib/supabase-client.ts` - Browser Supabase client
- `lib/pdf-images.ts` - Extract images from PDFs
- `supabase/migrations/001_initial_schema.sql` - Database schema
- `app/auth/login/page.tsx` - Login page
- `app/auth/signup/page.tsx` - Signup page
- `app/providers/auth-provider.tsx` - Auth context provider

## Files to Modify

- `package.json` - Update dependencies, add image processing libraries
- `env.example` - Update environment variables
- `lib/db.ts` - Complete rewrite for Supabase
- `lib/deepseek.ts` - Remove embedding function
- `lib/pdf.ts` - Add image extraction support
- `app/api/documents/route.ts` - Add auth, update imports, add image processing pipeline
- `app/api/documents/[id]/chat/route.ts` - Add auth, update imports, include image context
- `app/api/notes/generate/route.ts` - Add auth, update imports
- `app/api/flashcards/generate/route.ts` - Add auth, update imports
- `app/api/mcqs/generate/route.ts` - Add auth, update imports
- `app/layout.tsx` - Add auth provider
- All document pages - Add auth checks
- Chat UI components - Display images when referenced

## Files to Remove

- `lib/chroma.ts`
- `lib/ollama.ts`
- `data/study-buddy.db` (after migration if needed)
- `chroma_data/` directory

## Image PDF Processing Flow

1. **Extract**: Use `pdfjs-dist` or `pdf-lib` to extract images from PDF
2. **Process**: Convert images to base64, resize if needed with `sharp`
3. **Analyze**: Use Gemini Vision API to get text description of each image
4. **Embed**: Generate embedding for image description using Gemini
5. **Store**: Upload image to Supabase Storage, store chunk with:

- `text`: Image description from Gemini Vision
- `embedding`: Generated embedding vector
- `image_url`: Supabase Storage URL
- `chunk_type`: 'image'

6. **Query**: During chat, similarity search retrieves both text and image chunks
7. **Context**: Include image descriptions and URLs in chat context
8. **Display**: Frontend shows images when referenced in chat responses

## Database Migration Notes

- Create Supabase project at supabase.com
- Enable pgvector extension in Supabase dashboard (SQL Editor)
- Run migration SQL to create schema
- Set up Supabase Storage bucket `document-images` with RLS policies
- Configure RLS policies for all tables
- Test RLS policies ensure users can only access their own data
- Optional: Create migration script to transfer existing SQLite data (if any)
- Vercel: Set all environment variables in Vercel dashboard
- Vector dimension: Gemini `text-embedding-004` produces 768-dimensional vectors (works for both text and image embeddings)

## Vercel Deployment Considerations

- All database operations must be async (Supabase client)
- No file system writes (all in Supabase Storage)
- Environment variables must be set in Vercel dashboard
- Supabase connection pooling for serverless functions
- Image processing may increase function execution time - consider timeout limits
- Large PDFs with many images may need chunked processing