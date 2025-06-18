export interface MCPToolParameter {
  type: string;
  description: string;
  default?: any;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, MCPToolParameter>;
    required: string[];
  };
}

export const MCP_TOOLS: MCPTool[] = [
  {
    name: 'insert_document',
    description: 'Insert a document with text content and optional metadata. The text will be chunked and embedded automatically.',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text content to insert (max 100,000 characters)'
        },
        metadata: {
          type: 'object',
          description: 'Optional metadata to associate with the document'
        }
      },
      required: ['text']
    }
  },
  {
    name: 'find_similar_documents',
    description: 'Find documents similar to the given text using vector similarity search.',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The query text to find similar documents for'
        },
        top_k: {
          type: 'number',
          description: 'Number of similar documents to return',
          default: 10
        }
      },
      required: ['text']
    }
  },
  {
    name: 'delete_document',
    description: 'Delete a document and all its chunks by document ID.',
    inputSchema: {
      type: 'object',
      properties: {
        doc_id: {
          type: 'string',
          description: 'The document ID to delete'
        }
      },
      required: ['doc_id']
    }
  }
];

export function getToolsManifest() {
  return {
    tools: MCP_TOOLS
  };
}