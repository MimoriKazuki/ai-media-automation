import { claude, TrendAnalysis, ArticleGeneration, QualityEvaluation } from '@/lib/claude';
import { supabaseAdmin } from '@/lib/supabase';
import { DataCollectionOrchestrator } from '@/lib/collectors';

export interface PipelineConfig {
  articlesPerDay: number;
  qualityThreshold: number;
  autoPublishThreshold: number;
}

export interface PipelineResult {
  articlesGenerated: number;
  articlesApproved: number;
  articlesRejected: number;
  averageQualityScore: number;
  trends: TrendAnalysis[];
  articles: Array<{
    article: ArticleGeneration;
    evaluation: QualityEvaluation;
    status: string;
  }>;
}

export class ArticleGenerationPipeline {
  private config: PipelineConfig;
  private collector: DataCollectionOrchestrator;

  constructor(config?: Partial<PipelineConfig>) {
    this.config = {
      articlesPerDay: parseInt(process.env.NEXT_PUBLIC_ARTICLES_PER_DAY || '10'),
      qualityThreshold: parseInt(process.env.NEXT_PUBLIC_QUALITY_THRESHOLD || '80'),
      autoPublishThreshold: parseInt(process.env.NEXT_PUBLIC_AUTO_PUBLISH_THRESHOLD || '90'),
      ...config,
    };
    this.collector = new DataCollectionOrchestrator();
  }

  async run(): Promise<PipelineResult> {
    const result: PipelineResult = {
      articlesGenerated: 0,
      articlesApproved: 0,
      articlesRejected: 0,
      averageQualityScore: 0,
      trends: [],
      articles: [],
    };

    try {
      // Step 1: Collect Data
      await this.logStep('Starting pipeline execution');
      await this.collector.initialize();
      const collectionResult = await this.collector.collectAll();
      await this.logStep(`Collected ${collectionResult.totalCollected} items`);

      // Step 2: Get unprocessed data for trend analysis
      const unprocessedData = await this.collector.getUnprocessedData(100);
      if (unprocessedData.length === 0) {
        await this.logStep('No unprocessed data found');
        return result;
      }

      // Step 3: Analyze trends in batches
      const trends = await this.analyzeTrends(unprocessedData);
      result.trends = trends;
      await this.logStep(`Analyzed ${trends.length} trends`);

      // Step 4: Filter trends worth writing about
      const articlesToGenerate = trends
        .filter(t => t.should_write_article)
        .sort((a, b) => b.trend_score - a.trend_score)
        .slice(0, this.config.articlesPerDay);

      if (articlesToGenerate.length === 0) {
        await this.logStep('No trends worth writing about');
        return result;
      }

      // Step 5: Generate and evaluate articles
      for (const trend of articlesToGenerate) {
        try {
          // Save trend to database
          const { data: savedTrend } = await supabaseAdmin
            .from('trends')
            .insert({
              keyword: trend.keywords[0] || 'AI Trend',
              score: trend.trend_score,
              analysis: trend,
              claude_response: JSON.stringify(trend),
              should_write_article: true,
            })
            .select()
            .single();

          // Get best prompt template
          const template = await this.getBestTemplate('generation');

          // Generate article
          const article = await claude.generateArticle(trend, template);
          result.articlesGenerated++;

          // Evaluate quality
          const evaluation = await claude.evaluateQuality(article);
          
          // Determine status based on quality score
          let status = 'draft';
          if (evaluation.total_score >= this.config.autoPublishThreshold) {
            status = 'approved';
            result.articlesApproved++;
          } else if (evaluation.total_score >= this.config.qualityThreshold) {
            status = 'pending_review';
          } else {
            status = 'needs_improvement';
            result.articlesRejected++;
          }

          // Save article to database
          const slug = this.generateSlug(article.title);
          const { data: savedArticle } = await supabaseAdmin
            .from('articles')
            .insert({
              trend_id: savedTrend?.id,
              title: article.title,
              slug,
              content: article.content,
              markdown_content: article.content,
              meta_description: article.meta_description,
              keywords: article.keywords,
              quality_score: evaluation.total_score,
              seo_score: evaluation.seo_score,
              readability_score: evaluation.readability_score,
              originality_score: evaluation.originality_score,
              accuracy_score: evaluation.accuracy_score,
              engagement_score: evaluation.engagement_score,
              evaluation_details: evaluation,
              status,
              generation_model: 'claude-3-opus-20240229',
              generation_prompt: template,
            })
            .select()
            .single();

          // Add to review queue if needed
          if (status === 'pending_review' && savedArticle) {
            await supabaseAdmin.from('review_queue').insert({
              article_id: savedArticle.id,
              priority: Math.ceil(evaluation.total_score / 10),
              status: 'pending',
            });
          }

          // Attempt auto-improvement if quality is low
          if (status === 'needs_improvement' && evaluation.improvements.length > 0) {
            const improvedArticle = await this.attemptImprovement(
              article,
              evaluation.improvements
            );
            if (improvedArticle) {
              result.articles.push({
                article: improvedArticle.article,
                evaluation: improvedArticle.evaluation,
                status: improvedArticle.status,
              });
            }
          } else {
            result.articles.push({ article, evaluation, status });
          }

          result.averageQualityScore += evaluation.total_score;

        } catch (error) {
          await this.logError(`Failed to generate article for trend`, { trend, error });
        }
      }

      // Calculate average quality score
      if (result.articlesGenerated > 0) {
        result.averageQualityScore /= result.articlesGenerated;
      }

      // Mark processed data
      const processedIds = unprocessedData.map(d => d.id).filter(id => id);
      await this.collector.markAsProcessed(processedIds as string[]);

      await this.logStep('Pipeline execution completed', result);

    } catch (error) {
      await this.logError('Pipeline execution failed', error);
      throw error;
    }

    return result;
  }

