import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { sbServer } from "@/lib/supabase/server";
import type { ArticleInsert, Evidence, ApiLogInsert } from "@/types/database";

export async function POST(req: NextRequest) {
  try {
    const { evidence_ids, persona = "enterprise", tone = "professional", target = "経営層", seo_optimized = true } = await req.json();
    
    if (!evidence_ids || !Array.isArray(evidence_ids) || evidence_ids.length === 0) {
      return NextResponse.json(
        { ok: false, error: "エビデンスIDを指定してください" },
        { status: 400 }
      );
    }

    const sb = sbServer();
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    // 承認済みエビデンスを取得
    const { data: evidences, error: fetchError } = await sb
      .from("evidence")
      .select("*")
      .in("id", evidence_ids)
      .eq("status", "approved");

    if (fetchError || !evidences || evidences.length === 0) {
      return NextResponse.json(
        { ok: false, error: "承認済みエビデンスが見つかりません" },
        { status: 404 }
      );
    }

    // システムプロンプト
    const systemPrompt = `あなたはB2B向けAIコンサルティングの編集長です。
承認済みエビデンスのみを使って、独自性と実務価値の高い日本語記事を作成します。

ペルソナ: ${persona}
読者層: ${target}
トーン: ${tone}

記事作成ルール:
1. 各章は400-600字で構成
2. 具体的な数値や事例を必ず含める
3. 意思決定に役立つ示唆を提供
4. 引用は脚注番号[1][2]形式で参照
5. 比喩や抽象的な表現は避ける
6. 見出しでスキャンしやすい構成にする`;

    // エビデンスをJSON形式で準備
    const evidenceJson = evidences.map((e: Evidence, idx: number) => ({
      id: idx + 1,
      title: e.title,
      summary: e.summary,
      quotes: e.quotes,
      stats: e.stats,
      url: e.url,
      domain: e.domain,
      published_at: e.published_at
    }));

    const userPrompt = `以下の承認済みエビデンスを使って、高品質な記事を作成してください。

エビデンス:
${JSON.stringify(evidenceJson, null, 2)}

出力形式（JSON）:
{
  "title": "記事タイトル（60字以内）",
  "outline": [
    {
      "h2": "セクション見出し",
      "bullets": ["ポイント1", "ポイント2", "ポイント3"]
    }
  ],
  "article_markdown": "# タイトル\\n\\n## 第1章\\n本文...\\n\\n## 第2章\\n本文...\\n\\n## まとめ\\n本文...\\n\\n## 参考文献\\n[1] タイトル - URL\\n[2] タイトル - URL",
  "seo": {
    "title_tag": "SEOタイトル（全角50-60字）",
    "meta_desc": "メタディスクリプション（全角110-130字）",
    "faq": [
      {"q": "質問1", "a": "回答1"},
      {"q": "質問2", "a": "回答2"}
    ],
    "ld_json": {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "記事タイトル",
      "description": "記事説明"
    }
  },
  "cta": {
    "text": "行動喚起テキスト",
    "position": "記事内の配置位置"
  }
}`;

    // Claude API呼び出し
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt
        }
      ]
    });

    // レスポンス処理
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response format from Claude");
    }

    let articleData: any = {};
    try {
      // JSONを抽出（コードブロック対応）
      const jsonMatch = content.text.match(/```json\n?([\s\S]*?)\n?```/) || 
                       content.text.match(/({[\s\S]*})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content.text;
      articleData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      // パースエラーの場合、テキストをそのまま使用
      articleData = {
        title: "生成された記事",
        content: content.text,
        outline: [],
        seo: {}
      };
    }

    // APIログを保存
    const apiLog: ApiLogInsert = {
      endpoint: "/api/articles/draft",
      method: "POST",
      request_body: { evidence_ids, persona, tone, target },
      response_body: articleData,
      model: "claude-3-opus-20240229",
      temperature: 0.7,
      max_tokens: 4000
    };
    
    await sb.from("api_logs").insert(apiLog);

    // 記事をデータベースに保存
    const article: ArticleInsert = {
      title: articleData.title || "無題の記事",
      outline: articleData.outline || [],
      content: articleData.article_markdown || articleData.content || "",
      evidence_ids: evidence_ids,
      seo: articleData.seo || {},
      status: "draft"
    };

    const { data: inserted, error: insertError } = await sb
      .from("articles")
      .insert(article)
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      ok: true, 
      article: inserted,
      message: "記事の下書きを作成しました"
    });

  } catch (error) {
    console.error("Draft creation error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "記事生成中にエラーが発生しました"
      },
      { status: 500 }
    );
  }
}