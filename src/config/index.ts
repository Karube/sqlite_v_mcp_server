import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

export interface Config {
  openaiApiKey: string;
  dbPath: string;
  chunkSize: number;
  chunkOverlap: number;
  defaultTopK: number;
  deleteMode: 'hard' | 'soft';
  port: number;
  logLevel: string;
  // Embedding configuration
  embeddingModel: string;
  embeddingDimensions: number;
  embeddingBatchSize: number;
  embeddingProvider: 'openai' | 'custom';
  embeddingEncodingFormat: 'float' | 'base64';
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value || defaultValue!;
}

export const config: Config = {
  openaiApiKey: getEnvVar('OPENAI_API_KEY'),
  dbPath: getEnvVar('DB_PATH', './data/vectors.db'),
  chunkSize: parseInt(getEnvVar('CHUNK_SIZE', '700'), 10),
  chunkOverlap: parseInt(getEnvVar('CHUNK_OVERLAP', '100'), 10),
  defaultTopK: parseInt(getEnvVar('DEFAULT_TOP_K', '10'), 10),
  deleteMode: (getEnvVar('DELETE_MODE', 'hard') as 'hard' | 'soft'),
  port: parseInt(getEnvVar('PORT', '3000'), 10),
  logLevel: getEnvVar('LOG_LEVEL', 'info'),
  // Embedding configuration with defaults
  embeddingModel: getEnvVar('EMBEDDING_MODEL', 'text-embedding-3-small'),
  embeddingDimensions: parseInt(getEnvVar('EMBEDDING_DIMENSIONS', '1536'), 10),
  embeddingBatchSize: parseInt(getEnvVar('EMBEDDING_BATCH_SIZE', '100'), 10),
  embeddingProvider: (getEnvVar('EMBEDDING_PROVIDER', 'openai') as 'openai' | 'custom'),
  embeddingEncodingFormat: (getEnvVar('EMBEDDING_ENCODING_FORMAT', 'float') as 'float' | 'base64'),
};

export function ensureDataDirectory(): void {
  const dataDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Model dimension constraints
export const MODEL_DIMENSIONS: Record<string, { min: number; max: number; default: number }> = {
  'text-embedding-3-small': { min: 512, max: 1536, default: 1536 },
  'text-embedding-3-large': { min: 256, max: 3072, default: 3072 },
  'text-embedding-ada-002': { min: 1536, max: 1536, default: 1536 },
};

export function validateEmbeddingConfig(): void {
  const modelConfig = MODEL_DIMENSIONS[config.embeddingModel];
  
  if (!modelConfig && config.embeddingProvider === 'openai') {
    throw new Error(`Unknown embedding model: ${config.embeddingModel}. Supported models: ${Object.keys(MODEL_DIMENSIONS).join(', ')}`);
  }
  
  if (modelConfig) {
    if (config.embeddingDimensions < modelConfig.min || config.embeddingDimensions > modelConfig.max) {
      throw new Error(
        `Invalid dimensions ${config.embeddingDimensions} for model ${config.embeddingModel}. ` +
        `Valid range: ${modelConfig.min}-${modelConfig.max}`
      );
    }
  }
  
  if (config.embeddingBatchSize < 1 || config.embeddingBatchSize > 2048) {
    throw new Error(`Invalid batch size: ${config.embeddingBatchSize}. Must be between 1 and 2048.`);
  }
}