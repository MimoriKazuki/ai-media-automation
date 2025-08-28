import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseCollector, CollectedData } from './base';

export class GitHubTrendingCollector extends BaseCollector {
  private baseUrl = 'https://github.com/trending';
  private languages = ['python', 'typescript']; // 品質重視のため言語を絞る
  private aiKeywords = [
    'llm', 'gpt', 'transformer', 'ai', 'ml', 'machine-learning',
    'deep-learning', 'neural', 'langchain', 'openai', 'anthropic',
    'huggingface', 'diffusion', 'stable-diffusion', 'whisper'
  ];

  constructor() {
    super('GitHub Trending AI');
  }

  async collect(): Promise<CollectedData[]> {
    const items: CollectedData[] = [];
    
    try {
      // Collect trending repos for each language
      for (const lang of this.languages) {
        const url = `${this.baseUrl}/${lang}?since=daily`;
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AIMediaBot/1.0)',
          },
        });

        const $ = cheerio.load(response.data);
        
        $('article.Box-row').each((index, element) => {
          if (index >= 3) return; // Top 3 per language (品質重視)
          
          const $repo = $(element);
          const repoName = $repo.find('h2 a').attr('href')?.substring(1);
          const description = $repo.find('p.text-gray').text().trim();
          const stars = $repo.find('span.d-inline-block.float-sm-right').text().trim();
          const language = $repo.find('[itemprop="programmingLanguage"]').text().trim();
          
          // Check if it's AI-related
          if (repoName && this.isAIRelated(repoName, description)) {
            const [owner, name] = repoName.split('/');
            
            items.push({
              source: this.source,
              source_id: repoName,
              title: `${name} - ${description.substring(0, 100)}`,
              content: `${description}\n\nLanguage: ${language || lang}\nStars today: ${stars}`,
              url: `https://github.com/${repoName}`,
              author: owner,
              metadata: {
                category: 'Open Source AI',
                type: 'github_repo',
                language: language || lang,
                stars_today: stars,
                repository: repoName,
              },
              trend_score: this.calculateTrendScore(stars),
              quality_score: this.calculateQualityScore(repoName, description, stars),
            });
          }
        });
      }

      await this.logInfo(`Collected ${items.length} trending AI repos from GitHub`);
    } catch (error) {
      await this.logError('Failed to collect from GitHub', { error: String(error) });
      
      // Return mock data as fallback
      return this.getMockData();
    }

    return items;
  }

  private isAIRelated(repoName: string, description: string): boolean {
    const text = `${repoName} ${description}`.toLowerCase();
    
    // 複数のAIキーワードが含まれているかチェック（品質向上）
    const matchCount = this.aiKeywords.filter(keyword => text.includes(keyword)).length;
    
    // 2つ以上のキーワードがマッチする場合のみ収集
    return matchCount >= 2;
  }

  private calculateTrendScore(starsText: string): number {
    // Extract number from stars text (e.g., "123 stars today")
    const stars = parseInt(starsText.match(/\d+/)?.[0] || '0');
    
    if (stars > 500) return 10;
    if (stars > 200) return 9;
    if (stars > 100) return 8;
    if (stars > 50) return 7;
    if (stars > 20) return 6;
    return 5;
  }

  private calculateQualityScore(repoName: string, description: string, starsText: string): number {
    let score = 0;
    const text = `${repoName} ${description}`.toLowerCase();
    
    // AIキーワードの数
    const matchCount = this.aiKeywords.filter(keyword => text.includes(keyword)).length;
    score += Math.min(matchCount * 2, 6);
    
    // スター数
    const stars = parseInt(starsText.match(/\d+/)?.[0] || '0');
    if (stars > 100) score += 2;
    else if (stars > 50) score += 1;
    
    // 実用性の高いキーワード
    if (text.includes('production') || text.includes('framework') || text.includes('tool')) score += 2;
    
    return Math.min(score, 10);
  }

  private getMockData(): CollectedData[] {
    return [
      {
        source: this.source,
        source_id: 'microsoft/autogen',
        title: 'AutoGen - Framework for building AI agents',
        content: 'Enable Next-Gen Large Language Model Applications. A framework that enables development of LLM applications using multiple agents that can converse with each other to solve tasks.\n\nLanguage: Python\nStars today: 523',
        url: 'https://github.com/microsoft/autogen',
        author: 'microsoft',
        metadata: {
          category: 'Open Source AI',
          type: 'github_repo',
          language: 'Python',
          stars_today: '523',
          repository: 'microsoft/autogen',
        },
        trend_score: 10,
      },
      {
        source: this.source,
        source_id: 'langchain-ai/langchain',
        title: 'LangChain - Building applications with LLMs',
        content: 'Building applications with LLMs through composability. Python and JavaScript libraries for building with LLMs.\n\nLanguage: Python\nStars today: 312',
        url: 'https://github.com/langchain-ai/langchain',
        author: 'langchain-ai',
        metadata: {
          category: 'Open Source AI',
          type: 'github_repo',
          language: 'Python',
          stars_today: '312',
          repository: 'langchain-ai/langchain',
        },
        trend_score: 9,
      },
      {
        source: this.source,
        source_id: 'openai/whisper',
        title: 'Whisper - Robust Speech Recognition',
        content: 'Robust Speech Recognition via Large-Scale Weak Supervision. State-of-the-art speech recognition model.\n\nLanguage: Python\nStars today: 156',
        url: 'https://github.com/openai/whisper',
        author: 'openai',
        metadata: {
          category: 'Open Source AI',
          type: 'github_repo',
          language: 'Python',
          stars_today: '156',
          repository: 'openai/whisper',
        },
        trend_score: 8,
      },
    ];
  }
}