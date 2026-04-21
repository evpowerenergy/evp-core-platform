// Standardized Query Keys for the entire application
// This ensures consistent caching and prevents duplicate API calls

export const QUERY_KEYS = {
  // Sales Team
  SALES_TEAM: {
    ALL: ['sales_team', 'all'] as const,
    ACTIVE: ['sales_team', 'active'] as const,
    OPTIMIZED: ['sales_team', 'optimized'] as const,
    WITH_METRICS: ['sales_team', 'with_metrics'] as const,
  },
  
  // Leads
  LEADS: {
    ALL: ['leads', 'all'] as const,
    PACKAGE: ['leads', 'package'] as const,
    WHOLESALE: ['leads', 'wholesale'] as const,
    BY_CATEGORY: (category: string) => ['leads', 'category', category] as const,
    MY_LEADS: (userId: string) => ['leads', 'my', userId] as const,
    DETAIL: (id: number) => ['leads', 'detail', id] as const,
    TIMELINE: (id: number) => ['leads', 'timeline', id] as const,
  },
  
  // Users
  USERS: {
    CURRENT: (userId: string) => ['users', 'current', userId] as const,
    PROFILE: (userId: string) => ['users', 'profile', userId] as const,
    DATA: (userId: string) => ['users', 'data', userId] as const,
  },
  
  // Quotations
  QUOTATIONS: {
    ALL: ['quotations', 'all'] as const,
    BY_LEAD: (leadId: number) => ['quotations', 'lead', leadId] as const,
    BY_SALES: (salesId: number) => ['quotations', 'sales', salesId] as const,
  },
  
  // Appointments
  APPOINTMENTS: {
    BY_USER: (userId: string) => ['appointments', 'user', userId] as const,
    FOLLOW_UP: (userId: string) => ['appointments', 'follow_up', userId] as const,
    ENGINEER: (userId: string) => ['appointments', 'engineer', userId] as const,
    PAYMENT: (userId: string) => ['appointments', 'payment', userId] as const,
  },
  
  // Reports
  REPORTS: {
    LEAD_SUMMARY: ['reports', 'lead_summary'] as const,
    PACKAGE_DASHBOARD: ['reports', 'package_dashboard'] as const,
    WHOLESALE_DASHBOARD: ['reports', 'wholesale_dashboard'] as const,
    ALL_LEADS: ['reports', 'all_leads'] as const,
  },
  
  // Combined Data
  APP_DATA: {
    DASHBOARD: (category: string) => ['app_data', 'dashboard', category] as const,
    SALES_TEAM_PAGE: ['app_data', 'sales_team'] as const,
    MY_LEADS: (userId: string, category: string) => ['app_data', 'my_leads', userId, category] as const,
  },
} as const;

// Helper function to create query keys with parameters
export const createQueryKey = <T extends readonly unknown[]>(key: T): T => key; 