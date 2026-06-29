/// <reference path="./deno.d.ts" />

import {
  getGoogleAdsAccessToken,
  isOAuthAuthError,
  loadGoogleAdsAuthConfig,
} from "../_shared/googleAdsAuth.ts";

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

function buildQuery(
  level: "campaign" | "account",
  startDate: string,
  endDate: string,
): string {
  if (level === "account") {
    return `
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
    `;
  }
  return `
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
}

interface AggregatedMetrics {
  totalCost: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  packageCost: number;
  wholesalesCost: number;
  othersCost: number;
  sumCtr: number;
  sumCpc: number;
  rowCount: number;
}

function emptyAggregate(): AggregatedMetrics {
  return {
    totalCost: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0,
    packageCost: 0,
    wholesalesCost: 0,
    othersCost: 0,
    sumCtr: 0,
    sumCpc: 0,
    rowCount: 0,
  };
}

function aggregateRow(
  agg: AggregatedMetrics,
  row: Record<string, unknown>,
  level: "campaign" | "account",
): void {
  const campaign = (row.campaign || {}) as Record<string, string>;
  const metrics = (row.metrics || {}) as Record<string, string>;
  const impressions = parseInt(metrics.impressions || "0", 10);
  const clicks = parseInt(metrics.clicks || "0", 10);
  const cost = parseFloat(metrics.costMicros || "0") / 1_000_000;
  const conversions = parseFloat(metrics.conversions || "0");
  const ctr = parseFloat(metrics.ctr || "0");
  const avgCpc = parseFloat(metrics.averageCpc || "0") / 1_000_000;
  const category =
    level === "account" ? "Others" : categorizeAd(campaign.name || "");

  agg.totalCost += cost;
  agg.totalImpressions += impressions;
  agg.totalClicks += clicks;
  agg.totalConversions += conversions;
  agg.sumCtr += ctr;
  agg.sumCpc += avgCpc;
  agg.rowCount += 1;

  switch (category) {
    case "Package":
      agg.packageCost += cost;
      break;
    case "Wholesales":
      agg.wholesalesCost += cost;
      break;
    default:
      agg.othersCost += cost;
      break;
  }
}

function toSummaryPayload(agg: AggregatedMetrics) {
  const averageCtr = agg.rowCount > 0 ? agg.sumCtr / agg.rowCount : 0;
  const averageCpc = agg.rowCount > 0 ? agg.sumCpc / agg.rowCount : 0;
  const averageCpm =
    agg.totalImpressions > 0 ? (agg.totalCost / agg.totalImpressions) * 1000 : 0;
  const costPerLead =
    agg.totalConversions > 0 ? agg.totalCost / agg.totalConversions : null;

  return {
    totalCost: agg.totalCost,
    totalImpressions: agg.totalImpressions,
    totalClicks: agg.totalClicks,
    totalConversions: agg.totalConversions,
    averageCtr,
    averageCpc,
    averageCpm,
    packageCost: agg.packageCost,
    wholesalesCost: agg.wholesalesCost,
    othersCost: agg.othersCost,
    costPerLead,
    roas: null,
  };
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }
    if (req.method !== "GET" && req.method !== "POST") {
      return jsonResponse(JSON.stringify({ success: false, error: "Method not allowed" }), 405);
    }

    const authConfig = loadGoogleAdsAuthConfig();
    if (!authConfig) {
      return jsonResponse(
        JSON.stringify({ success: false, error: "Google Ads not configured", configured: false }),
        503,
      );
    }

    let startDate: string;
    let endDate: string;
    let level: "campaign" | "account" = "campaign";
    let groupBy: "date" | null = null;

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      startDate = body.startDate ?? body.start_date ?? body.from ?? "";
      endDate = body.endDate ?? body.end_date ?? body.to ?? "";
      level = body.level === "account" ? "account" : "campaign";
      groupBy = body.groupBy === "date" ? "date" : null;
    } else {
      const u = new URL(req.url);
      startDate = u.searchParams.get("startDate") ?? u.searchParams.get("from") ?? "";
      endDate = u.searchParams.get("endDate") ?? u.searchParams.get("to") ?? "";
      level = u.searchParams.get("level") === "account" ? "account" : "campaign";
      groupBy = u.searchParams.get("groupBy") === "date" ? "date" : null;
    }

    if (!startDate || !endDate) {
      return jsonResponse(
        JSON.stringify({ success: false, error: "startDate and endDate required" }),
        400,
      );
    }

    try {
      const accessToken = await getGoogleAdsAccessToken(authConfig);
      const url =
        `https://googleads.googleapis.com/v21/customers/${authConfig.customerId}/googleAds:search`;
      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "developer-token": authConfig.developerToken,
      };
      if (authConfig.loginCustomerId) {
        headers["login-customer-id"] = authConfig.loginCustomerId;
      }

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ query: buildQuery(level, startDate, endDate).trim() }),
      });
      const data = await res.json();
      if (data.error) {
        console.error("[marketing-google-ads-summary] Google Ads API error:", data.error);
        return jsonResponse(
          JSON.stringify({
            success: false,
            error: data.error.message || "Google Ads API error",
            googleAdsError: {
              code: data.error.code,
              status: data.error.status,
              details: data.error.details,
            },
          }),
          502,
        );
      }
      if (!res.ok) {
        return jsonResponse(
          JSON.stringify({ success: false, error: `Google Ads API: ${res.status}` }),
          502,
        );
      }

      const results = (data.results || []) as Record<string, unknown>[];
      const overall = emptyAggregate();

      if (groupBy === "date") {
        const byDate = new Map<string, AggregatedMetrics>();
        for (const row of results) {
          const segments = (row.segments || {}) as Record<string, string>;
          const date = segments.date || "";
          if (!date) continue;
          const daily = byDate.get(date) ?? emptyAggregate();
          aggregateRow(daily, row, level);
          byDate.set(date, daily);

          aggregateRow(overall, row, level);
        }

        const daily = Array.from(byDate.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, agg]) => ({ date, ...toSummaryPayload(agg) }));

        return jsonResponse(
          JSON.stringify({
            success: true,
            authMode: authConfig.mode,
            data: {
              ...toSummaryPayload(overall),
              daily,
            },
          }),
          200,
        );
      }

      for (const row of results) {
        aggregateRow(overall, row, level);
      }

      return jsonResponse(
        JSON.stringify({
          success: true,
          authMode: authConfig.mode,
          data: toSummaryPayload(overall),
        }),
        200,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal error";
      console.error("[marketing-google-ads-summary] Error:", err);
      const status = isOAuthAuthError(message) ? 401 : 500;
      return jsonResponse(JSON.stringify({ success: false, error: message }), status);
    }
  } catch (err) {
    console.error("[marketing-google-ads-summary] Error:", err);
    return jsonResponse(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Internal error",
      }),
      500,
    );
  }
});
