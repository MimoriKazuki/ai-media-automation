import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/lib/pipeline';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret if provided
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Log pipeline start
    await supabaseAdmin.from('system_logs').insert({
      log_level: 'info',
      component: 'api',
      message: 'Pipeline execution started via API',
      details: { trigger: authHeader ? 'cron' : 'manual' },
    });

    // Run the pipeline
    const result = await runPipeline();

    // Log completion
    await supabaseAdmin.from('system_logs').insert({
      log_level: 'info',
      component: 'api',
      message: 'Pipeline execution completed via API',
      details: result,
    });

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Log error
    await supabaseAdmin.from('system_logs').insert({
      log_level: 'error',
      component: 'api',
      message: 'Pipeline execution failed via API',
      details: { error: String(error) },
    });

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Pipeline execution failed' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Allow custom configuration via POST
    const body = await request.json();
    const { articlesPerDay, qualityThreshold, autoPublishThreshold } = body;

    const config = {
      ...(articlesPerDay && { articlesPerDay }),
      ...(qualityThreshold && { qualityThreshold }),
      ...(autoPublishThreshold && { autoPublishThreshold }),
    };

    const result = await runPipeline(config);

    return NextResponse.json({
      success: true,
      result,
      config,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Pipeline execution failed' 
      },
      { status: 500 }
    );
  }
}