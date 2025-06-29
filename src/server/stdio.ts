import { handleMCPRequest, MCPRequest, MCPResponse } from './handlers';
import { closeDatabase } from '../db';
import { validateEmbeddingConfig } from '../config';
import logger from '../utils/logger';

export async function startStdioServer(): Promise<void> {
  // Validate embedding configuration on startup
  try {
    validateEmbeddingConfig();
    logger.info('Embedding configuration validated successfully');
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Invalid embedding configuration');
    process.exit(1);
  }
  
  logger.info('Starting stdio MCP server');
  
  // Set up input stream
  process.stdin.setEncoding('utf8');
  
  let inputBuffer = '';
  
  process.stdin.on('data', async (chunk: string) => {
    inputBuffer += chunk;
    
    // Process complete lines
    const lines = inputBuffer.split('\n');
    inputBuffer = lines.pop() || ''; // Keep the incomplete line in buffer
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        await processStdioLine(trimmedLine);
      }
    }
  });
  
  process.stdin.on('end', () => {
    logger.info('Stdin ended, shutting down stdio server');
    closeDatabase();
    process.exit(0);
  });
  
  // Handle process termination
  const shutdown = () => {
    logger.info('Shutting down stdio server...');
    closeDatabase();
    process.exit(0);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  logger.info('Stdio MCP server ready, waiting for requests...');
}

async function processStdioLine(line: string): Promise<void> {
  try {
    const request: MCPRequest = JSON.parse(line);
    const response = await handleMCPRequest(request);
    
    // Send response to stdout
    process.stdout.write(JSON.stringify(response) + '\n');
    
  } catch (error) {
    logger.error({ error: (error as Error).message, line }, 'Failed to process stdio line');
    
    // Send error response
    const errorResponse: MCPResponse = {
      jsonrpc: '2.0',
      id: null,
      error: {
        code: 'PARSE_ERROR',
        message: 'Invalid JSON'
      }
    };
    
    process.stdout.write(JSON.stringify(errorResponse) + '\n');
  }
}