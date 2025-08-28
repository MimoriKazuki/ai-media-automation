'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_description: string;
  keywords: string[];
  quality_score: number;
  seo_score: number;
  readability_score: number;
  originality_score: number;
  accuracy_score: number;
  engagement_score: number;
  evaluation_details: any;
  status: string;
  created_at: string;
}

export default function ReviewPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPendingArticles();
  }, []);

  useEffect(() => {
    if (selectedArticle) {
      setEditedTitle(selectedArticle.title);
      setEditedContent(selectedArticle.content);
    }
  }, [selectedArticle]);

  const loadPendingArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .in('status', ['pending_review', 'draft'])
      .order('created_at', { ascending: false });

    if (data) {
      setArticles(data);
      if (data.length > 0) {
        setSelectedArticle(data[0]);
      }
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    if (!selectedArticle) return;
    setSaving(true);

    const { error } = await supabase
      .from('articles')
      .update({
        title: editedTitle,
        content: editedContent,
        status: 'approved',
        reviewed_by: 'reviewer', // In production, use actual user auth
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedArticle.id);

    if (!error) {
      await loadPendingArticles();
      alert('Article approved successfully!');
    }
    setSaving(false);
  };

  const handleReject = async () => {
    if (!selectedArticle) return;
    setSaving(true);

    const { error } = await supabase
      .from('articles')
      .update({
        status: 'rejected',
        reviewed_by: 'reviewer',
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedArticle.id);

    if (!error) {
      await loadPendingArticles();
      alert('Article rejected');
    }
    setSaving(false);
  };

  const handleSaveDraft = async () => {
    if (!selectedArticle) return;
    setSaving(true);

    const { error } = await supabase
      .from('articles')
      .update({
        title: editedTitle,
        content: editedContent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedArticle.id);

    if (!error) {
      alert('Draft saved successfully!');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-2xl">Loading articles...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Review Articles</h1>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            ← Back to Home
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Article List */}
          <div className="lg:col-span-1 bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Pending Articles</h2>
            <div className="space-y-2">
              {articles.length === 0 ? (
                <p className="text-gray-400">No articles to review</p>
              ) : (
                articles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedArticle?.id === article.id
                        ? 'bg-blue-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-sm font-semibold truncate">
                      {article.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Score: {article.quality_score?.toFixed(0)}/100
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Article Editor */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6">
            {selectedArticle ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full h-96 p-4 bg-gray-700 rounded-lg text-white font-mono text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={saving}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold disabled:opacity-50"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold disabled:opacity-50"
                  >
                    💾 Save Draft
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={saving}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold disabled:opacity-50"
                  >
                    ❌ Reject
                  </button>
                </div>
              </>
            ) : (
              <p className="text-gray-400">Select an article to review</p>
            )}
          </div>

          {/* Quality Scores */}
          <div className="lg:col-span-1 bg-gray-800 rounded-lg p-4">
            {selectedArticle && (
              <>
                <h2 className="text-xl font-semibold mb-4">Quality Scores</h2>
                <div className="space-y-3">
                  <ScoreItem
                    label="Overall"
                    score={selectedArticle.quality_score}
                    color="blue"
                  />
                  <ScoreItem
                    label="SEO"
                    score={selectedArticle.seo_score}
                    color="green"
                  />
                  <ScoreItem
                    label="Readability"
                    score={selectedArticle.readability_score}
                    color="yellow"
                  />
                  <ScoreItem
                    label="Originality"
                    score={selectedArticle.originality_score}
                    color="purple"
                  />
                  <ScoreItem
                    label="Accuracy"
                    score={selectedArticle.accuracy_score}
                    color="cyan"
                  />
                  <ScoreItem
                    label="Engagement"
                    score={selectedArticle.engagement_score}
                    color="pink"
                  />
                </div>

                {selectedArticle.evaluation_details?.improvements && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Improvements</h3>
                    <ul className="text-sm text-gray-400 space-y-1">
                      {selectedArticle.evaluation_details.improvements.map(
                        (imp: string, idx: number) => (
                          <li key={idx}>• {imp}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreItem({
  label,
  score,
  color,
}: {
  label: string;
  score: number | undefined;
  color: string;
}) {
  const scoreValue = score || 0;
  const percentage = scoreValue;
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600',
    cyan: 'bg-cyan-600',
    pink: 'bg-pink-600',
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-semibold">{scoreValue.toFixed(0)}/100</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={`${colorClasses[color]} h-2 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}