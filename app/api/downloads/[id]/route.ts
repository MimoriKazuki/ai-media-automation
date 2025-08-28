import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Download token required' },
        { status: 400 }
      )
    }

    // Decode and validate token
    try {
      const decodedToken = JSON.parse(
        Buffer.from(token, 'base64url').toString('utf-8')
      )

      const { leadMagnetId, email, timestamp } = decodedToken

      // Check if token is expired (7 days)
      const tokenAge = Date.now() - timestamp
      const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
      
      if (tokenAge > maxAge) {
        return NextResponse.json(
          { error: 'Download link has expired' },
          { status: 410 }
        )
      }

      // Verify lead magnet ID matches
      if (leadMagnetId !== params.id) {
        return NextResponse.json(
          { error: 'Invalid download token' },
          { status: 403 }
        )
      }

    } catch (tokenError) {
      return NextResponse.json(
        { error: 'Invalid download token' },
        { status: 403 }
      )
    }

    // Get lead magnet details
    const { data: leadMagnet, error } = await supabase
      .from('lead_magnets')
      .select('*')
      .eq('id', params.id)
      .eq('is_active', true)
      .single()

    if (error || !leadMagnet) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Check if content_url exists
    if (!leadMagnet.content_url) {
      return NextResponse.json(
        { error: 'Download not available' },
        { status: 404 }
      )
    }

    // Track download
    const ip = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Get lead by email to record download
    const { data: lead } = await supabase
      .from('leads')
      .select('id')
      .eq('email', JSON.parse(Buffer.from(token, 'base64url').toString('utf-8')).email)
      .single()

    if (lead) {
      // Record download
      await supabase.from('lead_magnet_downloads').insert([{
        lead_magnet_id: params.id,
        lead_id: lead.id,
        ip_address: ip,
        user_agent: userAgent,
      }])

      // Update download count (using a database function would be better for concurrency)
      await supabase
        .from('lead_magnets')
        .update({ 
          download_count: leadMagnet.download_count + 1 
        })
        .eq('id', params.id)
    }

    // Return the file content or redirect to file URL
    if (leadMagnet.content_url.startsWith('http')) {
      // External URL - redirect
      return NextResponse.redirect(leadMagnet.content_url)
    } else {
      // Internal file - serve directly
      // In a real implementation, you'd fetch from your storage service
      // For now, return a JSON response with download info
      return NextResponse.json({
        success: true,
        filename: `${leadMagnet.slug}.pdf`,
        downloadUrl: leadMagnet.content_url,
        title: leadMagnet.title,
        fileType: leadMagnet.file_type,
        message: 'File ready for download'
      })
    }

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}