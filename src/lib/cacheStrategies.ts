/**
 * Cache Strategy Patterns สำหรับ React Query
 * จัดการ cache configuration ให้สอดคล้องกันทั่วทั้งแอป
 */

export const CACHE_STRATEGIES = {
  /**
   * สำหรับหน้าที่ใช้ Realtime API
   * - staleTime สั้นมาก เพราะมี realtime updates
   * - refetchOnWindowFocus = false เพราะไม่จำเป็น
   */
  REALTIME: {
    staleTime: 1000 * 10, // 10 วินาที
    gcTime: 1000 * 60 * 2, // 2 นาที
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },

  /**
   * สำหรับหน้าปกติที่ไม่มี Realtime
   * - staleTime ปานกลาง
   * - refetchOnWindowFocus = true เพื่อ fresh data
   */
  STANDARD: {
    staleTime: 1000 * 60 * 2, // 2 นาที
    gcTime: 1000 * 60 * 10, // 10 นาที
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  /**
   * สำหรับหน้า Reports และ Analytics
   * - staleTime นานขึ้น เพราะข้อมูลไม่เปลี่ยนบ่อย
   * - refetchOnWindowFocus = false เพื่อลด API calls
   */
  REPORTS: {
    staleTime: 1000 * 60 * 5, // 5 นาที
    gcTime: 1000 * 60 * 15, // 15 นาที
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },

  /**
   * สำหรับข้อมูล Static (users, products, settings)
   * - staleTime นานมาก เพราะไม่เปลี่ยนบ่อย
   * - refetchOnWindowFocus = false
   */
  STATIC: {
    staleTime: 1000 * 60 * 10, // 10 นาที
    gcTime: 1000 * 60 * 30, // 30 นาที
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },

  /**
   * สำหรับ Forms และ Real-time Updates
   * - ไม่ใช้ cache เพื่อให้ข้อมูล fresh เสมอ
   */
  NO_CACHE: {
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },
} as const;

/**
 * Helper function สำหรับใช้ cache strategy
 */
export const useCacheStrategy = (strategy: keyof typeof CACHE_STRATEGIES) => {
  return CACHE_STRATEGIES[strategy];
};

/**
 * Mapping ของหน้าต่างๆ กับ Cache Strategy
 */
export const PAGE_CACHE_MAPPING = {
  // หน้าที่ใช้ Realtime API
  REALTIME_PAGES: [
    'Dashboard',
    'WholesaleDashboard', 
    'MyLeads',
    'WholesaleMyLeads',
    'MyAppointments',
    'WholesaleMyAppointments'
  ],

  // หน้า Reports
  REPORTS_PAGES: [
    'AllLeadsReport',
    'LeadSummary',
    'CustomerStatus',
    'PackageDashboard',
    'WholesaleDashboard'
  ],

  // หน้า Static Data
  STATIC_PAGES: [
    'ProductManagement',
    'Suppliers',
    'Customers',
    'UserManagement'
  ],

  // หน้า Forms
  FORM_PAGES: [
    'ProductivityLogForm',
    'EditProductivityLogForm',
    'LeadAdd',
    'NewSale'
  ]
} as const;

/**
 * ฟังก์ชันสำหรับหา cache strategy ที่เหมาะสม
 */
export const getCacheStrategyForPage = (pageName: string): keyof typeof CACHE_STRATEGIES => {
  if (PAGE_CACHE_MAPPING.REALTIME_PAGES.includes(pageName as any)) {
    return 'REALTIME';
  }
  
  if (PAGE_CACHE_MAPPING.REPORTS_PAGES.includes(pageName as any)) {
    return 'REPORTS';
  }
  
  if (PAGE_CACHE_MAPPING.STATIC_PAGES.includes(pageName as any)) {
    return 'STATIC';
  }
  
  if (PAGE_CACHE_MAPPING.FORM_PAGES.includes(pageName as any)) {
    return 'NO_CACHE';
  }
  
  // Default to STANDARD
  return 'STANDARD';
};
