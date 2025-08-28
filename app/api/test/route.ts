import { NextRequest, NextResponse } from 'next/server';
import { DataCollectionOrchestrator } from '@/lib/collectors';
import { EnhancedArticlePipeline } from '@/lib/pipeline/enhanced';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'status';

  try {
    switch (mode) {
      case 'collect':
        // データ収集テスト（モックデータを使用）
        const collector = new DataCollectionOrchestrator();
        await collector.initialize();
        const collectionResult = await collector.collectAll();
        
        return NextResponse.json({
          success: true,
          mode: 'collect',
          result: {
            totalCollected: collectionResult.totalCollected,
            bySource: collectionResult.bySource,
            sampleData: collectionResult.data.slice(0, 3).map(item => ({
              title: item.title,
              source: item.source,
              url: item.url,
              score: item.trend_score,
            })),
          },
        });

      case 'generate':
        // 記事生成テスト（小規模）
        const pipeline = new EnhancedArticlePipeline({
          articlesPerRun: 1, // 1記事のみ生成
          qualityThreshold: 70,
          autoPublishThreshold: 85,
          minDataPoints: 3,
        });
        
        const pipelineResult = await pipeline.run();
        
        return NextResponse.json({
          success: true,
          mode: 'generate',
          result: {
            articlesGenerated: pipelineResult.articlesGenerated,
            articlesPublished: pipelineResult.articlesPublished,
            trendsAnalyzed: pipelineResult.trends.length,
            trends: pipelineResult.trends.slice(0, 3).map(t => ({
              keyword: t.keyword,
              score: t.aggregatedScore,
              dataPoints: t.dataPoints.length,
              isHotTopic: t.isHotTopic,
            })),
          },
        });

      case 'status':
      default:
        // システムステータス
        const { data: recentArticles } = await supabaseAdmin
          .from('articles')
          .select('id, title, status, quality_score, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        const { data: unprocessedCount } = await supabaseAdmin
          .from('collected_data')
          .select('id', { count: 'exact', head: true })
          .eq('processed', false);

        const { data: logs } = await supabaseAdmin
          .from('system_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        return NextResponse.json({
          success: true,
          mode: 'status',
          status: {
            unprocessedData: unprocessedCount?.count || 0,
            recentArticles: recentArticles?.length || 0,
            articles: recentArticles?.map(a => ({
              title: a.title,
              status: a.status,
              quality: a.quality_score,
              created: a.created_at,
            })),
            recentLogs: logs?.slice(0, 5).map(l => ({
              level: l.log_level,
              component: l.component,
              message: l.message,
              time: l.created_at,
            })),
          },
        });
    }
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        mode,
      },
      { status: 500 }
    );
  }
}