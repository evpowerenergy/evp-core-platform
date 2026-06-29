/// <reference path="./deno.d.ts" />
// @ts-ignore - URL import is supported by Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  enrichAdsWithCaptions,
  fetchAllAdsFromFacebook,
  insertSyncRun,
  mapFacebookAdToRow,
  parseFacebookAccountsFromEnv,
  parseFacebookPagesFromEnv,
  upsertAdsCampaigns,
  verifyCronAuth,
  type StatusFilter,
} from "../_shared/facebookAdsSync.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-client-info, apikey, x-cron-secret",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }
  if (!verifyCronAuth(req)) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  const startedAt = new Date();
  const startedAtIso = startedAt.toISOString();

  let triggeredBy = "pg_cron";
  let statusFilter: StatusFilter = "all";

  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body.triggeredBy === "string" && body.triggeredBy.trim()) {
      triggeredBy = body.triggeredBy.trim();
    }
    const f = body.statusFilter ?? body.status_filter;
    if (f === "active" || f === "inactive" || f === "all") {
      statusFilter = f;
    }
  } catch {
    // use defaults
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ success: false, error: "Supabase configuration missing" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const accountConfigs = parseFacebookAccountsFromEnv();
    if (accountConfigs.length === 0) {
      const finishedAt = new Date();
      await insertSyncRun(supabase, {
        triggered_by: triggeredBy,
        status: "failed",
        ads_fetched: 0,
        upserted: 0,
        failed: 0,
        caption_total: 0,
        caption_enriched: 0,
        error_message: "Facebook API not configured",
        started_at: startedAtIso,
        finished_at: finishedAt.toISOString(),
        duration_ms: finishedAt.getTime() - startedAt.getTime(),
      });
      return jsonResponse(
        { success: false, error: "Facebook API not configured", configured: false },
        503
      );
    }

    const ads = await fetchAllAdsFromFacebook(accountConfigs, statusFilter);
    if (ads.length === 0) {
      const finishedAt = new Date();
      await insertSyncRun(supabase, {
        triggered_by: triggeredBy,
        status: "failed",
        ads_fetched: 0,
        upserted: 0,
        failed: 0,
        caption_total: 0,
        caption_enriched: 0,
        error_message: "No ads found in Facebook",
        started_at: startedAtIso,
        finished_at: finishedAt.toISOString(),
        duration_ms: finishedAt.getTime() - startedAt.getTime(),
      });
      return jsonResponse({ success: false, error: "No ads found in Facebook" }, 404);
    }

    const pageConfig = parseFacebookPagesFromEnv();
    const captionResult = await enrichAdsWithCaptions(ads, pageConfig);

    const rows = ads.map(mapFacebookAdToRow);
    const upsertResult = await upsertAdsCampaigns(supabase, rows);

    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    const syncStatus =
      upsertResult.failed > 0
        ? upsertResult.upserted > 0
          ? "partial"
          : "failed"
        : "success";

    const errorParts: string[] = [];
    if (captionResult.tokenNotConfigured) {
      errorParts.push("Page Access Token not configured");
    } else if (captionResult.tokenExpired) {
      errorParts.push("Page Access Token expired");
    } else if (captionResult.errorMessage) {
      errorParts.push(captionResult.errorMessage);
    }
    if (upsertResult.failed > 0) {
      errorParts.push(`${upsertResult.failed} ads failed to upsert`);
    }

    await insertSyncRun(supabase, {
      triggered_by: triggeredBy,
      status: syncStatus,
      ads_fetched: ads.length,
      upserted: upsertResult.upserted,
      failed: upsertResult.failed,
      caption_total: captionResult.total,
      caption_enriched: captionResult.enriched,
      error_message: errorParts.length > 0 ? errorParts.join("; ") : null,
      started_at: startedAtIso,
      finished_at: finishedAt.toISOString(),
      duration_ms: durationMs,
    });

    return jsonResponse(
      {
        success: syncStatus !== "failed",
        adsFetched: ads.length,
        upserted: upsertResult.upserted,
        failed: upsertResult.failed,
        caption: {
          total: captionResult.total,
          enriched: captionResult.enriched,
          tokenNotConfigured: captionResult.tokenNotConfigured,
          tokenExpired: captionResult.tokenExpired,
        },
        durationMs,
        accountCount: accountConfigs.length,
      },
      syncStatus === "failed" ? 500 : 200
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[marketing-facebook-ads-auto-sync] Error:", err);

    const finishedAt = new Date();
    try {
      await insertSyncRun(supabase, {
        triggered_by: triggeredBy,
        status: "failed",
        ads_fetched: 0,
        upserted: 0,
        failed: 0,
        caption_total: 0,
        caption_enriched: 0,
        error_message: message,
        started_at: startedAtIso,
        finished_at: finishedAt.toISOString(),
        duration_ms: finishedAt.getTime() - startedAt.getTime(),
      });
    } catch (logErr) {
      console.error("[marketing-facebook-ads-auto-sync] Failed to log error run:", logErr);
    }

    return jsonResponse({ success: false, error: message }, 500);
  }
});
