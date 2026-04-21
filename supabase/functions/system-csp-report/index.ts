/// <reference path="./deno.d.ts" />

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

Deno.serve(async (req: Request) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  // Only allow POST requests for CSP reports
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    );
  }

  try {
    // Parse the request body safely
    let report;
    try {
      const body = await req.text();
      report = body ? JSON.parse(body) : {};
    } catch (parseError) {
      console.warn('⚠️ Failed to parse CSP report body:', parseError);
      report = {};
    }
    
    // Log CSP violation for debugging (only in development)
    const environment = Deno.env.get('ENVIRONMENT') || Deno.env.get('NODE_ENV') || 'production';
    if (environment === 'development' && report && report['csp-report']) {
      const cspReport = report['csp-report'];
      console.log('🔍 CSP Violation:', {
        blockedUri: cspReport.blockedUri,
        violatedDirective: cspReport.violatedDirective,
        sourceFile: cspReport.sourceFile
      });
    }

    // Check if the violation is from reasonlabsapi.com (expected)
    const blockedUri = report['csp-report']?.blockedUri;
    if (blockedUri && blockedUri.includes('reasonlabsapi.com')) {
      // Expected CSP violation from reasonlabsapi.com - no logging needed
      return new Response(
        JSON.stringify({ 
          status: 'CSP report received (expected violation)',
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Return success for all other violations
    return new Response(
      JSON.stringify({ 
        status: 'CSP report received',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('❌ CSP Report Error:', error);
    
    // Return a more specific error response
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process CSP report',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

