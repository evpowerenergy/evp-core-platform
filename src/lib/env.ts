/**
 * Environment / config for the app (client).
 * Single source of truth for client-safe config is @/config.
 * Re-exports from config + optional Ads vars for local/dev.
 * Production: อย่าตั้ง VITE_FACEBOOK_* / VITE_GOOGLE_* บน Vercel — ใช้ Edge Function + Secrets แทน
 */

import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  APP_NAME,
  APP_VERSION,
} from '@/config';

function parseFacebookPages(raw: unknown): { pageId: string; pageAccessToken: string }[] | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return undefined;
    return arr
      .filter((x): x is { pageId: string; pageAccessToken: string } =>
        x != null && typeof x === 'object' && typeof (x as { pageId?: string }).pageId === 'string' && typeof (x as { pageAccessToken?: string }).pageAccessToken === 'string'
      )
      .map(({ pageId, pageAccessToken }) => ({ pageId: String(pageId).trim(), pageAccessToken: String(pageAccessToken).trim() }))
      .filter(({ pageId, pageAccessToken }) => pageId.length > 0 && pageAccessToken.length > 0);
  } catch {
    return undefined;
  }
}

function parseFacebookAdAccounts(raw: unknown): { adAccountId: string; accessToken: string }[] | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return undefined;
    return arr
      .filter((x): x is { adAccountId: string; accessToken: string } =>
        x != null &&
        typeof x === 'object' &&
        typeof (x as { adAccountId?: string }).adAccountId === 'string' &&
        typeof (x as { accessToken?: string }).accessToken === 'string'
      )
      .map(({ adAccountId, accessToken }) => ({ adAccountId: String(adAccountId).trim(), accessToken: String(accessToken).trim() }))
      .filter(({ adAccountId, accessToken }) => adAccountId.length > 0 && accessToken.length > 0);
  } catch {
    return undefined;
  }
}

function parseFacebookAdAccountIds(raw: unknown): string[] | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  const ids = raw
    .split(',')
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
  return ids.length > 0 ? ids : undefined;
}

export const env = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  APP_NAME,
  APP_VERSION,
  DEV_MODE: import.meta.env.VITE_DEV_MODE === 'development',
  NODE_ENV: import.meta.env.MODE,
  // Ads: ใช้ได้ใน local/dev (.env). Production ใช้ Edge Function + Secrets
  FACEBOOK_ACCESS_TOKEN: import.meta.env.VITE_FACEBOOK_ACCESS_TOKEN,
  FACEBOOK_PAGE_ACCESS_TOKEN: import.meta.env.VITE_FACEBOOK_PAGE_ACCESS_TOKEN,
  FACEBOOK_AD_ACCOUNT_ID: import.meta.env.VITE_FACEBOOK_AD_ACCOUNT_ID,
  FACEBOOK_AD_ACCOUNT_IDS: parseFacebookAdAccountIds(import.meta.env.VITE_FACEBOOK_AD_ACCOUNT_IDS),
  FACEBOOK_AD_ACCOUNTS: parseFacebookAdAccounts(import.meta.env.VITE_FACEBOOK_AD_ACCOUNTS),
  FACEBOOK_PAGE_ID: import.meta.env.VITE_FACEBOOK_PAGE_ID,
  FACEBOOK_PAGES: parseFacebookPages(import.meta.env.VITE_FACEBOOK_PAGES),
  FACEBOOK_APP_ID: import.meta.env.VITE_FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET: import.meta.env.VITE_FACEBOOK_APP_SECRET,
  GOOGLE_ADS_DEVELOPER_TOKEN: import.meta.env.VITE_GOOGLE_ADS_DEVELOPER_TOKEN,
  GOOGLE_ADS_CLIENT_ID: import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID,
  GOOGLE_ADS_CLIENT_SECRET: import.meta.env.VITE_GOOGLE_ADS_CLIENT_SECRET,
  GOOGLE_ADS_REFRESH_TOKEN: import.meta.env.VITE_GOOGLE_ADS_REFRESH_TOKEN,
  GOOGLE_ADS_CUSTOMER_ID: import.meta.env.VITE_GOOGLE_ADS_CUSTOMER_ID,
} as const;

/**
 * Validate required environment variables (client). Call at app entry if desired.
 */
export function validateEnv(): void {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;
  for (const key of required) {
    if (!import.meta.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

/**
 * Get environment variable with optional fallback.
 */
export function getEnvVar(key: string, fallback?: string): string {
  const value = import.meta.env[key];
  if (value !== undefined) return value as string;
  if (fallback !== undefined) return fallback;
  throw new Error(`Environment variable ${key} is required but not set`);
}
