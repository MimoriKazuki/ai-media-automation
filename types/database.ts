export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      evidence: {
        Row: {
          id: string
          title: string
          url: string
          domain: string | null
          published_at: string | null
          summary: string | null
          quotes: Json
          stats: Json
          scores: Json
          vector: string | null
          source_type: 'news' | 'paper' | 'social' | 'github' | 'other'
          status: 'pending' | 'approved' | 'rejected' | 'needs_edit'
          tags: string[]
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          url: string
          domain?: string | null
          published_at?: string | null
          summary?: string | null
          quotes?: Json
          stats?: Json
          scores?: Json
          vector?: string | null
          source_type?: 'news' | 'paper' | 'social' | 'github' | 'other'
          status?: 'pending' | 'approved' | 'rejected' | 'needs_edit'
          tags?: string[]
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          url?: string
          domain?: string | null
          published_at?: string | null
          summary?: string | null
          quotes?: Json
          stats?: Json
          scores?: Json
          vector?: string | null
          source_type?: 'news' | 'paper' | 'social' | 'github' | 'other'
          status?: 'pending' | 'approved' | 'rejected' | 'needs_edit'
          tags?: string[]
          note?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      articles: {
        Row: {
          id: string
          title: string | null
          outline: Json | null
          content: string | null
          evidence_ids: string[] | null
          seo: Json | null
          quality: Json | null
          status: 'draft' | 'ready' | 'scheduled' | 'published'
          scheduled_at: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title?: string | null
          outline?: Json | null
          content?: string | null
          evidence_ids?: string[] | null
          seo?: Json | null
          quality?: Json | null
          status?: 'draft' | 'ready' | 'scheduled' | 'published'
          scheduled_at?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string | null
          outline?: Json | null
          content?: string | null
          evidence_ids?: string[] | null
          seo?: Json | null
          quality?: Json | null
          status?: 'draft' | 'ready' | 'scheduled' | 'published'
          scheduled_at?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      preferences: {
        Row: {
          id: string
          owner: string
          domain_weights: Json
          topic_weights: Json
          tone_prefs: Json
          updated_at: string
        }
        Insert: {
          id?: string
          owner: string
          domain_weights?: Json
          topic_weights?: Json
          tone_prefs?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          owner?: string
          domain_weights?: Json
          topic_weights?: Json
          tone_prefs?: Json
          updated_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          user_id: string | null
          target_type: 'evidence' | 'article'
          target_id: string
          action: 'approve' | 'reject' | 'edit' | 'pin' | 'unpin'
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          target_type: 'evidence' | 'article'
          target_id: string
          action: 'approve' | 'reject' | 'edit' | 'pin' | 'unpin'
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          target_type?: 'evidence' | 'article'
          target_id?: string
          action?: 'approve' | 'reject' | 'edit' | 'pin' | 'unpin'
          reason?: string | null
          created_at?: string
        }
      }
      api_logs: {
        Row: {
          id: string
          endpoint: string
          method: string
          request_body: Json | null
          response_body: Json | null
          model: string | null
          temperature: number | null
          max_tokens: number | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          endpoint: string
          method: string
          request_body?: Json | null
          response_body?: Json | null
          model?: string | null
          temperature?: number | null
          max_tokens?: number | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          endpoint?: string
          method?: string
          request_body?: Json | null
          response_body?: Json | null
          model?: string | null
          temperature?: number | null
          max_tokens?: number | null
          user_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Evidence = Database['public']['Tables']['evidence']['Row'];
export type EvidenceInsert = Database['public']['Tables']['evidence']['Insert'];
export type EvidenceUpdate = Database['public']['Tables']['evidence']['Update'];

export type Article = Database['public']['Tables']['articles']['Row'];
export type ArticleInsert = Database['public']['Tables']['articles']['Insert'];
export type ArticleUpdate = Database['public']['Tables']['articles']['Update'];

export type Feedback = Database['public']['Tables']['feedback']['Row'];
export type FeedbackInsert = Database['public']['Tables']['feedback']['Insert'];

export type ApiLog = Database['public']['Tables']['api_logs']['Row'];
export type ApiLogInsert = Database['public']['Tables']['api_logs']['Insert'];