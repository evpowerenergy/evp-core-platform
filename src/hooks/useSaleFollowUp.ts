import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

// Types
type CustomerService = Tables<"customer_services_with_days">;
type CustomerServiceUpdate = TablesUpdate<"customer_services">;
type CustomerServiceInsert = TablesInsert<"customer_services">;

export interface SaleFollowUpCustomer {
  id: number;
  customer_group: string;
  tel: string;
  province: string;
  district: string;
  capacity_kw: number;
  installation_date: string;
  installer_name: string;
  sale: string;
  service_visit_1: boolean;
  service_visit_2: boolean;
  service_visit_1_date: string;
  service_visit_2_date: string;
  service_visit_1_technician: string;
  service_visit_2_technician: string;
  status: string;
  // Sale follow-up fields
  sale_follow_up_required: boolean;
  sale_follow_up_date: string;
  sale_follow_up_date_thai: string;
  sale_follow_up_details: string;
  sale_follow_up_status: string;
  sale_follow_up_notes: string;
  sale_follow_up_assigned_to: number;
  sale_follow_up_created_at: string;
  sale_follow_up_updated_at: string;
  // Calculated fields (optional - will be computed if needed)
  days_since_installation?: number | null;
  days_until_service_1_due?: number | null;
  days_until_service_2_due?: number | null;
  days_after_service_complete?: number | null;
  service_status_calculated?: string | null;
  // Joined data
  assigned_sales_person?: {
    id: number;
    name: string;
  };
  // Lead tracking fields
  has_lead?: boolean;
  lead_info?: {
    id: number;
    status: string;
    operation_status: string;
    created_at: string;
    full_name: string | null;
  } | null;
  // Repeat sale fields (backward compatibility)
  has_repeat_sale?: boolean;
  repeat_sale_info?: {
    id: number;
    status: string;
    operation_status: string;
    created_at: string;
    full_name: string | null;
  } | null;
}

export interface SaleFollowUpStats {
  total_completed_services: number;
  pending_follow_up: number;
  completed_follow_up: number;
  cancelled_follow_up: number;
}

// Utility function to normalize phone numbers for comparison
// Remove spaces, dashes, and parentheses
const normalizePhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return "";
  return phone.replace(/[\s\-\(\)]/g, "").trim();
};

// Query keys
export const saleFollowUpKeys = {
  all: ["sale_follow_up"] as const,
  list: (filters?: any) => [...saleFollowUpKeys.all, "list", filters] as const,
  stats: () => [...saleFollowUpKeys.all, "stats"] as const,
  byId: (id: number) => [...saleFollowUpKeys.all, "byId", id] as const,
  detail: (id: number) => [...saleFollowUpKeys.all, "detail", id] as const,
};

