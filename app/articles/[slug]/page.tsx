import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LeadCaptureForm } from '@/components/lead-capture-form';
import Link from 'next/link';

interface ArticlePageProps {
  params: { slug: string };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { data: article } = await supabase
    .from('articles')
    .select('title, meta_description, keywords, published_at')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!article) {
    return {
      title: '記事が見つかりません',
    };
  }

  return {
    title: `${article.title} | AI Media Automation`,
    description: article.meta_description,
    keywords: article.keywords?.join(', '),
    openGraph: {
      title: article.title,
      description: article.meta_description || undefined,
      type: 'article',
      publishedTime: article.published_at,
      authors: ['AI Media Automation'],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.meta_description || undefined,
    },
    alternates: {
      canonical: `/articles/${params.slug}`,
    },
  };
}

// Generate static params for all published articles
export async function generateStaticParams() {
  const { data: articles } = await supabase
    .from('articles')
    .select('slug')
    .eq('status', 'published');

  return articles?.map((article) => ({
    slug: article.slug,
  })) || [];
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { data: article } = await supabase
    .from('articles')
    .select(`
      *,
      trends (
        keyword,
        score
      )
    `)
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!article) {
    notFound();
  }

  // Track page view
  await supabase
    .from('articles')
    .update({ view_count: (article.view_count || 0) + 1 })
    .eq('id', article.id);

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.meta_description,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    author: {
      '@type': 'Organization',
      name: 'AI Media Automation',
    },
    publisher: {
      '@type': 'Organization',
      name: 'AI Media Automation',
      logo: {
        '@type': 'ImageObject',
        url: 'https://example.com/logo.png',
      },
    },
    keywords: article.keywords?.join(', '),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <article className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="border-b bg-white sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                AI Media
              </Link>
              <div className="flex gap-6">
                <Link href="/articles" className="text-gray-600 hover:text-gray-900">
                  記事一覧
                </Link>
                <Link href="/resources" className="text-gray-600 hover:text-gray-900">
                  資料
                </Link>
                <Link href="/consultation" className="text-blue-600 font-semibold hover:text-blue-700">
                  無料相談
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Article Header */}
        <header className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex gap-2 mb-4">
              {article.keywords?.slice(0, 3).map((keyword: string) => (
                <span
                  key={keyword}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 text-gray-300">
              <time dateTime={article.published_at}>
                {new Date(article.published_at).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              <span>•</span>
              <span>{Math.ceil((article.content?.length || 0) / 400)} 分で読める</span>
              <span>•</span>
              <span>{article.view_count || 0} views</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Article Content */}
            <div className="lg:col-span-2">
              <div 
                className="prose prose-lg max-w-none 
                  prose-headings:text-gray-900 
                  prose-p:text-gray-700 
                  prose-a:text-blue-600 
                  prose-strong:text-gray-900
                  prose-ul:text-gray-700
                  prose-ol:text-gray-700
                  prose-blockquote:border-l-blue-500
                  prose-blockquote:bg-blue-50
                  prose-blockquote:py-2
                  prose-code:bg-gray-100
                  prose-code:px-1
                  prose-code:rounded"
                dangerouslySetInnerHTML={{ 
                  __html: article.markdown_content || article.content || '' 
                }}
              />

              {/* Article Footer CTA */}
              <div className="mt-12 pt-8 border-t">
                <LeadCaptureForm
                  source="article"
                  sourceDetail={article.id}
                  title="この記事の続編をお届けします"
                  description="AI導入の最新トレンドと成功事例を毎週配信。今なら「AI導入ロードマップ」を無料プレゼント！"
                  buttonText="無料で続編を受け取る"
                />
              </div>

              {/* Social Share */}
              <div className="mt-8 flex items-center gap-4">
                <span className="font-semibold text-gray-700">共有:</span>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    article.title
                  )}&url=${encodeURIComponent(
                    `${process.env.NEXT_PUBLIC_BASE_URL}/articles/${params.slug}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
                >
                  Twitter
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    `${process.env.NEXT_PUBLIC_BASE_URL}/articles/${params.slug}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                >
                  LinkedIn
                </a>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-8">
                {/* Quality Scores */}
                {article.quality_score && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold mb-4">記事の品質スコア</h3>
                    <div className="space-y-2">
                      <ScoreBar label="総合" score={article.quality_score} />
                      <ScoreBar label="SEO" score={article.seo_score} />
                      <ScoreBar label="読みやすさ" score={article.readability_score} />
                      <ScoreBar label="独自性" score={article.originality_score} />
                    </div>
                  </div>
                )}

                {/* CTA Box */}
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-2">
                    AI導入を検討中ですか？
                  </h3>
                  <p className="mb-4 text-blue-100">
                    無料相談で貴社に最適なAI活用方法をご提案します
                  </p>
                  <Link
                    href="/consultation"
                    className="block w-full text-center py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    無料相談を予約
                  </Link>
                </div>

                {/* Related Resources */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold mb-4">📚 関連資料</h3>
                  <ul className="space-y-3">
                    <li>
                      <Link
                        href="/resources/ai-implementation-roadmap-2024"
                        className="text-blue-600 hover:underline"
                      >
                        AI導入ロードマップ 2024年版
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/resources/dx-manager-ai-checklist"
                        className="text-blue-600 hover:underline"
                      >
                        DXマネージャー向けAIチェックリスト
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </>
  );
}

// Score bar component for quality metrics
function ScoreBar({ label, score }: { label: string; score?: number }) {
  const value = score || 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">{value.toFixed(0)}/100</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}