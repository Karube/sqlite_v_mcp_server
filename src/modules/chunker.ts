import { config } from '../config';

export interface TextChunk {
  text: string;
  index: number;
}

export function chunkText(text: string): TextChunk[] {
  // Remove excessive whitespace and normalize
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  
  if (normalizedText.length === 0) {
    return [];
  }
  
  if (normalizedText.length <= config.chunkSize) {
    return [{ text: normalizedText, index: 0 }];
  }
  
  const chunks: TextChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;
  
  while (startIndex < normalizedText.length) {
    let endIndex = startIndex + config.chunkSize;
    
    // If we're not at the end of the text, try to break at a sentence or word boundary
    if (endIndex < normalizedText.length) {
      // First try to break at sentence boundaries (periods, exclamation marks, question marks)
      const sentenceBreak = normalizedText.lastIndexOf('。', endIndex);
      const questionBreak = normalizedText.lastIndexOf('？', endIndex);
      const exclamationBreak = normalizedText.lastIndexOf('！', endIndex);
      const periodBreak = normalizedText.lastIndexOf('.', endIndex);
      
      const sentenceBoundary = Math.max(sentenceBreak, questionBreak, exclamationBreak, periodBreak);
      
      if (sentenceBoundary > startIndex) {
        endIndex = sentenceBoundary + 1;
      } else {
        // Fall back to word boundaries (spaces)
        const wordBreak = normalizedText.lastIndexOf(' ', endIndex);
        if (wordBreak > startIndex) {
          endIndex = wordBreak;
        }
      }
    }
    
    const chunkText = normalizedText.slice(startIndex, endIndex).trim();
    if (chunkText.length > 0) {
      chunks.push({
        text: chunkText,
        index: chunkIndex++
      });
    }
    
    // Move start index forward, accounting for overlap
    if (endIndex >= normalizedText.length) {
      break;
    }
    
    startIndex = Math.max(startIndex + 1, endIndex - config.chunkOverlap);
  }
  
  return chunks;
}