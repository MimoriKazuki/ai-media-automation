import { ArticleGenerationPipeline } from '@/lib/pipeline';
import { DataCollectionOrchestrator } from '@/lib/collectors';
import { learningSystem } from '@/lib/learning';
import { supabaseAdmin } from '@/lib/supabase';

export interface SchedulerConfig {
  collectInterval: number; // minutes
  generateInterval: number; // hours
  learningInterval: number; // days
  articlesPerRun: number;
  qualityThreshold: number;
  autoPublishThreshold: number;
}

export class AutomationScheduler {
  private config: SchedulerConfig;
  private isRunning: boolean = false;
  private lastCollectionRun: Date | null = null;
  private lastGenerationRun: Date | null = null;
  private lastLearningRun: Date | null = null;

  constructor(config?: Partial<SchedulerConfig>) {
    this.config = {
      collectInterval: 30, // 30 minutes
      generateInterval: 3, // 3 hours
      learningInterval: 1, // 1 day
      articlesPerRun: parseInt(process.env.NEXT_PUBLIC_ARTICLES_PER_DAY || '10'),
      qualityThreshold: parseInt(process.env.NEXT_PUBLIC_QUALITY_THRESHOLD || '80'),
      autoPublishThreshold: parseInt(process.env.NEXT_PUBLIC_AUTO_PUBLISH_THRESHOLD || '90'),
      ...config,
    };
  }

  /**
   * Start the automation scheduler
   */
  async start() {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    await this.log('info', 'Automation scheduler started', this.config);

    // Initial run
    await this.runCollection();
    await this.runGeneration();

    // Schedule recurring tasks
    this.scheduleCollection();
    this.scheduleGeneration();
    this.scheduleLearning();
  }

  /**
   * Stop the automation scheduler
   */
  async stop() {
    this.isRunning = false;
    await this.log('info', 'Automation scheduler stopped');
  }

  /**
   * Schedule data collection
   */
  private scheduleCollection() {
    if (!this.isRunning) return;

    setTimeout(async () => {
      if (!this.isRunning) return;
      
      await this.runCollection();
      this.scheduleCollection(); // Reschedule
    }, this.config.collectInterval * 60 * 1000);
  }

  /**
   * Schedule article generation
   */
  private scheduleGeneration() {
    if (!this.isRunning) return;

    setTimeout(async () => {
      if (!this.isRunning) return;
      
      await this.runGeneration();
      this.scheduleGeneration(); // Reschedule
    }, this.config.generateInterval * 60 * 60 * 1000);
  }

  /**
   * Schedule learning cycle
   */
  private scheduleLearning() {
    if (!this.isRunning) return;

    setTimeout(async () => {
      if (!this.isRunning) return;
      
      await this.runLearning();
      this.scheduleLearning(); // Reschedule
    }, this.config.learningInterval * 24 * 60 * 60 * 1000);
  }

  /**
   * Run data collection
   */
  async runCollection(): Promise<void> {
    try {
      await this.log('info', 'Starting data collection');
      
      const collector = new DataCollectionOrchestrator();
      await collector.initialize();
      const result = await collector.collectAll();
      
      this.lastCollectionRun = new Date();
      
      await this.log('info', 'Data collection completed', {
        totalCollected: result.totalCollected,
        bySource: result.bySource,
      });
      
      // Check if we should trigger generation immediately
      if (result.totalCollected > 50) {
        // If we collected a lot of new data, run generation
        await this.runGeneration();
      }
    } catch (error) {
      await this.log('error', 'Data collection failed', { error: String(error) });
    }
  }

  /**
   * Run article generation pipeline
   */
  async runGeneration(): Promise<void> {
    try {
      await this.log('info', 'Starting article generation');
      
      // Check if we have enough unprocessed data
      const { count: unprocessedCount } = await supabaseAdmin
        .from('collected_data')
        .select('id', { count: 'exact', head: true })
        .eq('processed', false);
      
      if (!unprocessedCount || unprocessedCount < 5) {
        await this.log('info', 'Not enough unprocessed data for generation', {
          unprocessedCount,
        });
        return;
      }
      
      const pipeline = new ArticleGenerationPipeline({
        articlesPerDay: this.config.articlesPerRun,
        qualityThreshold: this.config.qualityThreshold,
        autoPublishThreshold: this.config.autoPublishThreshold,
      });
      
      const result = await pipeline.run();
      
      this.lastGenerationRun = new Date();
      
      // Auto-publish high-quality articles
      await this.autoPublishArticles(result.articles);
      
      await this.log('info', 'Article generation completed', {
        articlesGenerated: result.articlesGenerated,
        articlesApproved: result.articlesApproved,
        articlesRejected: result.articlesRejected,
        averageQualityScore: result.averageQualityScore,
      });
      
      // Trigger learning if quality is declining
      if (result.averageQualityScore < 75) {
        await this.runLearning();
      }
    } catch (error) {
      await this.log('error', 'Article generation failed', { error: String(error) });
    }
  }

