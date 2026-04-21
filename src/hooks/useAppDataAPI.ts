/**
 * useAppDataAPI Hook
 * 
 * หน้าที่: ดึงข้อมูลรวมสำหรับ App (Combined App Data)
 * - รวม leads, sales team, user data ในครั้งเดียว
 * - ใช้สำหรับ dashboard และหน้าหลักๆ
 * 
 * API: core-leads-lead-management
 * 
 * ทำไมต้องแก้ไข?
 * - ใช้ API client utility แทน duplicate fetch code
 * - ใช้ centralized types (Lead) แทน any
 * - ลบ hardcoded SUPABASE_URL
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { useToast } from "./useToast";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { getSalesDataInPeriod } from "@/utils/salesUtils";
import { useCacheStrategy } from "@/lib/cacheStrategies";
import { filterLeadsWithContact } from "@/utils/leadQueryFilters";
import { createApiClient } from "@/utils/apiClient";
import type { Lead, LeadCategory, UserWithProfile } from "@/types";

// Types for the combined data
export interface AppData {
  leads: Lead[];
  salesTeam: Array<{
    id: number;
    name: string;
    email: string;
    user_id?: string;
    // Add other sales team properties as needed
  }>;
  user: UserWithProfile | null;
  salesMember: {
    id: number;
    name: string;
    email: string;
    user_id?: string;
    // Add other sales member properties as needed
  } | null;
}

export interface AppDataOptions {
  category?: LeadCategory | 'Wholesales'; // Support legacy 'Wholesales'
  includeUserData?: boolean;
  includeSalesTeam?: boolean;
  includeLeads?: boolean;
  limit?: number;
}

/**
 * Centralized Data Hook - Combines multiple API calls into one
 * This prevents duplicate API calls and improves performance
 */
