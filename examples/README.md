# Examples

このディレクトリには、MCPベクトルサーバーの使用例とテストスクリプトが含まれています。

## ファイル

### test-server.js
基本的なサーバー起動とHTTPエンドポイントのテストスクリプトです。

**用途:**
- サーバーの正常起動確認
- HTTPモードでのAPI動作テスト
- 基本的な動作確認

**実行方法:**
```bash
npm run build
node examples/test-server.js
```

### test-mcp-direct.js  
MCPツールの直接呼び出しテストスクリプトです。

**用途:**
- MCPツール機能の直接テスト
- ドキュメント挿入、検索、削除の動作確認
- パフォーマンス測定

**実行方法:**
```bash
npm run build
node examples/test-mcp-direct.js
```

**テスト内容:**
1. テストドキュメントの挿入
2. 類似ドキュメント検索
3. ドキュメント削除
4. 削除確認

### test-mcp-client.js
MCPプロトコルを使用したクライアント接続テストです。

**用途:**
- 実際のMCPクライアントとの接続テスト
- stdioモードでの通信確認
- プロトコルレベルでの動作確認

**実行方法:**
```bash
npm run build
node examples/test-mcp-client.js
```

## 使用シナリオ

### 1. 開発時のテスト
```bash
# 基本機能のテスト
npm run build
node examples/test-mcp-direct.js

# サーバー起動テスト
node examples/test-server.js
```

### 2. 本番前の動作確認
```bash
# MCPプロトコルでの統合テスト
node examples/test-mcp-client.js
```

### 3. パフォーマンステスト
`test-mcp-direct.js`を修正して、大量のドキュメントでのパフォーマンス測定に使用できます。

## 注意事項

- これらのスクリプトは開発・テスト用です
- 実行前に`npm run build`でTypeScriptをコンパイルしてください
- OpenAI APIキーが`.env`に設定されている必要があります
- サンプルデータは`samples/test-documents.json`から読み込まれます

## カスタマイズ

各スクリプトは用途に応じて修正して使用できます：

- テストデータの変更
- 検索クエリの追加
- エラーハンドリングの改善
- ログ出力の調整