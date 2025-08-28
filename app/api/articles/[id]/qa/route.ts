import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { sbServer } from "@/lib/supabase/server";
import type { ApiLogInsert } from "@/types/database";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sb = sbServer();
    const articleId = params.id;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    // 記事を取得
    const { data: article, error: fetchError } = await sb
      .from("articles")
      .select("*, evidence:evidence_ids(*)")
      .eq("id", articleId)
      .single();

    if (fetchError || !article) {
      return NextResponse.json(
        { ok: false, error: "記事が見つかりません" },
        { status: 404 }
      );
    }

    // エビデンスを取得
    const { data: evidences } = await sb
      .from("evidence")
      .select("*")
      .in("id", article.evidence_ids || []);

    // 評価プロンプト
    const systemPrompt = `あなたは記事品質評価の専門家です。
以下の5つの観点から記事を評価し、各0-100点でスコアリングしてください。

1. factual（事実確認）: エビデンスに基づいた主張か、日付・数字の正確性
2. readability（可読性）: 文章の流れ、段落構成、漢字仮名バランス
3. seo（SEO最適化）: 見出し構造、キーワード配置、メタ情報
4. originality（独自性）: 独自の視点、付加価値、差別化要素
5. biz_value（ビジネス価値）: 意思決定への貢献、実務への応用可能性

返却形式（JSON）:
{
  "scores": {
    "factual": 85,
    "readability": 90,
    "seo": 75,
    "originality": 80,
    "biz_value": 85
  },
  "total_score": 83,
  "improvements": [
    "具体的な改善点1",
    "具体的な改善点2",
    "具体的な改善点3"
  ],
  "strengths": [
    "優れている点1",
    "優れている点2"
  ],
  "rewrite_suggestions": [
    {
      "original": "改善前の文章",
      "improved": "改善後の文章",
      "reason": "改善理由"
    }
  ]
}`;

    const userPrompt = `以下の記事を評価してください。

【記事内容】
タイトル: ${article.title}
本文:
${article.content}

【参照エビデンス】
${evidences?.map((e: any) => `- ${e.title}: ${e.summary}`).join('\n')}

【SEO情報】
${JSON.stringify(article.seo || {}, null, 2)}`;

    // OpenAI API呼び出し
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0].message.content || "{}";
    
    // APIログを保存
    const apiLog: ApiLogInsert = {
      endpoint: `/api/articles/${articleId}/qa`,
      method: "POST",
      request_body: { article_id: articleId },
      response_body: JSON.parse(responseContent),
      model: "gpt-4-turbo-preview",
      temperature: 0.3,
      max_tokens: 2000
    };
    
    await sb.from("api_logs").insert(apiLog);

    // 評価結果を解析
    let evaluation: any = {};
    try {
      evaluation = JSON.parse(responseContent);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        { ok: false, error: "評価結果の解析に失敗しました" },
        { status: 500 }
      );
    }

    // 記事の品質スコアを更新
    const updateData = {
      quality: {
        factual: evaluation.scores?.factual || 0,
        readability: evaluation.scores?.readability || 0,
        seo: evaluation.scores?.seo || 0,
        originality: evaluation.scores?.originality || 0,
        biz_value: evaluation.scores?.biz_value || 0,
        total: evaluation.total_score || 0,
        improvements: evaluation.improvements || [],
        strengths: evaluation.strengths || [],
        evaluated_at: new Date().toISOString()
      }
    };

    // ステータス更新（80点以上なら ready に）
    if (evaluation.total_score >= 80) {
      updateData['status'] = 'ready';
    }

    const { error: updateError } = await sb
      .from("articles")
      .update(updateData)
      .eq("id", articleId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      evaluation,
      message: evaluation.total_score >= 80 
        ? "品質評価完了: 公開準備が整いました" 
        : "品質評価完了: 改善が必要です"
    });

  } catch (error) {
    console.error("QA error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "品質評価中にエラーが発生しました"
      },
      { status: 500 }
    );
  }
}