# Document DB (MCP Server) Requirements Specification

> **Version 2.0 — 2025-06-18**
> *Full migration to sqlite-**vec** 0.1 series*

---

## 1. Purpose

Implement a local-only vector server that stores Japanese documents using **OpenAI Embeddings + sqlite-vec** and allows AI agents to perform **insert / find / delete** operations via **Model Context Protocol (MCP)**.
All legacy sqlite-vss dependencies are deprecated and replaced with the successor **sqlite-vec** (`vec0` virtual table approach).

---

## 2. Technology Stack

| Category        | Technology                                                                                                   | Notes |
| --------------- | ------------------------------------------------------------------------------------------------------------ | ----- |
| Runtime         | **Node.js 20 LTS**                                                                                          |       |
| Language        | **TypeScript 5** (`strict`)                                                                                 |       |
| Vector DB       | **sqlite-vec 0.1.x**<br>・`vec0` virtual table<br>・`distance_metric = cosine` ([github.com][1], [alexgarcia.xyz][2]) |       |
| Embedding       | **OpenAI `text-embedding-3-small`** (1536 dims)                                                             |       |
| MCP             | **MCP 0.4** – JSON-RPC 2.0 (HTTP + stdio)                                                                   |       |
| Logging         | **pino** (JSON / dev uses pino-pretty)                                                                       |       |
| Migration       | SQL files + TS runner                                                                                        |       |
| License         | **MIT**                                                                                                      |       |
| OS              | **macOS / Linux** (Windows not supported)                                                                    |       |

---

## 3. MCP "tools"

| Tool                     | params (JSON Schema)                                           | result                                  |
| ------------------------ | -------------------------------------------------------------- | --------------------------------------- |
| `create_database`        | `{ db_name:string }`                                           | `{ success:boolean, db_path:string }`   |
| `insert_document`        | `{ text:string, metadata?:object, db_name?:string }`          | `{ doc_id:string, chunk_count:int }`    |
| `find_similar_documents` | `{ text:string, top_k?:int (default 10), db_name?:string }`   | `[ { chunk_id, doc_id, text, score } ]` |
| `delete_document`        | `{ doc_id:string, db_name?:string }`                          | `{ deleted_chunks:int }`                |

* Manifest is published via `GET /tools`.
* JSON-RPC `error.code` examples: `"NOT_FOUND"`, `"INVALID_REQUEST"`.

---

## 4. Data Schema (sqlite-vec)

```sql
-- Minimal schema. While embedding could be primary key, we adopt ULID row ID.
CREATE VIRTUAL TABLE chunks USING vec0(
  chunk_id     TEXT       PRIMARY KEY,         -- ULID
  doc_id       TEXT       NOT NULL,            -- Document ID
  chunk_index  INTEGER    NOT NULL,            -- 0,1,2…
  text         TEXT       AUXILIARY,           -- Original text for similarity results (+ for non-indexed)
  metadata     JSON       AUXILIARY,
  embedding    FLOAT[1536]  DISTANCE_METRIC=cosine
);
```

* The `vec0` virtual table itself **contains the index and search logic**, so no additional `CREATE INDEX` is needed ([alexgarcia.xyz][2]).
* **Load extension on boot**

  ```ts
  import * as sqliteVec from "sqlite-vec";      // npm i sqlite-vec
  import Database from "better-sqlite3";
  const db = new Database("./data/vector.db");
  sqliteVec.load(db);                           // ← Required
  ```

---

## 5. Business Flow

| Operation      | Steps                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **create_db**  | 1. Create database directory if needed<br>2. Initialize SQLite database with migrations<br>3. Load sqlite-vec extension<br>4. Return success status and path |
| **insert**     | 1. Select target database (db_name or default)<br>2. `doc_id = ULID()`<br>3. Split max 100k chars by periods/newlines (700 chars + overlap 100)<br>4. Batch embed with OpenAI (≤100 chunks)<br>5. Bulk `INSERT INTO chunks (…) VALUES …` |
| **find**       | 1. Select target database (db_name or default)<br>2. Embed query<br>3. `sql SELECT chunk_id, doc_id, text, distance FROM chunks WHERE embedding MATCH ? AND k = :top_k;`<br>4. Return `distance` as score |
| **delete**     | 1. Select target database (db_name or default)<br>2. `BEGIN; DELETE FROM chunks WHERE doc_id=?; COMMIT;`<br>3. Verify and return deletion count using `changes()` |

