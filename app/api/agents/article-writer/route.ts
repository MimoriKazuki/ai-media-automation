import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// シンプルかつ強力な記事生成API
// Next.js App Router対応
export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    
    if (!topic) {
      return NextResponse.json(
        { ok: false, error: "トピックを指定してください" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    
    // 完全な記事を一度で生成
    const articlePrompt = `
あなたは熟練のビジネスライターです。
「${topic}」についての詳細な記事を書いてください。

【重要な制約】
- 8000文字以上の長文記事を書く
- 実在する技術・サービス・企業のみ言及
- 具体的で実践的な内容
- 読者に価値を提供する

【記事構成】
1. 魅力的なタイトル（50文字前後）
2. 導入文（300-400文字）
   - 問題提起
   - なぜ今このテーマが重要か
   - 記事で得られる価値

3. 本文（各セクション1000-1500文字×6セクション以上）
   セクション例：
   - 基本概念の解説
   - 現在の市場動向
   - メリットとデメリット
   - 実装・導入方法
   - 成功事例と失敗事例
   - ベストプラクティス
   - コスト分析とROI
   - 将来展望

4. まとめ（400-500文字）
   - 要点の振り返り
   - 行動提案
   - 次のステップ

【文章スタイル】
- 専門的だが分かりやすい
- 具体例を豊富に使用
- データや統計を引用（現実的な範囲で）
- 読者の立場に立った説明

実際のビジネスで使える、価値ある記事を書いてください。
セクションごとに見出しを付け、読みやすく構造化してください。
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "あなたはビジネス専門のライターです。実践的で読者に価値のある長文記事を書きます。架空の情報は一切使わず、ビジネスに役立つ内容のみを提供します。"
        },
        { role: "user", content: articlePrompt }
      ],
      temperature: 0.7,
      max_tokens: 8000,
    });
    
    const articleContent = completion.choices[0].message.content || "";
    
    // SEOメタデータを生成
    const metaPrompt = `
以下の記事に対してSEOメタデータを生成してください：

${articleContent.substring(0, 1000)}...

JSON形式で以下を返してください：
{
  "title": "SEO最適化されたタイトル（50-60文字）",
  "meta_description": "メタディスクリプション（120文字）",
  "keywords": ["キーワード1", "キーワード2", "キーワード3", "キーワード4", "キーワード5"]
}
`;

    const metaCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "user", content: metaPrompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    const metadata = JSON.parse(metaCompletion.choices[0].message.content || "{}");
    
    // 記事を構造化
    const structuredArticle = {
      title: metadata.title || `${topic}の完全ガイド`,
      meta_description: metadata.meta_description || `${topic}について詳しく解説します`,
      content: articleContent,
      keywords: metadata.keywords || [topic],
      sections: extractSections(articleContent),
      word_count: articleContent.length,
      created_at: new Date().toISOString()
    };
    
    return NextResponse.json({
      ok: true,
      article: structuredArticle,
      message: "記事を生成しました"
    });
    
  } catch (error) {
    console.error("Article generation error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "記事生成エラー" },
      { status: 500 }
    );
  }
}

// 記事からセクションを抽出
function extractSections(content: string): Array<{heading: string, content: string}> {
  const sections: Array<{heading: string, content: string}> = [];
  const lines = content.split('\n');
  let currentSection: {heading: string, content: string} | null = null;
  
  for (const line of lines) {
    // 見出しを検出（#, ##, ###, 【】などのパターン）
    if (line.match(/^#+\s+.+/) || line.match(/^【.+】/) || line.match(/^\d+\.\s+.+/)) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        heading: line.replace(/^#+\s+/, '').replace(/^【|】$/g, '').replace(/^\d+\.\s+/, ''),
        content: ''
      };
    } else if (currentSection) {
      currentSection.content += line + '\n';
    }
  }
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
}