'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CollectedItem {
  id: string;
  title: string;
  url: string;
  source: string;
  content?: string;
  summary?: string; // AI生成の要約
  collected_at: string;
  selected?: boolean;
  score?: number;
  author?: string;
  tags?: string[];
}

interface CollectionProgress {
  source: string;
  status: 'pending' | 'collecting' | 'complete' | 'error';
  progress: number;
  itemsCollected: number;
  error?: string;
}

interface GeneratedArticle {
  title: string;
  content: string;
  quality_score: number;
  evaluation: any;
}

interface FilterOptions {
  sources: string[];
  minScore: number;
  searchTerm: string;
  sortBy: 'date' | 'score' | 'source';
}

export default function EnhancedWorkflowPage() {
  const [step, setStep] = useState<'collect' | 'select' | 'generate' | 'review'>('collect');
  const [collecting, setCollecting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [collectedData, setCollectedData] = useState<CollectedItem[]>([]);
  const [filteredData, setFilteredData] = useState<CollectedItem[]>([]);
  const [selectedData, setSelectedData] = useState<CollectedItem[]>([]);
  const [generatedArticles, setGeneratedArticles] = useState<GeneratedArticle[]>([]);
  const [totalProgress, setTotalProgress] = useState(0);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterOptions>({
    sources: [],
    minScore: 0,
    searchTerm: '',
    sortBy: 'date'
  });
  const [sourceProgress, setSourceProgress] = useState<CollectionProgress[]>([
    { source: 'RSS Feeds', status: 'pending', progress: 0, itemsCollected: 0 },
    { source: 'Reddit', status: 'pending', progress: 0, itemsCollected: 0 },
    { source: 'TechCrunch', status: 'pending', progress: 0, itemsCollected: 0 },
    { source: 'ArXiv', status: 'pending', progress: 0, itemsCollected: 0 },
    { source: 'GitHub Trending', status: 'pending', progress: 0, itemsCollected: 0 },
    { source: 'Hacker News', status: 'pending', progress: 0, itemsCollected: 0 },
    { source: 'Product Hunt', status: 'pending', progress: 0, itemsCollected: 0 },
    { source: 'AI Companies', status: 'pending', progress: 0, itemsCollected: 0 },
  ]);

  // データフィルタリング
  useEffect(() => {
    let filtered = [...collectedData];

    // ソースフィルター
    if (filters.sources.length > 0) {
      filtered = filtered.filter(item => filters.sources.includes(item.source));
    }

    // スコアフィルター
    if (filters.minScore > 0) {
      filtered = filtered.filter(item => (item.score || 0) >= filters.minScore);
    }

    // 検索フィルター
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(term) ||
        (item.content && item.content.toLowerCase().includes(term)) ||
        (item.summary && item.summary.toLowerCase().includes(term))
      );
    }

    // ソート
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'score':
          return (b.score || 0) - (a.score || 0);
        case 'source':
          return a.source.localeCompare(b.source);
        case 'date':
        default:
          return new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime();
      }
    });

    setFilteredData(filtered);
  }, [collectedData, filters]);

  // データ収集を開始
  const startCollection = async () => {
    setCollecting(true);
    setCollectedData([]);
    setTotalProgress(0);
    
    // すべてのソースをpendingにリセット
    setSourceProgress(prev => prev.map(p => ({ ...p, status: 'pending', progress: 0, itemsCollected: 0, error: undefined })));
    
    const eventSource = new EventSource('/api/collect-with-progress');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'start':
          console.log('収集開始:', data.message);
          break;
          
        case 'source_start':
          setSourceProgress(prev => prev.map(p => 
            p.source === data.source 
              ? { ...p, status: 'collecting' }
              : p
          ));
          break;
          
        case 'source_complete':
          setSourceProgress(prev => prev.map(p => 
            p.source === data.source 
              ? { ...p, status: 'complete', progress: 100, itemsCollected: data.itemsCollected }
              : p
          ));
          setTotalProgress(data.progress);
          break;
          
        case 'source_error':
          setSourceProgress(prev => prev.map(p => 
            p.source === data.source 
              ? { ...p, status: 'error', error: data.error }
              : p
          ));
          setTotalProgress(data.progress);
          break;
          
        case 'complete':
          console.log('収集完了:', data.totalCollected, '件');
          // データにIDと要約を追加
          const enhancedData = (data.data || []).map((item: any, index: number) => ({
            ...item,
            id: item.id || `item-${index}`,
            summary: item.content ? item.content.substring(0, 200) + '...' : '',
            tags: extractTags(item.title + ' ' + (item.content || ''))
          }));
          setCollectedData(enhancedData);
          setCollecting(false);
          eventSource.close();
          // 自動的に選択ステップに移行
          if (data.totalCollected > 0) {
            setStep('select');
          }
          break;
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      setCollecting(false);
      eventSource.close();
    };
  };

  // タグ抽出
  const extractTags = (text: string): string[] => {
    const aiKeywords = ['AI', 'GPT', 'Claude', 'LLM', 'Machine Learning', 'Deep Learning', 
                        'Neural Network', 'NLP', 'Computer Vision', 'AGI', 'Transformer'];
    const found: string[] = [];
    const lowerText = text.toLowerCase();
    
    aiKeywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        found.push(keyword);
      }
    });
    
    return found.slice(0, 5);
  };

  // アイテムの展開/折りたたみ
  const toggleItemExpansion = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // データ選択を切り替え
  const toggleDataSelection = (id: string) => {
    setCollectedData(prev => prev.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  // すべて選択/解除
  const toggleAllSelection = (select: boolean) => {
    setFilteredData(prev => prev.map(item => ({ ...item, selected: select })));
    setCollectedData(prev => {
      const filteredIds = new Set(filteredData.map(f => f.id));
      return prev.map(item => ({
        ...item,
        selected: filteredIds.has(item.id) ? select : item.selected
      }));
    });
  };

  // 選択したデータから記事を生成
  const generateArticles = async () => {
    const selected = collectedData.filter(item => item.selected);
    if (selected.length === 0) {
      alert('記事生成するデータを選択してください');
      return;
    }
    
    setGenerating(true);
    setSelectedData(selected);
    
    try {
      // 選択したデータからトレンドを分析して記事を生成
      const response = await fetch('/api/articles/generate-from-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: selected }),
      });
      
      const result = await response.json();
      if (result.success) {
        setGeneratedArticles(result.articles);
        setStep('review');
      } else {
        alert('記事生成に失敗しました: ' + result.error);
      }
    } catch (error) {
      console.error('Error generating articles:', error);
      alert('記事生成中にエラーが発生しました');
    } finally {
      setGenerating(false);
    }
  };

  // 記事を承認
  const approveArticle = async (index: number) => {
    const article = generatedArticles[index];
    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...article,
          status: 'published',
          approved: true,
        }),
      });
      
      if (response.ok) {
        alert('記事を公開しました！');
        // 承認済みの記事をマーク
        setGeneratedArticles(prev => prev.map((a, i) => 
          i === index ? { ...a, approved: true } : a
        ));
      }
    } catch (error) {
      console.error('Error approving article:', error);
    }
  };

  const selectedCount = collectedData.filter(item => item.selected).length;
  const uniqueSources = [...new Set(collectedData.map(item => item.source))];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            📋 強化版コントロールワークフロー
          </h1>
          <Link href="/admin" className="text-blue-400 hover:text-blue-300">
            ← 管理画面へ
          </Link>
        </div>

        {/* ステップインジケーター */}
        <div className="flex items-center justify-between mb-8">
          <div className={`flex-1 text-center pb-2 border-b-4 ${step === 'collect' ? 'border-blue-500 text-blue-400' : 'border-gray-700 text-gray-500'}`}>
            1. データ収集
          </div>
          <div className={`flex-1 text-center pb-2 border-b-4 ${step === 'select' ? 'border-blue-500 text-blue-400' : 'border-gray-700 text-gray-500'}`}>
            2. データ選択
          </div>
          <div className={`flex-1 text-center pb-2 border-b-4 ${step === 'generate' ? 'border-blue-500 text-blue-400' : 'border-gray-700 text-gray-500'}`}>
            3. 記事生成
          </div>
          <div className={`flex-1 text-center pb-2 border-b-4 ${step === 'review' ? 'border-blue-500 text-blue-400' : 'border-gray-700 text-gray-500'}`}>
            4. 確認・評価
          </div>
        </div>

        {/* ステップ1: データ収集 */}
        {step === 'collect' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">データ収集</h2>
                <button
                  onClick={startCollection}
                  disabled={collecting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded-lg"
                >
                  {collecting ? '収集中...' : '収集開始'}
                </button>
              </div>
              
              {/* 全体進捗 */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span>全体進捗</span>
                  <span className="font-bold">{totalProgress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${totalProgress}%` }}
                  />
                </div>
              </div>
              
              {/* 各ソースの進捗（グリッド表示） */}
              <div className="grid grid-cols-2 gap-4">
                {sourceProgress.map((source, i) => (
                  <div key={i} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{source.source}</span>
                      <span className={`text-sm ${
                        source.status === 'complete' ? 'text-green-400' :
                        source.status === 'error' ? 'text-red-400' :
                        source.status === 'collecting' ? 'text-blue-400' :
                        'text-gray-400'
                      }`}>
                        {source.status === 'complete' ? `✅ ${source.itemsCollected}件` :
                         source.status === 'error' ? '❌ エラー' :
                         source.status === 'collecting' ? '⏳ 収集中...' :
                         '⏸ 待機中'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          source.status === 'complete' ? 'bg-green-500' :
                          source.status === 'error' ? 'bg-red-500' :
                          source.status === 'collecting' ? 'bg-blue-500 animate-pulse' :
                          'bg-gray-500'
                        }`}
                        style={{ width: source.status === 'pending' ? '0%' : '100%' }}
                      />
                    </div>
                    {source.error && (
                      <p className="text-xs text-red-400 mt-1 truncate">{source.error}</p>
                    )}
                  </div>
                ))}
              </div>
              
              {collectedData.length > 0 && (
                <div className="mt-6 p-4 bg-green-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span>✅ 合計 {collectedData.length} 件のデータを収集しました</span>
                    <button
                      onClick={() => setStep('select')}
                      className="bg-green-600 hover:bg-green-700 px-4 py-1 rounded"
                    >
                      次へ →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ステップ2: データ選択（強化版） */}
        {step === 'select' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">データ選択 ({selectedCount}/{filteredData.length}件選択中)</h2>
                <div className="space-x-2">
                  <button
                    onClick={() => toggleAllSelection(true)}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
                  >
                    すべて選択
                  </button>
                  <button
                    onClick={() => toggleAllSelection(false)}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
                  >
                    すべて解除
                  </button>
                  <button
                    onClick={generateArticles}
                    disabled={selectedCount === 0 || generating}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded-lg"
                  >
                    {generating ? '生成中...' : `記事生成 (${selectedCount}件)`}
                  </button>
                </div>
              </div>

              {/* フィルター */}
              <div className="mb-4 p-4 bg-gray-700 rounded-lg">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm mb-1">検索</label>
                    <input
                      type="text"
                      placeholder="キーワード..."
                      className="w-full px-3 py-1 bg-gray-800 rounded"
                      value={filters.searchTerm}
                      onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">ソース</label>
                    <select
                      className="w-full px-3 py-1 bg-gray-800 rounded"
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        sources: e.target.value ? [e.target.value] : [] 
                      }))}
                    >
                      <option value="">すべて</option>
                      {uniqueSources.map(source => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">最小スコア</label>
                    <input
                      type="number"
                      className="w-full px-3 py-1 bg-gray-800 rounded"
                      value={filters.minScore}
                      onChange={(e) => setFilters(prev => ({ ...prev, minScore: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">並び順</label>
                    <select
                      className="w-full px-3 py-1 bg-gray-800 rounded"
                      value={filters.sortBy}
                      onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                    >
                      <option value="date">日付順</option>
                      <option value="score">スコア順</option>
                      <option value="source">ソース順</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredData.map((item, i) => (
                  <div 
                    key={item.id}
                    className={`p-4 rounded-lg border transition-all ${
                      item.selected 
                        ? 'bg-blue-900 border-blue-500 shadow-lg' 
                        : 'bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={item.selected || false}
                        onChange={() => toggleDataSelection(item.id)}
                        className="mt-1 w-5 h-5"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 
                            className="font-bold text-lg line-clamp-2 cursor-pointer hover:text-blue-400"
                            onClick={() => toggleItemExpansion(item.id)}
                          >
                            {item.title}
                          </h3>
                          <div className="flex flex-shrink-0 ml-3 space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              item.source.includes('Reddit') ? 'bg-orange-600' :
                              item.source.includes('HackerNews') ? 'bg-orange-500' :
                              item.source.includes('ArXiv') ? 'bg-purple-600' :
                              item.source.includes('GitHub') ? 'bg-gray-700' :
                              item.source.includes('Product') ? 'bg-green-600' :
                              item.source.includes('Google') ? 'bg-blue-600' :
                              item.source.includes('OpenAI') ? 'bg-teal-600' :
                              item.source.includes('Anthropic') ? 'bg-yellow-600' :
                              'bg-gray-600'
                            }`}>
                              {item.source}
                            </span>
                          </div>
                        </div>
                        
                        {/* コンテンツのプレビュー（展開可能） */}
                        <div className={`text-gray-300 text-sm mb-2 ${expandedItems.has(item.id) ? '' : 'line-clamp-3'}`}>
                          {item.content || item.summary || 'コンテンツなし'}
                        </div>
                        
                        {/* タグ */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {item.tags.map((tag, idx) => (
                              <span key={idx} className="px-2 py-1 bg-gray-700 rounded text-xs">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* メタデータ */}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <div className="flex items-center space-x-4">
                            {item.score !== undefined && (
                              <span className="flex items-center">
                                ⭐ スコア: {typeof item.score === 'number' ? item.score.toFixed(1) : item.score}
                              </span>
                            )}
                            {item.author && (
                              <span>👤 {item.author}</span>
                            )}
                            {item.collected_at && (
                              <span>📅 {new Date(item.collected_at).toLocaleString('ja-JP')}</span>
                            )}
                          </div>
                          {item.url && (
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-400 hover:text-blue-300 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              詳細を見る →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ステップ3&4は元のまま */}
        {step === 'generate' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">記事生成中...</h2>
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
            <p className="text-center text-gray-400">選択した {selectedData.length} 件のデータから記事を生成しています...</p>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">生成された記事の確認・評価</h2>
              
              {generatedArticles.map((article, i) => (
                <div key={i} className="mb-6 p-4 bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold">{article.title}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded text-sm ${
                        article.quality_score >= 90 ? 'bg-green-600' :
                        article.quality_score >= 80 ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}>
                        品質スコア: {article.quality_score}/100
                      </span>
                      <button
                        onClick={() => approveArticle(i)}
                        className="bg-green-600 hover:bg-green-700 px-4 py-1 rounded"
                      >
                        承認して公開
                      </button>
                    </div>
                  </div>
                  
                  <div className="prose prose-invert max-w-none mb-3">
                    <div className="max-h-40 overflow-y-auto text-gray-300">
                      {article.content.substring(0, 500)}...
                    </div>
                  </div>
                  
                  {article.evaluation && (
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>SEOスコア: {article.evaluation.seo_score}/10</div>
                      <div>読みやすさ: {article.evaluation.readability_score}/10</div>
                      <div>独創性: {article.evaluation.originality_score}/10</div>
                    </div>
                  )}
                </div>
              ))}
              
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => {
                    setStep('collect');
                    setCollectedData([]);
                    setGeneratedArticles([]);
                  }}
                  className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg"
                >
                  最初からやり直す
                </button>
                <button
                  onClick={() => setStep('select')}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
                >
                  データ選択に戻る
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}