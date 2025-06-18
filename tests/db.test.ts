import { DatabaseManager, getDatabase, getDatabasePath } from '../src/db';
import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import fs from 'fs';
import { config } from '../src/config';

// Mock dependencies
jest.mock('better-sqlite3');
jest.mock('sqlite-vec');
jest.mock('fs');
jest.mock('../src/config');

const mockDatabase = Database as jest.MockedClass<typeof Database>;
const mockSqliteVec = sqliteVec as jest.Mocked<typeof sqliteVec>;
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock config
const mockConfig = {
  dbPath: './data/vectors.db'
};
(config as any) = mockConfig;

describe('Database Management', () => {
  let mockDbInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDbInstance = {
      pragma: jest.fn(),
      prepare: jest.fn(),
      exec: jest.fn(),
      close: jest.fn(),
      name: 'test.db'
    };

    mockDatabase.mockImplementation(() => mockDbInstance);
    mockSqliteVec.load.mockImplementation(() => {});
    mockFs.existsSync.mockReturnValue(true);
  });

  describe('getDatabasePath', () => {
    it('should generate correct database path', () => {
      const result = getDatabasePath('test_db');
      expect(result).toBe('data/test_db.db');
    });

    it('should handle database names with special characters', () => {
      const result = getDatabasePath('my-test_db');
      expect(result).toBe('data/my-test_db.db');
    });
  });

  describe('getDatabase', () => {
    it('should return default database when no name specified', () => {
      const db = getDatabase();
      expect(mockDatabase).toHaveBeenCalledWith('./data/vectors.db');
      expect(mockSqliteVec.load).toHaveBeenCalledWith(mockDbInstance);
      expect(mockDbInstance.pragma).toHaveBeenCalledWith('journal_mode = WAL');
      expect(mockDbInstance.pragma).toHaveBeenCalledWith('foreign_keys = ON');
    });

    it('should return named database when specified', () => {
      mockFs.existsSync.mockReturnValue(true);
      
      const db = getDatabase('test_db');
      expect(mockDatabase).toHaveBeenCalledWith('data/test_db.db');
      expect(mockSqliteVec.load).toHaveBeenCalledWith(mockDbInstance);
    });

    it('should throw error when named database does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      expect(() => getDatabase('nonexistent')).toThrow(
        'Database not found: data/nonexistent.db'
      );
    });

    it('should cache database connections', () => {
      mockFs.existsSync.mockReturnValue(true);
      
      // First call
      const db1 = getDatabase('cached_db');
      // Second call
      const db2 = getDatabase('cached_db');
      
      // Should only create database once
      expect(mockDatabase).toHaveBeenCalledTimes(1);
      expect(db1).toBe(db2);
    });
  });

  describe('DatabaseManager', () => {
    let dbManager: DatabaseManager;

    beforeEach(() => {
      const mockPrepareStmt = {
        get: jest.fn(),
        run: jest.fn()
      };
      mockDbInstance.prepare.mockReturnValue(mockPrepareStmt);
      
      dbManager = new DatabaseManager('./data/test.db');
    });

    describe('initialize', () => {
      it('should initialize database successfully', async () => {
        const mockPrepareStmt = {
          get: jest.fn().mockReturnValueOnce(null).mockReturnValueOnce(null),
          run: jest.fn()
        };
        mockDbInstance.prepare.mockReturnValue(mockPrepareStmt);

        await dbManager.initialize();

        expect(mockSqliteVec.load).toHaveBeenCalledWith(mockDbInstance);
        expect(mockDbInstance.pragma).toHaveBeenCalledWith('journal_mode = WAL');
        expect(mockDbInstance.pragma).toHaveBeenCalledWith('foreign_keys = ON');
        expect(mockDbInstance.exec).toHaveBeenCalledWith(
          expect.stringContaining('CREATE TABLE migrations')
        );
        expect(mockDbInstance.exec).toHaveBeenCalledWith(
          expect.stringContaining('CREATE VIRTUAL TABLE chunks USING vec0')
        );
      });

      it('should skip migration if already applied', async () => {
        const mockPrepareStmt = {
          get: jest.fn()
            .mockReturnValueOnce({ name: 'migrations' }) // migrations table exists
            .mockReturnValueOnce({ filename: '001_init.sql' }), // migration already applied
          run: jest.fn()
        };
        mockDbInstance.prepare.mockReturnValue(mockPrepareStmt);

        await dbManager.initialize();

        expect(mockDbInstance.exec).not.toHaveBeenCalledWith(
          expect.stringContaining('CREATE VIRTUAL TABLE chunks')
        );
      });

      it('should handle initialization errors', async () => {
        mockSqliteVec.load.mockImplementation(() => {
          throw new Error('Failed to load extension');
        });

        await expect(dbManager.initialize()).rejects.toThrow(
          'Failed to initialize database: Failed to load extension'
        );
      });
    });

    describe('runMigrations', () => {
      it('should create migrations table if not exists', async () => {
        const mockPrepareStmt = {
          get: jest.fn().mockReturnValueOnce(null), // migrations table doesn't exist
          run: jest.fn()
        };
        mockDbInstance.prepare.mockReturnValue(mockPrepareStmt);

        await dbManager.initialize();

        expect(mockDbInstance.exec).toHaveBeenCalledWith(
          expect.stringContaining('CREATE TABLE migrations')
        );
      });

      it('should apply initial migration if not applied', async () => {
        const mockPrepareStmt = {
          get: jest.fn()
            .mockReturnValueOnce({ name: 'migrations' }) // migrations table exists
            .mockReturnValueOnce(null), // migration not applied
          run: jest.fn()
        };
        mockDbInstance.prepare.mockReturnValue(mockPrepareStmt);

        await dbManager.initialize();

        expect(mockDbInstance.exec).toHaveBeenCalledWith(
          expect.stringContaining('CREATE VIRTUAL TABLE chunks USING vec0')
        );
        expect(mockPrepareStmt.run).toHaveBeenCalledWith('001_init.sql');
      });
    });

    describe('close', () => {
      it('should close database connection', () => {
        dbManager.close();
        expect(mockDbInstance.close).toHaveBeenCalled();
      });
    });
  });

  describe('database configuration', () => {
    it('should be properly mocked', () => {
      // This test verifies our mocks are working
      expect(mockDatabase).toBeDefined();
      expect(mockSqliteVec.load).toBeDefined();
    });
  });
});