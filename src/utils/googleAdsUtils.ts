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

export interface GoogleAdsDailyMetrics extends GoogleAdsMetrics {
  date: string;
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
function summaryToMetrics(summary: {
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
}): GoogleAdsMetrics {
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

function aggregateDailyFromCampaignRows(
  rows: Array<{ dateStart: string; metrics: { cost: number; impressions: number; clicks: number; conversions: number; ctr: number; cpc: number }; category?: string }>,
): GoogleAdsDailyMetrics[] {
  const byDate = new Map<string, GoogleAdsDailyMetrics>();

  for (const row of rows) {
    const date = row.dateStart;
    if (!date) continue;
    const current = byDate.get(date) ?? {
      date,
      totalCost: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      averageCtr: 0,
      averageCpc: 0,
      averageCpm: 0,
      packageCost: 0,
      wholesalesCost: 0,
      othersCost: 0,
      costPerLead: null,
      roas: null,
      _sumCtr: 0,
      _sumCpc: 0,
      _rowCount: 0,
    } as GoogleAdsDailyMetrics & { _sumCtr: number; _sumCpc: number; _rowCount: number };

    current.totalCost += row.metrics.cost;
    current.totalImpressions += row.metrics.impressions;
    current.totalClicks += row.metrics.clicks;
    current.totalConversions += row.metrics.conversions;
    current._sumCtr += row.metrics.ctr;
    current._sumCpc += row.metrics.cpc;
    current._rowCount += 1;

    switch (row.category) {
      case 'Package':
        current.packageCost += row.metrics.cost;
        break;
      case 'Wholesales':
        current.wholesalesCost += row.metrics.cost;
        break;
      default:
        current.othersCost += row.metrics.cost;
        break;
    }

    byDate.set(date, current);
  }

  return Array.from(byDate.values())
    .map((entry) => {
      const rowCount = entry._rowCount || 0;
      const averageCtr = rowCount > 0 ? entry._sumCtr / rowCount : 0;
      const averageCpc = rowCount > 0 ? entry._sumCpc / rowCount : 0;
      const averageCpm =
        entry.totalImpressions > 0 ? (entry.totalCost / entry.totalImpressions) * 1000 : 0;
      const costPerLead =
        entry.totalConversions > 0 ? entry.totalCost / entry.totalConversions : null;
      const { _sumCtr: _a, _sumCpc: _b, _rowCount: _c, ...rest } = entry;
      return {
        ...rest,
        averageCtr,
        averageCpc,
        averageCpm,
        costPerLead,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchGoogleAdsFromEdgeFunction<T>(
  body: Record<string, unknown>,
): Promise<T | null> {
  const url = getMarketingFunctionUrl('marketing-google-ads-summary');
  const res = await fetch(url, {
    method: 'POST',
    headers: createEdgeFunctionHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    console.warn('Google Ads Edge Function error:', data?.error ?? res.statusText);
    return null;
  }
  if (data?.success && data?.data) return data.data as T;
  if (data?.configured === false) return null;
  return null;
}

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
      return summaryToMetrics(summary);
    }
    return await fetchGoogleAdsFromEdgeFunction<GoogleAdsMetrics>({ startDate, endDate, level });
  } catch (error: any) {
    console.error('❌ Error fetching Google Ads data:', error);
    return null;
  }
}

/**
 * ดึงข้อมูล Google Ads แยกรายวันในครั้งเดียว (ลดจำนวน Edge Function calls)
 */
export async function getGoogleAdsDailyBreakdown(
  startDate: string,
  endDate: string,
  level: 'campaign' | 'account' = 'campaign',
): Promise<GoogleAdsDailyMetrics[] | null> {
  try {
    const service = createGoogleAdsService();
    if (service) {
      const rows = await service.getAdsData(startDate, endDate, level);
      return aggregateDailyFromCampaignRows(rows);
    }
    const data = await fetchGoogleAdsFromEdgeFunction<GoogleAdsMetrics & { daily?: GoogleAdsDailyMetrics[] }>({
      startDate,
      endDate,
      level,
      groupBy: 'date',
    });
    return data?.daily ?? null;
  } catch (error: any) {
    console.error('❌ Error fetching Google Ads daily breakdown:', error);
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
