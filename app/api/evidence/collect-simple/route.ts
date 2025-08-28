import { NextRequest, NextResponse } from "next/server";
import { sbServer } from "@/lib/supabase/server";
import type { EvidenceInsert } from "@/types/database";

// シンプルなテスト用エビデンス収集（確実に動作する）
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
    const now = new Date();
    
    // テスト用のサンプルエビデンスを生成
    const evidences: EvidenceInsert[] = [
      {
        title: `${topic}の最新動向 - 2025年版完全ガイド`,
        url: `https://example.com/article-${Date.now()}-1`,
        domain: "techblog.example.com",
        published_at: new Date(now.getTime() - 86400000).toISOString(), // 1日前
        summary: `${topic}分野における最新の技術動向と市場分析。大手企業の導入事例や、今後の展望について詳しく解説。特に日本市場での成長可能性と課題について深掘りした内容。`,
        quotes: [
          `「${topic}は2025年に転換期を迎える」`,
          "業界リーダーの85%が既に導入を開始",
          "投資対効果は平均300%を達成"
        ],
        stats: [
          "市場規模: 2兆円（前年比150%）",
          "導入企業数: 国内5,000社超",
          "ユーザー満足度: 4.5/5.0"
        ],
        scores: {
          novelty: 8.5,
          credibility: 9.0,
          biz_impact: 8.0
        },
        source_type: "news",
        status: "pending",
        tags: [topic, "最新", "トレンド", "2025"]
      },
      {
        title: `${topic}導入で売上30%向上 - 成功事例レポート`,
        url: `https://example.com/article-${Date.now()}-2`,
        domain: "business.example.jp",
        published_at: new Date(now.getTime() - 172800000).toISOString(), // 2日前
        summary: `国内製造業大手が${topic}を活用し、業務効率化と売上向上を実現。具体的な導入プロセスとROI分析を公開。中小企業でも適用可能な実践的ノウハウ。`,
        quotes: [
          "導入から3ヶ月で黒字化を達成",
          "現場の作業時間を60%削減",
          "顧客満足度が過去最高を記録"
        ],
        stats: [
          "売上: 前年比130%",
          "コスト削減: 年間5億円",
          "生産性向上: 2.5倍"
        ],
        scores: {
          novelty: 7.0,
          credibility: 9.5,
          biz_impact: 10.0
        },
        source_type: "news",
        status: "pending",
        tags: [topic, "事例", "ROI", "成功"]
      },
      {
        title: `${topic} vs 競合製品 - 徹底比較2025`,
        url: `https://example.com/article-${Date.now()}-3`,
        domain: "comparison.example.net",
        published_at: now.toISOString(),
        summary: `主要な${topic}関連製品を徹底比較。機能、価格、サポート体制など多角的な観点から評価。導入を検討している企業必見の選定ガイド。`,
        quotes: [
          "コストパフォーマンスNo.1",
          "日本語サポートが充実",
          "カスタマイズ性で他を圧倒"
        ],
        stats: [
          "比較製品数: 15製品",
          "評価項目: 50項目以上",
          "ユーザー投票数: 10,000票"
        ],
        scores: {
          novelty: 9.0,
          credibility: 8.5,
          biz_impact: 7.5
        },
        source_type: "news",
        status: "pending",
        tags: [topic, "比較", "選定", "ガイド"]
      },
      {
        title: `${topic}の落とし穴 - 失敗事例から学ぶ`,
        url: `https://example.com/article-${Date.now()}-4`,
        domain: "insights.example.org",
        published_at: new Date(now.getTime() - 259200000).toISOString(), // 3日前
        summary: `${topic}導入で失敗した企業の事例を分析。共通する失敗パターンと回避方法を解説。これから導入する企業が注意すべきポイント。`,
        quotes: [
          "準備不足が最大の失敗要因",
          "段階的導入の重要性",
          "社内教育を軽視してはいけない"
        ],
        stats: [
          "失敗率: 初年度30%",
          "主な失敗要因: Top5分析",
          "回避可能な問題: 80%以上"
        ],
        scores: {
          novelty: 7.5,
          credibility: 8.0,
          biz_impact: 9.0
        },
        source_type: "news",
        status: "pending",
        tags: [topic, "注意点", "失敗", "教訓"]
      },
      {
        title: `2025年${topic}市場予測 - アナリストレポート`,
        url: `https://example.com/article-${Date.now()}-5`,
        domain: "research.example.com",
        published_at: new Date(now.getTime() - 3600000).toISOString(), // 1時間前
        summary: `大手調査会社による${topic}市場の将来予測。2030年までの成長シナリオと、参入企業が取るべき戦略を提言。投資判断の参考資料。`,
        quotes: [
          "2030年には10倍の市場規模に",
          "アジア市場が成長の中心",
          "技術革新が加速する見込み"
        ],
        stats: [
          "CAGR: 45.2%",
          "2030年市場規模: 20兆円",
          "新規参入企業: 年間500社"
        ],
        scores: {
          novelty: 10.0,
          credibility: 9.0,
          biz_impact: 8.5
        },
        source_type: "news",
        status: "pending",
        tags: [topic, "予測", "市場", "分析"]
      }
    ];
    
    // Supabaseに保存
    const { data: inserted, error } = await sb
      .from("evidence")
      .upsert(evidences, { 
        onConflict: "url",
        ignoreDuplicates: false 
      })
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
      message: `${inserted?.length || 0}件のエビデンスを収集しました`
    });

  } catch (error) {
    console.error("Collection error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "収集中にエラーが発生しました"
      },
      { status: 500 }
    );
  }
}