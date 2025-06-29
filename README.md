# MCP Vector Server (sqlite-vec)

A Model Context Protocol (MCP) server that provides vector similarity search capabilities using SQLite and sqlite-vec extension. Designed for storing Japanese documents with OpenAI embeddings.

## Features

- **Vector Search**: Uses sqlite-vec for efficient cosine similarity search
- **Text Chunking**: Intelligent text splitting optimized for Japanese content (700 chars + 100 overlap)
- **OpenAI Embeddings**: Configurable models (3-small, 3-large, ada-002) with adjustable dimensions
- **Batch Loading**: Import multiple documents from JSON, CSV, or text files
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
| `EMBEDDING_MODEL` | `text-embedding-3-small` | OpenAI embedding model |
| `EMBEDDING_DIMENSIONS` | `1536` | Embedding vector dimensions |
| `EMBEDDING_BATCH_SIZE` | `100` | Max texts per embedding batch |
| `EMBEDDING_PROVIDER` | `openai` | Embedding provider (openai only) |
| `EMBEDDING_ENCODING_FORMAT` | `float` | Encoding format (float/base64) |

### Embedding Models

Supported OpenAI models and their dimension ranges:

| Model | Min Dimensions | Max Dimensions | Default |
|-------|----------------|----------------|----------|
| `text-embedding-3-small` | 512 | 1536 | 1536 |
| `text-embedding-3-large` | 256 | 3072 | 3072 |
| `text-embedding-ada-002` | 1536 | 1536 | 1536 |

## Batch Loading

The server includes a batch loading utility for efficiently importing multiple documents from various file formats.

### Quick Start

```bash
# Load documents from JSON
npm run batch-load samples/test-documents.json

# Preview without inserting (dry run)
npm run batch-load samples/documents.csv --dry-run

# Load with custom batch size
npm run batch-load data.json --batch-size 5
```

### Supported Formats

- **JSON**: Array of strings or objects with text/metadata
- **CSV**: Must have a 'text' column, other columns become metadata
- **TXT**: Plain text with double-newline separation or with metadata headers
- **Custom formats**: See [docs/batch-loading.md](./docs/batch-loading.md) for details

### Example

```bash
# Load the provided test documents
npm run batch-load samples/test-documents.json

# Run the interactive example
node examples/batch-load-example.js
```

For detailed documentation on batch loading, see [docs/batch-loading.md](./docs/batch-loading.md).

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