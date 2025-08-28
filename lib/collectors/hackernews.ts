import { BaseCollector, CollectedData } from './base';

export class HackerNewsCollector extends BaseCollector {
  private readonly baseUrl = 'https://hacker-news.firebaseio.com/v0';
  private readonly aiKeywords = [
    'ai', 'artificial intelligence', 'machine learning', 'deep learning',
    'gpt', 'llm', 'neural network', 'chatgpt', 'claude', 'openai',
    'anthropic', 'gemini', 'llama', 'stable diffusion', 'midjourney',
    'langchain', 'vector database', 'rag', 'transformer', 'bert'
  ];

  constructor() {
    super('HackerNews', 'technology');
  }

  async collect(): Promise<CollectedData[]> {
    try {
      console.log('🔍 Collecting from Hacker News...');
      
      // トップストーリーとベストストーリーを取得
      const [topStories, bestStories] = await Promise.all([
        this.fetchStoryIds('topstories'),
        this.fetchStoryIds('beststories')
      ]);

      // 重複を除いて最初の200件を取得
      const uniqueIds = [...new Set([...topStories.slice(0, 150), ...bestStories.slice(0, 150)])];
      const storyIds = uniqueIds.slice(0, 200);

      // ストーリーの詳細を並列で取得
      const stories = await Promise.all(
        storyIds.map(id => this.fetchStory(id))
      );

      // AIに関連するストーリーのみフィルタリング
      const aiStories = stories
        .filter(story => story && this.isAiRelated(story))
        .map(story => this.formatStory(story));

      console.log(`✅ Collected ${aiStories.length} AI-related stories from Hacker News`);
      return aiStories;
    } catch (error) {
      console.error('Error collecting from Hacker News:', error);
      return [];
    }
  }

  private async fetchStoryIds(type: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${type}.json`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${type} IDs:`, error);
      return [];
    }
  }

  private async fetchStory(id: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/item/${id}.json`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error(`Error fetching story ${id}:`, error);
      return null;
    }
  }

  private isAiRelated(story: any): boolean {
    if (!story.title) return false;
    
    const text = `${story.title} ${story.text || ''}`.toLowerCase();
    return this.aiKeywords.some(keyword => text.includes(keyword));
  }

  private formatStory(story: any): CollectedData {
    const url = story.url || `https://news.ycombinator.com/item?id=${story.id}`;
    
    return {
      source: this.source,
      category: this.category,
      title: story.title,
      url,
      content: story.text || `${story.title}. Score: ${story.score}, Comments: ${story.descendants || 0}`,
      author: story.by || 'unknown',
      collected_at: new Date().toISOString(),
      external_id: `hn-${story.id}`,
      metadata: {
        score: story.score,
        comments: story.descendants || 0,
        type: story.type,
        time: story.time,
        hn_url: `https://news.ycombinator.com/item?id=${story.id}`
      },
      processed: false
    };
  }
}