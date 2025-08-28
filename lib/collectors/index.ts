import { RSSCollectorManager } from './rss';
import { RedditCollector } from './reddit';
import { TechCrunchCollector } from './techcrunch';
import { ArxivCollector } from './arxiv';
import { GitHubTrendingCollector } from './github-trending';
import { HackerNewsCollector } from './hackernews';
import { ProductHuntCollector } from './producthunt';
import { AICompaniesCollector } from './ai-companies';
import { RealNewsCollector } from './real-news';
import { JapaneseTechCollector } from './japanese-tech';
import { OpenAIWebSearchCollector } from './openai-web-search';
import { OpenAIAnalysisCollector } from './openai-analysis';
import { CollectedData } from './base';
import { supabaseAdmin } from '@/lib/supabase';

export class DataCollectionOrchestrator {
  private rssManager: RSSCollectorManager;
  private redditCollector: RedditCollector;
  private techCrunchCollector: TechCrunchCollector;
  private arxivCollector: ArxivCollector;
  private githubCollector: GitHubTrendingCollector;
  private hackerNewsCollector: HackerNewsCollector;
  private productHuntCollector: ProductHuntCollector;
  private aiCompaniesCollector: AICompaniesCollector;
  private realNewsCollector: RealNewsCollector;
  private japaneseTechCollector: JapaneseTechCollector;
  private openAIWebSearchCollector: OpenAIWebSearchCollector;
  private openAIAnalysisCollector: OpenAIAnalysisCollector;

  constructor() {
    this.rssManager = new RSSCollectorManager();
    this.redditCollector = new RedditCollector(
      'Reddit AI',
      ['MachineLearning', 'artificial', 'LocalLLaMA', 'singularity', 
       'OpenAI', 'ClaudeAI', 'GoogleGemini', 'StableDiffusion', 
       'AIArt', 'AGI', 'deeplearning', 'LanguageTechnology'],
      200
    );
    this.techCrunchCollector = new TechCrunchCollector();
    this.arxivCollector = new ArxivCollector();
    this.githubCollector = new GitHubTrendingCollector();
    this.hackerNewsCollector = new HackerNewsCollector();
    this.productHuntCollector = new ProductHuntCollector();
    this.aiCompaniesCollector = new AICompaniesCollector();
    this.realNewsCollector = new RealNewsCollector();
    this.japaneseTechCollector = new JapaneseTechCollector();
    this.openAIWebSearchCollector = new OpenAIWebSearchCollector();
    this.openAIAnalysisCollector = new OpenAIAnalysisCollector();
  }

  async initialize() {
    await this.rssManager.initialize();
  }

