import { useLocation, useNavigate } from "react-router-dom";
import {
  Package,
  ShoppingCart,
  Truck,
  Users,
  Home,
  ClipboardList,
  ArrowLeft,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import CompanyLogo from "../CompanyLogo";

// Define proper types for menu items
type BaseMenuItem = {
  title: string;
  icon: React.ComponentType<any>;
};

type MenuItemWithUrl = BaseMenuItem & {
  url: string;
  items?: never;
};

type MenuItemWithSubItems = BaseMenuItem & {
  url?: never;
  items: (MenuItemWithUrl | MenuItemWithSubItems)[];
};

type MenuItem = MenuItemWithUrl | MenuItemWithSubItems;

export function InventorySidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const handleMenuClick = (item: MenuItem) => {
    if ("url" in item && item.url) {
      navigate(item.url);
    }
  };

  const menuItems: MenuItem[] = [
    {
      title: "หน้าหลัก",
      url: "/inventory",
      icon: Home,
    },
    {
      title: "จัดการสินค้า",
      url: "/inventory/products",
      icon: Package,
    },
    {
      title: "Purchase Orders",
      icon: ShoppingCart,
      items: [
        {
          title: "รายการ PO",
          url: "/inventory/purchase-orders",
          icon: ClipboardList,
        },
        {
          title: "สร้าง PO ใหม่",
          url: "/inventory/purchase-orders/new",
          icon: ShoppingCart,
        },
      ],
    },
    {
      title: "Suppliers",
      icon: Truck,
      items: [
        {
          title: "รายการ Suppliers",
          url: "/inventory/suppliers",
          icon: Truck,
        },
        {
          title: "เพิ่ม Supplier",
          url: "/inventory/suppliers/new",
          icon: Users,
        },
      ],
    },
    {
      title: "รายการขายออก",
      icon: ShoppingCart,
      items: [
        {
          title: "รายการขาย",
          url: "/inventory/sales/orders",
          icon: ClipboardList,
        },
        {
          title: "สร้างใบขาย",
          url: "/inventory/sales/new",
          icon: ShoppingCart,
        },
      ],
    },
    {
      title: "ลูกค้า",
      url: "/inventory/sales/customers",
      icon: Users,
    },
    {
      title: "คลัง Serial",
      url: "/inventory/serial-ledger",
      icon: Boxes,
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
    if ('items' in item && item.items) {
      const isActive = isGroupActive(item.items);
      
      return (
        <SidebarMenuItem key={item.title}>
          <div>
            <SidebarMenuButton 
              className={`w-full justify-between hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 text-sm py-2 px-3 rounded-xl transition-all duration-200 ${
                isActive ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 font-semibold shadow-sm' : 'text-gray-600'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {state === "expanded" && (
                  <span className="text-sm font-medium truncate flex-1 text-left">{item.title}</span>
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
      const isActive = isActiveLink(item.url);

      if (level > 0) {
        return (
          <SidebarMenuSubItem key={item.title}>
            <SidebarMenuSubButton
              asChild
              onClick={() => handleMenuClick(item)}
              isActive={isActive}
              className={cn(
                "flex items-center gap-1.5 w-full text-sm py-1.5 px-3 rounded-lg transition-all duration-200",
                "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700",
                isActive
                  ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 font-semibold shadow-sm"
                  : "text-gray-600"
              )}
            >
              <button
                type="button"
                className="flex items-center gap-1.5 w-full text-left"
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
              {state === "expanded" && (
                <span className="text-sm font-medium truncate flex-1 text-left">{item.title}</span>
              )}
              </button>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        );
      }

      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            type="button"
            onClick={() => handleMenuClick(item)}
            className={cn(
              "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 text-sm py-1.5 px-3 rounded-lg transition-all duration-200 flex items-center gap-2 w-full",
              isActive
                ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 font-semibold shadow-sm"
                : "text-gray-600"
            )}
            isActive={isActive}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
                {state === "expanded" && (
                  <span className="text-sm font-medium truncate flex-1 text-left">{item.title}</span>
                )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    return null;
  };

  return (
    <Sidebar className="border-r border-blue-200/50 bg-gradient-to-b from-white to-blue-50/30 shadow-lg z-50">
      <SidebarHeader className="border-b border-blue-200/50 px-3 py-3 bg-gradient-to-r from-blue-50 to-indigo-50">
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
            className="w-full hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 text-gray-700 border-blue-200 transition-all duration-200 gap-2 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">กลับหน้าหลัก</span>
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarMenu className="space-y-1">
          {menuItems.map((item) => renderMenuItem(item))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}