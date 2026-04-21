/**
 * useServiceAppointmentsAPI Hook
 * 
 * หน้าที่: จัดการนัดหมายบริการ (Service Appointments Management)
 * - ดึงรายการนัดหมายบริการ
 * - เพิ่ม/แก้ไข/ลบนัดหมาย
 * 
 * API: system-service-service-appointments
 * 
 * ทำไมต้องแก้ไข?
 * - ใช้ API client utility แทน duplicate fetch code
 * - ลบ hardcoded SUPABASE_URL
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/useToast";
import { createApiClient } from "@/utils/apiClient";

export interface ServiceAppointment {
  id: number;
  customer_service_id: number;
  appointment_date: string;
  appointment_date_thai?: string;
  appointment_time?: string;
  technician_name?: string;
  service_type?: 'visit_1' | 'visit_2' | 'visit_3' | 'visit_4' | 'visit_5';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  estimated_duration_minutes?: number;
  created_at?: string;
  created_at_thai?: string;
  updated_at?: string;
  updated_at_thai?: string;
}

export interface ServiceAppointmentWithCustomer extends ServiceAppointment {
  customer: {
    id: number;
    customer_group: string;
    tel: string;
    province: string;
    district: string | null;
    capacity_kw: number | null;
  };
}

// Query keys
export const serviceAppointmentKeys = {
  all: ["service_appointments"] as const,
  byDate: (date: string) => [...serviceAppointmentKeys.all, "date", date] as const,
  byTechnician: (technician: string) => [...serviceAppointmentKeys.all, "technician", technician] as const,
  byStatus: (status: string) => [...serviceAppointmentKeys.all, "status", status] as const,
};

// Get all appointments with customer info
export const useServiceAppointmentsAPI = (filters?: {
  date?: string;
  startDate?: string;
  endDate?: string;
  technician?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: [...serviceAppointmentKeys.all, filters],
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      // Build query parameters
      const params: Record<string, string> = {
        action: 'list'
      };
      if (filters?.date) params.date = filters.date;
      if (filters?.startDate) params.startDate = filters.startDate;
      if (filters?.endDate) params.endDate = filters.endDate;
      if (filters?.technician) params.technician = filters.technician;
      if (filters?.status) params.status = filters.status;
      
      const response = await api.get<ServiceAppointmentWithCustomer[]>('system-service-service-appointments', params);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch appointments');
      }
      
      return response.data;
    },
    staleTime: 1000 * 60, // 1 minute
  });
};

// Get appointments for a specific month (for calendar)
export const useMonthlyAppointmentsAPI = (year: number, month: number) => {
  return useQuery({
    queryKey: [...serviceAppointmentKeys.all, "month", year, month],
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get<ServiceAppointment[]>('system-service-service-appointments', {
        action: 'monthly',
        year: year.toString(),
        month: month.toString()
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch monthly appointments');
      }
      
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Create appointment
export const useCreateServiceAppointmentAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointment: Omit<ServiceAppointment, "id" | "created_at" | "updated_at">) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post<ServiceAppointment>('system-service-service-appointments', appointment);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create appointment');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceAppointmentKeys.all });
      toast({
        title: "สร้างนัดหมายสำเร็จ",
        description: "นัดหมาย service ถูกสร้างเรียบร้อยแล้ว",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Update appointment
export const useUpdateServiceAppointmentAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<ServiceAppointment> }) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.put<ServiceAppointment>('system-service-service-appointments', { id, updates });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update appointment');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceAppointmentKeys.all });
      toast({
        title: "อัปเดตนัดหมายสำเร็จ",
        description: "ข้อมูลนัดหมายถูกอัปเดตเรียบร้อยแล้ว",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Delete appointment
export const useDeleteServiceAppointmentAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.delete('system-service-service-appointments', {
        params: { id: id.toString() }
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete appointment');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceAppointmentKeys.all });
      toast({
        title: "ลบนัดหมายสำเร็จ",
        description: "นัดหมายถูกลบเรียบร้อยแล้ว",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};