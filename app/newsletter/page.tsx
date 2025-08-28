import { Metadata } from 'next'
import LeadCaptureForm from '@/components/lead-capture-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'AI Trends Newsletter | Weekly Industry Insights | AI Media Automation',
  description: 'Subscribe to our weekly AI trends newsletter. Get the latest insights on artificial intelligence, machine learning, and digital transformation for business leaders.',
  keywords: 'AI newsletter, AI trends, machine learning news, digital transformation, business AI insights',
  openGraph: {
    title: 'Weekly AI Trends Newsletter',
    description: 'Stay ahead with the latest AI industry insights delivered to your inbox every week.',
    type: 'website',
  },
}

export default function NewsletterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <span className="text-4xl">📧</span>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            週刊AIトレンドニュースレター
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            AI業界の最新動向、実装事例、そしてビジネスへの活用方法を、
            毎週金曜日にお届けします。経営層・DX推進担当者必見の情報源です。
          </p>

          <div className="flex items-center justify-center space-x-8 text-sm text-gray-600 mb-8">
            <div className="flex items-center">
              <span className="mr-2">⏰</span>
              毎週金曜配信
            </div>
            <div className="flex items-center">
              <span className="mr-2">👥</span>
              5,000+ 読者
            </div>
            <div className="flex items-center">
              <span className="mr-2">📈</span>
              実践的コンテンツ
            </div>
          </div>

          {/* Sample Newsletter Preview */}
          <div className="bg-white border-2 border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📧 最新号プレビュー
            </h3>
            <div className="text-left space-y-3 text-gray-700">
              <p className="font-medium">🔥 今週のトップトレンド</p>
              <p className="text-sm pl-4">• GPT-4 Turboの企業導入が加速</p>
              <p className="text-sm pl-4">• 製造業でのAI品質検査の普及</p>
              <p className="text-sm pl-4">• マルチモーダルAIの実用化事例</p>
              
              <p className="font-medium">💡 実装のヒント</p>
              <p className="text-sm pl-4">AIプロジェクトのROI測定方法</p>
              
              <p className="font-medium">🎯 成功事例</p>
              <p className="text-sm pl-4">小売大手のパーソナライゼーションAI導入事例</p>
              
              <p className="font-medium">📅 注目イベント</p>
              <p className="text-sm pl-4">来週開催のAIカンファレンス情報</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Newsletter Benefits */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="mr-3">✅</span>
                  ニュースレターで得られる価値
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-sm">📈</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      厳選されたトレンド情報
                    </h3>
                    <p className="text-gray-600">
                      数百の情報源から専門家が厳選した、本当に重要なAI業界の動向だけをお届けします。
                      ノイズを排除し、ビジネスに直結する情報に集中できます。
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-sm">👥</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      実践的な実装ガイド
                    </h3>
                    <p className="text-gray-600">
                      理論だけでなく、実際にAIを導入する際の具体的なステップ、
                      注意点、ベストプラクティスを毎週ご紹介します。
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-sm">📧</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      成功事例とケーススタディ
                    </h3>
                    <p className="text-gray-600">
                      業界別の成功事例、失敗から学ぶポイント、ROI計算方法など、
                      実際のプロジェクトから得られた知見を共有します。
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      時短と効率化
                    </h3>
                    <p className="text-gray-600">
                      忙しい経営陣やDX担当者でも5分で読める構成。
                      重要な情報を効率的にキャッチアップできます。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Past Issues */}
            <Card>
              <CardHeader>
                <CardTitle>過去の人気記事</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-gray-900">
                    「AI導入でよくある5つの失敗とその対策」
                  </h4>
                  <p className="text-sm text-gray-600">2024年1月12日号 • 開封率 78%</p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-gray-900">
                    「製造業におけるAI品質検査の導入ロードマップ」
                  </h4>
                  <p className="text-sm text-gray-600">2024年1月5日号 • 開封率 82%</p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-gray-900">
                    「ChatGPTを企業で安全に活用するためのガイドライン」
                  </h4>
                  <p className="text-sm text-gray-600">2023年12月29日号 • 開封率 85%</p>
                </div>
              </CardContent>
            </Card>

            {/* Testimonials */}
            <Card>
              <CardHeader>
                <CardTitle>読者の声</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 italic mb-3">
                    「毎週金曜日が楽しみになりました。業界の最新動向を効率的にキャッチアップでき、
                    実際に我が社のAI導入計画にも活用しています。」
                  </p>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                    <div>
                      <p className="font-semibold text-gray-900">田中 CTO</p>
                      <p className="text-xs text-gray-600">IT企業 従業員数300名</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 italic mb-3">
                    「技術的すぎず、経営的すぎない、ちょうど良いバランスの情報が得られます。
                    DX推進の参考資料として社内でも共有しています。」
                  </p>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                    <div>
                      <p className="font-semibold text-gray-900">佐藤 部長</p>
                      <p className="text-xs text-gray-600">製造業 DX推進部</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Signup Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <LeadCaptureForm
                source="newsletter"
                cta="無料で購読開始"
                title="今すぐ購読開始"
                description="毎週金曜日の朝に、最新のAI業界動向をお届けします。"
                className="shadow-lg"
              />
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 mb-4">
                  いつでも配信停止可能 • 完全無料 • スパムなし
                </p>
                
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                    毎週金曜日 朝8時配信
                  </div>
                  <div className="flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                    読了時間 約5分
                  </div>
                  <div className="flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                    実践的なAI活用ヒント
                  </div>
                  <div className="flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                    業界限定の成功事例
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Content */}
        <section className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            ニュースレターの構成
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">トップトレンド</h3>
              <p className="text-sm text-gray-600">
                今週最も注目すべき AI業界の動向トップ3
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">実装のヒント</h3>
              <p className="text-sm text-gray-600">
                すぐに活用できる実践的なAI導入のコツ
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">成功事例</h3>
              <p className="text-sm text-gray-600">
                実際の企業による AI活用の成功ストーリー
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">イベント情報</h3>
              <p className="text-sm text-gray-600">
                参加すべき AI関連のイベントやウェビナー
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}