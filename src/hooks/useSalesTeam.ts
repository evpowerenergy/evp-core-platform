
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSalesTeam = () => {
  const { data: salesTeam = [] } = useQuery({
    queryKey: ['sales_team'],
    queryFn: async () => {
  
      
      // Use the table (no longer a view)
      const { data, error } = await supabase
        .from('sales_team_with_user_info')
        .select('id, user_id, current_leads, status, name');
      
      if (error) {
        console.error('Error fetching sales team:', error);
        throw error;
      }
      
      if (data) {

        // Map the table data to include proper name and structure
        const mappedData = data.map(item => ({
          id: item.id,
          user_id: item.user_id,
          current_leads: item.current_leads,
          status: item.status,
          name: item.name || 'Unknown User',
        }));
        return mappedData;
      }
      
      return [];
    },
    staleTime: 1000 * 60 * 3, // cache 3 นาที
  });

  return { salesTeam };
};
