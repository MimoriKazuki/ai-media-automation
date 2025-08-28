"use client";

import { useState } from "react";

export default function SimpleArticlePage() {
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [article, setArticle] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  
  const generateArticle = async () => {
    if (!topic.trim()) {
      alert("トピックを入力してください");
      return;
    }
    
    setGenerating(true);
    try {
      const response = await fetch("/api/agents/research-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, mode: "research" }),
      });
      
      const data = await response.json();
      
      if (data.ok && data.workflow?.finalArticle) {
        setArticle(data.workflow.finalArticle);
        alert("記事が生成されました！");
      } else {
        alert("記事生成に失敗しました");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("エラーが発生しました");
    } finally {
      setGenerating(false);
    }
  };
  
  const copyToClipboard = async (format: "markdown" | "html") => {
    if (!article) return;
    
    let text = "";
    
    if (format === "markdown") {
      text = formatMarkdown(article);
    } else {
      text = formatHTML(article);
    }
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      alert("コピーに失敗しました");
    }
  };
  
  const formatMarkdown = (article: any) => {
    let md = `# ${article.seo_title || article.title || "タイトル"}\n\n`;
    
    if (article.meta_description) {
      md += `**メタディスクリプション:** ${article.meta_description}\n\n---\n\n`;
    }
    
    if (article.lead) {
      md += `${article.lead}\n\n`;
    }
    
    if (article.sections) {
      article.sections.forEach((section: any) => {
        md += `## ${section.heading}\n\n`;
        md += `${section.content}\n\n`;
        if (section.key_point) {
          md += `**ポイント:** ${section.key_point}\n\n`;
        }
      });
    } else if (article.optimized_article?.sections) {
      article.optimized_article.sections.forEach((section: any) => {
        md += `## ${section.heading}\n\n`;
        md += `${section.content}\n\n`;
      });
    }
    
    if (article.conclusion) {
      md += `## まとめ\n\n${article.conclusion}\n\n`;
    }
    
    if (article.cta) {
      md += `---\n\n${article.cta}\n\n`;
    }
    
    if (article.target_keywords?.length > 0) {
      md += `---\n\n**キーワード:** ${article.target_keywords.join(", ")}\n`;
    }
    
    if (article.estimated_ranking) {
      md += `**予想順位:** ${article.estimated_ranking}\n`;
    }
    
    if (article.monthly_traffic_potential) {
      md += `**月間予想トラフィック:** ${article.monthly_traffic_potential}\n`;
    }
    
    return md;
  };
  
  const formatHTML = (article: any) => {
    let html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${article.seo_title || article.title || "タイトル"}</title>`;
    
    if (article.meta_description) {
      html += `\n<meta name="description" content="${article.meta_description}">`;
    }
    
    if (article.target_keywords?.length > 0) {
      html += `\n<meta name="keywords" content="${article.target_keywords.join(", ")}">`;
    }
    
    html += `
</head>
<body>
<article>
<h1>${article.seo_title || article.title || "タイトル"}</h1>\n`;
    
    if (article.lead) {
      html += `<p class="lead">${article.lead}</p>\n`;
    }
    
    if (article.sections) {
      article.sections.forEach((section: any) => {
        html += `<h2>${section.heading}</h2>\n`;
        html += `<p>${section.content.replace(/\n\n/g, '</p>\n<p>')}</p>\n`;
        if (section.key_point) {
          html += `<p><strong>${section.key_point}</strong></p>\n`;
        }
      });
    } else if (article.optimized_article?.sections) {
      article.optimized_article.sections.forEach((section: any) => {
        html += `<h2>${section.heading}</h2>\n`;
        html += `<p>${section.content.replace(/\n\n/g, '</p>\n<p>')}</p>\n`;
      });
    }
    
    if (article.conclusion) {
      html += `<h2>まとめ</h2>\n<p>${article.conclusion}</p>\n`;
    }
    
    if (article.cta) {
      html += `<hr>\n<p>${article.cta}</p>\n`;
    }
    
    html += `</article>
</body>
</html>`;
    
    return html;
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">📝 シンプル記事生成ツール</h1>
        
        {/* 入力エリア */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex space-x-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="トピックを入力（例: AI自動化ツール）"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={generateArticle}
              disabled={generating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? "生成中...（30秒）" : "記事を生成"}
            </button>
          </div>
        </div>
        
        {/* 記事表示エリア */}
        {article && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">生成された記事</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyToClipboard("markdown")}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {copied ? "✅ コピー完了！" : "📋 Markdown"}
                </button>
                <button
                  onClick={() => copyToClipboard("html")}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  🌐 HTML
                </button>
              </div>
            </div>
            
            <div className="border rounded-lg p-6 max-h-[600px] overflow-y-auto">
              <h1 className="text-2xl font-bold mb-4">
                {article.seo_title || article.title || "タイトル"}
              </h1>
              
              {article.meta_description && (
                <div className="bg-yellow-50 p-4 rounded mb-4">
                  <strong>メタディスクリプション:</strong><br/>
                  {article.meta_description}
                </div>
              )}
              
              {article.lead && (
                <p className="text-lg mb-4">{article.lead}</p>
              )}
              
              {article.sections?.map((section: any, idx: number) => (
                <div key={idx} className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">{section.heading}</h2>
                  <p className="whitespace-pre-wrap">{section.content}</p>
                  {section.key_point && (
                    <p className="mt-2 font-medium text-blue-600">
                      ポイント: {section.key_point}
                    </p>
                  )}
                </div>
              ))}
              
              {article.optimized_article?.sections?.map((section: any, idx: number) => (
                <div key={idx} className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">{section.heading}</h2>
                  <p className="whitespace-pre-wrap">{section.content}</p>
                </div>
              ))}
              
              {article.conclusion && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">まとめ</h2>
                  <p>{article.conclusion}</p>
                </div>
              )}
              
              {article.cta && (
                <div className="border-t pt-4 mt-6">
                  <p className="font-medium">{article.cta}</p>
                </div>
              )}
              
              {/* SEO情報 */}
              <div className="bg-gray-50 p-4 rounded mt-6">
                <h3 className="font-semibold mb-2">SEO情報</h3>
                {article.target_keywords?.length > 0 && (
                  <p className="text-sm">
                    <strong>キーワード:</strong> {article.target_keywords.join(", ")}
                  </p>
                )}
                {article.estimated_ranking && (
                  <p className="text-sm">
                    <strong>予想順位:</strong> {article.estimated_ranking}
                  </p>
                )}
                {article.monthly_traffic_potential && (
                  <p className="text-sm">
                    <strong>月間予想トラフィック:</strong> {article.monthly_traffic_potential}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}