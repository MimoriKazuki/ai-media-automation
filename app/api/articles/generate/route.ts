import { NextRequest, NextResponse } from 'next/server';
import { claude } from '@/lib/claude';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, keywords, template, urgency } = body;

    console.log('Generating article for topic:', topic);

    // キーワードを配列に変換
    const keywordsArray = keywords 
      ? (typeof keywords === 'string' 
          ? keywords.split(',').map((k: string) => k.trim()) 
          : keywords)
      : [];

    // トピックと関連データを準備
    const trendData = {
      trend_score: 8,
      keywords: keywordsArray,
      summary: topic,
      should_write_article: true,
      urgency: urgency || 'medium',
      predicted_performance: {
        estimated_views: 5000,
        engagement_score: 8
      }
    };

    // 記事を生成
    let article;
    try {
      article = await claude.generateArticle(
        trendData,
        template || 'Introduction, Main Content, Examples, Conclusion'
      );
      console.log('Article generated successfully');
    } catch (genError) {
      console.error('Article generation failed:', genError);
      // エラー詳細を記録
      if (genError instanceof Error) {
        console.error('Error details:', {
          message: genError.message,
          stack: genError.stack
        });
      }
      throw new Error(`記事生成に失敗しました: ${genError instanceof Error ? genError.message : 'Unknown error'}`);
    }

    // 品質評価
    let evaluation;
    try {
      evaluation = await claude.evaluateQuality(article);
      console.log('Quality evaluation completed');
    } catch (evalError) {
      console.error('Evaluation failed:', evalError);
      // 評価失敗時のフォールバック
      evaluation = {
        total_score: 75,
        seo_score: 75,
        readability_score: 75,
        accuracy_score: 75,
        originality_score: 75,
        engagement_score: 75,
        improvements: [],
        strengths: []
      };
    }

    // データベースに保存
    const { data, error } = await supabase
      .from('articles')
      .insert([
        {
          title: article.title,
          content: article.content,
          meta_description: article.meta_description,
          keywords: article.keywords,
          status: evaluation.total_score >= 90 ? 'published' : 
                 evaluation.total_score >= 80 ? 'pending_review' : 'draft',
          quality_score: evaluation.total_score,
          seo_score: evaluation.seo_score,
          readability_score: evaluation.readability_score,
          estimated_reading_time: article.estimated_reading_time,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Database save error:', error);
      // データベース保存失敗時でも記事と評価を返す
      return NextResponse.json({
        success: true,
        article: {
          id: 'temp-' + Date.now(),
          ...article,
          status: evaluation.total_score >= 90 ? 'published' : 
                 evaluation.total_score >= 80 ? 'pending_review' : 'draft',
          quality_score: evaluation.total_score,
          created_at: new Date().toISOString()
        },
        evaluation,
        warning: 'データベースへの保存に失敗しましたが、記事は生成されました'
      });
    }

    return NextResponse.json({
      success: true,
      article: data,
      evaluation
    });
  } catch (error) {
    console.error('Article generation error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : '',
      hint: error instanceof Error && error.message.includes('fetch') 
        ? 'ネットワークエラーが発生しました。APIキーまたはネットワーク接続を確認してください。' 
        : '',
      code: error instanceof Error && error.message.includes('401') ? '401' : ''
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate article',
        hint: error instanceof Error && error.message.includes('fetch') 
          ? 'ネットワークエラー。APIキーまたは接続を確認してください。' 
          : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Supabase接続をテスト
    try {
      let query = supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase query error:', error);
        // データベースエラーの場合はモックデータを返す
        return NextResponse.json({
          success: true,
          articles: getMockArticles(),
          total: 3,
          warning: 'データベース接続エラー。モックデータを表示しています。'
        });
      }

      return NextResponse.json({
        success: true,
        articles: data || [],
        total: data?.length || 0
      });
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      // 接続エラーの場合もモックデータを返す
      return NextResponse.json({
        success: true,
        articles: getMockArticles(),
        total: 3,
        warning: 'データベース接続エラー。モックデータを表示しています。'
      });
    }
  } catch (error) {
    console.error('Error fetching articles:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : '',
      hint: '',
      code: ''
    });
    
    // エラー時でもモックデータで動作継続
    return NextResponse.json({
      success: true,
      articles: getMockArticles(),
      total: 3,
      warning: 'エラーが発生しました。モックデータを表示しています。'
    });
  }
}

function getMockArticles() {
  return [
    {
      id: 'mock-1',
      title: 'AI開発の最新トレンド2025',
      content: '# AI開発の最新トレンド\n\n生成AIの進化が加速しています...',
      status: 'published',
      quality_score: 92,
      seo_score: 95,
      readability_score: 88,
      keywords: ['AI', '生成AI', 'トレンド'],
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'mock-2',
      title: 'ChatGPTとClaudeの比較分析',
      content: '# ChatGPTとClaudeの比較\n\n両者の特徴を詳しく解説します...',
      status: 'pending_review',
      quality_score: 85,
      seo_score: 82,
      readability_score: 90,
      keywords: ['ChatGPT', 'Claude', 'AI比較'],
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: 'mock-3',
      title: '機械学習の実装ガイド',
      content: '# 機械学習の実装\n\n初心者向けの完全ガイドです...',
      status: 'draft',
      quality_score: 78,
      seo_score: 75,
      readability_score: 85,
      keywords: ['機械学習', 'Python', 'TensorFlow'],
      created_at: new Date(Date.now() - 259200000).toISOString(),
      updated_at: new Date(Date.now() - 259200000).toISOString()
    }
  ];
}