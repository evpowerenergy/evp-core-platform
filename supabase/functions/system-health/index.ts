/// <reference path="./deno.d.ts" />

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

  // Handle HEAD request
  if (req.method === 'HEAD') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  // Handle GET request
  if (req.method === 'GET') {
    const acceptHeader = req.headers.get('accept') || '';
    
    if (acceptHeader.includes('text/plain')) {
      return new Response('OK', {
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        status: 200
      });
    } else if (acceptHeader.includes('text/html')) {
      return new Response('<html><body>OK</body></html>', {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        status: 200
      });
    } else {
      // Default to JSON
      return new Response(
        JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          environment: Deno.env.get('ENVIRONMENT') || 'production',
          region: Deno.env.get('VERCEL_REGION') || 'unknown'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
  }

  // Method not allowed
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405
    }
  );
});

