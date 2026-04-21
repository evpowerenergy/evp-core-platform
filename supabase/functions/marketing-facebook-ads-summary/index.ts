/// <reference path="./deno.d.ts" />

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

function categorizeAd(name: string): "Package" | "Wholesales" | "Others" {
  const lower = (name || "").toLowerCase();
  if (lower.includes("package") || lower.includes("แพ็คเกจ") || lower.includes("inbox")) return "Package";
  if (lower.includes("wholesale") || lower.includes("โฮลเซล") || lower.includes("wh")) return "Wholesales";
  return "Others";
}

function getMessagingFromActions(actions: Array<{ action_type?: string; value?: string }> | undefined): number {
  if (!actions || !Array.isArray(actions)) return 0;
  const m = actions.find((a) => a.action_type === "onsite_conversion.messaging_conversation_started_7d");
  return m ? parseFloat(m.value || "0") : 0;
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
      console.warn("[marketing-facebook-ads-summary] Invalid FACEBOOK_AD_ACCOUNTS JSON, fallback to single account env");
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
    if (req.method !== "GET" && req.method !== "POST") {
      return jsonResponse(JSON.stringify({ success: false, error: "Method not allowed" }), 405);
    }

    const accountConfigs = parseFacebookAccountsFromEnv();
    if (accountConfigs.length === 0) {
      return jsonResponse(
        JSON.stringify({ success: false, error: "Facebook Ads not configured", configured: false }),
        503
      );
    }

    let startDate: string;
    let endDate: string;
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      startDate = body.startDate ?? body.start_date ?? body.from ?? "";
      endDate = body.endDate ?? body.end_date ?? body.to ?? "";
    } else {
      const u = new URL(req.url);
      startDate = u.searchParams.get("startDate") ?? u.searchParams.get("from") ?? "";
      endDate = u.searchParams.get("endDate") ?? u.searchParams.get("to") ?? "";
    }
    if (!startDate || !endDate) {
      return jsonResponse(JSON.stringify({ success: false, error: "startDate and endDate required" }), 400);
    }

  const fields = [
    "campaign_id", "campaign_name", "adset_id", "adset_name", "ad_id", "ad_name",
    "impressions", "clicks", "spend", "reach", "frequency", "cpm", "cpc", "ctr",
    "cost_per_result", "results", "result_rate", "date_start", "date_stop",
    "actions",
  ].join(",");
  const timeRange = JSON.stringify({ since: startDate, until: endDate });

  try {
    const rows: any[] = [];
    for (const account of accountConfigs) {
      const params = new URLSearchParams({
        access_token: account.accessToken,
        fields,
        time_range: timeRange,
        level: "ad",
        limit: "1000",
      });
      const url = `https://graph.facebook.com/v23.0/act_${account.adAccountId}/insights?${params}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) {
        console.error("[marketing-facebook-ads-summary] Facebook API error:", data.error);
        return jsonResponse(
          JSON.stringify({ success: false, error: data.error.message || "Facebook API error" }),
          502
        );
      }
      if (!res.ok) {
        return jsonResponse(JSON.stringify({ success: false, error: `Facebook API: ${res.status}` }), 502);
      }
      const accountRows = Array.isArray(data.data) ? data.data : [];
      for (const row of accountRows) {
        rows.push({
          ...row,
          __ad_account_id: account.adAccountId,
        });
      }
    }

    let totalSpend = 0,
      totalImpressions = 0,
      totalClicks = 0,
      totalResults = 0,
      totalMessaging = 0,
      packageSpend = 0,
      packageMessaging = 0,
      wholesalesSpend = 0,
      wholesalesMessaging = 0,
      othersSpend = 0,
      othersMessaging = 0;
    let sumCtr = 0,
      sumCpc = 0,
      sumCpm = 0,
      n = 0;

    for (const item of rows) {
      const spend = parseFloat(item.spend || "0");
      const impressions = parseFloat(item.impressions || "0");
      const clicks = parseFloat(item.clicks || "0");
      const results = parseFloat(item.results || "0");
      const ctr = parseFloat(item.ctr || "0");
      const cpc = parseFloat(item.cpc || "0");
      const cpm = parseFloat(item.cpm || "0");
      const messaging = getMessagingFromActions(item.actions);
      const category = categorizeAd(item.campaign_name || item.ad_name || "");

      totalSpend += spend;
      totalImpressions += impressions;
      totalClicks += clicks;
      totalResults += results;
      totalMessaging += messaging;
      sumCtr += ctr;
      sumCpc += cpc;
      sumCpm += cpm;
      n += 1;

      switch (category) {
        case "Package":
          packageSpend += spend;
          packageMessaging += messaging;
          break;
        case "Wholesales":
          wholesalesSpend += spend;
          wholesalesMessaging += messaging;
          break;
        default:
          othersSpend += spend;
          othersMessaging += messaging;
          break;
      }
    }

    const avgCtr = n > 0 ? sumCtr / n : 0;
    const avgCpc = n > 0 ? sumCpc / n : 0;
    const avgCpm = n > 0 ? sumCpm / n : 0;
    const costPerLead = totalResults > 0 ? totalSpend / totalResults : null;

    const payload = {
      success: true,
      data: {
        totalSpend,
        totalImpressions,
        totalClicks,
        totalResults,
        averageCtr: avgCtr,
        averageCpc: avgCpc,
        averageCpm: avgCpm,
        packageSpend,
        wholesalesSpend,
        othersSpend,
        costPerLead,
        roas: null,
        totalMessagingConversations: totalMessaging,
        packageMessagingConversations: packageMessaging,
        wholesalesMessagingConversations: wholesalesMessaging,
        othersMessagingConversations: othersMessaging,
        accountCount: accountConfigs.length,
      },
    };
    return jsonResponse(JSON.stringify(payload), 200);
  } catch (err) {
    console.error("[marketing-facebook-ads-summary] Error:", err);
    return jsonResponse(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Internal error" }),
      500
    );
  }
  } catch (err) {
    console.error("[marketing-facebook-ads-summary] Error:", err);
    return jsonResponse(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Internal error" }),
      500
    );
  }
});
