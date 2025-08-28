import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
export { viewport } from './viewport';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Media Automation - Enterprise AI Implementation Platform",
  description: "Automated AI content generation and business intelligence platform for enterprise digital transformation. Get expert AI implementation guidance and resources.",
  keywords: "AI implementation, digital transformation, enterprise AI, automated content, business intelligence, AI consultation",
  authors: [{ name: "AI Media Automation Team" }],
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: process.env.NEXT_PUBLIC_BASE_URL,
    title: "AI Media Automation - Enterprise AI Implementation Platform",
    description: "Expert AI implementation guidance for enterprise digital transformation",
    siteName: "AI Media Automation",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Media Automation",
    description: "Expert AI implementation guidance for enterprise digital transformation",
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_title: document.title,
                    page_location: window.location.href,
                  });
                `,
              }}
            />
          </>
        )}

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "AI Media Automation",
              url: process.env.NEXT_PUBLIC_BASE_URL,
              logo: `${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`,
              description: "Enterprise AI implementation and digital transformation consulting",
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+81-3-1234-5678",
                contactType: "customer service",
                availableLanguage: ["Japanese", "English"]
              },
              sameAs: [
                "https://twitter.com/aimediaautomation",
                "https://linkedin.com/company/ai-media-automation"
              ],
              address: {
                "@type": "PostalAddress",
                addressCountry: "JP",
                addressLocality: "Tokyo"
              }
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <nav className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <a href="/" className="text-xl font-bold">🚀 AI Media Automation</a>
              </div>
              <div className="flex space-x-4">
                <a href="/" className="px-3 py-2 rounded hover:bg-gray-700">ホーム</a>
                <a href="/world-class" className="px-3 py-2 rounded hover:bg-gray-700 bg-gradient-to-r from-purple-600/20 to-blue-600/20">🏆 世界クラス</a>
                <a href="/inbox" className="px-3 py-2 rounded hover:bg-gray-700">📥 Inbox</a>
                <a href="/article-simple" className="px-3 py-2 rounded hover:bg-gray-700">✨ 簡単生成</a>
                <a href="/test" className="px-3 py-2 rounded hover:bg-gray-700">🧪 テスト</a>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-grow">
          {children}
        </main>
      </body>
    </html>
  );
}
