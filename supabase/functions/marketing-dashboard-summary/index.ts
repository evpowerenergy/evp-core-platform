/// <reference path="./deno.d.ts" />
// @ts-ignore - URL import is supported by Deno runtime
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  "Access-Control-Max-Age": "86400",
};

const MARKETING_ALLOWED_ROLES = new Set([
  "super_admin",
  "manager_marketing",
  "manager_sale",
  "manager_hr",
]);

type SalesDataResult = {
  totalSalesValue: number;
  salesCount: number;
  salesLeads: Array<{ leadId: number; totalQuotationAmount: number; totalQuotationCount: number }>;
};

type MarketingDashboardData = {
  totalSales: number | null;
  totalAdBudget: number;
  facebookAds: { total: number; package: number; wholesales: number; others: number };
  googleAds: { total: number; package: number; wholesales: number; others: number };
  adCostPerLead: number | null;
  totalNewLeads: number;
  package: {
    sales: number | null;
    newLeads: number;
    pkOutQt: number;
    totalQtDocuments: number;
    win: number;
    conversionRate: number | null;
    winRateQt: number | null;
  };
  wholesales: {
    sales: number | null;
    newLeads: number;
    whOutQt: number;
    totalQtDocuments: number;
    winQt: number;
    winRateQt: number | null;
    conversionRate: number | null;
  };
  totalInboxFromAds: number;
  inboxBreakdown: {
    packageMessages: number;
    packageCostPerMessage: number;
    wholesalesMessages: number;
    wholesalesCostPerMessage: number;
    otherMessages: number;
    otherCostPerMessage: number;
  };
  overallRoas: number | null;
  packageRoas: number | null;
  wholesalesRoas: number | null;
  meta: {
    dateFrom: string;
    dateTo: string;
    facebookApiConnected: boolean;
    googleApiConnected: boolean;
  };
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function formatBangkokRange(fromRaw: string, toRaw: string): {
  startDate: string;
  endDate: string;
  facebookStartDate: string;
  facebookEndDate: string;
} {
  const fromDate = new Date(fromRaw);
  const toDate = new Date(toRaw);
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const startDateString = formatter.format(fromDate);
  const endDateString = formatter.format(toDate);
  return {
    startDate: `${startDateString}T00:00:00.000`,
    endDate: `${endDateString}T23:59:59.999`,
    facebookStartDate: startDateString,
    facebookEndDate: endDateString,
  };
}

async function callEdgeFunction(
  supabaseUrl: string,
  serviceKey: string,
  name: string,
  body: Record<string, unknown>,
): Promise<any> {
  const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
    },
    body: JSON.stringify(body),
  });
  return res.json().catch(() => null);
}

