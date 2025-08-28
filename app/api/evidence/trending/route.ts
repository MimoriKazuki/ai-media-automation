import { NextRequest, NextResponse } from "next/server";
import { sbServer } from "@/lib/supabase/server";
import type { EvidenceInsert } from "@/types/database";
import OpenAI from "openai";

// トレンドニュースと話題性の高いコンテンツを収集
export async function POST(req: NextRequest) {
  try {
    const { topic = "AI" } = await req.json();
    const sb = sbServer();
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    
    // 1. 現在のトレンドトピックを取得
    const trendingTopics = await getTrendingTopics(topic);
    
    // 2. 各トレンドトピックに対してニュースを収集
    const allEvidences: EvidenceInsert[] = [];
    
    for (const trend of trendingTopics) {
      const evidences = await collectTrendingNews(trend, topic);
      allEvidences.push(...evidences);
    }
    
    // 3. OpenAI GPT-4oで話題性とインパクトを評価
    const enrichedEvidences = await enrichWithAI(allEvidences, openai);
    
    // 4. バイラル性スコアでソート
    enrichedEvidences.sort((a, b) => {
      const scoreA = (a.scores?.viral || 0) + (a.scores?.biz_impact || 0);
      const scoreB = (b.scores?.viral || 0) + (b.scores?.biz_impact || 0);
      return scoreB - scoreA;
    });
    
    // 5. 上位10件を選択
    const topEvidences = enrichedEvidences.slice(0, 10);
    
    // 6. Supabaseに保存
    if (topEvidences.length > 0) {
      const { data: inserted, error } = await sb
        .from("evidence")
        .upsert(topEvidences, { onConflict: "url", ignoreDuplicates: true })
        .select();
        
      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        ok: true, 
        inserted: inserted?.length || 0,
        evidences: inserted,
        message: `${inserted?.length || 0}件のトレンドニュースを収集しました`,
        trends: trendingTopics
      });
    }

    return NextResponse.json({ 
      ok: true, 
      inserted: 0,
      evidences: [],
      message: "トレンドニュースが見つかりませんでした"
    });

  } catch (error) {
    console.error("Trending collection error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "トレンド収集中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

// トレンドトピックを取得
async function getTrendingTopics(baseTopic: string): Promise<string[]> {
  const trends = [
    `${baseTopic} ChatGPT`,
    `${baseTopic} Claude`,
    `${baseTopic} 生成AI 活用事例`,
    `${baseTopic} 企業導入 成功`,
    `${baseTopic} 最新 ブレイクスルー`,
    `${baseTopic} スタートアップ 資金調達`,
    `${baseTopic} 規制 法律`,
    `${baseTopic} 倫理 問題`,
    `${baseTopic} 仕事 失業`,
    `${baseTopic} 教育 変革`
  ];
  
  // Google Trends APIのような実装（実際はRSSやスクレイピング）
  // ここでは話題性の高いキーワードを返す
  return trends.slice(0, 5);
}

// トレンドニュースを収集
async function collectTrendingNews(query: string, originalTopic: string): Promise<EvidenceInsert[]> {
  const evidences: EvidenceInsert[] = [];
  
  try {
    // 1. Reddit API - 話題のディスカッション
    const redditUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=hot&limit=3`;
    const redditResponse = await fetch(redditUrl, {
      headers: { 'User-Agent': 'TrendingBot/1.0' }
    });
    
    if (redditResponse.ok) {
      const redditData = await redditResponse.json();
      for (const post of (redditData.data?.children || []).slice(0, 2)) {
        const item = post.data;
        if (!item.url || !item.title) continue;
        
        evidences.push({
          title: item.title,
          url: item.url,
          domain: "reddit.com",
          published_at: new Date(item.created_utc * 1000).toISOString(),
          summary: `Reddit Score: ${item.score}. ${item.num_comments}件のコメント。${item.selftext?.substring(0, 200) || ""}`,
          quotes: [],
          stats: [
            `Reddit Score: ${item.score}`,
            `コメント数: ${item.num_comments}`,
            `アップボート率: ${Math.round(item.upvote_ratio * 100)}%`
          ],
          scores: {
            novelty: 8,
            credibility: 5,
            biz_impact: 6,
            viral: Math.min(item.score / 1000, 10)
          },
          source_type: "news",
          status: "pending",
          tags: [originalTopic, "Reddit", "トレンド"]
        });
      }
    }
  } catch (error) {
    console.error("Reddit API error:", error);
  }
  
  try {
    // 2. Hacker News - テック系の話題
    const hnUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=3`;
    const hnResponse = await fetch(hnUrl);
    
    if (hnResponse.ok) {
      const hnData = await hnResponse.json();
      for (const hit of (hnData.hits || []).slice(0, 2)) {
        if (!hit.url || !hit.title) continue;
        
        evidences.push({
          title: hit.title,
          url: hit.url,
          domain: new URL(hit.url).hostname,
          published_at: hit.created_at || new Date().toISOString(),
          summary: `Hacker Newsで話題。${hit.points}ポイント、${hit.num_comments}件のコメント。`,
          quotes: [],
          stats: [
            `HN Score: ${hit.points}`,
            `コメント数: ${hit.num_comments}`
          ],
          scores: {
            novelty: 7,
            credibility: 7,
            biz_impact: 7,
            viral: Math.min(hit.points / 500, 10)
          },
          source_type: "news",
          status: "pending",
          tags: [originalTopic, "Hacker News", "テック"]
        });
      }
    }
  } catch (error) {
    console.error("HN API error:", error);
  }
  
  try {
    // 3. Google News - 最新の注目ニュース
    const RSSParser = require("rss-parser");
    const parser = new RSSParser();
    const googleUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ja&gl=JP&ceid=JP:ja`;
    const feed = await parser.parseURL(googleUrl);
    
    for (const item of (feed.items || []).slice(0, 3)) {
      if (!item.link || !item.title) continue;
      
      evidences.push({
        title: item.title,
        url: item.link,
        domain: "Google News",
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        summary: item.contentSnippet || "",
        quotes: [],
        stats: [],
        scores: {
          novelty: calculateRecency(item.pubDate),
          credibility: 8,
          biz_impact: 7,
          viral: 6
        },
        source_type: "news",
        status: "pending",
        tags: [originalTopic, "Google News", "最新"]
      });
    }
  } catch (error) {
    console.error("Google News error:", error);
  }
  
  return evidences;
}

// OpenAIで内容を評価・充実
async function enrichWithAI(evidences: EvidenceInsert[], openai: OpenAI): Promise<EvidenceInsert[]> {
  const enrichedEvidences: EvidenceInsert[] = [];
  
  for (const evidence of evidences) {
    try {
      const prompt = `
以下のニュースを分析して、一般の人々の関心度とメディアでの話題性を評価してください。

タイトル: ${evidence.title}
URL: ${evidence.url}
要約: ${evidence.summary}

以下の観点で評価してください（JSON形式）:
{
  "viral_score": 8.5, // バイラル性（0-10）: SNSでシェアされやすさ
  "public_interest": 9.0, // 一般関心度（0-10）: 一般人が興味を持つか
  "media_potential": 7.5, // メディア価値（0-10）: ニュース価値
  "trending_keywords": ["キーワード1", "キーワード2"], // トレンドキーワード
  "target_audience": "ターゲット層の説明",
  "hook": "なぜこれが話題になるか一言で",
  "improved_summary": "一般向けにわかりやすく書き直した200字の要約"
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // コスト効率のため
        messages: [
          { role: "system", content: "あなたはメディアトレンドアナリストです。" },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(completion.choices[0].message.content || "{}");
      
      // スコアを更新
      evidence.scores = {
        ...evidence.scores,
        viral: analysis.viral_score || 5,
        public_interest: analysis.public_interest || 5,
        media_potential: analysis.media_potential || 5
      };
      
      // 要約を改善
      if (analysis.improved_summary) {
        evidence.summary = analysis.improved_summary;
      }
      
      // タグを追加
      if (analysis.trending_keywords) {
        evidence.tags = [...(evidence.tags || []), ...analysis.trending_keywords];
      }
      
      // フック（話題性の理由）を追加
      if (analysis.hook) {
        evidence.note = analysis.hook;
      }
      
      enrichedEvidences.push(evidence);
      
    } catch (error) {
      console.error("AI enrichment error:", error);
      enrichedEvidences.push(evidence); // エラー時は元のデータを使用
    }
  }
  
  return enrichedEvidences;
}

// 新しさスコアを計算
function calculateRecency(pubDate?: string): number {
  if (!pubDate) return 5;
  const hoursAgo = (Date.now() - new Date(pubDate).getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 1) return 10;
  if (hoursAgo < 3) return 9;
  if (hoursAgo < 6) return 8;
  if (hoursAgo < 12) return 7;
  if (hoursAgo < 24) return 6;
  if (hoursAgo < 48) return 5;
  return 3;
}