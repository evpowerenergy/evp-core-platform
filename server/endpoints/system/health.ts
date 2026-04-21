export default function handler(req: any, res: any) {
  // Set CORS headers for Uptime Robot
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type');
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle HEAD request
  if (req.method === 'HEAD') {
    return res.status(200).end();
  }

  // Handle GET request
  if (req.method === 'GET') {
    const acceptHeader = req.headers.accept || '';
    
    if (acceptHeader.includes('text/plain')) {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send('OK');
    } else if (acceptHeader.includes('text/html')) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send('<html><body>OK</body></html>');
    } else {
      // Default to JSON
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        region: process.env.VERCEL_REGION || 'unknown'
      });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
} 