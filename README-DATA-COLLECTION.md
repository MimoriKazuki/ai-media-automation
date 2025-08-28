# 🚀 強化版AIデータ収集・自動記事生成システム

## 概要
世界中のAIトレンドを自動収集し、分析して日本語の記事を自動生成するシステムです。

## 📊 データ収集ソース

### 1. **Hacker News** 🔥
- AIに関連する最新の技術ニュース
- スタートアップ情報
- 開発者コミュニティのトレンド

### 2. **Product Hunt** 🚀
- 新しいAIプロダクトとサービス
- イノベーティブなツール
- 市場のトレンド

### 3. **Reddit** 📱
収集対象サブレディット：
- r/MachineLearning
- r/artificial
- r/LocalLLaMA
- r/singularity
- r/OpenAI
- r/ClaudeAI
- r/GoogleGemini
- r/StableDiffusion
- r/AIArt
- r/AGI
- r/deeplearning
- r/LanguageTechnology

### 4. **AI企業ブログ** 🏢
- OpenAI Blog
- Anthropic News
- Google AI Blog
- Meta AI
- Microsoft AI Blog
- NVIDIA AI Blog
- Hugging Face Blog
- Stability AI

### 5. **学術論文** 📚
- ArXiv (cs.AI, cs.LG, cs.CL)
- 最新の研究成果
- ブレークスルー論文

### 6. **GitHub Trending** 💻
- AIプロジェクトのトレンド
- 新しいフレームワーク
- オープンソースツール

### 7. **TechCrunch** 📰
- AI関連のビジネスニュース
- 投資情報
- 業界動向

### 8. **RSS フィード** 📡
- MIT Technology Review
- VentureBeat AI
- The Verge AI
- その他多数のテックメディア

## 🔄 自動パイプライン

### ワークフロー
```
1. データ収集 (8つのソースから並列収集)
   ↓
2. トレンド分析 (AI関連キーワードの抽出と重要度評価)
   ↓
3. トピック選定 (上位5つのトレンドを選択)
   ↓
4. 記事自動生成 (Claude APIを使用した日本語記事)
   ↓
5. 品質評価 (SEO、読みやすさ、独創性をスコアリング)
   ↓
6. 自動公開/レビュー (スコア90以上は自動公開)
```

### トレンド分析アルゴリズム
- **頻出度**: 複数のソースで言及されているトピック
- **新しさ**: 24時間以内の情報を優先
- **関連性**: AI関連キーワードとの一致度
- **エンゲージメント**: コメント数、投票数、スター数

## 🎯 使い方

### 管理画面から実行
1. http://localhost:3002/admin にアクセス
2. 「🚀 AIパイプライン」ボタンをクリック
3. 自動的に収集→分析→記事生成が実行される

### APIで実行
```bash
# 完全自動パイプライン実行
curl -X POST http://localhost:3002/api/pipeline/auto-generate

# データ収集のみ
curl -X POST http://localhost:3002/api/test?mode=collect

# 記事生成のみ（既存データから）
curl -X POST http://localhost:3002/api/test?mode=generate
```

## 📈 期待される成果

- **量**: 1回の実行で5-10件の高品質記事を生成
- **質**: SEOスコア80以上、読みやすさスコア80以上
- **鮮度**: 24時間以内の最新トレンドをカバー
- **多様性**: 技術、ビジネス、研究、プロダクトなど幅広い視点

## 🔧 カスタマイズ

### キーワード追加
`lib/collectors/hackernews.ts`の`aiKeywords`配列に追加：
```typescript
private readonly aiKeywords = [
  'your-keyword-here',
  // ...
];
```

### 新しいデータソース追加
1. `lib/collectors/`に新しいコレクタークラスを作成
2. `BaseCollector`を継承
3. `collect()`メソッドを実装
4. `lib/collectors/index.ts`に統合

## 🚦 ステータス確認

管理画面で以下の情報が確認可能：
- 収集したデータ数
- 生成された記事数
- エラーログ
- 品質スコア分布

## 📝 注意事項

- APIレート制限に注意（特にReddit、GitHub）
- Anthropic APIキーが必要（.env.localに設定）
- データベース接続は任意（なくても動作可能）

## 🆘 トラブルシューティング

### 記事が生成されない
- Anthropic APIキーを確認
- ネットワーク接続を確認
- ログでエラーを確認

### データ収集が少ない
- 各ソースのAPIステータスを確認
- フィルタリングキーワードを調整
- 時間帯を変えて再実行

## 🎉 成功のポイント

1. **定期実行**: 1日2-3回の実行で常に最新情報をキャッチ
2. **品質重視**: 量より質を重視した記事生成
3. **継続的改善**: 生成された記事のパフォーマンスをフィードバック