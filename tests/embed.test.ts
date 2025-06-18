import { generateEmbedding, generateEmbeddings, EmbeddingError } from '../src/modules/embed';

// Mock OpenAI
jest.mock('openai');
const mockOpenAI = {
  embeddings: {
    create: jest.fn()
  }
};

// Mock the OpenAI constructor
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => mockOpenAI);
});

describe('Embedding Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should generate single embedding', async () => {
    const mockResponse = {
      data: [{ embedding: [0.1, 0.2, 0.3] }],
      usage: { total_tokens: 10 }
    };
    
    mockOpenAI.embeddings.create.mockResolvedValue(mockResponse);
    
    const result = await generateEmbedding('test text');
    
    expect(result.embedding).toEqual([0.1, 0.2, 0.3]);
    expect(result.tokenCount).toBe(10);
  });

  test('should generate batch embeddings', async () => {
    const mockResponse = {
      data: [
        { embedding: [0.1, 0.2, 0.3] },
        { embedding: [0.4, 0.5, 0.6] }
      ],
      usage: { total_tokens: 20 }
    };
    
    mockOpenAI.embeddings.create.mockResolvedValue(mockResponse);
    
    const result = await generateEmbeddings(['text1', 'text2']);
    
    expect(result.embeddings).toHaveLength(2);
    expect(result.embeddings[0]).toEqual([0.1, 0.2, 0.3]);
    expect(result.embeddings[1]).toEqual([0.4, 0.5, 0.6]);
    expect(result.totalTokens).toBe(20);
  });

  test('should handle empty array', async () => {
    const result = await generateEmbeddings([]);
    
    expect(result.embeddings).toEqual([]);
    expect(result.totalTokens).toBe(0);
    expect(mockOpenAI.embeddings.create).not.toHaveBeenCalled();
  });

  test('should throw error for too many texts', async () => {
    const manyTexts = Array(101).fill('text');
    
    await expect(generateEmbeddings(manyTexts)).rejects.toThrow(
      'Maximum 100 texts can be processed in a single batch'
    );
  });

  test('should handle API errors', async () => {
    mockOpenAI.embeddings.create.mockRejectedValue(new Error('API Error'));
    
    await expect(generateEmbedding('test')).rejects.toThrow(EmbeddingError);
  });
});