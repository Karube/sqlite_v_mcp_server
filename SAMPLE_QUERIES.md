# Sample Test Documents and Search Results

This document provides examples of test documents and expected search results for the MCP Vector Server.

## Test Documents Overview

| Doc ID | Title | Category | Subcategory | Keywords |
|--------|-------|----------|-------------|----------|
| tech_001 | クラウドコンピューティングの基礎 | technology | cloud | IaaS, PaaS, SaaS, スケーラビリティ |
| tech_002 | 機械学習アルゴリズムの分類 | technology | ai | 教師あり学習, 教師なし学習, 強化学習 |
| cooking_001 | 和食の基本調味料「さしすせそ」 | cooking | japanese | 砂糖, 塩, 酢, 醤油, 味噌 |
| cooking_002 | イタリア料理のパスタの種類と特徴 | cooking | italian | スパゲッティ, ペンネ, フェットチーネ |
| health_001 | 睡眠の質を向上させる方法 | health | sleep | 睡眠習慣, リラックス, 体内時計 |
| health_002 | バランスの良い食事の基本 | health | nutrition | 一汁三菜, 栄養バランス, 野菜摂取 |
| business_001 | プロジェクトマネジメントの基本手法 | business | management | ウォーターフォール, アジャイル, スクラム |
| business_002 | デジタルマーケティングの戦略 | business | marketing | SEO, SNS, コンテンツマーケティング |
| travel_001 | 日本の世界遺産巡り | travel | japan | 京都, 姫路城, 屋久島, 世界遺産 |
| travel_002 | ヨーロッパ鉄道旅行のすすめ | travel | europe | ユーレイルパス, TGV, 高速鉄道 |

## Sample Search Queries and Expected Results

### Query 1: "クラウドサービスの種類について教えて"
**Expected Top Results:**
1. **tech_001** (90%+) - Direct match on cloud computing concepts
2. **tech_002** (60-70%) - Related technology topic

**Reasoning:** The query directly relates to cloud services, which should strongly match with the cloud computing document.

### Query 2: "機械学習の基本を知りたい"
**Expected Top Results:**
1. **tech_002** (95%+) - Direct match on machine learning
2. **tech_001** (50-60%) - General technology relevance

**Reasoning:** Direct keyword match with machine learning content.

### Query 3: "健康的な生活習慣"
**Expected Top Results:**
1. **health_001** (85%+) - Sleep habits are part of healthy lifestyle
2. **health_002** (85%+) - Balanced diet is key to healthy living
3. **sports_002** (70%+) - Yoga contributes to health

**Reasoning:** Both health documents should score highly as they directly address healthy lifestyle habits.

### Query 4: "プロジェクトを効率的に進める方法"
**Expected Top Results:**
1. **business_001** (90%+) - Direct match on project management
2. **business_002** (60-70%) - Related business management topic

**Reasoning:** Project management document directly addresses efficient project execution.

### Query 5: "日本料理の基礎知識"
**Expected Top Results:**
1. **cooking_001** (95%+) - Japanese cooking fundamentals
2. **cooking_002** (40-50%) - General cooking relevance

**Reasoning:** Direct match with Japanese cuisine basics.

### Query 6: "ヨーロッパ旅行の計画"
**Expected Top Results:**
1. **travel_002** (90%+) - European travel by train
2. **travel_001** (40-50%) - General travel content

**Reasoning:** Strong match with European travel planning content.

### Query 7: "プログラミング学習の始め方"
**Expected Top Results:**
1. **education_002** (95%+) - Programming education
2. **education_001** (70%+) - General learning methods
3. **tech_002** (60%+) - Technical/programming related

**Reasoning:** Direct match with programming education content.

### Query 8: "環境問題への取り組み"
**Expected Top Results:**
1. **environment_001** (85%+) - Renewable energy for sustainability
2. **environment_002** (85%+) - Plastic pollution solutions

**Reasoning:** Both environmental documents address environmental issues and solutions.

### Query 9: "運動で健康維持"
**Expected Top Results:**
1. **sports_001** (85%+) - Marathon training for fitness
2. **sports_002** (85%+) - Yoga for health
3. **health_001** (70%+) - Exercise mentioned in sleep quality

**Reasoning:** Sports documents directly relate to exercise for health maintenance.

### Query 10: "最新技術のトレンド"
**Expected Top Results:**
1. **science_001** (85%+) - Quantum computing as cutting-edge tech
2. **science_002** (85%+) - CRISPR as revolutionary biotech
3. **tech_002** (75%+) - AI/ML as current tech trends

**Reasoning:** Science documents cover the most advanced technologies.

## Cross-Domain Query Examples

### Query: "デジタル時代の教育"
**Expected Top Results:**
1. **education_002** (85%+) - Programming education in digital age
2. **business_002** (70%+) - Digital marketing skills
3. **tech_002** (65%+) - Technology education aspects

### Query: "持続可能な生活"
**Expected Top Results:**
1. **environment_001** (85%+) - Sustainable energy
2. **environment_002** (85%+) - Reducing plastic waste
3. **travel_002** (60%+) - Sustainable travel by train

## Testing Notes

1. **Similarity scores** are approximations based on semantic relevance
2. **Chunking** may affect results - documents are split into ~700 character chunks
3. **Language mixing** (Japanese/English) may influence embedding quality
4. **Metadata filtering** can be used to narrow results by category
5. **Threshold settings** typically 0.5-0.7 for relevant results

## Usage Example

```javascript
// Insert test documents
const docs = require('./samples/test-documents.json');
for (const doc of docs.documents) {
  await insertDocument({
    doc_id: doc.doc_id,
    text: doc.text,
    metadata: doc.metadata
  });
}

// Search for similar documents
const results = await findSimilarDocuments({
  text: "クラウドサービスの種類について教えて",
  top_k: 5
});

// Results will include similarity scores and matching chunks
console.log(results.results);
```