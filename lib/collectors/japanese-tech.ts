import { BaseCollector, CollectedData } from './base';

export class JapaneseTechCollector extends BaseCollector {
  constructor() {
    super('JapaneseTech', 'technology');
  }

  async collect(): Promise<CollectedData[]> {
    const allData: CollectedData[] = [];
    const MAX_TOTAL_ITEMS = 15; // 全体で最大15件
    
    try {
      // はてなブックマークの人気エントリーから取得（最大5件）
      const hatenaData = await this.fetchFromHatenaBookmark();
      const highQualityHatena = this.filterHighQualityItems(hatenaData).slice(0, 5);
      allData.push(...highQualityHatena);

      // Qiitaから記事を取得（最大5件）
      if (allData.length < MAX_TOTAL_ITEMS) {
        const qiitaData = await this.fetchFromQiita();
        const highQualityQiita = this.filterHighQualityItems(qiitaData).slice(0, 5);
        allData.push(...highQualityQiita);
      }

      // Zennから記事を取得（最大5件）
      if (allData.length < MAX_TOTAL_ITEMS) {
        const zennData = await this.fetchFromZenn();
        const highQualityZenn = this.filterHighQualityItems(zennData).slice(0, 5);
        allData.push(...highQualityZenn);
      }

      // 最終的に15件までに制限
      const finalData = allData.slice(0, MAX_TOTAL_ITEMS);
      console.log(`✅ Collected ${finalData.length} high-quality articles from Japanese tech sources`);
      return finalData;
    } catch (error) {
      console.error('Error collecting Japanese tech news:', error);
      return allData;
    }
  }

  private filterHighQualityItems(items: CollectedData[]): CollectedData[] {
    // 品質の高い記事をフィルタリング
    return items.filter(item => {
      const title = item.title.toLowerCase();
      const content = (item.content || '').toLowerCase();
      
      // 重要キーワードが含まれているか
      const hasImportantKeywords = 
        title.includes('chatgpt') || title.includes('claude') ||
        title.includes('活用') || title.includes('導入') ||
        title.includes('事例') || title.includes('成功') ||
        title.includes('効率') || title.includes('改善') ||
        content.includes('具体的') || content.includes('実際');
      
      // 数字が含まれているか（具体性の指標）
      const hasNumbers = /\d/.test(title) || /\d/.test(content);
      
      // スコアを計算
      let score = 0;
      if (hasImportantKeywords) score += 3;
      if (hasNumbers) score += 2;
      if (item.metadata?.likes_count && item.metadata.likes_count > 10) score += 2;
      if (item.metadata?.stocks_count && item.metadata.stocks_count > 5) score += 1;
      
      // メタデータにスコアを追加
      item.metadata = {
        ...item.metadata,
        quality_score: score
      };
      
      return score >= 3; // スコア3以上のもののみ
    }).sort((a, b) => {
      // 品質スコアでソート
      const scoreA = (a.metadata?.quality_score as number) || 0;
      const scoreB = (b.metadata?.quality_score as number) || 0;
      return scoreB - scoreA;
    });
  }

  private async fetchFromHatenaBookmark(): Promise<CollectedData[]> {
    try {
      // はてなブックマークのRSSフィード（テクノロジーカテゴリ）
      const response = await fetch(
        'https://b.hatena.ne.jp/hotentry/it.rss'
      );
      
      if (!response.ok) {
        throw new Error(`Hatena API error: ${response.status}`);
      }

      const text = await response.text();
      
      // XMLからRSSアイテムを抽出（簡易的なパース）
      const items: CollectedData[] = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/;
      const linkRegex = /<link>(.*?)<\/link>/;
      const descRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>/;
      const dateRegex = /<dc:date>(.*?)<\/dc:date>/;
      
      let match;
      while ((match = itemRegex.exec(text)) !== null) {
        const itemContent = match[1];
        const title = titleRegex.exec(itemContent)?.[1] || '';
        const url = linkRegex.exec(itemContent)?.[1] || '';
        const description = descRegex.exec(itemContent)?.[1] || '';
        const date = dateRegex.exec(itemContent)?.[1] || new Date().toISOString();
        
        // AI関連の記事をフィルタリング
        const searchText = (title + description).toLowerCase();
        if (searchText.includes('ai') || 
            searchText.includes('人工知能') ||
            searchText.includes('機械学習') ||
            searchText.includes('ディープラーニング') ||
            searchText.includes('gpt') ||
            searchText.includes('claude') ||
            searchText.includes('llm')) {
          
          items.push({
            source: 'はてなブックマーク',
            category: 'technology',
            title: title,
            url: url,
            content: description,
            author: 'はてなブックマーク',
            collected_at: new Date().toISOString(),
            external_id: `hatena-${url}`,
            metadata: {
              published_at: date,
              platform: 'hatena'
            },
            processed: false
          });
        }
      }
      
      return items.slice(0, 5); // 最大5件（品質重視）
    } catch (error) {
      console.error('Hatena Bookmark fetch error:', error);
      return [];
    }
  }

