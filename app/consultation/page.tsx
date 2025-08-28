'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

const consultationSchema = z.object({
  // Lead info
  email: z.string().email('有効なメールアドレスを入力してください'),
  name: z.string().min(1, 'お名前を入力してください'),
  company: z.string().min(1, '会社名を入力してください'),
  company_size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']),
  position: z.string().min(1, '役職を入力してください'),
  phone: z.string().min(1, '電話番号を入力してください'),
  
  // Consultation details
  consultation_type: z.enum(['ai_strategy', 'implementation', 'training']),
  preferred_date: z.string().min(1, '希望日を選択してください'),
  preferred_time: z.string().min(1, '希望時間を選択してください'),
  timezone: z.string().default('Asia/Tokyo'),
  
  // Business info
  current_challenges: z.string().min(10, '現在の課題を10文字以上で記入してください'),
  ai_experience_level: z.enum(['beginner', 'intermediate', 'advanced']),
  budget_range: z.enum(['under_10m', '10m-50m', '50m-100m', 'over_100m']),
  timeline: z.enum(['immediate', '1-3months', '3-6months', '6months+']),
  
  privacy_accepted: z.boolean().refine(val => val === true, {
    message: 'プライバシーポリシーへの同意が必要です'
  }),
});

type ConsultationInput = z.infer<typeof consultationSchema>;

export default function ConsultationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConsultationInput>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      timezone: 'Asia/Tokyo',
    },
  });

  const onSubmit = async (data: ConsultationInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/consultations/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setIsSuccess(true);
      }
    } catch (error) {
      alert('エラーが発生しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            相談予約が完了しました！
          </h1>
          <p className="text-gray-600 mb-6">
            ご登録のメールアドレスに詳細をお送りしました。
            24時間以内に担当者からご連絡させていただきます。
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            AI Media Automation
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            AI導入無料相談
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            貴社のビジネスに最適なAI活用方法を専門家が無料でご提案します
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            無料相談で得られること
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">課題の明確化</h3>
              <p className="text-gray-600">
                貴社の現状を分析し、AI導入で解決できる課題を特定します
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-xl font-semibold mb-2">具体的な提案</h3>
              <p className="text-gray-600">
                業界事例を基に、実現可能なAI活用プランをご提案します
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">ROI試算</h3>
              <p className="text-gray-600">
                導入コストと期待効果を試算し、投資判断をサポートします
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white rounded-lg shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold mb-6">相談予約フォーム</h2>

            {/* Contact Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">お客様情報</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    お名前 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('name')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    会社名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('company')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.company && (
                    <p className="text-red-500 text-sm mt-1">{errors.company.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    役職 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('position')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.position && (
                    <p className="text-red-500 text-sm mt-1">{errors.position.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    電話番号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    会社規模 <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('company_size')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    <option value="1-10">1-10人</option>
                    <option value="11-50">11-50人</option>
                    <option value="51-200">51-200人</option>
                    <option value="201-500">201-500人</option>
                    <option value="500+">500人以上</option>
                  </select>
                  {errors.company_size && (
                    <p className="text-red-500 text-sm mt-1">{errors.company_size.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Consultation Details */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">相談内容</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  相談タイプ <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('consultation_type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  <option value="ai_strategy">AI戦略策定</option>
                  <option value="implementation">AI実装支援</option>
                  <option value="training">AI研修・教育</option>
                </select>
                {errors.consultation_type && (
                  <p className="text-red-500 text-sm mt-1">{errors.consultation_type.message}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    希望日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('preferred_date')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.preferred_date && (
                    <p className="text-red-500 text-sm mt-1">{errors.preferred_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    希望時間 <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('preferred_time')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                    <option value="13:00">13:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                    <option value="17:00">17:00</option>
                  </select>
                  {errors.preferred_time && (
                    <p className="text-red-500 text-sm mt-1">{errors.preferred_time.message}</p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  現在の課題 <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('current_challenges')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="AI導入で解決したい課題をお聞かせください"
                />
                {errors.current_challenges && (
                  <p className="text-red-500 text-sm mt-1">{errors.current_challenges.message}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AI経験レベル <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('ai_experience_level')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    <option value="beginner">初心者</option>
                    <option value="intermediate">中級者</option>
                    <option value="advanced">上級者</option>
                  </select>
                  {errors.ai_experience_level && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.ai_experience_level.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    予算規模 <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('budget_range')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    <option value="under_10m">1,000万円未満</option>
                    <option value="10m-50m">1,000-5,000万円</option>
                    <option value="50m-100m">5,000万-1億円</option>
                    <option value="over_100m">1億円以上</option>
                  </select>
                  {errors.budget_range && (
                    <p className="text-red-500 text-sm mt-1">{errors.budget_range.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    導入時期 <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('timeline')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    <option value="immediate">すぐに</option>
                    <option value="1-3months">1-3ヶ月以内</option>
                    <option value="3-6months">3-6ヶ月以内</option>
                    <option value="6months+">6ヶ月以降</option>
                  </select>
                  {errors.timeline && (
                    <p className="text-red-500 text-sm mt-1">{errors.timeline.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Privacy Agreement */}
            <div className="mb-6">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  {...register('privacy_accepted')}
                  className="mt-1 mr-2"
                />
                <span className="text-sm text-gray-600">
                  <a href="/privacy" className="text-blue-600 hover:underline">
                    プライバシーポリシー
                  </a>
                  に同意します <span className="text-red-500">*</span>
                </span>
              </label>
              {errors.privacy_accepted && (
                <p className="text-red-500 text-sm mt-1">{errors.privacy_accepted.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              {isSubmitting ? '送信中...' : '無料相談を予約する'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}