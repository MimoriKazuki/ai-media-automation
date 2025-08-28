import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { claude } from '@/lib/claude';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      article: data
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Article not found' },
      { status: 404 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, content, status, meta_description, keywords } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (status !== undefined) updateData.status = status;
    if (meta_description !== undefined) updateData.meta_description = meta_description;
    if (keywords !== undefined) updateData.keywords = keywords;
    
    updateData.updated_at = new Date().toISOString();

    // 内容が更新された場合は再評価
    if (content) {
      const evaluation = await claude.evaluateQuality({
        title: title || '',
        content,
        meta_description: meta_description || '',
        keywords: keywords || [],
        estimated_reading_time: Math.ceil(content.split(' ').length / 200)
      });
      
      updateData.quality_score = evaluation.total_score;
      updateData.seo_score = evaluation.seo_score;
      updateData.readability_score = evaluation.readability_score;
    }

    const { data, error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      article: data
    });
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update article' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete article' },
      { status: 500 }
    );
  }
}