async function getSalesDataInPeriod(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string,
  categoryFilter?: string | string[],
): Promise<SalesDataResult> {
  let salesLogsQuery = supabase
    .from("lead_productivity_logs")
    .select(`
      id,
      lead_id,
      sale_id,
      created_at_thai,
      leads!inner(
        id,
        sale_owner_id,
        category,
        platform,
        full_name,
        display_name,
        tel,
        line_id
      )
    `)
    .eq("status", "ปิดการขายแล้ว")
    .or("sale_chance_status.eq.win,and(sale_chance_status.eq.win + สินเชื่อ,credit_approval_status.eq.อนุมัติ)");

  if (startDate && endDate) {
    salesLogsQuery = salesLogsQuery
      .gte("created_at_thai", startDate)
      .lte("created_at_thai", endDate);
  }

  if (categoryFilter) {
    if (Array.isArray(categoryFilter)) {
      salesLogsQuery = salesLogsQuery.in("leads.category", categoryFilter);
    } else {
      salesLogsQuery = salesLogsQuery.eq("leads.category", categoryFilter);
    }
  }

  const { data: salesLogs, error: salesLogsError } = await salesLogsQuery;
  if (salesLogsError) throw salesLogsError;

  const logIds = salesLogs?.map((log) => log.id) || [];
  let quotations: Array<{
    amount: number | string | null;
    productivity_log_id: number;
    document_number: string | null;
    created_at_thai: string;
  }> = [];

  if (logIds.length > 0) {
    const CHUNK_SIZE = 200;
    for (let i = 0; i < logIds.length; i += CHUNK_SIZE) {
      const chunk = logIds.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabase
        .from("quotation_documents")
        .select("amount, productivity_log_id, document_number, created_at_thai")
        .in("productivity_log_id", chunk)
        .eq("document_type", "quotation");
      if (error) throw error;
      if (data) quotations = quotations.concat(data);
    }
  }

  const salesLeads = (salesLogs || [])
    .map((log) => {
      const logQuotations = quotations.filter((q) => q.productivity_log_id === log.id);
      const uniqueQuotationsMap = new Map<string, typeof logQuotations[0]>();
      for (const q of logQuotations) {
        const normalized = (q.document_number || "").toLowerCase().replace(/\s+/g, "");
        const key = `${log.id}_${normalized}`;
        const existing = uniqueQuotationsMap.get(key);
        if (!existing || new Date(q.created_at_thai) > new Date(existing.created_at_thai)) {
          uniqueQuotationsMap.set(key, q);
        }
      }
      const uniqueQuotations = Array.from(uniqueQuotationsMap.values());
      const totalQuotationAmount = uniqueQuotations.reduce(
        (sum, q) => sum + (parseFloat(String(q.amount || 0)) || 0),
        0,
      );
      return {
        leadId: log.lead_id as number,
        totalQuotationAmount,
        totalQuotationCount: uniqueQuotations.length,
      };
    })
    .filter((row) => row.totalQuotationCount > 0);

  const totalSalesValue = salesLeads.reduce((sum, lead) => sum + lead.totalQuotationAmount, 0);
  const salesCount = salesLeads.reduce((sum, lead) => sum + lead.totalQuotationCount, 0);

  return { totalSalesValue, salesCount, salesLeads };
}

async function countUniqueQuotationsForCategories(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string,
  categories: string[],
): Promise<number> {
  let logsQuery = supabase
    .from("lead_productivity_logs")
    .select(`
      id,
      lead_id,
      created_at_thai,
      leads!inner(id, category)
    `);

  if (categories.length === 1) {
    logsQuery = logsQuery.eq("leads.category", categories[0]);
  } else {
    logsQuery = logsQuery.in("leads.category", categories);
  }

  if (startDate && endDate) {
    logsQuery = logsQuery.gte("created_at_thai", startDate).lte("created_at_thai", endDate);
  }

  const { data: logs, error: logsError } = await logsQuery;
  if (logsError) throw logsError;

  const logIds = logs?.map((log) => log.id) || [];
  if (logIds.length === 0) return 0;

  const { data: quotations, error: quotationsError } = await supabase
    .from("quotation_documents")
    .select("document_number")
    .in("productivity_log_id", logIds)
    .eq("document_type", "quotation");

  if (quotationsError) throw quotationsError;

  const unique = new Set(
    (quotations || [])
      .map((q) => (q.document_number || "").toLowerCase().replace(/\s+/g, ""))
      .filter(Boolean),
  );
  return unique.size;
}

async function countNewLeads(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string,
  category?: string | string[],
): Promise<number> {
  let query = supabase
    .from("leads")
    .select("id, platform, category")
    .eq("has_contact_info", true);

  if (category) {
    if (Array.isArray(category)) {
      query = query.in("category", category);
    } else {
      query = query.eq("category", category);
    }
  }

  if (startDate && endDate) {
    query = query.gte("created_at_thai", startDate).lte("created_at_thai", endDate);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).filter((lead) => lead.platform && String(lead.platform).trim() !== "").length;
}

