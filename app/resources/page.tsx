import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default async function ResourcesPage() {
  // Fetch lead magnets from database
  const { data: resources } = await supabase
    .from('lead_magnets')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              AI Media Automation
            </Link>
            <div className="flex gap-6">
              <Link href="/articles" className="text-gray-600 hover:text-gray-900">
                記事
              </Link>
              <Link href="/resources" className="text-blue-600 font-semibold">
                資料
              </Link>
              <Link href="/consultation" className="text-gray-600 hover:text-gray-900">
                無料相談
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            無料AI導入資料ライブラリ
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            実践的なガイド、チェックリスト、レポートを無料でダウンロード
          </p>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resources?.map((resource) => (
              <div
                key={resource.id}
                className={`bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow ${
                  resource.is_featured ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {resource.is_featured && (
                  <div className="bg-blue-500 text-white text-center py-1 text-sm font-semibold">
                    おすすめ
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-4xl">
                      {getResourceIcon(resource.content_type)}
                    </div>
                    <div className="flex-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wider">
                        {getResourceTypeLabel(resource.content_type)}
                      </span>
                      <h3 className="text-xl font-bold text-gray-900 mt-1">
                        {resource.title}
                      </h3>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {resource.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    {resource.page_count && (
                      <span>📄 {resource.page_count}ページ</span>
                    )}
                    {resource.reading_time && (
                      <span>⏱️ {resource.reading_time}分</span>
                    )}
                    {resource.download_count > 0 && (
                      <span>📥 {resource.download_count}DL</span>
                    )}
                  </div>
                  
                  {resource.topics && resource.topics.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {resource.topics.slice(0, 3).map((topic: string) => (
                        <span
                          key={topic}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <Link
                    href={`/resources/${resource.slug}`}
                    className="block w-full text-center py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    無料ダウンロード
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {(!resources || resources.length === 0) && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                現在準備中です。近日公開予定！
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            AI導入の具体的なご相談はこちら
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            資料だけでは解決できない課題も、専門家が無料でサポートします
          </p>
          <Link
            href="/consultation"
            className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            無料相談を予約する
            <span className="ml-2">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

function getResourceIcon(type: string): string {
  const icons: Record<string, string> = {
    report: '📊',
    whitepaper: '📄',
    checklist: '✅',
    template: '📋',
    guide: '📚',
  };
  return icons[type] || '📁';
}

function getResourceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    report: 'レポート',
    whitepaper: 'ホワイトペーパー',
    checklist: 'チェックリスト',
    template: 'テンプレート',
    guide: 'ガイド',
  };
  return labels[type] || '資料';
}