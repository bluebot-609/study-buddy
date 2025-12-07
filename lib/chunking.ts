/**
 * Split text into chunks with overlap for better context retrieval
 */
export function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): Array<{ text: string; chunkIndex: number }> {
  const chunks: Array<{ text: string; chunkIndex: number }> = [];
  
  // Split by sentences first for better chunking
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  let currentChunk = '';
  let chunkIndex = 0;
  
  for (const sentence of sentences) {
    // If adding this sentence would exceed chunk size
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        text: currentChunk.trim(),
        chunkIndex: chunkIndex++,
      });
      
      // Start new chunk with overlap (last N characters of previous chunk)
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + ' ' + sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  // Add remaining chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      chunkIndex: chunkIndex,
    });
  }
  
  return chunks;
}


