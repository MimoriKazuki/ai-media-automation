'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'pending_review' | 'published';
  quality_score: number;
  seo_score: number;
  readability_score: number;
  keywords: string[];
  created_at: string;
  updated_at: string;
}

interface GenerationForm {
  topic: string;
  keywords: string;
  template: string;
  urgency: 'high' | 'medium' | 'low';
}

export default function ArticlesManagement() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editMode, setEditMode] = useState(false);
  const [apiKeyWarning, setApiKeyWarning] = useState(false);
  
  const [generationForm, setGenerationForm] = useState<GenerationForm>({
    topic: '',
    keywords: '',
    template: 'Introduction, Main Content, Examples, Conclusion',
    urgency: 'medium'
  });

  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    meta_description: '',
    keywords: '',
    status: ''
  });

  useEffect(() => {
    fetchArticles();
    checkAPIKey();
  }, [statusFilter]);

  const checkAPIKey = () => {
    const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'sk-ant-test-key') {
      setApiKeyWarning(true);
    }
  };

  const fetchArticles = async () => {
    try {
      const url = statusFilter === 'all' 
        ? '/api/articles/generate' 
        : `/api/articles/generate?status=${statusFilter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setArticles(data.articles);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  const generateArticle = async () => {
    setLoading(true);
    setMessage('記事を生成中...');
    
    try {
      const response = await fetch('/api/articles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...generationForm,
          keywords: generationForm.keywords.split(',').map(k => k.trim()).filter(k => k)
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const isMock = data.article.content?.includes('モックモード');
        setMessage(
          isMock 
            ? `✅ 記事が生成されました（モックモード） - 品質スコア: ${data.evaluation.total_score}/100`
            : `✅ 記事が生成されました - 品質スコア: ${data.evaluation.total_score}/100`
        );
        setShowGenerateForm(false);
        setGenerationForm({
          topic: '',
          keywords: '',
          template: 'Introduction, Main Content, Examples, Conclusion',
          urgency: 'medium'
        });
        await fetchArticles();
        setSelectedArticle(data.article);
      } else {
        if (data.error?.includes('invalid x-api-key') || data.error?.includes('ANTHROPIC_API_KEY')) {
          setMessage('⚠️ APIキーが設定されていません。README-API-SETUP.mdを参照してください。');
        } else {
          setMessage(`❌ エラー: ${data.error}`);
        }
      }
    } catch (error) {
      setMessage(`❌ エラー: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const viewArticle = async (id: string) => {
    try {
      const response = await fetch(`/api/articles/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedArticle(data.article);
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error fetching article:', error);
    }
  };

  const startEdit = (article: Article) => {
    setEditForm({
      title: article.title,
      content: article.content,
      meta_description: article.meta_description || '',
      keywords: article.keywords?.join(', ') || '',
      status: article.status
    });
    setEditMode(true);
  };

  const updateArticle = async () => {
    if (!selectedArticle) return;
    
    setLoading(true);
    setMessage('記事を更新中...');
    
    try {
      const response = await fetch(`/api/articles/${selectedArticle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          keywords: editForm.keywords.split(',').map(k => k.trim()).filter(k => k)
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ 記事が更新されました');
        setSelectedArticle(data.article);
        setEditMode(false);
        await fetchArticles();
      } else {
        setMessage(`❌ エラー: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ エラー: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteArticle = async (id: string) => {
    if (!confirm('この記事を削除してもよろしいですか？')) return;
    
    setLoading(true);
    setMessage('記事を削除中...');
    
    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ 記事が削除されました');
        setSelectedArticle(null);
        await fetchArticles();
      } else {
        setMessage(`❌ エラー: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ エラー: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            📝 記事管理システム
          </h1>
          <div className="flex gap-4">
            <Link href="/admin" className="text-blue-400 hover:text-blue-300">
              ← 管理画面へ
            </Link>
            <Link href="/" className="text-blue-400 hover:text-blue-300">
              ← ホームへ
            </Link>
          </div>
        </div>

        {/* APIキー警告 */}
        {apiKeyWarning && (
          <div className="bg-yellow-800 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold">APIキーが設定されていません</p>
                <p className="text-sm mt-1">
                  モックモードで動作しています。実際の記事生成には
                  <Link href="/ai-media-automation/README-API-SETUP.md" className="text-yellow-400 underline mx-1">
                    APIキーの設定
                  </Link>
                  が必要です。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* メッセージ表示 */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('✅') ? 'bg-green-800' : 
            message.includes('❌') ? 'bg-red-800' : 
            message.includes('⚠️') ? 'bg-yellow-800' :
            'bg-blue-800'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側: 記事リスト */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">記事一覧</h2>
                <button
                  onClick={() => setShowGenerateForm(!showGenerateForm)}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm"
                  disabled={loading}
                >
                  + 新規生成
                </button>
              </div>

              {/* フィルター */}
              <div className="mb-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-gray-700 rounded px-3 py-2"
                >
                  <option value="all">すべて</option>
                  <option value="draft">下書き</option>
                  <option value="pending_review">レビュー待ち</option>
                  <option value="published">公開済み</option>
                </select>
              </div>

              {/* 記事リスト */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => viewArticle(article.id)}
                    className={`p-3 rounded cursor-pointer transition-colors ${
                      selectedArticle?.id === article.id 
                        ? 'bg-gray-700' 
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                      {article.title}
                    </h3>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs px-2 py-1 rounded ${
                        article.status === 'published' ? 'bg-green-600' :
                        article.status === 'pending_review' ? 'bg-yellow-600' :
                        'bg-gray-600'
                      }`}>
                        {article.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        品質: {article.quality_score}/100
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 生成フォーム */}
            {showGenerateForm && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-bold mb-4">新規記事生成</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1">トピック</label>
                    <input
                      type="text"
                      value={generationForm.topic}
                      onChange={(e) => setGenerationForm({...generationForm, topic: e.target.value})}
                      className="w-full bg-gray-700 rounded px-3 py-2"
                      placeholder="例: AI開発の最新トレンド"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">キーワード (カンマ区切り)</label>
                    <input
                      type="text"
                      value={generationForm.keywords}
                      onChange={(e) => setGenerationForm({...generationForm, keywords: e.target.value})}
                      className="w-full bg-gray-700 rounded px-3 py-2"
                      placeholder="例: AI, 機械学習, ディープラーニング"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">緊急度</label>
                    <select
                      value={generationForm.urgency}
                      onChange={(e) => setGenerationForm({...generationForm, urgency: e.target.value as any})}
                      className="w-full bg-gray-700 rounded px-3 py-2"
                    >
                      <option value="low">低</option>
                      <option value="medium">中</option>
                      <option value="high">高</option>
                    </select>
                  </div>
                  <button
                    onClick={generateArticle}
                    disabled={loading || !generationForm.topic}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 py-2 rounded"
                  >
                    生成開始
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 右側: 記事詳細 */}
          <div className="lg:col-span-2">
            {selectedArticle ? (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    {editMode ? (
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                        className="text-2xl font-bold bg-gray-700 rounded px-3 py-2 w-full"
                      />
                    ) : (
                      <h2 className="text-2xl font-bold">{selectedArticle.title}</h2>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-gray-400">
                      <span>作成: {new Date(selectedArticle.created_at).toLocaleDateString('ja-JP')}</span>
                      {selectedArticle.updated_at && (
                        <span>更新: {new Date(selectedArticle.updated_at).toLocaleDateString('ja-JP')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {editMode ? (
                      <>
                        <button
                          onClick={updateArticle}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditMode(false)}
                          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm"
                        >
                          キャンセル
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(selectedArticle)}
                          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => deleteArticle(selectedArticle.id)}
                          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
                        >
                          削除
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* スコア表示 */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-xs text-gray-400">品質スコア</div>
                    <div className={`text-2xl font-bold ${
                      selectedArticle.quality_score >= 90 ? 'text-green-400' :
                      selectedArticle.quality_score >= 80 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {selectedArticle.quality_score}/100
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-xs text-gray-400">SEOスコア</div>
                    <div className="text-2xl font-bold text-blue-400">
                      {selectedArticle.seo_score}/100
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-xs text-gray-400">読みやすさ</div>
                    <div className="text-2xl font-bold text-purple-400">
                      {selectedArticle.readability_score}/100
                    </div>
                  </div>
                </div>

                {/* ステータス */}
                {editMode && (
                  <div className="mb-4">
                    <label className="block text-sm mb-1">ステータス</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                      className="bg-gray-700 rounded px-3 py-2"
                    >
                      <option value="draft">下書き</option>
                      <option value="pending_review">レビュー待ち</option>
                      <option value="published">公開済み</option>
                    </select>
                  </div>
                )}

                {/* キーワード */}
                <div className="mb-4">
                  <label className="block text-sm mb-1">キーワード</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editForm.keywords}
                      onChange={(e) => setEditForm({...editForm, keywords: e.target.value})}
                      className="w-full bg-gray-700 rounded px-3 py-2"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedArticle.keywords?.map((keyword, i) => (
                        <span key={i} className="bg-gray-700 px-3 py-1 rounded text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* コンテンツ */}
                <div className="mb-4">
                  <label className="block text-sm mb-1">コンテンツ</label>
                  {editMode ? (
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                      className="w-full h-96 bg-gray-700 rounded px-3 py-2 font-mono text-sm"
                    />
                  ) : (
                    <div className="bg-gray-700 rounded p-4 max-h-96 overflow-y-auto prose prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap">{selectedArticle.content}</pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
                <p className="text-xl mb-4">📄</p>
                <p>記事を選択してください</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}