  async collectAll(): Promise<{
    totalCollected: number;
    bySource: Record<string, number>;
    data: CollectedData[];
  }> {
    const startTime = Date.now();
    const results: CollectedData[] = [];
    const bySource: Record<string, number> = {};

    try {
      // Log start
      await supabaseAdmin.from('system_logs').insert({
        log_level: 'info',
        component: 'orchestrator',
        message: 'Starting data collection',
      });

      // OpenAI APIキーが設定されている場合は優先的に使用
      const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
      
      if (hasOpenAIKey) {
        // OpenAI APIを使用した収集
        const [
          openAISearchData,
          openAIAnalysisData,
          japaneseTechData,
          hackerNewsData,
          githubData
        ] = await Promise.all([
          this.openAIWebSearchCollector.collectAndSave(),
          this.openAIAnalysisCollector.collectAndSave(),
          this.japaneseTechCollector.collectAndSave(),
          this.hackerNewsCollector.collectAndSave(),
          this.githubCollector.collectAndSave()
        ]);
        
        results.push(
          ...openAISearchData,
          ...openAIAnalysisData,
          ...japaneseTechData,
          ...hackerNewsData,
          ...githubData
        );
      } else {
        // 従来の収集方法
        const [
          rssData, 
          redditData, 
          techCrunchData, 
          arxivData, 
          githubData,
          hackerNewsData,
          productHuntData,
          aiCompaniesData,
          realNewsData,
          japaneseTechData
        ] = await Promise.all([
          this.rssManager.collectAll(),
          this.redditCollector.collectAndSave(),
          this.techCrunchCollector.collectAndSave(),
          this.arxivCollector.collectAndSave(),
          this.githubCollector.collectAndSave(),
          this.hackerNewsCollector.collectAndSave(),
          this.productHuntCollector.collectAndSave(),
          this.aiCompaniesCollector.collectAndSave(),
          this.realNewsCollector.collectAndSave(),
          this.japaneseTechCollector.collectAndSave()
        ]);

        results.push(
          ...rssData, 
          ...redditData, 
          ...techCrunchData, 
          ...arxivData, 
          ...githubData,
          ...hackerNewsData,
          ...productHuntData,
          ...aiCompaniesData,
          ...realNewsData,
          ...japaneseTechData
        );
      }

      // Count by source
      for (const item of results) {
        bySource[item.source] = (bySource[item.source] || 0) + 1;
      }

      // Log completion
      await supabaseAdmin.from('system_logs').insert({
        log_level: 'info',
        component: 'orchestrator',
        message: 'Data collection completed',
        details: {
          duration_ms: Date.now() - startTime,
          total_collected: results.length,
          by_source: bySource,
        },
      });

      return {
        totalCollected: results.length,
        bySource,
        data: results,
      };
    } catch (error) {
      // Log error
      await supabaseAdmin.from('system_logs').insert({
        log_level: 'error',
        component: 'orchestrator',
        message: 'Data collection failed',
        details: { error: String(error) },
      });

      throw error;
    }
  }

  async collectFromSource(sourceName: string): Promise<CollectedData[]> {
    // Collect from a specific source
    try {
      switch(sourceName.toLowerCase()) {
        case 'openai-search':
        case 'chatgpt web検索':
          return await this.openAIWebSearchCollector.collectAndSave();
        case 'openai-analysis':
        case 'chatgpt ai分析':
          return await this.openAIAnalysisCollector.collectAndSave();
        case 'reddit':
          return await this.redditCollector.collectAndSave();
        case 'techcrunch':
          return await this.techCrunchCollector.collectAndSave();
        case 'arxiv':
          return await this.arxivCollector.collectAndSave();
        case 'github':
        case 'github trending':
          return await this.githubCollector.collectAndSave();
        case 'hacker news':
        case 'hackernews':
          return await this.hackerNewsCollector.collectAndSave();
        case 'product hunt':
        case 'producthunt':
          return await this.productHuntCollector.collectAndSave();
        case 'ai companies':
        case 'ai-companies':
          return await this.aiCompaniesCollector.collectAndSave();
        case 'real news':
        case 'realnews':
          return await this.realNewsCollector.collectAndSave();
        case 'japanese tech':
        case 'japanesetech':
        case '日本技術メディア':
          return await this.japaneseTechCollector.collectAndSave();
        case 'rss':
        case 'rss feeds':
          await this.rssManager.initialize();
          return await this.rssManager.collectAll();
        default:
          console.warn(`Unknown source: ${sourceName}, using RSS collector`);
          await this.rssManager.initialize();
          return await this.rssManager.collectAll();
      }
    } catch (error) {
      console.error(`Error collecting from ${sourceName}:`, error);
      return [];
    }
  }

  async getUnprocessedData(limit: number = 100): Promise<CollectedData[]> {
    const { data, error } = await supabaseAdmin
      .from('collected_data')
      .select('*')
      .eq('processed', false)
      .order('collected_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching unprocessed data:', error);
      return [];
    }

    return data || [];
  }

  async markAsProcessed(ids: string[]): Promise<void> {
    const { error } = await supabaseAdmin
      .from('collected_data')
      .update({ processed: true })
      .in('id', ids);

    if (error) {
      console.error('Error marking data as processed:', error);
    }
  }
}

export { CollectedData } from './base';