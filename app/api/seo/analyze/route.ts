import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { sbServer } from "@/lib/supabase/server";
import type { EvidenceInsert } from "@/types/database";

// SEO観点から記事の価値を評価し、書くべきかアドバイス
export async function POST(req: NextRequest) {
  try {
    const { topic, evidence_ids = [] } = await req.json();
    
    if (!topic && evidence_ids.length === 0) {
      return NextResponse.json(
        { ok: false, error: "トピックまたはエビデンスIDを指定してください" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const sb = sbServer();
    
    // エビデンスがある場合は取得
    let evidences: any[] = [];
    if (evidence_ids.length > 0) {
      const { data } = await sb
        .from("evidence")
        .select("*")
        .in("id", evidence_ids);
      evidences = data || [];
    }
    
    // SEO分析を実行
    const seoAnalysis = await analyzeSEOPotential(topic || evidences[0]?.title, openai);
    const contentOpportunity = await analyzeContentOpportunity(topic || evidences[0]?.title, openai);
    const competitorAnalysis = await analyzeCompetitors(topic || evidences[0]?.title, openai);
    const trendAnalysis = await analyzeTrends(topic || evidences[0]?.title, openai);
    
    // 総合スコアと推奨度を計算
    const recommendation = calculateRecommendation(
      seoAnalysis,
      contentOpportunity,
      competitorAnalysis,
      trendAnalysis
    );
    
    // 記事構成の提案
    const articleSuggestion = await suggestArticleStructure(
      topic || evidences[0]?.title,
      recommendation,
      openai
    );
    
    // エビデンスを更新（スコアと推奨内容を追加）
    if (evidences.length > 0) {
      for (const evidence of evidences) {
        const updateData = {
          scores: {
            ...evidence.scores,
            seo_impact: recommendation.seo_score,
            impression_potential: recommendation.impression_score,
            competition_level: recommendation.competition_score,
            opportunity_score: recommendation.opportunity_score,
            total_recommendation: recommendation.total_score
          },
          note: recommendation.advice
        };
        
        await sb
          .from("evidence")
          .update(updateData)
          .eq("id", evidence.id);
      }
    }
    
    return NextResponse.json({
      ok: true,
      topic: topic || evidences[0]?.title,
      recommendation,
      seo_analysis: seoAnalysis,
      content_opportunity: contentOpportunity,
      competitor_analysis: competitorAnalysis,
      trend_analysis: trendAnalysis,
      article_suggestion: articleSuggestion,
      should_write: recommendation.should_write,
      priority: recommendation.priority
    });
    
  } catch (error) {
    console.error("SEO analysis error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "SEO分析中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

// SEOポテンシャル分析
async function analyzeSEOPotential(topic: string, openai: OpenAI): Promise<any> {
  const prompt = `
「${topic}」のSEOポテンシャルを分析してください：

1. キーワード分析
- 主要キーワードの月間検索ボリューム（推定）
- ロングテールキーワードの候補（10個）
- 関連キーワード（5個）
- キーワード難易度（1-10）

2. 検索意図分析
- 情報検索型（Informational）の割合
- 取引検索型（Transactional）の割合
- ナビゲーション型（Navigational）の割合
- 商業調査型（Commercial）の割合

3. SERP（検索結果）分析
- 現在上位表示されているコンテンツタイプ
- リッチスニペットの可能性
- 強調スニペット獲得の可能性
- 「他の人はこちらも検索」の傾向

4. SEOスコア（0-100）
- 検索ボリュームスコア
- 競争度スコア
- CTRポテンシャルスコア
- 総合SEOスコア

JSON形式で詳細に返してください。
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: "あなたはSEOエキスパートです。日本市場の検索トレンドを理解し、正確なSEO分析を提供してください。" 
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(completion.choices[0].message.content || "{}");
}

// コンテンツ機会分析
async function analyzeContentOpportunity(topic: string, openai: OpenAI): Promise<any> {
  const prompt = `
「${topic}」に関するコンテンツ機会を分析してください：

1. コンテンツギャップ分析
- 既存コンテンツでカバーされていない領域
- ユーザーが求めているが不足している情報
- 新しい切り口の可能性

2. トピッククラスター分析
- メイントピック
- サブトピック（5-10個）
- 関連記事の展開可能性
- 内部リンク構築の機会

3. コンテンツフォーマット提案
- 最適なコンテンツタイプ（ガイド、リスト、比較、How-to等）
- 推奨文字数
- 必要な画像/動画/インフォグラフィック数
- インタラクティブ要素の提案

4. ターゲットオーディエンス
- ペルソナ詳細
- 検索段階（認知/検討/決定）
- デバイス傾向（PC/モバイル）
- 年齢層/職種

5. 機会スコア（0-100）
- コンテンツギャップの大きさ
- 需要の強さ
- 競合の弱さ
- 総合機会スコア

JSON形式で返してください。
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: "あなたはコンテンツストラテジストです。市場機会を正確に評価し、実行可能な提案を行ってください。" 
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.4,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(completion.choices[0].message.content || "{}");
}

// 競合分析
async function analyzeCompetitors(topic: string, openai: OpenAI): Promise<any> {
  const prompt = `
「${topic}」に関する競合コンテンツを分析してください：

1. 上位10サイト分析
- 各サイトのドメインオーソリティ（推定）
- コンテンツの長さ（文字数）
- 更新日
- 被リンク数（推定）
- SNSシェア数（推定）

2. コンテンツ品質分析
- 情報の深さ
- 独自性
- 視覚的要素の充実度
- ユーザビリティ
- E-E-A-T（経験・専門性・権威性・信頼性）スコア

3. 競合の弱点
- カバーされていないトピック
- 古い情報
- ユーザー体験の問題点
- 技術的SEOの問題

4. 差別化ポイント
- 勝てる可能性のある要素
- ユニークな価値提案
- 新しいアプローチ
- 改善可能な点

5. 競争難易度（0-100）
- ドメイン競争度
- コンテンツ競争度
- 技術的競争度
- 総合競争スコア

JSON形式で返してください。
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: "あなたは競合分析の専門家です。現実的で実行可能な競合分析を提供してください。" 
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(completion.choices[0].message.content || "{}");
}

// トレンド分析
async function analyzeTrends(topic: string, openai: OpenAI): Promise<any> {
  const prompt = `
「${topic}」のトレンドを分析してください：

1. 検索トレンド（直近12ヶ月）
- 検索ボリュームの推移
- 季節性の有無
- 急上昇/下降トレンド
- 予測される今後3ヶ月のトレンド

2. SNSトレンド
- Twitter/Xでの言及数傾向
- LinkedInでの関心度
- YouTubeでの関連動画数
- TikTokでのバイラル可能性

3. ニューストレンド
- 最近の主要ニュース
- メディア露出の頻度
- 話題性スコア（1-10）
- 炎上リスク評価

4. 将来性分析
- 長期的な成長性
- 一時的ブームの可能性
- 関連技術/市場の成長予測
- 投資価値

5. トレンドスコア（0-100）
- 現在の注目度
- 成長率
- 持続可能性
- 総合トレンドスコア

JSON形式で返してください。
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: "あなたはトレンドアナリストです。データに基づいた正確なトレンド分析を提供してください。" 
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(completion.choices[0].message.content || "{}");
}

// 総合推奨度を計算
function calculateRecommendation(
  seo: any,
  opportunity: any,
  competitors: any,
  trends: any
): any {
  // 各スコアを取得
  const seoScore = seo.seo_score?.total || 50;
  const opportunityScore = opportunity.opportunity_score?.total || 50;
  const competitionScore = 100 - (competitors.competition_score?.total || 50); // 競争が低いほど良い
  const trendScore = trends.trend_score?.total || 50;
  
  // インプレッション獲得可能性を計算
  const impressionScore = calculateImpressionPotential(seo, trends);
  
  // 総合スコア（重み付け）
  const totalScore = (
    seoScore * 0.3 +
    opportunityScore * 0.25 +
    competitionScore * 0.2 +
    trendScore * 0.15 +
    impressionScore * 0.1
  );
  
  // 推奨レベルを決定
  let priority = "低";
  let shouldWrite = false;
  let advice = "";
  
  if (totalScore >= 80) {
    priority = "最優先";
    shouldWrite = true;
    advice = "このトピックは非常に高いポテンシャルがあります。すぐに記事作成を開始することを強く推奨します。検索ボリュームが高く、競合が少ない絶好の機会です。";
  } else if (totalScore >= 70) {
    priority = "高";
    shouldWrite = true;
    advice = "良い機会です。適切な戦略で上位表示が狙えます。独自性のある切り口で差別化を図ることが重要です。";
  } else if (totalScore >= 60) {
    priority = "中";
    shouldWrite = true;
    advice = "記事作成の価値はありますが、競合が強いため、特に優れた内容と戦略が必要です。ロングテールキーワードを狙うことを推奨します。";
  } else if (totalScore >= 50) {
    priority = "低";
    shouldWrite = false;
    advice = "現時点では優先度が低いトピックです。他により良い機会があるか、3-6ヶ月後に再評価することを推奨します。";
  } else {
    priority = "非推奨";
    shouldWrite = false;
    advice = "このトピックは現在SEO的な価値が低いです。検索需要が少ないか、競合が強すぎる可能性があります。別のトピックを検討してください。";
  }
  
  // 具体的なアクションアドバイスを追加
  const actions = generateActionableAdvice(seo, opportunity, competitors, trends);
  
  return {
    total_score: Math.round(totalScore),
    seo_score: Math.round(seoScore),
    opportunity_score: Math.round(opportunityScore),
    competition_score: Math.round(competitionScore),
    trend_score: Math.round(trendScore),
    impression_score: Math.round(impressionScore),
    priority,
    should_write: shouldWrite,
    advice,
    actionable_advice: actions,
    estimated_traffic: estimateTraffic(seo, totalScore),
    time_to_rank: estimateTimeToRank(competitionScore),
    recommended_word_count: recommendWordCount(competitors, opportunity)
  };
}

// インプレッション獲得可能性を計算
function calculateImpressionPotential(seo: any, trends: any): number {
  let score = 50;
  
  // 検索ボリュームの影響
  const searchVolume = seo.keyword_analysis?.monthly_volume || 0;
  if (searchVolume > 10000) score += 20;
  else if (searchVolume > 5000) score += 15;
  else if (searchVolume > 1000) score += 10;
  else if (searchVolume > 500) score += 5;
  
  // トレンドの影響
  if (trends.search_trend?.trend === "rising") score += 15;
  else if (trends.search_trend?.trend === "stable") score += 5;
  else if (trends.search_trend?.trend === "declining") score -= 10;
  
  // リッチスニペットの可能性
  if (seo.serp_analysis?.rich_snippet_potential === "high") score += 10;
  
  // CTRポテンシャル
  if (seo.ctr_potential?.score > 70) score += 10;
  
  return Math.min(100, Math.max(0, score));
}

// 具体的なアクションアドバイス生成
function generateActionableAdvice(seo: any, opportunity: any, competitors: any, trends: any): string[] {
  const advice: string[] = [];
  
  // SEOアドバイス
  if (seo.keyword_difficulty?.score > 7) {
    advice.push("競争が激しいため、ロングテールキーワード戦略を採用してください");
  }
  
  // コンテンツアドバイス
  if (opportunity.content_gap?.uncovered_topics?.length > 0) {
    advice.push(`以下のトピックをカバーすることで差別化できます: ${opportunity.content_gap.uncovered_topics.slice(0, 3).join(", ")}`);
  }
  
  // 競合対策アドバイス
  if (competitors.weaknesses?.outdated_content) {
    advice.push("競合の情報が古いため、最新データで差別化可能です");
  }
  
  // トレンドアドバイス
  if (trends.seasonal?.exists) {
    advice.push(`${trends.seasonal.peak_month}が検索ピークのため、その2ヶ月前から準備することを推奨`);
  }
  
  return advice;
}

// トラフィック予測
function estimateTraffic(seo: any, totalScore: number): string {
  const searchVolume = seo.keyword_analysis?.monthly_volume || 1000;
  const ctr = totalScore / 100 * 0.3; // スコアに基づくCTR推定
  const estimatedVisits = Math.round(searchVolume * ctr);
  
  if (estimatedVisits > 10000) return "月間10,000+ PV";
  if (estimatedVisits > 5000) return "月間5,000-10,000 PV";
  if (estimatedVisits > 1000) return "月間1,000-5,000 PV";
  if (estimatedVisits > 500) return "月間500-1,000 PV";
  return "月間100-500 PV";
}

// ランキング達成時間の推定
function estimateTimeToRank(competitionScore: number): string {
  if (competitionScore > 80) return "1-2ヶ月";
  if (competitionScore > 60) return "2-3ヶ月";
  if (competitionScore > 40) return "3-6ヶ月";
  return "6ヶ月以上";
}

// 推奨文字数
function recommendWordCount(competitors: any, opportunity: any): number {
  const avgCompetitorLength = competitors.content_analysis?.average_word_count || 2000;
  const recommendedLength = Math.round(avgCompetitorLength * 1.2); // 競合より20%多く
  return Math.max(1500, Math.min(5000, recommendedLength)); // 1500-5000字の範囲
}

// 記事構成の提案
async function suggestArticleStructure(topic: string, recommendation: any, openai: OpenAI): Promise<any> {
  if (!recommendation.should_write) {
    return {
      message: "このトピックは現時点で記事作成を推奨しません",
      alternative_topics: []
    };
  }
  
  const prompt = `
「${topic}」の記事構成を、SEO効果を最大化する形で提案してください。

推奨度: ${recommendation.priority}
総合スコア: ${recommendation.total_score}
推定トラフィック: ${recommendation.estimated_traffic}

以下の構成で提案：

1. SEO最適化タイトル案（3パターン）
- CTRを最大化するタイトル
- 文字数は28-32文字
- キーワードを前方に配置

2. メタディスクリプション案
- 120文字程度
- CTRを高める要素を含む

3. 見出し構成（H2, H3）
- SEOキーワードを適切に配置
- ユーザーの検索意図に応える構成
- ${recommendation.recommended_word_count}字を想定

4. 内部リンク戦略
- リンクすべき関連記事のテーマ
- アンカーテキストの例

5. 画像/動画戦略
- 必要な画像数と種類
- alt属性の例
- 動画の必要性

JSON形式で返してください。
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: "あなたはSEOライティングの専門家です。検索エンジンとユーザー両方に価値のある構成を提案してください。" 
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.5,
    response_format: { type: "json_object" }
  });
  
  return JSON.parse(completion.choices[0].message.content || "{}");
}