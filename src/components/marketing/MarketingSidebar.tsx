import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  BarChart3,
  Megaphone,
  ArrowLeft,
  TrendingUp
} from "lucide-react";
import CompanyLogo from "../CompanyLogo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const MarketingSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();

  const menuItems = [
    {
      title: "หน้าหลัก",
      href: "/marketing",
      icon: Home,
      exact: true
    },
    {
      title: "Marketing Analytics",
      href: "/marketing/analytics",
      icon: BarChart3
    },
    {
      title: "จัดการแอดโฆษณา",
      href: "/marketing/ads-management",
      icon: Megaphone
    },
    {
      title: "รายงานผลลัพธ์แอดโฆษณา",
      href: "/marketing/ads-performance",
      icon: TrendingUp
    }
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <Sidebar className="border-r border-pink-200/50 bg-gradient-to-b from-white to-pink-50/30 shadow-lg z-50">
      <SidebarHeader className="border-b border-pink-200/50 px-3 py-3 bg-gradient-to-r from-pink-50 to-rose-50">
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
            className="w-full hover:bg-pink-100 hover:text-pink-700 hover:border-pink-300 text-gray-700 border-pink-200 transition-all duration-200 gap-2 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">กลับหน้าหลัก</span>
          </Button>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-4 py-4">
        <SidebarGroup>
          {/* <SidebarGroupLabel className="text-xs font-semibold text-pink-600 uppercase tracking-wider mb-3">
            ระบบ Marketing
          </SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200",
                        isActive(item.href, item.exact)
                          ? "bg-pink-100 text-pink-700 font-medium shadow-sm border border-pink-200"
                          : "text-gray-600 hover:bg-pink-50 hover:text-pink-600"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default MarketingSidebar;
