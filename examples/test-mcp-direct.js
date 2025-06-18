require('dotenv').config();
const { insertDocument, findSimilarDocuments, deleteDocument } = require('../dist/tools/index');

async function runDirectTest() {
  console.log('MCP Server Direct Test\n');
  console.log('===================\n');
  
  try {
    // Test 1: Insert documents
    console.log('📝 Test 1: Inserting test documents...\n');
    
    const testDocs = [
      {
        doc_id: 'test1',
        text: 'React は、ユーザーインターフェースを構築するためのJavaScriptライブラリです。コンポーネントベースのアーキテクチャと仮想DOMを使用して、効率的なUI更新を実現します。',
        metadata: { category: 'frontend', framework: 'React' }
      },
      {
        doc_id: 'test2', 
        text: 'Vue.js は、プログレッシブなJavaScriptフレームワークです。シンプルさと柔軟性を重視し、段階的に採用できる設計が特徴です。リアクティブなデータバインディングを提供します。',
        metadata: { category: 'frontend', framework: 'Vue' }
      },
      {
        doc_id: 'test3',
        text: 'Express.js は、Node.js向けの軽量で柔軟なWebアプリケーションフレームワークです。REST APIの構築やWebサーバーの実装に広く使用されています。',
        metadata: { category: 'backend', framework: 'Express' }
      }
    ];
    
    for (const doc of testDocs) {
      const result = await insertDocument(doc);
      console.log(`✅ Inserted document: ${doc.doc_id}`);
      console.log(`   Chunks created: ${result.chunkCount}`);
      console.log(`   Total tokens: ${result.totalTokens}\n`);
    }
    
    // Test 2: Find similar documents
    console.log('\n🔍 Test 2: Finding similar documents...\n');
    
    const queries = [
      { text: 'UIコンポーネントのJavaScriptライブラリ', expected: 'React/Vue' },
      { text: 'Node.jsのWebフレームワーク', expected: 'Express' },
      { text: 'リアクティブなデータバインディング', expected: 'Vue' }
    ];
    
    for (const { text, expected } of queries) {
      console.log(`Query: "${text}"`);
      console.log(`Expected match: ${expected}\n`);
      
      const results = await findSimilarDocuments({
        text: text,
        top_k: 2
      });
      
      results.results.forEach((doc, i) => {
        console.log(`  ${i + 1}. Document: ${doc.doc_id}`);
        console.log(`     Similarity: ${(doc.score * 100).toFixed(1)}%`);
        // console.log(`     Metadata: ${JSON.stringify(doc.metadata)}`);
        console.log(`     Text: ${doc.text.substring(0, 80)}...`);
      });
      console.log('');
    }
    
    // Test 3: Delete document
    console.log('\n🗑️  Test 3: Deleting a document...\n');
    const deleteResult = await deleteDocument({ doc_id: 'test1' });
    console.log(`✅ Deleted document: test1`);
    console.log(`   Chunks removed: ${deleteResult.deletedChunks}\n`);
    
    // Verify deletion
    console.log('🔍 Verifying deletion...\n');
    const verifyResults = await findSimilarDocuments({
      text: 'React コンポーネント',
      top_k: 3
    });
    
    console.log(`Documents found: ${verifyResults.results.length}`);
    verifyResults.results.forEach(doc => {
      console.log(`  - ${doc.doc_id} (should not be test1)`);
    });
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...\n');
    await deleteDocument({ doc_id: 'test2' });
    await deleteDocument({ doc_id: 'test3' });
    console.log('✅ Cleanup complete');
    
    console.log('\n✨ All tests passed successfully!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
runDirectTest();