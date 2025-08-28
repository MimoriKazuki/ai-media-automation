import { BaseCollector, CollectedData } from './base';

interface NewsAPIArticle {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: {
    id: string | null;
    name: string;
  };
  author?: string;
  content?: string;
}

export class RealNewsCollector extends BaseCollector {
  private apiKey: string;
  private sources: string[];

  constructor() {
    super('RealNews', 'technology');
    this.apiKey = process.env.NEWS_API_KEY || '';
    // 信頼性の高い技術メディア
    this.sources = [
      'techcrunch',
      'the-verge', 
      'wired',
      'ars-technica',
      'engadget',
      'hacker-news',
      'the-next-web'
    ];
  }

  async collect(): Promise<CollectedData[]> {
    const allData: CollectedData[] = [];
    
    try {
      // NewsAPI.orgを使用（無料プランで1日100リクエスト）
      if (this.apiKey) {
        const newsData = await this.fetchFromNewsAPI();
        allData.push(...newsData);
      }

      // Dev.to APIから記事を取得（APIキー不要）
      const devToData = await this.fetchFromDevTo();
      allData.push(...devToData);

      // Hashnode APIから記事を取得
      const hashnodeData = await this.fetchFromHashnode();
      allData.push(...hashnodeData);

      console.log(`✅ Collected ${allData.length} articles from real news sources`);
      return allData;
    } catch (error) {
      console.error('Error collecting real news:', error);
      return allData; // 部分的な成功でもデータを返す
    }
  }

  private async fetchFromNewsAPI(): Promise<CollectedData[]> {
    try {
      const query = 'AI OR "artificial intelligence" OR GPT OR Claude OR "machine learning"';
      const url = `https://newsapi.org/v2/everything?` +
        `q=${encodeURIComponent(query)}&` +
        `sources=${this.sources.join(',')}&` +
        `language=en&` +
        `sortBy=popularity&` +
        `pageSize=20&` +
        `apiKey=${this.apiKey}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.status}`);
      }

      const data = await response.json();
      const articles: NewsAPIArticle[] = data.articles || [];

      return articles.map(article => ({
        source: `NewsAPI - ${article.source.name}`,
        category: 'technology',
        title: article.title,
        url: article.url,
        content: article.description || article.content || '',
        author: article.author || article.source.name,
        collected_at: new Date().toISOString(),
        external_id: `newsapi-${article.url}`,
        metadata: {
          published_at: article.publishedAt,
          source_name: article.source.name,
          image_url: article.urlToImage
        },
        processed: false
      }));
    } catch (error) {
      console.error('NewsAPI fetch error:', error);
      return [];
    }
  }

  private async fetchFromDevTo(): Promise<CollectedData[]> {
    try {
      // Dev.toのAPIから最新のAI関連記事を取得
      const response = await fetch(
        'https://dev.to/api/articles?tag=ai&per_page=10&state=fresh'
      );
      
      if (!response.ok) {
        throw new Error(`Dev.to API error: ${response.status}`);
      }

      const articles = await response.json();
      
      return articles.map((article: any) => ({
        source: 'Dev.to',
        category: 'technology',
        title: article.title,
        url: article.url,
        content: article.description || '',
        author: article.user?.username || 'unknown',
        collected_at: new Date().toISOString(),
        external_id: `devto-${article.id}`,
        metadata: {
          published_at: article.published_at,
          reading_time: article.reading_time_minutes,
          tags: article.tag_list,
          positive_reactions: article.positive_reactions_count,
          comments: article.comments_count
        },
        processed: false
      }));
    } catch (error) {
      console.error('Dev.to fetch error:', error);
      return [];
    }
  }

  private async fetchFromHashnode(): Promise<CollectedData[]> {
    try {
      // Hashnode GraphQL API
      const query = `
        query {
          storiesFeed(type: FEATURED) {
            title
            brief
            slug
            cuid
            dateAdded
            author {
              username
              name
            }
            totalReactions
            responseCount
          }
        }
      `;

      const response = await fetch('https://api.hashnode.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error(`Hashnode API error: ${response.status}`);
      }

      const data = await response.json();
      const articles = data.data?.storiesFeed || [];

      return articles
        .filter((article: any) => {
          const text = `${article.title} ${article.brief}`.toLowerCase();
          return text.includes('ai') || 
                 text.includes('artificial intelligence') ||
                 text.includes('machine learning') ||
                 text.includes('gpt') ||
                 text.includes('claude');
        })
        .map((article: any) => ({
          source: 'Hashnode',
          category: 'technology',
          title: article.title,
          url: `https://hashnode.com/post/${article.slug}-${article.cuid}`,
          content: article.brief || '',
          author: article.author?.name || article.author?.username || 'unknown',
          collected_at: new Date().toISOString(),
          external_id: `hashnode-${article.cuid}`,
          metadata: {
            published_at: article.dateAdded,
            reactions: article.totalReactions,
            comments: article.responseCount
          },
          processed: false
        }));
    } catch (error) {
      console.error('Hashnode fetch error:', error);
      return [];
    }
  }
}