
import { useUserDataAPI as useUserData } from './useUserDataAPI';

export interface UserPermissions {
  canAccessCrm: boolean;
  canAccessHr: boolean;
  canManageCrm: boolean;
  canManageHr: boolean;
  canViewAllLeads: boolean;
  canViewAllEmployees: boolean;
  canViewSalesTeam: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canManageEquipment: boolean;
  canAccessPackage: boolean;
  canAccessWholesale: boolean;
  canManageSystem: boolean;
  isAdminPage: boolean;
  isAuthenticated: boolean;
  isSalesUser: boolean;
  isAdminOrManager: boolean;
  isSalesRole: boolean;
  userRole: string | null;
  userId: string | null;
  salesMemberId: number | null;
  userName: string | null;
  userEmail: string | null;
  userDepartment: string | null;
  // Additional helper functions
  canAccessSalesFeatures: boolean;
  canAccessPackageOnly: boolean;
  canAccessWholesaleOnly: boolean;
  canAccessAllFeatures: boolean;
  // New permissions for system access control
  canAccessInventory: boolean;
  canAccessServiceTracking: boolean;
  canAccessMarketing: boolean;
  canAccessChatBotMonitor: boolean;
  /** EV Member (/ev-member) — manager + super_admin + back_office */
  canAccessEvMember: boolean;
  isBackOffice: boolean;
  isEngineer: boolean;
  isMarketing: boolean;
}