export const useAppData = (options?: AppDataOptions) => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const realtimeCacheStrategy = useCacheStrategy('REALTIME');
  const queryClient = useQueryClient();
  const {
    category = 'Package',
    includeUserData = true,
    includeSalesTeam = true,
    includeLeads = true,
    limit
  } = options || {};

  const queryKey = [
    ...QUERY_KEYS.APP_DATA.DASHBOARD(category),
    includeUserData,
    includeSalesTeam,
    includeLeads
  ];
  
  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<AppData> => {
      // Check if user is authenticated
      if (!user?.id) {
        return {
          leads: [],
          salesTeam: [],
          user: null,
          salesMember: null
        };
      }

      const result: AppData = {
        leads: [],
        salesTeam: [],
        user: null,
        salesMember: null
      };

      try {
        // เพิ่ม performance monitoring
        const startTime = performance.now();
        
        // ใช้ API client utility แทน duplicate fetch code
        const api = await createApiClient();
        
        // Build query parameters
        const params: Record<string, string> = {
          category: category || 'Package',
          includeUserData: includeUserData.toString(),
          includeSalesTeam: includeSalesTeam.toString(),
          includeLeads: includeLeads.toString(),
        };
        if (limit) {
          params.limit = limit.toString();
        }
        if (user?.id) {
          params.userId = user.id;
        }

        const apiResult = await api.get<AppData>('core-leads-lead-management', params);
        
        if (!apiResult.success) {
          throw new Error(apiResult.error || 'API request failed');
        }

        const endTime = performance.now();
        const queryTime = endTime - startTime;
        
        // Log performance
        if (queryTime > 5000) {
          console.warn(`🐌 Slow useAppData query: ${queryTime.toFixed(2)}ms`);
        } else {

        }

        // Process API result
        if (apiResult.data) {
          result.user = apiResult.data.user;
          result.salesTeam = apiResult.data.salesTeam || [];
          result.leads = apiResult.data.leads || [];
          
          // Find sales member associated with user
          if (result.user && result.salesTeam.length > 0) {
            const salesMember = result.salesTeam.find(member => 
              member.user_id === result.user?.id
            );
            result.salesMember = salesMember || null;
          }
        }

        // Sales member data is already processed by API

        return result;
      } catch (error) {
        console.error('Error in useAppData queryFn:', error);
        return {
          leads: [],
          salesTeam: [],
          user: null,
          salesMember: null
        };
      }
    },
    enabled: !!user?.id && !loading,
    ...realtimeCacheStrategy, // ✅ ใช้ REALTIME cache strategy
  });

  // Accept lead mutation
  const acceptLeadMutation = useMutation({
    mutationFn: async ({ leadId, salesOwnerId }: { leadId: number; salesOwnerId: number }) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post('core-leads-lead-mutations', {
        action: 'accept_lead',
        leadId,
        salesOwnerId
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to accept lead');
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['app_data'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEADS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SALES_TEAM.ALL });
      
      // Invalidate MyLeads queries for all categories to ensure MyLeads pages are updated
      queryClient.invalidateQueries({ queryKey: ['app_data', 'my_leads'] });
      
      toast({
        title: "สำเร็จ",
        description: "รับลีดเรียบร้อยแล้ว",
      });
    },
    onError: (error) => {
      console.error('Error accepting lead:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถรับลีดได้",
        variant: "destructive",
      });
    },
  });

  // Assign sales owner mutation
  const assignSalesOwnerMutation = useMutation({
    mutationFn: async ({ leadId, salesOwnerId }: { leadId: number; salesOwnerId: number }) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post('core-leads-lead-mutations', {
        action: 'assign_sales_owner',
        leadId,
        salesOwnerId
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to assign sales owner');
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['app_data'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEADS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SALES_TEAM.ALL });
      
      // Invalidate MyLeads queries for all categories to ensure MyLeads pages are updated
      queryClient.invalidateQueries({ queryKey: ['app_data', 'my_leads'] });
      
      toast({
        title: "สำเร็จ",
        description: "มอบหมายลีดเรียบร้อยแล้ว",
      });
    },
    onError: (error) => {
      console.error('Error assigning sales owner:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถมอบหมายลีดได้",
        variant: "destructive",
      });
    },
  });

  // Transfer lead mutation - ลบ sale_owner_id และเปลี่ยน category
  const transferLeadMutation = useMutation({
    mutationFn: async ({ leadId, newCategory }: { leadId: number; newCategory: LeadCategory }) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post('core-leads-lead-mutations', {
        action: 'transfer_lead',
        leadId,
        newCategory
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to transfer lead');
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['app_data'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEADS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SALES_TEAM.ALL });
      
      // Invalidate MyLeads queries for all categories to ensure MyLeads pages are updated
      queryClient.invalidateQueries({ queryKey: ['app_data', 'my_leads'] });
      
      toast({
        title: "สำเร็จ",
        description: "โอนลีดเรียบร้อยแล้ว",
      });
    },
    onError: (error) => {
      console.error('Error transferring lead:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโอนลีดได้",
        variant: "destructive",
      });
    },
  });

  // Add lead mutation
  const addLeadMutation = useMutation({
    mutationFn: async (leadData: LeadInsert) => {
      // ใช้ API client utility แทน duplicate fetch code
      // ใช้ LeadInsert type แทน any เพื่อ type safety
      const api = await createApiClient();
      
      const response = await api.post<Lead>('core-leads-lead-mutations', {
        action: 'add_lead',
        leadData
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to add lead');
      }
      
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['app_data'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEADS.ALL });
      
      // Invalidate MyLeads queries for all categories to ensure MyLeads pages are updated
      queryClient.invalidateQueries({ queryKey: ['app_data', 'my_leads'] });
      
      toast({
        title: "สำเร็จ",
        description: "เพิ่มลีดใหม่เรียบร้อยแล้ว",
      });
    },
    onError: (error) => {
      console.error('Error adding lead:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มลีดได้",
        variant: "destructive",
      });
    },
  });

  return {
    // Query data
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    
    // Mutations
    acceptLead: acceptLeadMutation.mutateAsync,
    assignSalesOwner: assignSalesOwnerMutation.mutateAsync,
    transferLead: transferLeadMutation.mutateAsync,
    addLead: addLeadMutation.mutateAsync,
    
    // Loading states
    isAcceptingLead: acceptLeadMutation.isPending,
    isAssigningSalesOwner: assignSalesOwnerMutation.isPending,
    isTransferringLead: transferLeadMutation.isPending,
    isCreatingLead: addLeadMutation.isPending,
  };
};

