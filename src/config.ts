/**
 * Configuration file
 * 
 * ทำไมต้องแก้ไข?
 * 1. Security: ลบ hardcoded API keys (ไม่ควร commit keys ลง Git)
 * 2. Best practice: ใช้ environment variables เท่านั้น
 * 3. Error handling: throw error ถ้าไม่มี env vars (ไม่ fallback เป็น default)
 * 
 * หมายเหตุ:
 * - สำหรับ development: ตั้งค่าใน .env.local
 * - สำหรับ production: ตั้งค่าใน Vercel/deployment platform
 * - อย่า hardcode sensitive values ใน code!
 */

/**
 * Supabase URL
 * ต้องตั้งค่า VITE_SUPABASE_URL ใน environment variables
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

if (!SUPABASE_URL) {
  // ใน development แสดง warning แต่ไม่ throw error
  if (import.meta.env.DEV) {
    console.warn(
      '⚠️ VITE_SUPABASE_URL is not set. Please create .env.local file with:\n' +
      'VITE_SUPABASE_URL=your_supabase_url'
    );
  } else {
    // ใน production throw error (ไม่ควร deploy โดยไม่มี env vars)
    throw new Error(
      'VITE_SUPABASE_URL environment variable is required. ' +
      'Please configure it in your deployment platform.'
    );
  }
}

/**
 * Supabase Anonymous Key
 * ต้องตั้งค่า VITE_SUPABASE_ANON_KEY ใน environment variables
 */
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  // ใน development แสดง warning แต่ไม่ throw error
  if (import.meta.env.DEV) {
    console.warn(
      '⚠️ VITE_SUPABASE_ANON_KEY is not set. Please create .env.local file with:\n' +
      'VITE_SUPABASE_ANON_KEY=your_supabase_anon_key'
    );
  } else {
    // ใน production throw error
    throw new Error(
      'VITE_SUPABASE_ANON_KEY environment variable is required. ' +
      'Please configure it in your deployment platform.'
    );
  }
}

/**
 * App metadata (client-safe, from env or defaults)
 */
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'EV Power Energy CRM';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

/**
 * URL for marketing Edge Functions (Facebook/Google Ads).
 * เรียก Supabase โดยตรงทุกที่ — ไม่ใช้ proxy บน Vercel (ไม่จำเป็น เพราะ Edge Function เปิด CORS อยู่แล้ว)
 */
export function getMarketingFunctionUrl(name: string): string {
  if (SUPABASE_URL) return `${SUPABASE_URL}/functions/v1/${name}`;
  return `/api/functions/${name}`; // fallback ตอนไม่มี SUPABASE_URL (ไม่ควรเกิดใน production)
}

// Database connection pooling configuration (server-side usage)
export const DATABASE_CONFIG = {
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  },
  query: {
    timeout: 30000,
    statement_timeout: 30000,
  },
  ssl: {
    rejectUnauthorized: import.meta.env.PROD !== false,
  },
}; 