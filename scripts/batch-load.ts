#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { parse } from 'csv-parse/sync';
import { insertDocument } from '../src/tools/insert';
import { ensureDataDirectory } from '../src/config';
import logger from '../src/utils/logger';

interface DocumentData {
  text: string;
  metadata?: Record<string, any>;
}

interface LoadOptions {
  batchSize?: number;
  dryRun?: boolean;
  dbName?: string;
}

class BatchLoader {
  private totalProcessed = 0;
  private totalSucceeded = 0;
  private totalFailed = 0;
  private errors: Array<{ index: number; error: string }> = [];

  async loadDocuments(documents: DocumentData[], options: LoadOptions = {}) {
    const { batchSize = 10, dryRun = false, dbName } = options;
    
    if (dryRun) {
      logger.info('DRY RUN MODE - No documents will be inserted');
    }

    logger.info(`Starting batch load of ${documents.length} documents`);
    
    // Process documents in batches to avoid overwhelming the API
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, Math.min(i + batchSize, documents.length));
      logger.info(`Processing batch ${Math.floor(i / batchSize) + 1} (documents ${i + 1}-${i + batch.length})`);
      
      await this.processBatch(batch, i, dryRun, dbName);
      
      // Add a small delay between batches to respect rate limits
      if (i + batchSize < documents.length) {
        await this.delay(1000);
      }
    }
    
    this.printSummary();
  }

  private async processBatch(batch: DocumentData[], startIndex: number, dryRun: boolean, dbName?: string) {
    const promises = batch.map(async (doc, index) => {
      const docIndex = startIndex + index;
      try {
        if (!doc.text || doc.text.trim().length === 0) {
          throw new Error('Document text is empty');
        }

        if (dryRun) {
          logger.info(`[DRY RUN] Would insert document ${docIndex + 1}: ${doc.text.substring(0, 50)}...`);
          return;
        }

        const result = await insertDocument({
          text: doc.text,
          metadata: doc.metadata,
          db_name: dbName
        });
        
        this.totalSucceeded++;
        logger.info(`Document ${docIndex + 1} inserted successfully: doc_id=${result.doc_id}, chunks=${result.chunk_count}`);
      } catch (error) {
        this.totalFailed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.errors.push({ index: docIndex + 1, error: errorMessage });
        logger.error(`Failed to insert document ${docIndex + 1}: ${errorMessage}`);
      } finally {
        this.totalProcessed++;
      }
    });

    await Promise.all(promises);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private printSummary() {
    logger.info('=== Batch Load Summary ===');
    logger.info(`Total documents processed: ${this.totalProcessed}`);
    logger.info(`Successfully inserted: ${this.totalSucceeded}`);
    logger.info(`Failed: ${this.totalFailed}`);
    
    if (this.errors.length > 0) {
      logger.error('Failed documents:');
      this.errors.forEach(({ index, error }) => {
        logger.error(`  Document ${index}: ${error}`);
      });
    }
  }
}

// File loading functions
async function loadJsonFile(filePath: string): Promise<DocumentData[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  
  // Handle different JSON structures
  if (Array.isArray(data)) {
    return data.map(item => {
      if (typeof item === 'string') {
        return { text: item };
      } else if (item.text) {
        return {
          text: item.text,
          metadata: item.metadata || extractMetadata(item)
        };
      } else {
        throw new Error('Invalid JSON structure: each item must have a "text" field or be a string');
      }
    });
  } else if (data.documents && Array.isArray(data.documents)) {
    // Handle the test-documents.json format
    return data.documents.map((doc: any) => ({
      text: doc.text,
      metadata: doc.metadata || extractMetadata(doc)
    }));
  } else {
    throw new Error('Invalid JSON structure: must be an array or have a "documents" array field');
  }
}

async function loadCsvFile(filePath: string): Promise<DocumentData[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  
  return records.map((record: any) => {
    if (!record.text) {
      throw new Error('CSV must have a "text" column');
    }
    
    // Extract metadata from other columns
    const metadata: Record<string, any> = {};
    for (const [key, value] of Object.entries(record)) {
      if (key !== 'text' && value) {
        // Try to parse JSON values
        try {
          metadata[key] = JSON.parse(value as string);
        } catch {
          metadata[key] = value;
        }
      }
    }
    
    return {
      text: record.text,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };
  });
}

async function loadTextFile(filePath: string, separator: string = '\n\n'): Promise<DocumentData[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const documents = content.split(separator)
    .map(text => text.trim())
    .filter(text => text.length > 0)
    .map(text => ({ text }));
  
  return documents;
}

