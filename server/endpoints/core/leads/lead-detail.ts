import { createClient } from '@supabase/supabase-js';
import { ServerResponse } from 'http';

export default async function handler(req: any, res: ServerResponse, env?: Record<string, string>) {
  const supabaseUrl = env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = env?.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[API] Missing Supabase credentials');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Supabase configuration missing' }));
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (req.method === 'GET') {
      // Parse query parameters
      const url = new URL(req.url, `http://${req.headers.host}`);
      const queryParams = url.searchParams;
      const leadId = queryParams.get('leadId');
      const action = queryParams.get('action');

      if (!leadId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Lead ID is required' }));
        return;
      }

      if (action === 'detail') {
        // Get lead detail - ใช้ select('*') เพื่อให้ได้ทุก field รวมถึง ad_campaign_id
        // และเพิ่ม created_at_thai, updated_at_thai ที่เป็น computed columns
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .single();

        if (leadError) {
          console.error('Error fetching lead:', leadError);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to fetch lead' }));
          return;
        }

        // Debug: Log lead data to check ad_campaign_id
        console.log('📋 Lead fetched from database:', {
          id: lead?.id,
          ad_campaign_id: lead?.ad_campaign_id,
          has_ad_campaign_id: 'ad_campaign_id' in (lead || {}),
          lead_keys: lead ? Object.keys(lead) : []
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: lead }));
        return;
      }

      if (action === 'latest-log') {
        // Get latest productivity log
        const { data: log, error: logError } = await supabase
          .from('lead_productivity_logs')
          .select(`
            *,
            appointments(*),
            credit_evaluation(*),
            lead_products(*, products(*))
          `)
          .eq('lead_id', leadId)
          .order('created_at_thai', { ascending: false })
          .limit(1)
          .single();

        if (logError && logError.code !== 'PGRST116') {
          console.error('Error fetching latest log:', logError);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to fetch latest log' }));
          return;
        }

        if (log) {
          // Get quotations and quotation documents
          const [quotationsData, quotationDocumentsData] = await Promise.all([
            supabase
              .from('quotations')
              .select('*')
              .eq('productivity_log_id', log.id),
            supabase
              .from('quotation_documents')
              .select('*')
              .eq('productivity_log_id', log.id)
          ]);

          const result = {
            ...log,
            quotations: quotationsData.data || [],
            quotation_documents: quotationDocumentsData.data || []
          };

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: result }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: null }));
        return;
      }

      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid action' }));
      return;
    }

    if (req.method === 'PUT') {
      // Update lead
      const { leadId, updates } = req.body;

      if (!leadId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Lead ID is required' }));
        return;
      }

      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId)
        .select()
        .single();

      if (error) {
        console.error('Error updating lead:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to update lead' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data }));
      return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;

  } catch (error: any) {
    console.error('[API] Lead Detail Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
  }
}