> For `MATCH ?`, bind **Float32Array.buffer** or use `vec_f32('[…]')`.

---

## 6. Migration

### 6.1 `migrations/001_init.sql`

```sql
PRAGMA foreign_keys = ON;

-- sqlite-vec vec0 virtual table
CREATE VIRTUAL TABLE chunks USING vec0(
  chunk_id     TEXT PRIMARY KEY,
  doc_id       TEXT NOT NULL,
  chunk_index  INTEGER NOT NULL,
  text         TEXT AUXILIARY,
  metadata     JSON AUXILIARY,
  embedding    FLOAT[1536] DISTANCE_METRIC=cosine
);
```

### 6.2 `scripts/migrate.ts` (Excerpt)

*Change* – Always call **sqliteVec.load(db)** after opening DB.

```ts
import * as sqliteVec from "sqlite-vec";
const db = new Database(DB_PATH);
sqliteVec.load(db);        // ← New
db.pragma("journal_mode = WAL");
…
```

---

## 7. Configuration

| Key              | Default            | Description                          |
| ---------------- | ------------------ | ------------------------------------ |
| `OPENAI_API_KEY` | —                  | `.env`                               |
| `dbPath`         | `./data/vector.db` | Default SQLite path                  |
| `dbDirectory`    | `./data/`          | Directory for multiple databases     |
| `chunkSize`      | `700`              | Character count                      |
| `chunkOverlap`   | `100`              | Character count                      |
| `defaultTopK`    | `10`               | Similar search count                 |
| `deleteMode`     | `"hard"`           | Reserved field                       |

### Database Naming Convention

- Default database: `vectors.db` (used when `db_name` is not specified)
- Custom databases: `{db_name}.db` (created in `dbDirectory`)
- Database names must be valid filenames (alphanumeric, underscore, hyphen allowed)

---

## 8. Non-Functional Requirements

| Item          | Details                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------- |
| Performance   | P95 < 300 ms (10k chunks, M1 Mac)                                                        |
| Scalability   | sqlite-vec uses *brute-force KNN* only. Consider ANN for >1M chunks ([docs.sqlitecloud.io][3]) |
| Observability | pino: processing time for insert/find/delete + OpenAI call time                          |
| Testing       | Jest: chunker・delete 404・E2E (insert→find→delete)                                       |
| CI            | GitHub Actions (lint→test→build)                                                         |

---

## 9. Directory Structure

```
/project-root
├─ src/
│  ├─ server.ts          # Fastify + MCP
│  ├─ tools/             # insert, find, delete
│  ├─ db.ts              # sqlite-vec loader & wrapper
│  ├─ embed.ts           # OpenAI embeddings
│  ├─ chunker.ts         # Japanese text splitting
│  └─ manifest.ts        # /tools JSON
├─ migrations/001_init.sql
├─ scripts/migrate.ts
├─ tests/
├─ .env.example
├─ README.md
└─ LICENSE (MIT)
```

---

## 10. Change History

| Version | Date       | Major Changes                                               |
| ------- | ---------- | ----------------------------------------------------------- |
| **2.0** | 2025-06-18 | **Full migration to sqlite-vec 0.1 series** (updated schema, queries, load procedures) |
| 1.2     | 2025-06-18 | Added initial migration procedures                          |
| 1.1     | 2025-06-18 | Added delete_document                                       |
| 1.0     | 2025-06-18 | MCP insert / find specification                             |
| 0.9     | 2025-06-18 | Initial version                                             |

This completes the latest specification based on the successor engine **sqlite-vec**.

[1]: https://github.com/asg017/sqlite-vec?utm_source=chatgpt.com "asg017/sqlite-vec: A vector search SQLite extension that ... - GitHub"
[2]: https://alexgarcia.xyz/sqlite-vec/features/knn.html?utm_source=chatgpt.com "KNN queries | sqlite-vec - Alex Garcia"
[3]: https://docs.sqlitecloud.io/docs/vector?utm_source=chatgpt.com "SQLite Cloud Vector Search"
