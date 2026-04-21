import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesUpdate } from "@/integrations/supabase/types";

type CustomerService = Tables<"customer_services">;
type CustomerServiceUpdate = TablesUpdate<"customer_services">;

// Query Keys
export const serviceVisitKeys = {
  all: ["service_visits"] as const,
  byCustomer: (customerId: number) => [...serviceVisitKeys.all, "customer", customerId] as const,
};

// Service visit data structure
export interface ServiceVisit {
  id: number;
  customerId: number;
  visitNumber: 1 | 2;
  visitDate: string;
  visitDateThai: string;
  technician: string;
  completed: boolean;
}

// Get service visits for a specific customer
export const useServiceVisits = (customerId: number) => {
  return useQuery({
    queryKey: serviceVisitKeys.byCustomer(customerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_services")
        .select("*")
        .eq("id", customerId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch service visits: ${error.message}`);
      }

      const visits: ServiceVisit[] = [];

      // Service visit 1
      if (data.service_visit_1 && data.service_visit_1_date) {
        visits.push({
          id: data.id,
          customerId: data.id,
          visitNumber: 1,
          visitDate: data.service_visit_1_date,
          visitDateThai: data.service_visit_1_date_thai || data.service_visit_1_date,
          technician: data.service_visit_1_technician || "",
          completed: data.service_visit_1,
        });
      }

      // Service visit 2
      if (data.service_visit_2 && data.service_visit_2_date) {
        visits.push({
          id: data.id,
          customerId: data.id,
          visitNumber: 2,
          visitDate: data.service_visit_2_date,
          visitDateThai: data.service_visit_2_date_thai || data.service_visit_2_date,
          technician: data.service_visit_2_technician || "",
          completed: data.service_visit_2,
        });
      }

      return visits.sort((a, b) => a.visitNumber - b.visitNumber);
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Create or update service visit
export const useCreateServiceVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      customerId, 
      visitNumber, 
      visitDate, 
      technician, 
    }: { 
      customerId: number; 
      visitNumber: 1 | 2; 
      visitDate: string; 
      technician: string; 
    }) => {
      // Calculate Thai time (UTC + 7)
      const visitDateThai = new Date(visitDate);
      visitDateThai.setHours(visitDateThai.getHours() + 7);

      const updateData: CustomerServiceUpdate = {
        [`service_visit_${visitNumber}`]: true,
        [`service_visit_${visitNumber}_date`]: visitDate,
        [`service_visit_${visitNumber}_date_thai`]: visitDateThai.toISOString(),
        [`service_visit_${visitNumber}_technician`]: technician,
        updated_at: new Date().toISOString(),
        updated_at_thai: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
      };

      // If this is the second visit and both visits are completed, mark as completed
      if (visitNumber === 2) {
        updateData.status = "completed";
      }

      const { data, error } = await supabase
        .from("customer_services")
        .update(updateData)
        .eq("id", customerId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create service visit: ${error.message}`);
      }

      return data as CustomerService;
    },
    onSuccess: (data) => {
      // Invalidate and refetch customer services
      queryClient.invalidateQueries({ queryKey: ["customer_services"] });
      queryClient.invalidateQueries({ queryKey: serviceVisitKeys.byCustomer(data.id) });
    },
  });
};

// Update service visit
export const useUpdateServiceVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      customerId, 
      visitNumber, 
      visitDate, 
      technician, 
    }: { 
      customerId: number; 
      visitNumber: 1 | 2; 
      visitDate: string; 
      technician: string; 
    }) => {
      // Calculate Thai time (UTC + 7)
      const visitDateThai = new Date(visitDate);
      visitDateThai.setHours(visitDateThai.getHours() + 7);

      const updateData: CustomerServiceUpdate = {
        [`service_visit_${visitNumber}_date`]: visitDate,
        [`service_visit_${visitNumber}_date_thai`]: visitDateThai.toISOString(),
        [`service_visit_${visitNumber}_technician`]: technician,
        updated_at: new Date().toISOString(),
        updated_at_thai: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
      };

      const { data, error } = await supabase
        .from("customer_services")
        .update(updateData)
        .eq("id", customerId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update service visit: ${error.message}`);
      }

      return data as CustomerService;
    },
    onSuccess: (data) => {
      // Invalidate and refetch customer services
      queryClient.invalidateQueries({ queryKey: ["customer_services"] });
      queryClient.invalidateQueries({ queryKey: serviceVisitKeys.byCustomer(data.id) });
    },
  });
};

// Cancel service visit
export const useCancelServiceVisit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      customerId, 
      visitNumber 
    }: { 
      customerId: number; 
      visitNumber: 1 | 2; 
    }) => {
      const updateData: CustomerServiceUpdate = {
        [`service_visit_${visitNumber}`]: false,
        [`service_visit_${visitNumber}_date`]: null,
        [`service_visit_${visitNumber}_date_thai`]: null,
        [`service_visit_${visitNumber}_technician`]: null,
        updated_at: new Date().toISOString(),
        updated_at_thai: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
      };

      const { data, error } = await supabase
        .from("customer_services")
        .update(updateData)
        .eq("id", customerId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to cancel service visit: ${error.message}`);
      }

      return data as CustomerService;
    },
    onSuccess: (data) => {
      // Invalidate and refetch customer services
      queryClient.invalidateQueries({ queryKey: ["customer_services"] });
      queryClient.invalidateQueries({ queryKey: serviceVisitKeys.byCustomer(data.id) });
    },
  });
};

// Get upcoming service visits (next 7 days)
export const useUpcomingServiceVisits = () => {
  return useQuery({
    queryKey: [...serviceVisitKeys.all, "upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_services")
        .select("*")
        .or("service_visit_1.eq.false,service_visit_2.eq.false");

      if (error) {
        throw new Error(`Failed to fetch upcoming service visits: ${error.message}`);
      }

      const upcomingVisits: Array<{
        id: number;
        customerGroup: string;
        tel: string;
        province: string;
        district: string | null;
        pendingVisit1: boolean;
        pendingVisit2: boolean;
        installationDate: string | null;
      }> = [];

      data.forEach(item => {
        upcomingVisits.push({
          id: item.id,
          customerGroup: item.customer_group,
          tel: item.tel,
          province: item.province,
          district: item.district,
          pendingVisit1: !item.service_visit_1,
          pendingVisit2: item.service_visit_1 && !item.service_visit_2,
          installationDate: item.installation_date,
        });
      });

      return upcomingVisits;
    },
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });
};