  /**
   * Run learning cycle
   */
  async runLearning(): Promise<void> {
    try {
      await this.log('info', 'Starting learning cycle');
      
      const result = await learningSystem.runLearningCycle(7);
      
      this.lastLearningRun = new Date();
      
      await this.log('info', 'Learning cycle completed', {
        analysisId: result.analysisId,
        promptsUpdated: result.promptsUpdated,
        improvementScore: result.improvementScore,
      });
      
      // Apply learning if improvement score is high
      if (result.improvementScore > 60 && result.analysisId) {
        await learningSystem.applyLearning(result.analysisId);
        await this.log('info', 'Learning patterns applied', {
          learningId: result.analysisId,
        });
      }
    } catch (error) {
      await this.log('error', 'Learning cycle failed', { error: String(error) });
    }
  }

  /**
   * Auto-publish high-quality articles
   */
  private async autoPublishArticles(articles: any[]): Promise<void> {
    let publishedCount = 0;
    
    for (const article of articles) {
      if (
        article.status === 'approved' &&
        article.evaluation.total_score >= this.config.autoPublishThreshold
      ) {
        // Check for duplicate content before publishing
        const isDuplicate = await this.checkDuplicate(article.article.title);
        
        if (!isDuplicate) {
          // Update article status to published
          const { error } = await supabaseAdmin
            .from('articles')
            .update({
              status: 'published',
              published_at: new Date().toISOString(),
            })
            .eq('title', article.article.title)
            .eq('status', 'approved');
          
          if (!error) {
            publishedCount++;
            await this.log('info', 'Article auto-published', {
              title: article.article.title,
              qualityScore: article.evaluation.total_score,
            });
          }
        }
      }
    }
    
    if (publishedCount > 0) {
      await this.log('info', 'Auto-publishing completed', {
        publishedCount,
      });
    }
  }

  /**
   * Check for duplicate content
   */
  private async checkDuplicate(title: string): Promise<boolean> {
    // Simple duplicate check based on title similarity
    const similarTitle = title.toLowerCase().replace(/[^\w\s]/g, '');
    
    const { data } = await supabaseAdmin
      .from('articles')
      .select('id, title')
      .eq('status', 'published');
    
    if (data) {
      for (const article of data) {
        const existingTitle = article.title.toLowerCase().replace(/[^\w\s]/g, '');
        
        // Calculate simple similarity
        const similarity = this.calculateSimilarity(similarTitle, existingTitle);
        
        if (similarity > 0.8) {
          await this.log('warning', 'Duplicate content detected', {
            newTitle: title,
            existingTitle: article.title,
            similarity,
          });
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Calculate string similarity (simple implementation)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Get scheduler status
   */
  async getStatus(): Promise<{
    isRunning: boolean;
    lastCollectionRun: Date | null;
    lastGenerationRun: Date | null;
    lastLearningRun: Date | null;
    config: SchedulerConfig;
    stats: any;
  }> {
    // Get recent stats
    const { data: recentArticles } = await supabaseAdmin
      .from('articles')
      .select('id, status, quality_score, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });
    
    const stats = {
      articlesLast24h: recentArticles?.length || 0,
      averageQuality: recentArticles?.reduce((acc, a) => acc + (a.quality_score || 0), 0) / (recentArticles?.length || 1),
      statusBreakdown: recentArticles?.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
    
    return {
      isRunning: this.isRunning,
      lastCollectionRun: this.lastCollectionRun,
      lastGenerationRun: this.lastGenerationRun,
      lastLearningRun: this.lastLearningRun,
      config: this.config,
      stats,
    };
  }

  /**
   * Log scheduler events
   */
  private async log(level: string, message: string, details?: any): Promise<void> {
    await supabaseAdmin.from('system_logs').insert({
      log_level: level,
      component: 'scheduler',
      message,
      details,
    });
    
    console.log(`[Scheduler] [${level.toUpperCase()}] ${message}`, details || '');
  }
}

// Singleton instance
export const automationScheduler = new AutomationScheduler();