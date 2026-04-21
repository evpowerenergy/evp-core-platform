import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any, env?: Record<string, string>) {
  // Initialize Supabase client with environment variables
  const supabaseUrl = env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = env?.SUPABASE_SERVICE_ROLE_KEY || env?.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[API] Missing Supabase credentials');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Supabase configuration missing' }));
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const { phone, excludeId } = req.body;

    if (!phone) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Phone number is required' }));
      return;
    }

    // Query all leads with phone numbers (necessary for normalization check)
    // We fetch all phone numbers because normalization requires comparing the input
    // against all existing phone numbers after removing special characters
    const { data, error } = await supabase
      .from('leads')
      .select('id, tel')
      .not('tel', 'is', null);

    if (error) {
      console.error('Error checking phone duplicate:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Failed to check phone duplicate',
        details: error.message 
      }));
      return;
    }

    // Normalize phone number for comparison
    const normalizePhone = (phoneNumber: string) => {
      return phoneNumber.replace(/[^\d+]/g, '');
    };

    const normalizedInputPhone = normalizePhone(phone);
    
    // Check if any lead has the same normalized phone number
    // Exclude current lead if excludeId is provided (for updates)
    const isDuplicate = data?.some((lead: any) => {
      // Skip if this is the lead being updated
      if (excludeId && lead.id === excludeId) {
        return false;
      }
      const normalizedLeadPhone = normalizePhone(lead.tel || '');
      return normalizedLeadPhone === normalizedInputPhone;
    }) || false;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      isDuplicate: isDuplicate,
      phone: phone 
    }));

  } catch (error) {
    console.error('Phone validation error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }));
  }
}
