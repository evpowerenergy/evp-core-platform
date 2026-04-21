import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type CustomerService = Tables<"customer_services_extended">;
type CustomerServiceInsert = TablesInsert<"customer_services">;
type CustomerServiceUpdate = TablesUpdate<"customer_services">;

// Query Keys
export const customerServiceKeys = {
  all: ["customer_services"] as const,
  lists: () => [...customerServiceKeys.all, "list"] as const,
  list: (filters: Record<string, any>) => [...customerServiceKeys.lists(), { filters }] as const,
  details: () => [...customerServiceKeys.all, "detail"] as const,
  detail: (id: number) => [...customerServiceKeys.details(), id] as const,
  stats: () => [...customerServiceKeys.all, "stats"] as const,
};

// Get all customer services with optional filters
export const useCustomerServices = (filters?: {
  search?: string;
  province?: string;
  sale?: string;
  installerName?: string;
  serviceVisit1?: boolean;
  serviceVisit2?: boolean;
}) => {
  return useQuery({
    queryKey: customerServiceKeys.list(filters || {}),
    queryFn: async () => {
      let query = supabase
        .from("customer_services_extended")
        .select("*")
        .order("id", { ascending: true });

      // Apply filters
      if (filters?.search) {
        query = query.or(
          `customer_group.ilike.%${filters.search}%,tel.ilike.%${filters.search}%,installer_name.ilike.%${filters.search}%`
        );
      }

      if (filters?.province && filters.province !== "all") {
        query = query.eq("province", filters.province);
      }

      if (filters?.sale && filters.sale !== "all") {
        query = query.eq("sale", filters.sale);
      }

      if (filters?.installerName && filters.installerName !== "all") {
        query = query.eq("installer_name", filters.installerName);
      }

      if (filters?.serviceVisit1 !== undefined) {
        query = query.eq("service_visit_1", filters.serviceVisit1);
      }

      if (filters?.serviceVisit2 !== undefined) {
        query = query.eq("service_visit_2", filters.serviceVisit2);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch customer services: ${error.message}`);
      }

      return data as CustomerService[];
    },
    staleTime: 0, // Always refetch for real-time search
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });
};

// Get single customer service by ID
export const useCustomerService = (id: number) => {
  return useQuery({
    queryKey: customerServiceKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_services_extended")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch customer service: ${error.message}`);
      }

      return data as CustomerService;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Get customer service statistics
export const useCustomerServiceStats = () => {
  return useQuery({
    queryKey: customerServiceKeys.stats(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_services_extended")
        .select("service_visit_1, service_visit_2, service_visit_3, service_visit_4, service_visit_5, completed_visits_count");

      if (error) {
        throw new Error(`Failed to fetch customer service stats: ${error.message}`);
      }

      const stats = {
        total: data.length,
        completed: data.filter(item => item.completed_visits_count >= 2).length, // ใช้ completed_visits_count แทน
        serviceVisit1Completed: data.filter(item => item.service_visit_1 === true).length,
        serviceVisit2Completed: data.filter(item => item.service_visit_2 === true).length,
        serviceVisit3Completed: data.filter(item => item.service_visit_3 === true).length,
        serviceVisit4Completed: data.filter(item => item.service_visit_4 === true).length,
        serviceVisit5Completed: data.filter(item => item.service_visit_5 === true).length,
        pendingServiceVisit1: data.filter(item => item.service_visit_1 === false).length,
        pendingServiceVisit2: data.filter(item => item.service_visit_1 === true && item.service_visit_2 === false).length,
        pendingServiceVisit3: data.filter(item => item.service_visit_2 === true && item.service_visit_3 === false).length,
        pendingServiceVisit4: data.filter(item => item.service_visit_3 === true && item.service_visit_4 === false).length,
        pendingServiceVisit5: data.filter(item => item.service_visit_4 === true && item.service_visit_5 === false).length,
      };

      return stats;
    },
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });
};

// Create new customer service
export const useCreateCustomerService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CustomerServiceInsert) => {
      const { data: result, error } = await supabase
        .from("customer_services")
        .insert(data)
        .select();

      if (error) {
        throw new Error(`Failed to create customer service: ${error.message}`);
      }

      return result?.[0] as CustomerService;
    },
    onSuccess: () => {
      // Invalidate and refetch customer services
      queryClient.invalidateQueries({ queryKey: customerServiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerServiceKeys.stats() });
    },
  });
};

// Update customer service
export const useUpdateCustomerService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CustomerServiceUpdate }) => {
      const { data: result, error } = await supabase
        .from("customer_services")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update customer service: ${error.message}`);
      }

      return result as CustomerService;
    },
    onSuccess: (data) => {
      // Invalidate and refetch customer services
      queryClient.invalidateQueries({ queryKey: customerServiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerServiceKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: customerServiceKeys.stats() });
    },
  });
};

// Delete customer service
export const useDeleteCustomerService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("customer_services")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(`Failed to delete customer service: ${error.message}`);
      }

      return id;
    },
    onSuccess: () => {
      // Invalidate and refetch customer services
      queryClient.invalidateQueries({ queryKey: customerServiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerServiceKeys.stats() });
    },
  });
};

// Get unique provinces for filter dropdown
export const useCustomerServiceProvinces = () => {
  return useQuery({
    queryKey: [...customerServiceKeys.all, "provinces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_services_extended")
        .select("province")
        .not("province", "is", null);

      if (error) {
        throw new Error(`Failed to fetch provinces: ${error.message}`);
      }

      // Get unique provinces
      const uniqueProvinces = [...new Set(data.map(item => item.province))].filter(Boolean);
      return uniqueProvinces.sort();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Get unique installer names for filter dropdown
export const useCustomerServiceInstallers = () => {
  return useQuery({
    queryKey: [...customerServiceKeys.all, "installers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_services_extended")
        .select("installer_name")
        .not("installer_name", "is", null);

      if (error) {
        throw new Error(`Failed to fetch installers: ${error.message}`);
      }

      // Get unique installer names
      const uniqueInstallers = [...new Set(data.map(item => item.installer_name))].filter(Boolean);
      return uniqueInstallers.sort();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Get unique sales teams for filter dropdown
export const useCustomerServiceSales = () => {
  return useQuery({
    queryKey: [...customerServiceKeys.all, "sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_services_extended")
        .select("sale")
        .not("sale", "is", null);

      if (error) {
        throw new Error(`Failed to fetch sales: ${error.message}`);
      }

      // Get unique sales
      const uniqueSales = [...new Set(data.map(item => item.sale))].filter(Boolean);
      return uniqueSales.sort();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Get unique technicians for filter dropdown
export const useCustomerServiceTechnicians = () => {
  return useQuery({
    queryKey: [...customerServiceKeys.all, "technicians"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_services_extended")
        .select("service_visit_1_technician, service_visit_2_technician, service_visit_3_technician, service_visit_4_technician, service_visit_5_technician");

      if (error) {
        throw new Error(`Failed to fetch technicians: ${error.message}`);
      }

      // Get unique technician names
      const technicians = new Set<string>();
      data.forEach(item => {
        if (item.service_visit_1_technician) technicians.add(item.service_visit_1_technician);
        if (item.service_visit_2_technician) technicians.add(item.service_visit_2_technician);
        if (item.service_visit_3_technician) technicians.add(item.service_visit_3_technician);
        if (item.service_visit_4_technician) technicians.add(item.service_visit_4_technician);
        if (item.service_visit_5_technician) technicians.add(item.service_visit_5_technician);
      });

      return Array.from(technicians).sort();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};
