import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { createFacebookAdsService, createFacebookAdsServices } from "@/utils/facebookAdsUtils";
import { getMarketingFunctionUrl } from "@/config";
import { env } from "@/lib/env";
import type { Database } from "@/integrations/supabase/types";

type AdsCampaign = Database["public"]["Tables"]["ads_campaigns"]["Row"];
type AdsCampaignInsert = Database["public"]["Tables"]["ads_campaigns"]["Insert"];
type AdsCampaignUpdate = Database["public"]["Tables"]["ads_campaigns"]["Update"];

export const useAdsCampaigns = (options?: {
  statusFilter?: 'all' | 'active' | 'inactive' | 'archived';
  dateRange?: { from: Date; to: Date };
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createEdgeFunctionHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (env.SUPABASE_ANON_KEY) {
      headers.apikey = env.SUPABASE_ANON_KEY;
      headers.Authorization = `Bearer ${env.SUPABASE_ANON_KEY}`;
    }
    return headers;
  };

  // Fetch campaigns from database with filters
  const {
    data: campaigns = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["ads-campaigns", options?.statusFilter, options?.dateRange],
    queryFn: async () => {
      let query = supabase
        .from("ads_campaigns")
        .select("*");

      // Filter by campaign status
      if (options?.statusFilter && options.statusFilter !== 'all') {
        query = query.eq("campaign_status", options.statusFilter);
      }

      // Order by created_at
      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching campaigns:", error);
        throw error;
      }

      let result = data as AdsCampaign[];

      // Filter by date range (campaign running time)
      if (options?.dateRange?.from && options?.dateRange?.to) {
        result = result.filter(c => {
          if (c.campaign_start_time && c.campaign_stop_time) {
            const campaignStart = new Date(c.campaign_start_time);
            const campaignStop = new Date(c.campaign_stop_time);
            // Campaign รันในช่วงนี้ถ้า: start <= range.to && stop >= range.from
            return campaignStart <= options.dateRange!.to && campaignStop >= options.dateRange!.from;
          } else if (c.campaign_start_time) {
            const campaignStart = new Date(c.campaign_start_time);
            return campaignStart <= options.dateRange!.to;
          } else if (c.facebook_created_time) {
            // Fallback: ใช้ facebook_created_time
            const createdTime = new Date(c.facebook_created_time);
            return createdTime >= options.dateRange!.from && createdTime <= options.dateRange!.to;
          }
          return true;
        });
      }

      return result;
    },
  });

  // Fetch active campaigns only (Ad Active + Campaign Active)
  const {
    data: activeCampaigns = [],
  } = useQuery({
    queryKey: ["ads-campaigns", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads_campaigns")
        .select("*")
        .eq("status", "active")
        .eq("campaign_status", "active")  // เพิ่มเงื่อนไข: Campaign ต้อง Active ด้วย
        .order("facebook_created_time", { ascending: false, nullsFirst: false });

      if (error) {
        console.error("Error fetching active campaigns:", error);
        throw error;
      }

      return data as AdsCampaign[];
    },
  });

  // Fetch active campaigns running this month (for lead creation)
  // Logic: Campaign Active + กำลังรันในเดือนนี้
  const {
    data: activeCampaignsThisMonth = [],
  } = useQuery({
    queryKey: ["ads-campaigns", "active", "this-month"],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // วันสุดท้ายของเดือน
      
      // Set เวลา
      startOfMonth.setHours(0, 0, 0, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      const { data, error } = await supabase
        .from("ads_campaigns")
        .select("*")
        .eq("campaign_status", "active")  // Campaign ต้อง Active
        .order("facebook_created_time", { ascending: false, nullsFirst: false });

      if (error) {
        console.error("Error fetching active campaigns this month:", error);
        throw error;
      }

      // Filter ฝั่ง client: Campaign ที่กำลังรันในเดือนนี้
      const filtered = (data || []).filter(c => {
        if (c.campaign_start_time && c.campaign_stop_time) {
          // มี start และ stop time
          const campaignStart = new Date(c.campaign_start_time);
          const campaignStop = new Date(c.campaign_stop_time);
          // Campaign รันในเดือนนี้ถ้า: start <= เดือนนี้ end && stop >= เดือนนี้ start
          return campaignStart <= endOfMonth && campaignStop >= startOfMonth;
        } else if (c.campaign_start_time) {
          // มีแค่ start time (รันต่อเนื่อง)
          const campaignStart = new Date(c.campaign_start_time);
          // ถ้า Campaign เริ่มก่อนหรือในเดือนนี้ = กำลังรัน
          return campaignStart <= endOfMonth;
        } else {
          // ไม่มีข้อมูล campaign time → fallback ให้แสดงทุกตัว
          return true;
        }
      });

      return filtered as AdsCampaign[];
    },
  });

  // Create campaign manually
  const createCampaignMutation = useMutation({
    mutationFn: async (newCampaign: AdsCampaignInsert) => {
      const { data, error } = await supabase
        .from("ads_campaigns")
        .insert(newCampaign)
        .select()
        .single();

      if (error) {
        console.error("Error creating campaign:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads-campaigns"] });
      toast({
        title: "✅ สร้างแคมเปญสำเร็จ",
        description: "เพิ่มแคมเปญโฆษณาใหม่เรียบร้อยแล้ว",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถสร้างแคมเปญได้",
        variant: "destructive",
      });
    },
  });

  // Update campaign
  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: AdsCampaignUpdate }) => {
      const { data, error } = await supabase
        .from("ads_campaigns")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating campaign:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads-campaigns"] });
      toast({
        title: "✅ อัปเดทแคมเปญสำเร็จ",
        description: "บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถอัปเดทแคมเปญได้",
        variant: "destructive",
      });
    },
  });

  // Delete campaign
  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("ads_campaigns")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting campaign:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads-campaigns"] });
      toast({
        title: "✅ ลบแคมเปญสำเร็จ",
        description: "ลบแคมเปญโฆษณาเรียบร้อยแล้ว",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถลบแคมเปญได้",
        variant: "destructive",
      });
    },
  });

  // Sync from Facebook API (client env หรือ Edge Function เมื่อไม่ตั้ง env)
  const syncFromFacebookMutation = useMutation({
    mutationFn: async (options?: { statusFilter?: 'all' | 'active' | 'inactive' }) => {
      const services = createFacebookAdsServices();
      let fbAds: any[];
      let captionFetchResult: any;

      if (services.length > 0) {
        // ดึงจาก client (มี VITE_FACEBOOK_* ใน .env)
        const allResults = await Promise.all(
          services.map((service) => service.getAdsWithCreatives(undefined, options))
        );
        fbAds = allResults.flatMap((data) => Array.isArray(data) ? data : []);
        captionFetchResult = (allResults[0] as any)?.__captionFetchResult;
      } else {
        // ใช้ Edge Function (Secrets: FACEBOOK_ACCESS_TOKEN, FACEBOOK_AD_ACCOUNT_ID)
        const url = getMarketingFunctionUrl('marketing-facebook-ads-sync');
        const res = await fetch(url, {
          method: "POST",
          headers: createEdgeFunctionHeaders(),
          body: JSON.stringify({ statusFilter: options?.statusFilter ?? "all" }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || "Sync failed");
        }
        if (!data?.success || !Array.isArray(data.ads)) {
          throw new Error(data?.error || "No ads in response");
        }
        fbAds = data.ads;
        captionFetchResult = data.captionFetchResult ?? null;
      }

      if (!fbAds || fbAds.length === 0) {
        throw new Error("No ads found in Facebook");
      }

      // ตรวจสอบผลการดึง Caption (ถ้ามี) — ไม่แสดง warning เมื่อ sync มาจาก Edge Function
      let captionWarning: string | null = null;
      const fromEdgeFunction = captionFetchResult?.source === "edge_function";

      if (captionFetchResult && !fromEdgeFunction) {
        if (captionFetchResult.tokenExpired) {
          captionWarning = 'Page Access Token หมดอายุแล้ว! กรุณาสร้าง Token ใหม่เพื่อดึง Caption/ข้อความ';
        } else if (captionFetchResult.tokenNotConfigured) {
          captionWarning = 'Page Access Token ยังไม่ได้ตั้งค่า! กรุณาตั้งค่า VITE_FACEBOOK_PAGE_ACCESS_TOKEN หรือ VITE_FACEBOOK_PAGES ในไฟล์ .env';
        } else if (captionFetchResult.enriched === 0 && captionFetchResult.total > 0) {
          captionWarning = `ไม่สามารถดึง Caption/ข้อความได้ (0/${captionFetchResult.total} posts) - ตรวจสอบ Console สำหรับรายละเอียด`;
        }
      }
      
      // เก็บ warning ไว้ใน ads object เพื่อใช้ใน onSuccess
      if (captionWarning) {
        (fbAds as any).__captionWarning = captionWarning;
      }

      // บันทึกลงฐานข้อมูล (upsert) — ใช้ allSettled เพื่อไม่ให้แถวเดียว fail แล้วหยุดทั้งหมด และให้ invalidate หน้าได้เสมอ
      const upsertResults = await Promise.allSettled(
        fbAds.map(async (ad) => {
          const fbStatus = (ad.status || "").toUpperCase();
          const status: "active" | "inactive" | "archived" =
            fbStatus === "ACTIVE" ? "active"
            : fbStatus === "ARCHIVED" || fbStatus === "DELETED" ? "archived"
            : "inactive";

          let campaignStatus: "active" | "inactive" | "archived" | null = null;
          if (ad.campaign?.status) {
            const fs = ad.campaign.status.toUpperCase();
            campaignStatus = fs === "ACTIVE" ? "active" : fs === "ARCHIVED" || fs === "DELETED" ? "archived" : "inactive";
          }

          const description = ad.creative?.message || null;
          const campaignData: AdsCampaignInsert = {
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
            description,
            facebook_created_time: ad.created_time || null,
          };

          const { error } = await supabase
            .from("ads_campaigns")
            .upsert(campaignData, { onConflict: "facebook_ad_id" });

          if (error) {
            console.error("Error upserting campaign:", ad.id, error);
            throw error;
          }
        })
      );

      const successCount = upsertResults.filter((r) => r.status === "fulfilled").length;
      const errorCount = upsertResults.filter((r) => r.status === "rejected").length;
      if (errorCount > 0) {
        console.warn(`⚠️ Sync: ${successCount} saved, ${errorCount} failed`);
      }

      return {
        count: fbAds.length,
        successCount,
        errorCount,
        captionWarning: captionWarning || null
      };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ads-campaigns"] });

      const desc = result.errorCount
        ? `บันทึก ${result.successCount} แอด, ล้มเหลว ${result.errorCount} แอด — หน้าเว็บจะโหลดข้อมูลที่บันทึกได้แล้ว`
        : `ดึงข้อมูล ${result.count} แอดจาก Facebook เรียบร้อยแล้ว`;
      toast({
        title: "✅ Sync สำเร็จ",
        description: desc,
      });

      if (result.errorCount > 0) {
        toast({
          title: "⚠️ บางแอดบันทึกไม่สำเร็จ",
          description: "ดู Console (F12) สำหรับรายละเอียด — ข้อมูลที่บันทึกได้จะแสดงบนหน้าแล้ว",
          variant: "destructive",
        });
      }
      if (result.captionWarning) {
        toast({
          title: "⚠️ คำเตือน: Caption ไม่สามารถดึงได้",
          description: result.captionWarning,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Sync error:", error);
      toast({
        title: "❌ Sync ไม่สำเร็จ",
        description: error.message || "ไม่สามารถดึงข้อมูลจาก Facebook ได้",
        variant: "destructive",
      });
    },
  });

  // Get lead count for each campaign
  const getLeadCountForCampaign = async (campaignId: number): Promise<number> => {
    const { count, error } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("ad_campaign_id", campaignId);

    if (error) {
      console.error("Error counting leads:", error);
      return 0;
    }

    return count || 0;
  };

  return {
    // Data
    campaigns,
    activeCampaigns,
    activeCampaignsThisMonth,
    isLoading,
    error,

    // Actions
    createCampaign: createCampaignMutation.mutate,
    updateCampaign: updateCampaignMutation.mutate,
    deleteCampaign: deleteCampaignMutation.mutate,
    syncFromFacebook: syncFromFacebookMutation.mutate,
    refetch,

    // Helper
    getLeadCountForCampaign,

    // Loading states
    isCreating: createCampaignMutation.isPending,
    isUpdating: updateCampaignMutation.isPending,
    isDeleting: deleteCampaignMutation.isPending,
    isSyncing: syncFromFacebookMutation.isPending,
  };
};

