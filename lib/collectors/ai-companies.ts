import { BaseCollector, CollectedData } from './base';

interface CompanySource {
  name: string;
  feedUrl: string;
  websiteUrl: string;
  category: string;
}

export class AICompaniesCollector extends BaseCollector {
  private readonly sources: CompanySource[] = [
    {
      name: 'OpenAI Blog',
      feedUrl: 'https://openai.com/blog/rss.xml',
      websiteUrl: 'https://openai.com/blog',
      category: 'research'
    },
    {
      name: 'Anthropic News',
      feedUrl: 'https://www.anthropic.com/rss.xml',
      websiteUrl: 'https://www.anthropic.com/news',
      category: 'research'
    },
    {
      name: 'Google AI Blog',
      feedUrl: 'https://blog.google/technology/ai/rss/',
      websiteUrl: 'https://blog.google/technology/ai/',
      category: 'research'
    },
    {
      name: 'Meta AI',
      feedUrl: 'https://ai.meta.com/blog/rss/',
      websiteUrl: 'https://ai.meta.com/blog/',
      category: 'research'
    },
    {
      name: 'Microsoft AI Blog',
      feedUrl: 'https://blogs.microsoft.com/ai/feed/',
      websiteUrl: 'https://blogs.microsoft.com/ai/',
      category: 'enterprise'
    },
    {
      name: 'NVIDIA AI Blog',
      feedUrl: 'https://blogs.nvidia.com/blog/category/artificial-intelligence/feed/',
      websiteUrl: 'https://blogs.nvidia.com/blog/category/artificial-intelligence/',
      category: 'hardware'
    },
    {
      name: 'Hugging Face Blog',
      feedUrl: 'https://huggingface.co/blog/feed.xml',
      websiteUrl: 'https://huggingface.co/blog',
      category: 'opensource'
    },
    {
      name: 'Stability AI',
      feedUrl: 'https://stability.ai/blog/rss',
      websiteUrl: 'https://stability.ai/blog',
      category: 'generative'
    }
  ];

  constructor() {
    super('AICompanies', 'industry');
  }

  async collect(): Promise<CollectedData[]> {
    try {
      console.log('🏢 Collecting from AI company blogs...');
      
      const allArticles: CollectedData[] = [];
      
      // 各ソースから並列で記事を収集
      const promises = this.sources.map(source => this.collectFromSource(source));
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          allArticles.push(...result.value);
        } else if (result.status === 'rejected') {
          console.error(`Failed to collect from ${this.sources[index].name}:`, result.reason);
        }
      });

      // 最新の記事から上位50件を取得
      const sortedArticles = allArticles
        .sort((a, b) => new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime())
        .slice(0, 50);

      console.log(`✅ Collected ${sortedArticles.length} articles from AI companies`);
      return sortedArticles;
    } catch (error) {
      console.error('Error collecting from AI companies:', error);
      return [];
    }
  }

  private async collectFromSource(source: CompanySource): Promise<CollectedData[]> {
    try {
      const response = await fetch(source.feedUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      const articles = this.parseRSSFeed(text, source);
      
      return articles;
    } catch (error) {
      console.error(`Error fetching from ${source.name}:`, error);
      // フォールバック：モックデータを返す
      return this.getMockData(source);
    }
  }

  private parseRSSFeed(xmlText: string, source: CompanySource): CollectedData[] {
    const articles: CollectedData[] = [];
    
    // 簡易的なXMLパーサー（実際にはxml2jsなどのライブラリを使用推奨）
    const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/gi);
    
    for (const match of itemMatches) {
      const item = match[1];
      const title = this.extractTag(item, 'title');
      const link = this.extractTag(item, 'link');
      const description = this.extractTag(item, 'description');
      const pubDate = this.extractTag(item, 'pubDate');
      
      if (title && link) {
        articles.push({
          source: source.name,
          category: source.category,
          title: this.cleanText(title),
          url: link,
          content: this.cleanText(description || title),
          author: source.name,
          collected_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          external_id: `${source.name.toLowerCase().replace(/\s+/g, '-')}-${this.generateHash(link)}`,
          metadata: {
            company: source.name,
            websiteUrl: source.websiteUrl,
            feedUrl: source.feedUrl
          },
          processed: false
        });
      }
    }
    
    return articles.slice(0, 10); // 各ソースから最大10件
  }

  private extractTag(xml: string, tag: string): string | null {
    const match = xml.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    return match ? (match[1] || match[2] || '').trim() : null;
  }

  private cleanText(text: string): string {
    return text
      .replace(/<!\[CDATA\[|\]\]>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .trim();
  }

  private generateHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private getMockData(source: CompanySource): CollectedData[] {
    // フォールバック用のモックデータ
    return [{
      source: source.name,
      category: source.category,
      title: `Latest AI developments from ${source.name}`,
      url: source.websiteUrl,
      content: `Check the latest updates and research from ${source.name} on their official blog.`,
      author: source.name,
      collected_at: new Date().toISOString(),
      external_id: `mock-${source.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      metadata: {
        company: source.name,
        isMock: true
      },
      processed: false
    }];
  }
}