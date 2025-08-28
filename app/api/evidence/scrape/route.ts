import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { sbServer } from "@/lib/supabase/server";
import type { EvidenceInsert } from "@/types/database";

// 実際のWebスクレイピングを行うAPI
export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    
    if (!topic) {
      return NextResponse.json(
        { ok: false, error: "トピックを指定してください" },
        { status: 400 }
      );
    }

    const sb = sbServer();
    const evidences: EvidenceInsert[] = [];

    // 1. Google News RSS フィードから最新ニュースを取得
    const googleNewsUrls = [
      `https://news.google.com/rss/search?q=${encodeURIComponent(topic + " AI technology")}&hl=ja&gl=JP&ceid=JP:ja`,
      `https://news.google.com/rss/search?q=${encodeURIComponent(topic + " DX 企業")}&hl=ja&gl=JP&ceid=JP:ja`,
      `https://news.google.com/rss/search?q=${encodeURIComponent(topic + " 生成AI 活用")}&hl=ja&gl=JP&ceid=JP:ja`
    ];

    // 2. 日本の主要メディアのRSSフィード
    const japaneseMediaFeeds = [
      {
        name: "日経電子版 テクノロジー",
        url: "https://www.nikkei.com/technology/ai/rss"
      },
      {
        name: "ITmedia AI+",
        url: "https://rss.itmedia.co.jp/rss/2.0/aiplus.xml"
      },
      {
        name: "ZDNet Japan",
        url: "https://feeds.japan.zdnet.com/rss/zdnet/all.rdf"
      }
    ];

    // 3. RSS Parser を使用してフィードを解析
    const RSSParser = require("rss-parser");
    const parser = new RSSParser({
      customFields: {
        item: ['media:content', 'content:encoded', 'dc:creator']
      }
    });

    // Google Newsから取得
    for (const feedUrl of googleNewsUrls.slice(0, 1)) { // まず1つだけテスト
      try {
        const feed = await parser.parseURL(feedUrl);
        
        for (const item of feed.items.slice(0, 3)) { // 各フィードから3件ずつ
          if (!item.link || !item.title) continue;

          // 記事本文を取得
          const articleContent = await fetchArticleContent(item.link);
          
          evidences.push({
            title: item.title,
            url: item.link,
            domain: new URL(item.link).hostname,
            published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            summary: articleContent.summary || item.contentSnippet || item.content || "",
            quotes: articleContent.quotes || [],
            stats: articleContent.stats || [],
            scores: {
              novelty: calculateNovelty(item.pubDate),
              credibility: calculateCredibility(new URL(item.link).hostname),
              biz_impact: calculateBizImpact(item.title, articleContent.summary)
            },
            source_type: "news",
            status: "pending",
            tags: [topic]
          });
        }
      } catch (feedError) {
        console.error("Feed parse error:", feedError);
      }
    }

    // 4. 主要メディアのフィードから取得
    for (const media of japaneseMediaFeeds) {
      try {
        const feed = await parser.parseURL(media.url);
        
        for (const item of feed.items.slice(0, 2)) { // 各メディアから2件
          if (!item.link || !item.title) continue;
          
          // トピックに関連する記事のみ
          if (!item.title.includes(topic) && !item.content?.includes(topic)) {
            continue;
          }

          const articleContent = await fetchArticleContent(item.link);
          
          evidences.push({
            title: item.title,
            url: item.link,
            domain: new URL(item.link).hostname,
            published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            summary: articleContent.summary || item.contentSnippet || "",
            quotes: articleContent.quotes || [],
            stats: articleContent.stats || [],
            scores: {
              novelty: calculateNovelty(item.pubDate),
              credibility: calculateCredibility(new URL(item.link).hostname),
              biz_impact: calculateBizImpact(item.title, articleContent.summary)
            },
            source_type: "news",
            status: "pending",
            tags: [topic, media.name]
          });
        }
      } catch (feedError) {
        console.error(`${media.name} parse error:`, feedError);
      }
    }

    // 5. Supabaseに保存
    if (evidences.length > 0) {
      const { data: inserted, error } = await sb
        .from("evidence")
        .upsert(evidences, { onConflict: "url", ignoreDuplicates: true })
        .select();
        
      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        ok: true, 
        inserted: inserted?.length || 0,
        evidences: inserted,
        message: `${inserted?.length || 0}件の実際の記事を収集しました`
      });
    }

    return NextResponse.json({ 
      ok: true, 
      inserted: 0,
      evidences: [],
      message: "該当する記事が見つかりませんでした"
    });

  } catch (error) {
    console.error("Scraping error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "スクレイピング中にエラーが発生しました"
      },
      { status: 500 }
    );
  }
}

