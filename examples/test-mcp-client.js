const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { spawn } = require('child_process');

async function testMCPServer() {
  console.log('Starting MCP server test...\n');
  
  // Start the server
  const serverProcess = spawn('node', ['../dist/server/stdio.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env }
  });
  
  // Create transport
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['../dist/server/stdio.js'],
    env: process.env
  });
  
  // Create client
  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });
  
  try {
    // Connect
    await client.connect(transport);
    console.log('✅ Connected to MCP server\n');
    
    // List available tools
    const tools = await client.listTools();
    console.log('Available tools:');
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log('');
    
    // Test 1: Insert documents
    console.log('Test 1: Inserting test documents...');
    const docs = [
      {
        doc_id: 'doc1',
        text: 'Node.jsは、サーバーサイドでJavaScriptを実行するためのプラットフォームです。非同期I/Oとイベントドリブンアーキテクチャを特徴とし、高速でスケーラブルなネットワークアプリケーションの構築に適しています。',
        metadata: { category: 'programming', topic: 'Node.js' }
      },
      {
        doc_id: 'doc2', 
        text: 'Pythonは、シンプルで読みやすい構文を持つプログラミング言語です。機械学習、データ分析、Web開発など幅広い分野で使用されています。豊富なライブラリエコシステムが特徴です。',
        metadata: { category: 'programming', topic: 'Python' }
      },
      {
        doc_id: 'doc3',
        text: 'TypeScriptは、JavaScriptに型定義を追加したプログラミング言語です。大規模なアプリケーション開発において、型安全性とコードの保守性を向上させます。',
        metadata: { category: 'programming', topic: 'TypeScript' }
      }
    ];
    
    for (const doc of docs) {
      const result = await client.callTool('insert_document', doc);
      console.log(`  ✓ Inserted ${doc.doc_id}: ${result.content[0].text}`);
    }
    console.log('');
    
    // Test 2: Search for similar documents
    console.log('Test 2: Searching for similar documents...');
    const queries = [
      'JavaScriptの実行環境について',
      'データ分析に適したプログラミング言語',
      '型安全なJavaScript'
    ];
    
    for (const query of queries) {
      console.log(`\n  Query: "${query}"`);
      const result = await client.callTool('find_similar_documents', {
        query,
        limit: 2
      });
      
      const response = JSON.parse(result.content[0].text);
      response.results.forEach((doc, i) => {
        console.log(`    ${i + 1}. [${doc.doc_id}] Score: ${doc.similarity_score.toFixed(3)}`);
        console.log(`       Text: ${doc.text.substring(0, 100)}...`);
      });
    }
    
    // Test 3: Delete a document
    console.log('\n\nTest 3: Deleting a document...');
    const deleteResult = await client.callTool('delete_document', { doc_id: 'doc1' });
    console.log(`  ✓ ${deleteResult.content[0].text}`);
    
    // Verify deletion
    console.log('\n  Verifying deletion by searching again...');
    const verifyResult = await client.callTool('find_similar_documents', {
      query: 'Node.js',
      limit: 3
    });
    
    const verifyResponse = JSON.parse(verifyResult.content[0].text);
    console.log(`  Found ${verifyResponse.results.length} documents (should not include doc1)`);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await client.close();
    serverProcess.kill();
  }
}

// Run the test
testMCPServer().catch(console.error);