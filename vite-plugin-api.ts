import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

// Extend IncomingMessage to include body property
interface ExtendedIncomingMessage extends IncomingMessage {
  body?: any;
}

// Vite plugin to handle API routes in development
export function apiPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'vite-plugin-api',
    enforce: 'pre',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: ExtendedIncomingMessage, res: ServerResponse, next) => {
        const pathname = (req.url ?? '').split('?')[0].replace(/\/$/, '') || '/';
        // Serve OpenAPI spec JSON
        if (req.url === '/api-docs/openapi.json' && req.method === 'GET') {
          try {
            const { readFile } = await import('fs/promises');
            const { join } = await import('path');
            const filePath = join(process.cwd(), 'server/docs/openapi/openapi.json');
            const data = await readFile(filePath, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
            return;
          } catch (e) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'OpenAPI spec not found. Run npm run gen:openapi' }));
            return;
          }
        }
        // Serve Redoc
        else if (req.url === '/api-docs' && req.method === 'GET') {
          const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>API Docs - Redoc</title>
    <style>
      body{margin:0;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
      #msg{padding:12px;background:#fff3cd;color:#856404;border-bottom:1px solid #ffeeba}
      .hidden{display:none}
      #fallback{padding:16px}
      pre{white-space:pre-wrap;word-break:break-word}
      a{color:#0b5cab}
    </style>
  </head>
  <body>
    <div id="msg" class="hidden"></div>
    <div id="redoc-container"></div>
    <div id="fallback" class="hidden">
      <p>Redoc could not be loaded. You can:</p>
      <ul>
        <li>Open <a href="/api-docs/swagger">Swagger UI</a></li>
        <li>View raw spec <a href="/api-docs/openapi.json" target="_blank">openapi.json</a></li>
      </ul>
      <h3>Spec preview</h3>
      <pre id="spec-json"></pre>
    </div>
    <script>
      (async () => {
        const msg = document.getElementById('msg');
        try {
          const res = await fetch('/api-docs/openapi.json', { cache: 'no-store' });
          if (!res.ok) {
            msg.classList.remove('hidden');
            msg.textContent = 'Cannot load OpenAPI spec (' + res.status + '). Run: npm run gen:openapi';
            return;
          }
          const spec = await res.json();
          // Try to load Redoc script dynamically
          await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js';
            s.async = true;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
          }).catch(() => {});
          if (window.Redoc) {
            window.Redoc.init(spec, {}, document.getElementById('redoc-container'));
          } else {
            // Fallback: show JSON and links
            document.getElementById('fallback').classList.remove('hidden');
            document.getElementById('spec-json').textContent = JSON.stringify(spec, null, 2);
          }
        } catch (e) {
          msg.classList.remove('hidden');
          msg.textContent = 'Error: ' + (e && e.message ? e.message : e);
        }
      })();
    </script>
  </body>
</html>`;
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(html);
          return;
        }
        // Serve Swagger UI
        else if (req.url === '/api-docs/swagger' && req.method === 'GET') {
          const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>API Docs - Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        SwaggerUIBundle({ url: '/api-docs/openapi.json', dom_id: '#swagger' });
      }
    </script>
  </body>
</html>`;
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(html);
          return;
        }
        // Handle /api/openai-usage endpoint
        if (req.url === '/api/openai-usage' && req.method === 'POST') {
          try {
            // Read request body
            let body = '';
            req.on('data', (chunk) => {
              body += chunk.toString();
            });

            req.on('end', async () => {
              try {
                const { start_date, end_date, granularity } = JSON.parse(body);

                // Validate required parameters
                if (!start_date || !end_date) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'start_date and end_date are required' }));
                  return;
                }

                // Get OpenAI API key from environment
                const openaiApiKey = env.OPENAI_ADMIN_KEY;
                if (!openaiApiKey) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ 
                    error: 'OPENAI_ADMIN_KEY is not configured in .env file' 
                  }));
                  return;
                }

                console.log(`[API] ✨ Fetching OpenAI usage data from ${start_date} to ${end_date} (NEW: Bulk API)`);

                // ใช้ /v1/dashboard/billing/usage ที่ดึงหลายวันพร้อมกัน (เร็วกว่ามาก!)
                const url = `https://api.openai.com/v1/dashboard/billing/usage?start_date=${start_date}&end_date=${end_date}`;
                
                const response = await fetch(url, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'Content-Type': 'application/json',
                    ...(env.OPENAI_ORG_ID ? { 'OpenAI-Organization': env.OPENAI_ORG_ID } : {})
                  }
                });

                if (!response.ok) {
                  const errorText = await response.text();
                  console.error('[API] ❌ OpenAI billing API error:', errorText);
                  res.writeHead(response.status, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ 
                    error: `OpenAI API error: ${response.status} - ${errorText}` 
                  }));
                  return;
                }

                const billingData = await response.json() as any;
                console.log('[API] ✅ OpenAI API response received (bulk data)');

                // แปลงข้อมูลจาก OpenAI format เป็น format ของเรา
                const dailyCosts: Array<{date: string; costUSD: number; costBaht: number}> = [];
                
                if (billingData.daily_costs && Array.isArray(billingData.daily_costs)) {
                  billingData.daily_costs.forEach((dayData: any) => {
                    // Convert timestamp to date
                    const date = new Date(dayData.timestamp * 1000).toISOString().split('T')[0];
                    
                    // Sum up all line items
                    let totalCents = 0;
                    if (dayData.line_items && Array.isArray(dayData.line_items)) {
                      totalCents = dayData.line_items.reduce((sum: number, item: any) => sum + (item.cost || 0), 0);
                    }
                    
                    const costUSD = totalCents / 100; // Convert cents to USD
                    const costBaht = costUSD * 35; // Convert to THB
                    
                    dailyCosts.push({
                      date,
                      costUSD: Number(costUSD.toFixed(4)),
                      costBaht: Number(costBaht.toFixed(2))
                    });
                  });
                }
                
                // เรียงตามวันที่
                dailyCosts.sort((a, b) => a.date.localeCompare(b.date));

                const totalCostUSD = Number(dailyCosts.reduce((s: number, x: any) => s + x.costUSD, 0).toFixed(4));
                const totalCostBaht = Number(dailyCosts.reduce((s: number, x: any) => s + x.costBaht, 0).toFixed(2));

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                  success: true, 
                  data: {
                    dailyCosts,
                    totalCostUSD: Number(totalCostUSD.toFixed(4)),
                    totalCostBaht: Number(totalCostBaht.toFixed(2)),
                    startDate: start_date,
                    endDate: end_date
                  }
                }));

              } catch (parseError: any) {
                console.error('[API] Error processing request:', parseError);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                  error: parseError.message || 'Internal server error' 
                }));
              }
            });

          } catch (error: any) {
            console.error('[API] Error handling request:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              error: error.message || 'Internal server error' 
            }));
          }
        }
        // Handle /api/openai-sync endpoint (Sync OpenAI data to DB)
        else if (req.url === '/api/openai-sync' && req.method === 'POST') {
          try {
            let body = '';
            req.on('data', (chunk) => { body += chunk.toString(); });
            
            req.on('end', async () => {
              try {
                const { start_date, end_date } = JSON.parse(body);
                
                if (!start_date || !end_date) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'start_date and end_date are required' }));
                  return;
                }

                // Get credentials
                const openaiApiKey = env.OPENAI_ADMIN_KEY;
                const supabaseUrl = env.VITE_SUPABASE_URL;
                const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

                if (!openaiApiKey) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'OPENAI_ADMIN_KEY not configured' }));
                  return;
                }

                if (!supabaseUrl || !supabaseServiceKey) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Supabase credentials not configured' }));
                  return;
                }

                console.log(`[API] 🔄 Syncing OpenAI data: ${start_date} to ${end_date}`);

                // Step 1: Convert dates to Unix timestamps
                const startTimestamp = Math.floor(new Date(start_date).getTime() / 1000);
                const endTimestamp = Math.floor(new Date(end_date).getTime() / 1000) + 86400; // +1 day (exclusive)
                
                // Calculate days difference for limit
                const daysDiff = Math.ceil((endTimestamp - startTimestamp) / 86400);
                const limit = Math.min(daysDiff, 180); // Max 180 days
                
                console.log(`[API] 📅 Date range: ${start_date} to ${end_date} (${limit} days)`);
                console.log(`[API] 🕐 Unix timestamps: ${startTimestamp} to ${endTimestamp}`);

                // Step 2: Fetch from OpenAI Costs API (NEW - ดึงพร้อมกันได้!)
                const url = `https://api.openai.com/v1/organization/costs?start_time=${startTimestamp}&end_time=${endTimestamp}&bucket_width=1d&limit=${limit}`;
                
                const response = await fetch(url, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'Content-Type': 'application/json'
                  }
                });

                if (!response.ok) {
                  const errorText = await response.text();
                  console.error('[API] ❌ OpenAI Costs API error:', errorText);
                  res.writeHead(response.status, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ 
                    error: `OpenAI API error: ${response.status}`,
                    details: errorText
                  }));
                  return;
                }

                const costsData = await response.json() as any;
                console.log('[API] ✅ OpenAI Costs API response received');

                // Step 3: Parse data
                const records: Array<{date: string; cost_usd: number; cost_baht: number}> = [];
                
                if (costsData.data && Array.isArray(costsData.data)) {
                  costsData.data.forEach((bucket: any) => {
                    // Convert Unix timestamp to date
                    const date = new Date(bucket.start_time * 1000).toISOString().split('T')[0];
                    
                    // Sum up all results in this bucket
                    let totalUSD = 0;
                    if (bucket.results && Array.isArray(bucket.results)) {
                      totalUSD = bucket.results.reduce((sum: number, result: any) => {
                        return sum + (result.amount?.value || 0);
                      }, 0);
                    }
                    
                    const costBaht = totalUSD * 35;
                    
                    records.push({
                      date,
                      cost_usd: Number(totalUSD.toFixed(4)),
                      cost_baht: Number(costBaht.toFixed(2))
                    });
                    
                    console.log(`[API] 💰 ${date}: $${totalUSD.toFixed(4)} (฿${costBaht.toFixed(2)})`);
                  });
                }

                console.log(`[API] 📊 Parsed ${records.length} records`);

                // Step 4: Save to Supabase using UPSERT (insert or update if exists)
                // Use Supabase REST API with on_conflict parameter
                const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/openai_costs?on_conflict=date`, {
                  method: 'POST',
                  headers: {
                    'apikey': supabaseServiceKey,
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates,return=minimal'
                  },
                  body: JSON.stringify(records)
                });

                if (!supabaseResponse.ok) {
                  const errorText = await supabaseResponse.text();
                  console.error('[API] ❌ Supabase error:', errorText);
                  res.writeHead(supabaseResponse.status, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Failed to save to database' }));
                  return;
                }

                console.log(`[API] ✅ Saved to Supabase`);

                const totalCostUSD = records.reduce((sum, x) => sum + x.cost_usd, 0);
                const totalCostBaht = records.reduce((sum, x) => sum + x.cost_baht, 0);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: true,
                  message: `Synced ${records.length} days of data`,
                  data: {
                    recordsSynced: records.length,
                    startDate: start_date,
                    endDate: end_date,
                    totalCostUSD: Number(totalCostUSD.toFixed(4)),
                    totalCostBaht: Number(totalCostBaht.toFixed(2))
                  }
                }));

              } catch (parseError: any) {
                console.error('[API] ❌ Error:', parseError);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: parseError.message || 'Internal error' }));
              }
            });

          } catch (error: any) {
            console.error('[API] ❌ Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message || 'Internal error' }));
          }
        }
        // Handle API endpoints for lead management
        else if (req.url?.startsWith('/api/endpoints/core/leads/lead-management') && req.method === 'GET') {
          try {
            const leadManagement = await import('./server/endpoints/core/leads/lead-management');
            const result = await leadManagement.default(req, res, env);
            return;
          } catch (error) {
            console.error('[API] ❌ Lead Management Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Handle API endpoints for lead detail
        else if (req.url?.startsWith('/api/endpoints/core/leads/lead-detail') && req.method === 'GET') {
          try {
            const leadDetail = await import('./server/endpoints/core/leads/lead-detail');
            await leadDetail.default(req, res, env);
            return;
          } catch (error) {
            console.error('[API] ❌ Lead Detail Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        else if (req.url?.startsWith('/api/endpoints/core/leads/lead-detail') && req.method === 'PUT') {
          try {
            // Read request body for PUT request
            let body = '';
            req.on('data', (chunk) => {
              body += chunk.toString();
            });

            req.on('end', async () => {
              try {
                const bodyData = JSON.parse(body);
                req.body = bodyData;
                
                const leadDetail = await import('./server/endpoints/core/leads/lead-detail');
                await leadDetail.default(req, res, env);
              } catch (error) {
                console.error('[API] ❌ Lead Detail Error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
              }
            });
          } catch (error) {
            console.error('[API] ❌ Error handling request:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
          return;
        }
        // Handle phone validation endpoint
        else if (req.url?.startsWith('/api/endpoints/core/leads/phone-validation') && req.method === 'POST') {
          try {
            // Read request body for POST request
            let body = '';
            req.on('data', (chunk) => {
              body += chunk.toString();
            });

            req.on('end', async () => {
              try {
                // Parse JSON body
                const bodyData = body ? JSON.parse(body) : {};
                
                // Attach to req object
                req.body = bodyData;
                
                // Now import and call handler
                const phoneValidation = await import('./server/endpoints/core/leads/phone-validation');
                await phoneValidation.default(req, res, env);
              } catch (error) {
                console.error('[API] ❌ Phone Validation Error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
              }
            });
          } catch (error) {
            console.error('[API] ❌ Error handling request:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
          return; // Important: prevent further processing
        }
        // Handle lead mutations endpoint
        else if (req.url?.startsWith('/api/endpoints/core/leads/lead-mutations') && req.method === 'POST') {
          try {
            // Read request body for POST request
            let body = '';
            req.on('data', (chunk) => {
              body += chunk.toString();
            });

            req.on('end', async () => {
              try {
                // Parse JSON body
                const bodyData = body ? JSON.parse(body) : {};
                
                // Attach to req object
                req.body = bodyData;
                
                // Now import and call handler
                const leadMutations = await import('./server/endpoints/core/leads/lead-mutations');
                await leadMutations.default(req, res, env);
              } catch (error) {
                console.error('[API] ❌ Lead Mutations Error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
              }
            });
          } catch (error) {
            console.error('[API] ❌ Error handling request:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
          return; // Important: prevent further processing
        }
        // Handle my-leads-data endpoint
        else if (req.url?.startsWith('/api/endpoints/core/my-leads/my-leads-data') && req.method === 'GET') {
          try {
            const myLeadsData = await import('./server/endpoints/core/my-leads/my-leads-data');
            const result = await myLeadsData.default(req, res, env);
            return;
          } catch (error) {
            console.error('[API] ❌ My Leads Data Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Handle my-leads endpoint (with mutations)
        else if (req.url?.startsWith('/api/endpoints/core/my-leads/my-leads') && req.method === 'GET') {
          try {
            const myLeads = await import('./server/endpoints/core/my-leads/my-leads');
            const result = await myLeads.default(req, res, env);
            return;
          } catch (error) {
            console.error('[API] ❌ My Leads Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Handle sales-team-data endpoint
        else if (req.url?.startsWith('/api/endpoints/core/sales-team/sales-team-data') && req.method === 'GET') {
          try {
            const salesTeamData = await import('./server/endpoints/core/sales-team/sales-team-data');
            const result = await salesTeamData.default(req, res, env);
            return;
          } catch (error) {
            console.error('[API] ❌ Sales Team Data Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Handle sales-team endpoint (for compatibility)
        else if (req.url?.startsWith('/api/endpoints/core/sales-team/sales-team') && req.method === 'GET') {
          try {
            const salesTeam = await import('./server/endpoints/core/sales-team/sales-team');
            const result = await salesTeam.default(req, res, env);
            return;
          } catch (error) {
            console.error('[API] ❌ Sales Team Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Handle filtered-sales-team endpoint
        else if (req.url?.startsWith('/api/endpoints/core/sales-team/filtered-sales-team') && req.method === 'GET') {
          try {
            const filteredSalesTeam = await import('./server/endpoints/core/sales-team/filtered-sales-team');
            const result = await filteredSalesTeam.default(req, res, env);
            return;
          } catch (error) {
            console.error('[API] ❌ Filtered Sales Team Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Handle leads-list endpoint
        else if (req.url?.startsWith('/api/endpoints/core/leads/leads-list') && req.method === 'GET') {
          try {
            const leadsList = await import('./server/endpoints/core/leads/leads-list');
            const result = await leadsList.default(req, res, env);
            return;
          } catch (error) {
            console.error('[API] ❌ Leads List Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Handle leads-for-dashboard endpoint
        else if (req.url?.startsWith('/api/endpoints/core/leads/leads-for-dashboard') && req.method === 'GET') {
          try {
            const leadsForDashboard = await import('./server/endpoints/core/leads/leads-for-dashboard');
            const result = await leadsForDashboard.default(req, res, env);
            return;
          } catch (error) {
            console.error('[API] ❌ Leads For Dashboard Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Handle sales-team-list endpoint
        else if (req.url?.startsWith('/api/endpoints/core/leads/sales-team-list') && req.method === 'GET') {
          try {
            const salesTeamList = await import('./server/endpoints/core/leads/sales-team-list');
            const result = await salesTeamList.default(req, res, env);
            return;
          } catch (error) {
            console.error('[API] ❌ Sales Team List Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Handle inventory endpoint
        else if (req.url?.startsWith('/api/endpoints/core/inventory/inventory') && req.method === 'GET') {
          try {
            const inventory = await import('./server/endpoints/core/inventory/inventory');
            const result = await inventory.default(req, res, env);
            return;
          } catch (error) {
            console.error('[API] ❌ Inventory Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Handle inventory-mutations endpoint
        else if (req.url?.startsWith('/api/endpoints/core/inventory/inventory-mutations') && req.method === 'POST') {
          try {
            // Read request body for POST requests
            let body = '';
            req.on('data', (chunk) => {
              body += chunk.toString();
            });

            req.on('end', async () => {
              try {
                const bodyData = body ? JSON.parse(body) : {};
                
                // Attach parsed body to req object
                req.body = bodyData;
                
                // Now import and call handler
                const inventoryMutations = await import('./server/endpoints/core/inventory/inventory-mutations');
                await inventoryMutations.default(req, res, env);
              } catch (error) {
                console.error('[API] ❌ Inventory Mutations Error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
              }
            });
          } catch (error) {
            console.error('[API] ❌ Error handling request:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
          return; // Important: return to prevent further processing
        }
        // Handle products endpoint
        else if (req.url?.startsWith('/api/endpoints/additional/products/products') && req.method === 'GET') {
          try {
            const products = await import('./server/endpoints/additional/products/products');
            const result = await products.default(req, res, env);
            return;
          } catch (error) {
            console.error('[API] ❌ Products Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Handle inventory-units endpoint
        else if (req.url?.startsWith('/api/endpoints/additional/inventory/inventory-units') && req.method === 'GET') {
          try {
            const inventoryUnits = await import('./server/endpoints/additional/inventory/inventory-units');
            const result = await inventoryUnits.default(req, res, env);
            return;
          } catch (error) {
            console.error('[API] ❌ Inventory Units Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Handle purchase-orders endpoint
        else if (req.url?.startsWith('/api/endpoints/additional/purchase-orders/purchase-orders') && req.method === 'GET') {
          try {
            const purchaseOrders = await import('./server/endpoints/additional/purchase-orders/purchase-orders');
            const result = await purchaseOrders.default(req, res, env);
            return;
          } catch (error) {
            console.error('[API] ❌ Purchase Orders Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Handle purchase-order-mutations endpoint
        else if (req.url?.startsWith('/api/endpoints/additional/purchase-orders/purchase-order-mutations') && req.method === 'POST') {
          try {
            // Read request body for POST requests
            let body = '';
            req.on('data', (chunk) => {
              body += chunk.toString();
            });

            req.on('end', async () => {
              try {
                const bodyData = body ? JSON.parse(body) : {};
                
                // Attach parsed body to req object
                req.body = bodyData;
                
                // Now import and call handler
                const purchaseOrderMutations = await import('./server/endpoints/additional/purchase-orders/purchase-order-mutations');
                await purchaseOrderMutations.default(req, res, env);
              } catch (error) {
                console.error('[API] ❌ Purchase Order Mutations Error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
              }
            });
          } catch (error) {
            console.error('[API] ❌ Error handling request:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
          return; // Important: return to prevent further processing
        }
        // Handle customer-services endpoint
        else if (req.url?.startsWith('/api/endpoints/additional/customer/customer-services') && req.method === 'GET') {
          try {
            const customerServices = await import('./server/endpoints/additional/customer/customer-services');
            const result = await customerServices.default(req, res, env);
            return;
          } catch (error) {
            console.error('[API] ❌ Customer Services Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Handle customer-service-stats endpoint
        else if (req.url?.startsWith('/api/endpoints/additional/customer/customer-service-stats') && req.method === 'GET') {
          try {
            const customerServiceStats = await import('./server/endpoints/additional/customer/customer-service-stats');
            const result = await customerServiceStats.default(req, res, env);
            return;
          } catch (error) {
            console.error('[API] ❌ Customer Service Stats Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Handle customer-service-mutations endpoint
        else if (req.url?.startsWith('/api/endpoints/additional/customer/customer-service-mutations') && req.method === 'POST') {
          try {
            // Read request body for POST requests
            let body = '';
            req.on('data', (chunk) => {
              body += chunk.toString();
            });

            req.on('end', async () => {
              try {
                const bodyData = body ? JSON.parse(body) : {};
                
                // Attach parsed body to req object
                req.body = bodyData;
                
                // Now import and call handler
                const customerServiceMutations = await import('./server/endpoints/additional/customer/customer-service-mutations');
                await customerServiceMutations.default(req, res, env);
              } catch (error) {
                console.error('[API] ❌ Customer Service Mutations Error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
              }
            });
          } catch (error) {
            console.error('[API] ❌ Error handling request:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
          return; // Important: return to prevent further processing
        }
        // Handle customer-service-filters endpoint
        else if (req.url?.startsWith('/api/endpoints/additional/customer/customer-service-filters') && req.method === 'GET') {
          try {
            const customerServiceFilters = await import('./server/endpoints/additional/customer/customer-service-filters');
            const result = await customerServiceFilters.default(req, res, env);
            return;
          } catch (error) {
            console.error('[API] ❌ Customer Service Filters Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Handle appointments endpoint
        else if (req.url?.startsWith('/api/endpoints/core/appointments/appointments') && req.method === 'GET') {
          try {
            const appointments = await import('./server/endpoints/core/appointments/appointments');
            await appointments.default(req, res, env);
            return;
          } catch (error) {
            console.error('[API] ❌ Appointments Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Handle sales team management endpoint
        else if (req.url?.startsWith('/api/endpoints/system/management/sales-team-management')) {
          try {
            if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
              // Read body for mutations
              let body = '';
              req.on('data', (chunk: any) => {
                body += chunk.toString();
              });

              req.on('end', async () => {
                try {
                  const bodyData = body ? JSON.parse(body) : {};
                  req.body = bodyData;
                  
                  const handler = await import('./server/endpoints/system/management/sales-team-management');
                  await handler.default(req, res, env);
                } catch (error) {
                  console.error('[API] ❌ Sales Team Management Error:', error);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
              });
            } else {
              // Direct call for GET
              const handler = await import('./server/endpoints/system/management/sales-team-management');
              await handler.default(req, res, env);
            }
            return;
          } catch (error) {
            console.error('[API] ❌ Sales Team Management Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Handle products management endpoint
        else if (req.url?.startsWith('/api/endpoints/system/management/products-management')) {
          try {
            if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
              // Read body for mutations
              let body = '';
              req.on('data', (chunk: any) => {
                body += chunk.toString();
              });

              req.on('end', async () => {
                try {
                  const bodyData = body ? JSON.parse(body) : {};
                  req.body = bodyData;
                  
                  const handler = await import('./server/endpoints/system/management/products-management');
                  await handler.default(req, res, env);
                } catch (error) {
                  console.error('[API] ❌ Products Management Error:', error);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
              });
            } else {
              // Direct call for GET
              const handler = await import('./server/endpoints/system/management/products-management');
              await handler.default(req, res, env);
            }
            return;
          } catch (error) {
            console.error('[API] ❌ Products Management Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Handle user data endpoint
        else if (req.url?.startsWith('/api/endpoints/additional/auth/user-data') && req.method === 'GET') {
          try {
            const handler = await import('./server/endpoints/additional/auth/user-data');
            await handler.default(req, res, env);
            return;
          } catch (error) {
            console.error('[API] ❌ User Data Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Handle sale follow-up endpoint
        else if (req.url?.startsWith('/api/endpoints/system/follow-up/sale-follow-up')) {
          try {
            if (req.method === 'POST') {
              // Read body for mutations
              let body = '';
              req.on('data', (chunk: any) => {
                body += chunk.toString();
              });

              req.on('end', async () => {
                try {
                  const bodyData = body ? JSON.parse(body) : {};
                  req.body = bodyData;
                  
                  const handler = await import('./server/endpoints/system/follow-up/sale-follow-up');
                  await handler.default(req, res, env);
                } catch (error) {
                  console.error('[API] ❌ Sale Follow-Up Error:', error);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
              });
            } else {
              // Direct call for GET
              const handler = await import('./server/endpoints/system/follow-up/sale-follow-up');
              await handler.default(req, res, env);
            }
            return;
          } catch (error) {
            console.error('[API] ❌ Sale Follow-Up Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Handle service appointments endpoint
        else if (req.url?.startsWith('/api/endpoints/system/service/service-appointments')) {
          try {
            if (req.method === 'POST' || req.method === 'PUT') {
              // Read body for mutations
              let body = '';
              req.on('data', (chunk: any) => {
                body += chunk.toString();
              });

              req.on('end', async () => {
                try {
                  const bodyData = body ? JSON.parse(body) : {};
                  req.body = bodyData;
                  
                  const handler = await import('./server/endpoints/system/service/service-appointments');
                  await handler.default(req, res, env);
                } catch (error) {
                  console.error('[API] ❌ Service Appointments Error:', error);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
              });
            } else {
              // Direct call for GET/DELETE
              const handler = await import('./server/endpoints/system/service/service-appointments');
              await handler.default(req, res, env);
            }
            return;
          } catch (error) {
            console.error('[API] ❌ Service Appointments Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Handle productivity log submission endpoint
        else if (req.url?.startsWith('/api/endpoints/system/productivity/productivity-log-submission')) {
          try {
            if (req.method === 'POST') {
              // Read body for submission
              let body = '';
              req.on('data', (chunk: any) => {
                body += chunk.toString();
              });

              req.on('end', async () => {
                try {
                  const bodyData = body ? JSON.parse(body) : {};
                  req.body = bodyData;
                  
                  const handler = await import('./server/endpoints/system/productivity/productivity-log-submission');
                  await handler.default(req, res, env);
                } catch (error) {
                  console.error('[API] ❌ Productivity Log Submission Error:', error);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
              });
            } else {
              res.writeHead(405, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Method not allowed' }));
            }
            return;
          } catch (error) {
            console.error('[API] ❌ Productivity Log Submission Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        // Service Visits API
        else if (req.url?.startsWith('/api/endpoints/system/service/service-visits')) {
          try {
            if (req.method === 'GET' || req.method === 'DELETE') {
              // GET and DELETE requests - no body
              const serviceVisits = await import('./server/endpoints/system/service/service-visits');
              await serviceVisits.default(req, res, env);
            } else if (req.method === 'POST' || req.method === 'PUT') {
              // POST and PUT requests - read body
              let body = '';
              req.on('data', (chunk) => {
                body += chunk.toString();
              });

              req.on('end', async () => {
                try {
                  const bodyData = body ? JSON.parse(body) : {};
                  req.body = bodyData;

                  const serviceVisits = await import('./server/endpoints/system/service/service-visits');
                  await serviceVisits.default(req, res, env);
                } catch (error) {
                  console.error('[API] ❌ Service Visits Body Parse Error:', error);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Internal server error' }));
                }
              });
            } else {
              res.writeHead(405, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Method not allowed' }));
            }
            return;
          } catch (error) {
            console.error('[API] ❌ Service Visits Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
          }
        }
        else {
          next();
        }
      });
    }
  };
}



