-- AA Agent Database Schema (Fixed Order)
-- 外部キー制約のエラーを防ぐため、テーブル作成順序を調整

-- 1. 拡張機能
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- 2. まずarticlesテーブルを作成（他のテーブルから参照されるため）
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  outline jsonb default '[]'::jsonb,
  content text,
  evidence_ids uuid[] default '{}',
  seo jsonb default '{}'::jsonb,
  quality jsonb default '{}'::jsonb,
  status text default 'draft' check (status in ('draft', 'ready', 'published', 'archived')),
  published_at timestamptz,
  views integer default 0,
  likes integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. evidenceテーブル
create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null unique,
  domain text,
  published_at timestamptz,
  summary text,
  quotes jsonb default '[]'::jsonb,
  stats jsonb default '[]'::jsonb,
  scores jsonb default '{}'::jsonb,
  vector vector(1536),
  source_type text default 'news' check (source_type in ('news', 'paper', 'blog', 'report', 'social')),
  status text default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  tags text[] default '{}',
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. preferencesテーブル
create table if not exists public.preferences (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  key text not null,
  value jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(category, key)
);

-- 5. feedbackテーブル
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid references public.evidence(id) on delete cascade,
  article_id uuid references public.articles(id) on delete cascade,
  action text not null check (action in ('approve', 'reject', 'edit', 'publish')),
  reason text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 6. api_logsテーブル
create table if not exists public.api_logs (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null,
  method text not null,
  request_body jsonb,
  response_body jsonb,
  status_code integer,
  error text,
  model text,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  temperature numeric(3,2),
  max_tokens integer,
  duration_ms integer,
  created_at timestamptz default now()
);

-- 7. インデックス
create index if not exists evidence_status_idx on public.evidence(status);
create index if not exists evidence_created_at_idx on public.evidence(created_at desc);
create index if not exists evidence_published_at_idx on public.evidence(published_at desc);
create index if not exists evidence_domain_idx on public.evidence(domain);
create index if not exists evidence_tags_idx on public.evidence using gin(tags);
create index if not exists evidence_vector_idx on public.evidence using ivfflat(vector vector_cosine_ops);

create index if not exists articles_status_idx on public.articles(status);
create index if not exists articles_created_at_idx on public.articles(created_at desc);
create index if not exists articles_published_at_idx on public.articles(published_at desc);
create index if not exists articles_evidence_ids_idx on public.articles using gin(evidence_ids);

create index if not exists feedback_evidence_id_idx on public.feedback(evidence_id);
create index if not exists feedback_article_id_idx on public.feedback(article_id);
create index if not exists feedback_created_at_idx on public.feedback(created_at desc);

create index if not exists api_logs_endpoint_idx on public.api_logs(endpoint);
create index if not exists api_logs_created_at_idx on public.api_logs(created_at desc);

-- 8. RLS (Row Level Security)
alter table public.evidence enable row level security;
alter table public.articles enable row level security;
alter table public.preferences enable row level security;
alter table public.feedback enable row level security;
alter table public.api_logs enable row level security;

-- 9. RLS Policies (Service Roleは全権限、Anonは読み取りのみ)
create policy "Service role has full access to evidence" on public.evidence
  for all using (auth.role() = 'service_role');

create policy "Anon can read evidence" on public.evidence
  for select using (auth.role() = 'anon');

create policy "Service role has full access to articles" on public.articles
  for all using (auth.role() = 'service_role');

create policy "Anon can read published articles" on public.articles
  for select using (auth.role() = 'anon' and status = 'published');

create policy "Service role has full access to preferences" on public.preferences
  for all using (auth.role() = 'service_role');

create policy "Service role has full access to feedback" on public.feedback
  for all using (auth.role() = 'service_role');

create policy "Service role has full access to api_logs" on public.api_logs
  for all using (auth.role() = 'service_role');

-- 10. Triggers (updated_at自動更新)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger evidence_updated_at before update on public.evidence
  for each row execute function handle_updated_at();

create trigger articles_updated_at before update on public.articles
  for each row execute function handle_updated_at();

create trigger preferences_updated_at before update on public.preferences
  for each row execute function handle_updated_at();

-- 11. 初期データ（デフォルト設定）
insert into public.preferences (category, key, value)
values 
  ('collection', 'daily_limit', '300'),
  ('collection', 'sources', '["news", "paper", "blog"]'),
  ('generation', 'default_persona', '"enterprise"'),
  ('generation', 'default_tone', '"professional"'),
  ('quality', 'auto_publish_threshold', '90'),
  ('quality', 'improvement_threshold', '80')
on conflict (category, key) do nothing;

-- Success message
select 'AA Agent schema created successfully!' as message;