const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const EMBEDDING_MODEL = 'text-embedding-004';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Generate embeddings using Gemini API
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required. Please set it in your .env.local file.');
    }

    const response = await fetch(
      `${GEMINI_API_URL}/models/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: {
            parts: [{ text }],
          },
          taskType: 'RETRIEVAL_DOCUMENT',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Gemini API error: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const embedding = data.embedding?.values;

    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      throw new Error('Failed to generate embedding: empty or invalid response');
    }

    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    if (error instanceof Error) {
      throw new Error(`Gemini API error: ${error.message}`);
    }
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Check if Gemini API is available
 */
export async function checkGeminiConnection(): Promise<boolean> {
  try {
    if (!GEMINI_API_KEY) return false;
    // Simple check - try to generate a test embedding
    await generateEmbedding('test');
    return true;
  } catch {
    return false;
  }
}

