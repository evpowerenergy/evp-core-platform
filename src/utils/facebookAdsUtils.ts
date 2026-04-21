/**
 * Facebook Ads Utility Functions
 * Local/dev: อ่าน token จาก .env (VITE_FACEBOOK_*). Production: เรียก Edge Function marketing-facebook-ads-summary
 */

import FacebookAdsService, { FacebookAdsSummary, FacebookAdsData } from '@/services/facebookAdsService';
import { env } from '@/lib/env';
import { getMarketingFunctionUrl } from '@/config';

export interface FacebookAdsMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalResults: number;
  averageCtr: number;
  averageCpc: number;
  averageCpm: number;
  packageSpend: number;
  wholesalesSpend: number;
  othersSpend: number;
  costPerLead: number | null;
  roas: number | null;
  totalMessagingConversations: number;
  packageMessagingConversations: number;
  wholesalesMessagingConversations: number;
  othersMessagingConversations: number;
}

function createEdgeFunctionHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (env.SUPABASE_ANON_KEY) {
    headers.apikey = env.SUPABASE_ANON_KEY;
    headers.Authorization = `Bearer ${env.SUPABASE_ANON_KEY}`;
  }
  return headers;
}

type ClientFacebookAccountConfig = {
  adAccountId: string;
  accessToken: string;
};

export function getClientFacebookAccountConfigs(): ClientFacebookAccountConfig[] {
  const sharedToken = env.FACEBOOK_ACCESS_TOKEN;
  if (sharedToken && env.FACEBOOK_AD_ACCOUNT_IDS && env.FACEBOOK_AD_ACCOUNT_IDS.length > 0) {
    return env.FACEBOOK_AD_ACCOUNT_IDS.map((adAccountId) => ({
      adAccountId,
      accessToken: sharedToken,
    }));
  }
  if (env.FACEBOOK_AD_ACCOUNTS && env.FACEBOOK_AD_ACCOUNTS.length > 0) {
    return env.FACEBOOK_AD_ACCOUNTS;
  }
  if (env.FACEBOOK_ACCESS_TOKEN && env.FACEBOOK_AD_ACCOUNT_ID) {
    return [{ adAccountId: env.FACEBOOK_AD_ACCOUNT_ID, accessToken: env.FACEBOOK_ACCESS_TOKEN }];
  }
  return [];
}

export function createFacebookAdsService(): FacebookAdsService | null {
  const accountConfigs = getClientFacebookAccountConfigs();
  if (accountConfigs.length === 0) return null;
  const selected = accountConfigs[0];
  const hasMultiPage = env.FACEBOOK_PAGES && env.FACEBOOK_PAGES.length > 0;
  const hasSinglePage = env.FACEBOOK_PAGE_ID && env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!hasMultiPage && !env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    console.warn('Facebook Page Token not set — Caption fetch may be disabled. Set VITE_FACEBOOK_PAGE_ACCESS_TOKEN or VITE_FACEBOOK_PAGES.');
  }
  return new FacebookAdsService({
    accessToken: selected.accessToken,
    pageAccessToken: env.FACEBOOK_PAGE_ACCESS_TOKEN || '',
    adAccountId: selected.adAccountId,
    pageId: env.FACEBOOK_PAGE_ID,
    pages: hasMultiPage ? env.FACEBOOK_PAGES : undefined,
    appId: env.FACEBOOK_APP_ID,
    appSecret: env.FACEBOOK_APP_SECRET,
  });
}

export function createFacebookAdsServices(): FacebookAdsService[] {
  const accountConfigs = getClientFacebookAccountConfigs();
  const hasMultiPage = env.FACEBOOK_PAGES && env.FACEBOOK_PAGES.length > 0;
  return accountConfigs.map((cfg) => new FacebookAdsService({
    accessToken: cfg.accessToken,
    pageAccessToken: env.FACEBOOK_PAGE_ACCESS_TOKEN || '',
    adAccountId: cfg.adAccountId,
    pageId: env.FACEBOOK_PAGE_ID,
    pages: hasMultiPage ? env.FACEBOOK_PAGES : undefined,
    appId: env.FACEBOOK_APP_ID,
    appSecret: env.FACEBOOK_APP_SECRET,
  }));
}

