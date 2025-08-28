'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadSchema, type LeadInput } from '@/lib/leads';

interface LeadCaptureFormProps {
  source: 'article' | 'resource' | 'newsletter' | 'consultation';
  sourceDetail?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  onSuccess?: () => void;
}

export default function LeadCaptureForm({
  source,
  sourceDetail,
  title = 'AIの最新情報をお届けします',
  description = '実践的なAI導入ガイドと成功事例をメールでお送りします。',
  buttonText = '無料で受け取る',
  onSuccess,
}: LeadCaptureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      source,
      source_detail: sourceDetail,
      marketing_consent: false,
      privacy_accepted: false,
    },
  });

  const onSubmit = async (data: LeadInput) => {
    setIsSubmitting(true);
    try {
      // Get UTM parameters from URL
      const params = new URLSearchParams(window.location.search);
      const utmData = {
        utm_source: params.get('utm_source') || undefined,
        utm_medium: params.get('utm_medium') || undefined,
        utm_campaign: params.get('utm_campaign') || undefined,
        utm_content: params.get('utm_content') || undefined,
        utm_term: params.get('utm_term') || undefined,
      };

      const response = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, ...utmData }),
      });

      if (response.ok) {
        setIsSuccess(true);
        if (onSuccess) onSuccess();
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('エラーが発生しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-3xl mb-2">✅</div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          登録ありがとうございます！
        </h3>
        <p className="text-green-700">
          メールをご確認ください。貴重な情報をお送りしました。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-gray-200">
      <h3 className="text-xl font-bold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              お名前
            </label>
            <input
              type="text"
              {...register('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="山田 太郎"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              会社名
            </label>
            <input
              type="text"
              {...register('company')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="株式会社○○"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              役職
            </label>
            <input
              type="text"
              {...register('position')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="マネージャー"
            />
          </div>
        </div>

        {source === 'consultation' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                会社規模
              </label>
              <select
                {...register('company_size')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">選択してください</option>
                <option value="1-10">1-10人</option>
                <option value="11-50">11-50人</option>
                <option value="51-200">51-200人</option>
                <option value="201-500">201-500人</option>
                <option value="500+">500人以上</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                電話番号
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="03-1234-5678"
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <label className="flex items-start">
            <input
              type="checkbox"
              {...register('marketing_consent')}
              className="mt-1 mr-2"
            />
            <span className="text-sm text-gray-600">
              マーケティング情報の受信に同意します（任意）
            </span>
          </label>

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
            <p className="text-red-500 text-sm">{errors.privacy_accepted.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '送信中...' : buttonText}
        </button>

        <p className="text-xs text-gray-500 text-center">
          ※ いつでも配信解除可能です。スパムメールは送信しません。
        </p>
      </form>
    </div>
  );
}