function calculateInboxData(facebookAdsData: any): {
  totalMessages: number;
  packageMessages: number;
  wholesalesMessages: number;
  otherMessages: number;
  packageCostPerMessage: number;
  wholesalesCostPerMessage: number;
  otherCostPerMessage: number;
} {
  const totalMessagingConversations = facebookAdsData?.totalMessagingConversations || 0;
  const totalSpend = facebookAdsData?.totalSpend || 0;

  let packageMessages = facebookAdsData?.packageMessagingConversations || 0;
  let wholesalesMessages = facebookAdsData?.wholesalesMessagingConversations || 0;
  let otherMessages = facebookAdsData?.othersMessagingConversations || 0;

  if (totalMessagingConversations === 0) {
    const totalResults = facebookAdsData?.totalResults || 0;
    const totalClicks = facebookAdsData?.totalClicks || 0;
    const totalInteractions = totalResults > 0
      ? totalResults
      : (totalClicks > 0 ? totalClicks : Math.round((facebookAdsData?.totalImpressions || 0) / 100));

    const packageSpendRatio = totalSpend > 0 ? (facebookAdsData?.packageSpend || 0) / totalSpend : 0;
    const wholesalesSpendRatio = totalSpend > 0 ? (facebookAdsData?.wholesalesSpend || 0) / totalSpend : 0;
    const othersSpendRatio = totalSpend > 0 ? (facebookAdsData?.othersSpend || 0) / totalSpend : 0;

    packageMessages = Math.round(totalInteractions * packageSpendRatio);
    wholesalesMessages = Math.round(totalInteractions * wholesalesSpendRatio);
    otherMessages = Math.round(totalInteractions * othersSpendRatio);
  }

  return {
    totalMessages: totalMessagingConversations > 0
      ? totalMessagingConversations
      : (packageMessages + wholesalesMessages + otherMessages),
    packageMessages,
    wholesalesMessages,
    otherMessages,
    packageCostPerMessage: packageMessages > 0 ? (facebookAdsData?.packageSpend || 0) / packageMessages : 0,
    wholesalesCostPerMessage: wholesalesMessages > 0
      ? (facebookAdsData?.wholesalesSpend || 0) / wholesalesMessages
      : 0,
    otherCostPerMessage: otherMessages > 0 ? (facebookAdsData?.othersSpend || 0) / otherMessages : 0,
  };
}

async function verifyUserRole(
  supabase: SupabaseClient,
  authHeader: string | null,
  serviceKey: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: true };
  }

  const token = authHeader.replace("Bearer ", "").trim();
  // Backend AI assistant and internal calls use service role key
  if (token === serviceKey) {
    return { ok: true };
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { ok: false, error: "Unauthorized" };
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = (employee?.role || "").toLowerCase().trim();
  if (role && !MARKETING_ALLOWED_ROLES.has(role)) {
    return { ok: false, error: "Forbidden: insufficient role for marketing dashboard" };
  }

  return { ok: true };
}

