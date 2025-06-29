# Batch Loading Documents

The MCP Vector Server includes a batch loading script that allows you to efficiently load multiple documents from various file formats into the vector database.

## Quick Start

```bash
# Load documents from JSON file
npm run batch-load samples/test-documents.json

# Preview what would be loaded (dry run)
npm run batch-load samples/documents.csv --dry-run

# Load with custom batch size
npm run batch-load large-dataset.json --batch-size 5
```

## Command Line Options

```
npm run batch-load <file> [options]

Arguments:
  file                    Path to the file containing documents to load

Options:
  -h, --help             Show help message
  -b, --batch-size <n>   Number of documents to process in parallel (default: 10)
  -n, --dry-run          Preview what would be loaded without inserting
  -d, --db <name>        Database name to use
  -f, --format <type>    File format (auto-detected by extension)
```

## Supported File Formats

### 1. JSON Array (Simple)

File: `simple-documents.json`
```json
[
  "First document text...",
  "Second document text...",
  "Third document text..."
]
```

### 2. JSON Array (With Metadata)

File: `documents.json`
```json
[
  {
    "text": "Document content...",
    "metadata": {
      "category": "technology",
      "tags": ["AI", "ML"],
      "author": "John Doe"
    }
  },
  {
    "text": "Another document...",
    "title": "Document Title",
    "category": "science",
    "difficulty": "advanced"
  }
]
```

Note: Any fields other than `text` will be automatically extracted as metadata.

### 3. Test Documents Format

File: `test-documents.json`
```json
{
  "documents": [
    {
      "doc_id": "tech_001",
      "title": "Document Title",
      "text": "Document content...",
      "metadata": {
        "category": "technology",
        "tags": ["cloud", "computing"]
      }
    }
  ]
}
```

### 4. CSV Format

File: `documents.csv`
```csv
text,category,tags,difficulty
"Document text goes here",technology,"[""AI"",""ML""]",beginner
"Another document text",science,"[""physics"",""quantum""]",advanced
```

Notes:
- Must have a `text` column
- Other columns become metadata fields
- JSON values in cells are automatically parsed

### 5. Plain Text (Paragraph Separated)

File: `documents.txt`
```
First document paragraph. Can be multiple sentences.
Continues on multiple lines.

Second document starts after double newline.
Also can span multiple lines.

Third document...
```

### 6. Text with Metadata Headers

File: `documents-with-metadata.txt`
```
---
title: Document Title
category: technology
tags: ["AI", "ML", "NLP"]
difficulty: intermediate
---
Document content goes here. Can span
multiple lines and paragraphs.
===
---
title: Another Document
category: science
---
Another document's content...
===
```

## Features

### Batch Processing
- Documents are processed in configurable batches (default: 10)
- Prevents API rate limit issues with OpenAI embeddings
- Automatic retry and error handling
- Progress logging for large datasets

### Error Handling
- Continues processing even if individual documents fail
- Detailed error reporting at the end
- Summary statistics showing success/failure counts

### Performance Optimization
- Parallel processing within batches
- Configurable delay between batches
- Efficient memory usage for large files

## Example Usage

### Loading Test Documents

```bash
# Load the provided test documents
npm run batch-load samples/test-documents.json

# Output:
# [info]: Loading documents from samples/test-documents.json (format: .json)
# [info]: Loaded 20 documents from file
# [info]: Starting batch load of 20 documents
# [info]: Processing batch 1 (documents 1-10)
# [info]: Document 1 inserted successfully: doc_id=01JFGH..., chunks=3
# ...
# [info]: === Batch Load Summary ===
# [info]: Total documents processed: 20
# [info]: Successfully inserted: 20
# [info]: Failed: 0
```

### Dry Run Mode

Preview what would be loaded without actually inserting:

```bash
npm run batch-load samples/documents.csv --dry-run

# Output:
# [info]: DRY RUN MODE - No documents will be inserted
# [info]: [DRY RUN] Would insert document 1: 5Gは第5世代移動通信システムの略称で...
# [info]: [DRY RUN] Would insert document 2: サイバーセキュリティは、コンピュータシステムや...
```

### Loading Large Datasets

For large datasets, adjust the batch size:

```bash
# Smaller batches for rate-limited APIs
npm run batch-load large-dataset.json --batch-size 5

# Larger batches for local processing
npm run batch-load local-data.json --batch-size 50
```

## Programmatic Usage

The batch loader can also be used programmatically:

```typescript
import { BatchLoader, loadJsonFile } from './scripts/batch-load';

async function loadData() {
  const documents = await loadJsonFile('data/documents.json');
  const loader = new BatchLoader();
  
  await loader.loadDocuments(documents, {
    batchSize: 20,
    dryRun: false,
    dbName: 'my-database'
  });
}
```

## Best Practices

1. **Start with Dry Run**: Always test with `--dry-run` first to verify data format
2. **Appropriate Batch Size**: 
   - Use 5-10 for OpenAI API calls
   - Can increase to 50-100 for local processing only
3. **Monitor Rate Limits**: Watch for OpenAI API rate limit errors and adjust batch size
4. **Prepare Data**: 
   - Ensure text is not empty
   - Keep documents under 100,000 characters
   - Use consistent metadata structure
5. **Error Recovery**: 
   - Check error logs for failed documents
   - Re-run with only failed documents if needed

## Troubleshooting

### Common Issues

1. **Rate Limit Errors**
   - Reduce batch size: `--batch-size 5`
   - Add delay between batches in code

2. **Memory Issues with Large Files**
   - Process files in chunks
   - Use streaming for very large datasets

3. **Invalid JSON/CSV Format**
   - Validate JSON with `jq` or online validators
   - Ensure CSV has proper headers and escaping

4. **Empty Documents**
   - Script skips empty text fields
   - Check logs for skipped documents

### Getting Help

- Check sample files in `samples/` directory
- Run with `--help` for command options
- Enable debug logging with `LOG_LEVEL=debug`