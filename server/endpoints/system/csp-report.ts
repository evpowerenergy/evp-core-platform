export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests for CSP reports
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the request body safely
    let report;
    try {
      report = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (parseError) {
      console.warn('⚠️ Failed to parse CSP report body:', parseError);
      report = {};
    }
    
    // Log CSP violation for debugging (only in development)
    if (process.env.NODE_ENV === 'development' && report && report['csp-report']) {
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
      return res.status(200).json({ 
        status: 'CSP report received (expected violation)',
        timestamp: new Date().toISOString()
      });
    }

    // Return success for all other violations
    return res.status(200).json({ 
      status: 'CSP report received',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ CSP Report Error:', error);
    
    // Return a more specific error response
    return res.status(500).json({ 
      error: 'Failed to process CSP report',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 