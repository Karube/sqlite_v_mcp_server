import OpenAI from 'openai';
import { config } from '../config';
import pino from 'pino';

const logger = pino({ level: config.logLevel });

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });
  }
  return openai;
}

export interface EmbeddingResult {
  embedding: number[];
  tokenCount: number;
}

export interface BatchEmbeddingResult {
  embeddings: number[][];
  totalTokens: number;
}

export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  const result = await generateEmbeddings([text]);
  return {
    embedding: result.embeddings[0],
    tokenCount: result.totalTokens
  };
}

export async function generateEmbeddings(texts: string[]): Promise<BatchEmbeddingResult> {
  if (texts.length === 0) {
    return { embeddings: [], totalTokens: 0 };
  }
  
  if (texts.length > config.embeddingBatchSize) {
    throw new Error(`Maximum ${config.embeddingBatchSize} texts can be processed in a single batch`);
  }
  
  const startTime = Date.now();
  logger.info(`Generating embeddings for ${texts.length} text(s)`);
  
  try {
    const client = getOpenAI();
    const embeddingParams: OpenAI.EmbeddingCreateParams = {
      model: config.embeddingModel,
      input: texts,
      encoding_format: config.embeddingEncodingFormat,
    };
    
    // Add dimensions parameter if supported by the model
    if (config.embeddingModel.includes('text-embedding-3-')) {
      (embeddingParams as any).dimensions = config.embeddingDimensions;
    }
    
    const response = await client.embeddings.create(embeddingParams);
    
    const embeddings = response.data.map(item => item.embedding);
    const totalTokens = response.usage.total_tokens;
    
    const duration = Date.now() - startTime;
    logger.info(`Generated ${embeddings.length} embeddings in ${duration}ms, tokens: ${totalTokens}`);
    
    return {
      embeddings,
      totalTokens
    };
    
  } catch (error) {
    logger.error({ error, textsCount: texts.length }, 'Failed to generate embeddings');
    throw new EmbeddingError(`Failed to generate embeddings: ${(error as Error).message}`, error as Error);
  }
}

export class EmbeddingError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'EmbeddingError';
  }
}

// Utility function to convert embedding array to Float32Array for sqlite-vec
export function embeddingToFloat32Array(embedding: number[]): Float32Array {
  return new Float32Array(embedding);
}

// Get configured embedding dimensions
export function getEmbeddingDimensions(): number {
  return config.embeddingDimensions;
}