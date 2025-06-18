# MCP Vector Server TODO ✅/☑ (sqlite-vec version)

## 0. Project Initialization

* [x] **npm & TypeScript scaffold**

  * [x] `npm init -y`
  * [x] `tsconfig.json` (`strict`, `outDir: dist`, etc.)
* [x] **Dependencies installation**

  * [x] Runtime: `better-sqlite3`, `sqlite-vec`, `pino`, `ulid`, `fastify`, `@fastify/cors`
  * [x] Development: `typescript`, `tsx`, `jest`, `@types/node`, `@types/jest`, `@types/better-sqlite3`
* [x] **Directory creation** — `src/`, `migrations/`, `scripts/`, `data/`, `tests/`

---

## 1. Configuration & Migration

* [x] `.env.example` (`OPENAI_API_KEY=`)
* [x] `src/config/index.ts` (env loading + default values)
* [x] `migrations/001_init.sql`

  * [x] `CREATE VIRTUAL TABLE chunks USING vec0( embedding FLOAT[1536] );` + separate metadata table
* [x] `scripts/migrate.ts`

  * [x] Add `sqliteVec.load(db)` to load extension
* [x] Verify DB creation with `npm run migrate`

---

## 2. Foundation Modules

* [x] `src/db/index.ts` — SQLite connection (WAL) + `sqliteVec.load(db)`
* [x] `src/modules/chunker.ts` — Split by 700 chars + overlap 100
* [x] `src/modules/embed.ts` — OpenAI embeddings (batch & retry)
* [x] `src/server/manifest.ts` — MCP `/tools` JSON generation
* [x] `src/utils/logger.ts` — Pino logging setup
* [x] `src/utils/ulid.ts` — ULID generation utilities

---

## 3. MCP "tools" Implementation

* [x] `src/tools/create.ts`

  * [x] Database creation with validation and initialization
  * [x] Support for multiple named databases
* [x] `src/tools/insert.ts`

  * [x] Generate ULID → chunk splitting → embeddings → bulk `INSERT` to **sqlite-vec**
  * [x] Optional `db_name` parameter for multi-database support
* [x] `src/tools/find.ts`

  * [x] Embed query
  * [x] `SELECT … FROM chunks WHERE embedding MATCH ? ORDER BY distance LIMIT ?;`
  * [x] Optional `db_name` parameter for multi-database support
* [x] `src/tools/delete.ts`

  * [x] `BEGIN; DELETE FROM chunks WHERE doc_id=?; COMMIT;`
  * [x] Optional `db_name` parameter for multi-database support
* [x] `pino` logging output for each tool

---

## 4. Server Layer

* [x] `src/server.ts` — Main server entry point with CLI args

  * [x] `/tools` GET (manifest)
  * [x] `/rpc` POST (JSON-RPC 2.0)
  * [x] `--stdio` mode
* [x] `src/server/http.ts` — HTTP server with Fastify
* [x] `src/server/stdio.ts` — stdio mode for MCP protocol
* [x] `src/server/handlers.ts` — Request/response handling
* [x] CORS and common error handler

---

## 5. Testing

* [x] Unit tests

  * [x] Chunk splitting (`tests/chunker.test.ts`)
  * [x] ULID utilities (`tests/ulid.test.ts`)
  * [x] Embedding module with mocks (`tests/embed.test.ts`)
* [x] Jest configuration with setup file
* [x] Test coverage reporting

---

## 6. Dev / CI

* [x] `npm run dev` — `tsx watch src/server.ts` (hot reload)
* [x] Package scripts for build, test, lint, format, migrate
* [x] Update `README.md` (sqlite-vec usage instructions and API examples)
* [x] `LICENSE` (MIT)

---

## 7. Final Touches

* [x] `pino-pretty` (development logging)
* [x] Define `deleteMode` flag in `config.ts`
* [x] Code formatting with Prettier + ESLint setup
* [x] TypeScript strict mode compilation
* [x] Environment configuration with .env support

---

## 8. Recent Enhancements (2025-06-18)

* [x] **Multi-Database Support**
  * [x] Added `create_database` tool for dynamic database creation
  * [x] Enhanced existing tools with optional `db_name` parameter
  * [x] Database connection pooling and management
  * [x] Updated spec.md with new command specifications

* [x] **Documentation Updates**
  * [x] Created comprehensive sample documents (test-documents.json)
  * [x] Added SAMPLE_QUERIES.md with test scenarios
  * [x] Created Japanese versions (README.jp.md, SAMPLE_QUERIES.jp.md)
  * [x] Updated todo.md with latest changes

## ✅ Implementation Complete

All major features have been implemented:

- **Vector Database**: sqlite-vec with proper schema and migrations
- **Multi-Database Support**: Create and manage multiple named databases
- **Text Processing**: Japanese-optimized chunking and OpenAI embeddings
- **MCP Protocol**: Full JSON-RPC 2.0 support with stdio and HTTP modes
- **Tools**: create_database, insert_document, find_similar_documents, delete_document
- **Testing**: Unit tests with mocking for external dependencies
- **Documentation**: Comprehensive README with API examples and sample data
- **Development**: Hot reload, linting, formatting, and build scripts

The server is ready for use with AI agents via MCP protocol and supports multiple databases for different use cases!