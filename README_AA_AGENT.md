# AA Agent - AI Article Automation System

AIエージェントによる記事自動生成システム（Research=OpenAI, Write=Claude）

## システム概要

AA Agentは、OpenAIによるWeb検索・エビデンス収集と、Claudeによる高品質記事生成を組み合わせた、Human-in-the-Loop（HITL）型の記事自動化システムです。

### 主要機能

1. **Evidence収集（OpenAI）**
   - Web検索による最新情報の収集
   - 引用・統計データの抽出
   - 新規性・信頼性・ビジネスインパクトのスコアリング

2. **審査（Inbox UI）**
   - 収集したEvidenceの一覧表示
   - 承認/却下によるフィルタリング
   - バルク操作対応

3. **記事生成（Claude）**
   - 承認済みEvidenceから記事生成
   - ペルソナ・トーン設定可能
   - SEO最適化（メタ情報・構造化データ）

4. **品質評価（OpenAI）**
   - 5軸評価（事実性・可読性・SEO・独自性・ビジネス価値）
   - 改善提案の自動生成
   - 80点以上で公開準備完了

## セットアップ

### 1. 環境変数の設定

`.env.local`ファイルを作成し、以下を設定：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Supabaseデータベースのセットアップ

Supabase SQL Editorで以下を実行：

```bash
# supabase/schema.sql の内容をコピーして実行
```

### 3. 依存関係のインストール

```bash
npm install
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

## 使用方法

### 1. Evidence収集

1. http://localhost:3000/inbox にアクセス
2. トピックを入力して「収集開始」をクリック
3. OpenAI APIがWeb検索して関連情報を収集

### 2. Evidence審査

1. 収集されたEvidenceカードが表示される
2. 各カードの「承認」または「却下」をクリック
3. 複数選択してバルク操作も可能

### 3. 記事生成

承認済みEvidenceから記事を生成：

```bash
# APIエンドポイント
POST /api/articles/draft
{
  "evidence_ids": ["uuid1", "uuid2"],
  "persona": "enterprise",
  "tone": "professional",
  "target": "経営層"
}
```

### 4. 品質評価

生成された記事の品質を評価：

```bash
# APIエンドポイント
POST /api/articles/{id}/qa
```

## API仕様

### Evidence収集
- `POST /api/evidence/collect` - トピックからEvidence収集
- `GET /api/evidence` - Evidence一覧取得
- `POST /api/evidence/{id}/approve` - Evidence承認
- `POST /api/evidence/{id}/reject` - Evidence却下

### 記事生成
- `POST /api/articles/draft` - 記事下書き生成
- `POST /api/articles/{id}/qa` - 品質評価実行

## データモデル

### evidence テーブル
- 収集したWeb情報を格納
- 引用・統計・スコアを含む
- ステータス管理（pending/approved/rejected）

### articles テーブル
- 生成された記事を格納
- アウトライン・本文・SEO情報を含む
- 品質スコアと改善提案

### feedback テーブル
- 承認/却下の履歴を記録
- 学習データとして活用

### api_logs テーブル
- 全APIコールを監査ログとして記録
- プロンプト・モデル・レスポンスを保存

## パフォーマンス目標

- 日300件のEvidence収集
- 日10本の記事ドラフト生成
- QAスコア80点以上を70%達成
- 1本あたりの人手修正時間 ≤10分

## 今後の拡張予定

- [ ] 認証機能の実装（Supabase Auth）
- [ ] スケジュール投稿機能
- [ ] 外部CMS連携（WordPress/Headless CMS）
- [ ] 学習プロファイルによる自動化率向上
- [ ] ダッシュボードとメトリクス表示

## トラブルシューティング

### OpenAI APIエラー
- APIキーの確認
- レート制限の確認
- モデル名の確認（gpt-4-turbo-preview）

### Claude APIエラー
- APIキーの確認
- モデル名の確認（claude-3-opus-20240229）
- JSON出力形式の確認

### Supabaseエラー
- RLSポリシーの確認
- Service Role Keyの設定確認
- テーブル作成の確認

## ライセンス

MIT