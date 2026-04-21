/**
 * Helper function to get Edge Function URL
 * - Development: ใช้ localhost Edge Functions (http://localhost:54321)
 * - Production: ใช้ Cloud Edge Functions
 * 
 * ทำไมต้องแก้ไข?
 * - ใช้ centralized config แทน hardcoded values
 * - Consistent with apiClient.ts
 */

import { SUPABASE_URL } from '@/config';

export function getEdgeFunctionUrl(functionName: string): string {
  // Development mode: ใช้ local Edge Function
  if (import.meta.env.DEV) {
    return `http://localhost:54321/functions/v1/${functionName}`;
  }
  
  // Production mode: ใช้ Cloud Edge Function
  if (!SUPABASE_URL) {
    throw new Error('SUPABASE_URL is not configured. Please check your environment variables.');
  }
  
  return `${SUPABASE_URL}/functions/v1/${functionName}`;
}

/**
 * Get full Edge Function URL with query parameters
 */
export function getEdgeFunctionUrlWithParams(
  functionName: string, 
  params?: Record<string, string | number | boolean>
): string {
  const baseUrl = getEdgeFunctionUrl(functionName);
  const url = new URL(baseUrl);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  
  return url.toString();
}

