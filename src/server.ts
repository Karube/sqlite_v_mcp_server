#!/usr/bin/env node

import { startHttpServer } from './server/http';
import { startStdioServer } from './server/stdio';
import logger from './utils/logger';

interface ServerArgs {
  mode: 'stdio' | 'http';
  port?: number;
}

function parseArgs(): ServerArgs {
  const args = process.argv.slice(2);
  const result: ServerArgs = { mode: 'stdio' };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--stdio':
        result.mode = 'stdio';
        break;
        
      case '--http':
        result.mode = 'http';
        break;
        
      case '--port':
        const portValue = args[i + 1];
        if (!portValue || isNaN(Number(portValue))) {
          throw new Error('--port requires a valid number');
        }
        result.port = Number(portValue);
        i++; // Skip next argument
        break;
        
      case '--help':
      case '-h':
        console.log(`
MCP Vector Server

Usage:
  npm start -- [options]

Options:
  --stdio          Start in stdio mode (default)
  --http           Start in HTTP mode
  --port <number>  HTTP port (default: 3000)
  --help, -h       Show this help message

Examples:
  npm start -- --stdio
  npm start -- --http --port 3000
        `);
        process.exit(0);
        break;
        
      default:
        if (!arg.startsWith('-')) {
          continue; // Ignore non-flag arguments
        }
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  
  return result;
}

async function main(): Promise<void> {
  try {
    const args = parseArgs();
    
    logger.info({ mode: args.mode, port: args.port }, 'Starting MCP Vector Server');
    
    if (args.mode === 'stdio') {
      await startStdioServer();
    } else {
      // Update port in environment if provided
      if (args.port) {
        process.env.PORT = args.port.toString();
      }
      await startHttpServer();
    }
    
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Failed to start server');
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Run the server
main();