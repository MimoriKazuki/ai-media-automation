import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ブラウザ用クライアント（Anon Key）
export const supabaseClient = () =>
  createClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );

// クライアントインスタンス（シングルトン）
export const sbClient = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);