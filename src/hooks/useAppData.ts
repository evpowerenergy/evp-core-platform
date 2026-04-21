import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./useToast";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { getSalesDataInPeriod } from "@/utils/salesUtils";
import { useCacheStrategy } from "@/lib/cacheStrategies";
import { filterLeadsWithContact } from "@/utils/leadQueryFilters";

// Types for the combined data
export interface AppData {
  leads: any[];
  salesTeam: any[];
  user: any;
  salesMember: any;
}

export interface AppDataOptions {
  category?: 'Package' | 'Wholesale' | 'Wholesales';
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
        
        // Run independent queries in parallel for better performance
        const [userResult, salesTeamResult, leadsResult] = await Promise.all([
          // 1. Get user data if needed
          includeUserData && user?.id 
            ? supabase
                .from('users')
                .select('id, first_name, last_name, role, department, position')
                .eq('auth_user_id', user.id)
                .single()
            : Promise.resolve({ data: null, error: null }),
          
          // 2. Get sales team data if needed
          includeSalesTeam
            ? supabase
                .from('sales_team_with_user_info')
                .select('id, user_id, name, email, status, current_leads, department, position')
                .eq('status', 'active')
            : Promise.resolve({ data: null, error: null }),
          
          // 3. Get leads data if needed
          includeLeads
            ? (async () => {
                let query = supabase
                  .from('leads')
                  .select(`
                    id,
                    full_name,
                    display_name,
                    tel,
                    line_id,
                    region,
                    category,
                    status,
                    platform,
                    sale_owner_id,
                    created_at_thai,
                    updated_at_thai,
                    operation_status,
                    avg_electricity_bill,
                    notes,
                    created_by
                  `)
                  .eq('category', category)
                  .order('created_at_thai', { ascending: false });
                
                // Filter เฉพาะลีดที่มีเบอร์โทรหรือ Line ID
                query = filterLeadsWithContact(query);
                
                if (limit) {
                  query = query.limit(limit);
                }
                
                return await query;
              })()
            : Promise.resolve({ data: null, error: null })
        ]);

        const endTime = performance.now();
        const queryTime = endTime - startTime;
        
        // Log performance
        if (queryTime > 5000) {
          console.warn(`🐌 Slow useAppData query: ${queryTime.toFixed(2)}ms`);
        } else {

        }

        // Process user data
        
        if (userResult.data && !userResult.error) {
          result.user = userResult.data;
        } else if (userResult.error) {
          console.error('❌ Error fetching user data:', userResult.error);
        }

        // Process sales team data
        if (salesTeamResult.data && !salesTeamResult.error) {
          result.salesTeam = salesTeamResult.data;
        } else if (salesTeamResult.error) {
          console.error('❌ Error fetching sales team data:', salesTeamResult.error);
        }

        // Process leads data
        if (leadsResult.data && !leadsResult.error) {
          // Get creator information for each lead
          if (leadsResult.data.length > 0) {
            const creatorIds = [...new Set(leadsResult.data.map(lead => lead.created_by).filter(Boolean))] as string[];
            
            if (creatorIds.length > 0) {
              const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('id, first_name, last_name')
                .in('id', creatorIds);
              
              if (!usersError && usersData) {
                const usersMap = new Map(usersData.map(user => [user.id, user]));
                
                // Add creator_name to each lead
                leadsResult.data.forEach(lead => {
                  if (lead.created_by && usersMap.has(lead.created_by)) {
                    const user = usersMap.get(lead.created_by);
                    lead.creator_name = user.first_name && user.last_name 
                      ? `${user.first_name} ${user.last_name}`
                      : user.first_name || user.last_name || 'ไม่ระบุ';
                  } else {
                    lead.creator_name = null;
                  }
                });
              }
            }
          }
          
          result.leads = leadsResult.data;
        } else if (leadsResult.error) {
          console.error('❌ Error fetching leads data:', leadsResult.error);
        }

        // 4. Get sales member data if user data is available
        if (result.user && result.salesTeam) {
          // First try to find in active sales team
          let salesMember = result.salesTeam.find(
            (member: any) => member && member.user_id === result.user.id
          );
          
          // If not found in active team, try to find in all sales team (including inactive)
          if (!salesMember && result.user.role && ['sale_package', 'sale_wholesale', 'manager_sale'].includes(result.user.role)) {
            const { data: allSalesTeam, error: salesTeamError } = await supabase
              .from('sales_team_with_user_info')
              .select('id, user_id, name, email, status, current_leads, department, position')
              .eq('user_id', result.user.id);
            
            if (!salesTeamError && allSalesTeam && allSalesTeam.length > 0) {
              salesMember = allSalesTeam[0];
            }
          }
          
          if (salesMember) {
            result.salesMember = {
              ...salesMember,
              name: result.user.first_name && result.user.last_name 
                ? `${result.user.first_name} ${result.user.last_name}`
                : 'Unknown User',
              role: result.user.role
            };
          }
        }

