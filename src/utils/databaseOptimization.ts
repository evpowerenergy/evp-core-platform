import { supabase } from "@/integrations/supabase/client";

/**
 * Database optimization utilities
 * เพื่อแก้ปัญหา API requests ช้า
 */

// เพิ่ม timeout wrapper สำหรับ Supabase queries
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = 10000,
  errorMessage: string = 'Query timeout'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
};

// Optimized user query
export const fetchUserData = async (userId: string) => {
  const query = supabase
    .from('users')
    .select('id, first_name, last_name, role, department, position')
    .eq('auth_user_id', userId)
    .single();
    
  return withTimeout(
    Promise.resolve(query),
    10000,
    'User query timeout'
  );
};

// Optimized sales team query
export const fetchSalesTeamData = async () => {
  const query = supabase
    .from('sales_team_with_user_info')
    .select('id, user_id, name, email, status, current_leads, department, position')
    .eq('status', 'active');
    
  return withTimeout(
    Promise.resolve(query),
    10000,
    'Sales team query timeout'
  );
};

// Optimized leads query
export const fetchLeadsData = async (category: string, limit?: number) => {
  const query = supabase
    .from('leads')
    .select(`
      id,
      full_name,
      display_name,
      tel,
      line_id,
      region,
      category,
      status,
      platform,
      sale_owner_id,
      created_at_thai,
      updated_at_thai,
      operation_status,
      avg_electricity_bill,
      notes,
    `)
    .eq('category', category)
    .order('created_at_thai', { ascending: false })
    .limit(limit);
    
  return withTimeout(
    Promise.resolve(query),
    15000,
    'Leads query timeout'
  );
};

// Batch queries with better error handling
export const fetchAppData = async (options: {
  userId?: string;
  category: string;
  includeUserData: boolean;
  includeSalesTeam: boolean;
  includeLeads: boolean;
  limit?: number;
}) => {
  const { userId, category, includeUserData, includeSalesTeam, includeLeads, limit } = options;

  try {
    const queries = [];

    if (includeUserData && userId) {
      queries.push(fetchUserData(userId));
    } else {
      queries.push(Promise.resolve({ data: null, error: null }));
    }

    if (includeSalesTeam) {
      queries.push(fetchSalesTeamData());
    } else {
      queries.push(Promise.resolve({ data: null, error: null }));
    }

    if (includeLeads) {
      queries.push(fetchLeadsData(category, limit));
    } else {
      queries.push(Promise.resolve({ data: null, error: null }));
    }

    const [userResult, salesTeamResult, leadsResult] = await Promise.all(queries);

    return {
      user: userResult.data,
      salesTeam: salesTeamResult.data || [],
      leads: leadsResult.data || [],
      errors: {
        user: userResult.error,
        salesTeam: salesTeamResult.error,
        leads: leadsResult.error
      }
    };
  } catch (error) {
    console.error('Error in fetchAppData:', error);
    throw error;
  }
};
