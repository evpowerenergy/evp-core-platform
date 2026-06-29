// @ts-ignore - URL import is supported by Deno runtime
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const FB_GRAPH_VERSION = "v23.0";
const FB_BASE_URL = `https://graph.facebook.com/${FB_GRAPH_VERSION}`;
const MAX_ADS = 5000;
const CAPTION_BATCH_SIZE = 50;
const UPSERT_CHUNK_SIZE = 100;

export type StatusFilter = "all" | "active" | "inactive";

export type FacebookAccountConfig = {
  adAccountId: string;
  accessToken: string;
};

export type FacebookPageConfig = {
  pageId: string;
  pageAccessToken: string;
};

export type FacebookPagesEnvConfig = {
  pageAccessToken: string;
  pageId?: string;
  pages?: FacebookPageConfig[];
};

export type FacebookAdCreative = {
  image_url?: string;
  thumbnail_url?: string;
  title?: string;
  body?: string;
  effective_object_story_id?: string;
  message?: string | null;
  full_picture?: string | null;
  permalink_url?: string | null;
};

export type FacebookAd = {
  id: string;
  name: string;
  status: string;
  campaign_id?: string;
  campaign?: {
    id?: string;
    name?: string;
    status?: string;
    start_time?: string;
    stop_time?: string;
  };
  creative?: FacebookAdCreative;
  created_time?: string;
  updated_time?: string;
  __ad_account_id?: string;
};

export type AdsCampaignRow = {
  facebook_campaign_id: string;
  facebook_ad_id: string;
  name: string;
  campaign_name: string | null;
  campaign_status: "active" | "inactive" | "archived" | null;
  campaign_start_time: string | null;
  campaign_stop_time: string | null;
  image_url: string | null;
  platform: string;
  status: "active" | "inactive" | "archived";
  description: string | null;
  facebook_created_time: string | null;
};

export type CaptionFetchResult = {
  success: boolean;
  total: number;
  enriched: number;
  tokenExpired: boolean;
  tokenNotConfigured: boolean;
  errorMessage: string | null;
};

export type UpsertResult = {
  upserted: number;
  failed: number;
};

export function parseFacebookAccountsFromEnv(): FacebookAccountConfig[] {
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
      console.warn("[facebookAdsSync] Invalid FACEBOOK_AD_ACCOUNTS JSON");
    }
  }

  const accessToken = sharedAccessToken || Deno.env.get("FACEBOOK_ACCESS_TOKEN");
  const adAccountId = Deno.env.get("FACEBOOK_AD_ACCOUNT_ID");
  if (!accessToken || !adAccountId) return [];
  return [{ adAccountId, accessToken }];
}

function parseFacebookPagesJson(raw: string): FacebookPageConfig[] | undefined {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return undefined;
    const pages = parsed
      .filter((x) => x && typeof x === "object")
      .map((x) => ({
        pageId: String((x as { pageId?: string }).pageId || "").trim(),
        pageAccessToken: String((x as { pageAccessToken?: string }).pageAccessToken || "").trim(),
      }))
      .filter((x) => x.pageId.length > 0 && x.pageAccessToken.length > 0);
    return pages.length > 0 ? pages : undefined;
  } catch {
    return undefined;
  }
}

export function parseFacebookPagesFromEnv(): FacebookPagesEnvConfig {
  const pagesRaw = Deno.env.get("FACEBOOK_PAGES");
  const pages = pagesRaw ? parseFacebookPagesJson(pagesRaw) : undefined;
  const pageAccessToken = (Deno.env.get("FACEBOOK_PAGE_ACCESS_TOKEN") || "").trim();
  const pageId = (Deno.env.get("FACEBOOK_PAGE_ID") || "").trim() || undefined;

  return { pageAccessToken, pageId, pages };
}

function isTokenError(errorData: { error?: { code?: number; message?: string } } | null): boolean {
  if (!errorData?.error) return false;
  const { code, message = "" } = errorData.error;
  return (
    code === 190 ||
    code === 200 ||
    message.includes("session is invalid") ||
    message.includes("logged out")
  );
}