// 記事本文を取得する関数
async function fetchArticleContent(url: string): Promise<{
  summary: string;
  quotes: string[];
  stats: string[];
}> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ArticleBot/1.0)'
      }
    });
    
    if (!response.ok) {
      return { summary: "", quotes: [], stats: [] };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // メタデータから要約を取得
    const summary = 
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      "";

    // 記事本文から重要な引用を抽出
    const quotes: string[] = [];
    $('blockquote, .quote, [class*="quote"]').each((i, elem) => {
      if (i < 3) { // 最大3つの引用
        const text = $(elem).text().trim();
        if (text.length > 20 && text.length < 300) {
          quotes.push(text);
        }
      }
    });

    // 数値データを抽出
    const stats: string[] = [];
    const bodyText = $('article, main, [role="main"], .content').text() || $('body').text();
    const numberPatterns = [
      /(\d+(?:\.\d+)?(?:％|%|パーセント))/g,
      /(\d{1,3}(?:,\d{3})*(?:億|万)?円)/g,
      /(\d+(?:\.\d+)?倍)/g,
      /(前年比\d+(?:\.\d+)?％)/g,
      /(\d+社)/g,
      /(\d+人)/g
    ];

    for (const pattern of numberPatterns) {
      const matches = bodyText.match(pattern);
      if (matches) {
        stats.push(...matches.slice(0, 2)); // 各パターンから最大2つ
      }
    }

    return {
      summary: summary.substring(0, 300),
      quotes: quotes.slice(0, 3),
      stats: stats.slice(0, 5)
    };

  } catch (error) {
    console.error("Content fetch error:", error);
    return { summary: "", quotes: [], stats: [] };
  }
}

// スコア計算関数
function calculateNovelty(pubDate?: string): number {
  if (!pubDate) return 5;
  const hoursSincePublished = (Date.now() - new Date(pubDate).getTime()) / (1000 * 60 * 60);
  if (hoursSincePublished < 24) return 10;
  if (hoursSincePublished < 72) return 8;
  if (hoursSincePublished < 168) return 6;
  return 4;
}

function calculateCredibility(domain: string): number {
  const trustedDomains: { [key: string]: number } = {
    'nikkei.com': 9.5,
    'itmedia.co.jp': 9,
    'zdnet.com': 8.5,
    'techcrunch.com': 8.5,
    'wired.com': 8,
    'mit.edu': 9.5,
    'harvard.edu': 9.5,
    'mckinsey.com': 9,
    'gartner.com': 9,
    'meti.go.jp': 10,
    'microsoft.com': 8.5,
    'google.com': 8.5,
    'openai.com': 9
  };

  for (const [trustedDomain, score] of Object.entries(trustedDomains)) {
    if (domain.includes(trustedDomain)) {
      return score;
    }
  }
  return 6; // デフォルトスコア
}

function calculateBizImpact(title: string, content: string): number {
  const impactKeywords = [
    '売上', '利益', 'ROI', '投資', '成長', '削減', '効率化',
    '革新', 'イノベーション', 'DX', 'AI', '自動化', '生産性',
    '競争力', '市場', 'シェア', '戦略', '経営', '改革'
  ];
  
  const combined = (title + " " + content).toLowerCase();
  let score = 5; // ベーススコア
  
  for (const keyword of impactKeywords) {
    if (combined.includes(keyword)) {
      score += 0.5;
    }
  }
  
  return Math.min(score, 10);
}