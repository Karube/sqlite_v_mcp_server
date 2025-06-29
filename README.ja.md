# MCP Vector Server (sqlite-vec)

SQLiteとsqlite-vec拡張機能を使用してベクター類似性検索機能を提供するModel Context Protocol (MCP)サーバーです。日本語ドキュメントの保存とOpenAI埋め込みによる検索に最適化されています。

## 機能

- **ベクター検索**: sqlite-vecを使用した効率的なコサイン類似度検索
- **テキストチャンキング**: 日本語コンテンツに最適化されたインテリジェントなテキスト分割（700文字 + 100文字オーバーラップ）
- **OpenAI埋め込み**: 設定可能なモデル（3-small、3-large、ada-002）と調整可能な次元数
- **バッチローディング**: JSON、CSV、テキストファイルから複数のドキュメントをインポート
- **デュアルモード**: HTTPサーバー（JSON-RPC 2.0）とstdioモード（直接MCP通信）
- **TypeScript**: 厳格モードでの完全な型安全性

## 前提条件

- Node.js 20 LTS
- OpenAI APIキー
- macOSまたはLinux（sqlite-vecの制限によりWindowsはサポートされていません）

## インストール

```bash
# 依存関係をインストール
npm install

# 環境設定をコピー
cp .env.example .env

# .envを編集してOpenAI APIキーを設定
# OPENAI_API_KEY=sk-your-openai-api-key-here

# データベースマイグレーションを実行
npm run migrate

# プロジェクトをビルド
npm run build
```

## 使用方法

### HTTPモード（JSON-RPC 2.0）

```bash
# HTTPサーバーを起動（デフォルトポート3000）
npm start -- --http

# カスタムポートで起動
npm start -- --http --port 8080
```

### stdioモード（MCPプロトコル）

```bash
# stdioモードで起動
npm start -- --stdio
```

### 開発モード

```bash
# ホットリロード付き開発サーバー
npm run dev
```

## APIエンドポイント（HTTPモード）

### GET /tools
MCPツールマニフェストを返します。

### POST /rpc
ツール実行用のメインJSON-RPC 2.0エンドポイント。

### GET /health
ヘルスチェックエンドポイント。

## MCPツール

### insert_document
自動チャンキングと埋め込み生成でドキュメントを挿入します。

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "insert_document",
    "arguments": {
      "text": "ドキュメントのテキストをここに...",
      "metadata": { "title": "ドキュメントタイトル", "author": "著者名" }
    }
  }
}
```

**レスポンス:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "doc_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "chunk_count": 5
  }
}
```

### find_similar_documents
ベクター類似性を使用して類似ドキュメントを検索します。

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "find_similar_documents",
    "arguments": {
      "text": "検索クエリテキスト",
      "top_k": 10
    }
  }
}
```

**レスポンス:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "results": [
      {
        "chunk_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
        "doc_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
        "text": "マッチしたテキストチャンク...",
        "score": 0.95
      }
    ]
  }
}
```

### delete_document
ドキュメントとそのすべてのチャンクを削除します。

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "delete_document",
    "arguments": {
      "doc_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV"
    }
  }
}
```

**レスポンス:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "deleted_chunks": 5
  }
}
```

## 設定

環境変数:

| 変数 | デフォルト | 説明 |
|----------|---------|-------------|
| `OPENAI_API_KEY` | - | OpenAI APIキー（必須） |
| `DB_PATH` | `./data/vectors.db` | SQLiteデータベースパス |
| `PORT` | `3000` | HTTPサーバーポート |
| `LOG_LEVEL` | `info` | ログレベル |
| `CHUNK_SIZE` | `700` | テキストチャンクサイズ |
| `CHUNK_OVERLAP` | `100` | テキストチャンクオーバーラップ |
| `DEFAULT_TOP_K` | `10` | デフォルト検索結果数 |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | OpenAI埋め込みモデル |
| `EMBEDDING_DIMENSIONS` | `1536` | 埋め込みベクター次元数 |
| `EMBEDDING_BATCH_SIZE` | `100` | 埋め込みバッチごとの最大テキスト数 |
| `EMBEDDING_PROVIDER` | `openai` | 埋め込みプロバイダー（openaiのみ） |
| `EMBEDDING_ENCODING_FORMAT` | `float` | エンコーディング形式（float/base64） |

### 埋め込みモデル

サポートされるOpenAIモデルとその次元数範囲:

| モデル | 最小次元数 | 最大次元数 | デフォルト |
|-------|----------------|----------------|----------|
| `text-embedding-3-small` | 512 | 1536 | 1536 |
| `text-embedding-3-large` | 256 | 3072 | 3072 |
| `text-embedding-ada-002` | 1536 | 1536 | 1536 |

## バッチローディング

サーバーには、様々なファイル形式から複数のドキュメントを効率的にインポートするバッチローディングユーティリティが含まれています。

### クイックスタート

```bash
# JSONからドキュメントを読み込む
npm run batch-load samples/test-documents.json

# 挿入せずにプレビュー（ドライラン）
npm run batch-load samples/documents.csv --dry-run

# カスタムバッチサイズで読み込む
npm run batch-load data.json --batch-size 5
```

### サポートされる形式

- **JSON**: 文字列またはtext/metadataを持つオブジェクトの配列
- **CSV**: 'text'列が必須、他の列はメタデータになる
- **TXT**: ダブル改行区切りのプレーンテキストまたはメタデータヘッダー付き
- **カスタム形式**: 詳細は[docs/batch-loading.ja.md](./docs/batch-loading.ja.md)を参照

### 例

```bash
# 提供されているテストドキュメントを読み込む
npm run batch-load samples/test-documents.json

# インタラクティブな例を実行
node examples/batch-load-example.js
```

バッチローディングの詳細なドキュメントは[docs/batch-loading.ja.md](./docs/batch-loading.ja.md)を参照してください。

## 開発

```bash
# テストを実行
npm test

# コードをリント
npm run lint

# コードをフォーマット
npm run format

# ビルド
npm run build

# 開発サーバー
npm run dev
```

## データベーススキーマ

システムは2つのテーブルを使用します:

1. **chunks**（sqlite-vec仮想テーブル）: ULIDキー付きで埋め込みを保存
2. **chunk_metadata**: テキストコンテンツ、メタデータ、関係を保存

## パフォーマンス

- 目標: M1 Macで10kチャンクに対してP95 < 300ms
- sqlite-vecはブルートフォースKNNを使用（100万チャンク以上の場合はANNを検討）
- 並行読み取りのためのWALモード有効
- 埋め込みバッチ処理（最大100テキスト/リクエスト）

## サンプルデータ

[SAMPLE_QUERIES.md](./SAMPLE_QUERIES.md)を参照:
- 様々なカテゴリのテストドキュメント例
- 期待される結果を含むサンプル検索クエリ
- クロスドメイン検索例
- テストガイドライン

テストドキュメントは`samples/test-documents.json`で利用可能、以下をカバーする20のサンプルドキュメント:
- テクノロジー（クラウド、AI）
- 料理（日本料理、イタリア料理）
- 健康・スポーツ
- ビジネス・教育
- 旅行・環境
- アート・サイエンス

## ライセンス

MIT