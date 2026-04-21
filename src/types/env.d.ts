/// <reference types="vite/client" />

/**
 * Client env. Local/dev: VITE_FACEBOOK_* / VITE_GOOGLE_* ใช้ได้จาก .env
 * Production (Vercel): อย่าตั้ง Ads tokens — ใช้ Edge Function + Secrets
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_DEV_MODE?: string;
  readonly VITE_FACEBOOK_ACCESS_TOKEN?: string;
  readonly VITE_FACEBOOK_PAGE_ACCESS_TOKEN?: string;
  readonly VITE_FACEBOOK_AD_ACCOUNT_ID?: string;
  readonly VITE_FACEBOOK_AD_ACCOUNT_IDS?: string;
  readonly VITE_FACEBOOK_AD_ACCOUNTS?: string;
  readonly VITE_FACEBOOK_PAGE_ID?: string;
  readonly VITE_FACEBOOK_PAGES?: string;
  readonly VITE_FACEBOOK_APP_ID?: string;
  readonly VITE_FACEBOOK_APP_SECRET?: string;
  readonly VITE_GOOGLE_ADS_DEVELOPER_TOKEN?: string;
  readonly VITE_GOOGLE_ADS_CLIENT_ID?: string;
  readonly VITE_GOOGLE_ADS_CLIENT_SECRET?: string;
  readonly VITE_GOOGLE_ADS_REFRESH_TOKEN?: string;
  readonly VITE_GOOGLE_ADS_CUSTOMER_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;
declare const __APP_NAME__: string;
