import { getDatabase, SearchResult, DatabaseError } from '../db';
import { generateEmbedding, embeddingToFloat32Array } from '../modules/embed';
import { config } from '../config';
import logger from '../utils/logger';

export interface FindSimilarDocumentsParams {
  text: string;
  top_k?: number;
  db_name?: string;
}

export interface FindSimilarDocumentsResult {
  results: SearchResult[];
}

export async function findSimilarDocuments(params: FindSimilarDocumentsParams): Promise<FindSimilarDocumentsResult> {
  const { text, top_k = config.defaultTopK, db_name } = params;
  
  if (!text || text.trim().length === 0) {
    throw new Error('Query text cannot be empty');
  }
  
  if (top_k <= 0 || top_k > 100) {
    throw new Error('top_k must be between 1 and 100');
  }
  
  const startTime = Date.now();
  logger.info({ queryLength: text.length, topK: top_k }, 'Starting similarity search');
  
  try {
    // Generate embedding for query text
    const embeddingResult = await generateEmbedding(text);
    const queryVector = embeddingToFloat32Array(embeddingResult.embedding);
    
    logger.info({ 
      queryTokens: embeddingResult.tokenCount 
    }, 'Query embedding generated');
    
    // Search for similar vectors
    const db = getDatabase(db_name);
    
    const searchStmt = db.prepare(`
      SELECT 
        c.rowid as chunk_id,
        cm.doc_id,
        cm.text,
        distance
      FROM chunks c
      JOIN chunk_metadata cm ON c.rowid = cm.chunk_id
      WHERE c.embedding MATCH ?
      ORDER BY distance
      LIMIT ?
    `);
    
    const queryBuffer = Buffer.from(queryVector.buffer);
    const searchResults = searchStmt.all(queryBuffer, top_k) as Array<{
      chunk_id: string;
      doc_id: string;
      text: string;
      distance: number;
    }>;
    
    // Convert distance to similarity score (cosine similarity)
    const results: SearchResult[] = searchResults.map(row => ({
      chunk_id: row.chunk_id,
      doc_id: row.doc_id,
      text: row.text,
      score: 1 - row.distance // Convert distance to similarity
    }));
    
    const duration = Date.now() - startTime;
    logger.info({ 
      queryLength: text.length, 
      resultCount: results.length, 
      duration,
      queryTokens: embeddingResult.tokenCount
    }, 'Similarity search completed');
    
    return {
      results
    };
    
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Failed to find similar documents');
    throw new DatabaseError(`Failed to find similar documents: ${(error as Error).message}`, error as Error);
  }
}