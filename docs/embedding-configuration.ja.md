# 埋め込み設定ガイド

このガイドでは、MCP Vector Serverの埋め込みモデルの設定方法について説明します。

## 概要

MCP Vector Serverは設定可能な埋め込みモデルをサポートし、以下のことが可能です：
- 異なるOpenAI埋め込みモデル間の切り替え
- サポートされるモデルの埋め込み次元数の設定
- バッチ処理パラメータの調整
- 将来的な他の埋め込みプロバイダーのサポートへの準備

## 設定オプション

すべての埋め込み設定は環境変数を通じて行います：

### EMBEDDING_MODEL
- **デフォルト**: `text-embedding-3-small`
- **オプション**: 
  - `text-embedding-3-small` - 最新で最もコスト効率の良いモデル
  - `text-embedding-3-large` - 最高性能モデル
  - `text-embedding-ada-002` - レガシーモデル（1536次元固定）

### EMBEDDING_DIMENSIONS
- **デフォルト**: `1536`
- **範囲**: モデルによって異なります：
  - `text-embedding-3-small`: 512-1536
  - `text-embedding-3-large`: 256-3072
  - `text-embedding-ada-002`: 1536（固定）

### EMBEDDING_BATCH_SIZE
- **デフォルト**: `100`
- **範囲**: 1-2048
- OpenAI APIに1回のリクエストで送信するテキスト数を制御

### EMBEDDING_PROVIDER
- **デフォルト**: `openai`
- 現在は`openai`のみサポート

### EMBEDDING_ENCODING_FORMAT
- **デフォルト**: `float`
- **オプション**: `float`、`base64`

## 使用例

### text-embedding-3-smallで次元数を減らして使用
```bash
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=512
```

### text-embedding-3-largeで最高性能を実現
```bash
EMBEDDING_MODEL=text-embedding-3-large
EMBEDDING_DIMENSIONS=3072
```

### レガシーada-002モデルを使用
```bash
EMBEDDING_MODEL=text-embedding-ada-002
# このモデルの次元数は1536で固定
```

## 重要な注意事項

1. **データベースの互換性**: 埋め込み次元数を変更する場合、ベクターテーブルは固定次元で作成されるため、新しいデータベースを作成するか既存データを移行する必要があります。

2. **モデルのパフォーマンス**: 
   - 小さい次元数 = 高速検索、少ないストレージ、精度がやや低下する可能性
   - 大きい次元数 = 高精度、但しストレージ増加と検索速度の低下

3. **コストの考慮事項**:
   - `text-embedding-3-small`が最もコスト効率的
   - `text-embedding-3-large`は最高のパフォーマンスを提供するが、コストが高い
   - 精度要件と予算のバランスを考慮

4. **検証**: サーバーは起動時に設定を検証し、無効な設定では起動に失敗します。

## 移行ガイド

既存のデータベースで埋め込みモデルや次元数を変更する必要がある場合：

1. **ドキュメントをエクスポート**（テキストとメタデータ）
2. **新しい埋め込み設定を環境に設定**
3. **新しいデータベースを作成**（古いものを名前変更または移動）
4. **バッチローダーを使用してドキュメントを再インポート**

例：
```bash
# 1. 既存のデータベースをバックアップ
mv data/vectors.db data/vectors-old.db

# 2. 新しい設定を設定
export EMBEDDING_MODEL=text-embedding-3-large
export EMBEDDING_DIMENSIONS=3072

# 3. サーバーを起動（新しいデータベースが作成される）
npm start -- --http

# 4. ドキュメントを再インポート
npm run batch-load -- your-documents.json
```

## 将来の拡張

設定システムは将来的に追加の埋め込みプロバイダーをサポートするよう設計されています：
- Cohere
- Voyage AI
- カスタム埋め込みサーバー
- ローカル埋め込みモデル

これらが追加されると、`EMBEDDING_PROVIDER`変数を使用してプロバイダーを切り替えることができるようになります。