/**
 * Specialized hook for MyLeads pages
 */
export const useMyLeadsData = (category: 'Package' | 'Wholesale' | 'Wholesales') => {
  const { user, loading } = useAuth();
  const realtimeCacheStrategy = useCacheStrategy('REALTIME');

  return useQuery({
    queryKey: QUERY_KEYS.APP_DATA.MY_LEADS(user?.id || '', category),
    queryFn: async () => {
      if (!user?.id) return { leads: [], user: null, salesMember: null };

      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const params: Record<string, string> = {
        category: category || 'Package'
      };
      if (user?.id) {
        params.userId = user.id;
      }

      const apiResult = await api.get('core-my-leads-my-leads-data', params);
      
      if (!apiResult.success || !apiResult.data) {
        throw new Error(apiResult.error || 'Failed to fetch my leads data');
      }

      const { leads, user: userData, salesMember } = apiResult.data || {};

      // All data processing is already done by API
      return { leads: leads || [], user: userData, salesMember };
    },
    enabled: !!user?.id && !loading,
    ...realtimeCacheStrategy, // ✅ ใช้ REALTIME cache strategy
  });
};

/**
 * Enhanced hook for MyLeads pages with mutations
 */
export const useMyLeadsWithMutations = (category: 'Package' | 'Wholesale' | 'Wholesales') => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const realtimeCacheStrategy = useCacheStrategy('REALTIME');

  const query = useQuery({
    queryKey: QUERY_KEYS.APP_DATA.MY_LEADS(user?.id || '', category),
    queryFn: async () => {
      if (!user?.id) return { leads: [], user: null, salesMember: null };

      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const params: Record<string, string> = {
        category: category || 'Package'
      };
      if (user?.id) {
        params.userId = user.id;
      }

      const apiResult = await api.get('core-my-leads-my-leads', params);
      
      if (!apiResult.success) {
        throw new Error(apiResult.error || 'Failed to fetch my leads data');
      }

      const { leads, user: userData, salesMember } = apiResult.data;

      // All data processing is already done by API
      return { leads: leads || [], user: userData, salesMember };
    },
    enabled: !!user?.id && !loading,
    ...realtimeCacheStrategy, // ✅ ใช้ REALTIME cache strategy
  });

  // Transfer lead mutation - ลบ sale_owner_id และเปลี่ยน category
  const transferLeadMutation = useMutation({
    mutationFn: async ({ leadId, newCategory }: { leadId: number; newCategory: LeadCategory }) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post('core-leads-lead-mutations', {
        action: 'transfer_lead',
        leadId,
        newCategory
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to transfer lead');
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['app_data'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEADS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SALES_TEAM.ALL });
      
      // Invalidate MyLeads queries for all categories to ensure MyLeads pages are updated
      queryClient.invalidateQueries({ queryKey: ['app_data', 'my_leads'] });
      
      toast({
        title: "สำเร็จ",
        description: "โอนลีดเรียบร้อยแล้ว",
      });
    },
    onError: (error) => {
      console.error('Error transferring lead:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโอนลีดได้",
        variant: "destructive",
      });
    },
  });

  return {
    // Query data
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    
    // Mutations
    transferLead: transferLeadMutation.mutateAsync,
    
    // Loading states
    isTransferringLead: transferLeadMutation.isPending,
  };
};

