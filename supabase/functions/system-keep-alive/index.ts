/// <reference path="./deno.d.ts" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Accept, Content-Type',
};

Deno.serve(async (req: Request) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  // Allow GET and HEAD requests (for Uptime Robot monitoring)
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    );
  }

  try {
    const startTime = Date.now();

    // For HEAD requests, just return status without database query
    if (req.method === 'HEAD') {
      return new Response(null, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        status: 200
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase credentials');
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Simple ping query to keep the database connection alive
    const { data, error } = await supabase
      .from('leads')
      .select('id')
      .limit(1);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (error) {
      console.error('❌ Keep-alive ping failed:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Keep-alive failed', 
          details: error.message,
          responseTime 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // Handle different Accept headers to prevent 406 errors
    const acceptHeader = req.headers.get('accept') || '';
    
    if (acceptHeader.includes('text/plain')) {
      return new Response(`OK - ${responseTime}ms`, {
        headers: { ...corsHeaders, 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' },
        status: 200
      });
    } else if (acceptHeader.includes('text/html')) {
      return new Response(`<html><body>OK - ${responseTime}ms</body></html>`, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' },
        status: 200
      });
    } else {
      // Default to JSON (most common case)
      return new Response(
        JSON.stringify({ 
          status: 'ok',
          responseTime,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
          status: 200
        }
      );
    }

  } catch (error: any) {
    console.error('❌ Keep-alive error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Keep-alive error', 
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

