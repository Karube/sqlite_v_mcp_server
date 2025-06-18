import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import { config, ensureDataDirectory } from '../config';
import pino from 'pino';
import path from 'path';
import fs from 'fs';

const logger = pino({ level: config.logLevel });

let db: Database.Database | null = null;
const dbConnections = new Map<string, Database.Database>();

export function getDatabase(dbName?: string): Database.Database {
  const dbPath = dbName ? getDatabasePath(dbName) : config.dbPath;
  
  if (!dbName && !db) {
    logger.info(`Opening default database: ${config.dbPath}`);
    
    ensureDataDirectory();
    db = new Database(config.dbPath);
    
    // Load sqlite-vec extension
    sqliteVec.load(db);
    
    // Configure database
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    
    logger.info('Database initialized successfully');
    return db;
  }
  
  if (!dbName) {
    return db!;
  }
  
  // Handle named databases
  if (!dbConnections.has(dbPath)) {
    if (!fs.existsSync(dbPath)) {
      throw new DatabaseError(`Database not found: ${dbPath}`);
    }
    
    logger.info(`Opening named database: ${dbPath}`);
    
    const namedDb = new Database(dbPath);
    sqliteVec.load(namedDb);
    namedDb.pragma('journal_mode = WAL');
    namedDb.pragma('foreign_keys = ON');
    
    dbConnections.set(dbPath, namedDb);
    logger.info(`Named database initialized: ${dbPath}`);
  }
  
  return dbConnections.get(dbPath)!;
}

export function getDatabasePath(dbName: string): string {
  const dataDir = path.dirname(config.dbPath);
  return path.join(dataDir, `${dbName}.db`);
}

export class DatabaseManager {
  private db: Database.Database;
  
  constructor(dbPath: string) {
    this.db = new Database(dbPath);
  }
  
  async initialize(): Promise<void> {
    try {
      // Load sqlite-vec extension
      sqliteVec.load(this.db);
      
      // Configure database
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      
      // Run migrations
      await this.runMigrations();
      
      logger.info(`Database initialized: ${this.db.name}`);
    } catch (error) {
      throw new DatabaseError(`Failed to initialize database: ${(error as Error).message}`, error as Error);
    }
  }
  
  private async runMigrations(): Promise<void> {
    // Check if migrations table exists
    const migrationTableExists = this.db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='migrations'
    `).get();
    
    if (!migrationTableExists) {
      // Create migrations table
      this.db.exec(`
        CREATE TABLE migrations (
          id INTEGER PRIMARY KEY,
          filename TEXT NOT NULL UNIQUE,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Run initial migration
    const migration001Applied = this.db.prepare(`
      SELECT * FROM migrations WHERE filename = '001_init.sql'
    `).get();
    
    if (!migration001Applied) {
      // Create vec0 virtual table
      this.db.exec(`
        CREATE VIRTUAL TABLE chunks USING vec0(
          chunk_id     TEXT PRIMARY KEY,
          doc_id       TEXT NOT NULL,
          chunk_index  INTEGER NOT NULL,
          text         TEXT AUXILIARY,
          metadata     JSON AUXILIARY,
          embedding    FLOAT[1536] DISTANCE_METRIC=cosine
        )
      `);
      
      // Record migration
      this.db.prepare(`
        INSERT INTO migrations (filename) VALUES (?)
      `).run('001_init.sql');
      
      logger.info('Applied migration: 001_init.sql');
    }
  }
  
  close(): void {
    this.db.close();
  }
}

export function closeDatabase(): void {
  if (db) {
    logger.info('Closing database connection');
    db.close();
    db = null;
  }
}

export interface ChunkRow {
  chunk_id: string;
  doc_id: string;
  chunk_index: number;
  text: string;
  metadata: string | null;
  created_at: string;
}

export interface SearchResult {
  chunk_id: string;
  doc_id: string;
  text: string;
  score: number;
}

export class DatabaseError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}