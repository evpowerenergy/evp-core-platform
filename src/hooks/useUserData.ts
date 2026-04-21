
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useUserData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Get user info - include email and department
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, first_name, last_name, role, email, department')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return null;
      }
      
      // Get sales team info if user is a sales role
      let salesMemberData = null;
      if (userData) {
        const { data: salesData, error: salesError } = await supabase
          .from('sales_team_with_user_info')
          .select('id, user_id, status, current_leads')
          .eq('user_id', userData.id)
          .single();
        
        if (!salesError && salesData) {
          salesMemberData = {
            ...salesData,
            name: userData.first_name && userData.last_name 
              ? `${userData.first_name} ${userData.last_name}`
              : 'Unknown User',
            role: userData.role
          };
        }
      }
      
      return {
        user: userData,
        salesMember: salesMemberData
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 15, // cache 15 นาที
    gcTime: 1000 * 60 * 60, // cache 1 ชั่วโมง
    refetchOnWindowFocus: false,
  });
};
