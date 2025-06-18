// Test setup file
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.OPENAI_API_KEY = 'test-key';
process.env.DB_PATH = ':memory:'; // Use in-memory database for tests