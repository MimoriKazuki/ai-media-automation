import { NextRequest, NextResponse } from "next/server";
import { sbServer } from "@/lib/supabase/server";
import type { EvidenceInsert } from "@/types/database";
import * as cheerio from "cheerio";

// NewsAPI.orgを使った実際のニュース取得
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

    // NewsAPI.org (無料プランで取得可能)
    const newsApiKey = process.env.NEWS_API_KEY || "demo"; // デモキーを使用
    
    // 1. Everything エンドポイント - 最新記事を検索
    const searchQueries = [
      `${topic} AI technology`,
      `${topic} artificial intelligence`,
      `${topic} machine learning`,
      `${topic} digital transformation`
    ];

    for (const query of searchQueries.slice(0, 2)) {
      try {
        const newsApiUrl = `https://newsapi.org/v2/everything?` + 
          `q=${encodeURIComponent(query)}&` +
          `language=en&` +
          `sortBy=publishedAt&` +
          `pageSize=5&` +
          `apiKey=${newsApiKey}`;

        const newsResponse = await fetch(newsApiUrl);
        
        if (newsResponse.ok) {
          const newsData = await newsResponse.json();
          
          for (const article of (newsData.articles || []).slice(0, 3)) {
            if (!article.url || !article.title) continue;
            
            // 記事の詳細内容を取得
            const enrichedContent = await enrichArticleContent(article.url, article.description);
            
            evidences.push({
              title: article.title,
              url: article.url,
              domain: new URL(article.url).hostname,
              published_at: article.publishedAt || new Date().toISOString(),
              summary: enrichedContent.summary || article.description || article.content?.substring(0, 300) || "",
              quotes: enrichedContent.quotes,
              stats: enrichedContent.stats,
              scores: {
                novelty: calculateNovelty(article.publishedAt),
                credibility: calculateCredibility(article.source?.name || new URL(article.url).hostname),
                biz_impact: calculateBizImpact(article.title, article.description)
              },
              source_type: "news",
              status: "pending",
              tags: [topic, "NewsAPI", article.source?.name].filter(Boolean)
            });
          }
        }
      } catch (apiError) {
        console.error("NewsAPI error:", apiError);
      }
    }

    // 2. 日本のテックニュース (Google News経由)
    try {
      const googleNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(topic + " site:jp")}&hl=ja&gl=JP&ceid=JP:ja`;
      
      const RSSParser = require("rss-parser");
      const parser = new RSSParser();
      const feed = await parser.parseURL(googleNewsUrl);
      
      for (const item of feed.items.slice(0, 5)) {
        if (!item.link || !item.title) continue;
        
        // Googleニュースのリダイレクトを解決
        const actualUrl = await resolveGoogleNewsUrl(item.link);
        const enrichedContent = await enrichArticleContent(actualUrl, item.contentSnippet);
        
        evidences.push({
          title: item.title,
          url: actualUrl,
          domain: new URL(actualUrl).hostname,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          summary: enrichedContent.summary || item.contentSnippet || "",
          quotes: enrichedContent.quotes,
          stats: enrichedContent.stats,
          scores: {
            novelty: calculateNovelty(item.pubDate),
            credibility: calculateCredibility(new URL(actualUrl).hostname),
            biz_impact: calculateBizImpact(item.title, enrichedContent.summary)
          },
          source_type: "news",
          status: "pending",
          tags: [topic, "Google News"]
        });
      }
    } catch (rssError) {
      console.error("RSS parse error:", rssError);
    }

    // 3. Hacker News API - テック系の最新トレンド
    try {
      const hnSearchUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(topic)}&tags=story&hitsPerPage=5`;
      const hnResponse = await fetch(hnSearchUrl);
      
      if (hnResponse.ok) {
        const hnData = await hnResponse.json();
        
        for (const hit of hnData.hits || []) {
          if (!hit.url || !hit.title) continue;
          
          const enrichedContent = await enrichArticleContent(hit.url, hit.title);
          
          evidences.push({
            title: hit.title,
            url: hit.url,
            domain: new URL(hit.url).hostname,
            published_at: hit.created_at || new Date().toISOString(),
            summary: enrichedContent.summary || `HN Score: ${hit.points}. ${hit.num_comments} comments.`,
            quotes: enrichedContent.quotes,
            stats: enrichedContent.stats.concat([
              `Hacker News Score: ${hit.points}`,
              `コメント数: ${hit.num_comments}`
            ]),
            scores: {
              novelty: calculateNovelty(hit.created_at),
              credibility: 7, // Hacker Newsは中程度の信頼性
              biz_impact: Math.min(hit.points / 100, 10) // スコアに基づいて計算
            },
            source_type: "news",
            status: "pending",
            tags: [topic, "Hacker News"]
          });
        }
      }
    } catch (hnError) {
      console.error("HN API error:", hnError);
    }

    // 重複を除去
    const uniqueEvidences = evidences.reduce((acc: EvidenceInsert[], curr) => {
      if (!acc.find(e => e.url === curr.url)) {
        acc.push(curr);
      }
      return acc;
    }, []);

    // Supabaseに保存
    if (uniqueEvidences.length > 0) {
      const { data: inserted, error } = await sb
        .from("evidence")
        .upsert(uniqueEvidences, { onConflict: "url", ignoreDuplicates: true })
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
        message: `${inserted?.length || 0}件の実際のニュース記事を収集しました`,
        sources: ["NewsAPI", "Google News", "Hacker News"]
      });
    }

    return NextResponse.json({ 
      ok: true, 
      inserted: 0,
      evidences: [],
      message: "該当する記事が見つかりませんでした"
    });

  } catch (error) {
    console.error("News collection error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "ニュース収集中にエラーが発生しました"
      },
      { status: 500 }
    );
  }
}

