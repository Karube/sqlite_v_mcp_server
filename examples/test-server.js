// Test HTTP server with mock data
const fetch = require('node-fetch');

async function testServer() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test health endpoint
    console.log('Testing /health endpoint...');
    const healthRes = await fetch(`${baseUrl}/health`);
    const health = await healthRes.json();
    console.log('✅ Health check:', health);
    
    // Test tools manifest
    console.log('\nTesting /tools endpoint...');
    const toolsRes = await fetch(`${baseUrl}/tools`);
    const tools = await toolsRes.json();
    console.log('✅ Tools manifest:', JSON.stringify(tools, null, 2));
    
    // Test RPC endpoint (will fail due to API key limitations)
    console.log('\nTesting /rpc endpoint with insert_document...');
    const rpcRes = await fetch(`${baseUrl}/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'insert_document',
          arguments: {
            text: 'これはテストドキュメントです。',
            metadata: { test: true }
          }
        }
      })
    });
    
    const rpcResult = await rpcRes.json();
    console.log('RPC Response:', JSON.stringify(rpcResult, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Wait for server to start
console.log('Please start the server with: npm start -- --http');
console.log('Then press Enter to run tests...');

process.stdin.once('data', () => {
  testServer();
});