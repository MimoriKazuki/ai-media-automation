-- articlesテーブルにcategoryカラムを追加
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS category text;

-- articlesテーブルにevidence_idsカラムを追加
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS evidence_ids uuid[] DEFAULT '{}';