export async function fetchAllAdsFromFacebook(
  accountConfigs: FacebookAccountConfig[],
  statusFilter: StatusFilter = "all"
): Promise<FacebookAd[]> {
  const fields = [
    "id",
    "name",
    "status",
    "campaign_id",
    "campaign{id,name,status,start_time,stop_time}",
    "adset_id",
    "adset{id,name}",
    "creative{image_url,thumbnail_url,title,body,effective_object_story_id}",
    "created_time",
    "updated_time",
  ].join(",");

  const allAds: FacebookAd[] = [];

  for (const account of accountConfigs) {
    const params = new URLSearchParams({
      access_token: account.accessToken,
      fields,
      limit: "100",
    });

    if (statusFilter !== "all") {
      const statusValues =
        statusFilter === "active"
          ? ["ACTIVE"]
          : ["PAUSED", "DISAPPROVED", "PENDING_REVIEW", "WITH_ISSUES"];
      params.append(
        "filtering",
        JSON.stringify([{ field: "ad.effective_status", operator: "IN", value: statusValues }])
      );
    }

    let nextUrl: string | null = `${FB_BASE_URL}/act_${account.adAccountId}/ads?${params}`;
    while (nextUrl) {
      const res = await fetch(nextUrl);
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error.message || "Facebook API error");
      }
      if (!res.ok) {
        throw new Error(`Facebook API: ${res.status}`);
      }

      if (data.data?.length > 0) {
        allAds.push(
          ...data.data.map((ad: FacebookAd) => ({
            ...ad,
            __ad_account_id: account.adAccountId,
          }))
        );
      }

      nextUrl = data.paging?.next || null;
      if (allAds.length >= MAX_ADS) break;
    }
  }

  return allAds;
}

export async function fetchBatchPostDetails(
  storyIds: string[],
  pageToken: string
): Promise<Record<string, { message?: string; full_picture?: string; permalink_url?: string }>> {
  if (storyIds.length === 0 || !pageToken.trim()) return {};

  const results: Record<string, { message?: string; full_picture?: string; permalink_url?: string }> = {};

  for (let i = 0; i < storyIds.length; i += CAPTION_BATCH_SIZE) {
    const batch = storyIds.slice(i, i + CAPTION_BATCH_SIZE);
    const params = new URLSearchParams({
      ids: batch.join(","),
      fields: "message,full_picture,permalink_url",
      access_token: pageToken,
    });

    const res = await fetch(`${FB_BASE_URL}/?${params.toString()}`);
    let data: Record<string, unknown> | { error?: { code?: number; message?: string } } = {};

    try {
      data = await res.json();
    } catch {
      continue;
    }

    if (!res.ok || (data as { error?: unknown }).error) {
      if (isTokenError(data as { error?: { code?: number; message?: string } })) {
        throw new Error("Page Access Token is invalid or expired");
      }
      for (const storyId of batch) {
        try {
          const singleParams = new URLSearchParams({
            fields: "message,full_picture,permalink_url",
            access_token: pageToken,
          });
          const singleRes = await fetch(`${FB_BASE_URL}/${storyId}?${singleParams.toString()}`);
          const singleData = await singleRes.json();
          if (singleRes.ok && !singleData.error) {
            results[storyId] = singleData;
          }
        } catch {
          // skip individual failures
        }
      }
      continue;
    }

    for (const [id, post] of Object.entries(data)) {
      if (post && typeof post === "object" && !(post as { error?: unknown }).error) {
        results[id] = post as { message?: string; full_picture?: string; permalink_url?: string };
      }
    }
  }

  return results;
}

function collectStoryIds(ads: FacebookAd[], pageConfig: FacebookPagesEnvConfig): string[] {
  const allStoryIds = ads
    .map((ad) => ad.creative?.effective_object_story_id)
    .filter((id): id is string => !!id && typeof id === "string" && id.trim().length > 0);

  const uniqueStoryIds = Array.from(new Set(allStoryIds));
  const { pages, pageId } = pageConfig;

  if (pages && pages.length > 0) {
    const pageIdsSet = new Set(pages.map((p) => p.pageId));
    return uniqueStoryIds.filter((id) => {
      const parts = id.split("_");
      return parts.length === 2 && !!parts[0] && !!parts[1] && pageIdsSet.has(parts[0]);
    });
  }

  if (pageId) {
    return uniqueStoryIds.filter((id) => {
      if (!id.startsWith(`${pageId}_`)) return false;
      const parts = id.split("_");
      return parts.length === 2 && !!parts[0] && !!parts[1];
    });
  }

  return uniqueStoryIds.filter((id) => {
    const parts = id.split("_");
    return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
  });
}