// Get customers who completed service (both visits)
export const useCompletedServiceCustomers = (filters?: {
  search?: string;
  province?: string;
  sale?: string;
  followUpStatus?: string;
  assignedTo?: number;
}) => {
  return useQuery({
    queryKey: saleFollowUpKeys.list(filters || {}),
    queryFn: async () => {
      // Step 1: Query customer services
      let query = supabase
        .from("customer_services_extended")
        .select(`
          *,
          assigned_sales_person:sales_team_with_user_info!sale_follow_up_assigned_to(
            id,
            name
          )
        `)
        .eq("completed_visits_count", 2); // ใช้ completed_visits_count แทน

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

      if (filters?.followUpStatus && filters.followUpStatus !== "all") {
        query = query.eq("sale_follow_up_status", filters.followUpStatus);
      }

      if (filters?.assignedTo && typeof filters.assignedTo === 'number') {
        query = query.eq("sale_follow_up_assigned_to", filters.assignedTo);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch completed service customers: ${error.message}`);
      }

      // Step 2: Get all phone numbers and create normalized mapping
      const phoneMapping = new Map<string, string>(); // normalized -> original
      data?.forEach(customer => {
        if (customer.tel) {
          const normalized = normalizePhoneNumber(customer.tel);
          if (normalized) {
            phoneMapping.set(normalized, customer.tel);
          }
        }
      });

      // Step 3: Query ALL leads matching these phone numbers (not just closed)
      let allLeads: any[] = [];
      if (phoneMapping.size > 0) {
        // Get all unique phone numbers (both normalized and original)
        const allPhones = [...new Set([
          ...Array.from(phoneMapping.values()), // original phones
        ])];

        const { data: leadsData } = await supabase
          .from("leads")
          .select("tel, status, operation_status, id, created_at, full_name")
          .in("tel", allPhones)
          .order("created_at", { ascending: false }); // Get latest lead first
        
        allLeads = leadsData || [];
      }

      // Step 4: Create lookup map with normalized phone numbers
      // Use the latest lead for each phone number
      const leadsMap = new Map<string, any>();
      allLeads.forEach(lead => {
        const normalized = normalizePhoneNumber(lead.tel);
        if (normalized && !leadsMap.has(normalized)) {
          leadsMap.set(normalized, lead);
        }
      });

      // Step 5: Merge data
      const customersWithRepeatSale = (data || []).map(customer => {
        const normalizedTel = normalizePhoneNumber(customer.tel);
        const leadInfo = leadsMap.get(normalizedTel);
        
        return {
          ...customer,
          has_lead: !!leadInfo,
          lead_info: leadInfo || null,
          // For backward compatibility
          has_repeat_sale: leadInfo?.status === "ปิดการขาย",
          repeat_sale_info: leadInfo?.status === "ปิดการขาย" ? leadInfo : null,
        };
      });

      // Step 6: Sort by days_after_service_complete (descending)
      const sortedData = customersWithRepeatSale.sort((a, b) => {
        const daysA = a.days_after_service_complete;
        const daysB = b.days_after_service_complete;
        
        // Handle null values - put them at the end
        if (daysA === null || daysA === undefined) return 1;
        if (daysB === null || daysB === undefined) return -1;
        
        // Sort descending (highest number first)
        return daysB - daysA;
      });

      return sortedData as SaleFollowUpCustomer[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - increase to reduce unnecessary refetch
    gcTime: 1000 * 60 * 10, // Cache for 10 minutes
    refetchOnWindowFocus: false, // Disable auto refetch on window focus to prevent full page refresh
    refetchOnMount: false, // Only refetch when query key changes
    refetchOnReconnect: false, // Don't refetch on reconnect
    retry: 1, // Only retry once on failure
    placeholderData: keepPreviousData, // Keep previous data while fetching new data
  });
};

// Get customer detail for sale follow-up
export const useSaleFollowUpCustomerDetail = (customerId: number) => {
  return useQuery({
    queryKey: saleFollowUpKeys.detail(customerId),
    queryFn: async () => {
      // Step 1: Get customer service detail
      const { data: customer, error } = await supabase
        .from("customer_services_extended")
        .select(`
          *,
          assigned_sales_person:sales_team_with_user_info!sale_follow_up_assigned_to(
            id,
            name
          )
        `)
        .eq("id", customerId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch customer detail: ${error.message}`);
      }

      if (!customer) {
        throw new Error("Customer not found");
      }

      // Step 2: Check for leads matching this customer's phone
      const normalizedTel = normalizePhoneNumber(customer.tel);
      let leadInfo = null;

      if (normalizedTel) {
        const { data: leadsData } = await supabase
          .from("leads")
          .select("tel, status, operation_status, id, created_at, full_name")
          .eq("tel", customer.tel)
          .order("created_at", { ascending: false })
          .limit(1);

        if (leadsData && leadsData.length > 0) {
          leadInfo = leadsData[0];
        }
      }

      // Step 3: Get service visit history from service_appointments
      const { data: serviceVisits } = await supabase
        .from("service_appointments")
        .select("*")
        .eq("customer_service_id", customerId)
        .order("appointment_date", { ascending: false });

      // Step 4: Get follow-up history (if we track it separately in the future)
      // For now, we'll use the current follow-up info from customer_services

      return {
        ...customer,
        has_lead: !!leadInfo,
        lead_info: leadInfo || null,
        service_visits: serviceVisits || [],
        has_repeat_sale: leadInfo?.status === "ปิดการขาย",
        repeat_sale_info: leadInfo?.status === "ปิดการขาย" ? leadInfo : null,
      } as SaleFollowUpCustomer & { service_visits: any[] };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,
    enabled: !!customerId && customerId > 0,
  });
};

// Get sale follow-up statistics
export const useSaleFollowUpStats = () => {
  return useQuery({
    queryKey: saleFollowUpKeys.stats(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_services_extended")
        .select("sale_follow_up_status, sale_follow_up_date, sale_follow_up_required")
        .eq("service_visit_1", true)
        .eq("service_visit_2", true);

      if (error) {
        throw new Error(`Failed to fetch sale follow-up stats: ${error.message}`);
      }

      const stats: SaleFollowUpStats = {
        total_completed_services: data.length,
        pending_follow_up: data.filter(item => item.sale_follow_up_status === "pending").length,
        completed_follow_up: data.filter(item => item.sale_follow_up_status === "completed").length,
        cancelled_follow_up: data.filter(item => item.sale_follow_up_status === "cancelled").length,
      };

      return stats;
    },
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true,
  });
};

