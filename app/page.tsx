import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, FileText, Mail, BookOpen, TrendingUp, Users, CheckCircle2, ArrowRight, Play } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            企業のAI実装を
            <br />
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              成功に導く
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            自動化されたコンテンツ生成と専門的なコンサルティングで、
            あなたの会社のデジタル変革を支援します
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/consultation">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4">
                <Calendar className="w-5 h-5 mr-2" />
                無料コンサルテーション予約
              </Button>
            </Link>
            <Link href="/resources">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4">
                <BookOpen className="w-5 h-5 mr-2" />
                無料リソースをダウンロード
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center space-x-8 text-sm opacity-75">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              5,000+ 企業が利用
            </div>
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              導入成功率 95%
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              完全無料相談
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              AI実装の全段階をサポート
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              情報収集から実装まで、企業のAI導入を包括的に支援します
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Link href="/articles" className="group">
              <Card className="h-full transition-all hover:shadow-lg hover:border-blue-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="group-hover:text-blue-600 transition-colors">
                    AI業界記事
                  </CardTitle>
                  <CardDescription>
                    最新のAI動向とビジネス活用事例
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Claude AIが生成する最新のAI業界記事で、常に業界の最前線の情報をキャッチアップ
                  </p>
                  <div className="flex items-center text-blue-600 font-medium text-sm">
                    記事を読む <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/resources" className="group">
              <Card className="h-full transition-all hover:shadow-lg hover:border-green-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                  <CardTitle className="group-hover:text-green-600 transition-colors">
                    実装リソース
                  </CardTitle>
                  <CardDescription>
                    実践的なガイドとチェックリスト
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    AI実装ロードマップ、チェックリスト、テンプレートなど実践的なリソースを無料提供
                  </p>
                  <div className="flex items-center text-green-600 font-medium text-sm">
                    リソース一覧 <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/newsletter" className="group">
              <Card className="h-full transition-all hover:shadow-lg hover:border-purple-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                    <Mail className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="group-hover:text-purple-600 transition-colors">
                    週刊ニュースレター
                  </CardTitle>
                  <CardDescription>
                    毎週金曜日の業界動向配信
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    厳選されたAI業界情報と実装のヒントを、毎週金曜日の朝にお届け
                  </p>
                  <div className="flex items-center text-purple-600 font-medium text-sm">
                    無料購読 <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/consultation" className="group">
              <Card className="h-full transition-all hover:shadow-lg hover:border-orange-300">
                <CardHeader>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                  <CardTitle className="group-hover:text-orange-600 transition-colors">
                    専門コンサルテーション
                  </CardTitle>
                  <CardDescription>
                    60分間の無料戦略セッション
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    AI実装の専門家との1対1コンサルテーションで、具体的な実装戦略をご提案
                  </p>
                  <div className="flex items-center text-orange-600 font-medium text-sm">
                    予約する <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">5,000+</div>
              <div className="text-gray-600">企業が利用</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">95%</div>
              <div className="text-gray-600">導入成功率</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">3ヶ月</div>
              <div className="text-gray-600">平均実装期間</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">300%</div>
              <div className="text-gray-600">平均ROI向上</div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              こんな方におすすめです
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8">
              <CardContent>
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  中規模企業の経営陣
                </h3>
                <p className="text-gray-600 mb-4">
                  年商10億円以上の企業で、AI導入による競争力強化をお考えの経営者・役員の方
                </p>
                <div className="text-blue-600 font-medium">年商10億円+ 企業向け</div>
              </CardContent>
            </Card>

            <Card className="text-center p-8">
              <CardContent>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  CTO・DX推進責任者
                </h3>
                <p className="text-gray-600 mb-4">
                  技術戦略の立案と実行を担当し、AI導入プロジェクトをリードする技術責任者の方
                </p>
                <div className="text-green-600 font-medium">技術リーダー向け</div>
              </CardContent>
            </Card>

            <Card className="text-center p-8">
              <CardContent>
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  スタートアップCTO
                </h3>
                <p className="text-gray-600 mb-4">
                  急成長中のスタートアップで、AI技術を活用したプロダクト開発を推進するCTOの方
                </p>
                <div className="text-purple-600 font-medium">スタートアップ向け</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Admin Access */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">管理者向け機能</h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Link href="/dashboard" className="group">
              <Card className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-all">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    ダッシュボード
                  </h3>
                  <p className="text-gray-400">
                    システムパフォーマンスと分析データの監視
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/review" className="group">
              <Card className="bg-gray-800 border-gray-700 hover:border-purple-500 transition-all">
                <CardContent className="p-6 text-center">
                  <FileText className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                    記事レビュー
                  </h3>
                  <p className="text-gray-400">
                    AI生成記事の品質確認と承認管理
                  </p>
                </CardContent>
              </Card>
            </Link>

            <div className="group">
              <Card className="bg-gray-800 border-gray-700 hover:border-green-500 transition-all">
                <CardContent className="p-6 text-center">
                  <Play className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-green-400 transition-colors">
                    パイプライン実行
                  </h3>
                  <p className="text-gray-400 mb-4">
                    AI記事生成パイプラインの手動実行
                  </p>
                  <Link href="/api/pipeline/run">
                    <Button variant="outline" size="sm" className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white">
                      <Play className="w-4 h-4 mr-2" />
                      実行
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            AI実装の第一歩を踏み出しませんか？
          </h2>
          <p className="text-xl mb-8 opacity-90">
            無料コンサルテーションで、あなたの会社に最適なAI導入戦略をご提案します
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/consultation">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4">
                <Calendar className="w-5 h-5 mr-2" />
                無料コンサルテーション予約
              </Button>
            </Link>
            <Link href="/resources">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4">
                <BookOpen className="w-5 h-5 mr-2" />
                実装ガイドをダウンロード
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
