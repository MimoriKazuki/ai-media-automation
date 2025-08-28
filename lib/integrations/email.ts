import { Resend } from 'resend'
import { Lead, NewsletterSubscription } from '@/lib/types'

export class EmailService {
  private resend: Resend
  private fromEmail: string

  constructor(apiKey: string, fromEmail: string) {
    this.resend = new Resend(apiKey)
    this.fromEmail = fromEmail
  }

  async sendWelcomeEmail(lead: Lead): Promise<boolean> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: lead.email,
        subject: 'AI実装の第一歩へようこそ！',
        html: this.generateWelcomeEmail(lead),
      })

      if (error) {
        console.error('Welcome email error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Email service error:', error)
      return false
    }
  }

  async sendNewsletterEmail(
    subscription: NewsletterSubscription, 
    content: {
      subject: string
      html: string
      text?: string
    }
  ): Promise<boolean> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: subscription.email,
        subject: content.subject,
        html: content.html,
        text: content.text,
        headers: {
          'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_BASE_URL}/unsubscribe?email=${encodeURIComponent(subscription.email)}>`,
        }
      })

      if (error) {
        console.error('Newsletter email error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Email service error:', error)
      return false
    }
  }

  async sendNurtureSequence(lead: Lead, sequenceStep: number): Promise<boolean> {
    const nurtureEmails = [
      {
        subject: 'AI導入で最初に検討すべき3つのポイント',
        content: this.generateNurtureEmail1(lead),
      },
      {
        subject: 'よくある AI実装の失敗事例と対策',
        content: this.generateNurtureEmail2(lead),
      },
      {
        subject: 'ROIを最大化するAI導入戦略',
        content: this.generateNurtureEmail3(lead),
      },
    ]

    if (sequenceStep < 1 || sequenceStep > nurtureEmails.length) {
      return false
    }

    const email = nurtureEmails[sequenceStep - 1]

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: lead.email,
        subject: email.subject,
        html: email.content,
      })

      if (error) {
        console.error('Nurture email error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Email service error:', error)
      return false
    }
  }

  async sendConsultationConfirmation(lead: Lead, consultationId: string): Promise<boolean> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: lead.email,
        subject: 'AI実装コンサルテーションのお申し込みありがとうございます',
        html: this.generateConsultationConfirmationEmail(lead, consultationId),
      })

      if (error) {
        console.error('Consultation confirmation email error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Email service error:', error)
      return false
    }
  }

  private generateWelcomeEmail(lead: Lead): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AI実装の第一歩へようこそ</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">ようこそ！</h1>
    <p style="color: white; margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">AI実装の成功への第一歩を踏み出されました</p>
  </div>

  <div style="padding: 0 20px;">
    <p>${lead.name || 'お客様'}</p>
    
    <p>この度は、AI Media Automationをご利用いただき、ありがとうございます。</p>
    
    <p>AI実装は多くの企業にとって大きなチャレンジですが、適切な戦略とサポートがあれば、必ず成功できます。私たちは、あなたの会社のAI導入を全力でサポートいたします。</p>
    
    <div style="background: #f8f9fa; border-left: 4px solid #4F46E5; padding: 20px; margin: 30px 0; border-radius: 5px;">
      <h3 style="margin: 0 0 15px 0; color: #4F46E5;">これからのステップ</h3>
      <div style="margin: 0;">
        <p style="margin: 0 0 10px 0;"><strong>1. リソースの活用</strong><br>
        ダウンロードしたガイドを参考に、現状分析から始めてください。</p>
        
        <p style="margin: 10px 0;"><strong>2. 週刊ニュースレター</strong><br>
        毎週金曜日に最新のAI動向をお届けします。</p>
        
        <p style="margin: 10px 0 0 0;"><strong>3. 専門家とのコンサルテーション</strong><br>
        準備ができましたら、無料コンサルテーションをご活用ください。</p>
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/consultation" 
         style="background: #4F46E5; color: white; padding: 15px 30px; border-radius: 5px; text-decoration: none; display: inline-block; font-weight: bold;">
        💬 無料コンサルテーション予約
      </a>
    </div>
    
    <p>ご質問がございましたら、いつでもお気軽にお問い合わせください。</p>
    
    <p>AI実装の成功を心から応援しております。</p>
    
    <p style="margin-top: 30px;">
    AI Media Automation チーム<br>
    <a href="mailto:support@aimediaautomation.com" style="color: #4F46E5;">support@aimediaautomation.com</a>
    </p>
  </div>
  
  <div style="border-top: 1px solid #e5e7eb; padding: 20px; margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px;">
    <p>© 2024 AI Media Automation. All rights reserved.</p>
  </div>
