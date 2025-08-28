-- Business Model Database Schema Extensions

-- Leads Table (リード管理)
CREATE TABLE leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    company VARCHAR(200),
    company_size VARCHAR(50), -- '1-10', '11-50', '51-200', '201-500', '500+'
    position VARCHAR(100),
    phone VARCHAR(20),
    source VARCHAR(50), -- 'article', 'resource', 'newsletter', 'consultation'
    source_detail TEXT, -- specific article/resource ID
    status VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'opportunity', 'customer'
    lead_score INTEGER DEFAULT 0,
    
    -- Marketing Attribution
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_content VARCHAR(100),
    utm_term VARCHAR(100),
    
    -- Consent
    marketing_consent BOOLEAN DEFAULT FALSE,
    privacy_accepted BOOLEAN DEFAULT FALSE,
    
    -- CRM Integration
    crm_id VARCHAR(100), -- HubSpot/Salesforce ID
    crm_synced_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Lead Magnets Table (無料レポート・資料)
CREATE TABLE lead_magnets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(300) UNIQUE NOT NULL,
    description TEXT,
    content_type VARCHAR(50), -- 'report', 'whitepaper', 'checklist', 'template', 'guide'
    file_url TEXT,
    thumbnail_url TEXT,
    
    -- Content Details
    page_count INTEGER,
    reading_time INTEGER, -- minutes
    topics TEXT[],
    target_audience TEXT[],
    
    -- Performance
    download_count INTEGER DEFAULT 0,
    conversion_rate FLOAT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_lead_magnets_slug ON lead_magnets(slug);
CREATE INDEX idx_lead_magnets_active ON lead_magnets(is_active);

-- Lead Magnet Downloads Table
CREATE TABLE lead_magnet_downloads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID REFERENCES leads(id),
    lead_magnet_id UUID REFERENCES lead_magnets(id),
    download_token VARCHAR(100) UNIQUE,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    email_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_downloads_lead ON lead_magnet_downloads(lead_id);
CREATE INDEX idx_downloads_magnet ON lead_magnet_downloads(lead_magnet_id);

-- Consultations Table (コンサル予約)
CREATE TABLE consultations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID REFERENCES leads(id),
    
    -- Consultation Details
    consultation_type VARCHAR(100), -- 'ai_strategy', 'implementation', 'training'
    preferred_date DATE,
    preferred_time VARCHAR(20),
    timezone VARCHAR(50),
    duration INTEGER DEFAULT 30, -- minutes
    
    -- Business Information
    current_challenges TEXT,
    ai_experience_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
    budget_range VARCHAR(50), -- 'under_10m', '10m-50m', '50m-100m', 'over_100m'
    timeline VARCHAR(50), -- 'immediate', '1-3months', '3-6months', '6months+'
    
    -- Status
    status VARCHAR(50) DEFAULT 'requested', -- 'requested', 'scheduled', 'completed', 'cancelled'
    meeting_url TEXT,
    meeting_notes TEXT,
    
    -- CRM Integration
    crm_opportunity_id VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_consultations_lead ON consultations(lead_id);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_consultations_date ON consultations(preferred_date);

-- Email Campaigns Table
CREATE TABLE email_campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50), -- 'newsletter', 'nurture', 'promotion', 'transactional'
    subject VARCHAR(500),
    content TEXT,
    
    -- Targeting
    target_segment VARCHAR(100), -- 'all', 'executives', 'engineers', 'new_leads'
    target_count INTEGER,
    
    -- Performance
    sent_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,
    
    -- Schedule
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Subscribers Table
CREATE TABLE newsletter_subscribers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    lead_id UUID REFERENCES leads(id),
    
    -- Preferences
    frequency VARCHAR(50) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
    topics TEXT[],
    language VARCHAR(10) DEFAULT 'ja',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    unsubscribe_reason TEXT,
    
    -- Engagement
    last_opened_at TIMESTAMP WITH TIME ZONE,
    total_opens INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_active ON newsletter_subscribers(is_active);

-- Conversion Tracking Table
CREATE TABLE conversion_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID REFERENCES leads(id),
    
    -- Conversion Details
    conversion_type VARCHAR(50), -- 'download', 'newsletter', 'consultation', 'customer'
    conversion_value DECIMAL(10, 2),
    
    -- Attribution
    first_touch_source VARCHAR(100),
    first_touch_medium VARCHAR(100),
    first_touch_campaign VARCHAR(100),
    last_touch_source VARCHAR(100),
    last_touch_medium VARCHAR(100),
    last_touch_campaign VARCHAR(100),
    
    -- Journey
    touchpoint_count INTEGER,
    days_to_conversion INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversion_lead ON conversion_tracking(lead_id);
CREATE INDEX idx_conversion_type ON conversion_tracking(conversion_type);
CREATE INDEX idx_conversion_created ON conversion_tracking(created_at DESC);

-- Revenue Tracking Table
CREATE TABLE revenue_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID REFERENCES leads(id),
    
    -- Revenue Details
    revenue_type VARCHAR(50), -- 'consulting', 'implementation', 'training', 'report'
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'JPY',
    
    -- Project Details
    project_name VARCHAR(200),
    project_duration_months INTEGER,
    
    -- Status
    status VARCHAR(50) DEFAULT 'prospect', -- 'prospect', 'negotiation', 'closed_won', 'closed_lost'
    closed_date DATE,
    
    -- Attribution
    attributed_to_article UUID REFERENCES articles(id),
    attributed_to_campaign VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_revenue_lead ON revenue_tracking(lead_id);
CREATE INDEX idx_revenue_status ON revenue_tracking(status);
CREATE INDEX idx_revenue_type ON revenue_tracking(revenue_type);

-- Insert Sample Lead Magnets
INSERT INTO lead_magnets (title, slug, description, content_type, topics, target_audience, is_featured) VALUES
('AI導入ロードマップ 2024年完全版', 'ai-implementation-roadmap-2024', 
 '中堅企業向けのAI導入を成功させるための包括的なガイド。実践的なステップと事例を紹介。', 
 'guide', 
 ARRAY['AI戦略', '導入計画', 'ROI分析'],
 ARRAY['経営層', 'DX担当者'],
 TRUE),

('DXマネージャーのためのAIチェックリスト', 'dx-manager-ai-checklist',
 'AI導入前に確認すべき50項目のチェックリスト。リスク回避と成功のポイントを網羅。',
 'checklist',
 ARRAY['チェックリスト', 'リスク管理', '準備事項'],
 ARRAY['DXマネージャー', 'プロジェクトマネージャー'],
 TRUE),

('AIツール比較表 2024年版', 'ai-tools-comparison-2024',
 '主要なAIツールとサービスを徹底比較。貴社に最適なソリューション選定をサポート。',
 'report',
 ARRAY['ツール比較', 'ベンダー分析', 'コスト分析'],
 ARRAY['CTO', 'エンジニア', 'IT部門'],
 FALSE);

-- Insert Email Templates
INSERT INTO prompt_templates (name, type, template, is_active) VALUES
('welcome_email', 'email', 'Welcome to our AI insights community! Here''s your first exclusive resource...', TRUE),
('nurture_sequence_1', 'email', 'How leading companies are using AI to transform their business...', TRUE),
('consultation_followup', 'email', 'Thank you for booking a consultation. Here''s how to prepare...', TRUE);