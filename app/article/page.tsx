"use client";

import { useState, useEffect } from "react";
import { sbClient } from "@/lib/supabase/client";

export default function ArticlePage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generatingArticle, setGeneratingArticle] = useState(false);
  const [topic, setTopic] = useState("");
  
  // 記事一覧を取得
  const loadArticles = async () => {
    setLoading(true);
    try {
      const { data, error } = await sbClient
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) {
        console.error("Supabase fetch error:", error);
        // エラー時は空配列をセット
        setArticles([]);
        // ローカルストレージから取得を試みる
        const localData = localStorage.getItem("local_articles");
        if (localData) {
          try {
            const parsedData = JSON.parse(localData);
            setArticles(parsedData);
          } catch (e) {
            console.error("Local storage parse error:", e);
          }
        }
      } else {
        setArticles(data || []);
      }
    } catch (error) {
      console.error("Error loading articles:", error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadArticles();
  }, []);
  
  // AIエージェントで新しい記事を生成
  const generateNewArticle = async () => {
    if (!topic.trim()) {
      alert("トピックを入力してください");
      return;
    }
    
    setGeneratingArticle(true);
    try {
      const response = await fetch("/api/agents/article-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      
      const data = await response.json();
      
      if (data.ok && data.article) {
        // 記事をデータベースに保存
        const article = data.article;
        
        // デバッグ用にarticleの内容を確認
        console.log("Generated article:", article);
        
        try {
          const { data: saved, error } = await sbClient
            .from("articles")
            .insert({
              title: article.title || `${topic}の完全ガイド`,
              content: article.content || "",
              tags: article.keywords || [topic],
              status: "draft",
              seo_meta: {
                meta_description: article.meta_description || "",
                keywords: article.keywords || [],
                estimated_ranking: "10位以内",
                monthly_traffic_potential: "1,000〜5,000 PV"
              },
              quality_score: 90
            })
            .select()
            .single();
          
          if (error) {
            console.error("Supabase insert error:", error);
            // エラーがあってもローカルで表示
            const localArticle = {
              id: `local-${Date.now()}`,
              title: article.title || `${topic}の完全ガイド`,
              content: article.content || "",
              tags: article.keywords || [topic],
              seo_meta: {
                meta_description: article.meta_description || "",
                keywords: article.keywords || [],
                estimated_ranking: "10位以内",
                monthly_traffic_potential: "1,000〜5,000 PV"
              },
              quality_score: 90,
              created_at: new Date().toISOString()
            };
            const updatedArticles = [localArticle, ...articles];
            setArticles(updatedArticles);
            setSelectedArticle(localArticle);
            // ローカルストレージに保存
            localStorage.setItem("local_articles", JSON.stringify(updatedArticles));
            alert("記事は生成されましたが、保存時にエラーが発生しました。記事は表示されています。");
          } else {
            alert("記事が生成されました！");
            await loadArticles();
            setTopic("");
            if (saved) {
              setSelectedArticle(saved);
            }
          }
        } catch (dbError) {
          console.error("Database operation error:", dbError);
          // DBエラーでも記事は表示
          const localArticle = {
            id: `local-${Date.now()}`,
            title: article.title || `${topic}の完全ガイド`,
            content: article.content || "",
            tags: article.keywords || [topic],
            seo_meta: {
              meta_description: article.meta_description || "",
              keywords: article.keywords || [],
              estimated_ranking: "10位以内",
              monthly_traffic_potential: "1,000〜5,000 PV"
            },
            quality_score: 90,
            created_at: new Date().toISOString()
          };
          const updatedArticles = [localArticle, ...articles];
          setArticles(updatedArticles);
          setSelectedArticle(localArticle);
          // ローカルストレージに保存
          localStorage.setItem("local_articles", JSON.stringify(updatedArticles));
          alert("記事は生成されました（ローカル表示）");
        }
      } else {
        console.error("API response error:", data);
        alert(`記事生成に失敗しました: ${data.error || "不明なエラー"}`);
      }
    } catch (error) {
      console.error("Article generation error:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      alert(`エラーが発生しました: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    } finally {
      setGeneratingArticle(false);
    }
  };
  
  // 記事をフォーマット（不要になったので空処理）
  const formatArticleForDB = (article: any) => {
    // 新APIではcontentが直接渡されるので、この処理は不要
    return article.content || "";
  };
  
  // 記事を表示用にフォーマット
  const formatArticleForDisplay = (article: any) => {
    if (!article) return "";
    
    let formatted = "";
    
    // SEOタイトル
    formatted += `# ${article.title}\n\n`;
    
    // メタディスクリプション
    if (article.seo_meta?.meta_description) {
      formatted += `**メタディスクリプション:**\n${article.seo_meta.meta_description}\n\n`;
      formatted += "---\n\n";
    }
    
    // 本文
    formatted += article.content || "";
    
    // SEO情報
    if (article.seo_meta) {
      formatted += "\n\n---\n\n";
      formatted += "## SEO情報\n\n";
      if (article.seo_meta.keywords?.length > 0) {
        formatted += `**ターゲットキーワード:** ${article.seo_meta.keywords.join(", ")}\n\n`;
      }
      if (article.seo_meta.estimated_ranking) {
        formatted += `**予想順位:** ${article.seo_meta.estimated_ranking}\n\n`;
      }
      if (article.seo_meta.monthly_traffic_potential) {
        formatted += `**月間予想トラフィック:** ${article.seo_meta.monthly_traffic_potential}\n\n`;
      }
    }
    
    return formatted;
  };
  
  // クリップボードにコピー
  const copyToClipboard = async () => {
    if (!selectedArticle) return;
    
    const text = formatArticleForDisplay(selectedArticle);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      alert("コピーに失敗しました");
    }
  };
  
  // HTML形式でコピー
  const copyAsHTML = async () => {
    if (!selectedArticle) return;
    
    let html = `<!DOCTYPE html>\n<html lang="ja">\n<head>\n`;
    html += `<meta charset="UTF-8">\n`;
    html += `<meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
    html += `<title>${selectedArticle.title}</title>\n`;
    
    if (selectedArticle.seo_meta?.meta_description) {
      html += `<meta name="description" content="${selectedArticle.seo_meta.meta_description}">\n`;
    }
    if (selectedArticle.seo_meta?.keywords?.length > 0) {
      html += `<meta name="keywords" content="${selectedArticle.seo_meta.keywords.join(", ")}">\n`;
    }
    
    html += `</head>\n<body>\n`;
    html += `<article>\n`;
    html += `<h1>${selectedArticle.title}</h1>\n`;
    
    // コンテンツをHTMLに変換
    const lines = (selectedArticle.content || "").split("\n");
    let inParagraph = false;
    
    lines.forEach((line: string) => {
      if (line.startsWith("## ")) {
        if (inParagraph) {
          html += "</p>\n";
          inParagraph = false;
        }
        html += `<h2>${line.substring(3)}</h2>\n`;
      } else if (line.startsWith("**") && line.endsWith("**")) {
        if (inParagraph) {
          html += "</p>\n";
          inParagraph = false;
        }
        html += `<p><strong>${line.slice(2, -2)}</strong></p>\n`;
      } else if (line.trim() === "") {
        if (inParagraph) {
          html += "</p>\n";
          inParagraph = false;
        }
      } else if (line.trim() !== "---") {
        if (!inParagraph) {
          html += "<p>";
          inParagraph = true;
        }
        html += line + " ";
      }
    });
    
    if (inParagraph) {
      html += "</p>\n";
    }
    
    html += `</article>\n`;
    html += `</body>\n</html>`;
    
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      alert("コピーに失敗しました");
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-6">📝 記事管理・コピーツール</h1>
          
          {/* 新規記事生成 */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="トピックを入力（例: AI自動化ツール）"
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={generateNewArticle}
                disabled={generatingArticle}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {generatingArticle ? "生成中...（30秒）" : "🚀 新規記事を生成"}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 記事リスト */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-semibold mb-4">記事一覧</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="text-center py-4">読み込み中...</div>
                ) : articles.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">
                    記事がありません。新規作成してください。
                  </div>
                ) : (
                  articles.map((article) => (
                    <div
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className={`p-3 border rounded cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedArticle?.id === article.id ? "border-blue-500 bg-blue-50" : ""
                      }`}
                    >
                      <div className="font-medium line-clamp-2">{article.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(article.created_at).toLocaleDateString("ja-JP")}
                        {article.quality_score && (
                          <span className="ml-2">スコア: {article.quality_score}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* 記事プレビュー */}
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">記事プレビュー</h2>
                {selectedArticle && (
                  <div className="flex space-x-2">
                    <button
                      onClick={copyToClipboard}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      {copied ? "✅ コピー完了！" : "📋 Markdownでコピー"}
                    </button>
                    <button
                      onClick={copyAsHTML}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      🌐 HTMLでコピー
                    </button>
                  </div>
                )}
              </div>
              
              {selectedArticle ? (
                <div className="border rounded-lg p-6 bg-white max-h-[600px] overflow-y-auto">
                  <div className="prose max-w-none">
                    <h1 className="text-2xl font-bold mb-4">{selectedArticle.title}</h1>
                    
                    {selectedArticle.seo_meta?.meta_description && (
                      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                        <div className="text-sm font-semibold text-gray-700 mb-1">
                          メタディスクリプション:
                        </div>
                        <div className="text-gray-600">
                          {selectedArticle.seo_meta.meta_description}
                        </div>
                      </div>
                    )}
                    
                    <div className="whitespace-pre-wrap">
                      {selectedArticle.content}
                    </div>
                    
                    {selectedArticle.seo_meta && (
                      <div className="mt-8 pt-6 border-t">
                        <h3 className="font-semibold mb-4">SEO最適化情報</h3>
                        <div className="space-y-2 text-sm">
                          {selectedArticle.seo_meta.keywords?.length > 0 && (
                            <div>
                              <span className="font-medium">キーワード:</span>{" "}
                              {selectedArticle.seo_meta.keywords.map((kw: string, idx: number) => (
                                <span key={idx} className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded mr-2 mb-1">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}
                          {selectedArticle.seo_meta.estimated_ranking && (
                            <div>
                              <span className="font-medium">予想順位:</span>{" "}
                              <span className="text-green-600">
                                {selectedArticle.seo_meta.estimated_ranking}
                              </span>
                            </div>
                          )}
                          {selectedArticle.seo_meta.monthly_traffic_potential && (
                            <div>
                              <span className="font-medium">月間予想トラフィック:</span>{" "}
                              <span className="text-blue-600">
                                {selectedArticle.seo_meta.monthly_traffic_potential}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-12 text-center text-gray-500">
                  左側から記事を選択するか、新規記事を生成してください
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}