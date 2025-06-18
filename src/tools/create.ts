import { DatabaseManager } from '../db';
import { config } from '../config';
import logger from '../utils/logger';
import path from 'path';
import fs from 'fs';

export interface CreateDatabaseParams {
  db_name: string;
}

export interface CreateDatabaseResult {
  success: boolean;
  db_path: string;
}

export async function createDatabase(params: CreateDatabaseParams): Promise<CreateDatabaseResult> {
  const { db_name } = params;
  
  // Validate database name
  if (!db_name || db_name.trim().length === 0) {
    throw new Error('Database name cannot be empty');
  }
  
  // Only allow alphanumeric, underscore, and hyphen
  if (!/^[a-zA-Z0-9_-]+$/.test(db_name)) {
    throw new Error('Database name can only contain alphanumeric characters, underscores, and hyphens');
  }
  
  const startTime = Date.now();
  logger.info({ dbName: db_name }, 'Starting database creation');
  
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(config.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      logger.info({ dataDir }, 'Created data directory');
    }
    
    // Create database path
    const dbPath = path.join(dataDir, `${db_name}.db`);
    
    // Check if database already exists
    if (fs.existsSync(dbPath)) {
      logger.info({ dbPath }, 'Database already exists');
      return {
        success: true,
        db_path: dbPath
      };
    }
    
    // Create and initialize the database
    const dbManager = new DatabaseManager(dbPath);
    await dbManager.initialize();
    
    const duration = Date.now() - startTime;
    logger.info({ 
      dbName: db_name,
      dbPath,
      duration
    }, 'Database created successfully');
    
    return {
      success: true,
      db_path: dbPath
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ 
      error: (error as Error).message,
      dbName: db_name,
      duration
    }, 'Failed to create database');
    
    throw new Error(`Failed to create database: ${(error as Error).message}`);
  }
}