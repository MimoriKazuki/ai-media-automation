import { claude, TrendAnalysis, ArticleGeneration, QualityEvaluation } from '@/lib/claude';
import { supabaseAdmin } from '@/lib/supabase';
import { DataCollectionOrchestrator } from '@/lib/collectors';

interface EnhancedPipelineConfig {
  articlesPerRun: number;
  qualityThreshold: number;
  autoPublishThreshold: number;
  batchSize: number;
  minDataPoints: number;
}

interface TrendBatch {
  keyword: string;
  dataPoints: any[];
  aggregatedScore: number;
  sources: string[];
  isHotTopic: boolean;
}

export class EnhancedArticlePipeline {
  private config: EnhancedPipelineConfig;

  constructor(config?: Partial<EnhancedPipelineConfig>) {
    this.config = {
      articlesPerRun: 10,
      qualityThreshold: 80,
      autoPublishThreshold: 90,
      batchSize: 20, // Process 20 data points per trend analysis
      minDataPoints: 5, // Minimum data points to consider a trend
      ...config,
    };
  }

  /**
   * Run enhanced pipeline with intelligent batching and deduplication
   */
  async run(): Promise<{
    success: boolean;
    articlesGenerated: number;
    articlesPublished: number;
    trends: TrendBatch[];
  }> {
    const startTime = Date.now();
    
    try {
      // Step 1: Get recent unprocessed data
      const unprocessedData = await this.getUnprocessedData(200);
      
      if (unprocessedData.length < this.config.minDataPoints) {
        await this.log('info', 'Insufficient data for article generation', {
          dataCount: unprocessedData.length,
          required: this.config.minDataPoints,
        });
        return {
          success: false,
          articlesGenerated: 0,
          articlesPublished: 0,
          trends: [],
        };
      }

      // Step 2: Group data by topics and analyze trends
      const trendBatches = await this.analyzeTrendBatches(unprocessedData);
      
      // Step 3: Filter hot topics worth writing about
      const hotTopics = trendBatches
        .filter(batch => batch.isHotTopic)
        .sort((a, b) => b.aggregatedScore - a.aggregatedScore)
        .slice(0, this.config.articlesPerRun);
      
      if (hotTopics.length === 0) {
        await this.log('info', 'No hot topics found for article generation');
        return {
          success: true,
          articlesGenerated: 0,
          articlesPublished: 0,
          trends: trendBatches,
        };
      }

      // Step 4: Check for duplicate content
      const uniqueTopics = await this.filterDuplicates(hotTopics);
      
      // Step 5: Generate articles for unique hot topics
      let articlesGenerated = 0;
      let articlesPublished = 0;
      
      for (const topic of uniqueTopics) {
        const article = await this.generateArticleFromTrend(topic);
        
        if (article) {
          articlesGenerated++;
          
          if (article.autoPublished) {
            articlesPublished++;
          }
        }
      }

      // Step 6: Mark data as processed
      await this.markDataAsProcessed(unprocessedData);

      // Step 7: Update statistics
      await this.updatePipelineStats({
        articlesGenerated,
        articlesPublished,
        trendsAnalyzed: trendBatches.length,
        duration: Date.now() - startTime,
      });

      await this.log('info', 'Pipeline completed successfully', {
        articlesGenerated,
        articlesPublished,
        trendsAnalyzed: trendBatches.length,
        duration: `${(Date.now() - startTime) / 1000}s`,
      });

      return {
        success: true,
        articlesGenerated,
        articlesPublished,
        trends: trendBatches,
      };
    } catch (error) {
      await this.log('error', 'Pipeline failed', { error: String(error) });
      return {
        success: false,
        articlesGenerated: 0,
        articlesPublished: 0,
        trends: [],
      };
    }
  }

  /**
   * Get unprocessed data from database
   */
  private async getUnprocessedData(limit: number): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('collected_data')
      .select('*')
      .eq('processed', false)
      .order('collected_at', { ascending: false })
      .limit(limit);