// Create or update sale follow-up
export const useCreateSaleFollowUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      followUpData,
    }: {
      customerId: number;
      followUpData: {
        sale_follow_up_date: string;
        sale_follow_up_details: string;
        sale_follow_up_assigned_to: number;
        sale_follow_up_status?: string;
      };
    }) => {
      // Calculate Thai time (UTC + 7)
      const followUpDateThai = new Date(followUpData.sale_follow_up_date);
      followUpDateThai.setHours(followUpDateThai.getHours() + 7);

      console.log("Create mutation called with:", { customerId, followUpData });
      
      const updateData: CustomerServiceUpdate = {
        sale_follow_up_required: true,
        sale_follow_up_date: followUpData.sale_follow_up_date,
        sale_follow_up_date_thai: followUpDateThai.toISOString(),
        sale_follow_up_details: followUpData.sale_follow_up_details,
        sale_follow_up_notes: "",
        sale_follow_up_assigned_to: followUpData.sale_follow_up_assigned_to,
        sale_follow_up_status: followUpData.sale_follow_up_status || "pending",
        sale_follow_up_created_at: new Date().toISOString(),
        sale_follow_up_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_at_thai: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
      };
      
      console.log("Creating customer_services with data:", updateData);

      const { data, error } = await supabase
        .from("customer_services")
        .update(updateData)
        .eq("id", customerId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create sale follow-up: ${error.message}`);
      }

      return data as CustomerService;
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: saleFollowUpKeys.all });
      queryClient.invalidateQueries({ queryKey: ["customer_services"] });
    },
  });
};

// Update sale follow-up
export const useUpdateSaleFollowUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      followUpData,
    }: {
      customerId: number;
      followUpData: Partial<{
        sale_follow_up_date: string;
        sale_follow_up_details: string;
        sale_follow_up_assigned_to: number;
        sale_follow_up_status: string;
      }>;
    }) => {
      console.log("Update mutation called with:", { customerId, followUpData });
      
      const updateData: CustomerServiceUpdate = {
        ...followUpData,
        sale_follow_up_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_at_thai: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
      };

      // Recalculate Thai time if date is being updated
      if (followUpData.sale_follow_up_date) {
        const followUpDateThai = new Date(followUpData.sale_follow_up_date);
        followUpDateThai.setHours(followUpDateThai.getHours() + 7);
        updateData.sale_follow_up_date_thai = followUpDateThai.toISOString();
      }

      console.log("Updating customer_services with data:", updateData);
      
      const { data, error } = await supabase
        .from("customer_services")
        .update(updateData)
        .eq("id", customerId)
        .select()
        .single();

      if (error) {
        console.error("Update error:", error);
        throw new Error(`Failed to update sale follow-up: ${error.message}`);
      }

      console.log("Update successful, returned data:", data);
      return data as CustomerService;
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: saleFollowUpKeys.all });
      queryClient.invalidateQueries({ queryKey: ["customer_services"] });
    },
  });
};

// Cancel sale follow-up
export const useCancelSaleFollowUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: number) => {
      const updateData: CustomerServiceUpdate = {
        sale_follow_up_status: "cancelled",
        sale_follow_up_updated_at: new Date().toISOString(),
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
        throw new Error(`Failed to cancel sale follow-up: ${error.message}`);
      }

      return data as CustomerService;
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: saleFollowUpKeys.all });
      queryClient.invalidateQueries({ queryKey: ["customer_services"] });
    },
  });
};

// Get sales team members for assignment
export const useSalesTeamMembers = () => {
  return useQuery({
    queryKey: ["sales_team_members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_team_with_user_info")
        .select("id, name")
        .eq("status", "active")
        .order("name");

      if (error) {
        throw new Error(`Failed to fetch sales team members: ${error.message}`);
      }

      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Get provinces for filtering
export const useSaleFollowUpProvinces = () => {
  return useQuery({
    queryKey: ["sale_follow_up_provinces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_services_extended")
        .select("province")
        .eq("service_visit_1", true)
        .eq("service_visit_2", true)
        .not("province", "is", null);

      if (error) {
        throw new Error(`Failed to fetch provinces: ${error.message}`);
      }

      const uniqueProvinces = Array.from(
        new Set(data.map(item => item.province).filter(Boolean))
      ).sort();

      return uniqueProvinces;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Get sales persons for filtering
export const useSaleFollowUpSalesPersons = () => {
  return useQuery({
    queryKey: ["sale_follow_up_sales_persons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_services_extended")
        .select("sale")
        .eq("service_visit_1", true)
        .eq("service_visit_2", true)
        .not("sale", "is", null);

      if (error) {
        throw new Error(`Failed to fetch sales persons: ${error.message}`);
      }

      const uniqueSales = Array.from(
        new Set(data.map(item => item.sale).filter(Boolean))
      ).sort();

      return uniqueSales;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Update customer service basic information
export const useUpdateCustomerService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      customerData,
    }: {
      customerId: number;
      customerData: {
        customer_group?: string;
        tel?: string;
        province?: string;
        district?: string;
        capacity_kw?: number;
      };
    }) => {
      console.log("Update customer mutation called with:", { customerId, customerData });
      
      const updateData: CustomerServiceUpdate = {
        ...customerData,
        updated_at: new Date().toISOString(),
        updated_at_thai: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
      };

      console.log("Updating customer_services with data:", updateData);
      
      const { data, error } = await supabase
        .from("customer_services")
        .update(updateData)
        .eq("id", customerId)
        .select()
        .single();

      if (error) {
        console.error("Update customer error:", error);
        throw new Error(`Failed to update customer service: ${error.message}`);
      }

      console.log("Update customer successful, returned data:", data);
      return data as CustomerService;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: saleFollowUpKeys.detail(variables.customerId) });
      queryClient.invalidateQueries({ queryKey: saleFollowUpKeys.all });
      queryClient.invalidateQueries({ queryKey: ["customer_services"] });
    },
  });
};
