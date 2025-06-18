# Tests

このディレクトリには、MCPベクトルサーバーのユニットテストが含まれています。

## テストファイル

### chunker.test.ts
テキストチャンキング機能のテストです。

**テスト内容:**
- 日本語テキストの分割
- チャンクサイズとオーバーラップの検証
- 境界条件のテスト

### create.test.ts  
データベース作成機能のテストです。

**テスト内容:**
- データベース名の検証
- ディレクトリ作成
- 既存データベースの処理
- エラーハンドリング

### db.test.ts
データベース管理機能のテストです。

**テスト内容:**
- データベース接続
- パス生成
- 接続キャッシュ
- DatabaseManagerクラス

### embed.test.ts
OpenAI埋め込み機能のテストです。

**テスト内容:**
- 埋め込み生成
- バッチ処理
- エラーハンドリング
- レート制限対応

### ulid.test.ts
ULID生成ユーティリティのテストです。

**テスト内容:**
- ULID生成
- 形式検証
- 一意性確認

### setup.ts
テスト環境の初期化設定です。

## 実行方法

### 全テスト実行
```bash
npm test
```

### 特定のテスト実行
```bash
npm test -- chunker.test.ts
npm test -- create.test.ts
npm test -- db.test.ts
npm test -- embed.test.ts
npm test -- ulid.test.ts
```

### ウォッチモード
```bash
npm test -- --watch
```

### カバレッジ表示
```bash
npm test -- --coverage
```

## テスト構成

### モック
- `better-sqlite3`: データベース操作
- `sqlite-vec`: ベクトル拡張
- `openai`: API呼び出し
- `fs`: ファイルシステム操作

### テストデータ
テストには以下のデータを使用：
- 短いテキストサンプル
- 日本語文字列
- 無効な入力値
- 境界値

## 設定

### jest.config.js
- TypeScript対応
- setup.tsでの初期化
- モック設定
- カバレッジ設定

## 注意事項

- テストは独立して実行される
- 外部APIへの実際の呼び出しは行わない
- データベースファイルは作成されない
- 環境変数は設定不要

## CI/CD

これらのテストはGitHub Actionsなどの自動化パイプラインで実行されることを想定しています：

```yaml
- name: Run tests
  run: npm test
  
- name: Check coverage
  run: npm test -- --coverage
```