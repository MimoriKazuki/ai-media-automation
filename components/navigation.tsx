'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, X, FileText, Users, BookOpen, Mail, Calendar, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigationItems = [
  {
    name: '記事',
    href: '/articles',
    icon: FileText,
    description: 'AI業界の最新トレンド記事'
  },
  {
    name: 'リソース',
    href: '/resources',
    icon: BookOpen,
    description: '無料実装ガイドとツール'
  },
  {
    name: 'ニュースレター',
    href: '/newsletter',
    icon: Mail,
    description: '週刊AIトレンド配信'
  },
  {
    name: 'コンサルテーション',
    href: '/consultation',
    icon: Calendar,
    description: '無料戦略相談'
  },
]

const adminItems = [
  {
    name: 'ダッシュボード',
    href: '/dashboard',
    icon: BarChart3,
    description: 'システム管理画面'
  },
  {
    name: 'レビュー',
    href: '/review',
    icon: Users,
    description: '記事レビュー管理'
  },
]

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const isAdminPath = pathname?.startsWith('/dashboard') || pathname?.startsWith('/review')

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900 hidden sm:block">
                AI Media Automation
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              )
            })}
            
            {/* Admin links (if on admin path) */}
            {isAdminPath && (
              <>
                <div className="h-6 w-px bg-gray-300" />
                {adminItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        isActive
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      )}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </>
            )}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center">
            <Link href="/consultation">
              <Button className="bg-blue-600 hover:bg-blue-700">
                無料相談予約
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-b border-gray-200">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center px-3 py-3 rounded-md text-base font-medium transition-colors',
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <div>
                    <div>{item.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                  </div>
                </Link>
              )
            })}
            
            {/* Admin links for mobile */}
            {isAdminPath && (
              <>
                <div className="border-t border-gray-200 my-2" />
                {adminItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center px-3 py-3 rounded-md text-base font-medium transition-colors',
                        isActive
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      )}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <div>
                        <div>{item.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                      </div>
                    </Link>
                  )
                })}
              </>
            )}

            {/* Mobile CTA */}
            <div className="border-t border-gray-200 pt-3">
              <Link href="/consultation" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  無料コンサルテーション予約
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}