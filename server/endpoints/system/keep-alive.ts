import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://ttfjapfdzrxmbxbarfbn.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  // Allow GET and HEAD requests (for Uptime Robot monitoring)
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const startTime = Date.now();

    // For HEAD requests, just return status without database query
    if (req.method === 'HEAD') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(200).end();
    }

    // Simple ping query to keep the database connection alive
    const { data, error } = await supabase
      .from('leads')
      .select('id')
      .limit(1);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (error) {
      console.error('❌ Keep-alive ping failed:', error);
      return res.status(500).json({ 
        error: 'Keep-alive failed', 
        details: error.message,
        responseTime 
      });
    }

    // Handle different Accept headers to prevent 406 errors
    const acceptHeader = req.headers.accept || '';
    
    if (acceptHeader.includes('text/plain')) {
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(200).send(`OK - ${responseTime}ms`);
    } else if (acceptHeader.includes('text/html')) {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(200).send(`<html><body>OK - ${responseTime}ms</body></html>`);
    } else {
      // Default to JSON (most common case)
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(200).json({ 
        status: 'ok',
        responseTime,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error: any) {
    console.error('❌ Keep-alive error:', error);
    return res.status(500).json({ 
      error: 'Keep-alive error', 
      details: error.message 
    });
  }
} 