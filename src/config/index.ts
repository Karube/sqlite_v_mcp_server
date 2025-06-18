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
};

export function ensureDataDirectory(): void {
  const dataDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}