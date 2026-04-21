/// <reference path="./deno.d.ts" />

/**
 * Edge Function: ดึงรายการ Ads + Creatives จาก Facebook Marketing API
 * ใช้ Secrets: FACEBOOK_ACCESS_TOKEN, FACEBOOK_AD_ACCOUNT_ID
 * Response ใช้ sync ลงตาราง ads_campaigns (ฝั่ง client ทำ upsert)
 */

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

type FacebookAccountConfig = {
  adAccountId: string;
  accessToken: string;
};

function parseFacebookAccountsFromEnv(): FacebookAccountConfig[] {
  const sharedAccessToken = (Deno.env.get("FACEBOOK_ACCESS_TOKEN") || "").trim();
  const adAccountIdsRaw = Deno.env.get("FACEBOOK_AD_ACCOUNT_IDS");
  if (sharedAccessToken && adAccountIdsRaw) {
    const ids = adAccountIdsRaw
      .split(",")
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
    if (ids.length > 0) {
      return ids.map((adAccountId) => ({ adAccountId, accessToken: sharedAccessToken }));
    }
  }

  const raw = Deno.env.get("FACEBOOK_AD_ACCOUNTS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const accounts = parsed
          .filter((x) => x && typeof x === "object")
          .map((x) => ({
            adAccountId: String((x as { adAccountId?: string }).adAccountId || "").trim(),
            accessToken: String((x as { accessToken?: string }).accessToken || "").trim(),
          }))
          .filter((x) => x.adAccountId.length > 0 && x.accessToken.length > 0);
        if (accounts.length > 0) return accounts;
      }
    } catch (_err) {
      console.warn("[marketing-facebook-ads-sync] Invalid FACEBOOK_AD_ACCOUNTS JSON, fallback to single account env");
    }
  }

  const accessToken = sharedAccessToken || Deno.env.get("FACEBOOK_ACCESS_TOKEN");
  const adAccountId = Deno.env.get("FACEBOOK_AD_ACCOUNT_ID");
  if (!accessToken || !adAccountId) return [];
  return [{ adAccountId, accessToken }];
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

    let statusFilter: "all" | "active" | "inactive" = "all";
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const f = body.statusFilter ?? body.status_filter;
      if (f === "active" || f === "inactive") statusFilter = f;
    }

    const fields = [
      "id", "name", "status", "campaign_id",
      "campaign{id,name,status,start_time,stop_time}",
      "adset_id", "adset{id,name}",
      "creative{image_url,thumbnail_url,title,body,effective_object_story_id}",
      "created_time", "updated_time",
    ].join(",");

    const allAds: any[] = [];
    const baseUrl = `https://graph.facebook.com/v23.0`;

    for (const account of accountConfigs) {
      const params = new URLSearchParams({
        access_token: account.accessToken,
        fields,
        limit: "100",
      });

      if (statusFilter !== "all") {
        const statusValues = statusFilter === "active"
          ? ["ACTIVE"]
          : ["PAUSED", "DISAPPROVED", "PENDING_REVIEW", "WITH_ISSUES"];
        params.append(
          "filtering",
          JSON.stringify([{ field: "ad.effective_status", operator: "IN", value: statusValues }])
        );
      }

      let nextUrl: string | null = `${baseUrl}/act_${account.adAccountId}/ads?${params}`;
      while (nextUrl) {
        const res = await fetch(nextUrl);
        const data = await res.json();

        if (data.error) {
          console.error("[marketing-facebook-ads-sync] Facebook API error:", data.error);
          return jsonResponse(
            JSON.stringify({ success: false, error: data.error.message || "Facebook API error" }),
            502
          );
        }
        if (!res.ok) {
          return jsonResponse(
            JSON.stringify({ success: false, error: `Facebook API: ${res.status}` }),
            502
          );
        }

        if (data.data && data.data.length > 0) {
          allAds.push(
            ...data.data.map((ad: any) => ({
              ...ad,
              __ad_account_id: account.adAccountId,
            }))
          );
        }

        nextUrl = data.paging?.next || null;
        if (allAds.length >= 5000) break;
      }
    }

    const payload = {
      success: true,
      ads: allAds,
      captionFetchResult: {
        success: false,
        total: 0,
        enriched: 0,
        source: "edge_function", // Sync มาจาก API — ไม่ต้องแสดง toast เตือนเรื่อง env
      },
      accountCount: accountConfigs.length,
    };

    return jsonResponse(JSON.stringify(payload), 200);
  } catch (err) {
    console.error("[marketing-facebook-ads-sync] Error:", err);
    return jsonResponse(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Internal error",
      }),
      500
    );
  }
});