async function buildDashboard(
  supabase: SupabaseClient,
  supabaseUrl: string,
  serviceKey: string,
  startDate: string,
  endDate: string,
  facebookStartDate: string,
  facebookEndDate: string,
): Promise<MarketingDashboardData> {
  const [
    totalSalesData,
    packageSalesData,
    wholesaleSalesData,
    wholesalesSalesData,
    leadsFromEdgeFunction,
    facebookResult,
    googleResult,
    packageTotalQuotations,
    wholesalesTotalQuotations,
    totalNewLeads,
    packageNewLeadsCount,
    wholesalesNewLeadsCount,
  ] = await Promise.all([
    getSalesDataInPeriod(supabase, startDate, endDate),
    getSalesDataInPeriod(supabase, startDate, endDate, "Package"),
    getSalesDataInPeriod(supabase, startDate, endDate, "Wholesale"),
    getSalesDataInPeriod(supabase, startDate, endDate, "Wholesales"),
    callEdgeFunction(supabaseUrl, serviceKey, "core-leads-leads-for-dashboard", {
      from: startDate,
      to: endDate,
    }),
    callEdgeFunction(supabaseUrl, serviceKey, "marketing-facebook-ads-summary", {
      startDate: facebookStartDate,
      endDate: facebookEndDate,
    }),
    callEdgeFunction(supabaseUrl, serviceKey, "marketing-google-ads-summary", {
      startDate: facebookStartDate,
      endDate: facebookEndDate,
      level: "campaign",
    }),
    countUniqueQuotationsForCategories(supabase, startDate, endDate, ["Package"]),
    countUniqueQuotationsForCategories(supabase, startDate, endDate, ["Wholesale", "Wholesales"]),
    countNewLeads(supabase, startDate, endDate),
    countNewLeads(supabase, startDate, endDate, "Package"),
    countNewLeads(supabase, startDate, endDate, ["Wholesale", "Wholesales"]),
  ]);

  const wholesalesData = {
    totalSalesValue: (wholesaleSalesData.totalSalesValue || 0) + (wholesalesSalesData.totalSalesValue || 0),
    salesCount: (wholesaleSalesData.salesCount || 0) + (wholesalesSalesData.salesCount || 0),
    salesLeads: [...wholesaleSalesData.salesLeads, ...wholesalesSalesData.salesLeads],
  };

  const facebookAdsData = facebookResult?.success ? facebookResult.data : null;
  const googleAdsData = googleResult?.success ? googleResult.data : null;
  const facebookApiConnected = !!facebookAdsData;
  const googleApiConnected = !!googleAdsData;

  const inboxData = facebookAdsData ? calculateInboxData(facebookAdsData) : {
    totalMessages: 0,
    packageMessages: 0,
    wholesalesMessages: 0,
    otherMessages: 0,
    packageCostPerMessage: 0,
    wholesalesCostPerMessage: 0,
    otherCostPerMessage: 0,
  };

  const edgeLeads = leadsFromEdgeFunction?.success ? (leadsFromEdgeFunction.data || []) : [];
  const packageLeadsFromEdgeFunction = edgeLeads.filter((lead: any) => lead.category === "Package");
  const wholesalesLeadsFromEdgeFunction = edgeLeads.filter((lead: any) =>
    lead.category === "Wholesale" || lead.category === "Wholesales"
  );

  const packageClosedLeadIds = new Set(packageSalesData.salesLeads.map((lead) => lead.leadId));
  const wholesalesClosedLeadIds = new Set(wholesalesData.salesLeads.map((lead) => lead.leadId));

  const packageConversionRate = packageLeadsFromEdgeFunction.length > 0
    ? (packageClosedLeadIds.size / packageLeadsFromEdgeFunction.length) * 100
    : null;
  const wholesalesConversionRate = wholesalesLeadsFromEdgeFunction.length > 0
    ? (wholesalesClosedLeadIds.size / wholesalesLeadsFromEdgeFunction.length) * 100
    : null;

  const packageWin = packageSalesData.salesCount || 0;
  const wholesalesWinQt = wholesalesData.salesCount || 0;

  const packageWinRateQt = packageTotalQuotations > 0 ? (packageWin / packageTotalQuotations) * 100 : 0;
  const wholesalesWinRateQt = wholesalesTotalQuotations > 0
    ? (wholesalesWinQt / wholesalesTotalQuotations) * 100
    : 0;

  const packagePkOutQt = Math.max(0, packageTotalQuotations - packageWin);
  const wholesalesWhOutQt = Math.max(0, wholesalesTotalQuotations - wholesalesWinQt);

  const facebookSpend = facebookAdsData?.totalSpend || 0;
  const googleSpend = googleAdsData?.totalCost || 0;
  const totalAdBudget = facebookSpend + googleSpend;

  const adCostPerLead = totalAdBudget > 0 && totalNewLeads > 0 ? totalAdBudget / totalNewLeads : null;
  const overallRoas = totalAdBudget > 0 ? ((totalSalesData.totalSalesValue || 0) / totalAdBudget) * 100 : null;

  const packageTotalSpend = (facebookAdsData?.packageSpend || 0) + (googleAdsData?.packageCost || 0);
  const wholesalesTotalSpend = (facebookAdsData?.wholesalesSpend || 0) + (googleAdsData?.wholesalesCost || 0);

  const packageRoas = packageTotalSpend > 0
    ? ((packageSalesData.totalSalesValue || 0) / packageTotalSpend) * 100
    : null;
  const wholesalesRoas = wholesalesTotalSpend > 0
    ? ((wholesalesData.totalSalesValue || 0) / wholesalesTotalSpend) * 100
    : null;

  return {
    totalSales: totalSalesData.totalSalesValue,
    totalAdBudget,
    facebookAds: facebookAdsData
      ? {
        total: facebookAdsData.totalSpend,
        package: facebookAdsData.packageSpend,
        wholesales: facebookAdsData.wholesalesSpend,
        others: facebookAdsData.othersSpend,
      }
      : { total: 0, package: 0, wholesales: 0, others: 0 },
    googleAds: googleAdsData
      ? {
        total: googleAdsData.totalCost,
        package: googleAdsData.packageCost,
        wholesales: googleAdsData.wholesalesCost,
        others: googleAdsData.othersCost,
      }
      : { total: 0, package: 0, wholesales: 0, others: 0 },
    adCostPerLead,
    totalNewLeads,
    overallRoas,
    packageRoas,
    wholesalesRoas,
    package: {
      sales: packageSalesData.totalSalesValue,
      newLeads: packageNewLeadsCount,
      pkOutQt: packagePkOutQt,
      totalQtDocuments: packagePkOutQt + packageWin,
      win: packageWin,
      conversionRate: packageConversionRate,
      winRateQt: packageWinRateQt,
    },
    wholesales: {
      sales: wholesalesData.totalSalesValue,
      newLeads: wholesalesNewLeadsCount,
      whOutQt: wholesalesWhOutQt,
      totalQtDocuments: wholesalesWhOutQt + wholesalesWinQt,
      winQt: wholesalesWinQt,
      winRateQt: wholesalesWinRateQt,
      conversionRate: wholesalesConversionRate,
    },
    totalInboxFromAds: inboxData.totalMessages,
    inboxBreakdown: {
      packageMessages: inboxData.packageMessages,
      packageCostPerMessage: inboxData.packageCostPerMessage,
      wholesalesMessages: inboxData.wholesalesMessages,
      wholesalesCostPerMessage: inboxData.wholesalesCostPerMessage,
      otherMessages: inboxData.otherMessages,
      otherCostPerMessage: inboxData.otherCostPerMessage,
    },
    meta: {
      dateFrom: startDate,
      dateTo: endDate,
      facebookApiConnected,
      googleApiConnected,
    },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_ANON_KEY") ||
      Deno.env.get("VITE_SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceKey) {
      return jsonResponse({ success: false, error: "Supabase configuration missing" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const authCheck = await verifyUserRole(supabase, req.headers.get("Authorization"), serviceKey);
    if (!authCheck.ok) {
      return jsonResponse({ success: false, error: authCheck.error }, authCheck.error === "Unauthorized" ? 401 : 403);
    }

    let startDateRaw = "";
    let endDateRaw = "";

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      startDateRaw = body.startDate ?? body.date_from ?? body.from ?? "";
      endDateRaw = body.endDate ?? body.date_to ?? body.to ?? "";
    } else {
      const url = new URL(req.url);
      startDateRaw = url.searchParams.get("startDate") ?? url.searchParams.get("from") ?? "";
      endDateRaw = url.searchParams.get("endDate") ?? url.searchParams.get("to") ?? "";
    }

    if (!startDateRaw || !endDateRaw) {
      return jsonResponse({ success: false, error: "startDate and endDate are required" }, 400);
    }

    const { startDate, endDate, facebookStartDate, facebookEndDate } = formatBangkokRange(
      startDateRaw,
      endDateRaw,
    );

    const data = await buildDashboard(
      supabase,
      supabaseUrl,
      serviceKey,
      startDate,
      endDate,
      facebookStartDate,
      facebookEndDate,
    );

    return jsonResponse({ success: true, data });
  } catch (err) {
    console.error("[marketing-dashboard-summary] Error:", err);
    return jsonResponse({
      success: false,
      error: err instanceof Error ? err.message : "Internal error",
    }, 500);
  }
});