export const usePermissions = (): UserPermissions => {
  const { data: userData, isLoading } = useUserData();

  // Default permissions สำหรับการโหลดหรือไม่มี user
  const defaultPermissions: UserPermissions = {
    canAccessCrm: false,
    canAccessHr: false,
    canManageCrm: false,
    canManageHr: false,
    canViewAllLeads: false,
    canViewAllEmployees: false,
    canViewSalesTeam: false,
    canViewReports: false,
    canManageUsers: false,
    canManageEquipment: false,
    canAccessPackage: false,
    canAccessWholesale: false,
    canManageSystem: false,
    isAdminPage: false,
    isAuthenticated: false,
    isSalesUser: false,
    isAdminOrManager: false,
    isSalesRole: false,
    userRole: null,
    userId: null,
    salesMemberId: null,
    userName: null,
    userEmail: null,
    userDepartment: null,
    canAccessSalesFeatures: false,
    canAccessPackageOnly: false,
    canAccessWholesaleOnly: false,
    canAccessAllFeatures: false,
    // New permissions
    canAccessInventory: false,
    canAccessServiceTracking: false,
    canAccessMarketing: false,
    canAccessChatBotMonitor: false,
    canAccessEvMember: false,
    isBackOffice: false,
    isEngineer: false,
    isMarketing: false,
  };

  if (isLoading || !userData?.user) {
    return defaultPermissions;
  }

  const user = userData.user;
  const role = user.role;

  // ตรวจสอบ role และกำหนด permissions
  const isSuperAdmin = role === 'super_admin';
  const isManagerSale = role === 'manager_sale';
  const isManagerMarketing = role === 'manager_marketing';
  const isManagerHr = role === 'manager_hr';
  const isSalePackage = role === 'sale_package';
  const isSaleWholesale = role === 'sale_wholesale';
  const isAdminPage = role === 'admin_page';
  const isStaff = role === 'staff';
  const isBackOffice = role === 'back_office';
  const isEngineer = role === 'engineer';
  const isMarketing = role === 'marketing';
  
  // manager_marketing มีสิทธิ์เหมือน manager_sale
  const isManagerSaleOrMarketing = isManagerSale || isManagerMarketing;

  // ระบบ CRM: super_admin, manager_sale, manager_marketing, manager_hr, sale_package, sale_wholesale, admin_page
  const canAccessCrm = isSuperAdmin || isManagerSaleOrMarketing || isManagerHr || isSalePackage || isSaleWholesale || isAdminPage;
  const canAccessHr = isSuperAdmin || isManagerHr || isStaff || isAdminPage;
  const canManageCrm = isSuperAdmin || isManagerSaleOrMarketing || isAdminPage;
  const canManageHr = isSuperAdmin || isManagerHr || isAdminPage;
  const canViewAllLeads = isSuperAdmin || isManagerSaleOrMarketing || isAdminPage;
  const canViewAllEmployees = isSuperAdmin || isManagerHr || isAdminPage;
  const canViewSalesTeam = isSuperAdmin || isManagerSaleOrMarketing || isAdminPage;
  const canViewReports = isSuperAdmin || isManagerSaleOrMarketing || isManagerHr || isAdminPage;
  const canManageUsers = isSuperAdmin || isManagerHr || isAdminPage;
  const canManageEquipment = isSuperAdmin || isAdminPage;
  const canAccessPackage = isSuperAdmin || isManagerSaleOrMarketing || isSalePackage;
  const canAccessWholesale = isSuperAdmin || isManagerSaleOrMarketing || isSaleWholesale;
  const canManageSystem = isSuperAdmin || isAdminPage;

  // ระบบคลังสินค้า: super_admin, manager_sale, manager_marketing, manager_hr, back_office
  const canAccessInventory = isSuperAdmin || isManagerSaleOrMarketing || isManagerHr || isBackOffice;
  
  // ระบบติดตามการขออนุญาต: super_admin, manager_sale, manager_marketing, manager_hr, engineer
  const canAccessServiceTracking = isSuperAdmin || isManagerSaleOrMarketing || isManagerHr || isEngineer;
  
  // ระบบ Marketing: super_admin, manager_sale, manager_marketing, manager_hr, marketing
  const canAccessMarketing = isSuperAdmin || isManagerSaleOrMarketing || isManagerHr || isMarketing;
  
  // ระบบ Chat Bot Monitor: super_admin, manager_sale, manager_marketing, manager_hr, admin_page
  const canAccessChatBotMonitor = isSuperAdmin || isManagerSaleOrMarketing || isManagerHr || isAdminPage;

  // EV Member: super_admin, manager_sale, manager_marketing, back_office (Hub + รายงานลูกค้าปิดขาย)
  const canAccessEvMember = isSuperAdmin || isManagerSaleOrMarketing || isBackOffice;

  const isAdminOrManager = isSuperAdmin || isManagerSaleOrMarketing || isManagerHr || isAdminPage;
  const isSalesRole = isSuperAdmin || isManagerSaleOrMarketing || isSalePackage || isSaleWholesale || isAdminPage;
  const isSalesUser = isSalePackage || isSaleWholesale;

  // Additional helper permissions
  const canAccessSalesFeatures = canAccessCrm;
  const canAccessPackageOnly = canAccessPackage && !isAdminPage;
  const canAccessWholesaleOnly = canAccessWholesale && !isAdminPage;
  const canAccessAllFeatures = isSuperAdmin || isManagerSaleOrMarketing || isAdminPage || isSalePackage;

  // รวบรวม user info
  const userName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : 'Unknown User';
  
  const salesMemberId = userData.salesMember?.id || null;

  return {
    canAccessCrm,
    canAccessHr,
    canManageCrm,
    canManageHr,
    canViewAllLeads,
    canViewAllEmployees,
    canViewSalesTeam,
    canViewReports,
    canManageUsers,
    canManageEquipment,
    canAccessPackage,
    canAccessWholesale,
    canManageSystem,
    isAdminPage,
    isAuthenticated: true,
    isSalesUser,
    isAdminOrManager,
    isSalesRole,
    userRole: role,
    userId: user.id,
    salesMemberId,
    userName,
    userEmail: user.email || null,
    userDepartment: user.department || null,
    canAccessSalesFeatures,
    canAccessPackageOnly,
    canAccessWholesaleOnly,
    canAccessAllFeatures,
    // New permissions
    canAccessInventory,
    canAccessServiceTracking,
    canAccessMarketing,
    canAccessChatBotMonitor,
    canAccessEvMember,
    isBackOffice,
    isEngineer,
    isMarketing,
  };
};
