# AI Media Automation System

プロフェッショナルAIエージェントチームによる高品質コンテンツ自動生成システム

## 🚀 主要機能

### AI エージェントチームシステム
5つの専門AIが連携して記事を作成:
- **🔍 リサーチャーAI**: 最新情報と信頼性の高いソースを収集
- **📊 アナリストAI**: データの信頼性評価と洞察の抽出
- **✍️ ライターAI**: プロ級の記事を執筆
- **📝 エディターAI**: 記事の品質向上と最終調整
- **🎯 SEO専門家AI**: 検索エンジン最適化

### リアル情報収集システム
- **Multi-Source Collection**: Google News, TechCrunch, Reddit, GitHub, arXiv等から並列収集
- **AI品質評価**: GPT-4oによる情報の信頼性・新規性・ビジネス影響の自動評価
- **HITL Workflow**: 人間によるレビューと承認プロセス

### 収集モード
1. **AIエージェントチーム**: 5つのAIが協力して深い分析と高品質記事を作成
2. **リアル検索**: Web上から実際の最新情報を収集
3. **テストデータ**: システム動作確認用のサンプルデータ生成

## Tech Stack

- **Frontend/Backend**: Next.js 15.5.2 with TypeScript
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: OpenAI GPT-4o + Anthropic Claude 3 Opus
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account
- Anthropic API key for Claude
- (Optional) Twitter API credentials
- (Optional) Reddit API credentials

### 2. Clone and Install

```bash
cd ai-media-automation
npm install
```

### 3. Configure Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema in `supabase/schema.sql` in the Supabase SQL editor
3. Copy your project URL and keys from the Settings > API section

### 4. Set Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key

# External APIs (optional)
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret

# System Settings
NEXT_PUBLIC_ARTICLES_PER_DAY=10
NEXT_PUBLIC_QUALITY_THRESHOLD=80
NEXT_PUBLIC_AUTO_PUBLISH_THRESHOLD=90

# Cron Secret (generate a random string)
CRON_SECRET=your_random_cron_secret
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the dashboard.

## 📋 使い方

### 1. Research Inbox での情報収集
`http://localhost:3000/inbox` にアクセス

1. **収集モードを選択**:
   - 🚀 **AIエージェントチーム**: 5つの専門AIが協力
   - 🔍 **リアル検索**: Web上から実際の情報収集
   - 📝 **テストデータ**: システム動作確認用

2. **トピックを入力**（例: "AI自動化ツール", "クラウドセキュリティ"）

3. **「エージェント実行」をクリック**

4. **レビューと承認**:
   - ✅ 承認: 価値の高い情報を採用
   - ❌ 却下: 関連性の低い情報を除外

### 2. テストページで動作確認
`http://localhost:3000/test` にアクセスして各機能をテスト

## System Architecture

### Data Flow

1. **Collection** → 2. **Analysis** → 3. **Generation** → 4. **Evaluation** → 5. **Review** → 6. **Publishing** → 7. **Learning**

### Key Components

- `/lib/claude.ts` - Claude API integration
- `/lib/collectors/` - Data collection from various sources
- `/lib/pipeline/` - Main article generation pipeline
- `/lib/learning/` - Performance learning system
- `/app/review/` - Human review interface

### API Endpoints

- `POST /api/agents/research-team` - AIエージェントチームによる記事作成
- `POST /api/evidence/collect-real` - リアル情報収集
- `POST /api/evidence/collect-simple` - テストデータ生成
- `POST /api/evidence/[id]/approve` - エビデンスを承認
- `POST /api/evidence/[id]/reject` - エビデンスを却下
- `POST /api/research/deep-dive` - 製品の深掘りリサーチ
- `POST /api/seo/analyze` - SEO分析と記事価値評価

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Automatic Scheduling

The `vercel.json` configures automatic cron jobs:

- Data collection: Every 30 minutes
- Pipeline run: Every 3 hours
- Learning cycle: Daily at midnight

## Manual Operations

### Run Pipeline Manually

Click "Run Pipeline Manually" on the homepage or:

```bash
curl http://localhost:3000/api/pipeline/run
```

### Review Articles

Visit `/review` to:
- Review pending articles
- Edit content and titles
- Approve or reject articles
- View quality scores

## Cost Estimation

### Monthly Costs (300 articles)

- OpenAI GPT-4o: ~$150 (情報収集・評価)
- Claude 3 Opus: ~$150 (記事生成)
- Supabase: Free tier (or ~$25 for Pro)
- Vercel: Free tier (or ~$20 for Pro)
- **Total**: ~$300-350/month

### Expected ROI

- Month 3: 10k PV → $50 revenue
- Month 6: 50k PV → $250 revenue
- Month 12: 200k PV → $1000 revenue

## Monitoring

Check system logs in Supabase:

```sql
SELECT * FROM system_logs 
ORDER BY created_at DESC 
LIMIT 100;
```

## Customization

### Add New Data Sources

1. Create collector in `/lib/collectors/`
2. Extend `BaseCollector` class
3. Add to `DataCollectionOrchestrator`

### Modify Prompts

Edit prompt templates in the database or update defaults in `/lib/pipeline/index.ts`

### Adjust Quality Thresholds

Update environment variables:
- `NEXT_PUBLIC_QUALITY_THRESHOLD` - Minimum quality for review
- `NEXT_PUBLIC_AUTO_PUBLISH_THRESHOLD` - Auto-approve threshold

## Troubleshooting

### No Articles Generated
- Check Claude API key is valid
- Verify data sources are configured
- Review system logs for errors

### Low Quality Scores
- Adjust prompt templates
- Run learning cycle to improve
- Check evaluation criteria

### Collection Not Working
- Verify API credentials
- Check data source configuration
- Review collector logs

## License

MIT

## Support

For issues or questions, please open a GitHub issue.
