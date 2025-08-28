import { NextRequest, NextResponse } from 'next/server';
import { leadSystem } from '@/lib/leads';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Create lead first
    const lead = await leadSystem.createOrUpdateLead({
      email: data.email,
      name: data.name,
      company: data.company,
      company_size: data.company_size,
      position: data.position,
      phone: data.phone,
      source: 'consultation',
      privacy_accepted: data.privacy_accepted,
    });
    
    if (!lead) {
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }
    
    // Create consultation record
    const { data: consultation, error } = await supabaseAdmin
      .from('consultations')
      .insert({
        lead_id: lead.id,
        consultation_type: data.consultation_type,
        preferred_date: data.preferred_date,
        preferred_time: data.preferred_time,
        timezone: data.timezone,
        current_challenges: data.current_challenges,
        ai_experience_level: data.ai_experience_level,
        budget_range: data.budget_range,
        timeline: data.timeline,
        status: 'requested',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Consultation booking error:', error);
      return NextResponse.json(
        { error: 'Failed to book consultation' },
        { status: 500 }
      );
    }
    
    // Track conversion
    await leadSystem.trackConversion(lead.id, 'consultation');
    
    // Send confirmation email (mock)
    await sendConsultationConfirmation(lead, consultation);
    
    // Log the booking
    await supabaseAdmin.from('system_logs').insert({
      log_level: 'info',
      component: 'consultation',
      message: 'Consultation booked successfully',
      details: {
        lead_id: lead.id,
        consultation_id: consultation.id,
        type: data.consultation_type,
      },
    });
    
    return NextResponse.json({
      success: true,
      consultation_id: consultation.id,
      lead_id: lead.id,
    });
    
  } catch (error) {
    console.error('Consultation booking error:', error);
    return NextResponse.json(
      { error: 'Failed to book consultation' },
      { status: 500 }
    );
  }
}

async function sendConsultationConfirmation(lead: any, consultation: any) {
  // In production, integrate with email service (Resend, SendGrid, etc.)
  console.log(`Sending consultation confirmation to ${lead.email}`);
  
  const emailContent = `
    ${lead.name}様
    
    この度は無料相談をお申し込みいただき、ありがとうございます。
    
    ■ 相談内容
    日時: ${consultation.preferred_date} ${consultation.preferred_time}
    タイプ: ${consultation.consultation_type}
    
    24時間以内に担当者より詳細のご連絡をさせていただきます。
    
    よろしくお願いいたします。
    AI Media Automation
  `;
  
  // Queue email for sending
  await supabaseAdmin.from('email_queue').insert({
    to_email: lead.email,
    subject: 'AI導入相談のご予約確認',
    content: emailContent,
    type: 'consultation_confirmation',
    status: 'pending',
  }).catch(console.error);
}