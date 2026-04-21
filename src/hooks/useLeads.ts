import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";

export const useLeads = (category?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Enhanced fetch with better performance - limit to 100 records by default
  const { data: leads = [], isLoading: leadsLoading, refetch } = useQuery({
    queryKey: ['leads', category],
    queryFn: async () => {
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
 // Use index
        .order('created_at_thai', { ascending: false })
        .limit(100); // Add reasonable limit
        
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data: leadsData, error: leadsError } = await query;
      if (leadsError) {
        console.error('Error fetching leads:', leadsError);
        throw leadsError;
      }

      // Get creator information for each lead
      if (leadsData && leadsData.length > 0) {
        const creatorIds = [...new Set(leadsData.map(lead => lead.created_by).filter(Boolean))];
        
        if (creatorIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, first_name, last_name')
            .in('id', creatorIds);
          
          if (!usersError && usersData) {
            const usersMap = new Map(usersData.map(user => [user.id, user]));
            
            // Add creator_name to each lead (using type assertion)
            leadsData.forEach(lead => {
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
        const leadIds = leadsData.map(lead => lead.id);
        
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
            leadsData.forEach(lead => {
              const latestLog = latestLogsMap.get(lead.id);
              (lead as any).latest_productivity_log = latestLog || null;
            });
          }
        }
      }
      
      return leadsData || [];
    },
    staleTime: 1000 * 60 * 3, // 3 minutes - balanced caching
    gcTime: 1000 * 60 * 15, // 15 minutes - reasonable cleanup
    refetchOnWindowFocus: false,
  });

  // Enhanced sales team query with active filter
  const { data: salesTeam = [], isLoading: salesTeamLoading } = useQuery({
    queryKey: ['sales_team'],
    queryFn: async () => {
      const { data: salesTeamData, error: salesTeamError } = await supabase
        .from('sales_team_with_user_info')
        .select('id, user_id, current_leads, status, name, email, phone, department, position')
        .eq('status', 'active'); // Use index for active members only
      
      if (salesTeamError) {
        console.error('Error fetching sales team:', salesTeamError);
        throw salesTeamError;
      }
      
      if (salesTeamData) {
        const mappedData = salesTeamData.map(item => ({
          id: item.id,
          user_id: item.user_id,
          current_leads: item.current_leads,
          status: item.status,
          name: item.name || 'Unknown User',
          email: item.email,
          phone: item.phone,
          department: item.department,
          position: item.position,
        }));
        return mappedData;
      }
      
      return [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - sales team changes less frequently
    gcTime: 1000 * 60 * 20, // 20 minutes
    refetchOnWindowFocus: false,
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
    mutationFn: async (leadData: any) => {
      const { error } = await supabase
        .from('leads')
        .insert([leadData]);

      if (error) throw error;
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
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มลีดได้",
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
