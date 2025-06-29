# バッチローディング機能

MCP Vector Serverには、様々なファイル形式から複数のドキュメントを効率的にベクターデータベースに読み込むバッチローディングスクリプトが含まれています。

## クイックスタート

```bash
# JSONファイルからドキュメントを読み込む
npm run batch-load samples/test-documents.json

# 実際に読み込まずにプレビュー（ドライラン）
npm run batch-load samples/documents.csv --dry-run

# カスタムバッチサイズで読み込む
npm run batch-load large-dataset.json --batch-size 5
```

## コマンドラインオプション

```
npm run batch-load <file> [options]

引数:
  file                    読み込むドキュメントを含むファイルのパス

オプション:
  -h, --help             ヘルプメッセージを表示
  -b, --batch-size <n>   並列処理するドキュメント数（デフォルト: 10）
  -n, --dry-run          実際に挿入せずにプレビュー
  -d, --db <name>        使用するデータベース名
  -f, --format <type>    ファイル形式（拡張子から自動検出）
```

## サポートされるファイル形式

### 1. JSONアレイ（シンプル）

ファイル: `simple-documents.json`
```json
[
  "最初のドキュメントテキスト...",
  "2番目のドキュメントテキスト...",
  "3番目のドキュメントテキスト..."
]
```

### 2. JSONアレイ（メタデータ付き）

ファイル: `documents.json`
```json
[
  {
    "text": "ドキュメントの内容...",
    "metadata": {
      "category": "technology",
      "tags": ["AI", "ML"],
      "author": "山田太郎"
    }
  },
  {
    "text": "別のドキュメント...",
    "title": "ドキュメントタイトル",
    "category": "science",
    "difficulty": "advanced"
  }
]
```

注意: `text`以外のフィールドは自動的にメタデータとして抽出されます。

### 3. テストドキュメント形式

ファイル: `test-documents.json`
```json
{
  "documents": [
    {
      "doc_id": "tech_001",
      "title": "ドキュメントタイトル",
      "text": "ドキュメントの内容...",
      "metadata": {
        "category": "technology",
        "tags": ["cloud", "computing"]
      }
    }
  ]
}
```

### 4. CSV形式

ファイル: `documents.csv`
```csv
text,category,tags,difficulty
"ドキュメントテキストがここに入ります",technology,"[""AI"",""ML""]",beginner
"別のドキュメントテキスト",science,"[""physics"",""quantum""]",advanced
```

注意事項:
- `text`列が必須です
- その他の列はメタデータフィールドになります
- セル内のJSON値は自動的にパースされます

### 5. プレーンテキスト（段落区切り）

ファイル: `documents.txt`
```
最初のドキュメントの段落。複数の文を含むことができます。
複数行にまたがることも可能です。

2番目のドキュメントは2つの改行の後から始まります。
こちらも複数行に対応しています。

3番目のドキュメント...
```

### 6. メタデータヘッダー付きテキスト

ファイル: `documents-with-metadata.txt`
```
---
title: ドキュメントタイトル
category: technology
tags: ["AI", "ML", "NLP"]
difficulty: intermediate
---
ドキュメントの内容がここに入ります。複数行や
段落にまたがることができます。
===
---
title: 別のドキュメント
category: science
---
別のドキュメントの内容...
===
```

## 機能

### バッチ処理
- 設定可能なバッチサイズでドキュメントを処理（デフォルト: 10）
- OpenAI埋め込みAPIのレート制限を回避
- 自動リトライとエラーハンドリング
- 大規模データセットの進捗ログ

### エラーハンドリング
- 個別のドキュメントが失敗しても処理を継続
- 最後に詳細なエラーレポート
- 成功/失敗数を示すサマリー統計

### パフォーマンス最適化
- バッチ内での並列処理
- バッチ間の設定可能な遅延
- 大規模ファイルの効率的なメモリ使用

## 使用例

### テストドキュメントの読み込み

```bash
# 提供されているテストドキュメントを読み込む
npm run batch-load samples/test-documents.json

# 出力:
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

### ドライランモード

実際に挿入せずに読み込まれる内容をプレビュー:

```bash
npm run batch-load samples/documents.csv --dry-run

# 出力:
# [info]: DRY RUN MODE - No documents will be inserted
# [info]: [DRY RUN] Would insert document 1: 5Gは第5世代移動通信システムの略称で...
# [info]: [DRY RUN] Would insert document 2: サイバーセキュリティは、コンピュータシステムや...
```

### 大規模データセットの読み込み

大規模データセットの場合、バッチサイズを調整します:

```bash
# レート制限のあるAPIの場合は小さめのバッチ
npm run batch-load large-dataset.json --batch-size 5

# ローカル処理の場合は大きめのバッチ
npm run batch-load local-data.json --batch-size 50
```

## プログラムからの使用

バッチローダーはプログラムからも使用できます:

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

## ベストプラクティス

1. **まずドライランから**: データ形式を確認するため、必ず最初は`--dry-run`でテスト
2. **適切なバッチサイズ**: 
   - OpenAI APIコールには5-10を使用
   - ローカル処理のみの場合は50-100まで増やすことが可能
3. **レート制限の監視**: OpenAI APIのレート制限エラーに注意し、バッチサイズを調整
4. **データの準備**: 
   - テキストが空でないことを確認
   - ドキュメントは100,000文字以下に保つ
   - 一貫したメタデータ構造を使用
5. **エラー回復**: 
   - 失敗したドキュメントのエラーログを確認
   - 必要に応じて失敗したドキュメントのみ再実行

## トラブルシューティング

### よくある問題

1. **レート制限エラー**
   - バッチサイズを減らす: `--batch-size 5`
   - コード内でバッチ間の遅延を追加

2. **大規模ファイルでのメモリ問題**
   - ファイルをチャンクで処理
   - 非常に大きなデータセットにはストリーミングを使用

3. **無効なJSON/CSV形式**
   - `jq`やオンラインバリデーターでJSONを検証
   - CSVに適切なヘッダーとエスケープがあることを確認

4. **空のドキュメント**
   - スクリプトは空のテキストフィールドをスキップ
   - スキップされたドキュメントのログを確認

### ヘルプ

- `samples/`ディレクトリのサンプルファイルを確認
- `--help`でコマンドオプションを確認
- `LOG_LEVEL=debug`でデバッグログを有効化