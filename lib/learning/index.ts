import { claude, LearningAnalysis } from '@/lib/claude';
import { supabaseAdmin } from '@/lib/supabase';

export interface PerformanceMetrics {
  articleId: string;
  title: string;
  viewCount: number;
  avgTimeOnPage: number;
  bounceRate: number;
  socialShares: number;
  qualityScore: number;
  publishedAt: string;
}

export interface LearningResult {
  analysisId: string;
  patterns: LearningAnalysis;
  promptsUpdated: number;
  improvementScore: number;
}

export class LearningSystem {
  async runLearningCycle(days: number = 7): Promise<LearningResult> {
    try {
      // Step 1: Collect performance data
      const performanceData = await this.collectPerformanceData(days);
      
      if (performanceData.length < 5) {
        throw new Error('Insufficient data for learning (minimum 5 articles required)');
      }

      // Step 2: Analyze with Claude
      const analysis = await claude.learnFromPerformance(performanceData);

      // Step 3: Save learning results
      const { data: learningData } = await supabaseAdmin
        .from('learning_data')
        .insert({
          metric_type: 'performance_analysis',
          metric_value: performanceData.length,
          patterns_extracted: analysis.success_patterns,
          improvements_suggested: analysis.prompt_improvements,
          applied: false,
        })
        .select()
        .single();

      // Step 4: Update prompt templates
      const promptsUpdated = await this.updatePromptTemplates(analysis);

      // Step 5: Calculate improvement score
      const improvementScore = await this.calculateImprovementScore(analysis);

      // Log the learning cycle
      await supabaseAdmin.from('system_logs').insert({
        log_level: 'info',
        component: 'learning',
        message: 'Learning cycle completed',
        details: {
          articles_analyzed: performanceData.length,
          prompts_updated: promptsUpdated,
          improvement_score: improvementScore,
        },
      });

      return {
        analysisId: learningData?.id || '',
        patterns: analysis,
        promptsUpdated,
        improvementScore,
      };
    } catch (error) {
      await supabaseAdmin.from('system_logs').insert({
        log_level: 'error',
        component: 'learning',
        message: 'Learning cycle failed',
        details: { error: String(error) },
      });
      throw error;
    }
  }

  private async collectPerformanceData(days: number): Promise<PerformanceMetrics[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: articles } = await supabaseAdmin
      .from('articles')
      .select(`
        id,
        title,
        view_count,
        avg_time_on_page,
        bounce_rate,
        social_shares,
        quality_score,
        published_at
      `)
      .eq('status', 'published')
      .gte('published_at', startDate.toISOString())
      .order('view_count', { ascending: false });

    if (!articles || articles.length === 0) {
      return [];
    }

    return articles.map(article => ({
      articleId: article.id,
      title: article.title,
      viewCount: article.view_count || 0,
      avgTimeOnPage: article.avg_time_on_page || 0,
      bounceRate: article.bounce_rate || 100,
      socialShares: this.calculateTotalShares(article.social_shares),
      qualityScore: article.quality_score || 0,
      publishedAt: article.published_at,
    }));
  }

  private calculateTotalShares(socialShares: any): number {
    if (!socialShares || typeof socialShares !== 'object') return 0;
    return Object.values(socialShares).reduce((sum: number, count: any) => 
      sum + (typeof count === 'number' ? count : 0), 0
    );
  }

  private async updatePromptTemplates(analysis: LearningAnalysis): Promise<number> {
    let updated = 0;

    // Update generation prompt if improved
    if (analysis.prompt_improvements.generation) {
      const { error } = await supabaseAdmin
        .from('prompt_templates')
        .update({
          template: analysis.prompt_improvements.generation,
          performance_score: 0, // Reset to track new performance
          usage_count: 0,
        })
        .eq('type', 'generation')
        .eq('is_active', true);

      if (!error) updated++;
    }

    // Update evaluation prompt if improved
    if (analysis.prompt_improvements.evaluation) {
      const { error } = await supabaseAdmin
        .from('prompt_templates')
        .update({
          template: analysis.prompt_improvements.evaluation,
          performance_score: 0,
          usage_count: 0,
        })
        .eq('type', 'evaluation')
        .eq('is_active', true);

      if (!error) updated++;
    }

    return updated;
  }

  private async calculateImprovementScore(analysis: LearningAnalysis): Promise<number> {
    // Simple scoring based on patterns found and improvements suggested
    let score = 0;
    
    if (analysis.success_patterns.title_patterns.length > 0) score += 20;
    if (analysis.success_patterns.content_patterns.length > 0) score += 20;
    if (analysis.success_patterns.optimal_length > 0) score += 15;
    if (analysis.success_patterns.best_posting_time) score += 15;
    if (analysis.prompt_improvements.generation) score += 15;
    if (analysis.prompt_improvements.evaluation) score += 15;

    return Math.min(100, score);
  }

  async analyzeArticlePerformance(articleId: string): Promise<{
    performance: string;
    recommendations: string[];
  }> {
    const { data: article } = await supabaseAdmin
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (!article) {
      throw new Error('Article not found');
    }

    const viewsPerDay = article.view_count / 
      Math.max(1, Math.floor((Date.now() - new Date(article.published_at).getTime()) / (1000 * 60 * 60 * 24)));

    let performance = 'poor';
    let recommendations: string[] = [];

    if (viewsPerDay > 1000) {
      performance = 'excellent';
    } else if (viewsPerDay > 500) {
      performance = 'good';
    } else if (viewsPerDay > 100) {
      performance = 'moderate';
    }

    // Generate recommendations based on performance
    if (article.bounce_rate > 70) {
      recommendations.push('Improve introduction to reduce bounce rate');
    }
    if (article.avg_time_on_page < 120) {
      recommendations.push('Make content more engaging to increase time on page');
    }
    if (article.seo_score < 80) {
      recommendations.push('Optimize for SEO with better keywords and meta description');
    }

    return { performance, recommendations };
  }

  async getTopPerformingPatterns(limit: number = 10): Promise<{
    titles: string[];
    topics: string[];
    optimalLength: number;
  }> {
    // Get top performing articles
    const { data: topArticles } = await supabaseAdmin
      .from('articles')
      .select('title, content, keywords, view_count')
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(limit);

    if (!topArticles || topArticles.length === 0) {
      return { titles: [], topics: [], optimalLength: 2500 };
    }

    // Extract patterns
    const titles = topArticles.map(a => a.title);
    const topics = Array.from(new Set(
      topArticles.flatMap(a => a.keywords || [])
    )).slice(0, 10);
    
    const avgLength = topArticles.reduce((sum, a) => 
      sum + (a.content?.length || 0), 0
    ) / topArticles.length;

    return {
      titles,
      topics,
      optimalLength: Math.round(avgLength),
    };
  }

  async applyLearning(learningId: string): Promise<void> {
    // Mark learning as applied
    await supabaseAdmin
      .from('learning_data')
      .update({ applied: true })
      .eq('id', learningId);

    // Log application
    await supabaseAdmin.from('system_logs').insert({
      log_level: 'info',
      component: 'learning',
      message: 'Learning patterns applied',
      details: { learning_id: learningId },
    });
  }
}

export const learningSystem = new LearningSystem();