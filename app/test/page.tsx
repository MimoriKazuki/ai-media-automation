"use client";

import { useState } from "react";

export default function TestPage() {
  const [topic, setTopic] = useState("AI自動化ツール");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [mode, setMode] = useState<"agent" | "real" | "simple">("agent");
  
  const testCollect = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      let endpoint = "";
      let body: any = { topic };
      
      switch (mode) {
        case "agent":
          endpoint = "/api/agents/research-team";
          body = { topic, mode: "research" };
          break;
        case "real":
          endpoint = "/api/evidence/collect-real";
          body = { topic, limit: 10 };
          break;
        case "simple":
          endpoint = "/api/evidence/collect-simple";
          body = { topic };
          break;
      }
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Test error:", error);
      setResults({ error: error instanceof Error ? error.message : "エラー" });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AIエージェントテストページ</h1>
        
        {/* コントロール */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">トピック</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: AI自動化ツール, クラウドセキュリティ, SaaS開発"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">モード</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="agent">🚀 AIエージェントチーム（5つの専門AI）</option>
                <option value="real">🔍 リアル検索（Web検索シミュレーション）</option>
                <option value="simple">📝 テストデータ（動作確認用）</option>
              </select>
            </div>
            
            <button
              onClick={testCollect}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? "処理中...（30秒ほどかかります）" : "実行"}
            </button>
          </div>
        </div>
        
        {/* 結果表示 */}
        {results && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">実行結果</h2>
            
            {results.error ? (
              <div className="text-red-600">
                <p className="font-medium">エラー:</p>
                <p>{results.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* エージェントチームモード */}
                {results.workflow && (
                  <div>
                    <h3 className="font-semibold mb-3">AIエージェントワークフロー</h3>
                    <div className="space-y-3">
                      {results.workflow.agents?.map((agent: any, idx: number) => (
                        <div key={idx} className="border-l-4 border-blue-500 pl-4">
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-sm text-gray-600">{agent.role}</div>
                          {agent.output && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-sm text-blue-600">詳細を見る</summary>
                              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-60">
                                {JSON.stringify(agent.output, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {results.workflow.finalArticle && (
                      <div className="mt-6">
                        <h3 className="font-semibold mb-3">生成された記事</h3>
                        <div className="bg-gray-50 p-4 rounded">
                          <h4 className="font-bold text-lg mb-2">
                            {results.workflow.finalArticle.seo_title || results.workflow.finalArticle.title}
                          </h4>
                          {results.workflow.finalArticle.meta_description && (
                            <p className="text-sm text-gray-600 mb-3">
                              {results.workflow.finalArticle.meta_description}
                            </p>
                          )}
                          <details>
                            <summary className="cursor-pointer text-blue-600">記事全文を表示</summary>
                            <pre className="mt-3 text-sm whitespace-pre-wrap">
                              {JSON.stringify(results.workflow.finalArticle, null, 2)}
                            </pre>
                          </details>
                        </div>
                      </div>
                    )}
                    
                    {results.workflow.evidences && results.workflow.evidences.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-semibold mb-3">収集されたエビデンス（{results.workflow.evidences.length}件）</h3>
                        <div className="space-y-2">
                          {results.workflow.evidences.map((evidence: any) => (
                            <div key={evidence.id} className="border p-3 rounded">
                              <div className="font-medium">{evidence.title}</div>
                              <div className="text-sm text-gray-600">{evidence.domain}</div>
                              {evidence.scores && (
                                <div className="text-xs mt-1">
                                  新規性: {evidence.scores.novelty} | 
                                  信頼性: {evidence.scores.credibility} | 
                                  ビジネス影響: {evidence.scores.biz_impact}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 通常モード */}
                {!results.workflow && results.evidences && (
                  <div>
                    <h3 className="font-semibold mb-3">収集されたエビデンス（{results.evidences?.length || 0}件）</h3>
                    <div className="space-y-2">
                      {results.evidences?.map((evidence: any) => (
                        <div key={evidence.id} className="border p-3 rounded">
                          <div className="font-medium">{evidence.title}</div>
                          <a href={evidence.url} className="text-sm text-blue-600 hover:underline">
                            {evidence.url}
                          </a>
                          {evidence.summary && (
                            <p className="text-sm text-gray-600 mt-2">{evidence.summary}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 生のJSONも表示 */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-500">Raw JSON</summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                    {JSON.stringify(results, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}