/**
 * ดึงข้อมูล Facebook Ads ตามช่วงวันที่
 * ใช้ client env ถ้ามี; ไม่มีจะเรียก Edge Function marketing-facebook-ads-summary
 */
export async function getFacebookAdsData(
  startDate: string,
  endDate: string
): Promise<FacebookAdsMetrics | null> {
  try {
    const services = createFacebookAdsServices();
    if (services.length > 0) {
      const summaries = await Promise.all(
        services.map((service) => service.getAdsSummary(startDate, endDate))
      );
      const summary = summaries.reduce<FacebookAdsSummary>((acc, cur) => {
        acc.totalSpend += cur.totalSpend;
        acc.totalImpressions += cur.totalImpressions;
        acc.totalClicks += cur.totalClicks;
        acc.totalResults += cur.totalResults;
        acc.packageSpend += cur.packageSpend;
        acc.wholesalesSpend += cur.wholesalesSpend;
        acc.othersSpend += cur.othersSpend;
        acc.totalMessagingConversations += cur.totalMessagingConversations || 0;
        acc.packageMessagingConversations += cur.packageMessagingConversations || 0;
        acc.wholesalesMessagingConversations += cur.wholesalesMessagingConversations || 0;
        acc.othersMessagingConversations += cur.othersMessagingConversations || 0;
        acc.campaigns.push(...(cur.campaigns || []));
        return acc;
      }, {
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalResults: 0,
        averageCtr: 0,
        averageCpc: 0,
        averageCpm: 0,
        packageSpend: 0,
        wholesalesSpend: 0,
        othersSpend: 0,
        campaigns: [],
        totalMessagingConversations: 0,
        packageMessagingConversations: 0,
        wholesalesMessagingConversations: 0,
        othersMessagingConversations: 0,
      });
      const n = summaries.length;
      summary.averageCtr = n > 0 ? summaries.reduce((s, x) => s + x.averageCtr, 0) / n : 0;
      summary.averageCpc = n > 0 ? summaries.reduce((s, x) => s + x.averageCpc, 0) / n : 0;
      summary.averageCpm = n > 0 ? summaries.reduce((s, x) => s + x.averageCpm, 0) / n : 0;
      return {
        totalSpend: summary.totalSpend,
        totalImpressions: summary.totalImpressions,
        totalClicks: summary.totalClicks,
        totalResults: summary.totalResults,
        averageCtr: summary.averageCtr,
        averageCpc: summary.averageCpc,
        averageCpm: summary.averageCpm,
        packageSpend: summary.packageSpend,
        wholesalesSpend: summary.wholesalesSpend,
        othersSpend: summary.othersSpend,
        costPerLead: summary.totalResults > 0 ? summary.totalSpend / summary.totalResults : null,
        roas: null,
        totalMessagingConversations: summary.totalMessagingConversations || 0,
        packageMessagingConversations: summary.packageMessagingConversations || 0,
        wholesalesMessagingConversations: summary.wholesalesMessagingConversations || 0,
        othersMessagingConversations: summary.othersMessagingConversations || 0,
      };
    }
    const url = getMarketingFunctionUrl('marketing-facebook-ads-summary');
    const res = await fetch(url, {
      method: 'POST',
      headers: createEdgeFunctionHeaders(),
      body: JSON.stringify({ startDate, endDate }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      console.warn('Facebook Ads Edge Function error:', data?.error ?? res.statusText);
      return null;
    }
    if (data?.success && data?.data) {
      return data.data as FacebookAdsMetrics;
    }
    if (data?.configured === false) return null;
    return null;
  } catch (error) {
    console.error('❌ Error fetching Facebook Ads data:', error);
    return null;
  }
}

/**
 * คำนวณ ROAS (Return on Ad Spend) สำหรับ Facebook Ads
 */
export function calculateFacebookRoas(
  facebookSpend: number,
  salesValue: number
): number | null {
  if (facebookSpend <= 0) {
    return null;
  }
  
  return (salesValue / facebookSpend) * 100; // แสดงเป็นเปอร์เซ็นต์
}

/**
 * คำนวณ Cost per Lead สำหรับ Facebook Ads
 */
export function calculateFacebookCostPerLead(
  facebookSpend: number,
  totalLeads: number
): number | null {
  if (totalLeads <= 0) {
    return null;
  }
  
  return facebookSpend / totalLeads;
}

/**
 * ดึงข้อมูล Video Metrics สำหรับ Video Ads (API v23.0)
 */
export async function getFacebookVideoMetrics(
  startDate: string,
  endDate: string,
  campaignIds?: string[]
): Promise<any[] | null> {
  try {
    const service = createFacebookAdsService();
    if (!service) {
      return null;
    }

    return await service.getVideoMetrics(startDate, endDate, campaignIds);
  } catch (error) {
    console.error('Error fetching Facebook video metrics:', error);
    return null;
  }
}

/**
 * ดึงข้อมูล Quality Rankings (API v23.0)
 */
export async function getFacebookQualityRankings(
  startDate: string,
  endDate: string
): Promise<any[] | null> {
  try {
    const service = createFacebookAdsService();
    if (!service) {
      return null;
    }

    return await service.getQualityRankings(startDate, endDate);
  } catch (error) {
    console.error('Error fetching Facebook quality rankings:', error);
    return null;
  }
}

/**
 * ตรวจสอบการเชื่อมต่อ Facebook API
 */
export async function testFacebookConnection(): Promise<boolean> {
  try {
    const service = createFacebookAdsService();
    if (!service) {
      return false;
    }

    return await service.testConnection();
  } catch (error) {
    console.error('Facebook connection test failed:', error);
    return false;
  }
}

/**
 * แปลงวันที่เป็นรูปแบบที่ Facebook API ต้องการ (YYYY-MM-DD)
 */
export function formatDateForFacebook(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * สร้างช่วงวันที่สำหรับ Facebook API
 */
export function createFacebookDateRange(startDate: Date, endDate: Date): {
  since: string;
  until: string;
} {
  return {
    since: formatDateForFacebook(startDate),
    until: formatDateForFacebook(endDate)
  };
}

/**
 * มี config Facebook Ads หรือไม่ (client env หรือ Edge Function + Secrets)
 * ถ้าไม่มี client env เราถือว่าอาจมี Edge Function — ต้องลองเรียก getFacebookAdsData เพื่อดู
 */
export function isFacebookApiConfigured(): boolean {
  return getClientFacebookAccountConfigs().length > 0;
}

/**
 * ดึงข้อมูล Facebook Ads แบบ real-time (สำหรับการอัพเดต dashboard)
 */
export async function getRealTimeFacebookAdsData(): Promise<FacebookAdsMetrics | null> {
  try {
    // ดึงข้อมูล 7 วันที่ผ่านมา
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    return await getFacebookAdsData(
      formatDateForFacebook(startDate),
      formatDateForFacebook(endDate)
    );
  } catch (error) {
    console.error('Error fetching real-time Facebook Ads data:', error);
    return null;
  }
}

/**
 * สร้าง mock data สำหรับการทดสอบ (เมื่อไม่มี Facebook API)
 * รองรับ API v23.0 enhanced metrics
 */
export function createMockFacebookAdsData(): FacebookAdsMetrics {
  return {
    totalSpend: 98284.54,
    totalImpressions: 1250000,
    totalClicks: 25000,
    totalResults: 1200,
    averageCtr: 2.0,
    averageCpc: 3.93,
    averageCpm: 78.63,
    packageSpend: 67007.54,
    wholesalesSpend: 16701.6,
    othersSpend: 14575.40,
    costPerLead: 81.90,
    roas: null,
    // Messaging metrics (mock data)
    totalMessagingConversations: 450,
    packageMessagingConversations: 280,
    wholesalesMessagingConversations: 120,
    othersMessagingConversations: 50
  };
}