async function loadTextFileWithMetadata(filePath: string): Promise<DocumentData[]> {
  const documents: DocumentData[] = [];
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let currentDoc: Partial<DocumentData> = {};
  let inMetadata = false;
  let textLines: string[] = [];

  for await (const line of rl) {
    if (line === '---' && !inMetadata) {
      // Start of metadata
      inMetadata = true;
    } else if (line === '---' && inMetadata) {
      // End of metadata, start of text
      inMetadata = false;
    } else if (line === '===') {
      // Document separator
      if (textLines.length > 0) {
        currentDoc.text = textLines.join('\n').trim();
        if (currentDoc.text) {
          documents.push(currentDoc as DocumentData);
        }
      }
      currentDoc = {};
      textLines = [];
    } else if (inMetadata) {
      // Parse metadata line
      const match = line.match(/^(\w+):\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        if (!currentDoc.metadata) {
          currentDoc.metadata = {};
        }
        try {
          currentDoc.metadata[key] = JSON.parse(value);
        } catch {
          currentDoc.metadata[key] = value;
        }
      }
    } else {
      // Document text
      textLines.push(line);
    }
  }

  // Don't forget the last document
  if (textLines.length > 0) {
    currentDoc.text = textLines.join('\n').trim();
    if (currentDoc.text) {
      documents.push(currentDoc as DocumentData);
    }
  }

  return documents;
}

function extractMetadata(obj: any): Record<string, any> | undefined {
  const metadata: Record<string, any> = {};
  const excludeFields = ['text', 'doc_id', 'id'];
  
  for (const [key, value] of Object.entries(obj)) {
    if (!excludeFields.includes(key) && value !== undefined && value !== null) {
      metadata[key] = value;
    }
  }
  
  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const filePath = args[0];
  const options: LoadOptions = {
    batchSize: 10,
    dryRun: false,
    dbName: undefined
  };

  // Parse command line options
  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--batch-size':
      case '-b':
        options.batchSize = parseInt(args[++i], 10);
        break;
      case '--dry-run':
      case '-n':
        options.dryRun = true;
        break;
      case '--db':
      case '-d':
        options.dbName = args[++i];
        break;
      case '--format':
      case '-f':
        i++; // Skip format value, it's auto-detected
        break;
    }
  }

  try {
    // Ensure database directory exists
    ensureDataDirectory();

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Detect file format
    const ext = path.extname(filePath).toLowerCase();
    let documents: DocumentData[];

    logger.info(`Loading documents from ${filePath} (format: ${ext})`);

    switch (ext) {
      case '.json':
        documents = await loadJsonFile(filePath);
        break;
      case '.csv':
        documents = await loadCsvFile(filePath);
        break;
      case '.txt':
        // Check if it's a metadata format
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes('---\n') && content.includes('\n===')) {
          documents = await loadTextFileWithMetadata(filePath);
        } else {
          documents = await loadTextFile(filePath);
        }
        break;
      case '.md':
        documents = await loadTextFile(filePath, '\n## '); // Split on headers
        break;
      default:
        throw new Error(`Unsupported file format: ${ext}`);
    }

    logger.info(`Loaded ${documents.length} documents from file`);

    // Load documents
    const loader = new BatchLoader();
    await loader.loadDocuments(documents, options);

  } catch (error) {
    logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

function printUsage() {
  console.log(`
MCP Vector Server Batch Loader

Usage: npm run batch-load <file> [options]

Arguments:
  file                    Path to the file containing documents to load

Options:
  -h, --help             Show this help message
  -b, --batch-size <n>   Number of documents to process in parallel (default: 10)
  -n, --dry-run          Preview what would be loaded without inserting
  -d, --db <name>        Database name to use
  -f, --format <type>    File format (auto-detected by extension)

Supported File Formats:

1. JSON Array:
   ["text1", "text2", "text3"]

2. JSON Objects:
   [
     { "text": "...", "metadata": { "key": "value" } },
     { "text": "...", "title": "...", "category": "..." }
   ]

3. JSON with documents field (test-documents.json format):
   {
     "documents": [
       { "text": "...", "metadata": { ... } }
     ]
   }

4. CSV:
   text,category,tags
   "Document text",tech,"ai,ml"

5. Plain Text (separated by double newlines):
   First document text...

   Second document text...

6. Text with Metadata:
   ---
   title: Document Title
   category: tech
   tags: ["ai", "ml"]
   ---
   Document text goes here...
   ===
   ---
   title: Another Document
   ---
   Another document text...

Examples:
  # Load test documents
  npm run batch-load samples/test-documents.json

  # Dry run to preview
  npm run batch-load documents.csv --dry-run

  # Load with smaller batch size
  npm run batch-load large-dataset.json --batch-size 5

  # Load plain text file
  npm run batch-load articles.txt
`);
}

// Run if called directly
if (require.main === module) {
  main();
}

export { BatchLoader, loadJsonFile, loadCsvFile, loadTextFile, loadTextFileWithMetadata };