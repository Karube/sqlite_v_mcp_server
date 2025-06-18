import { insertDocument, findSimilarDocuments, deleteDocument } from '../tools';
import { getToolsManifest } from './manifest';
import logger from '../utils/logger';

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: any;
  error?: {
    code: string;
    message: string;
    data?: any;
  };
}

// Helper class for MCP errors
export class MCPError extends Error {
  constructor(public code: string, message: string, public data?: any) {
    super(message);
    this.name = 'MCPError';
  }
}

export async function handleMCPRequest(request: MCPRequest): Promise<MCPResponse> {
  const { id, method, params } = request;
  
  logger.info({ method, id }, 'Handling MCP request');
  
  try {
    let result: any;
    
    switch (method) {
      case 'tools/list':
        result = getToolsManifest();
        break;
        
      case 'tools/call':
        if (!params || !params.name) {
          throw createMCPError('INVALID_REQUEST', 'Tool name is required');
        }
        
        result = await handleToolCall(params.name, params.arguments || {});
        break;
        
      default:
        throw createMCPError('METHOD_NOT_FOUND', `Unknown method: ${method}`);
    }
    
    logger.info({ method, id }, 'MCP request completed successfully');
    
    return {
      jsonrpc: '2.0',
      id,
      result
    };
    
  } catch (error) {
    const mcpError = error instanceof MCPError ? error : createMCPError('INTERNAL_ERROR', (error as Error).message);
    
    logger.error({ method, id, error: mcpError }, 'MCP request failed');
    
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: mcpError.code,
        message: mcpError.message,
        data: mcpError.data
      }
    };
  }
}

async function handleToolCall(toolName: string, params: any): Promise<any> {
  switch (toolName) {
    case 'insert_document':
      return await insertDocument(params);
      
    case 'find_similar_documents':
      return await findSimilarDocuments(params);
      
    case 'delete_document':
      return await deleteDocument(params);
      
    default:
      throw createMCPError('TOOL_NOT_FOUND', `Unknown tool: ${toolName}`);
  }
}

function createMCPError(code: string, message: string, data?: any): MCPError {
  return new MCPError(code, message, data);
}