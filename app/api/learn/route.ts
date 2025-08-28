import { NextRequest, NextResponse } from 'next/server';
import { learningSystem } from '@/lib/learning';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret if provided
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run learning cycle (default: last 7 days)
    const result = await learningSystem.runLearningCycle(7);

    // Log the learning
    await supabaseAdmin.from('system_logs').insert({
      log_level: 'info',
      component: 'api',
      message: 'Learning cycle completed via API',
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
      message: 'Learning cycle failed via API',
      details: { error: String(error) },
    });

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Learning cycle failed' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Allow custom parameters
    const body = await request.json();
    const { days = 7, applyLearning = false, learningId } = body;

    if (applyLearning && learningId) {
      // Apply existing learning
      await learningSystem.applyLearning(learningId);
      return NextResponse.json({
        success: true,
        action: 'applied',
        learningId,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Run new learning cycle
      const result = await learningSystem.runLearningCycle(days);
      return NextResponse.json({
        success: true,
        ...result,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Learning operation failed' 
      },
      { status: 500 }
    );
  }
}