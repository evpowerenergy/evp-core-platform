import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';

export interface OpenAICostData {
  date: string;
  cost: number;
  displayDate: string;
  /** costs_api = จาก organization/costs | usage_completions_api = ประมาณจาก token เมื่อ costs เป็น $0 */
  syncSource?: string | null;
}

// Hook สำหรับดึงข้อมูลจาก Database (เร็วมาก!)
export const useOpenAICost = (dateRange?: DateRange) => {
  return useQuery({
    queryKey: ['openai-cost', dateRange],
    queryFn: async () => {
      // ตั้งค่า default date range (30 วันย้อนหลัง)
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      const fromDate = dateRange?.from || thirtyDaysAgo;
      const toDate = dateRange?.to || today;

      // Format dates
      const startDate = fromDate.toISOString().split('T')[0];
      const endDate = toDate.toISOString().split('T')[0];

      // ดึงข้อมูลจาก Supabase โดยตรง (ไม่ผ่าน API)
      const { data: dbData, error } = await supabase
        .from('openai_costs' as any)
        .select('date, cost_usd, cost_baht, sync_source')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) {
        console.error('❌ Supabase query error:', error);
        throw new Error(error.message || 'Failed to fetch data from database');
      }

      // Transform to expected format
      const data = {
        success: true,
        data: {
          dailyCosts: (dbData || []).map((record: any) => ({
            date: record.date,
            costUSD: record.cost_usd,
            costBaht: record.cost_baht,
            sync_source: record.sync_source ?? null,
          }))
        }
      };


      // สร้างข้อมูลทุกวันในช่วงที่เลือก (รวมวันที่ไม่มีข้อมูล)
      const dailyDataMap = new Map<string, OpenAICostData>();
      
      const currentDate = new Date(fromDate);
      while (currentDate <= toDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        dailyDataMap.set(dateKey, {
          date: dateKey,
          displayDate: formatDisplayDate(currentDate),
          cost: 0,
          syncSource: null,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // เติมข้อมูลจริงจาก OpenAI
      if (data.data?.dailyCosts) {
        data.data.dailyCosts.forEach((item: any) => {
          if (dailyDataMap.has(item.date)) {
            dailyDataMap.set(item.date, {
              date: item.date,
              displayDate: formatDisplayDate(new Date(item.date)),
              cost: item.costBaht,
              syncSource: item.sync_source ?? null,
            });
          }
        });
      }

      // แปลง Map เป็น Array และเรียงตามวันที่
      const result = Array.from(dailyDataMap.values()).sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      return result;
    },
    // ดึงจาก Database แล้วเร็วมาก ไม่ต้อง refetch บ่อย
    staleTime: 5 * 60 * 1000, // Cache 5 นาที
    gcTime: 60 * 60 * 1000, // เก็บ cache 1 ชั่วโมง
    retry: 1,
  });
};

/**
 * useOpenAICost Hook
 * 
 * หน้าที่: ดึงข้อมูลค่าใช้จ่าย OpenAI (OpenAI Cost Tracking)
 * - ดึงค่าใช้จ่ายรายวันจาก database
 * - Sync ข้อมูลจาก OpenAI API
 * 
 * API: system-openai-sync (สำหรับ sync)
 * Database: openai_costs table (สำหรับ query)
 * 
 * ทำไมต้องแก้ไข?
 * - ใช้ API client utility สำหรับ sync function
 * - ลบ hardcoded SUPABASE_URL
 */

// Hook สำหรับ Sync ข้อมูลจาก OpenAI ไป Database
export const useSyncOpenAICost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
      const { createApiClient } = await import('@/utils/apiClient');
      const api = await createApiClient();

      const response = await api.post('system-openai-sync', {
        start_date: startDate,
        end_date: endDate
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to sync data');
      }

      /**
       * Unwrap payload จาก Edge Function / ApiClient ให้ได้ object ที่มี startDate, openAIRawData อยู่ชั้นที่ถูกต้อง
       * รองรับ: { startDate, openAIRawData, ... } | { data: { ... } } | ซ้อนหลายชั้น
       */
      const unwrapOpenAISyncPayload = (raw: unknown, depth = 0): Record<string, unknown> => {
        if (!raw || typeof raw !== 'object' || depth > 6) return {};
        const obj = raw as Record<string, unknown>;
        const hasPayloadShape =
          'startDate' in obj ||
          'openAIRawData' in obj ||
          'parsedRecords' in obj ||
          'recordsSynced' in obj;
        if (hasPayloadShape) return obj;
        if ('data' in obj && obj.data !== null && typeof obj.data === 'object') {
          return unwrapOpenAISyncPayload(obj.data, depth + 1);
        }
        return obj;
      };

      const syncData = unwrapOpenAISyncPayload(response.data);
      const syncResult: { success: boolean; data: Record<string, unknown> } = {
        success: true,
        data: syncData,
      };

      if (syncData.success === false) {
        throw new Error(
          (typeof syncData.error === 'string' && syncData.error) || 'Failed to sync data'
        );
      }

      const d = syncResult.data as Record<string, unknown>;
      const diag = (d.diagnostics as Record<string, unknown> | undefined) ?? {};
      const totalUsd = Number(d.totalCostUSD ?? 0);
      const totalBaht = Number(d.totalCostBaht ?? 0);
      const parsed = (d.parsedRecords as Array<{ cost_usd?: number }> | undefined) ?? [];
      const parsedCount = parsed.length;
      const nonZeroDays = parsed.filter((r) => (r.cost_usd ?? 0) > 0).length;
      const dataSource = String(d.dataSource ?? '');
      const costsEndpoint = String(diag.costsEndpoint ?? 'GET https://api.openai.com/v1/organization/costs');
      const usageEndpoint = String(
        diag.usageCompletionsEndpoint ?? 'GET https://api.openai.com/v1/organization/usage/completions'
      );
      const routeUsedLabel =
        dataSource === 'organization_usage_completions_estimated'
          ? `fallback → ${usageEndpoint} (estimated from tokens)`
          : `${costsEndpoint} (direct costs)`;

      // Log สั้นๆ แค่ที่ต้องใช้เช็ค
      console.groupCollapsed('[OpenAI Sync] สำเร็จ');
      console.log('ช่วงวันที่:', d.startDate, '→', d.endDate);
      console.log('ยอดรวม:', `$${totalUsd.toFixed(4)} USD (฿${totalBaht.toFixed(2)})`);
      console.log('เส้นที่ใช้ดึงข้อมูล:', routeUsedLabel);
      console.log('แหล่งที่บันทึก:', d.dataSource ?? '—', '| แถวในช่วง:', parsedCount, 'วัน', '| วันที่มียอด >0:', nonZeroDays, 'วัน');
      console.log('สรุปจากเซิร์ฟเวอร์:', {
        costsEndpoint: diag.costsEndpoint,
        usageCompletionsEndpoint: diag.usageCompletionsEndpoint,
        costsFetchStrategy: diag.costsFetchStrategy,
        strategiesTried: diag.strategiesTried,
        orgWideUsedWhileProjectIdSet: diag.orgWideUsedWhileProjectIdSet,
        firstBucketSample: diag.firstBucketSample,
        usageCompletionsStrategyUsed: diag.usageCompletionsStrategyUsed,
        usageCompletionsStrategiesTried: diag.usageCompletionsStrategiesTried,
        usdPerMillionTotalTokensEstimate: diag.usdPerMillionTotalTokensEstimate,
        orgCostsUsd: diag.costsApiSubtotalUSD,
        keyEnvVar: diag.authorizationKeySource,
        openaiOrgIdSet: diag.openaiOrgIdConfigured,
        openaiProjectIdFilter: diag.openaiProjectIdFilter ?? null,
        dashboardSessionBillingNote: diag.dashboardSessionBillingNote,
        hintIfZero: diag.zeroTotalHint,
      });
      if (diag.fallbackSkippedReason) {
        console.info('หมายเหตุ:', diag.fallbackSkippedReason);
      }
      console.groupEnd();

      if (totalUsd === 0 && parsedCount > 0) {
        console.warn(
          '[OpenAI Sync] ยอดรวมยัง $0 — ดูค่า hintIfZero / ตรวจ OPENAI_ORG_ID และว่ามี API usage ในช่วงวันที่เลือก (Project API key ใน secrets ไม่ถูกใช้สำหรับ endpoint นี้ — ใช้แค่ถ้าไม่มี OPENAI_ADMIN_KEY)'
        );
      }

      return syncResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openai-cost'] });
    },
    onError: (error: any) => {
      console.error('[OpenAI Sync] ล้มเหลว:', error.message);
    }
  });
};

function formatDisplayDate(date: Date): string {
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 
                      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  return `${date.getDate()} ${thaiMonths[date.getMonth()]}`;
}

