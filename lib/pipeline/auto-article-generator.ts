import { DataCollectionOrchestrator } from '@/lib/collectors';
import { claude } from '@/lib/claude';
import { supabase } from '@/lib/supabase';

interface TrendAnalysis {
  topic: string;
  keywords: string[];
  relevanceScore: number;
  sources: string[];
  summary: string;
}

export class AutoArticleGenerator {
  private dataOrchestrator: DataCollectionOrchestrator;

  constructor() {
    this.dataOrchestrator = new DataCollectionOrchestrator();
  }

  /**
   * 完全自動パイプライン：データ収集→分析→記事生成
   */
  async runFullPipeline(): Promise<{
    success: boolean;
    articlesGenerated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let articlesGenerated = 0;

    try {
      console.log('🚀 Starting automatic article generation pipeline...');

      // Step 1: データ収集
      console.log('📥 Step 1: Collecting data from all sources...');
      await this.dataOrchestrator.initialize();
      const collectionResult = await this.dataOrchestrator.collectAll();
      
      console.log(`✅ Collected ${collectionResult.totalCollected} items from ${Object.keys(collectionResult.bySource).length} sources`);

      // Step 2: データ分析とトレンド抽出
      console.log('🔍 Step 2: Analyzing data and extracting trends...');
      const trends = await this.analyzeAndExtractTrends(collectionResult.data);
      
      console.log(`📊 Found ${trends.length} trending topics`);

      // Step 3: 重要なトレンドから記事生成
      console.log('✍️ Step 3: Generating articles from top trends...');
      const topTrends = trends.slice(0, 5); // 上位5つのトレンドから記事を生成
      
      for (const trend of topTrends) {
        try {
          const article = await this.generateArticleFromTrend(trend);
          if (article) {
            articlesGenerated++;
            console.log(`✅ Generated article: ${article.title}`);
          }
        } catch (error) {
          const errorMsg = `Failed to generate article for trend: ${trend.topic}`;
          console.error(errorMsg, error);
          errors.push(errorMsg);
        }
      }

      // Step 4: ログを記録
      await this.logPipelineResult({
        success: true,
        dataCollected: collectionResult.totalCollected,
        trendsFound: trends.length,
        articlesGenerated,
        errors
      });

      return {
        success: true,
        articlesGenerated,
        errors
      };

    } catch (error) {
      console.error('Pipeline failed:', error);
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      
      await this.logPipelineResult({
        success: false,
        dataCollected: 0,
        trendsFound: 0,
        articlesGenerated,
        errors
      });

      return {
        success: false,
        articlesGenerated,
        errors
      };
    }
  }

  /**
   * 収集したデータからトレンドを分析・抽出
   */
  private async analyzeAndExtractTrends(data: any[]): Promise<TrendAnalysis[]> {
    // データをカテゴリとトピックでグループ化
    const topicGroups = new Map<string, any[]>();
    
    for (const item of data) {
      // タイトルからキーワードを抽出
      const keywords = this.extractKeywords(item.title + ' ' + (item.content || ''));
      
      keywords.forEach(keyword => {
        if (!topicGroups.has(keyword)) {
          topicGroups.set(keyword, []);
        }
        topicGroups.get(keyword)!.push(item);
      });
    }

    // 頻出トピックを抽出
    const trends: TrendAnalysis[] = [];
    
    for (const [topic, items] of topicGroups.entries()) {
      if (items.length >= 3) { // 3件以上言及されているトピックをトレンドとして認識
        const sources = [...new Set(items.map(item => item.source))];
        const keywords = this.extractTopKeywords(items);
        
        trends.push({
          topic,
          keywords,
          relevanceScore: this.calculateRelevanceScore(items),
          sources,
          summary: this.generateTrendSummary(topic, items)
        });
      }
    }

    // 関連度スコアで降順ソート
    return trends.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * トレンドから記事を生成
   */
  private async generateArticleFromTrend(trend: TrendAnalysis): Promise<any> {
    try {
      // APIを直接呼び出すのではなく、claudeライブラリを使用
      const { claude } = await import('@/lib/claude');
      
      const trendData = {
        trend_score: trend.relevanceScore / 10, // 0-10のスケールに変換
        keywords: trend.keywords,
        summary: `${trend.topic}の最新動向と今後の展望`,
        should_write_article: true,
        urgency: trend.relevanceScore > 80 ? 'high' : trend.relevanceScore > 50 ? 'medium' : 'low',
        predicted_performance: {
          estimated_views: Math.round(trend.relevanceScore * 100),
          engagement_score: Math.round(trend.relevanceScore / 10)
        }
      };

      // 記事を生成
      const article = await claude.generateArticle(
        trendData,
        'Introduction, Main Content, Examples, Conclusion'
      );

      // 品質評価
      const evaluation = await claude.evaluateQuality(article);

      console.log(`✅ Generated article: ${article.title} (Score: ${evaluation.total_score})`);

      return {
        ...article,
        quality_score: evaluation.total_score,
        evaluation
      };
    } catch (error) {
      console.error(`Failed to generate article for trend: ${trend.topic}`, error);
      throw error;
    }
  }

  /**
   * キーワード抽出
   */
  private extractKeywords(text: string): string[] {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been']);
    
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));
    
