import { getDatabase, ChunkRow, DatabaseError } from '../db';
import { chunkText } from '../modules/chunker';
import { generateEmbeddings, embeddingToFloat32Array } from '../modules/embed';
import { generateULID } from '../utils/ulid';
import logger from '../utils/logger';

export interface InsertDocumentParams {
  text: string;
  metadata?: Record<string, any>;
  db_name?: string;
}

export interface InsertDocumentResult {
  doc_id: string;
  chunk_count: number;
}

export async function insertDocument(params: InsertDocumentParams): Promise<InsertDocumentResult> {
  const { text, metadata, db_name } = params;
  
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }
  
  if (text.length > 100000) {
    throw new Error('Text cannot exceed 100,000 characters');
  }
  
  const startTime = Date.now();
  const docId = generateULID();
  
  logger.info({ docId, textLength: text.length }, 'Starting document insertion');
  
  try {
    // Chunk the text
    const chunks = chunkText(text);
    logger.info({ docId, chunkCount: chunks.length }, 'Text chunked');
    
    if (chunks.length === 0) {
      throw new Error('No chunks generated from text');
    }
    
    // Generate embeddings for all chunks
    const chunkTexts = chunks.map(chunk => chunk.text);
    const embeddingResult = await generateEmbeddings(chunkTexts);
    
    logger.info({ 
      docId, 
      chunkCount: chunks.length, 
      totalTokens: embeddingResult.totalTokens 
    }, 'Embeddings generated');
    
    // Prepare database operations
    const db = getDatabase(db_name);
    
    // Prepare statements
    const insertVectorStmt = db.prepare(`
      INSERT INTO chunks (embedding) 
      VALUES (?)
    `);
    
    const insertMetadataStmt = db.prepare(`
      INSERT INTO chunk_metadata (chunk_id, doc_id, chunk_index, text, metadata)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    // Insert all chunks in a transaction
    const transaction = db.transaction(() => {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddingResult.embeddings[i];
        
        // Insert vector data and get the rowid
        const vectorData = embeddingToFloat32Array(embedding);
        const vectorBuffer = Buffer.from(vectorData.buffer);
        const vectorResult = insertVectorStmt.run(vectorBuffer);
        const chunkId = vectorResult.lastInsertRowid.toString();
        
        // Insert metadata with the same ID
        const metadataJson = metadata ? JSON.stringify(metadata) : null;
        insertMetadataStmt.run(chunkId, docId, chunk.index, chunk.text, metadataJson);
      }
    });
    
    transaction();
    
    const duration = Date.now() - startTime;
    logger.info({ 
      docId, 
      chunkCount: chunks.length, 
      duration,
      totalTokens: embeddingResult.totalTokens 
    }, 'Document inserted successfully');
    
    return {
      doc_id: docId,
      chunk_count: chunks.length
    };
    
  } catch (error) {
    logger.error({ docId, error: (error as Error).message }, 'Failed to insert document');
    throw new DatabaseError(`Failed to insert document: ${(error as Error).message}`, error as Error);
  }
}