</body>
</html>
    `
  }

  private generateNurtureEmail1(lead: Lead): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AI導入で最初に検討すべき3つのポイント</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #4F46E5; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">AI導入成功の3つのポイント</h1>
  </div>

  <div style="padding: 0 20px;">
    <p>${lead.name || 'お客様'}</p>
    
    <p>AI導入を成功させるために、最初に検討すべき3つの重要なポイントをご紹介します。</p>
    
    <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3 style="color: #4F46E5; margin: 0 0 15px 0;">1. 明確な目標設定</h3>
      <p style="margin: 0;">AIで「何を」「どのくらい」改善したいのかを具体的に定義することが最も重要です。</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3 style="color: #4F46E5; margin: 0 0 15px 0;">2. データ品質の確保</h3>
      <p style="margin: 0;">AIの性能は入力データの品質に大きく依存します。データの整備から始めましょう。</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3 style="color: #4F46E5; margin: 0 0 15px 0;">3. 段階的な導入計画</h3>
      <p style="margin: 0;">一度に全てを変えようとせず、小さく始めて段階的に拡張していく戦略が効果的です。</p>
    </div>
    
    <p>次回は、よくある失敗事例とその対策についてお話しします。</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/consultation" 
         style="background: #4F46E5; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; display: inline-block;">
        詳しく相談する
      </a>
    </div>
  </div>
</body>
</html>
    `
  }

  private generateNurtureEmail2(lead: Lead): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>よくあるAI実装の失敗事例と対策</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #DC2626; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">AI実装の失敗事例と対策</h1>
  </div>

  <div style="padding: 0 20px;">
    <p>${lead.name || 'お客様'}</p>
    
    <p>多くの企業がAI導入で直面する共通の課題と、それらを回避する方法をご紹介します。</p>
    
    <div style="border-left: 4px solid #DC2626; padding: 20px; margin: 20px 0; background: #FEF2F2;">
      <h3 style="color: #DC2626; margin: 0 0 10px 0;">❌ 失敗例1: 明確なROI設定なし</h3>
      <p style="margin: 0 0 10px 0; color: #7F1D1D;"><strong>問題:</strong> 成果測定の基準が曖昧</p>
      <p style="margin: 0; color: #059669;"><strong>対策:</strong> 導入前に具体的なKPIと測定方法を確立</p>
    </div>
    
    <div style="border-left: 4px solid #DC2626; padding: 20px; margin: 20px 0; background: #FEF2F2;">
      <h3 style="color: #DC2626; margin: 0 0 10px 0;">❌ 失敗例2: データ品質の軽視</h3>
      <p style="margin: 0 0 10px 0; color: #7F1D1D;"><strong>問題:</strong> 不正確なデータによる低品質なAI</p>
      <p style="margin: 0; color: #059669;"><strong>対策:</strong> データクレンジングと品質管理を優先</p>
    </div>
    
    <div style="border-left: 4px solid #DC2626; padding: 20px; margin: 20px 0; background: #FEF2F2;">
      <h3 style="color: #DC2626; margin: 0 0 10px 0;">❌ 失敗例3: 組織の抵抗</h3>
      <p style="margin: 0 0 10px 0; color: #7F1D1D;"><strong>問題:</strong> 現場からの反発や理解不足</p>
      <p style="margin: 0; color: #059669;"><strong>対策:</strong> 早期からの関係者巻き込みと教育</p>
    </div>
    
    <p>これらの失敗を避けることで、AI導入の成功確率を大幅に向上させることができます。</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/consultation" 
         style="background: #4F46E5; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; display: inline-block;">
        失敗を避ける方法を相談する
      </a>
    </div>
  </div>
