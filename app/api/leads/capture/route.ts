import { NextRequest, NextResponse } from 'next/server';
import { leadSchema, leadSystem } from '@/lib/leads';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = leadSchema.parse(body);
    
    // Create or update lead
    const lead = await leadSystem.createOrUpdateLead(validatedData);
    
    if (!lead) {
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }
    
    // Track conversion
    await leadSystem.trackConversion(lead.id, validatedData.source);
    
    // Log the lead capture
    await supabaseAdmin.from('system_logs').insert({
      log_level: 'info',
      component: 'lead_capture',
      message: 'Lead captured successfully',
      details: {
        lead_id: lead.id,
        source: validatedData.source,
        email: validatedData.email,
      },
    });
    
    // Send response based on source
    if (validatedData.source === 'resource') {
      // Generate download token for resources
      const token = Math.random().toString(36).substring(2, 15);
      
      await supabaseAdmin.from('lead_magnet_downloads').insert({
        lead_id: lead.id,
        lead_magnet_id: validatedData.source_detail,
        download_token: token,
      });
      
      return NextResponse.json({
        success: true,
        lead_id: lead.id,
        download_token: token,
      });
    }
    
    return NextResponse.json({
      success: true,
      lead_id: lead.id,
    });
    
  } catch (error: any) {
    console.error('Lead capture error:', error);
    
    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to capture lead' },
      { status: 500 }
    );
  }
}