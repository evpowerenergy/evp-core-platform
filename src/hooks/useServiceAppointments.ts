import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/useToast";

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
export const useServiceAppointments = (filters?: {
  date?: string;
  startDate?: string;
  endDate?: string;
  technician?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: [...serviceAppointmentKeys.all, filters],
    queryFn: async () => {
      let query = supabase
        .from("service_appointments")
        .select(`
          *,
          customer:customer_services(
            id,
            customer_group,
            tel,
            province,
            district,
            capacity_kw
          )
        `)
        .order("appointment_date", { ascending: true });

      if (filters?.date) {
        const startOfDay = new Date(filters.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filters.date);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query
          .gte("appointment_date", startOfDay.toISOString())
          .lte("appointment_date", endOfDay.toISOString());
      }

      // Support date range query
      if (filters?.startDate && filters?.endDate) {
        const startOfDay = new Date(filters.startDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filters.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query
          .gte("appointment_date", startOfDay.toISOString())
          .lte("appointment_date", endOfDay.toISOString());
      }

      if (filters?.technician) {
        query = query.eq("technician_name", filters.technician);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch appointments: ${error.message}`);
      }

      return data as ServiceAppointmentWithCustomer[];
    },
    staleTime: 1000 * 60, // 1 minute
  });
};

// Get appointments for a specific month (for calendar)
export const useMonthlyAppointments = (year: number, month: number) => {
  return useQuery({
    queryKey: [...serviceAppointmentKeys.all, "month", year, month],
    queryFn: async () => {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      const { data, error } = await supabase
        .from("service_appointments")
        .select("*")
        .gte("appointment_date", startDate.toISOString())
        .lte("appointment_date", endDate.toISOString())
        .order("appointment_date", { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch monthly appointments: ${error.message}`);
      }

      return data as ServiceAppointment[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Create appointment
export const useCreateServiceAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointment: Omit<ServiceAppointment, "id" | "created_at" | "updated_at">) => {
      // ไม่ต้องส่ง appointment_date_thai เพราะ trigger จะคำนวณให้
      const { appointment_date_thai, created_at_thai, updated_at_thai, ...appointmentData } = appointment;

      const { data, error } = await supabase
        .from("service_appointments")
        .insert(appointmentData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create appointment: ${error.message}`);
      }

      return data as ServiceAppointment;
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
export const useUpdateServiceAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<ServiceAppointment> }) => {
      // ไม่ต้องบันทึก appointment_date_thai เพราะ trigger จะคำนวณให้
      const { appointment_date_thai, created_at_thai, updated_at_thai, ...updateData } = updates;

      const { data, error } = await supabase
        .from("service_appointments")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update appointment: ${error.message}`);
      }

      return data as ServiceAppointment;
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
export const useDeleteServiceAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("service_appointments")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(`Failed to delete appointment: ${error.message}`);
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