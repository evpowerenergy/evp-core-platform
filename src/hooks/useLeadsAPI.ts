/**
 * useLeadsAPI Hook
 * 
 * ทำไมต้องแก้ไขไฟล์นี้?
 * 1. ใช้ API client utility แทน duplicate fetch code
 * 2. ใช้ centralized types (Lead, ApiResponse) แทน any
 * 3. ลบ hardcoded SUPABASE_URL
 * 4. Consistent error handling
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { createApiClient } from "@/utils/apiClient";
import type { Lead, LeadInsert, ApiResponse, LeadCategory } from "@/types";

interface LeadsListResponse {
  leads: Lead[];
}

interface SalesTeamResponse {
  salesTeam: Array<{
    id: number;
    name: string;
    email: string;
    // Add other sales team properties as needed
  }>;
}

interface LeadMutationsResponse {
  data?: Lead;
}

export const useLeads = (category?: LeadCategory) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Enhanced fetch with better performance - limit to 100 records by default
  const { data: leads = [], isLoading: leadsLoading, refetch } = useQuery({
    queryKey: ['leads', category],
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      const params = category ? { category } : undefined;
      
      const response = await api.get<LeadsListResponse>('core-leads-leads-list', params);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch leads');
      }

      return response.data.leads || [];
    },
    staleTime: 1000 * 60 * 3, // 3 minutes - balanced caching
    gcTime: 1000 * 60 * 15, // 15 minutes - reasonable cleanup
    refetchOnWindowFocus: false,
  });

  // Enhanced sales team query with active filter
  const { data: salesTeam = [], isLoading: salesTeamLoading } = useQuery({
    queryKey: ['sales_team'],
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get<SalesTeamResponse>('core-leads-sales-team-list');
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch sales team');
      }

      return response.data.salesTeam || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - sales team changes less frequently
    gcTime: 1000 * 60 * 20, // 20 minutes
    refetchOnWindowFocus: false,
  });

  // Accept lead mutation
  const acceptLeadMutation = useMutation({
    mutationFn: async ({ leadId, salesOwnerId }: { leadId: number; salesOwnerId: number }) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post<LeadMutationsResponse>('core-leads-lead-mutations', {
        action: 'accept_lead',
        leadId,
        salesOwnerId
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to accept lead');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['sales_team'] });
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
      
      const response = await api.post<LeadMutationsResponse>('core-leads-lead-mutations', {
        action: 'assign_sales_owner',
        leadId,
        salesOwnerId
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to assign sales owner');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['sales_team'] });
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
      
      const response = await api.post<LeadMutationsResponse>('core-leads-lead-mutations', {
        action: 'transfer_lead',
        leadId,
        newCategory
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to transfer lead');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['sales_team'] });
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
      
      const response = await api.post<LeadMutationsResponse>('core-leads-lead-mutations', {
        action: 'add_lead',
        leadData
      });

      if (!response.success) {
        // Check if it's a duplicate phone error
        const error = response.error || '';
        if (response.error?.includes('DUPLICATE_PHONE') || error.includes('เบอร์โทรศัพท์') || error.includes('มีอยู่ในระบบ')) {
          throw new Error(error || 'เบอร์โทรศัพท์นี้มีอยู่ในระบบแล้ว');
        }
        throw new Error(error || 'Failed to add lead');
      }

      return response.data;
    },
    onSuccess: () => {
      // Invalidate all relevant queries including useAppData cache
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['app_data'] });
      queryClient.invalidateQueries({ queryKey: ['sales_team'] });
      // Invalidate MyLeads queries for all categories to ensure MyLeads pages are updated
      queryClient.invalidateQueries({ queryKey: ['app_data', 'my_leads'] });
      
      toast({
        title: "สำเร็จ",
        description: "เพิ่มลีดใหม่เรียบร้อยแล้ว",
      });
    },
    onError: (error) => {
      console.error('Error adding lead:', error);
      const errorMessage = error instanceof Error ? error.message : 'ไม่สามารถเพิ่มลีดได้';
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return {
    leads,
    salesTeam,
    leadsLoading,
    salesTeamLoading,
    refetch,
    acceptLead: acceptLeadMutation.mutateAsync,
    assignSalesOwner: assignSalesOwnerMutation.mutateAsync,
    transferLead: transferLeadMutation.mutateAsync,
    addLead: addLeadMutation.mutateAsync,
    isAcceptingLead: acceptLeadMutation.isPending,
    isAssigningSalesOwner: assignSalesOwnerMutation.isPending,
    isTransferringLead: transferLeadMutation.isPending,
    isCreatingLead: addLeadMutation.isPending,
  };
};