import { createDatabase } from '../src/tools/create';
import { DatabaseManager, getDatabasePath } from '../src/db';
import fs from 'fs';
import path from 'path';
import { config } from '../src/config';

// Mock the dependencies
jest.mock('fs');
jest.mock('../src/db');
jest.mock('../src/config');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockGetDatabasePath = getDatabasePath as jest.MockedFunction<typeof getDatabasePath>;

// Mock DatabaseManager
const mockDatabaseManager = {
  initialize: jest.fn().mockResolvedValue(undefined),
  close: jest.fn()
};

jest.mock('../src/db', () => ({
  ...jest.requireActual('../src/db'),
  DatabaseManager: jest.fn().mockImplementation(() => mockDatabaseManager),
  getDatabasePath: jest.fn()
}));

// Mock config
const mockConfig = {
  dbPath: './data/vectors.db'
};

(config as any) = mockConfig;

describe('createDatabase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockImplementation(() => undefined);
    mockGetDatabasePath.mockImplementation((dbName) => `data/${dbName}.db`);
    mockDatabaseManager.initialize.mockResolvedValue(undefined);
  });

  describe('input validation', () => {
    it('should throw error for empty database name', async () => {
      await expect(createDatabase({ db_name: '' })).rejects.toThrow(
        'Database name cannot be empty'
      );
    });

    it('should throw error for whitespace-only database name', async () => {
      await expect(createDatabase({ db_name: '   ' })).rejects.toThrow(
        'Database name cannot be empty'
      );
    });

    it('should throw error for invalid characters in database name', async () => {
      const invalidNames = [
        'test@db',
        'test db',
        'test.db',
        'test/db',
        'test\\db',
        'test#db',
        'test$db'
      ];

      for (const name of invalidNames) {
        await expect(createDatabase({ db_name: name })).rejects.toThrow(
          'Database name can only contain alphanumeric characters, underscores, and hyphens'
        );
      }
    });

    it('should accept valid database names', async () => {
      const validNames = [
        'test',
        'test_db',
        'test-db',
        'TestDB123',
        'db_2024',
        'my-vector-db'
      ];

      for (const name of validNames) {
        mockFs.existsSync.mockReturnValue(false);
        const result = await createDatabase({ db_name: name });
        expect(result.success).toBe(true);
        expect(result.db_path).toBe(`data/${name}.db`);
      }
    });
  });

  describe('directory creation', () => {
    it('should create data directory if it does not exist', async () => {
      mockFs.existsSync.mockReturnValueOnce(false); // data directory doesn't exist
      mockFs.existsSync.mockReturnValueOnce(false); // database file doesn't exist

      await createDatabase({ db_name: 'test' });

      expect(mockFs.mkdirSync).toHaveBeenCalledWith('./data', { recursive: true });
    });

    it('should not create data directory if it already exists', async () => {
      mockFs.existsSync.mockReturnValueOnce(true); // data directory exists
      mockFs.existsSync.mockReturnValueOnce(false); // database file doesn't exist

      await createDatabase({ db_name: 'test' });

      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('database creation', () => {
    it('should create new database successfully', async () => {
      mockFs.existsSync.mockReturnValueOnce(true); // data directory exists
      mockFs.existsSync.mockReturnValueOnce(false); // database file doesn't exist

      const result = await createDatabase({ db_name: 'new_test_db' });

      expect(result).toEqual({
        success: true,
        db_path: 'data/new_test_db.db'
      });
      expect(DatabaseManager).toHaveBeenCalledWith('data/new_test_db.db');
    });

    it('should return success if database already exists', async () => {
      mockFs.existsSync.mockReturnValueOnce(true); // data directory exists
      mockFs.existsSync.mockReturnValueOnce(true); // database file exists

      const result = await createDatabase({ db_name: 'existing_db' });

      expect(result).toEqual({
        success: true,
        db_path: 'data/existing_db.db'
      });
      expect(DatabaseManager).not.toHaveBeenCalled();
    });

    it('should handle DatabaseManager initialization failure', async () => {
      mockFs.existsSync.mockReturnValueOnce(true); // data directory exists
      mockFs.existsSync.mockReturnValueOnce(false); // database file doesn't exist

      // Mock DatabaseManager to throw error
      mockDatabaseManager.initialize.mockRejectedValueOnce(new Error('Failed to initialize'));

      await expect(createDatabase({ db_name: 'failing_db' })).rejects.toThrow(
        'Failed to create database: Failed to initialize'
      );
    });
  });

  describe('error handling', () => {
    it('should handle file system errors during directory creation', async () => {
      mockFs.existsSync.mockReturnValueOnce(false); // data directory doesn't exist
      mockFs.mkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      await expect(createDatabase({ db_name: 'test' })).rejects.toThrow(
        'Failed to create database: Permission denied'
      );
    });

  });

  describe('database naming', () => {
    it('should create database with correct path format', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const result = await createDatabase({ db_name: 'test_db' });
      
      expect(result.success).toBe(true);
      expect(result.db_path).toMatch(/test_db\.db$/);
    });
  });
});