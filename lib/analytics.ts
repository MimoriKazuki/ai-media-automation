// Google Analytics and conversion tracking utilities
export interface AnalyticsEvent {
  action: string
  category: string
  label?: string
  value?: number
  custom_parameters?: Record<string, any>
}

export interface ConversionEvent extends AnalyticsEvent {
  conversion_id?: string
  conversion_value?: number
  currency?: string
}

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'consent',
      targetId: string | Date | 'default',
      config?: Record<string, any>
    ) => void
    dataLayer: any[]
  }
}

export class Analytics {
  private gaId: string
  private isProduction: boolean

  constructor(gaId: string, isProduction = true) {
    this.gaId = gaId
    this.isProduction = isProduction
  }

  // Initialize Google Analytics
  init() {
    if (typeof window === 'undefined' || !this.gaId) return

    // Create dataLayer if it doesn't exist
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag() {
      window.dataLayer.push(arguments)
    }

    // Load GA script
    const script = document.createElement('script')
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaId}`
    script.async = true
    document.head.appendChild(script)

    // Initialize GA
    window.gtag('js', new Date())
    window.gtag('config', this.gaId, {
      page_title: document.title,
      page_location: window.location.href,
    })

    this.setupEnhancedEcommerce()
  }

  // Track page views
  pageView(url: string, title?: string) {
    if (typeof window === 'undefined' || !window.gtag) return

    window.gtag('config', this.gaId, {
      page_path: url,
      page_title: title,
    })
  }

  // Track custom events
  trackEvent(event: AnalyticsEvent) {
    if (typeof window === 'undefined' || !window.gtag) {
      if (!this.isProduction) {
        console.log('Analytics Event:', event)
      }
      return
    }

    window.gtag('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      ...event.custom_parameters,
    })
  }

  // Track lead generation events
  trackLeadGeneration(leadData: {
    source: string
    email: string
    company?: string
    lead_value?: number
  }) {
    this.trackEvent({
      action: 'generate_lead',
      category: 'conversion',
      label: leadData.source,
      value: leadData.lead_value || 50,
      custom_parameters: {
        lead_source: leadData.source,
        company: leadData.company,
        currency: 'JPY',
      },
    })

    // Enhanced ecommerce tracking
    if (window.gtag) {
      window.gtag('event', 'generate_lead', {
        currency: 'JPY',
        value: leadData.lead_value || 50,
        lead_source: leadData.source,
      })
    }
  }

  // Track consultation bookings
  trackConsultationBooking(consultationData: {
    consultation_type: string
    budget_range?: string
    lead_value?: number
  }) {
    this.trackEvent({
      action: 'consultation_booked',
      category: 'conversion',
      label: consultationData.consultation_type,
      value: consultationData.lead_value || 200,
      custom_parameters: {
        consultation_type: consultationData.consultation_type,
        budget_range: consultationData.budget_range,
        currency: 'JPY',
      },
    })

    // Enhanced ecommerce tracking
    if (window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: `consultation_${Date.now()}`,
        value: consultationData.lead_value || 200,
        currency: 'JPY',
        items: [
          {
            item_id: 'consultation',
            item_name: 'AI Implementation Consultation',
            category: 'service',
            quantity: 1,
            price: consultationData.lead_value || 200,
          },
        ],
      })
    }
  }

  // Track resource downloads
  trackResourceDownload(resourceData: {
    resource_id: string
    resource_name: string
    resource_type: string
    lead_value?: number
  }) {
    this.trackEvent({
      action: 'download',
      category: 'engagement',
      label: resourceData.resource_name,
      value: resourceData.lead_value || 25,
      custom_parameters: {
        resource_id: resourceData.resource_id,
        resource_type: resourceData.resource_type,
      },
    })

    // File download event
    if (window.gtag) {
      window.gtag('event', 'file_download', {
        file_name: resourceData.resource_name,
        link_url: window.location.href,
      })
    }
  }

  // Track newsletter signups
  trackNewsletterSignup(signupData: {
    source: string
    email: string
  }) {
    this.trackEvent({
      action: 'newsletter_signup',
      category: 'engagement',
      label: signupData.source,
      value: 30,
      custom_parameters: {
        signup_source: signupData.source,
      },
    })
  }

  // Track form submissions
  trackFormSubmission(formData: {
    form_name: string
    form_location: string
    success: boolean
  }) {
    this.trackEvent({
      action: formData.success ? 'form_submit_success' : 'form_submit_error',
      category: 'form',
      label: formData.form_name,
      value: formData.success ? 1 : 0,
      custom_parameters: {
        form_location: formData.form_location,
      },
    })
  }

  // Track article engagement
  trackArticleEngagement(articleData: {
    article_id: string
    article_title: string
    engagement_type: 'view' | 'read' | 'share' | 'cta_click'
    engagement_value?: number
  }) {
    this.trackEvent({
      action: `article_${articleData.engagement_type}`,
      category: 'content',
      label: articleData.article_title,
      value: articleData.engagement_value || 1,
      custom_parameters: {
        article_id: articleData.article_id,
        engagement_type: articleData.engagement_type,
      },
    })
  }

  // Track revenue events
  trackRevenue(revenueData: {
    transaction_id: string
    revenue_amount: number
    revenue_type: string
    currency?: string
  }) {
    if (window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: revenueData.transaction_id,
        value: revenueData.revenue_amount,
        currency: revenueData.currency || 'JPY',
        items: [
          {
            item_id: revenueData.revenue_type,
            item_name: this.getRevenueTypeName(revenueData.revenue_type),
            category: 'service',
            quantity: 1,
            price: revenueData.revenue_amount,
          },
        ],
      })
    }

    this.trackEvent({
      action: 'revenue_generated',
      category: 'conversion',
      label: revenueData.revenue_type,
      value: revenueData.revenue_amount,
      custom_parameters: {
        transaction_id: revenueData.transaction_id,
        revenue_type: revenueData.revenue_type,
        currency: revenueData.currency || 'JPY',
      },
    })
  }

  // Track user journey milestones
  trackUserJourney(journeyData: {
    milestone: 'awareness' | 'interest' | 'consideration' | 'conversion' | 'retention'
    touchpoint: string
    user_id?: string
  }) {
    this.trackEvent({
      action: 'user_journey',
      category: 'funnel',
      label: journeyData.milestone,
      value: this.getMilestoneValue(journeyData.milestone),
      custom_parameters: {
        journey_milestone: journeyData.milestone,
        touchpoint: journeyData.touchpoint,
        user_id: journeyData.user_id,
      },
    })
  }

  // Set user properties
  setUserProperty(property: string, value: string | number) {
    if (typeof window === 'undefined' || !window.gtag) return

    window.gtag('config', this.gaId, {
      user_properties: {
        [property]: value,
      },
    })
  }

  // Enhanced ecommerce setup
  private setupEnhancedEcommerce() {
    if (typeof window === 'undefined' || !window.gtag) return

    window.gtag('config', this.gaId, {
      enhanced_ecommerce: true,
      send_page_view: false, // We'll send manually
    })
  }

  private getRevenueTypeName(type: string): string {
    const typeNames: Record<string, string> = {
      consultation: 'AI Implementation Consultation',
      implementation: 'AI Implementation Service',
      training: 'AI Training Program',
      report: 'AI Implementation Report',
    }
    return typeNames[type] || type
  }

  private getMilestoneValue(milestone: string): number {
    const milestoneValues: Record<string, number> = {
      awareness: 10,
      interest: 25,
      consideration: 50,
      conversion: 100,
      retention: 150,
    }
    return milestoneValues[milestone] || 1
  }
}

// Conversion funnel tracking
export class ConversionFunnel {
  private analytics: Analytics

  constructor(analytics: Analytics) {
    this.analytics = analytics
  }

  // Track funnel step
  trackFunnelStep(stepData: {
    funnel_name: string
    step_number: number
    step_name: string
    user_id?: string
    additional_data?: Record<string, any>
  }) {
    this.analytics.trackEvent({
      action: 'funnel_step',
      category: 'conversion_funnel',
      label: `${stepData.funnel_name}_step_${stepData.step_number}`,
      value: stepData.step_number,
      custom_parameters: {
        funnel_name: stepData.funnel_name,
        step_number: stepData.step_number,
        step_name: stepData.step_name,
        user_id: stepData.user_id,
        ...stepData.additional_data,
      },
    })
  }

  // Predefined funnels
  trackLeadGenerationFunnel(step: 'landing' | 'form_view' | 'form_start' | 'form_complete' | 'download', data?: any) {
    const stepNumbers = {
      landing: 1,
      form_view: 2,
      form_start: 3,
      form_complete: 4,
      download: 5,
    }

    this.trackFunnelStep({
      funnel_name: 'lead_generation',
      step_number: stepNumbers[step],
      step_name: step,
      additional_data: data,
    })
  }

  trackConsultationFunnel(step: 'interest' | 'form_view' | 'form_complete' | 'scheduled' | 'completed', data?: any) {
    const stepNumbers = {
      interest: 1,
      form_view: 2,
      form_complete: 3,
      scheduled: 4,
      completed: 5,
    }

    this.trackFunnelStep({
      funnel_name: 'consultation',
      step_number: stepNumbers[step],
      step_name: step,
      additional_data: data,
    })
  }
}

// Attribution tracking
export class AttributionTracker {
  private analytics: Analytics

  constructor(analytics: Analytics) {
    this.analytics = analytics
  }

  // Track attribution touchpoint
  trackTouchpoint(touchpointData: {
    channel: string
    campaign?: string
    source?: string
    medium?: string
    content?: string
    user_id?: string
  }) {
    this.analytics.trackEvent({
      action: 'attribution_touchpoint',
      category: 'attribution',
      label: touchpointData.channel,
      value: 1,
      custom_parameters: {
        channel: touchpointData.channel,
        campaign: touchpointData.campaign,
        source: touchpointData.source,
        medium: touchpointData.medium,
        content: touchpointData.content,
        user_id: touchpointData.user_id,
        timestamp: Date.now(),
      },
    })
  }

  // Get UTM parameters from URL
  getUtmParameters(): Record<string, string> {
    if (typeof window === 'undefined') return {}

    const urlParams = new URLSearchParams(window.location.search)
    return {
      utm_source: urlParams.get('utm_source') || '',
      utm_medium: urlParams.get('utm_medium') || '',
      utm_campaign: urlParams.get('utm_campaign') || '',
      utm_term: urlParams.get('utm_term') || '',
      utm_content: urlParams.get('utm_content') || '',
    }
  }

  // Store attribution data in session storage
  storeAttribution() {
    if (typeof window === 'undefined') return

    const utmParams = this.getUtmParameters()
    const attributionData = {
      ...utmParams,
      referrer: document.referrer,
      landing_page: window.location.href,
      timestamp: Date.now(),
    }

    sessionStorage.setItem('attribution_data', JSON.stringify(attributionData))
  }

  // Get stored attribution data
  getStoredAttribution(): Record<string, any> | null {
    if (typeof window === 'undefined') return null

    const stored = sessionStorage.getItem('attribution_data')
    return stored ? JSON.parse(stored) : null
  }
}

// Initialize analytics
export function initializeAnalytics(gaId: string) {
  const analytics = new Analytics(gaId, process.env.NODE_ENV === 'production')
  const funnel = new ConversionFunnel(analytics)
  const attribution = new AttributionTracker(analytics)

  // Initialize GA
  analytics.init()

  // Store attribution data
  attribution.storeAttribution()

  return { analytics, funnel, attribution }
}