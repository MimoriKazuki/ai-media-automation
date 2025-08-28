import { NextRequest, NextResponse } from 'next/server';
import { AutoArticleGenerator } from '@/lib/pipeline/auto-article-generator';

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Starting automatic article generation pipeline...');
    
    const generator = new AutoArticleGenerator();
    const result = await generator.runFullPipeline();
    
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Successfully generated ${result.articlesGenerated} articles`
        : 'Pipeline execution failed',
      articlesGenerated: result.articlesGenerated,
      errors: result.errors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auto-generation pipeline error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Pipeline execution failed',
        articlesGenerated: 0,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Auto Article Generation Pipeline',
    description: 'POST to this endpoint to run the full pipeline: collect data → analyze trends → generate articles',
    workflow: [
      '1. Collect data from all sources (Reddit, HackerNews, AI Companies, etc.)',
      '2. Analyze and extract trending topics',
      '3. Generate articles for top trends',
      '4. Save articles with quality scores'
    ]
  });
}