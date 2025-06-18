# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) Vector Server that provides vector similarity search capabilities using SQLite and sqlite-vec extension. The project implements Japanese document storage with OpenAI embeddings and vector search functionality through MCP tools.

## Development Commands

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Development server with hot reload
npm run dev

# Run tests
npm run test

# Run migrations
npm run migrate

# Lint code
npm run lint

# Format code
npm run format

# Start server in stdio mode
npm start -- --stdio

# Start HTTP server
npm start -- --http --port 3000
```

## Architecture

### Core Components

1. **Text Processing Pipeline**:
   - Chunking: 700-character chunks with 100-character overlap for Japanese text
   - Embedding: OpenAI text-embedding-3-small (1536 dimensions) with batch processing
   - Storage: SQLite with sqlite-vec extension for vector operations

2. **MCP Tools**:
   - `insert_document`: Add documents with metadata and generate embeddings
   - `find_similar_documents`: Vector similarity search with cosine distance
   - `delete_document`: Remove documents and their chunks

3. **Server Modes**:
   - **stdio mode**: Direct MCP protocol communication for AI agents
   - **HTTP mode**: Fastify server with `/rpc` endpoint for JSON-RPC 2.0

### Database Schema

Uses sqlite-vec virtual table:
```sql
CREATE VIRTUAL TABLE chunks USING vec0(
  chunk_id     TEXT       PRIMARY KEY,  -- ULID
  doc_id       TEXT       NOT NULL,
  chunk_index  INTEGER    NOT NULL,
  text         TEXT       AUXILIARY,
  metadata     JSON       AUXILIARY,
  embedding    FLOAT[1536] DISTANCE_METRIC=cosine
);
```

### Directory Structure

```
src/
├── config/          # Configuration and environment
├── db/              # Database connection and migrations
├── modules/         # Core functionality (chunker, embedder)
├── tools/           # MCP tool implementations
├── server/          # Server entry points (stdio/http)
└── utils/           # Shared utilities
```

### Key Technical Stack

- **sqlite-vec 0.1.x**: Modern vector extension for SQLite
- **TypeScript**: With strict mode enabled
- **better-sqlite3**: Synchronous SQLite bindings
- **Fastify**: HTTP server framework
- **Pino**: Structured JSON logging
- **ULID**: Sortable unique identifiers
- **MCP SDK**: Model Context Protocol implementation

### Development Notes

- WAL mode is enabled for SQLite to support concurrent reads
- Embeddings are generated in batches of up to 100 texts
- All async operations use proper error handling
- Database path defaults to `./data/vectors.db`
- OpenAI API key required in `OPENAI_API_KEY` environment variable