  private async analyzeTrends(data: any[]): Promise<TrendAnalysis[]> {
    const trends: TrendAnalysis[] = [];
    const batchSize = 10;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      try {
        const trend = await claude.analyzeTrend(batch);
        trends.push(trend);
      } catch (error) {
        await this.logError('Trend analysis failed', { batch, error });
      }
    }

    return trends;
  }

  private async getBestTemplate(type: string): Promise<string> {
    const { data } = await supabaseAdmin
      .from('prompt_templates')
      .select('template')
      .eq('type', type)
      .eq('is_active', true)
      .order('performance_score', { ascending: false })
      .limit(1)
      .single();

    return data?.template || this.getDefaultTemplate(type);
  }

  private getDefaultTemplate(type: string): string {
    const templates: Record<string, string> = {
      generation: `
        # Introduction
        - Hook the reader with a compelling opening
        - Introduce the main topic
        
        # Main Content
        - Key points and insights
        - Supporting evidence and examples
        - Expert opinions or data
        
        # Practical Applications
        - Real-world use cases
        - Implementation tips
        
        # Conclusion
        - Summarize key takeaways
        - Call to action or future outlook
      `,
      evaluation: 'Standard evaluation criteria',
    };
    return templates[type] || '';
  }

  private async attemptImprovement(
    article: ArticleGeneration,
    improvements: string[]
  ): Promise<{ article: ArticleGeneration; evaluation: QualityEvaluation; status: string } | null> {
    try {
      await this.logStep('Attempting article improvement', { improvements });
      
      const improvedArticle = await claude.improveArticle(article, improvements);
      const newEvaluation = await claude.evaluateQuality(improvedArticle);
      
      if (newEvaluation.total_score >= this.config.qualityThreshold) {
        const status = newEvaluation.total_score >= this.config.autoPublishThreshold 
          ? 'approved' 
          : 'pending_review';
          
        // Update the article in database
        const slug = this.generateSlug(improvedArticle.title);
        await supabaseAdmin
          .from('articles')
          .update({
            title: improvedArticle.title,
            content: improvedArticle.content,
            markdown_content: improvedArticle.content,
            meta_description: improvedArticle.meta_description,
            keywords: improvedArticle.keywords,
            quality_score: newEvaluation.total_score,
            seo_score: newEvaluation.seo_score,
            readability_score: newEvaluation.readability_score,
            originality_score: newEvaluation.originality_score,
            accuracy_score: newEvaluation.accuracy_score,
            engagement_score: newEvaluation.engagement_score,
            evaluation_details: newEvaluation,
            status,
          })
          .eq('slug', slug);

        return {
          article: improvedArticle,
          evaluation: newEvaluation,
          status,
        };
      }
    } catch (error) {
      await this.logError('Article improvement failed', error);
    }
    
    return null;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }

  private async logStep(message: string, details?: any): Promise<void> {
    await supabaseAdmin.from('system_logs').insert({
      log_level: 'info',
      component: 'pipeline',
      message,
      details,
    });
  }

  private async logError(message: string, details?: any): Promise<void> {
    await supabaseAdmin.from('system_logs').insert({
      log_level: 'error',
      component: 'pipeline',
      message,
      details: typeof details === 'object' ? details : { error: String(details) },
    });
  }
}

export async function runPipeline(config?: Partial<PipelineConfig>): Promise<PipelineResult> {
  const pipeline = new ArticleGenerationPipeline(config);
  return await pipeline.run();
}