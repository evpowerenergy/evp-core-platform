import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { PageLoading } from '@/components/ui/loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: {
    canAccessCRM?: boolean;
    canAccessHR?: boolean;
    canManageCRM?: boolean;
    canManageHR?: boolean;
    canManageSystem?: boolean;
    canViewAllLeads?: boolean;
    canViewAllEmployees?: boolean;
    canViewSalesTeam?: boolean;
    canViewReports?: boolean;
    canAccessPackage?: boolean;
    canAccessWholesale?: boolean;
    canManageUsers?: boolean;
    canManageEquipment?: boolean;
  };
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requiredPermissions = {},
  fallbackPath = '/unauthorized'
}) => {
  const { user, loading } = useAuth();
  const permissions = usePermissions();

  // Show loading while checking authentication
  if (loading) {
    return <PageLoading type="dashboard" />;
  }

  // Redirect to login if no user is authenticated
  if (!user) {
    
    return <Navigate to="/auth" replace />;
  }

  // Check if user has required role
  if (requiredRoles.length > 0 && permissions.userRole && !requiredRoles.includes(permissions.userRole)) {
    
    return <Navigate to={fallbackPath} replace />;
  }

  // Check if user has required permissions
  const permissionChecks = [
    { check: requiredPermissions.canAccessCRM, hasPermission: permissions.canAccessCrm },
    { check: requiredPermissions.canAccessHR, hasPermission: permissions.canAccessHr },
    { check: requiredPermissions.canManageCRM, hasPermission: permissions.canManageCrm },
    { check: requiredPermissions.canManageHR, hasPermission: permissions.canManageHr },
    { check: requiredPermissions.canManageSystem, hasPermission: permissions.canManageSystem },
    { check: requiredPermissions.canViewAllLeads, hasPermission: permissions.canViewAllLeads },
    { check: requiredPermissions.canViewAllEmployees, hasPermission: permissions.canViewAllEmployees },
    { check: requiredPermissions.canViewSalesTeam, hasPermission: permissions.canViewSalesTeam },
    { check: requiredPermissions.canViewReports, hasPermission: permissions.canViewReports },
    { check: requiredPermissions.canAccessPackage, hasPermission: permissions.canAccessPackage },
    { check: requiredPermissions.canAccessWholesale, hasPermission: permissions.canAccessWholesale },
    { check: requiredPermissions.canManageUsers, hasPermission: permissions.canManageUsers },
    { check: requiredPermissions.canManageEquipment, hasPermission: permissions.canManageEquipment }
  ];

  for (const { check, hasPermission } of permissionChecks) {
    if (check === true && !hasPermission) {

      return <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
};

// Predefined route components for common use cases
export const CRMOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredPermissions={{ canAccessCRM: true }}>
    {children}
  </ProtectedRoute>
);

export const HROnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredPermissions={{ canAccessHR: true }}>
    {children}
  </ProtectedRoute>
);

export const AdminOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['super_admin', 'admin_page']}>
    {children}
  </ProtectedRoute>
);

export const ManagerOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['super_admin', 'manager_sale', 'manager_marketing', 'manager_hr', 'admin_page']}>
    {children}
  </ProtectedRoute>
);

export const SalesOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['super_admin', 'manager_sale', 'manager_marketing', 'sale_package', 'sale_wholesale', 'admin_page']}>
    {children}
  </ProtectedRoute>
);

export const PackageSalesOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['super_admin', 'manager_sale', 'manager_marketing', 'sale_package']}>
    {children}
  </ProtectedRoute>
);

export const WholesaleSalesOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['super_admin', 'manager_sale', 'manager_marketing', 'sale_wholesale']}>
    {children}
  </ProtectedRoute>
);

export const AdminPageRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['super_admin', 'admin_page']}>
    {children}
  </ProtectedRoute>
); 

export const AllRolesRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute>
    {children}
  </ProtectedRoute>
);

// New ProtectedRoute components for system access control

// ระบบคลังสินค้า: super_admin, manager_sale, manager_marketing, manager_hr, back_office
export const InventoryOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['super_admin', 'manager_sale', 'manager_marketing', 'manager_hr', 'back_office']}>
    {children}
  </ProtectedRoute>
);

// ระบบติดตามการขออนุญาต: super_admin, manager_sale, manager_marketing, manager_hr, engineer
export const ServiceTrackingOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['super_admin', 'manager_sale', 'manager_marketing', 'manager_hr', 'engineer']}>
    {children}
  </ProtectedRoute>
);

// ระบบ Marketing: super_admin, manager_sale, manager_marketing, manager_hr, marketing
export const MarketingOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['super_admin', 'manager_sale', 'manager_marketing', 'manager_hr', 'marketing']}>
    {children}
  </ProtectedRoute>
);

// ระบบ CRM: super_admin, manager_sale, manager_marketing, manager_hr, sale_package, sale_wholesale, admin_page
export const CRMOnlyRouteNew: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={['super_admin', 'manager_sale', 'manager_marketing', 'manager_hr', 'sale_package', 'sale_wholesale', 'admin_page']}>
    {children}
  </ProtectedRoute>
);
