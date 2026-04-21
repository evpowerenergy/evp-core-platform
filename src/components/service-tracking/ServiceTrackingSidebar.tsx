import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  FileText, 
  Plus, 
  BarChart3, 
  Users,
  Wrench,
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import CompanyLogo from "../CompanyLogo";
import { cn } from "@/lib/utils";
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

const ServiceTrackingSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();

  const menuItems = [
    {
      title: "หน้าหลัก",
      href: "/service-tracking",
      icon: Home,
      exact: true
    },
    {
      title: "คำขออนุญาต",
      href: "/service-tracking/requests",
      icon: FileText,
      children: [
        {
          title: "รายการคำขอ",
          href: "/service-tracking/requests"
        },
        {
          title: "เพิ่มคำขอใหม่",
          href: "/service-tracking/requests/new"
        },
        // Hidden: รายงานคำขออนุญาต (Page still exists but hidden from menu)
        // {
        //   title: "รายงานคำขออนุญาต",
        //   href: "/service-tracking/permit-reports"
        // },
        {
          title: "Dashboard คำขออนุญาต",
          href: "/service-tracking/permit-dashboard"
        }
      ]
    },
    {
      title: "Service ลูกค้า",
      href: "/service-tracking/customer-services",
      icon: Users,
      children: [
        {
          title: "รายการลูกค้า",
          href: "/service-tracking/customer-services"
        },
        {
          title: "เพิ่มลูกค้าใหม่",
          href: "/service-tracking/customer-services/new"
        },
        {
          title: "นัด service",
          href: "/service-tracking/service-appointments"
        },
        {
          title: "รายการนัดหมาย",
          href: "/service-tracking/weekly-appointments"
        },
        {
          title: "Dashboard บริการ",
          href: "/service-tracking/customer-services-dashboard"
        },
      ]
    },
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <Sidebar className="border-r border-orange-200/50 bg-gradient-to-b from-white to-orange-50/30 shadow-lg z-50">
      <SidebarHeader className="border-b border-orange-200/50 px-3 py-3 bg-gradient-to-r from-orange-50 to-amber-50">
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
            className="w-full hover:bg-orange-100 hover:text-orange-700 hover:border-orange-300 text-gray-700 border-orange-200 transition-all duration-200 gap-2 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">กลับหน้าหลัก</span>
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarMenu className="space-y-1">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.children ? (
                <>
                  <SidebarMenuButton 
                    asChild
                    className={cn(
                      "w-full justify-start text-sm py-1.5 px-3 rounded-lg transition-all duration-200",
                      isActive(item.href, item.exact)
                        ? "bg-orange-100 text-orange-700 border border-orange-200 font-semibold shadow-sm"
                        : "text-gray-600 hover:bg-orange-50 hover:text-orange-700"
                    )}
                  >
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  
                  <SidebarMenuSub className="mt-2 space-y-1">
                    {item.children.map((child) => (
                      <SidebarMenuSubItem key={child.title}>
                        <SidebarMenuSubButton 
                          asChild
                          className={cn(
                            "w-full text-sm py-1 px-3 rounded-lg transition-all duration-200",
                            isActive(child.href, true)
                              ? "bg-orange-200 text-orange-800 font-medium"
                              : "text-gray-600 hover:text-orange-700 hover:bg-orange-50"
                          )}
                        >
                          <Link to={child.href}>
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                            {child.title}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </>
              ) : (
                <SidebarMenuButton 
                  asChild
                  className={cn(
                    "w-full justify-start text-sm py-1.5 px-3 rounded-lg transition-all duration-200",
                    isActive(item.href, item.exact)
                      ? "bg-orange-100 text-orange-700 border border-orange-200 font-semibold shadow-sm"
                      : "text-gray-600 hover:bg-orange-50 hover:text-orange-700"
                  )}
                >
                  <Link to={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};

export default ServiceTrackingSidebar;

