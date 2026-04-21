/**
 * Google Ads Utility Functions
 * Local/dev: อ่าน token จาก .env (VITE_GOOGLE_ADS_*). Production: เรียก Edge Function marketing-google-ads-summary
 */

import GoogleAdsService, { GoogleAdsSummary, GoogleAdsData } from '@/services/googleAdsService';
import { env } from '@/lib/env';
import { getMarketingFunctionUrl } from '@/config';

export interface GoogleAdsMetrics {
  totalCost: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageCtr: number;
  averageCpc: number;
  averageCpm: number;
  packageCost: number;
  wholesalesCost: number;
  othersCost: number;
  costPerLead: number | null;
  roas: number | null;
}

function createEdgeFunctionHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (env.SUPABASE_ANON_KEY) {
    headers.apikey = env.SUPABASE_ANON_KEY;
    headers.Authorization = `Bearer ${env.SUPABASE_ANON_KEY}`;
  }
  return headers;
}

export function createGoogleAdsService(): GoogleAdsService | null {
  const hasDeveloperToken = !!env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const hasClientId = !!env.GOOGLE_ADS_CLIENT_ID;
  const hasClientSecret = !!env.GOOGLE_ADS_CLIENT_SECRET;
  const hasRefreshToken = !!env.GOOGLE_ADS_REFRESH_TOKEN;
  const hasCustomerId = !!env.GOOGLE_ADS_CUSTOMER_ID;
  if (!hasDeveloperToken || !hasClientId || !hasClientSecret || !hasRefreshToken || !hasCustomerId) return null;
  return new GoogleAdsService({
    developerToken: env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    clientId: env.GOOGLE_ADS_CLIENT_ID!,
    clientSecret: env.GOOGLE_ADS_CLIENT_SECRET!,
    refreshToken: env.GOOGLE_ADS_REFRESH_TOKEN!,
    customerId: env.GOOGLE_ADS_CUSTOMER_ID!,
  });
}

/**
 * ดึงข้อมูล Google Ads ตามช่วงวันที่
 * ใช้ client env ถ้ามี; ไม่มีจะเรียก Edge Function marketing-google-ads-summary
 */
export async function getGoogleAdsData(
  startDate: string,
  endDate: string,
  level: 'campaign' | 'account' = 'campaign'
): Promise<GoogleAdsMetrics | null> {
  try {
    const service = createGoogleAdsService();
    if (service) {
      const summary = await service.getAdsSummary(startDate, endDate, level);
      if (!summary) return null;
      return {
        totalCost: summary.totalCost,
        totalImpressions: summary.totalImpressions,
        totalClicks: summary.totalClicks,
        totalConversions: summary.totalConversions,
        averageCtr: summary.averageCtr,
        averageCpc: summary.averageCpc,
        averageCpm: summary.averageCpm,
        packageCost: summary.packageCost,
        wholesalesCost: summary.wholesalesCost,
        othersCost: summary.othersCost,
        costPerLead: summary.totalConversions > 0 ? summary.totalCost / summary.totalConversions : null,
        roas: null,
      };
    }
    const url = getMarketingFunctionUrl('marketing-google-ads-summary');
    const res = await fetch(url, {
      method: 'POST',
      headers: createEdgeFunctionHeaders(),
      body: JSON.stringify({ startDate, endDate, level }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      console.warn('Google Ads Edge Function error:', data?.error ?? res.statusText);
      return null;
    }
    if (data?.success && data?.data) return data.data as GoogleAdsMetrics;
    if (data?.configured === false) return null;
    return null;
  } catch (error: any) {
    console.error('❌ Error fetching Google Ads data:', error);
    return null;
  }
}

/**
 * คำนวณ ROAS (Return on Ad Spend) สำหรับ Google Ads
 */
export function calculateGoogleRoas(
  googleCost: number,
  salesValue: number
): number | null {
  if (googleCost <= 0) {
    return null;
  }
  
  return (salesValue / googleCost) * 100; // แสดงเป็นเปอร์เซ็นต์
}

/**
 * คำนวณ Cost per Lead สำหรับ Google Ads
 */
export function calculateGoogleCostPerLead(
  googleCost: number,
  totalLeads: number
): number | null {
  if (totalLeads <= 0) {
    return null;
  }
  
  return googleCost / totalLeads;
}

/**
 * ตรวจสอบการเชื่อมต่อ Google Ads API
 */
export async function testGoogleConnection(): Promise<boolean> {
  try {
    const service = createGoogleAdsService();
    if (!service) {
      return false;
    }

    return await service.testConnection();
  } catch (error) {
    console.error('Google Ads connection test failed:', error);
    return false;
  }
}

/**
 * แปลงวันที่เป็นรูปแบบที่ Google Ads API ต้องการ (YYYY-MM-DD)
 */
export function formatDateForGoogle(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * สร้างช่วงวันที่สำหรับ Google Ads API
 */
export function createGoogleDateRange(startDate: Date, endDate: Date): {
  startDate: string;
  endDate: string;
} {
  return {
    startDate: formatDateForGoogle(startDate),
    endDate: formatDateForGoogle(endDate)
  };
}

export function isGoogleApiConfigured(): boolean {
  return !!(
    env.GOOGLE_ADS_DEVELOPER_TOKEN &&
    env.GOOGLE_ADS_CLIENT_ID &&
    env.GOOGLE_ADS_CLIENT_SECRET &&
    env.GOOGLE_ADS_REFRESH_TOKEN &&
    env.GOOGLE_ADS_CUSTOMER_ID
  );
}

/**
 * ดึงข้อมูล Google Ads แบบ real-time (สำหรับการอัพเดต dashboard)
 */
export async function getRealTimeGoogleAdsData(): Promise<GoogleAdsMetrics | null> {
  try {
    // ดึงข้อมูล 7 วันที่ผ่านมา
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    return await getGoogleAdsData(
      formatDateForGoogle(startDate),
      formatDateForGoogle(endDate)
    );
  } catch (error) {
    console.error('Error fetching real-time Google Ads data:', error);
    return null;
  }
}

/**
 * สร้าง mock data สำหรับการทดสอบ (เมื่อไม่มี Google Ads API)
 */
export function createMockGoogleAdsData(): GoogleAdsMetrics {
  return {
    totalCost: 45000.00,
    totalImpressions: 800000,
    totalClicks: 12000,
    totalConversions: 180,
    averageCtr: 1.5,
    averageCpc: 3.75,
    averageCpm: 56.25,
    packageCost: 30000.00,
    wholesalesCost: 10000.00,
    othersCost: 5000.00,
    costPerLead: 250.00,
    roas: null
  };
}
