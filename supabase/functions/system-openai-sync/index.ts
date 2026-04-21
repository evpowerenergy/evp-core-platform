/// <reference path="./deno.d.ts" />
// @ts-ignore - URL import is supported by Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// API สำหรับ Sync ข้อมูลจาก OpenAI ไปยัง Database (เหมือน API เดิม - logic ตรงกัน)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/** แถวในแต่ละ bucket — API ใช้ results หรือ result */
function getBucketRows(bucket: any): any[] {
  if (Array.isArray(bucket?.results)) return bucket.results;
  if (Array.isArray(bucket?.result)) return bucket.result;
  return [];
}

/** OpenAI บางครั้งส่งค่าเป็นสตริง */
function parseAmountValue(raw: unknown): number {
  if (typeof raw === 'number' && !isNaN(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = parseFloat(raw);
    return !isNaN(n) ? n : 0;
  }
  return 0;
}

function sumBucketRowsUSD(rows: any[]): number {
  let t = 0;
  for (const r of rows) {
    t += parseAmountValue(r?.amount?.value);
  }
  return t;
}

/** รวม token ใน bucket ของ organization/usage/completions */
function sumUsageCompletionTokens(bucket: any): { input: number; output: number } {
  const rows = getBucketRows(bucket);
  let input = 0;
  let output = 0;
  for (const r of rows) {
    const it = r?.input_tokens;
    const ot = r?.output_tokens;
    input += typeof it === 'number' && !isNaN(it) ? it : Number(it) || 0;
    output += typeof ot === 'number' && !isNaN(ot) ? ot : Number(ot) || 0;
  }
  return { input, output };
}

type CostFetchMode = {
  id: string;
  groupByLineItem: boolean;
  includeProjectIds: boolean;
};

Deno.serve(async (req: Request) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    // Validate method (เหมือน API เดิม - POST only)
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 405
        }
      );
    }

    // Parse request body (เหมือน API เดิม)
    const { start_date, end_date } = await req.json();
    
    // Validate required parameters (เหมือน API เดิม)
    if (!start_date || !end_date) {
      return new Response(
        JSON.stringify({ error: 'start_date and end_date are required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // GET /v1/organization/costs — ใช้ admin key ก่อน แล้วค่อย project API key
    // หมายเหตุ: GET /v1/dashboard/billing/usage ใช้ได้แค่จากเบราว์เซอร์ (session key) — ห้ามเรียกจาก Edge Function
    const openaiAdminKey = (Deno.env.get('OPENAI_ADMIN_KEY') ?? '').trim();
    const openaiSecretKey = (Deno.env.get('OPENAI_API_KEY') ?? '').trim();
    const openaiApiKey = openaiAdminKey || openaiSecretKey;
    const openaiOrgId = Deno.env.get('OPENAI_ORG_ID');
    /** จากหน้า OpenAI: Organization → Projects → เลือกโปรเจกต์ (เช่น Default) → คัดลอก project id แบบ proj_... */
    const openaiProjectId = (Deno.env.get('OPENAI_PROJECT_ID') ?? '').trim();
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_ADMIN_KEY or OPENAI_API_KEY is not configured' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // Get Supabase credentials (เหมือน API เดิม)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase credentials not configured' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    console.log(`🔄 Syncing OpenAI usage data from ${start_date} to ${end_date}`);

    // Step 1: Convert dates to Unix timestamps (เหมือน API เดิม - logic ตรงกัน)
    const startTimestamp = Math.floor(new Date(start_date).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(end_date).getTime() / 1000) + 86400; // +1 day (exclusive)
    
    // Calculate days difference for limit (เหมือน API เดิม)
    const daysDiff = Math.ceil((endTimestamp - startTimestamp) / 86400);
    const limit = Math.min(daysDiff, 180); // Max 180 days
    
    console.log(`📅 Date range: ${start_date} to ${end_date} (${limit} days)`);
    console.log(`🕐 Unix timestamps: ${startTimestamp} to ${endTimestamp}`);
    if (openaiProjectId) {
      console.log(`📁 OPENAI_PROJECT_ID: ${openaiProjectId.slice(0, 12)}... (filter costs to this project)`);
    } else {
      console.log(`📁 OPENAI_PROJECT_ID: (ไม่ได้ตั้ง) — ยอดอาจไม่ตรงกับหน้า Usage ที่เลือก "Default project"`);
    }

    const openaiOrgHeader = (openaiOrgId ?? '').trim();

    // Step 2: ลองหลายรูปแบบ — เคยพบว่า group_by=line_item+project_id พร้อมกันให้ยอดรวม $0; แยกลองทีละแบบ
    const buildCostSearchParams = (mode: CostFetchMode, pageCursor: string | null) => {
      const costParams = new URLSearchParams({
        start_time: String(startTimestamp),
        end_time: String(endTimestamp),
        bucket_width: '1d',
        limit: String(limit),
      });
      if (mode.groupByLineItem) {
        costParams.append('group_by', 'line_item');
      }
      if (mode.includeProjectIds && openaiProjectId) {
        costParams.append('project_ids', openaiProjectId);
      }
      if (pageCursor) {
        costParams.set('page', pageCursor);
      }
      return costParams;
    };

    const fetchAllCostPages = async (mode: CostFetchMode): Promise<any[]> => {
      const buckets: any[] = [];
      let nextPage: string | null = null;
      let pageIndex = 0;
      const maxPages = 50;

      do {
        const url = `https://api.openai.com/v1/organization/costs?${buildCostSearchParams(mode, nextPage).toString()}`;
        pageIndex += 1;
        if (pageIndex > maxPages) {
          console.warn(`⚠️ OpenAI costs [${mode.id}]: stopped after ${maxPages} pages`);
          break;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
            ...(openaiOrgHeader ? { 'OpenAI-Organization': openaiOrgHeader } : {})
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`${response.status}: ${errorText}`);
        }

        const pageJson = await response.json();
        const pageBuckets = Array.isArray(pageJson.data) ? pageJson.data : [];
        buckets.push(...pageBuckets);
        nextPage = typeof pageJson.next_page === 'string' && pageJson.next_page.length > 0
          ? pageJson.next_page
          : null;

        console.log(
          `✅ [${mode.id}] page ${pageIndex}: ${pageBuckets.length} buckets, next_page=${nextPage ? 'yes' : 'no'}`
        );
      } while (nextPage);

      return buckets;
    };

    const recordsFromBuckets = (buckets: any[]) => {
      const out: Array<{ date: string; cost_usd: number; cost_baht: number }> = [];
      for (const bucket of buckets) {
        const date = new Date(bucket.start_time * 1000).toISOString().split('T')[0];
        const rowList = getBucketRows(bucket);
        const totalUSD = sumBucketRowsUSD(rowList);
        const costBaht = totalUSD * 35;
        out.push({
          date,
          cost_usd: Number(totalUSD.toFixed(4)),
          cost_baht: Number(costBaht.toFixed(2))
        });
      }
      return out;
    };

    const subtotalFromRecords = (recs: Array<{ cost_usd: number }>) =>
      recs.reduce((s, r) => s + (r.cost_usd || 0), 0);

    const strategies: CostFetchMode[] = [
      ...(openaiProjectId
        ? [{ id: 'line_item+project_ids', groupByLineItem: true, includeProjectIds: true } as CostFetchMode]
        : []),
      { id: 'line_item_org_wide', groupByLineItem: true, includeProjectIds: false },
      ...(openaiProjectId
        ? [{ id: 'no_group_by+project_ids', groupByLineItem: false, includeProjectIds: true } as CostFetchMode]
        : []),
      { id: 'no_group_by_org_wide', groupByLineItem: false, includeProjectIds: false },
    ];

    const strategyTried: Array<{ id: string; subtotalUSD: number; bucketCount: number; error?: string }> = [];
    let costBuckets: any[] = [];
    let chosenModeId = '';
    let projectScopeMismatch = false;
    let anyFetchOk = false;

    for (const mode of strategies) {
      try {
        const buckets = await fetchAllCostPages(mode);
        anyFetchOk = true;
        const recs = recordsFromBuckets(buckets);
        const sub = subtotalFromRecords(recs);
        strategyTried.push({ id: mode.id, subtotalUSD: Number(sub.toFixed(4)), bucketCount: buckets.length });

        if (sub > 0) {
          costBuckets = buckets;
          chosenModeId = mode.id;
          if (openaiProjectId && !mode.includeProjectIds) {
            projectScopeMismatch = true;
          }
          break;
        }
        if (buckets.length > 0) {
          costBuckets = buckets;
          chosenModeId = mode.id;
        }
      } catch (e: any) {
        const msg = e?.message ?? String(e);
        console.error(`❌ OpenAI costs strategy ${mode.id}:`, msg);
        strategyTried.push({ id: mode.id, subtotalUSD: 0, bucketCount: 0, error: msg.slice(0, 500) });
      }
    }

    if (!anyFetchOk) {
      return new Response(
        JSON.stringify({
          error: 'OpenAI costs: ไม่สามารถดึงข้อมูลได้ (ทุกวิธีล้มเหลว)',
          details: strategyTried,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
    }

    const costsData = { data: costBuckets };

    const firstBucketZeroDebug = (buckets: any[]) => {
      const b0 = buckets[0];
      if (!b0) return { empty: true as const };
      const rows = getBucketRows(b0);
      return {
        start_time: b0.start_time,
        rowCount: rows.length,
        amountSamples: rows.slice(0, 5).map((r: any) => parseAmountValue(r?.amount?.value)),
        lineItemSamples: rows.slice(0, 3).map((r: any) => r?.line_item ?? null),
        projectIdSamples: rows.slice(0, 3).map((r: any) => r?.project_id ?? null),
        resultObjectTypes: rows.slice(0, 5).map((r: any) => r?.object ?? null),
      };
    };

    // ตรวจสอบว่ามีข้อมูลครบทุกวันหรือไม่
    if (costsData.data && Array.isArray(costsData.data)) {
      const datesWithZero = costsData.data.filter((bucket: any) => {
        const rows = getBucketRows(bucket);
        if (rows.length === 0) return true;
        return sumBucketRowsUSD(rows) === 0;
      });

      if (datesWithZero.length > 0) {
        console.log(`⚠️ WARNING: มี ${datesWithZero.length} วันที่ยอดรวมเป็น 0 (หรือไม่มีแถว results)`);
        console.log(`💡 ถ้า Dashboard มีค่าแต่ API เป็น 0: ตรวจ OPENAI_ORG_ID / รอ delay ของ Costs API`);
      }
    }

    // Step 3: Parse จาก Costs API ก่อน
    type CostRow = {
      date: string;
      cost_usd: number;
      cost_baht: number;
      input_tokens: number | null;
      output_tokens: number | null;
      sync_source: string;
    };

    let records: CostRow[] = recordsFromBuckets(costBuckets).map((r) => ({
      ...r,
      input_tokens: null,
      output_tokens: null,
      sync_source: 'costs_api',
    }));

    let dataSource: 'organization_costs' | 'organization_usage_completions_estimated' = 'organization_costs';
    let costsApiSubtotalUSD = 0;
    let fallbackSkippedReason: string | null = null;

    const parsedTotalFromCosts = records.reduce((sum, item) => sum + (item.cost_usd || 0), 0);
    costsApiSubtotalUSD = parsedTotalFromCosts;

    /** GET /v1/organization/usage/completions — ทางการ ใช้ Admin key ได้ (ต่างจาก dashboard billing session) */
    const fetchUsageCompletionsPages = async (includeProjectIds: boolean): Promise<any[]> => {
      const buckets: any[] = [];
      let nextPage: string | null = null;
      let pageIndex = 0;
      const maxPages = 50;
      do {
        const params = new URLSearchParams({
          start_time: String(startTimestamp),
          end_time: String(endTimestamp),
          bucket_width: '1d',
          limit: String(limit),
        });
        if (includeProjectIds && openaiProjectId) {
          params.append('project_ids', openaiProjectId);
        }
        if (nextPage) params.set('page', nextPage);
        const url = `https://api.openai.com/v1/organization/usage/completions?${params.toString()}`;
        pageIndex += 1;
        if (pageIndex > maxPages) break;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
            ...(openaiOrgHeader ? { 'OpenAI-Organization': openaiOrgHeader } : {})
          }
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`${response.status}: ${errorText}`);
        }
        const pageJson = await response.json();
        const pageBuckets = Array.isArray(pageJson.data) ? pageJson.data : [];
        buckets.push(...pageBuckets);
        nextPage = typeof pageJson.next_page === 'string' && pageJson.next_page.length > 0
          ? pageJson.next_page
          : null;
        console.log(`✅ [usage/completions] page ${pageIndex}: ${pageBuckets.length} buckets`);
      } while (nextPage);
      return buckets;
    };

    const usdPerMillionTotalTokens = Number(
      (Deno.env.get('OPENAI_USAGE_ESTIMATE_USD_PER_MTOK') ?? '4').trim()
    ) || 4;

    const buildRecordsFromUsageBuckets = (buckets: any[]): CostRow[] => {
      return buckets.map((bucket) => {
        const date = new Date(bucket.start_time * 1000).toISOString().split('T')[0];
        const { input, output } = sumUsageCompletionTokens(bucket);
        const totalTok = input + output;
        const cost_usd = (totalTok / 1_000_000) * usdPerMillionTotalTokens;
        const cost_baht = cost_usd * 35;
        return {
          date,
          cost_usd: Number(cost_usd.toFixed(6)),
          cost_baht: Number(cost_baht.toFixed(2)),
          input_tokens: input,
          output_tokens: output,
          sync_source: 'usage_completions_api',
        };
      });
    };

    const totalTokensInRows = (recs: CostRow[]) =>
      recs.reduce((s, r) => s + (r.input_tokens ?? 0) + (r.output_tokens ?? 0), 0);

    const usageStrategiesTried: Array<{ id: string; totalTokens: number; error?: string }> = [];
    let usageCompletionsStrategyUsed: string | null = null;

    // ถ้า Costs ได้ $0 ทั้งช่วง → ลอง Usage Completions (token รายวัน) แล้วประมาณเป็นเงิน — วิธีใดได้ผลก็ใช้
    if (parsedTotalFromCosts === 0) {
      console.warn('⚠️ organization/costs ยอดรวม $0 — ลอง GET /v1/organization/usage/completions');
      const usageOrder: { id: string; includeProjectIds: boolean }[] = openaiProjectId
        ? [
            { id: 'usage_completions+project_ids', includeProjectIds: true },
            { id: 'usage_completions_org_wide', includeProjectIds: false },
          ]
        : [{ id: 'usage_completions_org_wide', includeProjectIds: false }];

      for (const u of usageOrder) {
        try {
          const ub = await fetchUsageCompletionsPages(u.includeProjectIds);
          const recs = buildRecordsFromUsageBuckets(ub);
          const tok = totalTokensInRows(recs);
          usageStrategiesTried.push({ id: u.id, totalTokens: tok });
          if (tok > 0) {
            records = recs;
            dataSource = 'organization_usage_completions_estimated';
            usageCompletionsStrategyUsed = u.id;
            fallbackSkippedReason = null;
            console.log(
              `✅ ใช้ ${u.id}: ${tok} tokens รวม — ประมาณ $${usdPerMillionTotalTokens}/ล้าน token รวม → บันทึก cost_usd/cost_baht`
            );
            break;
          }
        } catch (e: any) {
          const msg = e?.message ?? String(e);
          console.error(`❌ ${u.id}:`, msg);
          usageStrategiesTried.push({ id: u.id, totalTokens: 0, error: msg.slice(0, 400) });
        }
      }

      if (parsedTotalFromCosts === 0 && !usageCompletionsStrategyUsed) {
        fallbackSkippedReason =
          'organization/costs = $0 และ organization/usage/completions ไม่มี token ในช่วงนี้ (หรือเรียกไม่สำเร็จ)';
        console.warn(`⚠️ ${fallbackSkippedReason}`);
      }
    }

    const nonZeroDays = records.filter((r) => r.cost_usd > 0).length;
    console.log(
      `📊 Summary [costs:${chosenModeId}${usageCompletionsStrategyUsed ? ` + usage:${usageCompletionsStrategyUsed}` : ''}]: ${records.length} วัน, วันที่มียอด >0: ${nonZeroDays}`
    );

    // Step 4: Get existing data from database to prevent overwriting non-zero values with zero
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get existing records for the date range
    const existingDates = records.map(r => r.date);
    const { data: existingData, error: fetchError } = await supabase
      .from('openai_costs')
      .select('date, cost_usd, cost_baht, sync_source')
      .in('date', existingDates);
    
    if (fetchError) {
      console.warn('⚠️ Could not fetch existing data:', fetchError.message);
    } else {
      console.log(`📋 Found ${existingData?.length || 0} existing records`);
    }
    
    // Create a map of existing data
    const existingMap = new Map<string, { cost_usd: number; cost_baht: number; sync_source: string | null }>();
    if (existingData) {
      existingData.forEach((item: any) => {
        existingMap.set(item.date, {
          cost_usd: item.cost_usd || 0,
          cost_baht: item.cost_baht || 0,
          sync_source: item.sync_source ?? null,
        });
      });
    }
    
    // Filter records: Don't overwrite non-zero values with zero
    const recordsToUpsert = records.filter(record => {
      const existing = existingMap.get(record.date);
      
      // If new value is 0 and existing value is not 0, skip this record
      if (record.cost_usd === 0 && existing && existing.cost_usd > 0) {
        console.log(`⏭️  Skipping ${record.date}: existing value $${existing.cost_usd.toFixed(4)} (฿${existing.cost_baht.toFixed(2)}), new value is 0`);
        return false;
      }

      // อย่าเขียนทับยอดจาก costs API ด้วยประมาณการจาก usage (ถ้ามีข้อมูลเดิมจาก costs)
      if (
        record.sync_source === 'usage_completions_api' &&
        existing?.sync_source === 'costs_api' &&
        existing.cost_usd > 0
      ) {
        console.log(`⏭️  Skipping ${record.date}: เก็บยอดจาก costs_api เดิม`);
        return false;
      }
      
      // If new value is not 0, always update
      if (record.cost_usd > 0) {
        console.log(`✅ Updating ${record.date}: $${record.cost_usd.toFixed(4)} (฿${record.cost_baht.toFixed(2)}) [${record.sync_source}]`);
        return true;
      }
      
      // If both are 0, update anyway (no harm)
      return true;
    });
    
    console.log(`💾 Will upsert ${recordsToUpsert.length} records (skipped ${records.length - recordsToUpsert.length} records with zero values)`);
    
    // Step 5: Save to Supabase (using upsert to avoid duplicates)
    const { data, error } = await supabase
      .from('openai_costs')
      .upsert(recordsToUpsert, { 
        onConflict: 'date',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('❌ Supabase error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save data to database',
          details: error.message 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    console.log(`✅ Saved ${data?.length || 0} records to database`);

    // Calculate totals (เหมือน API เดิม - logic ตรงกัน)
    const totalCostUSD = records.reduce((sum, x) => {
      const cost = typeof x.cost_usd === 'number' && !isNaN(x.cost_usd) ? x.cost_usd : 0;
      return sum + cost;
    }, 0);
    const totalCostBaht = records.reduce((sum, x) => {
      const cost = typeof x.cost_baht === 'number' && !isNaN(x.cost_baht) ? x.cost_baht : 0;
      return sum + cost;
    }, 0);

    // Ensure totals are valid numbers
    const safeTotalUSD = typeof totalCostUSD === 'number' && !isNaN(totalCostUSD) ? totalCostUSD : 0;
    const safeTotalBaht = typeof totalCostBaht === 'number' && !isNaN(totalCostBaht) ? totalCostBaht : 0;

    // Prepare raw data for frontend debugging (แสดงทุกวันจาก records ที่ใช้จริง)
    // สำหรับ debug ใน browser — ใส่ cost_usd ต่อวันชัดเจน (ไม่ต้องเดาจาก results ว่าง)
    const openAIRawData = records.map((record) => ({
      date: record.date,
      cost_usd: record.cost_usd,
      cost_baht: record.cost_baht,
      sync_source: record.sync_source,
      input_tokens: record.input_tokens,
      output_tokens: record.output_tokens,
      start_time: Math.floor(new Date(`${record.date}T00:00:00Z`).getTime() / 1000),
      results_count: record.cost_usd > 0 ? 1 : 0,
      results: record.cost_usd > 0
        ? [{ amount_value: record.cost_usd, amount_currency: 'usd' }]
        : []
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${records.length} days of data`,
        data: {
          recordsSynced: records.length,
          startDate: start_date,
          endDate: end_date,
          totalCostUSD: Number(safeTotalUSD.toFixed(4)),
          totalCostBaht: Number(safeTotalBaht.toFixed(2)),
          dataSource,
          diagnostics: {
            costsEndpoint: 'GET https://api.openai.com/v1/organization/costs',
            usageCompletionsEndpoint: 'GET https://api.openai.com/v1/organization/usage/completions',
            costsFetchStrategy: chosenModeId || null,
            strategiesTried: strategyTried,
            /** ยอดมาจากทั้ง org แต่ตั้ง OPENAI_PROJECT_ID ไว้ — โปรเจกต์อาจผิดหรือ usage ไม่ได้อยู่ในโปรเจกต์นั้น */
            orgWideUsedWhileProjectIdSet: projectScopeMismatch,
            firstBucketSample:
              costsApiSubtotalUSD === 0 && costBuckets.length > 0
                ? firstBucketZeroDebug(costBuckets)
                : null,
            costsApiSubtotalUSD: Number(costsApiSubtotalUSD.toFixed(4)),
            usageCompletionsStrategiesTried: usageStrategiesTried,
            usageCompletionsStrategyUsed: usageCompletionsStrategyUsed,
            /** ใช้เมื่อ costs=0 และดึงจาก usage/completions — ปรับได้ที่ OPENAI_USAGE_ESTIMATE_USD_PER_MTOK */
            usdPerMillionTotalTokensEstimate: usdPerMillionTotalTokens,
            /** ตัวแปร Deno: OPENAI_ADMIN_KEY ก่อน ถ้าไม่มีค่อย OPENAI_API_KEY */
            authorizationKeySource: openaiAdminKey ? 'OPENAI_ADMIN_KEY' : 'OPENAI_API_KEY',
            openaiOrgIdConfigured: Boolean(openaiOrgId),
            openaiProjectIdFilter: openaiProjectId || null,
            /** หมายเหตุ: /v1/dashboard/billing/usage (เว็บ) ต่างจาก organization/usage/* ที่ใช้ Admin key ได้ */
            dashboardSessionBillingNote:
              'organization/usage/completions ใช้จาก Edge ได้ — ไม่สับสนกับ billing ในเบราว์เซอร์',
            zeroTotalHint:
              safeTotalUSD === 0
                ? 'เช็ค OPENAI_ORG_ID (org_...) + Admin key / ดู strategiesTried + firstBucketSample / รอ delay'
                : projectScopeMismatch && dataSource === 'organization_costs'
                  ? 'ยอดนี้คำนวณจากทั้ง org (ไม่กรอง project) — แก้ OPENAI_PROJECT_ID ถ้าต้องการเฉพาะโปรเจกต์'
                  : dataSource === 'organization_usage_completions_estimated'
                    ? `ยอดเงินเป็นประมาณการจาก token (≈$${usdPerMillionTotalTokens}/ล้าน token รวม) — ปรับ OPENAI_USAGE_ESTIMATE_USD_PER_MTOK ได้`
                    : null,
            fallbackSkippedReason,
          },
          // Add OpenAI raw data for debugging (ทุกวัน)
          openAIRawData: openAIRawData,
          parsedRecords: records // ทุกวัน
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('❌ Error in openai-sync API:', error);
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Unknown error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
