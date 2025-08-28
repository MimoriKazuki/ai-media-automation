'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, CheckCircle2, Calendar } from 'lucide-react'

const consultationSchema = z.object({
  name: z.string().min(2, '名前は2文字以上で入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  company: z.string().min(2, '会社名は2文字以上で入力してください'),
  position: z.string().optional(),
  phone: z.string().optional(),
  consultation_type: z.enum(['initial', 'technical', 'strategy', 'implementation']),
  business_challenge: z.string().min(10, 'ビジネス課題を10文字以上で入力してください'),
  current_ai_usage: z.string().optional(),
  budget_range: z.string().optional(),
  decision_timeline: z.string().optional(),
  preferred_date: z.string().optional(),
  timezone: z.string().default('Asia/Tokyo'),
})

type ConsultationForm = z.infer<typeof consultationSchema>

export default function ConsultationBookingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ConsultationForm>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      position: '',
      phone: '',
      consultation_type: 'initial',
      business_challenge: '',
      current_ai_usage: '',
      budget_range: '',
      decision_timeline: '',
      preferred_date: '',
      timezone: 'Asia/Tokyo',
    }
  })

  const onSubmit = async (data: ConsultationForm) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Get UTM parameters from URL
      const urlParams = new URLSearchParams(window.location.search)
      const utmParams = {
        utm_source: urlParams.get('utm_source') || '',
        utm_medium: urlParams.get('utm_medium') || '',
        utm_campaign: urlParams.get('utm_campaign') || '',
      }

      const response = await fetch('/api/consultations/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          referrer: document.referrer,
          page_url: window.location.href,
          ...utmParams,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to book consultation')
      }

      setIsSuccess(true)

      // Track conversion event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'consultation_booked', {
          event_category: 'conversion',
          event_label: data.consultation_type,
          value: 200,
        })
      }

    } catch (err) {
      console.error('Consultation booking error:', err)
      setError('コンサルテーションの予約に失敗しました。もう一度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center space-y-6">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h3 className="text-2xl font-bold text-gray-900">
          予約を承りました！
        </h3>
        <p className="text-gray-600">
          コンサルテーションのお申し込みありがとうございます。
          <br />
          24時間以内に担当者よりご連絡し、具体的な日程を調整させていただきます。
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>次のステップ:</strong>
            <br />
            1. 担当者からのメール・電話連絡をお待ちください
            <br />
            2. 日程調整と事前準備事項のご案内
            <br />
            3. コンサルテーション実施（60分）
            <br />
            4. 実装ロードマップのご提案
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">基本情報</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">お名前 *</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="山田太郎"
              className={form.formState.errors.name ? 'border-red-500' : ''}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="email">メールアドレス *</Label>
            <Input
              id="email"
              type="email"
              {...form.register('email')}
              placeholder="yamada@company.com"
              className={form.formState.errors.email ? 'border-red-500' : ''}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company">会社名 *</Label>
            <Input
              id="company"
              {...form.register('company')}
              placeholder="株式会社サンプル"
              className={form.formState.errors.company ? 'border-red-500' : ''}
            />
            {form.formState.errors.company && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.company.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="position">役職</Label>
            <Input
              id="position"
              {...form.register('position')}
              placeholder="CTO、DX推進責任者など"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="phone">電話番号</Label>
          <Input
            id="phone"
            {...form.register('phone')}
            placeholder="03-1234-5678"
          />
        </div>
      </div>

      {/* Consultation Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">コンサルテーション詳細</h3>
        
        <div>
          <Label htmlFor="consultation_type">コンサルテーション種別</Label>
          <select
            id="consultation_type"
            {...form.register('consultation_type')}
            className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="initial">初回相談（AI導入の検討段階）</option>
            <option value="strategy">戦略相談（実装計画の策定）</option>
            <option value="technical">技術相談（技術的課題の解決）</option>
            <option value="implementation">実装支援（具体的な導入支援）</option>
          </select>
        </div>

        <div>
          <Label htmlFor="business_challenge">解決したいビジネス課題 *</Label>
          <Textarea
            id="business_challenge"
            {...form.register('business_challenge')}
            placeholder="例：顧客サポートの効率化、品質検査の自動化、需要予測の精度向上など、AIで解決したいと考えている具体的な課題をお聞かせください"
            rows={4}
            className={form.formState.errors.business_challenge ? 'border-red-500' : ''}
          />
          {form.formState.errors.business_challenge && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.business_challenge.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="current_ai_usage">現在のAI利用状況</Label>
          <Textarea
            id="current_ai_usage"
            {...form.register('current_ai_usage')}
            placeholder="すでに導入しているAIツールやシステムがあればお聞かせください（ChatGPT、RPA、BIツールなど）"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="budget_range">想定予算</Label>
            <select
              id="budget_range"
              {...form.register('budget_range')}
              className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="">選択してください</option>
              <option value="under_1M">100万円未満</option>
              <option value="1M_5M">100万円〜500万円</option>
              <option value="5M_10M">500万円〜1,000万円</option>
              <option value="10M_50M">1,000万円〜5,000万円</option>
              <option value="over_50M">5,000万円以上</option>
              <option value="undecided">未定</option>
            </select>
          </div>

          <div>
            <Label htmlFor="decision_timeline">導入時期</Label>
            <select
              id="decision_timeline"
              {...form.register('decision_timeline')}
              className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="">選択してください</option>
              <option value="immediate">すぐに開始したい</option>
              <option value="3_months">3ヶ月以内</option>
              <option value="6_months">6ヶ月以内</option>
              <option value="12_months">1年以内</option>
              <option value="planning">計画段階</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="preferred_date">希望日時</Label>
          <Input
            id="preferred_date"
            {...form.register('preferred_date')}
            placeholder="例：来週月曜日の午後、12月第2週など"
          />
          <p className="text-xs text-gray-500 mt-1">
            具体的な日程は後日調整いたします。ご希望があれば入力してください。
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            送信中...
          </>
        ) : (
          <>
            <Calendar className="mr-2 h-4 w-4" />
            コンサルテーションを予約する
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        ご入力いただいた情報は、コンサルテーション実施のためのみに使用し、
        <a href="/privacy" className="underline hover:no-underline">
          プライバシーポリシー
        </a>
        に従って適切に管理いたします。
      </p>
    </form>
  )
}