</body>
</html>
    `
  }

  private generateNurtureEmail3(lead: Lead): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ROIを最大化するAI導入戦略</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #059669; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">ROI最大化のAI戦略</h1>
  </div>

  <div style="padding: 0 20px;">
    <p>${lead.name || 'お客様'}</p>
    
    <p>AI投資の投資対効果を最大化するための戦略をご紹介します。</p>
    
    <div style="background: #ECFDF5; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #059669;">
      <h3 style="color: #059669; margin: 0 0 15px 0;">💰 ROI計算の基本式</h3>
      <p style="margin: 0; font-family: monospace; background: white; padding: 10px; border-radius: 4px;">
        ROI = (AI導入による効果 - 導入コスト) ÷ 導入コスト × 100
      </p>
    </div>
    
    <div style="background: #F0F9FF; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3 style="color: #0369A1; margin: 0 0 15px 0;">🎯 高ROIを実現する3つの戦略</h3>
      <ol style="margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 10px;"><strong>影響度の大きい業務から着手</strong><br>コスト削減効果が見込める業務を優先</li>
        <li style="margin-bottom: 10px;"><strong>段階的な拡張</strong><br>成功事例を作ってから横展開</li>
        <li><strong>継続的な改善</strong><br>運用データを活用してAIを継続改善</li>
      </ol>
    </div>
    
    <p>適切な戦略により、多くの企業でAI導入から6ヶ月以内に投資回収を実現しています。</p>
    
    <div style="text-align: center; margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
      <h3 style="color: white; margin: 0 0 15px 0;">🎉 無料コンサルテーション実施中</h3>
      <p style="color: white; margin: 0 0 20px 0; opacity: 0.9;">
        あなたの会社に最適なAI導入戦略を60分間で無料診断
      </p>
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/consultation" 
         style="background: white; color: #4F46E5; padding: 15px 30px; border-radius: 5px; text-decoration: none; display: inline-block; font-weight: bold;">
        今すぐ予約する
      </a>
    </div>
  </div>
</body>
</html>
    `
  }

  private generateConsultationConfirmationEmail(lead: Lead, consultationId: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>コンサルテーションお申し込み確認</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #10B981; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ 予約完了</h1>
    <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">AI実装コンサルテーション</p>
  </div>

  <div style="padding: 0 20px;">
    <p>${lead.name || 'お客様'}</p>
    
    <p>AI実装コンサルテーションのお申し込みをいただき、ありがとうございます。</p>
    
    <div style="background: #F0FDF4; border: 1px solid #10B981; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #10B981; margin: 0 0 15px 0;">📋 次のステップ</h3>
      <ol style="margin: 0; padding-left: 20px; color: #14532D;">
        <li style="margin-bottom: 8px;"><strong>24時間以内</strong> - 担当者からご連絡</li>
        <li style="margin-bottom: 8px;"><strong>日程調整</strong> - 最適な時間帯を相談</li>
        <li style="margin-bottom: 8px;"><strong>事前準備</strong> - 効果的な相談のためのガイド送付</li>
        <li><strong>コンサルテーション実施</strong> - 60分間の戦略セッション</li>
      </ol>
    </div>
    
    <div style="background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; color: #92400E;">
        <strong>📞 お急ぎの場合</strong><br>
        お急ぎの場合は、直接お電話でもお受けいたします：<br>
        <a href="tel:03-1234-5678" style="color: #92400E; font-weight: bold;">03-1234-5678</a>
      </p>
    </div>
    
    <p>コンサルテーションでは以下について詳しくご相談いただけます：</p>
    
    <ul style="color: #4B5563;">
      <li>現状のビジネス課題分析</li>
      <li>AI導入による解決策の提案</li>
      <li>実装ロードマップの策定</li>
      <li>ROI予測と投資計画</li>
      <li>リスク評価と対策</li>
    </ul>
    
    <p>準備万端でお待ちしております。</p>
    
    <p style="margin-top: 30px;">
    AI Media Automation チーム<br>
    <a href="mailto:consultation@aimediaautomation.com" style="color: #4F46E5;">consultation@aimediaautomation.com</a>
    </p>
  </div>
  
  <div style="border-top: 1px solid #e5e7eb; padding: 20px; margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px;">
    <p>予約ID: ${consultationId}</p>
  </div>
</body>
</html>
    `
  }
}