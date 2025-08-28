export interface Lead {
  id: string
  email: string
  name?: string
  company?: string
  position?: string
  phone?: string
  source: 'article' | 'resource_download' | 'newsletter' | 'consultation'
  status: 'new' | 'qualified' | 'nurturing' | 'converted' | 'lost'
  lead_score: number
  tags: string[]
  notes?: string
  
  // Tracking
  first_touch_source?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  referrer?: string
  
  // CRM Integration
  crm_contact_id?: string
  crm_synced_at?: string
  
  // Lifecycle
  qualified_at?: string
  converted_at?: string
  last_activity_at: string
  created_at: string
  updated_at: string
}

export interface LeadMagnet {
  id: string
  title: string
  slug: string
  description?: string
  type: 'report' | 'whitepaper' | 'checklist' | 'template' | 'webinar'
  
  // Content
  content_url?: string
  preview_content?: string
  file_type?: 'pdf' | 'docx' | 'video' | 'audio'
  file_size_mb?: number
  
  // Landing page
  landing_page_content?: string
  cta_text: string
  
  // SEO
  meta_title?: string
  meta_description?: string
  keywords: string[]
  
  // Tracking
  download_count: number
  conversion_rate: number
  is_active: boolean
  
  created_at: string
  updated_at: string
}

export interface Consultation {
  id: string
  lead_id?: string
  
  // Booking Info
  name: string
  email: string
  company?: string
  phone?: string
  consultation_type?: 'initial' | 'technical' | 'strategy' | 'implementation'
  
  // Scheduling
  requested_date?: string
  scheduled_date?: string
  duration_minutes: number
  timezone?: string
  
  // Meeting Details
  meeting_link?: string
  calendar_event_id?: string
  
  // Preparation
  business_challenge?: string
  current_ai_usage?: string
  budget_range?: string
  decision_timeline?: string
  
  // Status and Outcome
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  outcome?: 'qualified' | 'proposal_sent' | 'converted' | 'not_interested'
  follow_up_notes?: string
  next_steps?: string
  
  // CRM Integration
  crm_opportunity_id?: string
  
  created_at: string
  updated_at: string
}

export interface EmailCampaign {
  id: string
  name: string
  type: 'newsletter' | 'nurture' | 'onboarding' | 'promotion'
  
  // Content
  subject_line: string
  template_name?: string
  content_html?: string
  content_text?: string
  
  // Targeting
  segment_criteria?: any
  target_audience: 'all_leads' | 'newsletter_subscribers' | 'consultation_leads'
  
  // Scheduling
  send_date?: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
  
  // Metrics
  recipients_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  unsubscribed_count: number
  bounced_count: number
  
  // Provider Integration
  email_provider?: 'sendgrid' | 'resend' | 'mailchimp'
  provider_campaign_id?: string
  
  created_at: string
  updated_at: string
}

export interface ConversionEvent {
  id: string
  lead_id: string
  
  // Event Details
  event_type: 'page_view' | 'resource_download' | 'email_signup' | 'consultation_request' | 'purchase'
  event_value?: number
  
  // Page/Content Context
  page_url?: string
  page_title?: string
  referrer?: string
  
  // Attribution
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  
  // Technical
  session_id?: string
  ip_address?: string
  user_agent?: string
  
  // Metadata
  metadata?: any
  
  created_at: string
}

export interface NewsletterSubscription {
  id: string
  lead_id: string
  
  // Subscription Details
  email: string
  status: 'subscribed' | 'unsubscribed' | 'bounced'
  subscription_type: 'weekly' | 'bi-weekly' | 'monthly'
  
  // Preferences
  topics: string[]
  format: 'html' | 'text'
  
  // Tracking
  confirmed_at?: string
  unsubscribed_at?: string
  last_email_sent_at?: string
  
  // Provider Integration
  provider_list_id?: string
  provider_contact_id?: string
  
  created_at: string
  updated_at: string
}

export interface Article {
  id: string
  trend_id?: string
  title: string
  slug: string
  content: string
  markdown_content?: string
  meta_description?: string
  keywords: string[]
  
  // Quality Evaluation
  quality_score?: number
  seo_score?: number
  readability_score?: number
  originality_score?: number
  accuracy_score?: number
  engagement_score?: number
  evaluation_details?: any
  
  // Status
  status: 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected'
  reviewed_by?: string
  review_notes?: string
  
  // Performance Metrics
  view_count: number
  avg_time_on_page?: number
  bounce_rate?: number
  social_shares?: any
  
  published_at?: string
  created_at: string
  updated_at: string
}

export interface RevenueTracking {
  id: string
  lead_id?: string
  consultation_id?: string
  
  // Revenue Details
  revenue_type: 'consultation' | 'implementation' | 'training' | 'report'
  amount: number
  currency: string
  
  // Payment Details
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed'
  payment_method?: string
  transaction_id?: string
  
  // Subscription Info
  is_recurring: boolean
  billing_cycle?: 'monthly' | 'yearly'
  
  // Provider Integration
  payment_provider?: 'stripe' | 'paypal'
  provider_customer_id?: string
  
  created_at: string
  updated_at: string
}