# MCP ベクトルサーバー (sqlite-vec)

SQLiteとsqlite-vec拡張を使用してベクトル類似検索機能を提供するModel Context Protocol (MCP) サーバーです。OpenAI埋め込みを使用した日本語ドキュメントの保存に最適化されています。

## 機能

- **ベクトル検索**: sqlite-vecを使用した効率的なコサイン類似度検索
- **テキストチャンキング**: 日本語コンテンツに最適化されたインテリジェントなテキスト分割（700文字 + 100文字オーバーラップ）
- **OpenAI埋め込み**: text-embedding-3-small（1536次元）とバッチ処理
- **デュアルモード**: HTTPサーバー（JSON-RPC 2.0）と直接MCP通信用のstdioモード
- **TypeScript**: 厳密モードでの完全な型安全性

## 前提条件

- Node.js 20 LTS
- OpenAI APIキー
- macOS または Linux（sqlite-vecの制限によりWindowsは未対応）

## インストール

```bash
# 依存関係をインストール
npm install

# 環境設定をコピー
cp .env.example .env

# .envを編集してOpenAI APIキーを設定
# OPENAI_API_KEY=sk-your-openai-api-key-here

# データベースマイグレーション実行
npm run migrate

# プロジェクトをビルド
npm run build
```

## 使用方法

### HTTPモード（JSON-RPC 2.0）

```bash
# HTTPサーバーを開始（デフォルトポート3000）
npm start -- --http

# カスタムポートで開始
npm start -- --http --port 8080
```

### stdioモード（MCPプロトコル）

```bash
# stdioモードで開始
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
      "text": "ここにドキュメントテキストを入力...",
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
ベクトル類似度を使用して類似ドキュメントを検索します。

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
|------|-----------|------|
| `OPENAI_API_KEY` | - | OpenAI APIキー（必須） |
| `DB_PATH` | `./data/vectors.db` | SQLiteデータベースパス |
| `PORT` | `3000` | HTTPサーバーポート |
| `LOG_LEVEL` | `info` | ログレベル |
| `CHUNK_SIZE` | `700` | テキストチャンクサイズ |
| `CHUNK_OVERLAP` | `100` | テキストチャンクオーバーラップ |
| `DEFAULT_TOP_K` | `10` | デフォルト検索結果数 |

## 開発

```bash
# テスト実行
npm test

# コードリント
npm run lint

# コードフォーマット
npm run format

# ビルド
npm run build

# 開発サーバー
npm run dev
```

## データベーススキーマ

システムは2つのテーブルを使用します：

1. **chunks**（sqlite-vec仮想テーブル）: ULIDキーで埋め込みを保存
2. **chunk_metadata**: テキストコンテンツ、メタデータ、関係性を保存

## パフォーマンス

- 目標: M1 Mac上で10kチャンクに対してP95 < 300ms
- sqlite-vecはブルートフォースKNNを使用（100万チャンク以上ではANNを検討）
- 同時読み取り用のWALモード有効
- 埋め込みバッチ処理（最大100テキスト/リクエスト）

## サンプルデータ

詳細は[SAMPLE_QUERIES.jp.md](./SAMPLE_QUERIES.jp.md)を参照：
- 各種カテゴリーのテストドキュメント例
- 期待される結果を含むサンプル検索クエリ
- クロスドメイン検索例
- テストガイドライン

`samples/test-documents.json`には以下をカバーする20のサンプルドキュメントが含まれています：
- 技術（クラウド、AI）
- 料理（和食、イタリア料理）
- 健康・スポーツ
- ビジネス・教育
- 旅行・環境
- アート・科学

## ライセンス

MIT