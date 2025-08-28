import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

// Lead validation schema
export const leadSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  name: z.string().optional(),
  company: z.string().optional(),
  company_size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  source: z.enum(['article', 'resource', 'newsletter', 'consultation']),
  source_detail: z.string().optional(),
  marketing_consent: z.boolean().default(false),
  privacy_accepted: z.boolean().refine(val => val === true, {
    message: 'プライバシーポリシーへの同意が必要です'
  }),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

export interface Lead extends LeadInput {
  id: string;
  status: string;
  lead_score: number;
  created_at: string;
  updated_at: string;
}

export class LeadManagementSystem {
  /**
   * Create or update a lead
   */
  async createOrUpdateLead(leadData: LeadInput): Promise<Lead | null> {
    try {
      // Calculate lead score
      const leadScore = this.calculateLeadScore(leadData);

      // Check if lead exists
      const { data: existingLead } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('email', leadData.email)
        .single();

      if (existingLead) {
        // Update existing lead
        const { data, error } = await supabaseAdmin
          .from('leads')
          .update({
            ...leadData,
            lead_score: Math.max(existingLead.lead_score, leadScore),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingLead.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new lead
        const { data, error } = await supabaseAdmin
          .from('leads')
          .insert({
            ...leadData,
            lead_score: leadScore,
            status: 'new',
          })
          .select()
          .single();

        if (error) throw error;

        // Send to CRM if configured
        await this.syncToCRM(data);

        // Trigger welcome email
        await this.sendWelcomeEmail(data);

        return data;
      }
    } catch (error) {
      console.error('Error creating/updating lead:', error);
      return null;
    }
  }

  /**
   * Calculate lead score based on various factors
   */
  private calculateLeadScore(leadData: LeadInput): number {
    let score = 0;

    // Company size scoring
    const sizeScores: Record<string, number> = {
      '1-10': 5,
      '11-50': 10,
      '51-200': 20,
      '201-500': 30,
      '500+': 40,
    };
    if (leadData.company_size) {
      score += sizeScores[leadData.company_size] || 0;
    }

    // Position scoring
    if (leadData.position) {
      const position = leadData.position.toLowerCase();
      if (position.includes('ceo') || position.includes('社長')) score += 30;
      else if (position.includes('cto') || position.includes('技術')) score += 25;
      else if (position.includes('manager') || position.includes('マネージャー')) score += 20;
      else if (position.includes('dx') || position.includes('デジタル')) score += 25;
    }

    // Source scoring
    const sourceScores: Record<string, number> = {
      consultation: 30,
      resource: 20,
      article: 10,
      newsletter: 5,
    };
    score += sourceScores[leadData.source] || 0;

    // Has company info
    if (leadData.company) score += 10;
    if (leadData.phone) score += 5;
    if (leadData.marketing_consent) score += 5;

    return Math.min(100, score); // Cap at 100
  }

  /**
   * Send welcome email to new lead
   */
  private async sendWelcomeEmail(lead: Lead): Promise<void> {
    try {
      // Get email template
      const { data: template } = await supabaseAdmin
        .from('prompt_templates')
        .select('template')
        .eq('name', 'welcome_email')
        .single();

      if (!template) return;

      // Queue email for sending
      await supabaseAdmin.from('email_queue').insert({
        to_email: lead.email,
        subject: 'AI導入の成功事例と実践ガイドをお届けします',
        content: template.template.replace('{name}', lead.name || 'お客様'),
        status: 'pending',
        type: 'welcome',
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  }

  /**
   * Sync lead to CRM (HubSpot/Salesforce)
   */
  private async syncToCRM(lead: Lead): Promise<void> {
    // This would integrate with actual CRM API
    // For now, we'll just log the sync
    await supabaseAdmin.from('system_logs').insert({
      log_level: 'info',
      component: 'crm_sync',
      message: 'Lead synced to CRM',
      details: { lead_id: lead.id, email: lead.email },
    });
  }

  /**
   * Get lead by email
   */
  async getLeadByEmail(email: string): Promise<Lead | null> {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching lead:', error);
      return null;
    }

    return data;
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(leadId: string, status: string): Promise<void> {
    await supabaseAdmin
      .from('leads')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);
  }

  /**
   * Track lead conversion
   */
  async trackConversion(
    leadId: string,
    conversionType: string,
    conversionValue?: number
  ): Promise<void> {
    await supabaseAdmin.from('conversion_tracking').insert({
      lead_id: leadId,
      conversion_type: conversionType,
      conversion_value: conversionValue,
    });

    // Update lead status based on conversion
    const statusMap: Record<string, string> = {
      download: 'contacted',
      newsletter: 'contacted',
      consultation: 'qualified',
      customer: 'customer',
    };

    if (statusMap[conversionType]) {
      await this.updateLeadStatus(leadId, statusMap[conversionType]);
    }
  }

  /**
   * Get lead statistics
   */
  async getLeadStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    averageScore: number;
  }> {
    const { data: leads } = await supabaseAdmin
      .from('leads')
      .select('status, source, lead_score');

    if (!leads) {
      return {
        total: 0,
        byStatus: {},
        bySource: {},
        averageScore: 0,
      };
    }

    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    let totalScore = 0;

    for (const lead of leads) {
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
      bySource[lead.source] = (bySource[lead.source] || 0) + 1;
      totalScore += lead.lead_score || 0;
    }

    return {
      total: leads.length,
      byStatus,
      bySource,
      averageScore: leads.length > 0 ? totalScore / leads.length : 0,
    };
  }
}

export const leadSystem = new LeadManagementSystem();