import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for browser/client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations with full privileges
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export type Database = {
  public: {
    Tables: {
      collected_data: {
        Row: {
          id: string;
          source: string;
          source_id?: string;
          title?: string;
          content?: string;
          url?: string;
          author?: string;
          collected_at: string;
          processed: boolean;
          trend_score?: number;
          metadata?: any;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['collected_data']['Row'], 'id' | 'created_at' | 'collected_at'>;
      };
      trends: {
        Row: {
          id: string;
          keyword: string;
          score: number;
          velocity?: number;
          sources_count?: number;
          analysis?: any;
          claude_response?: string;
          should_write_article: boolean;
          article_created: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trends']['Row'], 'id' | 'created_at' | 'updated_at'>;
      };
      articles: {
        Row: {
          id: string;
          trend_id?: string;
          title: string;
          slug: string;
          content: string;
          markdown_content?: string;
          meta_description?: string;
          keywords?: string[];
          quality_score?: number;
          seo_score?: number;
          readability_score?: number;
          originality_score?: number;
          accuracy_score?: number;
          engagement_score?: number;
          evaluation_details?: any;
          status: string;
          reviewed_by?: string;
          review_notes?: string;
          view_count: number;
          avg_time_on_page?: number;
          bounce_rate?: number;
          social_shares?: any;
          generation_model?: string;
          generation_prompt?: string;
          evaluation_prompt?: string;
          generation_cost?: number;
          published_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['articles']['Row'], 'id' | 'created_at' | 'updated_at' | 'view_count'>;
      };
      prompt_templates: {
        Row: {
          id: string;
          name: string;
          type?: string;
          template: string;
          variables?: any;
          performance_score?: number;
          usage_count: number;
          success_rate?: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['prompt_templates']['Row'], 'id' | 'created_at' | 'updated_at' | 'usage_count'>;
      };
      learning_data: {
        Row: {
          id: string;
          article_id?: string;
          metric_type?: string;
          metric_value?: number;
          patterns_extracted?: any;
          improvements_suggested?: any;
          applied: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['learning_data']['Row'], 'id' | 'created_at'>;
      };
      system_logs: {
        Row: {
          id: string;
          log_level?: string;
          component?: string;
          message?: string;
          details?: any;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['system_logs']['Row'], 'id' | 'created_at'>;
      };
      data_sources: {
        Row: {
          id: string;
          name: string;
          type?: string;
          url?: string;
          configuration?: any;
          is_active: boolean;
          last_fetched_at?: string;
          fetch_interval_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['data_sources']['Row'], 'id' | 'created_at' | 'updated_at'>;
      };
      review_queue: {
        Row: {
          id: string;
          article_id?: string;
          priority: number;
          assigned_to?: string;
          status: string;
          added_at: string;
          reviewed_at?: string;
        };
        Insert: Omit<Database['public']['Tables']['review_queue']['Row'], 'id' | 'added_at'>;
      };
      performance_analytics: {
        Row: {
          id: string;
          article_id?: string;
          date: string;
          page_views: number;
          unique_visitors: number;
          avg_session_duration?: number;
          bounce_rate?: number;
          social_shares: number;
          comments_count: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['performance_analytics']['Row'], 'id' | 'created_at'>;
      };
    };
  };
};