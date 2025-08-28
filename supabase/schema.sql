-- 拡張機能の有効化
create extension if not exists vector;
create extension if not exists pgcrypto;

-- Evidence: 収集結果
create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null unique,
  domain text,
  published_at timestamptz,
  summary text,
  quotes jsonb default '[]'::jsonb,     -- ["引用1", "引用2"]
  stats jsonb default '[]'::jsonb,      -- ["統計1", "統計2"]
  scores jsonb default '{}'::jsonb,     -- {novelty:8.5, credibility:7.0, biz_impact:8.0}
  vector vector(1536),                  -- OpenAI埋め込み
  source_type text default 'news' check (source_type in ('news','paper','social','github','other')),
  status text default 'pending' check (status in ('pending','approved','rejected','needs_edit')),
  tags text[] default '{}',
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Articles: 生成記事
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text,
  outline jsonb,                        -- [{h2:"...", bullets:[...]}]
  content text,                         -- markdown
  evidence_ids uuid[],
  seo jsonb,                           -- {title_tag, meta_desc, faq, ld_json}
  quality jsonb,                       -- {factual, readability, seo, originality, biz, total}
  status text default 'draft' check (status in ('draft','ready','scheduled','published')),
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Preferences: 学習プロファイル（承認傾向）
create table if not exists public.preferences (
  id uuid primary key default gen_random_uuid(),
  owner uuid references auth.users(id) on delete cascade,
  domain_weights jsonb default '{}'::jsonb,   -- {"theverge.com":1.2}
  topic_weights jsonb default '{}'::jsonb,    -- {"LLM":1.3}
  tone_prefs jsonb default '{}'::jsonb,       -- {"formal":0.9}
  updated_at timestamptz default now()
);

-- Feedback: 承認/却下履歴
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  target_type text check (target_type in ('evidence','article')) not null,
  target_id uuid not null,
  action text check (action in ('approve','reject','edit','pin','unpin')) not null,
  reason text,
  created_at timestamptz default now()
);

-- API Logs: 監査ログ
create table if not exists public.api_logs (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null,
  method text not null,
  request_body jsonb,
  response_body jsonb,
  model text,
  temperature numeric,
  max_tokens integer,
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- インデックス
create index if not exists idx_evidence_status_created on public.evidence (status, created_at desc);
create index if not exists idx_evidence_domain on public.evidence (domain);
create index if not exists idx_evidence_published_at on public.evidence (published_at desc);
create index if not exists idx_articles_status_created on public.articles (status, created_at desc);
create index if not exists idx_feedback_target on public.feedback (target_type, target_id);
create index if not exists idx_api_logs_created on public.api_logs (created_at desc);

-- トリガー: updated_at自動更新
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger evidence_updated_at before update on public.evidence
  for each row execute function public.handle_updated_at();

create trigger articles_updated_at before update on public.articles
  for each row execute function public.handle_updated_at();

-- RLS（Row Level Security）
alter table public.evidence enable row level security;
alter table public.articles enable row level security;
alter table public.preferences enable row level security;
alter table public.feedback enable row level security;
alter table public.api_logs enable row level security;

-- Evidence: 認証済みユーザは読み取りOK
create policy evidence_read on public.evidence
  for select using (auth.role() = 'authenticated');

-- Articles: 認証済みユーザは読み取りOK
create policy articles_read on public.articles
  for select using (auth.role() = 'authenticated');

-- Preferences: 自分のプロファイルのみ読み書き可
create policy prefs_owner on public.preferences
  for all using (auth.uid() = owner);

-- Feedback: 認証済みユーザは読み取りOK
create policy feedback_read on public.feedback
  for select using (auth.role() = 'authenticated');

-- API Logs: 管理者のみアクセス可（必要に応じて調整）
create policy logs_admin on public.api_logs
  for select using (auth.role() = 'authenticated');