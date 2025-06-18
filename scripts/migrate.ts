import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { config, ensureDataDirectory } from '../src/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Migration {
  id: string;
  filename: string;
  sql: string;
}

function loadMigrations(): Migration[] {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  return files.map(filename => {
    const filePath = path.join(migrationsDir, filename);
    const sql = fs.readFileSync(filePath, 'utf-8');
    const id = path.basename(filename, '.sql');
    return { id, filename, sql };
  });
}

function createMigrationsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function getAppliedMigrations(db: Database.Database): Set<string> {
  const stmt = db.prepare('SELECT id FROM migrations');
  const rows = stmt.all() as { id: string }[];
  return new Set(rows.map(row => row.id));
}

function applyMigration(db: Database.Database, migration: Migration): void {
  console.log(`Applying migration: ${migration.filename}`);
  
  const transaction = db.transaction(() => {
    db.exec(migration.sql);
    db.prepare('INSERT INTO migrations (id, filename) VALUES (?, ?)')
      .run(migration.id, migration.filename);
  });
  
  transaction();
  console.log(`Migration ${migration.filename} applied successfully`);
}

async function main(): Promise<void> {
  try {
    console.log('Starting database migrations...');
    
    // Ensure data directory exists
    ensureDataDirectory();
    
    // Open database and load sqlite-vec extension
    const db = new Database(config.dbPath);
    sqliteVec.load(db);
    
    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    
    console.log(`Database opened: ${config.dbPath}`);
    
    // Create migrations table
    createMigrationsTable(db);
    
    // Load all migrations
    const migrations = loadMigrations();
    const appliedMigrations = getAppliedMigrations(db);
    
    console.log(`Found ${migrations.length} migration(s)`);
    console.log(`${appliedMigrations.size} migration(s) already applied`);
    
    // Apply pending migrations
    let appliedCount = 0;
    for (const migration of migrations) {
      if (!appliedMigrations.has(migration.id)) {
        applyMigration(db, migration);
        appliedCount++;
      } else {
        console.log(`Skipping already applied migration: ${migration.filename}`);
      }
    }
    
    console.log(`Migration complete. Applied ${appliedCount} new migration(s).`);
    
    // Close database
    db.close();
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
main();