// 記事内容を充実させる関数
async function enrichArticleContent(url: string, fallbackSummary: string = ""): Promise<{
  summary: string;
  quotes: string[];
  stats: string[];
}> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml'
      },
      signal: AbortSignal.timeout(5000) // 5秒でタイムアウト
    });
    
    if (!response.ok) {
      return { summary: fallbackSummary, quotes: [], stats: [] };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // より詳細な要約を取得
    const summary = 
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('article p').first().text().substring(0, 300) ||
      $('.content p').first().text().substring(0, 300) ||
      fallbackSummary;

    // 重要な引用を抽出
    const quotes: string[] = [];
    
    // 引用符で囲まれたテキストを探す
    const articleText = $('article').text() || $('main').text() || $('body').text();
    const quotePattern = /["「]([^"」]{20,200})["」]/g;
    const matches = articleText.match(quotePattern);
    if (matches) {
      quotes.push(...matches.slice(0, 3).map(q => q.replace(/["「」]/g, '')));
    }
    
    // blockquoteタグの内容
    $('blockquote').each((i, elem) => {
      if (i < 2) {
        const text = $(elem).text().trim();
        if (text.length > 20 && text.length < 300) {
          quotes.push(text);
        }
      }
    });

    // 統計データを抽出
    const stats: string[] = [];
    const statsPatterns = [
      /(\d+(?:\.\d+)?%)/g,
      /(\$[\d,]+(?:\.\d+)?[BMK]?)/g,
      /([\d,]+(?:\.\d+)?[億万]円)/g,
      /(\d+x faster)/gi,
      /(\d+% increase)/gi,
      /(\d+% growth)/gi,
      /(grew \d+%)/gi
    ];

    for (const pattern of statsPatterns) {
      const statMatches = articleText.match(pattern);
      if (statMatches) {
        stats.push(...statMatches.slice(0, 2));
      }
    }

    // 数値を含む重要な文を探す
    const sentences = articleText.split(/[。.!?]/);
    for (const sentence of sentences) {
      if (sentence.match(/\d+/) && sentence.length < 150) {
        if (sentence.includes('増') || sentence.includes('減') || 
            sentence.includes('成長') || sentence.includes('向上') ||
            sentence.includes('increase') || sentence.includes('decrease') ||
            sentence.includes('growth') || sentence.includes('improve')) {
          stats.push(sentence.trim());
          if (stats.length >= 5) break;
        }
      }
    }

    return {
      summary: summary.substring(0, 400),
      quotes: quotes.slice(0, 3),
      stats: stats.slice(0, 5)
    };

  } catch (error) {
    console.error("Content enrichment error:", error);
    return { summary: fallbackSummary, quotes: [], stats: [] };
  }
}

// Google Newsのリダイレクトを解決
async function resolveGoogleNewsUrl(googleUrl: string): Promise<string> {
  try {
    // Google NewsのURLから実際の記事URLを抽出
    const match = googleUrl.match(/url=([^&]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
    return googleUrl;
  } catch {
    return googleUrl;
  }
}

// スコア計算関数
function calculateNovelty(pubDate?: string): number {
  if (!pubDate) return 5;
  const hoursSincePublished = (Date.now() - new Date(pubDate).getTime()) / (1000 * 60 * 60);
  if (hoursSincePublished < 6) return 10;
  if (hoursSincePublished < 24) return 9;
  if (hoursSincePublished < 48) return 8;
  if (hoursSincePublished < 72) return 7;
  if (hoursSincePublished < 168) return 5;
  return 3;
}

function calculateCredibility(source: string): number {
  const trustedSources: { [key: string]: number } = {
    'reuters': 10,
    'bloomberg': 9.5,
    'wsj': 9.5,
    'ft.com': 9.5,
    'nytimes': 9,
    'techcrunch': 8.5,
    'wired': 8,
    'verge': 8,
    'arstechnica': 8,
    'mit': 9.5,
    'stanford': 9.5,
    'harvard': 9.5,
    'nature': 10,
    'science': 10
  };

  const lowerSource = source.toLowerCase();
  for (const [trusted, score] of Object.entries(trustedSources)) {
    if (lowerSource.includes(trusted)) {
      return score;
    }
  }
  return 6;
}

function calculateBizImpact(title: string, content: string): number {
  const impactWords = [
    'billion', 'million', 'revenue', 'profit', 'growth',
    'investment', 'funding', 'acquisition', 'IPO', 'merger',
    'market share', 'disruption', 'innovation', 'breakthrough',
    'partnership', 'expansion', 'launch', 'release'
  ];
  
  const combined = (title + " " + content).toLowerCase();
  let score = 5;
  
  for (const word of impactWords) {
    if (combined.includes(word)) {
      score += 0.8;
    }
  }
  
  return Math.min(score, 10);
}