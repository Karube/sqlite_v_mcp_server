import { getDatabase, DatabaseError } from '../db';
import { isValidULID } from '../utils/ulid';
import logger from '../utils/logger';

export interface DeleteDocumentParams {
  doc_id: string;
  db_name?: string;
}

export interface DeleteDocumentResult {
  deleted_chunks: number;
}

export async function deleteDocument(params: DeleteDocumentParams): Promise<DeleteDocumentResult> {
  const { doc_id, db_name } = params;
  
  if (!doc_id || doc_id.trim().length === 0) {
    throw new Error('Document ID cannot be empty');
  }
  
  if (!isValidULID(doc_id)) {
    throw new Error('Invalid document ID format');
  }
  
  const startTime = Date.now();
  logger.info({ docId: doc_id }, 'Starting document deletion');
  
  try {
    const db = getDatabase(db_name);
    
    // First, get all chunk IDs for this document
    const getChunkIdsStmt = db.prepare(`
      SELECT chunk_id FROM chunk_metadata WHERE doc_id = ?
    `);
    
    const chunkIds = getChunkIdsStmt.all(doc_id) as Array<{ chunk_id: string }>;
    
    if (chunkIds.length === 0) {
      logger.warn({ docId: doc_id }, 'Document not found');
      throw new Error('Document not found');
    }
    
    // Delete from both tables in a transaction
    const deleteTransaction = db.transaction(() => {
      // Delete from vector table
      const deleteVectorStmt = db.prepare(`
        DELETE FROM chunks WHERE rowid = ?
      `);
      
      // Delete from metadata table
      const deleteMetadataStmt = db.prepare(`
        DELETE FROM chunk_metadata WHERE doc_id = ?
      `);
      
      // Delete vectors first
      for (const { chunk_id } of chunkIds) {
        deleteVectorStmt.run(chunk_id);
      }
      
      // Delete metadata
      const metadataResult = deleteMetadataStmt.run(doc_id);
      
      return metadataResult.changes;
    });
    
    const deletedCount = deleteTransaction();
    
    const duration = Date.now() - startTime;
    logger.info({ 
      docId: doc_id, 
      deletedChunks: deletedCount, 
      duration 
    }, 'Document deleted successfully');
    
    return {
      deleted_chunks: deletedCount
    };
    
  } catch (error) {
    if ((error as Error).message === 'Document not found') {
      throw error;
    }
    
    logger.error({ docId: doc_id, error: (error as Error).message }, 'Failed to delete document');
    throw new DatabaseError(`Failed to delete document: ${(error as Error).message}`, error as Error);
  }
}