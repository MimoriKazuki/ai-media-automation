import Link from 'next/link'
import { Mail, Calendar, FileText, BookOpen, Twitter, Linkedin, Github } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="ml-2 text-lg font-semibold text-white">
                AI Media Automation
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              企業のAI実装を成功に導く専門的なコンテンツとコンサルティングサービスを提供しています。
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">サービス</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/consultation" className="flex items-center text-gray-400 hover:text-white transition-colors">
                  <Calendar className="w-4 h-4 mr-2" />
                  無料コンサルテーション
                </Link>
              </li>
              <li>
                <Link href="/resources" className="flex items-center text-gray-400 hover:text-white transition-colors">
                  <BookOpen className="w-4 h-4 mr-2" />
                  実装ガイド・リソース
                </Link>
              </li>
              <li>
                <Link href="/newsletter" className="flex items-center text-gray-400 hover:text-white transition-colors">
                  <Mail className="w-4 h-4 mr-2" />
                  週刊ニュースレター
                </Link>
              </li>
              <li>
                <Link href="/articles" className="flex items-center text-gray-400 hover:text-white transition-colors">
                  <FileText className="w-4 h-4 mr-2" />
                  AI業界記事
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">リソース</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/resources/ai-implementation-roadmap-2024" className="text-gray-400 hover:text-white transition-colors">
                  AI実装ロードマップ 2024
                </Link>
              </li>
              <li>
                <Link href="/resources/dx-manager-ai-checklist" className="text-gray-400 hover:text-white transition-colors">
                  DX管理者向けAIチェックリスト
                </Link>
              </li>
              <li>
                <Link href="/case-studies" className="text-gray-400 hover:text-white transition-colors">
                  成功事例
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">
                  ブログ
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">会社情報</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                  会社概要
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  お問い合わせ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  利用規約
                </Link>
              </li>
            </ul>

            {/* Newsletter Signup */}
            <div className="mt-8 p-4 bg-gray-800 rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-2">
                ニュースレター購読
              </h4>
              <p className="text-xs text-gray-400 mb-3">
                週1回、AI業界の最新情報をお届けします
              </p>
              <Link href="/newsletter">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors">
                  無料で購読
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-400">
              © 2024 AI Media Automation. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
                プライバシーポリシー
              </Link>
              <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
                利用規約
              </Link>
              <Link href="/sitemap" className="text-sm text-gray-400 hover:text-white transition-colors">
                サイトマップ
              </Link>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 p-4 bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong>免責事項:</strong> 
              本サイトで提供される情報は、AI実装に関する一般的なガイダンスであり、
              特定の状況における専門的なアドバイスとして解釈されるべきではありません。
              実際の導入にあたっては、適切な専門家にご相談ください。
              また、技術の急速な進歩により、一部の情報が古くなる可能性があります。
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}