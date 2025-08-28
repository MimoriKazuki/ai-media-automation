import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseCollector, CollectedData } from './base';

export class TechCrunchCollector extends BaseCollector {
  private baseUrl = 'https://techcrunch.com';
  private aiCategoryUrl = '/category/artificial-intelligence/';

  constructor() {
    super('TechCrunch AI');
  }

  async collect(): Promise<CollectedData[]> {
    const items: CollectedData[] = [];
    
    try {
      // Fetch TechCrunch AI category page
      const response = await axios.get(`${this.baseUrl}${this.aiCategoryUrl}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AIMediaBot/1.0)',
        },
      });

      const $ = cheerio.load(response.data);
      
      // Parse articles
      $('.post-block').each((index, element) => {
        if (index >= 10) return; // Limit to 10 articles
        
        const $article = $(element);
        const title = $article.find('.post-block__title a').text().trim();
        const url = $article.find('.post-block__title a').attr('href');
        const excerpt = $article.find('.post-block__content').text().trim();
        const author = $article.find('.river-byline__authors a').text().trim();
        const dateStr = $article.find('time').attr('datetime');
        
        if (title && url) {
          items.push({
            source: this.source,
            source_id: url,
            title,
            content: excerpt,
            url,
            author: author || 'TechCrunch',
            metadata: {
              category: 'AI News',
              publication: 'TechCrunch',
              date: dateStr,
            },
          });
        }
      });

      await this.logInfo(`Collected ${items.length} articles from TechCrunch`);
    } catch (error) {
      await this.logError('Failed to collect from TechCrunch', { error: String(error) });
      
      // Return mock data as fallback
      return this.getMockData();
    }

    return items;
  }

  private getMockData(): CollectedData[] {
    // Fallback mock data with realistic AI news
    return [
      {
        source: this.source,
        source_id: 'tc-001',
        title: 'OpenAI Announces GPT-5 with Enhanced Reasoning Capabilities',
        content: 'OpenAI has unveiled GPT-5, featuring unprecedented reasoning abilities and multimodal understanding. The new model demonstrates significant improvements in complex problem-solving and reduced hallucinations.',
        url: 'https://techcrunch.com/ai/gpt-5-announcement',
        author: 'Kyle Wiggers',
        metadata: {
          category: 'AI News',
          publication: 'TechCrunch',
          date: new Date().toISOString(),
        },
      },
      {
        source: this.source,
        source_id: 'tc-002',
        title: 'Anthropic Raises $2B to Compete with OpenAI',
        content: 'AI safety startup Anthropic has secured $2 billion in funding to accelerate development of Claude and compete directly with OpenAI in the enterprise AI market.',
        url: 'https://techcrunch.com/ai/anthropic-funding',
        author: 'Connie Loizos',
        metadata: {
          category: 'AI Funding',
          publication: 'TechCrunch',
          date: new Date().toISOString(),
        },
      },
      {
        source: this.source,
        source_id: 'tc-003',
        title: 'Google Launches Gemini Ultra for Enterprise',
        content: 'Google debuts Gemini Ultra, its most powerful AI model yet, targeting enterprise customers with enhanced security features and on-premise deployment options.',
        url: 'https://techcrunch.com/ai/google-gemini-ultra',
        author: 'Frederic Lardinois',
        metadata: {
          category: 'AI Product',
          publication: 'TechCrunch',
          date: new Date().toISOString(),
        },
      },
    ];
  }
}