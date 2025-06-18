# MCP Vector Server (sqlite-vec)

A Model Context Protocol (MCP) server that provides vector similarity search capabilities using SQLite and sqlite-vec extension. Designed for storing Japanese documents with OpenAI embeddings.

## Features

- **Vector Search**: Uses sqlite-vec for efficient cosine similarity search
- **Text Chunking**: Intelligent text splitting optimized for Japanese content (700 chars + 100 overlap)
- **OpenAI Embeddings**: text-embedding-3-small (1536 dimensions) with batch processing
- **Dual Modes**: HTTP server (JSON-RPC 2.0) and stdio mode for direct MCP communication
- **TypeScript**: Full type safety with strict mode

## Prerequisites

- Node.js 20 LTS
- OpenAI API key
- macOS or Linux (Windows not supported due to sqlite-vec limitations)

## Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env and set your OpenAI API key
# OPENAI_API_KEY=sk-your-openai-api-key-here

# Run database migrations
npm run migrate

# Build the project
npm run build
```

## Usage

### HTTP Mode (JSON-RPC 2.0)

```bash
# Start HTTP server (default port 3000)
npm start -- --http

# Start with custom port
npm start -- --http --port 8080
```

### stdio Mode (MCP Protocol)

```bash
# Start in stdio mode
npm start -- --stdio
```

### Development Mode

```bash
# Development server with hot reload
npm run dev
```

## API Endpoints (HTTP Mode)

### GET /tools
Returns the MCP tools manifest.

### POST /rpc
Main JSON-RPC 2.0 endpoint for tool execution.

### GET /health
Health check endpoint.

## MCP Tools

### insert_document
Insert a document with automatic chunking and embedding generation.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "insert_document",
    "arguments": {
      "text": "Your document text here...",
      "metadata": { "title": "Document Title", "author": "Author Name" }
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "doc_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "chunk_count": 5
  }
}
```

### find_similar_documents
Search for similar documents using vector similarity.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "find_similar_documents",
    "arguments": {
      "text": "Search query text",
      "top_k": 10
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "results": [
      {
        "chunk_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
        "doc_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
        "text": "Matching text chunk...",
        "score": 0.95
      }
    ]
  }
}
```

### delete_document
Delete a document and all its chunks.

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "delete_document",
    "arguments": {
      "doc_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "deleted_chunks": 5
  }
}
```

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | - | OpenAI API key (required) |
| `DB_PATH` | `./data/vectors.db` | SQLite database path |
| `PORT` | `3000` | HTTP server port |
| `LOG_LEVEL` | `info` | Logging level |
| `CHUNK_SIZE` | `700` | Text chunk size |
| `CHUNK_OVERLAP` | `100` | Text chunk overlap |
| `DEFAULT_TOP_K` | `10` | Default search results count |

## Development

```bash
# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Build
npm run build

# Development server
npm run dev
```

## Database Schema

The system uses two tables:

1. **chunks** (sqlite-vec virtual table): Stores embeddings with ULID keys
2. **chunk_metadata**: Stores text content, metadata, and relationships

## Performance

- Target: P95 < 300ms for 10k chunks on M1 Mac
- sqlite-vec uses brute-force KNN (consider ANN for >1M chunks)
- WAL mode enabled for concurrent reads
- Embedding batch processing (up to 100 texts/request)

## Sample Data

See [SAMPLE_QUERIES.md](./SAMPLE_QUERIES.md) for:
- Test document examples across various categories
- Sample search queries with expected results
- Cross-domain search examples
- Testing guidelines

Test documents are available in `samples/test-documents.json` with 20 sample documents covering:
- Technology (cloud, AI)
- Cooking (Japanese, Italian)
- Health & Sports
- Business & Education
- Travel & Environment
- Art & Science

## License

MIT