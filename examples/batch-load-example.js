#!/usr/bin/env node

/**
 * Example: Batch Loading Documents into MCP Vector Server
 * 
 * This example demonstrates how to use the batch loading functionality
 * to insert multiple documents from different file formats.
 */

const { spawn } = require('child_process');
const path = require('path');

async function runBatchLoad(file, options = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n=== Loading documents from ${file} ===`);
    console.log(`Options: ${options.join(' ') || 'none'}\n`);

    const args = [
      'run',
      'batch-load',
      file,
      ...options
    ];

    const proc = spawn('npm', args, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

async function main() {
  try {
    console.log('MCP Vector Server - Batch Loading Example');
    console.log('=========================================\n');

    // Example 1: Dry run to preview what would be loaded
    console.log('1. Preview documents (dry run)');
    await runBatchLoad('samples/simple-documents.json', ['--dry-run']);

    // Wait for user confirmation
    console.log('\nPress Enter to continue with actual loading...');
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

    // Example 2: Load simple JSON documents
    console.log('\n2. Load simple JSON documents');
    await runBatchLoad('samples/simple-documents.json');

    // Example 3: Load CSV documents with metadata
    console.log('\n3. Load CSV documents');
    await runBatchLoad('samples/documents.csv', ['--batch-size', '3']);

    // Example 4: Load text documents
    console.log('\n4. Load plain text documents');
    await runBatchLoad('samples/documents.txt');

    // Example 5: Load documents with metadata headers
    console.log('\n5. Load documents with metadata');
    await runBatchLoad('samples/documents-with-metadata.txt');

    console.log('\n=== Batch loading completed successfully! ===');
    console.log('\nYou can now search these documents using the MCP tools:');
    console.log('- Use find_similar_documents to search by text similarity');
    console.log('- Documents are chunked and embedded for efficient retrieval');
    
    // Example search query
    console.log('\nExample search query:');
    console.log('await findSimilarDocuments({');
    console.log('  text: "人工知能の応用",');
    console.log('  top_k: 5');
    console.log('});');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Check if batch-load script exists
const fs = require('fs');
const batchLoadScript = path.join(__dirname, '..', 'scripts', 'batch-load.ts');
if (!fs.existsSync(batchLoadScript)) {
  console.error('Error: batch-load.ts script not found');
  console.error('Please ensure you are running this from the project directory');
  process.exit(1);
}

// Run the example
console.log('Starting batch load example...');
console.log('Make sure you have set OPENAI_API_KEY in your environment.\n');

main();