/**
 * Specialized hook for Sales Team page
 */
export const useSalesTeamData = (dateRange?: string, dateRangeFilter?: { from?: Date; to?: Date }) => {
  const reportsCacheStrategy = useCacheStrategy('REPORTS');
  
  return useQuery({
    queryKey: [...QUERY_KEYS.APP_DATA.SALES_TEAM_PAGE, dateRange, dateRangeFilter],
    queryFn: async () => {
      try {
        // ใช้ API client utility แทน duplicate fetch code
        const api = await createApiClient();
        
        const params: Record<string, string> = {};
        if (dateRangeFilter?.from) {
          params.from = dateRangeFilter.from.toISOString();
        }
        if (dateRangeFilter?.to) {
          params.to = dateRangeFilter.to.toISOString();
        }

        const apiResult = await api.get('core-sales-team-sales-team-data', params);
        
        if (!apiResult.success || !apiResult.data) {
          throw new Error(apiResult.error || 'Failed to fetch sales team data');
        }

        const { salesTeam, leads, quotations } = apiResult.data;

      const salesOwnerIds = salesTeam.map(member => member.id);

      // Calculate date range if provided
      let dateFilter: { gte?: string; lte?: string } = {};
      if (dateRangeFilter?.from && dateRangeFilter?.to) {
        // Use DateRange if provided
        const startDate = new Date(dateRangeFilter.from);
        const endDate = new Date(dateRangeFilter.to);
        
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        dateFilter = {
          gte: startDate.toISOString(),
          lte: endDate.toISOString()
        };
      } else if (dateRange) {
        // Fallback to string dateRange
        const endDate = new Date();
        const startDate = new Date();
        
        if (dateRange === 'today') {
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
        } else {
          startDate.setDate(endDate.getDate() - parseInt(dateRange));
        }
        
        dateFilter = {
          gte: startDate.toISOString(),
          lte: endDate.toISOString()
        };
      }

      // All data processing is already done by API

      // allLeadsForConversion query removed - now using allLeads with filterLeadsWithContact

      // ✅ ใช้ utility function สำหรับดึงข้อมูลยอดขายที่ถูกต้อง
      // แก้ไขปัญหายอดขายหายไปจากลีดที่ซื้อซ้ำ
      let quotationsData: any[] = [];
      let productivityLogsData: any[] = [];
      let salesData: any = null; // ✅ ประกาศ salesData ภายนอก if block
      
      if (dateFilter.gte && dateFilter.lte) {
        try {
          console.log('Getting sales data for period:', { gte: dateFilter.gte, lte: dateFilter.lte });
          salesData = await getSalesDataInPeriod(
            dateFilter.gte,
            dateFilter.lte
          );
          
          console.log('Sales data received:', { 
            quotations: salesData.quotations?.length || 0,
            salesLogs: salesData.salesLogs?.length || 0,
            salesLeads: salesData.salesLeads?.length || 0
          });
          
          quotationsData = salesData.quotations;
          productivityLogsData = salesData.salesLogs;
          // Store salesLeads for deduplication calculation
          salesData.salesLeads = salesData.salesLeads || [];
        } catch (error) {
          console.error('Error getting sales data in period:', error);
          // Continue with empty data instead of failing the entire query
          quotationsData = [];
          productivityLogsData = [];
          salesData = null; // ✅ ตั้งค่า salesData เป็น null เมื่อ error
        }
      } else {
        console.log('No date filter provided, skipping sales data fetch');
      }

      // Calculate additional metrics for each sales team member
      const enhancedSalesTeam = salesTeam.map(member => {
        // ✅ Count deals closed by this member (นับจาก QT หลัง deduplication)
        let dealsClosed = 0;
        let pipelineValue = 0;
        
        if (salesData?.salesLeads) {
          // ✅ ใช้ saleId จาก log (คนที่ปิดการขายจริงๆ) แทน saleOwnerId จาก lead
          const memberSalesLeads = salesData.salesLeads.filter(lead => 
            (lead.saleId || lead.saleOwnerId) === member.id
          );
          // นับจำนวน QT ที่ปิดการขาย (หลัง deduplication)
          dealsClosed = memberSalesLeads.reduce((sum, lead) => sum + (lead.totalQuotationCount || 0), 0);
          // คำนวณมูลค่ารวม (หลัง deduplication)
          pipelineValue = memberSalesLeads.reduce((sum, lead) => sum + (lead.totalQuotationAmount || 0), 0);
        } else {
          // Fallback: Use API data
          dealsClosed = 0;
          pipelineValue = 0;
        }
        
        // Debug log for member pipeline calculation
        if (member.id === 1) { // Log for first member only to avoid spam
          console.log(`Member ${member.name} pipeline calculation:`, {
            salesLeadsAvailable: !!salesData?.salesLeads,
            memberSalesLeads: salesData?.salesLeads?.filter(lead => (lead.saleId || lead.saleOwnerId) === member.id)?.length || 0,
            quotationsDataLength: quotationsData?.length || 0,
            pipelineValue
          });
        }

        // Calculate conversion rate (deals closed / total leads) - convert to percentage
        // ✅ Backend Edge Function กรอง has_contact_info และ EV + Partner platforms แล้ว
        // ไม่ต้องกรอง contact หรือ platform ใน frontend อีก
        // รวมทั้ง sale_owner_id และ post_sales_owner_id สำหรับ conversion rate
        const totalLeads = leads?.filter((lead: any) => 
          (lead.sale_owner_id === member.id || lead.post_sales_owner_id === member.id)
        ).length || 0;
        const conversionRate = totalLeads > 0 ? (dealsClosed / totalLeads) * 100 : 0;



        return {
          ...member,
          deals_closed: dealsClosed,
          pipeline_value: pipelineValue,
          conversion_rate: Math.round(conversionRate * 100) / 100, // Round to 2 decimal places
          total_leads: totalLeads // Add total leads for team calculation
        };
      });

        return {
          salesTeam: enhancedSalesTeam || [],
          leads: leads || [],
          quotations: quotations || []
        };
      } catch (error) {
        console.error('Error in useSalesTeamData:', error);
        return {
          salesTeam: [],
          leads: [],
          quotations: []
        };
      }
    },
    ...reportsCacheStrategy, // ✅ ใช้ REPORTS cache strategy
  });
};

