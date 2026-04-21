import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type PermitRequest = Tables<"permit_requests">;
type PermitRequestInsert = TablesInsert<"permit_requests">;
type PermitRequestUpdate = TablesUpdate<"permit_requests">;

interface FileAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

// Query Keys
export const permitRequestKeys = {
  all: ["permit_requests"] as const,
  lists: () => [...permitRequestKeys.all, "list"] as const,
  list: (filters: Record<string, any>) => [...permitRequestKeys.lists(), { filters }] as const,
  details: () => [...permitRequestKeys.all, "detail"] as const,
  detail: (id: number) => [...permitRequestKeys.details(), id] as const,
  stats: () => [...permitRequestKeys.all, "stats"] as const,
};

// Get all permit requests with optional filters
export const usePermitRequests = (filters?: {
  search?: string;
  documentNumber?: string;
  permitNumber?: string;
  meterNumber?: string;
  mainStatus?: string;
  subStatus?: string;
  province?: string;
  district?: string;
  installerName?: string;
  executor?: string;
  companyName?: string;
}) => {
  return useQuery({
    queryKey: permitRequestKeys.list(filters || {}),
    queryFn: async () => {
      let query = supabase
        .from("permit_requests")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply search filters - now includes sub_status, executor, operator_name, and company_name
      if (filters?.search) {
        query = query.or(
          `requester_name.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%,installer_name.ilike.%${filters.search}%,sub_status.ilike.%${filters.search}%,executor.ilike.%${filters.search}%,operator_name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`
        );
      }

      // Apply specific field filters
      if (filters?.documentNumber) {
        query = query.ilike("document_number", `%${filters.documentNumber}%`);
      }

      if (filters?.permitNumber) {
        query = query.ilike("permit_number", `%${filters.permitNumber}%`);
      }

      if (filters?.meterNumber) {
        query = query.ilike("meter_number", `%${filters.meterNumber}%`);
      }

      if (filters?.mainStatus && filters.mainStatus !== "all") {
        query = query.eq("main_status", filters.mainStatus);
      }

      if (filters?.subStatus && filters.subStatus !== "all") {
        query = query.eq("sub_status", filters.subStatus);
      }

      if (filters?.province && filters.province !== "all") {
        query = query.eq("province", filters.province);
      }

      if (filters?.district && filters.district !== "all") {
        query = query.eq("district", filters.district);
      }

      if (filters?.installerName && filters.installerName !== "all") {
        query = query.eq("installer_name", filters.installerName);
      }

      if (filters?.executor && filters.executor !== "all") {
        query = query.eq("executor", filters.executor);
      }

      if (filters?.companyName && filters.companyName !== "all") {
        query = query.eq("company_name", filters.companyName);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch permit requests: ${error.message}`);
      }

      return data as PermitRequest[];
    },
    staleTime: 0, // Always refetch for real-time search
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });
};

// Get single permit request by ID
export const usePermitRequest = (id: number) => {
  return useQuery({
    queryKey: permitRequestKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permit_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch permit request: ${error.message}`);
      }

      return data as PermitRequest;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Get permit request statistics
export const usePermitRequestStats = () => {
  return useQuery({
    queryKey: permitRequestKeys.stats(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permit_requests")
        .select("main_status");

      if (error) {
        throw new Error(`Failed to fetch permit request stats: ${error.message}`);
      }

      const stats = {
        total: data.length,
        pending: data.filter(item => item.main_status === "ไม่สามารถดำเนินการได้").length,
        inProgress: data.filter(item => item.main_status === "ระหว่างดำเนินการ").length,
        completed: data.filter(item => item.main_status === "ดำเนินการเสร็จสิ้น").length,
      };

      return stats;
    },
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });
};

// Create new permit request
export const useCreatePermitRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PermitRequestInsert) => {
      const { data: result, error } = await supabase
        .from("permit_requests")
        .insert(data)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create permit request: ${error.message}`);
      }

      return result as PermitRequest;
    },
    onSuccess: () => {
      // Invalidate and refetch permit requests
      queryClient.invalidateQueries({ queryKey: permitRequestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: permitRequestKeys.stats() });
    },
  });
};

// Update permit request
export const useUpdatePermitRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PermitRequestUpdate }) => {
      const { data: result, error } = await supabase
        .from("permit_requests")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update permit request: ${error.message}`);
      }

      return result as PermitRequest;
    },
    onSuccess: (data) => {
      // Invalidate and refetch permit requests
      queryClient.invalidateQueries({ queryKey: permitRequestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: permitRequestKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: permitRequestKeys.stats() });
    },
  });
};

// Delete permit request
export const useDeletePermitRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("permit_requests")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(`Failed to delete permit request: ${error.message}`);
      }

      return id;
    },
    onSuccess: () => {
      // Invalidate and refetch permit requests
      queryClient.invalidateQueries({ queryKey: permitRequestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: permitRequestKeys.stats() });
    },
  });
};

// Get unique provinces for filter dropdown
export const usePermitRequestProvinces = () => {
  return useQuery({
    queryKey: [...permitRequestKeys.all, "provinces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permit_requests")
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

// Get unique districts for filter dropdown (optionally filtered by province)
export const usePermitRequestDistricts = (province?: string) => {
  return useQuery({
    queryKey: [...permitRequestKeys.all, "districts", province],
    queryFn: async () => {
      let query = supabase
        .from("permit_requests")
        .select("district, province")
        .not("district", "is", null);
      
      // Filter by province if provided
      if (province && province !== "all") {
        query = query.eq("province", province);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch districts: ${error.message}`);
      }

      // Get unique districts
      const uniqueDistricts = [...new Set(data.map(item => item.district))].filter(Boolean);
      return uniqueDistricts.sort();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Get unique installer names for filter dropdown
export const usePermitRequestInstallers = () => {
  return useQuery({
    queryKey: [...permitRequestKeys.all, "installers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permit_requests")
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

// Get unique company names for filter dropdown
export const usePermitRequestCompanies = () => {
  return useQuery({
    queryKey: [...permitRequestKeys.all, "companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permit_requests")
        .select("company_name")
        .not("company_name", "is", null);

      if (error) {
        throw new Error(`Failed to fetch companies: ${error.message}`);
      }

      // Get unique company names
      const uniqueCompanies = [...new Set(data.map(item => item.company_name))].filter(Boolean);
      return uniqueCompanies.sort();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

