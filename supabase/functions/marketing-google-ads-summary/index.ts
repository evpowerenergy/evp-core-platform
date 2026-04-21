/// <reference path="./deno.d.ts" />

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  "Access-Control-Max-Age": "86400",
};
function jsonResponse(body: string, status: number) {
  return new Response(body, {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function categorizeAd(name: string): "Package" | "Wholesales" | "Others" {
  const lower = (name || "").toLowerCase();
  if (lower.includes("package") || lower.includes("แพ็คเกจ")) return "Package";
  if (lower.includes("wholesale") || lower.includes("โฮลเซล") || lower.includes("wh")) return "Wholesales";
  return "Others";
}

async function getGoogleAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try {
      const j = JSON.parse(text);
      msg = j.error_description || j.error || text;
    } catch {}
    throw new Error(`OAuth: ${res.status} - ${msg}`);
  }
  const data = JSON.parse(text);
  return data.access_token;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }
    if (req.method !== "GET" && req.method !== "POST") {
      return jsonResponse(JSON.stringify({ success: false, error: "Method not allowed" }), 405);
    }

    const developerToken = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");
    const clientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_ADS_CLIENT_SECRET");
    const refreshToken = Deno.env.get("GOOGLE_ADS_REFRESH_TOKEN");
    const customerId = Deno.env.get("GOOGLE_ADS_CUSTOMER_ID");
    if (!developerToken || !clientId || !clientSecret || !refreshToken || !customerId) {
      return jsonResponse(
        JSON.stringify({ success: false, error: "Google Ads not configured", configured: false }),
        503
      );
    }

    let startDate: string;
    let endDate: string;
    let level: "campaign" | "account" = "campaign";
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      startDate = body.startDate ?? body.start_date ?? body.from ?? "";
      endDate = body.endDate ?? body.end_date ?? body.to ?? "";
      level = body.level === "account" ? "account" : "campaign";
    } else {
      const u = new URL(req.url);
      startDate = u.searchParams.get("startDate") ?? u.searchParams.get("from") ?? "";
      endDate = u.searchParams.get("endDate") ?? u.searchParams.get("to") ?? "";
      level = u.searchParams.get("level") === "account" ? "account" : "campaign";
    }
    if (!startDate || !endDate) {
      return jsonResponse(JSON.stringify({ success: false, error: "startDate and endDate required" }), 400);
    }

  const query =
    level === "account"
      ? `
        SELECT
          customer.id,
          customer.descriptive_name,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.ctr,
          metrics.average_cpc,
          metrics.cost_per_conversion,
          metrics.conversions_from_interactions_rate,
          segments.date
        FROM customer
        WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        AND metrics.impressions > 0
        ORDER BY segments.date DESC
      `
      : `
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.ctr,
          metrics.average_cpc,
          metrics.cost_per_conversion,
          metrics.conversions_from_interactions_rate,
          segments.date
        FROM campaign
        WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        AND campaign.status IN ('ENABLED', 'PAUSED', 'REMOVED')
        AND metrics.impressions > 0
        ORDER BY segments.date DESC
      `;

  try {
    const accessToken = await getGoogleAccessToken(clientId, clientSecret, refreshToken);
    const url = `https://googleads.googleapis.com/v21/customers/${customerId}/googleAds:search`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "developer-token": developerToken,
      },
      body: JSON.stringify({ query: query.trim() }),
    });
    const data = await res.json();
    if (data.error) {
      console.error("[marketing-google-ads-summary] Google Ads API error:", data.error);
      return jsonResponse(
        JSON.stringify({ success: false, error: data.error.message || "Google Ads API error" }),
        502
      );
    }
    if (!res.ok) {
      return jsonResponse(JSON.stringify({ success: false, error: `Google Ads API: ${res.status}` }), 502);
    }

    const results = data.results || [];
    let totalCost = 0,
      totalImpressions = 0,
      totalClicks = 0,
      totalConversions = 0,
      packageCost = 0,
      wholesalesCost = 0,
      othersCost = 0;
    let sumCtr = 0,
      sumCpc = 0,
      n = 0;

    for (const row of results) {
      const campaign = row.campaign || {};
      const metrics = row.metrics || {};
      const impressions = parseInt(metrics.impressions || "0", 10);
      const clicks = parseInt(metrics.clicks || "0", 10);
      const costMicros = parseFloat(metrics.costMicros || "0");
      const cost = costMicros / 1_000_000;
      const conversions = parseFloat(metrics.conversions || "0");
      const ctr = parseFloat(metrics.ctr || "0");
      const avgCpc = parseFloat(metrics.averageCpc || "0") / 1_000_000;
      const category =
        level === "account" ? "Others" : categorizeAd(campaign.name || "");
      totalCost += cost;
      totalImpressions += impressions;
      totalClicks += clicks;
      totalConversions += conversions;
      sumCtr += ctr;
      sumCpc += avgCpc;
      n += 1;
      switch (category) {
        case "Package":
          packageCost += cost;
          break;
        case "Wholesales":
          wholesalesCost += cost;
          break;
        default:
          othersCost += cost;
          break;
      }
    }

    const averageCtr = n > 0 ? sumCtr / n : 0;
    const averageCpc = n > 0 ? sumCpc / n : 0;
    const averageCpm = totalImpressions > 0 ? (totalCost / totalImpressions) * 1000 : 0;
    const costPerLead = totalConversions > 0 ? totalCost / totalConversions : null;

    const payload = {
      success: true,
      data: {
        totalCost,
        totalImpressions,
        totalClicks,
        totalConversions,
        averageCtr,
        averageCpc,
        averageCpm,
        packageCost,
        wholesalesCost,
        othersCost,
        costPerLead,
        roas: null,
      },
    };
    return jsonResponse(JSON.stringify(payload), 200);
  } catch (err) {
    console.error("[marketing-google-ads-summary] Error:", err);
    return jsonResponse(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Internal error" }),
      500
    );
  }
  } catch (err) {
    console.error("[marketing-google-ads-summary] Error:", err);
    return jsonResponse(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Internal error" }),
      500
    );
  }
});
