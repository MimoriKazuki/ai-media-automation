import { NextRequest, NextResponse } from 'next/server';
import { DataCollectionOrchestrator } from '@/lib/collectors';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret if provided
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize collector
    const collector = new DataCollectionOrchestrator();
    await collector.initialize();

    // Run collection
    const result = await collector.collectAll();

    // Log the collection
    await supabaseAdmin.from('system_logs').insert({
      log_level: 'info',
      component: 'api',
      message: 'Data collection completed via API',
      details: result,
    });

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    await supabaseAdmin.from('system_logs').insert({
      log_level: 'error',
      component: 'api',
      message: 'Data collection failed via API',
      details: { error: String(error) },
    });

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Data collection failed' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Allow collection from specific source
    const body = await request.json();
    const { source } = body;

    const collector = new DataCollectionOrchestrator();
    await collector.initialize();

    let result;
    if (source) {
      const data = await collector.collectFromSource(source);
      result = {
        totalCollected: data.length,
        bySource: { [source]: data.length },
        data,
      };
    } else {
      result = await collector.collectAll();
    }

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Data collection failed' 
      },
      { status: 500 }
    );
  }
}