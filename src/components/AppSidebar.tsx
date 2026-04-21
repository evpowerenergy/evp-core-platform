import { useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  BarChart3,
  TrendingUp,
  LayoutDashboard,
  UserCheck,
  Home,
  User,
  Calendar,
  PieChart,
  FileText,
  Lock,
  ArrowLeft,
  XCircle
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

import { toast } from "@/components/ui/use-toast";
import CompanyLogo from "./CompanyLogo";

// Define proper types for menu items
type BaseMenuItem = {
  title: string;
  icon: React.ComponentType<any>;
  requiredPermission?: () => boolean;
};

type MenuItemWithUrl = BaseMenuItem & {
  url: string;
  items?: never;
  isDevOnly?: boolean;
};

type MenuItemWithSubItems = BaseMenuItem & {
  url?: never;
  items: (MenuItemWithUrl | MenuItemWithSubItems)[];
  isDevOnly?: boolean;
};

type MenuItem = MenuItemWithUrl | MenuItemWithSubItems;

const IS_DEV = import.meta.env.MODE === "development";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const permissions = usePermissions();

  const handleMenuClick = (e: React.MouseEvent, item: MenuItem) => {
    if ('url' in item && item.url) {
      if (item.requiredPermission && !item.requiredPermission()) {
        e.preventDefault();
        toast({
          title: "ไม่มีสิทธิ์เข้าถึง",
          description: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบ",
          variant: "destructive",
        });
        return;
      }
      
      // For external links, let the browser handle it naturally
      // For internal links, prevent default and navigate (or let Link handle it)
      if (!item.url.startsWith('http')) {
        // Internal link - let Link component handle it, but prevent default if no permission
        if (item.requiredPermission && !item.requiredPermission()) {
          e.preventDefault();
        }
      }
    }
  };

  // Function to check if package menu should be shown (hide for admin_page)
  const shouldShowPackageMenu = () => {
    return permissions.canAccessPackageOnly;
  };

  // Function to check if wholesale menu should be shown (hide for admin_page)
  const shouldShowWholesaleMenu = () => {
    return permissions.canAccessWholesaleOnly;
  };

  const reportSubItems: MenuItem[] = [
    {
      title: "ลีด เเอดมิน",
      url: "/reports/all-leads",
      icon: Users,
      requiredPermission: () => permissions.canAccessAllFeatures,
    },
    {
      title: "Package Sales",
      url: "/reports/package",
      icon: BarChart3,
      requiredPermission: () => permissions.canAccessPackageOnly,
    },
    {
      title: "Wholesale Sales",
      url: "/reports/wholesale",
      icon: TrendingUp,
      requiredPermission: () => permissions.canAccessWholesaleOnly,
    },
    {
      title: "เปรียบเทียบการขาย",
      url: "/reports/lead-summary",
      icon: PieChart,
      requiredPermission: () => permissions.canAccessAllFeatures,
    },
    {
      title: "โอกาสการขาย",
      url: "/reports/sales-opportunity",
      icon: TrendingUp,
      requiredPermission: () => permissions.canAccessAllFeatures,
    },
    {
      title: "รายการปิดการขาย",
      url: "/reports/sales-closed",
      icon: UserCheck,
      requiredPermission: () => permissions.canAccessAllFeatures,
    },
    {
      title: "รายการปิดการขายไม่สำเร็จ",
      url: "/reports/sales-unsuccessful",
      icon: XCircle,
      requiredPermission: () => permissions.canAccessAllFeatures,
    },
    {
      title: "รายการลูกค้า",
      url: "/reports/customer-list",
      icon: Users,
      requiredPermission: () => permissions.canAccessAllFeatures,
    },
  ];

  if (IS_DEV) {
    reportSubItems.splice(4, 0, {
      title: "สถานะลูกค้า",
      url: "/reports/customer-status",
      icon: Users,
      requiredPermission: () => permissions.canAccessAllFeatures,
      isDevOnly: true,
    });

    reportSubItems.push({
      title: "Funnel การขาย",
      url: "/reports/sales-funnel",
      icon: BarChart3,
      requiredPermission: () => permissions.canAccessAllFeatures,
      isDevOnly: true,
    });
  }

  const menuItems: MenuItem[] = [
    {
      title: "หน้าหลัก",
      url: "/",
      icon: Home,
    },
    {
      title: "ฝ่ายขาย",
      icon: Users,
      items: [
        {
          title: "เพิ่ม Lead",
          url: "/leads/new",
          icon: User,
          requiredPermission: () => permissions.canAccessSalesFeatures,
        },
        {
          title: "ทำใบเสนอราคา",
          url: "https://auth.flowaccount.com/th?_gl=1*1mdbqjb*_ga*MjkxOTIyMTE2LjE3NTIwMzYwMjU.*_up*MQ",
          icon: FileText,
          requiredPermission: () => permissions.canAccessSalesFeatures,
        },
        {
          title: "ทีมขาย",
          url: "/sales-team",
          icon: UserCheck,
          requiredPermission: () => permissions.canViewSalesTeam,
        },
        {
          title: "Package",
          icon: LayoutDashboard,
          requiredPermission: shouldShowPackageMenu,
          items: [
            {
              title: "จัดการลีด",
              url: "/lead-management",
              icon: LayoutDashboard,
              requiredPermission: () => permissions.canAccessPackageOnly,
            },
            {
              title: "ลีดของฉัน",
              url: "/my-leads",
              icon: User,
              requiredPermission: () => permissions.canAccessPackageOnly,
            },
            {
              title: "นัดหมายของฉัน",
              url: "/my-appointments",
              icon: Calendar,
              requiredPermission: () => permissions.canAccessPackageOnly,
            },
          ],
        },
        {
          title: "Wholesale",
          icon: BarChart3,
          requiredPermission: shouldShowWholesaleMenu,
          items: [
            {
              title: "จัดการลีด",
              url: "/wholesale/lead-management",
              icon: LayoutDashboard,
              requiredPermission: () => permissions.canAccessWholesaleOnly,
            },
            {
              title: "ลีดของฉัน",
              url: "/wholesale/my-leads",
              icon: User,
              requiredPermission: () => permissions.canAccessWholesaleOnly,
            },
            {
              title: "นัดหมายของฉัน",
              url: "/wholesale/my-appointments",
              icon: Calendar,
              requiredPermission: () => permissions.canAccessWholesaleOnly,
            },
          ],
        },
      ],
    },
    {
      title: "รายงาน",
      icon: FileText,
      requiredPermission: () => permissions.canAccessSalesFeatures,
      items: reportSubItems,
    },
    {
      title: "ติดตามหลัง Service ครบ",
      icon: TrendingUp,
      requiredPermission: () => permissions.canAccessSalesFeatures,
      items: [
        {
          title: "Dashboard การติดตาม",
          url: "/sale-follow-up/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "จัดการการติดตาม",
          url: "/sale-follow-up/management",
          icon: Users,
        },
      ],
    },
  ];

  const isActiveLink = (url: string) => {
    return location.pathname === url || location.pathname.startsWith(url + '/');
  };

  const isGroupActive = (items: MenuItem[]): boolean => {
    return items.some(item => {
      if ('url' in item && item.url) {
        return isActiveLink(item.url);
      }
      if ('items' in item && item.items) {
        return isGroupActive(item.items);
      }
      return false;
    });
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasPermission = !item.requiredPermission || item.requiredPermission();
    const isDisabled = !hasPermission;
    const showDevBadge = 'isDevOnly' in item && item.isDevOnly && IS_DEV;
    
    if ('items' in item && item.items) {
      const isActive = isGroupActive(item.items);
      
      return (
        <SidebarMenuItem key={item.title}>
          <div>
            <SidebarMenuButton 
              className={`w-full justify-between hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 text-sm py-2 px-3 rounded-xl transition-all duration-200 ${
                isActive ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 font-semibold shadow-sm' : 'text-gray-600'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {state === "expanded" && (
                  <span className="text-sm font-medium truncate flex-1">{item.title}</span>
                )}
              </div>
            </SidebarMenuButton>
            {state === "expanded" && (
              <SidebarMenuSub className="mt-2 space-y-1">
                {item.items.map((subItem) => renderMenuItem(subItem, level + 1))}
              </SidebarMenuSub>
            )}
          </div>
        </SidebarMenuItem>
      );
    }

    if ('url' in item && item.url) {
      const isExternal = item.url.startsWith('http');
      const isActive = isActiveLink(item.url);
      
      // For submenu items (level > 0), use SidebarMenuSubButton and SidebarMenuSubItem
      if (level > 0) {
        if (isExternal) {
          return (
            <SidebarMenuSubItem key={item.title}>
              <SidebarMenuSubButton
                asChild
                isActive={isActive}
                className={`hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 text-sm py-1.5 px-3 rounded-lg transition-all duration-200 ${
                  isActive ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 font-semibold shadow-sm' : 'text-gray-600'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isDisabled}
              >
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (isDisabled) {
                      e.preventDefault();
                      handleMenuClick(e, item);
                    }
                  }}
                  className="flex items-center gap-2 flex-1 min-w-0"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {state === "expanded" && (
                    <span className="text-sm font-medium truncate flex-1">{item.title}</span>
                  )}
                  {showDevBadge && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      dev
                    </span>
                  )}
                  {isDisabled && <Lock className="h-3 w-3 text-gray-400 flex-shrink-0 ml-auto" />}
                </a>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          );
        }
        
        return (
          <SidebarMenuSubItem key={item.title}>
            <SidebarMenuSubButton
              asChild
              isActive={isActive}
              className={`hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 text-sm py-1.5 px-3 rounded-lg transition-all duration-200 ${
                isActive ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 font-semibold shadow-sm' : 'text-gray-600'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isDisabled}
            >
              <Link 
                to={item.url}
                onClick={(e) => handleMenuClick(e, item)}
                className="flex items-center gap-2 flex-1 min-w-0"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {state === "expanded" && (
                  <span className="text-sm font-medium truncate flex-1">{item.title}</span>
                )}
                {showDevBadge && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    dev
                  </span>
                )}
                {isDisabled && <Lock className="h-3 w-3 text-gray-400 flex-shrink-0 ml-auto" />}
              </Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        );
      }
      
      // For top-level menu items (level === 0)
      // For external links, use anchor tag
      if (isExternal) {
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton 
              asChild
              className={`hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 text-sm py-1.5 px-3 rounded-lg transition-all duration-200 ${
                isActive ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 font-semibold shadow-sm' : 'text-gray-600'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isDisabled}
            >
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (isDisabled) {
                    e.preventDefault();
                    handleMenuClick(e, item);
                  }
                }}
                className="flex items-center gap-2 flex-1 min-w-0"
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {state === "expanded" && (
                  <span className="text-sm font-medium truncate flex-1">{item.title}</span>
                )}
                {showDevBadge && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    dev
                  </span>
                )}
                {isDisabled && <Lock className="h-3 w-3 text-gray-400 flex-shrink-0 ml-auto" />}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      }
      
      // For internal links, use Link component to enable right-click context menu
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton 
            asChild
            className={`hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 text-sm py-1.5 px-3 rounded-lg transition-all duration-200 ${
              isActive ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 font-semibold shadow-sm' : 'text-gray-600'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isDisabled}
          >
            <Link 
              to={item.url}
              onClick={(e) => handleMenuClick(e, item)}
              className="flex items-center gap-2 flex-1 min-w-0"
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {state === "expanded" && (
                <span className="text-sm font-medium truncate flex-1">{item.title}</span>
              )}
              {showDevBadge && (
                <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  dev
                </span>
              )}
              {isDisabled && <Lock className="h-3 w-3 text-gray-400 flex-shrink-0 ml-auto" />}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    return null;
  };

  return (
    <Sidebar className="border-r border-green-200/50 bg-gradient-to-b from-white to-green-50/30 shadow-lg z-50">
      <SidebarHeader className="border-b border-green-200/50 px-3 py-3 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="space-y-3">
          {/* Logo Section */}
          <div className="flex items-center justify-center">
            <CompanyLogo 
              size="md" 
              showText={false} 
              clickable={false}
            />
          </div>
          
          {/* Back Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/backoffice')}
            className="w-full hover:bg-green-100 hover:text-green-700 hover:border-green-300 text-gray-700 border-green-200 transition-all duration-200 gap-2 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">กลับหน้าหลัก</span>
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2">
        <SidebarMenu className="space-y-1">
          {menuItems.map((item) => renderMenuItem(item))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
