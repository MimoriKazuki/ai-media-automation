import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LeadMagnet } from '@/lib/types'
import LeadCaptureForm from '@/components/lead-capture-form'
import { Card, CardContent } from '@/components/ui/card'
import { Download, FileText, Users, TrendingUp } from 'lucide-react'

interface ResourcePageProps {
  params: {
    slug: string
  }
}

async function getLeadMagnet(slug: string): Promise<LeadMagnet | null> {
  const { data, error } = await supabase
    .from('lead_magnets')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

export async function generateMetadata({ params }: ResourcePageProps): Promise<Metadata> {
  const resource = await getLeadMagnet(params.slug)

  if (!resource) {
    return {
      title: 'Resource Not Found',
    }
  }

  return {
    title: resource.meta_title || `${resource.title} | AI Media Automation`,
    description: resource.meta_description || resource.description,
    keywords: resource.keywords?.join(', '),
    openGraph: {
      title: resource.title,
      description: resource.description || '',
      type: 'website',
    },
  }
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const resource = await getLeadMagnet(params.slug)

  if (!resource) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <FileText className="w-10 h-10 text-blue-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {resource.title}
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            {resource.description}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
            <div className="flex items-center">
              <Download className="w-4 h-4 mr-2" />
              {resource.download_count} ダウンロード
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              企業向け
            </div>
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              実践的
            </div>
          </div>
        </div>

        {/* Content Preview */}
        {resource.landing_page_content && (
          <Card className="mb-12">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                このリソースに含まれる内容
              </h2>
              <div 
                className="prose prose-lg max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: resource.landing_page_content }}
              />
            </CardContent>
          </Card>
        )}

        {/* Benefits */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              このリソースで得られるメリット
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    実装コストの削減
                  </h3>
                  <p className="text-gray-600">
                    実証済みの手法により、試行錯誤のコストを最小限に抑えられます。
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    リスクの軽減
                  </h3>
                  <p className="text-gray-600">
                    よくある落とし穴を事前に知ることで、プロジェクトの失敗リスクを大幅に削減します。
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    時間の短縮
                  </h3>
                  <p className="text-gray-600">
                    構造化されたアプローチにより、AI導入までの時間を大幅に短縮できます。
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    ROIの最大化
                  </h3>
                  <p className="text-gray-600">
                    効果的な測定指標とKPIの設定により、AI投資の ROIを最大化します。
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lead Capture Form */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              今すぐダウンロード
            </h2>
            <p className="text-gray-600">
              メールアドレスをご入力いただくと、即座にダウンロードリンクをお送りします。
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <LeadCaptureForm
              source="resource_download"
              cta={resource.cta_text}
              title={resource.title}
              description="ダウンロード後、追加の実装サポート情報も定期的にお送りします。"
              leadMagnetId={resource.id}
            />
          </div>
        </div>

        {/* Testimonials */}
        <Card className="mt-12">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              利用者の声
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4 italic">
                  「このガイドのおかげで、AI導入プロジェクトを3ヶ月短縮できました。特にリスク評価のフレームワークが非常に有用でした。」
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <p className="font-semibold text-gray-900">田中 様</p>
                    <p className="text-sm text-gray-600">IT企業 CTO</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4 italic">
                  「実践的で具体的な内容に満足しています。理論だけでなく、実際の導入事例が豊富で参考になりました。」
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <p className="font-semibold text-gray-900">佐藤 様</p>
                    <p className="text-sm text-gray-600">製造業 DX推進責任者</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}