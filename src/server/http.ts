import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { handleMCPRequest, MCPRequest, MCPResponse } from './handlers';
import { config } from '../config';
import logger from '../utils/logger';

export async function createHttpServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: false // We use our own logger
  });
  
  // Register CORS
  await server.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS']
  });
  
  // Health check endpoint
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
  
  // Tools manifest endpoint
  server.get('/tools', async () => {
    const manifestRequest: MCPRequest = {
      jsonrpc: '2.0',
      id: 'manifest',
      method: 'tools/list'
    };
    
    const response = await handleMCPRequest(manifestRequest);
    return response.result;
  });
  
  // Main RPC endpoint
  server.post('/rpc', async (request, reply) => {
    try {
      const mcpRequest = request.body as MCPRequest;
      
      // Validate JSON-RPC 2.0 format
      if (!mcpRequest || mcpRequest.jsonrpc !== '2.0' || !mcpRequest.method) {
        return reply.code(400).send({
          jsonrpc: '2.0',
          id: mcpRequest?.id || null,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid JSON-RPC 2.0 request'
          }
        });
      }
      
      const response = await handleMCPRequest(mcpRequest);
      
      // Set appropriate status code
      const statusCode = response.error ? 400 : 200;
      return reply.code(statusCode).send(response);
      
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Unhandled error in RPC endpoint');
      
      return reply.code(500).send({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      });
    }
  });
  
  // Error handler
  server.setErrorHandler(async (error, request, reply) => {
    logger.error({ 
      error: (error as Error).message, 
      url: request.url, 
      method: request.method 
    }, 'Server error');
    
    reply.code(500).send({
      error: 'Internal Server Error',
      message: error.message
    });
  });
  
  return server;
}

export async function startHttpServer(): Promise<void> {
  try {
    const server = await createHttpServer();
    
    await server.listen({
      port: config.port,
      host: '0.0.0.0'
    });
    
    logger.info({ port: config.port }, 'HTTP server started');
    
    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down HTTP server...');
      await server.close();
      process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Failed to start HTTP server');
    process.exit(1);
  }
}