// New hook for filtered sales team data by role
export const useFilteredSalesTeamData = (role: 'sale_package' | 'sale_wholesale' | 'manager_sale') => {
  const [data, setData] = useState<{ salesTeam: any[] }>({ salesTeam: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Define roles to include based on the requested role
        let rolesToInclude: string[] = [];
        
        if (role === 'sale_package') {
          // For package, include both sale_package and manager_sale
          rolesToInclude = ['sale_package', 'manager_sale'];
        } else if (role === 'sale_wholesale') {
          // For wholesale, include both sale_wholesale and manager_sale
          rolesToInclude = ['sale_wholesale', 'manager_sale'];
        } else {
          // For manager_sale only
          rolesToInclude = ['manager_sale'];
        }
        
        // ใช้ API client utility แทน duplicate fetch code
        const api = await createApiClient();
        
        const apiResult = await api.get('core-sales-team-filtered-sales-team', {
          roles: rolesToInclude.join(',')
        });
        
        if (!apiResult.success || !apiResult.data) {
          throw new Error(apiResult.error || 'Failed to fetch filtered sales team data');
        }

        const { salesTeam } = apiResult.data;


        setData({ salesTeam: salesTeam || [] });
      } catch (err) {
        setError(err as Error);
        setData({ salesTeam: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role]);

  return { data, loading, error };
};
