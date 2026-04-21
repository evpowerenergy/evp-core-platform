/// <reference path="./deno.d.ts" />
// @ts-ignore - URL import is supported by Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req: Request) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    // Initialize Supabase client with environment variables
    // Priority: SERVICE_ROLE_KEY (bypasses RLS) > ANON_KEY
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('VITE_SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
    
    // Use SERVICE_ROLE_KEY first (bypasses RLS), fallback to ANON_KEY
    const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[API] Missing Supabase credentials');
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 405
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const { phone, excludeId } = body;

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Normalize phone number first
    const normalizePhone = (phoneNumber: string) => {
      if (!phoneNumber) return '';
      // Trim whitespace first, then remove all non-digit characters
      return phoneNumber.trim().replace(/[^\d]/g, '');
    };

    const normalizedInputPhone = normalizePhone(phone);
    console.log('[Phone Validation] Input phone:', phone);
    console.log('[Phone Validation] Normalized input:', normalizedInputPhone);

    // Query all leads with phone numbers (necessary for normalization check)
    // We fetch all phone numbers because normalization requires comparing the input
    // against all existing phone numbers after removing special characters
    // Note: This might be slow if there are many leads, but it's necessary for accurate duplicate detection
    // Filter out null, empty strings, and whitespace-only values
    const { data, error } = await supabase
      .from('leads')
      .select('id, tel')
      .not('tel', 'is', null)
      .neq('tel', '')
      .not('tel', 'eq', '');

    if (error) {
      console.error('Error checking phone duplicate:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to check phone duplicate',
          details: error.message 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // Filter out empty strings and whitespace-only values
    const validLeads = data?.filter((lead: any) => {
      return lead.tel && lead.tel.trim() !== '';
    }) || [];
    
    console.log('[Phone Validation] Total leads fetched:', data?.length || 0);
    console.log('[Phone Validation] Valid leads (non-empty tel):', validLeads.length);
    
    // Check if any lead has the same normalized phone number
    // Exclude current lead if excludeId is provided (for updates)
    const isDuplicate = validLeads.some((lead: any) => {
      // Skip if this is the lead being updated
      if (excludeId && lead.id === excludeId) {
        return false;
      }
      const normalizedLeadPhone = normalizePhone(lead.tel || '');
      const matches = normalizedLeadPhone === normalizedInputPhone;
      
      // Log first few comparisons for debugging
      if (validLeads.indexOf(lead) < 10) {
        console.log(`[Phone Validation] Comparing: "${lead.tel}" (normalized: "${normalizedLeadPhone}") with "${normalizedInputPhone}" = ${matches}`);
      }
      
      // Log if we find a match
      if (matches) {
        console.log(`[Phone Validation] ✅ DUPLICATE FOUND! Lead ID: ${lead.id}, Tel: "${lead.tel}", Normalized: "${normalizedLeadPhone}"`);
      }
      
      return matches;
    }) || false;
    
    console.log('[Phone Validation] Final result - isDuplicate:', isDuplicate);
    
    // If not duplicate, show some sample phone numbers for debugging
    if (!isDuplicate && validLeads.length > 0) {
      console.log('[Phone Validation] Sample phone numbers (first 10):');
      validLeads.slice(0, 10).forEach((lead: any, index: number) => {
        const normalized = normalizePhone(lead.tel || '');
        console.log(`  ${index + 1}. ID: ${lead.id}, Tel: "${lead.tel}", Normalized: "${normalized}"`);
      });
    }

    return new Response(
      JSON.stringify({ 
        isDuplicate: isDuplicate,
        phone: phone 
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Phone validation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        status: 500
      }
    );
  }
});
