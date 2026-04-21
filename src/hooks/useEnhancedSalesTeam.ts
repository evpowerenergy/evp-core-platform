
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/useToast";
import { getEnhancedSalesTeamData } from "@/utils/salesTeamUtils";
import { SalesTeamMember } from "@/types/salesTeam";

export const useEnhancedSalesTeam = () => {
  const { toast } = useToast();
  const [salesTeam, setSalesTeam] = useState<SalesTeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnhancedSalesTeam();
  }, []);

  const fetchEnhancedSalesTeam = async () => {
    try {
      setLoading(true);
      
      const enhancedTeam = await getEnhancedSalesTeamData();
      setSalesTeam(enhancedTeam);
      
    } catch (error) {
      console.error('Error fetching enhanced sales team:', error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลทีมขายได้",
        variant: "destructive"
      });
      setSalesTeam([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchEnhancedSalesTeam();
  };

  return { 
    salesTeam, 
    loading, 
    refreshData 
  };
};
