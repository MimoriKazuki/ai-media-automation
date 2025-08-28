"use client";

import { useEffect, useState } from "react";
import type { Evidence } from "@/types/database";

type FilterPeriod = "24h" | "7d" | "30d" | "all";
type Status = "pending" | "approved" | "rejected" | "all";

export default function InboxPage() {
  const [items, setItems] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<Status>("pending");
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("7d");
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [collecting, setCollecting] = useState(false);
  const [searchTopic, setSearchTopic] = useState("");
  const [collectionMode, setCollectionMode] = useState<"simple" | "real" | "agent">("agent");
  const [agentWorkflow, setAgentWorkflow] = useState<any>(null);

  // データ取得
  const loadEvidences = async () => {
    setLoading(true);
    try {
      // 期間フィルタの計算
      let fromDate = "";
      if (filterPeriod !== "all") {
        const now = new Date();
        const days = filterPeriod === "24h" ? 1 : filterPeriod === "7d" ? 7 : 30;
        now.setDate(now.getDate() - days);
        fromDate = now.toISOString();
      }

      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (fromDate) params.set("from", fromDate);
      params.set("limit", "50");

      const response = await fetch(`/api/evidence?${params}`);
      const data = await response.json();

      if (data.ok) {
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("Failed to load evidences:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvidences();
  }, [filterStatus, filterPeriod]);

  // 収集実行
  const handleCollect = async () => {
    if (!searchTopic.trim()) {
      alert("トピックを入力してください");
      return;
    }

    setCollecting(true);
    setAgentWorkflow(null);
    
    try {
      let endpoint = "/api/evidence/collect-simple";
      let body: any = { topic: searchTopic };
      
      if (collectionMode === "real") {
        endpoint = "/api/evidence/collect-real";
        body = { topic: searchTopic, limit: 20 };
      } else if (collectionMode === "agent") {
        endpoint = "/api/agents/research-team";
        body = { topic: searchTopic, mode: "research" };
      }
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      if (data.ok) {
        if (collectionMode === "agent" && data.workflow) {
          setAgentWorkflow(data.workflow);
          alert(`AIエージェントチームが${data.workflow.evidences?.length || 0}件の高品質エビデンスを収集し、記事を生成しました`);
        } else {
          alert(data.message || `${data.inserted || 0}件のエビデンスを収集しました`);
        }
        await loadEvidences();
        setSearchTopic("");
      } else {
        alert(`エラー: ${data.error}`);
        console.error("API Error details:", data);
      }
    } catch (error) {
      console.error("Collection error:", error);
      alert("収集中にエラーが発生しました");
    } finally {
      setCollecting(false);
    }
  };

  // 承認/却下
  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      const response = await fetch(`/api/evidence/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "reject" ? { reason: "品質不足" } : {}),
      });

      if (response.ok) {
        await loadEvidences();
        setSelectedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    } catch (error) {
      console.error(`${action} error:`, error);
    }
  };

  // バルク操作
  const handleBulkAction = async (action: "approve" | "reject") => {
    const promises = Array.from(selectedItems).map(id =>
      handleAction(id, action)
    );
    await Promise.all(promises);
    setSelectedItems(new Set());
  };

  // スコア計算
  const getTotalScore = (scores: any) => {
    if (!scores) return 0;
    const { novelty = 0, credibility = 0, biz_impact = 0 } = scores;
    return ((novelty + credibility + biz_impact) / 3).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Research Inbox</h1>
            <div className="flex items-center space-x-4">
              <select
                value={collectionMode}
                onChange={(e) => setCollectionMode(e.target.value as any)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="agent">🚀 AIエージェントチーム</option>
                <option value="real">🔍 リアル検索</option>
                <option value="simple">📝 テストデータ</option>
              </select>
              <input
                type="text"
                value={searchTopic}
                onChange={(e) => setSearchTopic(e.target.value)}
                placeholder="収集するトピック..."
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleCollect}
                disabled={collecting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {collecting ? "処理中..." : 
                 collectionMode === "agent" ? "エージェント実行" : "収集開始"}
              </button>
            </div>
          </div>

          {/* フィルタ */}
          <div className="flex items-center space-x-4 py-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">期間:</span>
              {(["24h", "7d", "30d", "all"] as FilterPeriod[]).map(period => (
                <button
                  key={period}
                  onClick={() => setFilterPeriod(period)}
                  className={`px-3 py-1 text-sm rounded ${
                    filterPeriod === period
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {period === "24h" ? "24時間" : 
                   period === "7d" ? "7日間" :
                   period === "30d" ? "30日間" : "全て"}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">ステータス:</span>
              {(["pending", "approved", "rejected", "all"] as Status[]).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 text-sm rounded ${
                    filterStatus === status
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {status === "pending" ? "未処理" :
                   status === "approved" ? "承認済" :
                   status === "rejected" ? "却下済" : "全て"}
                </button>
              ))}
            </div>

            {selectedItems.size > 0 && (
              <div className="ml-auto flex space-x-2">
                <button
                  onClick={() => handleBulkAction("approve")}
                  className="px-4 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  {selectedItems.size}件を承認
                </button>
                <button
                  onClick={() => handleBulkAction("reject")}
                  className="px-4 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  {selectedItems.size}件を却下
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">エビデンスがありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4"
              >
                {/* チェックボックス */}
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={(e) => {
                      const newSet = new Set(selectedItems);
                      if (e.target.checked) {
                        newSet.add(item.id);
                      } else {
                        newSet.delete(item.id);
                      }
                      setSelectedItems(newSet);
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    {/* ヘッダー */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-gray-900 hover:text-blue-600 line-clamp-2"
                        >
                          {item.title}
                        </a>
                        <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                          {item.domain && <span>{item.domain}</span>}
                          {item.published_at && (
                            <>
                              <span>•</span>
                              <span>{new Date(item.published_at).toLocaleDateString("ja-JP")}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* サマリ */}
                    {item.summary && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                        {item.summary}
                      </p>
                    )}

                    {/* スコア */}
                    {item.scores && (
                      <div className="flex items-center space-x-3 mb-3 text-xs">
                        <span className="text-gray-500">N: {item.scores.novelty || 0}</span>
                        <span className="text-gray-500">C: {item.scores.credibility || 0}</span>
                        <span className="text-gray-500">B: {item.scores.biz_impact || 0}</span>
                        <span className="font-semibold text-gray-700">
                          総合: {getTotalScore(item.scores)}
                        </span>
                      </div>
                    )}

                    {/* アクション */}
                    {item.status === "pending" && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAction(item.id, "approve")}
                          className="flex-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          承認
                        </button>
                        <button
                          onClick={() => handleAction(item.id, "reject")}
                          className="flex-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          却下
                        </button>
                        <button
                          onClick={() => setSelectedEvidence(item)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                        >
                          詳細
                        </button>
                      </div>
                    )}

                    {item.status !== "pending" && (
                      <div className="text-sm">
                        <span className={`px-2 py-1 rounded ${
                          item.status === "approved" 
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {item.status === "approved" ? "承認済" : "却下済"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* エージェントワークフロー表示 */}
      {agentWorkflow && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">AIエージェントチーム実行結果</h3>
            <div className="space-y-3">
              {agentWorkflow.agents?.map((agent: any, idx: number) => (
                <div key={idx} className="flex items-center space-x-3">
                  <span className="text-2xl">{agent.name.split(' ')[0]}</span>
                  <div className="flex-1">
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-sm text-gray-600">{agent.role}</div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    agent.status === '完了' ? 'bg-green-100 text-green-700' : 'bg-gray-100'
                  }`}>
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
            {agentWorkflow.finalArticle && (
              <div className="mt-4 p-3 bg-white rounded border">
                <div className="font-medium mb-2">生成された記事</div>
                <div className="text-sm text-gray-700 max-h-40 overflow-y-auto">
                  {JSON.stringify(agentWorkflow.finalArticle).substring(0, 500)}...
                </div>
              </div>
            )}
            <button
              onClick={() => setAgentWorkflow(null)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* 詳細モーダル */}
      {selectedEvidence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">{selectedEvidence.title}</h2>
              <button
                onClick={() => setSelectedEvidence(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {selectedEvidence.summary && (
                <div>
                  <h3 className="font-semibold mb-2">要約</h3>
                  <p className="text-gray-700">{selectedEvidence.summary}</p>
                </div>
              )}

              {selectedEvidence.quotes && Array.isArray(selectedEvidence.quotes) && selectedEvidence.quotes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">引用</h3>
                  <ul className="space-y-2">
                    {(selectedEvidence.quotes as string[]).map((quote, i) => (
                      <li key={i} className="pl-4 border-l-4 border-gray-300 text-gray-700">
                        {quote}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedEvidence.stats && Array.isArray(selectedEvidence.stats) && selectedEvidence.stats.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">統計</h3>
                  <ul className="list-disc list-inside">
                    {(selectedEvidence.stats as string[]).map((stat, i) => (
                      <li key={i} className="text-gray-700">{stat}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t">
                <a
                  href={selectedEvidence.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  原文を読む →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}