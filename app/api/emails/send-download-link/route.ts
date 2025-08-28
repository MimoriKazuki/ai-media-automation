import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { to, name, leadMagnetId } = await request.json()

    // Get lead magnet details
    const { data: leadMagnet, error } = await supabase
      .from('lead_magnets')
      .select('*')
      .eq('id', leadMagnetId)
      .single()

    if (error || !leadMagnet) {
      return NextResponse.json(
        { error: 'Lead magnet not found' },
        { status: 404 }
      )
    }

    // Create download tracking token
    const downloadToken = Buffer.from(
      JSON.stringify({ leadMagnetId, email: to, timestamp: Date.now() })
    ).toString('base64url')

    const downloadUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/downloads/${leadMagnetId}?token=${downloadToken}`

    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>資料ダウンロード - ${leadMagnet.title}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">資料ダウンロード</h1>
    <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">${leadMagnet.title}</p>
  </div>

  <div style="padding: 0 20px;">
    <p>${name}様</p>
    
    <p>この度は「${leadMagnet.title}」をダウンロードいただき、ありがとうございます。</p>
    
    <p>下記のボタンから資料をダウンロードしていただけます：</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${downloadUrl}" 
         style="background: #4F46E5; color: white; padding: 15px 30px; border-radius: 5px; text-decoration: none; display: inline-block; font-weight: bold;">
        📄 ${leadMagnet.title}をダウンロード
      </a>
    </div>
    
    <div style="background: #f8f9fa; border-left: 4px solid #4F46E5; padding: 20px; margin: 30px 0; border-radius: 5px;">
      <h3 style="margin: 0 0 10px 0; color: #4F46E5;">この資料について</h3>
      <p style="margin: 0;">${leadMagnet.description}</p>
    </div>
    
    <h3 style="color: #333; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">次のステップ</h3>
    
    <div style="margin: 20px 0;">
      <h4 style="color: #4F46E5; margin: 0 0 10px 0;">📧 週刊AIトレンドニュースレター</h4>
      <p style="margin: 0 0 15px 0;">最新のAI業界動向を毎週お届けします。既に購読手続きが完了しています。</p>
      
      <h4 style="color: #4F46E5; margin: 20px 0 10px 0;">💬 無料コンサルテーション</h4>
      <p style="margin: 0 0 10px 0;">AI実装についてより詳しく相談されたい場合は、無料のコンサルテーションもご利用いただけます。</p>
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/consultation" 
         style="color: #4F46E5; text-decoration: none; font-weight: bold;">
        🔗 コンサルテーション予約はこちら
      </a>
    </div>
    
    <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 30px 0;">
      <p style="margin: 0; color: #92400e;">
        <strong>⚠️ ダウンロードリンクの有効期限</strong><br>
        このリンクは7日間有効です。期限切れの場合は、お手数ですが再度お申し込みください。
      </p>
    </div>
  </div>
  
  <div style="border-top: 1px solid #e5e7eb; padding: 20px; margin-top: 40px; text-align: center; color: #6b7280; font-size: 14px;">
    <p>AI Media Automation</p>
    <p>このメールに心当たりがない場合は、お手数ですが削除してください。</p>
    <p>
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/unsubscribe?email=${encodeURIComponent(to)}" 
         style="color: #6b7280; text-decoration: none;">
        配信停止
      </a> | 
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/privacy" 
         style="color: #6b7280; text-decoration: none;">
        プライバシーポリシー
      </a>
    </p>
  </div>
</body>
</html>
    `

    const { data, error: emailError } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'AI Media Automation <noreply@aimediaautomation.com>',
      to,
      subject: `📄 ${leadMagnet.title} - ダウンロードリンク`,
      html: emailContent,
    })

    if (emailError) {
      console.error('Error sending email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
    })

  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}