        // If we have leads but no sales team, there might be a cache issue
        if (result.leads.length > 0 && result.salesTeam.length === 0) {
          // Force refetch on next render
          queryClient.invalidateQueries({ 
            queryKey: [...QUERY_KEYS.APP_DATA.DASHBOARD(category), true, true, true] 
          });
        }

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
      const { error } = await supabase
        .from('leads')
        .update({ 
          sale_owner_id: salesOwnerId,
          // updated_at_thai will be handled by trigger
        })
        .eq('id', leadId);

      if (error) {
        console.error('Error in acceptLead mutation:', error);
        throw error;
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
      const { error } = await supabase
        .from('leads')
        .update({ 
          sale_owner_id: salesOwnerId,
          // updated_at_thai will be handled by trigger
        })
        .eq('id', leadId);

      if (error) throw error;
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
    mutationFn: async ({ leadId, newCategory }: { leadId: number; newCategory: string }) => {
      const { error } = await supabase
        .from('leads')
        .update({ 
          sale_owner_id: null, // ลบ sale_owner_id
          category: newCategory, // เปลี่ยน category
          // updated_at_thai will be handled by trigger
        })
        .eq('id', leadId);

      if (error) throw error;
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
    mutationFn: async (leadData: any) => {
      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;
      return data;
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

      // Get user data and sales member info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, first_name, last_name, role')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        return { leads: [], user: null, salesMember: null };
      }

      // Get sales member data
      const { data: salesData, error: salesError } = await supabase
        .from('sales_team_with_user_info')
        .select('id, user_id, status, current_leads')
        .eq('user_id', userData.id)
        .single();

      const salesMember = salesError || !salesData ? null : {
        ...salesData,
        name: userData.first_name && userData.last_name 
          ? `${userData.first_name} ${userData.last_name}`
          : 'Unknown User',
        role: userData.role
      };

      // Get leads for this sales member
      // Query ทั้ง sale_owner_id และ post_sales_owner_id เพื่อให้เห็น lead ทั้งหมด
      const { data: ownerLeads, error: ownerLeadsError } = await supabase
        .from('leads')
        .select(`
          id, full_name, tel, line_id, status, platform, region, 
          created_at_thai, updated_at_thai, sale_owner_id, post_sales_owner_id, category, operation_status, avg_electricity_bill, notes, display_name, created_by
        `)
        .eq('sale_owner_id', salesMember?.id || 0)
        .eq('category', category)
        .order('updated_at_thai', { ascending: false });

      const { data: postSalesLeads, error: postSalesLeadsError } = await supabase
        .from('leads')
        .select(`
          id, full_name, tel, line_id, status, platform, region, 
          created_at_thai, updated_at_thai, sale_owner_id, post_sales_owner_id, category, operation_status, avg_electricity_bill, notes, display_name, created_by
        `)
        .eq('post_sales_owner_id', salesMember?.id || 0)
        .eq('category', category)
        .order('updated_at_thai', { ascending: false });

      // รวมและ distinct leads (ไม่ให้ซ้ำ)
      const allLeadsMap = new Map();
      (ownerLeads || []).forEach(lead => {
        allLeadsMap.set(lead.id, lead);
      });
      (postSalesLeads || []).forEach(lead => {
        allLeadsMap.set(lead.id, lead);
      });
      const leads = Array.from(allLeadsMap.values());
      const leadsError = ownerLeadsError || postSalesLeadsError;

      // Get creator information for each lead
      if (leads && leads.length > 0) {
        const creatorIds = [...new Set(leads.map(lead => lead.created_by).filter(Boolean))] as string[];
        
        if (creatorIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, first_name, last_name')
            .in('id', creatorIds);
          
          if (!usersError && usersData) {
            const usersMap = new Map(usersData.map(user => [user.id, user]));
            
            // Add creator_name to each lead (augment object to avoid TS error)
            (leads as Array<any>).forEach((lead) => {
              if (lead.created_by && usersMap.has(lead.created_by)) {
                const user = usersMap.get(lead.created_by);
                (lead as any).creator_name = user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user.first_name || user.last_name || 'ไม่ระบุ';
              } else {
                (lead as any).creator_name = null;
              }
            });
          }
        }

        // Get latest productivity log for each lead
        const leadIds = leads.map(lead => lead.id);
        
        if (leadIds.length > 0) {
          // ดึงข้อมูล productivity log ล่าสุดสำหรับแต่ละ lead
          const { data: productivityLogsData, error: productivityLogsError } = await supabase
            .from('lead_productivity_logs')
            .select(`
              id,
              lead_id,
              note,
              status,
              created_at_thai
            `)
            .in('lead_id', leadIds)
            .order('created_at_thai', { ascending: false });

          if (!productivityLogsError && productivityLogsData) {
            // สร้าง map ของ productivity log ล่าสุดสำหรับแต่ละ lead
            const latestLogsMap = new Map();
            productivityLogsData.forEach(log => {
              if (!latestLogsMap.has(log.lead_id)) {
                latestLogsMap.set(log.lead_id, log);
              }
            });

            // เพิ่มข้อมูล productivity log ล่าสุดให้กับแต่ละ lead
            (leads as Array<any>).forEach(lead => {
              const latestLog = latestLogsMap.get(lead.id);
              (lead as any).latest_productivity_log = latestLog || null;
            });
          }
        }
      }

      return {
        leads: leadsError ? [] : (leads || []),
        user: userData,
        salesMember
      };
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

      // Get user data and sales member info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, first_name, last_name, role')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        return { leads: [], user: null, salesMember: null };
      }

      // Get sales member data
      const { data: salesData, error: salesError } = await supabase
        .from('sales_team_with_user_info')
        .select('id, user_id, status, current_leads')
        .eq('user_id', userData.id)
        .single();

      const salesMember = salesError || !salesData ? null : {
        ...salesData,
        name: userData.first_name && userData.last_name 
          ? `${userData.first_name} ${userData.last_name}`
          : 'Unknown User',
        role: userData.role
      };

      // Get leads for this sales member
      // Query ทั้ง sale_owner_id และ post_sales_owner_id เพื่อให้เห็น lead ทั้งหมด
      const { data: ownerLeads, error: ownerLeadsError } = await supabase
        .from('leads')
        .select(`
          id, full_name, tel, line_id, status, platform, region, 
          created_at_thai, updated_at_thai, sale_owner_id, post_sales_owner_id, category, operation_status, avg_electricity_bill, notes, display_name, created_by
        `)
        .eq('sale_owner_id', salesMember?.id || 0)
        .eq('category', category)
        .order('updated_at_thai', { ascending: false });

      const { data: postSalesLeads, error: postSalesLeadsError } = await supabase
        .from('leads')
        .select(`
          id, full_name, tel, line_id, status, platform, region, 
          created_at_thai, updated_at_thai, sale_owner_id, post_sales_owner_id, category, operation_status, avg_electricity_bill, notes, display_name, created_by
        `)
        .eq('post_sales_owner_id', salesMember?.id || 0)
        .eq('category', category)
        .order('updated_at_thai', { ascending: false });

      // รวมและ distinct leads (ไม่ให้ซ้ำ)
      const allLeadsMap = new Map();
      (ownerLeads || []).forEach(lead => {
        allLeadsMap.set(lead.id, lead);
      });
      (postSalesLeads || []).forEach(lead => {
        allLeadsMap.set(lead.id, lead);
      });
      const leads = Array.from(allLeadsMap.values());
      const leadsError = ownerLeadsError || postSalesLeadsError;

      // Get creator information for each lead
      if (leads && leads.length > 0) {
        const creatorIds = [...new Set(leads.map(lead => lead.created_by).filter(Boolean))] as string[];
        
        if (creatorIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, first_name, last_name')
            .in('id', creatorIds);
          
          if (!usersError && usersData) {
            const usersMap = new Map(usersData.map(user => [user.id, user]));
            
            // Add creator_name to each lead (augment object to avoid TS error)
            (leads as Array<any>).forEach((lead) => {
              if (lead.created_by && usersMap.has(lead.created_by)) {
                const user = usersMap.get(lead.created_by);
                (lead as any).creator_name = user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user.first_name || user.last_name || 'ไม่ระบุ';
              } else {
                (lead as any).creator_name = null;
              }
            });
          }
        }

        // Get latest productivity log for each lead
        const leadIds = leads.map(lead => lead.id);
        
        if (leadIds.length > 0) {
          // ดึงข้อมูล productivity log ล่าสุดสำหรับแต่ละ lead
          const { data: productivityLogsData, error: productivityLogsError } = await supabase
            .from('lead_productivity_logs')
            .select(`
              id,
              lead_id,
              note,
              status,
              created_at_thai
            `)
            .in('lead_id', leadIds)
            .order('created_at_thai', { ascending: false });

          if (!productivityLogsError && productivityLogsData) {
            // สร้าง map ของ productivity log ล่าสุดสำหรับแต่ละ lead
            const latestLogsMap = new Map();
            productivityLogsData.forEach(log => {
              if (!latestLogsMap.has(log.lead_id)) {
                latestLogsMap.set(log.lead_id, log);
              }
            });

            // เพิ่มข้อมูล productivity log ล่าสุดให้กับแต่ละ lead
            (leads as Array<any>).forEach(lead => {
              const latestLog = latestLogsMap.get(lead.id);
              (lead as any).latest_productivity_log = latestLog || null;
            });
          }
        }
      }

      return {
        leads: leadsError ? [] : (leads || []),
        user: userData,
        salesMember
      };
    },
    enabled: !!user?.id && !loading,
    ...realtimeCacheStrategy, // ✅ ใช้ REALTIME cache strategy
  });

  // Transfer lead mutation - ลบ sale_owner_id และเปลี่ยน category
  const transferLeadMutation = useMutation({
    mutationFn: async ({ leadId, newCategory }: { leadId: number; newCategory: string }) => {
      const { error } = await supabase
        .from('leads')
        .update({ 
          sale_owner_id: null, // ลบ sale_owner_id
          category: newCategory, // เปลี่ยน category
          // updated_at_thai will be handled by trigger
        })
        .eq('id', leadId);

      if (error) throw error;
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
        // Get sales team data with metrics
        const { data: salesTeam, error: salesTeamError } = await supabase
          .from('sales_team_with_user_info')
          .select('id, name, email, status, current_leads');

        if (salesTeamError || !salesTeam?.length) {
          console.warn('Sales team data error or empty:', salesTeamError);
          return { salesTeam: [], leads: [], quotations: [] };
        }

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

      // Get leads data for all sales members with date filter
      // รวมทั้ง sale_owner_id และ post_sales_owner_id สำหรับ current_leads และ conversion rate
      let allLeadsQuery = supabase
        .from('leads')
        .select('id, sale_owner_id, post_sales_owner_id, status, created_at_thai, tel, line_id')
        .or(`sale_owner_id.in.(${salesOwnerIds.join(',')}),post_sales_owner_id.in.(${salesOwnerIds.join(',')})`)
        .in('status', ['กำลังติดตาม', 'ปิดการขาย']);

      // Apply filterLeadsWithContact to match Package Dashboard logic
      allLeadsQuery = filterLeadsWithContact(allLeadsQuery);

      if (dateFilter.gte && dateFilter.lte) {
        allLeadsQuery = allLeadsQuery
          .gte('created_at_thai', dateFilter.gte)
          .lte('created_at_thai', dateFilter.lte);
      }

      const { data: allLeads, error: leadsError } = await allLeadsQuery;

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
          // Fallback: Count deals closed by this member from productivity logs - ใช้ sale_id จาก productivity logs
          // Query productivity logs ที่ status = 'ปิดการขายแล้ว' และ sale_id = member.id
          if (productivityLogsData && productivityLogsData.length > 0) {
            const memberClosedLogs = productivityLogsData.filter(log => log.sale_id === member.id);
            dealsClosed = memberClosedLogs.length;
            
            // Get quotations for these logs
            const memberQuotations = quotationsData?.filter(quotation => {
              const productivityLog = productivityLogsData?.find(log => log.id === quotation.productivity_log_id);
              // ใช้ sale_id จาก productivity log แทน sale_owner_id จาก lead
              return productivityLog?.sale_id === member.id;
            }) || [];
            pipelineValue = memberQuotations.reduce((sum, quotation) => 
              sum + (quotation.amount || 0), 0
            );
          } else {
            // Last fallback: Count from leads status (ไม่แนะนำ - ใช้ sale_owner_id)
            dealsClosed = allLeads?.filter(lead => 
              (lead.sale_owner_id === member.id || lead.post_sales_owner_id === member.id) && lead.status === 'ปิดการขาย'
            ).length || 0;
            pipelineValue = 0;
          }
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
        // ใช้ logic เดียวกับ Package Dashboard - ใช้ allLeads ที่ผ่านการกรองแล้ว
        // รวมทั้ง sale_owner_id และ post_sales_owner_id สำหรับ conversion rate
        const totalLeads = allLeads?.filter(lead => 
          lead.sale_owner_id === member.id || lead.post_sales_owner_id === member.id
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
          leads: leadsError ? [] : (allLeads || []),
          quotations: quotationsData || []
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
        
        // Get sales team data filtered by specific roles
        const { data: salesTeam, error: salesTeamError } = await supabase
          .from('sales_team_with_user_info')
          .select(`
            id, name, email, status, current_leads, user_id,
            users!inner(role)
          `)
          .in('users.role', rolesToInclude)
          .eq('status', 'active');

        if (salesTeamError) throw salesTeamError;


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
