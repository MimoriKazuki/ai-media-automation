import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export function formatCurrency(amount: number, currency: string = "JPY"): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function extractUtmParams(url: string): Record<string, string> {
  const urlObj = new URL(url)
  const utmParams: Record<string, string> = {}
  
  urlObj.searchParams.forEach((value, key) => {
    if (key.startsWith('utm_')) {
      utmParams[key] = value
    }
  })
  
  return utmParams
}

export function getLeadScore(lead: any): number {
  let score = 0
  
  // Company size factor
  if (lead.company) score += 10
  
  // Position factor
  if (lead.position) {
    const position = lead.position.toLowerCase()
    if (position.includes('cto') || position.includes('ceo')) score += 20
    else if (position.includes('manager') || position.includes('director')) score += 15
    else if (position.includes('dx') || position.includes('digital')) score += 10
  }
  
  // Phone provided
  if (lead.phone) score += 5
  
  // Source quality
  switch (lead.source) {
    case 'consultation':
      score += 25
      break
    case 'resource_download':
      score += 15
      break
    case 'newsletter':
      score += 10
      break
    case 'article':
      score += 5
      break
  }
  
  return Math.min(score, 100)
}