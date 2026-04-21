import { createClient } from '@supabase/supabase-js';

// API สำหรับ Sync ข้อมูลจาก OpenAI ไปยัง Database
export default async function handler(req: any, res: any) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { start_date, end_date } = req.body;
    
    // Validate required parameters
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }

    // Get OpenAI API key from environment
    const openaiApiKey = process.env.OPENAI_ADMIN_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ error: 'OPENAI_ADMIN_KEY is not configured' });
    }

    // Get Supabase credentials
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Supabase credentials not configured' });
    }

    console.log(`🔄 Syncing OpenAI usage data from ${start_date} to ${end_date}`);

    // Step 1: Convert dates to Unix timestamps
    const startTimestamp = Math.floor(new Date(start_date).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(end_date).getTime() / 1000) + 86400; // +1 day (exclusive)
    
    // Calculate days difference for limit
    const daysDiff = Math.ceil((endTimestamp - startTimestamp) / 86400);
    const limit = Math.min(daysDiff, 180); // Max 180 days
    
    console.log(`📅 Date range: ${start_date} to ${end_date} (${limit} days)`);
    console.log(`🕐 Unix timestamps: ${startTimestamp} to ${endTimestamp}`);

    // Step 2: Fetch from OpenAI Costs API (NEW!)
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
      console.error('❌ OpenAI Costs API error:', errorText);
      return res.status(response.status).json({ 
        error: `OpenAI API error: ${response.status}`,
        details: errorText
      });
    }

    const costsData = await response.json();
    console.log('✅ OpenAI Costs API response received');

    // Step 3: Parse and prepare data
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
        
        console.log(`💰 ${date}: $${totalUSD.toFixed(4)} (฿${costBaht.toFixed(2)})`);
      });
    }

    console.log(`📊 Parsed ${records.length} records`);

    // Step 3: Save to Supabase (using upsert to avoid duplicates)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('openai_costs')
      .upsert(records, { 
        onConflict: 'date',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(500).json({ 
        error: 'Failed to save data to database',
        details: error.message 
      });
    }

    console.log(`✅ Saved ${data?.length || 0} records to database`);

    // Calculate totals
    const totalCostUSD = records.reduce((sum, x) => sum + x.cost_usd, 0);
    const totalCostBaht = records.reduce((sum, x) => sum + x.cost_baht, 0);

    return res.status(200).json({
      success: true,
      message: `Synced ${records.length} days of data`,
      data: {
        recordsSynced: records.length,
        startDate: start_date,
        endDate: end_date,
        totalCostUSD: Number(totalCostUSD.toFixed(4)),
        totalCostBaht: Number(totalCostBaht.toFixed(2))
      }
    });

  } catch (error: any) {
    console.error('❌ Error in openai-sync API:', error);
    return res.status(500).json({ 
      error: error?.message || 'Unknown error occurred' 
    });
  }
}