  private async fetchFromQiita(): Promise<CollectedData[]> {
    try {
      // Qiita APIから最新のAI関連記事を取得
      // より具体的なキーワードで検索
      const query = 'tag:ChatGPT OR tag:Claude OR tag:AI活用 OR tag:業務効率化';
      const response = await fetch(
        `https://qiita.com/api/v2/items?page=1&per_page=5&query=${encodeURIComponent(query)}`
      );
      
      if (!response.ok) {
        throw new Error(`Qiita API error: ${response.status}`);
      }

      const articles = await response.json();
      
      return articles.map((article: any) => ({
        source: 'Qiita',
        category: 'technology',
        title: article.title,
        url: article.url,
        content: article.rendered_body ? 
          article.rendered_body.replace(/<[^>]*>/g, '').substring(0, 500) : '',
        author: article.user?.id || 'unknown',
        collected_at: new Date().toISOString(),
        external_id: `qiita-${article.id}`,
        metadata: {
          published_at: article.created_at,
          likes_count: article.likes_count,
          comments_count: article.comments_count,
          stocks_count: article.stocks_count,
          tags: article.tags?.map((t: any) => t.name) || []
        },
        processed: false
      }));
    } catch (error) {
      console.error('Qiita fetch error:', error);
      return [];
    }
  }

  private async fetchFromZenn(): Promise<CollectedData[]> {
    try {
      // ZennのRSSフィード
      const response = await fetch(
        'https://zenn.dev/feed'
      );
      
      if (!response.ok) {
        throw new Error(`Zenn API error: ${response.status}`);
      }

      const text = await response.text();
      
      // XMLからRSSアイテムを抽出
      const items: CollectedData[] = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      const titleRegex = /<title>(.*?)<\/title>/;
      const linkRegex = /<link>(.*?)<\/link>/;
      const descRegex = /<description>(.*?)<\/description>/;
      const creatorRegex = /<dc:creator>(.*?)<\/dc:creator>/;
      const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
      
      let match;
      while ((match = itemRegex.exec(text)) !== null) {
        const itemContent = match[1];
        const title = titleRegex.exec(itemContent)?.[1] || '';
        const url = linkRegex.exec(itemContent)?.[1] || '';
        const description = descRegex.exec(itemContent)?.[1] || '';
        const creator = creatorRegex.exec(itemContent)?.[1] || 'unknown';
        const pubDate = pubDateRegex.exec(itemContent)?.[1] || new Date().toISOString();
        
        // AI関連の記事をフィルタリング
        const searchText = (title + description).toLowerCase();
        if (searchText.includes('ai') || 
            searchText.includes('人工知能') ||
            searchText.includes('機械学習') ||
            searchText.includes('gpt') ||
            searchText.includes('claude') ||
            searchText.includes('llm')) {
          
          items.push({
            source: 'Zenn',
            category: 'technology',
            title: title,
            url: url,
            content: description.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<[^>]*>/g, ''),
            author: creator,
            collected_at: new Date().toISOString(),
            external_id: `zenn-${url}`,
            metadata: {
              published_at: pubDate,
              platform: 'zenn'
            },
            processed: false
          });
        }
      }
      
      return items.slice(0, 5); // 最大5件（品質重視）
    } catch (error) {
      console.error('Zenn fetch error:', error);
      return [];
    }
  }
}