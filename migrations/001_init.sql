PRAGMA foreign_keys = ON;

-- sqlite-vec vec0 virtual table
CREATE VIRTUAL TABLE chunks USING vec0(
  embedding FLOAT[1536]
);

-- Separate table for metadata since vec0 doesn't support additional columns
CREATE TABLE chunk_metadata (
  chunk_id     TEXT PRIMARY KEY,
  doc_id       TEXT NOT NULL,
  chunk_index  INTEGER NOT NULL,
  text         TEXT NOT NULL,
  metadata     JSON,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);