    // AI関連の重要キーワードを優先
    const aiKeywords = ['artificial', 'intelligence', 'machine', 'learning', 'deep', 'neural', 
                        'gpt', 'claude', 'llm', 'model', 'training', 'inference', 'transformer',
                        'generative', 'diffusion', 'stable', 'openai', 'anthropic', 'google',
                        'microsoft', 'meta', 'nvidia', 'algorithm', 'dataset', 'benchmark'];
    
    return [...new Set(words.filter(word => 
      aiKeywords.some(keyword => word.includes(keyword))
    ))].slice(0, 10);
  }

  /**
   * トップキーワード抽出
   */
  private extractTopKeywords(items: any[]): string[] {
    const keywordCount = new Map<string, number>();
    
    items.forEach(item => {
      const keywords = this.extractKeywords(item.title + ' ' + (item.content || ''));
      keywords.forEach(keyword => {
        keywordCount.set(keyword, (keywordCount.get(keyword) || 0) + 1);
      });
    });
    
    return Array.from(keywordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword]) => keyword);
  }

  /**
   * 関連度スコア計算
   */
  private calculateRelevanceScore(items: any[]): number {
    const baseScore = Math.min(items.length * 10, 50); // 言及数によるスコア（最大50）
    const sourceBonus = [...new Set(items.map(item => item.source))].length * 5; // 複数ソースボーナス
    const recencyBonus = this.calculateRecencyBonus(items); // 新しさボーナス
    
    return Math.min(baseScore + sourceBonus + recencyBonus, 100);
  }

  /**
   * 新しさボーナス計算
   */
  private calculateRecencyBonus(items: any[]): number {
    const now = Date.now();
    const hoursSinceCollection = items.map(item => {
      const collected = new Date(item.collected_at).getTime();
      return (now - collected) / (1000 * 60 * 60);
    });
    
    const recentCount = hoursSinceCollection.filter(hours => hours < 24).length;
    return Math.min(recentCount * 10, 30);
  }

  /**
   * トレンドサマリー生成
   */
  private generateTrendSummary(topic: string, items: any[]): string {
    const sources = [...new Set(items.map(item => item.source))].join(', ');
    const count = items.length;
    
    return `${topic}に関する話題が${count}件検出されました。情報源: ${sources}`;
  }

  /**
   * パイプライン実行結果をログに記録
   */
  private async logPipelineResult(result: any): Promise<void> {
    try {
      await supabase
        .from('system_logs')
        .insert({
          log_level: result.success ? 'info' : 'error',
          component: 'auto-article-generator',
          message: result.success 
            ? `Pipeline completed: ${result.articlesGenerated} articles generated`
            : 'Pipeline failed',
          details: result,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log pipeline result:', error);
    }
  }
}