import { NextRequest, NextResponse } from 'next/server';
import { automationScheduler } from '@/lib/automation/scheduler';
import { EnhancedArticlePipeline } from '@/lib/pipeline/enhanced';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, config } = body;

    switch (action) {
      case 'start':
        // Start automation scheduler
        await automationScheduler.start();
        return NextResponse.json({
          success: true,
          message: 'Automation scheduler started',
          status: await automationScheduler.getStatus(),
        });

      case 'stop':
        // Stop automation scheduler
        await automationScheduler.stop();
        return NextResponse.json({
          success: true,
          message: 'Automation scheduler stopped',
        });

      case 'run_once':
        // Run pipeline once immediately
        const pipeline = new EnhancedArticlePipeline(config);
        const result = await pipeline.run();
        
        return NextResponse.json({
          success: result.success,
          message: 'Pipeline executed',
          result,
        });

      case 'collect':
        // Run data collection only
        await automationScheduler.runCollection();
        return NextResponse.json({
          success: true,
          message: 'Data collection completed',
        });

      case 'generate':
        // Run article generation only
        await automationScheduler.runGeneration();
        return NextResponse.json({
          success: true,
          message: 'Article generation completed',
        });

      case 'learn':
        // Run learning cycle only
        await automationScheduler.runLearning();
        return NextResponse.json({
          success: true,
          message: 'Learning cycle completed',
        });

      case 'status':
        // Get current status
        const status = await automationScheduler.getStatus();
        return NextResponse.json({
          success: true,
          status,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Automation API error:', error);
    await supabaseAdmin.from('system_logs').insert({
      log_level: 'error',
      component: 'automation_api',
      message: 'Automation API error',
      details: { error: String(error) },
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get automation status
    const status = await automationScheduler.getStatus();
    
    // Get recent articles
    const { data: recentArticles } = await supabaseAdmin
      .from('articles')
      .select('id, title, status, quality_score, created_at, published_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get pipeline stats
    const { data: pipelineStats } = await supabaseAdmin
      .from('system_logs')
      .select('*')
      .eq('component', 'enhanced_pipeline')
      .eq('log_level', 'info')
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      scheduler: status,
      recentArticles,
      pipelineStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}