export async function enrichAdsWithCaptions(
  ads: FacebookAd[],
  pageConfig: FacebookPagesEnvConfig
): Promise<CaptionFetchResult> {
  const storyIds = collectStoryIds(ads, pageConfig);
  const result: CaptionFetchResult = {
    success: false,
    total: storyIds.length,
    enriched: 0,
    tokenExpired: false,
    tokenNotConfigured: false,
    errorMessage: null,
  };

  const hasMultiPage = pageConfig.pages && pageConfig.pages.length > 0;
  const hasSingleToken = pageConfig.pageAccessToken.trim().length > 0;

  if (storyIds.length === 0) {
    return result;
  }

  if (!hasMultiPage && !hasSingleToken) {
    result.tokenNotConfigured = true;
    result.errorMessage = "Page Access Token is not configured";
    return result;
  }

  try {
    let postDetails: Record<string, { message?: string; full_picture?: string; permalink_url?: string }> = {};

    if (hasMultiPage && pageConfig.pages) {
      const byPage: Record<string, string[]> = {};
      for (const id of storyIds) {
        const pid = id.split("_")[0];
        if (!byPage[pid]) byPage[pid] = [];
        byPage[pid].push(id);
      }
      for (const page of pageConfig.pages) {
        const ids = byPage[page.pageId] || [];
        if (ids.length === 0) continue;
        const details = await fetchBatchPostDetails(ids, page.pageAccessToken);
        Object.assign(postDetails, details);
      }
    } else {
      postDetails = await fetchBatchPostDetails(storyIds, pageConfig.pageAccessToken);
    }

    let enriched = 0;
    for (const ad of ads) {
      const storyId = ad.creative?.effective_object_story_id;
      if (storyId && postDetails[storyId]) {
        const post = postDetails[storyId];
        if (!ad.creative) ad.creative = {};
        ad.creative.message = post.message || null;
        ad.creative.full_picture = post.full_picture || null;
        ad.creative.permalink_url = post.permalink_url || null;
        if (post.message) enriched++;
      }
    }

    result.enriched = enriched;
    result.success = enriched > 0;
    if (enriched === 0 && storyIds.length > 0) {
      result.errorMessage = "No captions could be fetched";
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Caption fetch failed";
    if (message.includes("invalid or expired")) {
      result.tokenExpired = true;
    }
    result.errorMessage = message;
  }

  return result;
}

export function mapFacebookAdToRow(ad: FacebookAd): AdsCampaignRow {
  const fbStatus = (ad.status || "").toUpperCase();
  const status: "active" | "inactive" | "archived" =
    fbStatus === "ACTIVE"
      ? "active"
      : fbStatus === "ARCHIVED" || fbStatus === "DELETED"
        ? "archived"
        : "inactive";

  let campaignStatus: "active" | "inactive" | "archived" | null = null;
  if (ad.campaign?.status) {
    const fs = ad.campaign.status.toUpperCase();
    campaignStatus =
      fs === "ACTIVE" ? "active" : fs === "ARCHIVED" || fs === "DELETED" ? "archived" : "inactive";
  }

  return {
    facebook_campaign_id: String(ad.campaign_id ?? ""),
    facebook_ad_id: String(ad.id ?? ""),
    name: ad.name ?? "",
    campaign_name: ad.campaign?.name || null,
    campaign_status: campaignStatus,
    campaign_start_time: ad.campaign?.start_time || null,
    campaign_stop_time: ad.campaign?.stop_time || null,
    image_url: ad.creative?.image_url || ad.creative?.thumbnail_url || null,
    platform: "Facebook",
    status,
    description: ad.creative?.message || ad.creative?.body || null,
    facebook_created_time: ad.created_time || null,
  };
}

export async function upsertAdsCampaigns(
  supabase: SupabaseClient,
  rows: AdsCampaignRow[]
): Promise<UpsertResult> {
  let upserted = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i += UPSERT_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK_SIZE);
    const { error } = await supabase.from("ads_campaigns").upsert(chunk, {
      onConflict: "facebook_ad_id",
    });

    if (error) {
      console.error("[facebookAdsSync] Chunk upsert error:", error.message);
      for (const row of chunk) {
        const { error: rowError } = await supabase
          .from("ads_campaigns")
          .upsert(row, { onConflict: "facebook_ad_id" });
        if (rowError) {
          failed++;
          console.error("[facebookAdsSync] Row upsert failed:", row.facebook_ad_id, rowError.message);
        } else {
          upserted++;
        }
      }
    } else {
      upserted += chunk.length;
    }
  }

  return { upserted, failed };
}

export type SyncRunInsert = {
  triggered_by: string;
  status: "success" | "partial" | "failed";
  ads_fetched: number;
  upserted: number;
  failed: number;
  caption_total: number;
  caption_enriched: number;
  error_message: string | null;
  started_at: string;
  finished_at: string;
  duration_ms: number;
};

export async function insertSyncRun(
  supabase: SupabaseClient,
  run: SyncRunInsert
): Promise<void> {
  const { error } = await supabase.from("ads_sync_runs").insert(run);
  if (error) {
    console.error("[facebookAdsSync] Failed to log sync run:", error.message);
  }
}

export function verifyCronAuth(req: Request): boolean {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const cronSecret = Deno.env.get("CRON_SECRET") || "";

  const authHeader = req.headers.get("Authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const headerCronSecret = req.headers.get("x-cron-secret") || "";

  if (serviceRoleKey && bearerToken === serviceRoleKey) {
    return true;
  }
  if (cronSecret && headerCronSecret === cronSecret) {
    return true;
  }
  return false;
}
