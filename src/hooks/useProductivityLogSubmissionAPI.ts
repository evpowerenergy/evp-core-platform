/**
 * useProductivityLogSubmissionAPI Hook
 * 
 * หน้าที่: บันทึกผลงาน (Productivity Log Submission)
 * - ส่งข้อมูลบันทึกผลงานไปยัง Edge Function
 * 
 * API: system-productivity-productivity-log-submission
 * 
 * ทำไมต้องแก้ไข?
 * - ใช้ API client utility แทน duplicate fetch code
 * - ลบ hardcoded SUPABASE_URL
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { ProductivityLogFormData } from "./useProductivityLogForm";
import { createApiClient } from "@/utils/apiClient";

export const useProductivityLogSubmissionAPI = (leadId: number, onSuccess: () => void) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createLogMutation = useMutation({
    mutationFn: async (data: ProductivityLogFormData) => {
      // Get current user (Auth must stay on client-side)
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;
      
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }

      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post('system-productivity-productivity-log-submission', {
        leadId,
        userId: currentUserId,
        formData: data,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to submit productivity log');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-timeline', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['my-leads'] });
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      toast({
        title: "สำเร็จ",
        description: "บันทึกข้อมูลการติดตามลูกค้าเรียบร้อยแล้ว",
      });
      onSuccess();
    },
    onError: (error) => {
      console.error('❌ Form submission error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถบันทึกข้อมูลได้: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  return createLogMutation;
};