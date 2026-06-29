/// <reference path="./deno.d.ts" />

/**
 * Edge Function: ดึงรายการ Ads + Creatives จาก Facebook Marketing API
 * ใช้ Secrets: FACEBOOK_ACCESS_TOKEN, FACEBOOK_AD_ACCOUNT_ID
 * Response ใช้ sync ลงตาราง ads_campaigns (ฝั่ง client ทำ upsert)
 */

import {
  fetchAllAdsFromFacebook,
  parseFacebookAccountsFromEnv,
  type StatusFilter,
} from "../_shared/facebookAdsSync.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(body: string, status: number, headers?: Record<string, string>) {
  return new Response(body, {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...headers },
  });
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }
    if (req.method !== "POST" && req.method !== "GET") {
      return jsonResponse(JSON.stringify({ success: false, error: "Method not allowed" }), 405);
    }

    const accountConfigs = parseFacebookAccountsFromEnv();
    if (accountConfigs.length === 0) {
      return jsonResponse(
        JSON.stringify({ success: false, error: "Facebook API not configured", configured: false }),
        503
      );
    }

    let statusFilter: StatusFilter = "all";
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const f = body.statusFilter ?? body.status_filter;
      if (f === "active" || f === "inactive") statusFilter = f;
    }

    const allAds = await fetchAllAdsFromFacebook(accountConfigs, statusFilter);

    const payload = {
      success: true,
      ads: allAds,
      captionFetchResult: {
        success: false,
        total: 0,
        enriched: 0,
        source: "edge_function",
      },
      accountCount: accountConfigs.length,
    };

    return jsonResponse(JSON.stringify(payload), 200);
  } catch (err) {
    console.error("[marketing-facebook-ads-sync] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message.includes("Facebook API") ? 502 : 500;
    return jsonResponse(
      JSON.stringify({
        success: false,
        error: message,
      }),
      status
    );
  }
});
