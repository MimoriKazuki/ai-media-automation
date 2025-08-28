import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { sbServer } from "@/lib/supabase/server";
import type { EvidenceInsert } from "@/types/database";

// 製品/サービスの深掘り調査を行い、記事作成に必要な全データを収集
export async function POST(req: NextRequest) {
  try {
    const { product, category = "AI Tool" } = await req.json();
    
    if (!product) {
      return NextResponse.json(
        { ok: false, error: "製品名を指定してください" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const sb = sbServer();
    
    // 複数の観点から情報を収集
    const researchTasks = [
      collectProductInfo(product, category, openai),
      collectUserReviews(product, openai),
      collectCompetitorData(product, category, openai),
      collectPricingData(product, openai),
      collectUseCases(product, category, openai),
      collectImplementationGuide(product, openai),
      collectFAQs(product, openai),
      collectMarketTrends(product, category, openai)
    ];
    
    // 並列実行
    const results = await Promise.all(researchTasks);
    
    // 収集したデータを統合
    const comprehensiveData = {
      product_info: results[0],
      user_reviews: results[1],
      competitors: results[2],
      pricing: results[3],
      use_cases: results[4],
      implementation: results[5],
      faqs: results[6],
      market_trends: results[7]
    };
    
    // 記事のアウトライン生成
    const articleOutline = await generateArticleOutline(product, comprehensiveData, openai);
    
    // エビデンスとして保存
    const evidences: EvidenceInsert[] = [];
    
    // 製品情報をエビデンスとして保存
    evidences.push({
      title: `${product} 完全ガイド - 製品詳細情報`,
      url: `internal://research/${product}/product-info`,
      domain: "deep-research",
      published_at: new Date().toISOString(),
      summary: JSON.stringify(results[0]),
      quotes: extractQuotes(results[1]),
      stats: extractStats(results[3]),
      scores: {
        novelty: 8,
        credibility: 10,
        biz_impact: 9
      },
      source_type: "news",
      status: "approved",
      tags: [product, category, "製品情報", "深掘り調査"]
    });
    
    // 競合分析をエビデンスとして保存
    evidences.push({
      title: `${product} vs 競合製品 - 詳細比較分析`,
      url: `internal://research/${product}/competitor-analysis`,
      domain: "deep-research",
      published_at: new Date().toISOString(),
      summary: JSON.stringify(results[2]),
      quotes: [],
      stats: extractComparisonStats(results[2]),
      scores: {
        novelty: 7,
        credibility: 9,
        biz_impact: 10
      },
      source_type: "news",
      status: "approved",
      tags: [product, "競合分析", "比較"]
    });
    
    // ユースケースをエビデンスとして保存
    evidences.push({
      title: `${product} 導入事例と活用シーン`,
      url: `internal://research/${product}/use-cases`,
      domain: "deep-research",
      published_at: new Date().toISOString(),
      summary: JSON.stringify(results[4]),
      quotes: extractCaseQuotes(results[4]),
      stats: extractCaseStats(results[4]),
      scores: {
        novelty: 6,
        credibility: 10,
        biz_impact: 9
      },
      source_type: "news",
      status: "approved",
      tags: [product, "事例", "活用方法"]
    });
    
    // Supabaseに保存
    if (evidences.length > 0) {
      const { data: inserted, error } = await sb
        .from("evidence")
        .upsert(evidences, { onConflict: "url", ignoreDuplicates: false })
        .select();
        
      if (error) {
        console.error("Supabase error:", error);
      }
    }
    
    return NextResponse.json({ 
      ok: true,
      product,
      comprehensive_data: comprehensiveData,
      article_outline: articleOutline,
      evidences: evidences.length,
      message: `${product}の深掘り調査が完了しました`
    });
    
  } catch (error) {
    console.error("Deep research error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "深掘り調査中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

// 製品情報を収集
async function collectProductInfo(product: string, category: string, openai: OpenAI) {
  const prompt = `
「${product}」という${category}について、以下の情報を調査してください：

1. 基本情報
- 開発企業/創業者
- 設立年/リリース年
- 本社所在地
- 資金調達状況
- 従業員数

2. 主要機能（詳細）
- コア機能の詳細説明
- ユニークな機能
- 技術的な仕組み
- AI/MLモデルの詳細

3. 対象ユーザー
- 主要ターゲット層
- 企業規模
- 業界/職種

4. 日本市場での展開
- 日本法人の有無
- 日本語対応レベル
- 日本での導入企業数

JSON形式で返してください。
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "あなたは製品リサーチの専門家です。正確な情報のみを提供してください。" },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(completion.choices[0].message.content || "{}");
}

// ユーザーレビューを収集
async function collectUserReviews(product: string, openai: OpenAI) {
  const prompt = `
「${product}」のユーザーレビューと評価について調査してください：

1. 総合評価
- G2、Capterra、TrustRadius等での平均評価
- レビュー数
- NPS（Net Promoter Score）

2. ポジティブな評価（具体的に）
- よく褒められる機能
- 満足度の高いポイント
- 実際のユーザーコメント（3つ以上）

3. ネガティブな評価（正直に）
- よく指摘される問題点
- 改善要望
- 実際の批判的コメント（3つ以上）

4. 使用感
- 学習曲線
- UI/UXの評価
- サポート体制の評価

JSON形式で返してください。
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "あなたはユーザーレビューの分析専門家です。ポジティブ・ネガティブ両方を公平に評価してください。" },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(completion.choices[0].message.content || "{}");
}

// 競合製品データを収集
async function collectCompetitorData(product: string, category: string, openai: OpenAI) {
  const prompt = `
「${product}」の主要競合製品を分析してください：

1. 主要競合製品（5つ以上）
各製品について：
- 製品名
- 開発企業
- 主要機能
- 価格帯
- 強み/弱み
- 差別化ポイント

2. 比較表
- 機能比較マトリックス
- 価格比較
- 性能比較
- 対応言語/地域

3. ポジショニング
- ${product}の市場での位置づけ
- 独自の強み
- 弱点と改善余地

JSON形式で詳細に返してください。
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "あなたは競合分析の専門家です。客観的で詳細な比較を提供してください。" },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(completion.choices[0].message.content || "{}");
}

// 価格データを収集
async function collectPricingData(product: string, openai: OpenAI) {
  const prompt = `
「${product}」の料金体系について詳細に調査してください：

1. 料金プラン（全プラン）
各プランについて：
- プラン名
- 月額/年額料金
- 含まれる機能
- 制限事項
- ユーザー数/使用量制限

2. 価格比較
- 競合と比較した価格競争力
- コストパフォーマンス評価
- 隠れたコスト（あれば）

3. ROI計算例
- 典型的な導入規模での試算
- 投資回収期間
- コスト削減効果の具体例

4. 割引/プロモーション
- 年間契約割引
- ボリュームディスカウント
- 無料トライアル期間

JSON形式で返してください。
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "あなたは価格分析の専門家です。具体的な数値とROI計算を提供してください。" },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(completion.choices[0].message.content || "{}");
}

// 使用事例を収集
async function collectUseCases(product: string, category: string, openai: OpenAI) {
  const prompt = `
「${product}」の実際の使用事例と活用シーンを調査してください：

1. 業界別使用事例（5つ以上）
各事例について：
- 業界/企業規模
- 具体的な活用方法
- 導入前の課題
- 導入後の成果（数値含む）
- 導入期間

2. 成功事例の詳細（3つ）
- 企業名（可能な範囲で）
- 詳細な導入プロセス
- 具体的な効果測定
- 担当者のコメント

3. 失敗事例/注意点
- うまくいかなかったケース
- 導入時の落とし穴
- 回避方法

JSON形式で具体的に返してください。
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "あなたはケーススタディの専門家です。具体的で実用的な事例を提供してください。" },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(completion.choices[0].message.content || "{}");
}

// 導入ガイドを収集
async function collectImplementationGuide(product: string, openai: OpenAI) {
  const prompt = `
「${product}」の導入・実装ガイドを作成してください：

1. 導入準備
- 必要な前提条件
- 技術要件
- 組織的準備

2. 段階的導入プロセス
- フェーズ1: 初期セットアップ（詳細手順）
- フェーズ2: パイロット運用
- フェーズ3: 本格展開
- 各フェーズの期間目安

3. ベストプラクティス
- 効果的な使い方（5つ以上）
- カスタマイズのコツ
- 運用のポイント

4. トラブルシューティング
- よくある問題と解決方法
- サポート体制
- コミュニティ/リソース

JSON形式で実践的な内容を返してください。
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "あなたは導入コンサルタントです。実践的で具体的なガイドを提供してください。" },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(completion.choices[0].message.content || "{}");
}

// FAQを収集
async function collectFAQs(product: string, openai: OpenAI) {
  const prompt = `
「${product}」に関するよくある質問と回答を20個作成してください：

カテゴリ別に整理：
1. 基本的な質問（5個）
2. 技術的な質問（5個）
3. 料金・契約に関する質問（5個）
4. セキュリティ・コンプライアンス（5個）

各質問について：
- 質問文（自然な日本語で）
- 詳細な回答（100-200字）
- 関連リンク/参考情報（あれば）

JSON形式で返してください。
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "あなたはカスタマーサポートの専門家です。わかりやすく実用的な回答を提供してください。" },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(completion.choices[0].message.content || "{}");
}

// 市場トレンドを収集
async function collectMarketTrends(product: string, category: string, openai: OpenAI) {
  const prompt = `
「${product}」と${category}市場のトレンドを分析してください：

1. 市場規模と成長予測
- 現在の市場規模（グローバル/日本）
- 成長率（CAGR）
- 2025-2030年の予測

2. 技術トレンド
- 最新の技術動向
- 今後期待される機能
- 破壊的イノベーション

3. 規制・コンプライアンス
- 関連する規制
- データプライバシー要件
- 業界標準

4. 将来展望
- ${product}のロードマップ
- 市場での位置づけ予測
- 潜在的なリスク/機会

JSON形式で返してください。
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "あなたは市場分析の専門家です。データに基づいた洞察を提供してください。" },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(completion.choices[0].message.content || "{}");
}

// 記事のアウトライン生成
async function generateArticleOutline(product: string, data: any, openai: OpenAI) {
  const prompt = `
「${product}」に関する包括的な記事のアウトラインを作成してください。

提供されたデータ：
${JSON.stringify(data, null, 2).substring(0, 3000)}

以下の構成で記事アウトラインを作成：

1. はじめに（フック）
- なぜ今このツールが注目されているのか
- 読者が得られる価値
- 記事の信頼性（実使用期間など）

2. 詳細セクション（10-15セクション）
- 各セクションのタイトル
- サブセクション
- 含めるべきデータポイント
- 必要な図表/グラフ

3. 実践的な内容
- 具体例
- スクリーンショットが必要な箇所
- チェックリスト/手順

4. まとめ
- 主要ポイントの要約
- 行動喚起
- 次のステップ

JSON形式で詳細なアウトラインを返してください。
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "あなたはコンテンツストラテジストです。読者に価値を提供する構成を作成してください。" },
      { role: "user", content: prompt }
    ],
    temperature: 0.5,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(completion.choices[0].message.content || "{}");
}

// ヘルパー関数
function extractQuotes(reviews: any): string[] {
  const quotes: string[] = [];
  if (reviews.positive_comments) {
    quotes.push(...reviews.positive_comments.slice(0, 2));
  }
  if (reviews.negative_comments) {
    quotes.push(...reviews.negative_comments.slice(0, 1));
  }
  return quotes;
}

function extractStats(pricing: any): string[] {
  const stats: string[] = [];
  if (pricing.plans) {
    Object.entries(pricing.plans).forEach(([plan, details]: any) => {
      if (details.price) {
        stats.push(`${plan}: ${details.price}`);
      }
    });
  }
  if (pricing.roi_example?.payback_period) {
    stats.push(`投資回収期間: ${pricing.roi_example.payback_period}`);
  }
  return stats;
}

function extractComparisonStats(competitors: any): string[] {
  const stats: string[] = [];
  if (competitors.comparison) {
    stats.push(`競合数: ${competitors.comparison.length}`);
  }
  return stats;
}

function extractCaseQuotes(cases: any): string[] {
  const quotes: string[] = [];
  if (cases.success_stories) {
    cases.success_stories.forEach((story: any) => {
      if (story.testimonial) {
        quotes.push(story.testimonial);
      }
    });
  }
  return quotes;
}

function extractCaseStats(cases: any): string[] {
  const stats: string[] = [];
  if (cases.success_stories) {
    cases.success_stories.forEach((story: any) => {
      if (story.results) {
        stats.push(...Object.values(story.results));
      }
    });
  }
  return stats;
}