    return data || [];
  }

  /**
   * Analyze trends in batches with intelligent grouping
   */
  private async analyzeTrendBatches(data: any[]): Promise<TrendBatch[]> {
    const batches: TrendBatch[] = [];
    const processed = new Set<string>();

    // Group similar content together
    for (const item of data) {
      if (processed.has(item.id)) continue;

      // Find related items
      const relatedItems = data.filter(d => 
        !processed.has(d.id) && 
        this.areRelated(item, d)
      );

      if (relatedItems.length >= this.config.minDataPoints) {
        // Create a batch for trend analysis
        const batch = await this.createTrendBatch(relatedItems);
        batches.push(batch);
        
        // Mark items as processed in this batch
        relatedItems.forEach(item => processed.add(item.id));
      }
    }

    return batches;
  }

  /**
   * Check if two data items are related
   */
  private areRelated(item1: any, item2: any): boolean {
    const text1 = `${item1.title} ${item1.content}`.toLowerCase();
    const text2 = `${item2.title} ${item2.content}`.toLowerCase();

    // Extract key terms
    const terms1 = this.extractKeyTerms(text1);
    const terms2 = this.extractKeyTerms(text2);

    // Calculate overlap
    const overlap = terms1.filter(term => terms2.includes(term)).length;
    const similarity = overlap / Math.max(terms1.length, terms2.length);

    return similarity > 0.3; // 30% similarity threshold
  }

  /**
   * Extract key terms from text
   */
  private extractKeyTerms(text: string): string[] {
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are',
      'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
      'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
      'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why',
      'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
      'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
      'than', 'too', 'very', 'just', 'but', 'for', 'with', 'about'
    ]);

    return text
      .split(/\W+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 20);
  }

  /**
   * Create a trend batch from related items
   */
  private async createTrendBatch(items: any[]): Promise<TrendBatch> {
    // Extract common keywords
    const allTerms = items.flatMap(item => 
      this.extractKeyTerms(`${item.title} ${item.content}`.toLowerCase())
    );
    
    const termFrequency = allTerms.reduce((acc, term) => {
      acc[term] = (acc[term] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topTerms = Object.entries(termFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([term]) => term);

    const keyword = topTerms[0] || 'AI Trend';
    
    // Calculate aggregated score
    const totalScore = items.reduce((sum, item) => sum + (item.trend_score || 5), 0);
    const aggregatedScore = totalScore / items.length;

    // Get unique sources
    const sources = [...new Set(items.map(item => item.source))];

    // Analyze with Claude for better insights
    let isHotTopic = false;
    try {
      const analysis = await claude.analyzeTrend(items.slice(0, 10));
      isHotTopic = analysis.should_write_article && analysis.trend_score >= 7;
    } catch {
      // Fallback to simple scoring
      isHotTopic = aggregatedScore >= 7 && items.length >= 10;
    }

    return {
      keyword,
      dataPoints: items,
      aggregatedScore,
      sources,
      isHotTopic,
    };
  }

  /**
   * Filter out duplicate topics
   */
  private async filterDuplicates(topics: TrendBatch[]): Promise<TrendBatch[]> {
    const unique: TrendBatch[] = [];
    
    for (const topic of topics) {
      // Check if similar article was published recently
      const { data: similar } = await supabaseAdmin
        .from('articles')
        .select('id, title')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .ilike('title', `%${topic.keyword}%`)
        .limit(1);

      if (!similar || similar.length === 0) {
        unique.push(topic);
      } else {
        await this.log('info', 'Skipping duplicate topic', {
          keyword: topic.keyword,
          similar: similar[0].title,
        });
      }
    }

    return unique;
  }

  /**
   * Generate article from trend batch
   */
  private async generateArticleFromTrend(trend: TrendBatch): Promise<{
    article: any;
    autoPublished: boolean;
  } | null> {
    try {
      // Prepare trend data for Claude
      const trendData = {
        keyword: trend.keyword,
        score: trend.aggregatedScore,
        sources: trend.sources,
        dataPoints: trend.dataPoints.slice(0, 10).map(d => ({
          title: d.title,
          content: d.content?.substring(0, 500),
          source: d.source,
        })),
      };

      // Get best template
      const template = await this.getBestTemplate();

      // Generate article
      const article = await claude.generateArticle(
        trendData as any,
        template
      );

      // Evaluate quality
      const evaluation = await claude.evaluateQuality(article);

      // Save to database
      const slug = this.generateSlug(article.title);
      const status = evaluation.total_score >= this.config.autoPublishThreshold
        ? 'published'
        : evaluation.total_score >= this.config.qualityThreshold
        ? 'pending_review'
        : 'draft';

      const { data: savedArticle, error } = await supabaseAdmin
        .from('articles')
        .insert({
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
          published_at: status === 'published' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      await this.log('info', 'Article generated', {
        title: article.title,
        status,
        qualityScore: evaluation.total_score,
      });

      return {
        article: savedArticle,
        autoPublished: status === 'published',
      };
    } catch (error) {
      await this.log('error', 'Failed to generate article', {
        keyword: trend.keyword,
        error: String(error),
      });
      return null;
    }
  }

  /**
   * Get best performing template
   */
  private async getBestTemplate(): Promise<string> {
    const { data } = await supabaseAdmin
      .from('prompt_templates')
      .select('template')
      .eq('type', 'generation')
      .eq('is_active', true)
      .order('performance_score', { ascending: false })
      .limit(1)
      .single();

    return data?.template || `
      # Introduction
      - Hook the reader with current relevance
      - Introduce the main topic
      
      # Key Developments
      - Recent breakthroughs and announcements
      - Technical details explained simply
      
      # Industry Impact
      - How this affects businesses
      - Real-world applications
      
      # Expert Analysis
      - Insights and predictions
      - Challenges and opportunities
      
      # Practical Takeaways
      - Action items for readers
      - Resources for further learning
      
      # Conclusion
      - Summary of key points
      - Future outlook
    `;
  }

  /**
   * Generate URL slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }

  /**
   * Mark data as processed
   */
  private async markDataAsProcessed(data: any[]): Promise<void> {
    const ids = data.map(d => d.id).filter(Boolean);
    
    if (ids.length > 0) {
      await supabaseAdmin
        .from('collected_data')
        .update({ processed: true })
        .in('id', ids);
    }
  }

  /**
   * Update pipeline statistics
   */
  private async updatePipelineStats(stats: any): Promise<void> {
    await supabaseAdmin.from('pipeline_stats').insert({
      ...stats,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Log pipeline events
   */
  private async log(level: string, message: string, details?: any): Promise<void> {
    await supabaseAdmin.from('system_logs').insert({
      log_level: level,
      component: 'enhanced_pipeline',
      message,
      details,
    });
    
    console.log(`[Enhanced Pipeline] [${level.toUpperCase()}] ${message}`, details || '');
  }
}