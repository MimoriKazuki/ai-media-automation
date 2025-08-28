'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SystemStatus {
  unprocessedData: number;
  recentArticles: number;
  articles: Array<{
    title: string;
    status: string;
    quality: number;
    created: string;
  }>;
  recentLogs: Array<{
    level: string;
    component: string;
    message: string;
    time: string;
  }>;
}

export default function AdminDashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/test?mode=status');
      const data = await response.json();
      if (data.success) {
        setStatus(data.status);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const runTest = async (mode: string) => {
    setLoading(true);
    setMessage(`${mode}を実行中...`);
    try {
      const response = await fetch(`/api/test?mode=${mode}`);
      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ ${mode}が完了しました`);
        setTestResults(data.result);
        
        // ステータスを更新
        if (mode === 'generate') {
          setTimeout(fetchStatus, 2000);
        }
      } else {
        setMessage(`❌ エラー: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ エラー: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const runAutomation = async (action: string) => {
    setLoading(true);
    setMessage(`${action}を実行中...`);
    try {
      const response = await fetch('/api/automation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ ${data.message}`);
        if (data.result) {
          setTestResults(data.result);
        }
        setTimeout(fetchStatus, 2000);
      } else {
        setMessage(`❌ エラー: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ エラー: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const runSmartPipeline = async () => {
    setLoading(true);
    setMessage('🚀 AIパイプラインを実行中...\n世界のAIトレンドを収集・分析して記事を生成します...');
    try {
      const response = await fetch('/api/pipeline/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ パイプライン完了！\n📊 ${data.articlesGenerated}件の記事を自動生成しました`);
        setTestResults({
          articlesGenerated: data.articlesGenerated,
          errors: data.errors,
          timestamp: data.timestamp
        });
        setTimeout(fetchStatus, 2000);
      } else {
        setMessage(`❌ パイプラインエラー: ${data.error}`);
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            🤖 AI記事自動生成 管理画面
          </h1>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            ← ホームへ
          </Link>
        </div>

        {/* コントロールパネル */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Link
            href="/admin/workflow"
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 p-4 rounded-lg transition-colors block text-center"
          >
            <div className="text-2xl mb-2">🎯</div>
            <div className="font-semibold">コントロール実行</div>
            <div className="text-sm opacity-75">手動選択での記事生成</div>
          </Link>

          <Link
            href="/admin/articles"
            className="bg-purple-600 hover:bg-purple-700 p-4 rounded-lg transition-colors block text-center"
          >
            <div className="text-2xl mb-2">📝</div>
            <div className="font-semibold">記事管理</div>
            <div className="text-sm opacity-75">記事の作成・編集・管理</div>
          </Link>

          <button
            onClick={() => runTest('collect')}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 p-4 rounded-lg transition-colors"
          >
            <div className="text-2xl mb-2">📥</div>
            <div className="font-semibold">データ収集</div>
            <div className="text-sm opacity-75">全ソースから情報収集</div>
          </button>

          <button
            onClick={() => runSmartPipeline()}
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:bg-gray-600 p-4 rounded-lg transition-colors"
          >
            <div className="text-2xl mb-2">🚀</div>
            <div className="font-semibold">AIパイプライン</div>
            <div className="text-sm opacity-75">収集→分析→自動記事生成</div>
          </button>

          <button
            onClick={() => runTest('generate')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 p-4 rounded-lg transition-colors"
          >
            <div className="text-2xl mb-2">✍️</div>
            <div className="font-semibold">手動生成</div>
            <div className="text-sm opacity-75">既存データから記事作成</div>
          </button>

          <button
            onClick={() => runAutomation('run_once')}
            disabled={loading}
            className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 p-4 rounded-lg transition-colors"
          >
            <div className="text-2xl mb-2">🔄</div>
            <div className="font-semibold">定期実行</div>
            <div className="text-sm opacity-75">30分毎の自動実行</div>
          </button>

          <button
            onClick={() => runAutomation('start')}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 p-4 rounded-lg transition-colors"
          >
            <div className="text-2xl mb-2">⚡</div>
            <div className="font-semibold">自動化開始</div>
            <div className="text-sm opacity-75">スケジューラーを起動</div>
          </button>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('✅') ? 'bg-green-800' : 
            message.includes('❌') ? 'bg-red-800' : 
            'bg-blue-800'
          }`}>
            {message}
          </div>
        )}

        {/* テスト結果 */}
        {testResults && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">実行結果</h2>
            <pre className="bg-gray-900 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* システムステータス */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">📊 システムステータス</h2>
            {status ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>未処理データ:</span>
                  <span className="font-bold text-yellow-400">{status.unprocessedData}件</span>
                </div>
                <div className="flex justify-between">
                  <span>最近の記事:</span>
                  <span className="font-bold text-green-400">{status.recentArticles}件</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">読み込み中...</p>
            )}
          </div>

          {/* 最新ログ */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">📋 最新ログ</h2>
            {status?.recentLogs ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {status.recentLogs.map((log, i) => (
                  <div key={i} className="text-sm">
                    <span className={`inline-block w-16 font-semibold ${
                      log.level === 'error' ? 'text-red-400' :
                      log.level === 'warning' ? 'text-yellow-400' :
                      'text-blue-400'
                    }`}>
                      [{log.level}]
                    </span>
                    <span className="text-gray-400 mx-2">{log.component}:</span>
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">ログがありません</p>
            )}
          </div>
        </div>

        {/* 最近の記事 */}
        {status?.articles && status.articles.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mt-8">
            <h2 className="text-2xl font-bold mb-4">📰 最近の記事</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2">タイトル</th>
                    <th className="text-left py-2">ステータス</th>
                    <th className="text-left py-2">品質スコア</th>
                    <th className="text-left py-2">作成日時</th>
                  </tr>
                </thead>
                <tbody>
                  {status.articles.map((article, i) => (
                    <tr key={i} className="border-b border-gray-700">
                      <td className="py-2 pr-4">
                        <div className="max-w-xs truncate">{article.title}</div>
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          article.status === 'published' ? 'bg-green-600' :
                          article.status === 'pending_review' ? 'bg-yellow-600' :
                          article.status === 'draft' ? 'bg-gray-600' :
                          'bg-red-600'
                        }`}>
                          {article.status}
                        </span>
                      </td>
                      <td className="py-2">
                        <span className={`font-semibold ${
                          article.quality >= 90 ? 'text-green-400' :
                          article.quality >= 80 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {article.quality?.toFixed(0) || '-'}/100
                        </span>
                      </td>
                      <td className="py-2 text-sm text-gray-400">
                        {new Date(article.created).toLocaleString('ja-JP')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 使い方 */}
        <div className="bg-gray-800 rounded-lg p-6 mt-8">
          <h2 className="text-2xl font-bold mb-4">📖 使い方</h2>
          <div className="space-y-3 text-gray-300">
            <p>1. <span className="text-blue-400">データ収集</span> - TechCrunch、ArXiv、GitHub、Reddit等から最新AI情報を収集</p>
            <p>2. <span className="text-purple-400">記事生成</span> - 収集したデータを分析し、高品質な記事を自動生成</p>
            <p>3. <span className="text-green-400">フルサイクル</span> - データ収集から記事生成まで一連の処理を実行</p>
            <p>4. <span className="text-red-400">自動化開始</span> - 30分ごとの収集、3時間ごとの生成を自動実行</p>
          </div>
          <div className="mt-4 p-4 bg-gray-900 rounded">
            <p className="text-yellow-400 text-sm">
              💡 ヒント: 品質スコア90以上の記事は自動的に公開されます。80-90の記事はレビュー待ちになります。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}