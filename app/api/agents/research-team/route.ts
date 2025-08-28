import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { sbServer } from "@/lib/supabase/server";
import type { EvidenceInsert } from "@/types/database";

// AIエージェントチームによる高品質な情報収集と記事作成
export async function POST(req: NextRequest) {
  try {
    const { topic, mode = "research" } = await req.json();
    
    if (!topic) {
      return NextResponse.json(
        { ok: false, error: "トピックを指定してください" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const sb = sbServer();
    
    // エージェントチームのワークフロー
    const workflow = {
      status: "開始",
      agents: [],
      evidences: [],
      finalArticle: null
    };
    
    // 1. リサーチャーエージェント（情報収集のプロ）
    workflow.status = "リサーチャーが情報収集中...";
    const researcherResult = await researcherAgent(topic, openai);
    workflow.agents.push({
      name: "🔍 リサーチャーAI",
      role: "最新情報と信頼性の高いソースを収集",
      status: "完了",
      output: researcherResult
    });
    
    // 2. アナリストエージェント（データ分析のプロ）
    workflow.status = "アナリストがデータを分析中...";
    const analystResult = await analystAgent(topic, researcherResult, openai);
    workflow.agents.push({
      name: "📊 アナリストAI",
      role: "データの信頼性評価と洞察の抽出",
      status: "完了",
      output: analystResult
    });
    
    // 3. ライターエージェント（執筆のプロ）
    workflow.status = "ライターが記事を執筆中...";
    const writerResult = await writerAgent(topic, researcherResult, analystResult, openai);
    workflow.agents.push({
      name: "✍️ ライターAI",
      role: "プロ級の記事を執筆",
      status: "完了",
      output: writerResult
    });
    
    // 4. エディターエージェント（編集のプロ）
    workflow.status = "エディターが品質チェック中...";
    const editorResult = await editorAgent(writerResult, openai);
    workflow.agents.push({
      name: "📝 エディターAI",
      role: "記事の品質向上と最終調整",
      status: "完了",
      output: editorResult
    });
    
    // 5. SEO最適化エージェント
    workflow.status = "SEO専門家が最適化中...";
    const seoResult = await seoAgent(topic, editorResult, openai);
    workflow.agents.push({
      name: "🎯 SEO専門家AI",
      role: "検索エンジン最適化",
      status: "完了",
      output: seoResult
    });
    
    // エビデンスとして保存
    const evidences: EvidenceInsert[] = [];
    
    // リサーチ結果を高品質エビデンスとして保存
    for (const item of researcherResult.sources || []) {
      evidences.push({
        title: item.title,
        url: item.url,
        domain: item.domain,
        published_at: item.published_at || new Date().toISOString(),
        summary: item.summary,
        quotes: item.key_points || [],
        stats: item.statistics || [],
        scores: {
          novelty: item.novelty_score || 8,
          credibility: item.credibility_score || 9,
          biz_impact: item.impact_score || 8,
          seo_impact: analystResult.seo_potential || 75,
          total_recommendation: 85
        },
        source_type: "news",
        status: "approved", // 自動承認
        tags: [topic, "AIエージェント調査", "高品質"],
        note: analystResult.insights
      });
    }
    
    // Supabaseに保存
    if (evidences.length > 0) {
      const { data: inserted, error } = await sb
        .from("evidence")
        .upsert(evidences, { onConflict: "url", ignoreDuplicates: false })
        .select();
      
      if (error) {
        console.error("Supabase error:", error);
      } else {
        workflow.evidences = inserted || [];
      }
    }
    
    // 最終記事
    workflow.finalArticle = seoResult.optimized_article || seoResult;
    workflow.quality_score = Math.round(
      (researcherResult.sources?.length || 0) * 5 + 
      (analystResult.seo_potential || 75)
    );
    workflow.status = "完了";
    
    return NextResponse.json({
      ok: true,
      topic,
      workflow,
      article: seoResult.optimized_article,
      message: "AIエージェントチームが高品質な記事を作成しました"
    });
    
  } catch (error) {
    console.error("Agent team error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "エージェント処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

// リサーチャーエージェント：最新で信頼性の高い情報を収集
async function researcherAgent(topic: string, openai: OpenAI): Promise<any> {
  const prompt = `
あなたはビジネス分析の専門家です。
「${topic}」について、実践的でビジネス価値のある情報を提供してください。

重要：
- 架空の情報やURLは絶対に使用しない
- 実際に存在する企業やサービスのみ言及する
- 現実的で実践可能な情報のみ提供する

収集すべき情報：
1. トピックの基本情報
- 定義と概要
- 主要な特徴と機能
- ビジネスへの応用

2. 市場動向
- 現在の市場状況
- 主要プレイヤー
- 成長予測

3. 実践的な活用方法
- 具体的な導入手順
- ベストプラクティス
- 注意点とリスク

4. ROIと効果
- 期待できる効果
- コストとベネフィット
- 成功指標

以下の形式で、実践的な情報のみを返してください（JSON）：
{
  "sources": [
    {
      "title": "実際の記事タイトル",
      "url": "実在するURL",
      "domain": "信頼できるドメイン",
      "published_at": "公開日",
      "summary": "200字の要約",
      "key_points": ["重要ポイント1", "重要ポイント2"],
      "statistics": ["具体的な数値データ"],
      "credibility_score": 9,
      "novelty_score": 8,
      "impact_score": 8
    }
  ],
  "research_summary": "調査全体のサマリー",
  "key_findings": ["主要な発見1", "主要な発見2", "主要な発見3"]
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: "あなたはビジネスコンサルタントです。実践的で信頼できる情報のみを提供し、架空のデータやURLは絶対に使用しないでください。ビジネスに役立つ現実的なアドバイスを提供してください。" 
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.1,
    max_tokens: 3000,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(completion.choices[0].message.content || "{}");
}

// アナリストエージェント：データを分析し洞察を抽出
async function analystAgent(topic: string, researchData: any, openai: OpenAI): Promise<any> {
  const prompt = `
あなたは一流のデータアナリストです。
「${topic}」に関する以下のリサーチデータを分析し、深い洞察を提供してください。

リサーチデータ：
${JSON.stringify(researchData, null, 2).substring(0, 2000)}

分析してください：
1. トレンド分析
- 現在のトレンド
- 将来予測
- 市場の成熟度

2. 競争環境分析
- 主要プレイヤー
- 差別化要因
- 市場機会

3. リスクと機会
- ビジネスリスク
- 成長機会
- 投資判断

4. 実践的な推奨事項
- 企業が取るべきアクション
- 導入タイミング
- 成功のための条件

JSON形式で返してください：
{
  "insights": "核心的な洞察（300字）",
  "trends": {
    "current": "現在のトレンド",
    "future": "将来予測",
    "opportunities": ["機会1", "機会2"]
  },
  "recommendations": ["推奨事項1", "推奨事項2", "推奨事項3"],
  "seo_potential": 85,
  "target_audience": "想定読者層",
  "content_angle": "独自の切り口"
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: "あなたはビジネスアナリストです。実践的で現実的な分析を行い、ビジネスに直接役立つ洞察を提供してください。架空の情報やデータは使わないでください。" 
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(completion.choices[0].message.content || "{}");
}

// ライターエージェント：SEOに最適化されたプロ級の記事を執筆
async function writerAgent(topic: string, researchData: any, analysisData: any, openai: OpenAI): Promise<any> {
  const prompt = `
あなたはビジネスライターです。
「${topic}」について、実践的で価値ある記事を執筆してください。

リサーチデータ：
${JSON.stringify(researchData.key_findings, null, 2)}

分析結果：
${JSON.stringify(analysisData.insights, null, 2)}

重要な指示：
- 架空の情報や存在しない製品名を使わない
- 現実的で実践可能な内容のみ記述
- ビジネスに直接役立つ情報を中心に

記事の要件：
1. 明確な価値提供（読者にとっての利益を明確に）
2. 具体的なアクションプラン
3. 実現可能なステップ
4. リスクとその対策
5. ROIの明確化

構成：
- タイトル（30-60字、キーワード含む、クリック率重視）
- リード文（200-300字、問題提起と解決策の提示）
- 本文（3000-4000字、見出しごとにキーワード配置）
  - 各セクション500-800字
  - リスト形式や表を活用
  - 具体的な数値とデータ
- まとめ（200-300字、次のアクションを明確に）

JSON形式で返してください：
{
  "title": "記事タイトル",
  "subtitle": "サブタイトル",
  "lead": "リード文",
  "sections": [
    {
      "heading": "見出し",
      "content": "本文",
      "key_point": "この章の要点"
    }
  ],
  "conclusion": "まとめ",
  "cta": "行動喚起",
  "keywords": ["キーワード1", "キーワード2"]
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: "あなたはビジネスライターです。実践的で現実的な内容のみを書き、架空の情報や存在しない製品・サービス名は絶対に使わないでください。ビジネスに直接役立つ情報を提供してください。" 
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    max_tokens: 4000,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(completion.choices[0].message.content || "{}");
}

// エディターエージェント：記事の品質向上
async function editorAgent(article: any, openai: OpenAI): Promise<any> {
  const prompt = `
あなたは一流の編集者です。
以下の記事を編集し、品質を最高レベルまで高めてください。

元記事：
${JSON.stringify(article, null, 2).substring(0, 3000)}

編集のポイント：
1. 論理の一貫性
2. 文章のリズムと読みやすさ
3. データの正確性
4. インパクトの強化
5. 冗長な表現の削除

JSON形式で返してください：
{
  "edited_article": {
    "title": "SEO最適化されたタイトル（キーワードを含む）",
    "subtitle": "魅力的なサブタイトル",
    "lead": "改善されたリード文（問題提起→解決策）",
    "sections": ["構造化され読みやすい本文"],
    "conclusion": "行動を促すまとめ",
    "cta": "明確なコールトゥアクション"
  },
  "improvements": ["改善点1", "改善点2"],
  "quality_score": 95
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: "あなたは一流の編集者です。記事を洗練させ、プロフェッショナルな品質に仕上げてください。" 
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(completion.choices[0].message.content || "{}");
}

// SEOエージェント：検索エンジン最適化
async function seoAgent(topic: string, article: any, openai: OpenAI): Promise<any> {
  const prompt = `
あなたはSEOの専門家です。
「${topic}」の記事を検索エンジンに最適化してください。

記事：
${JSON.stringify(article.edited_article, null, 2).substring(0, 2000)}

重要な指示：
- 現実的で実現可能なSEO戦略のみ提案
- キーワードの自然な使用
- ユーザー価値を最優先に

SEO最適化の重点項目：
1. タイトル：明確で分かりやすく、検索意図にマッチ
2. メタディスクリプション：価値を伝える120字
3. コンテンツ構造：論理的で読みやすい
4. キーワード：自然で適切な配置
5. ユーザー体験：読みやすさと価値

JSON形式で返してください：
{
  "seo_title": "${topic}の完全ガイド｜実践方法と活用事例",
  "meta_description": "${topic}について実践的な活用方法と具体的な導入手順を解説。ビジネスに役立つ情報をわかりやすくまとめました。",
  "optimized_article": {
    "title": "タイトル",
    "sections": ["最適化されたセクション"],
    "conclusion": "結論"  
  },
  "target_keywords": ["${topic}", "${topic} とは", "${topic} 活用", "${topic} 導入"],
  "estimated_ranking": "10位以内",
  "monthly_traffic_potential": "5,000〜10,000 PV"
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: "あなたはSEOコンサルタントです。ユーザー価値を最優先に、現実的で効果的なSEO最適化を行ってください。架空の情報や存在しない製品名は使わないでください。" 
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(completion.choices[0].message.content || "{}");
}