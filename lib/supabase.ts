import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

/**
 * Get or create Supabase admin client (server-side only)
 */
export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. Please set them in your .env.local file.');
    }
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdmin;
}

export interface Chunk {
  text: string;
  chunkIndex: number;
}

export interface ChunkResult {
  text: string;
  documentId: string;
  chunkIndex: number;
  distance: number;
}

/**
 * Add document chunks to Supabase with embeddings
 */
export async function addChunks(
  userId: string,
  documentId: string,
  chunks: Chunk[],
  embeddings: number[][]
): Promise<void> {
  const supabase = getSupabaseAdmin();

  if (chunks.length !== embeddings.length) {
    throw new Error('Chunks and embeddings arrays must have the same length');
  }

  const chunkData = chunks.map((chunk, index) => ({
    document_id: documentId,
    user_id: userId,
    chunk_index: chunk.chunkIndex,
    text: chunk.text,
    embedding: embeddings[index],
  }));

  const { error } = await supabase
    .from('document_chunks')
    .insert(chunkData as any);

  if (error) {
    console.error('Error adding chunks:', error);
    throw new Error(`Failed to add chunks: ${error.message}`);
  }
}

/**
 * Query similar chunks for RAG using vector similarity search
 * Uses PostgreSQL's pgvector extension for optimized database-level similarity calculation
 */
export async function queryChunks(
  userId: string,
  queryEmbedding: number[],
  documentId?: string,
  nResults: number = 5
): Promise<ChunkResult[]> {
  const supabase = getSupabaseAdmin();

  try {
    // Try to use the optimized database function first
    const { data, error } = await (supabase.rpc as any)('match_document_chunks', {
      query_embedding: queryEmbedding,
      match_count: nResults,
      user_id_filter: userId,
      document_id_filter: documentId || null,
    });

    if (error) {
      // If RPC function doesn't exist or fails, fall back to JavaScript calculation
      console.warn('RPC function failed, falling back to JavaScript calculation:', error.message);
      return await queryChunksFallback(userId, queryEmbedding, documentId, nResults);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Convert database results to ChunkResult format
    return data.map((item: any) => ({
      text: item.text,
      documentId: item.document_id,
      chunkIndex: item.chunk_index,
      distance: 1 - item.similarity, // Convert similarity to distance
    }));
  } catch (error: any) {
    // If RPC call fails completely, fall back to JavaScript calculation
    console.warn('RPC call failed, falling back to JavaScript calculation:', error.message);
    return await queryChunksFallback(userId, queryEmbedding, documentId, nResults);
  }
}

/**
 * Fallback method: Calculate similarity in JavaScript
 * Used when the database function is not available
 */
async function queryChunksFallback(
  userId: string,
  queryEmbedding: number[],
  documentId?: string,
  nResults: number = 5
): Promise<ChunkResult[]> {
  const supabase = getSupabaseAdmin();

  let supabaseQuery = supabase
    .from('document_chunks')
    .select('text, document_id, chunk_index, embedding')
    .eq('user_id', userId);
  
  if (documentId) {
    supabaseQuery = supabaseQuery.eq('document_id', documentId);
  }
  
  // Get more chunks than needed to ensure good results after similarity calculation
  const { data, error } = await supabaseQuery.limit(nResults * 3);
  
  if (error) {
    console.error('Error querying chunks:', error);
    throw new Error(`Failed to query chunks: ${error.message}`);
  }
  
  if (!data || data.length === 0) {
    return [];
  }

  // Calculate cosine similarity manually
  const results: Array<ChunkResult & { similarity: number }> = data
    .map((chunk: any) => {
      const embedding = chunk.embedding as number[];
      if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
        return null;
      }

      // Cosine similarity: dot product / (magnitude1 * magnitude2)
      const dotProduct = queryEmbedding.reduce((sum, val, i) => sum + val * embedding[i], 0);
      const magnitude1 = Math.sqrt(queryEmbedding.reduce((sum, val) => sum + val * val, 0));
      const magnitude2 = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      const similarity = dotProduct / (magnitude1 * magnitude2);
      const distance = 1 - similarity; // Convert similarity to distance

      return {
        text: chunk.text,
        documentId: chunk.document_id,
        chunkIndex: chunk.chunk_index,
        distance,
        similarity,
      };
    })
    .filter((r): r is ChunkResult & { similarity: number } => r !== null);

  // Sort by similarity (highest first) and take top nResults
  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, nResults).map(({ similarity, ...rest }) => rest);
}

/**
 * Delete all chunks for a document
 */
export async function deleteDocumentChunks(userId: string, documentId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('document_chunks')
    .delete()
    .eq('document_id', documentId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting document chunks:', error);
    throw new Error(`Failed to delete document chunks: ${error.message}`);
  }
}

