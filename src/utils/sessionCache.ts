// Utility to cache session and reduce getSession() calls
// This helps prevent rate limiting (429 errors) from too many auth API calls

import { Session } from "@supabase/supabase-js";

let cachedSession: Session | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30 * 1000; // Cache for 30 seconds

export const getCachedSession = (): Session | null => {
  const now = Date.now();
  // Return cached session if it's still valid
  if (cachedSession && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedSession;
  }
  return null;
};

export const setCachedSession = (session: Session | null): void => {
  cachedSession = session;
  cacheTimestamp = Date.now();
};

export const clearCachedSession = (): void => {
  cachedSession = null;
  cacheTimestamp = 0;
};

