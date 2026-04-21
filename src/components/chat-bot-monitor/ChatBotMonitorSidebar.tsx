import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Bot,
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

const ChatBotMonitorSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();

  const menuItems = [
    {
      title: "จัดการ Chatbot ลูกค้า",
      href: "/chat-bot-monitor",
      icon: Bot,
      exact: true
    },
    {
      title: "Performance",
      href: "/chat-bot-monitor/performance",
      icon: TrendingUp,
      exact: false
    }
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <Sidebar className="border-r border-indigo-700/50 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 shadow-2xl z-50">
      <SidebarHeader className="border-b border-indigo-700/50 px-3 py-3 bg-gradient-to-r from-slate-900 to-indigo-900/50">
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
            className="w-full hover:bg-indigo-600 hover:text-white hover:border-indigo-500 text-slate-300 border-indigo-700/50 bg-slate-800/50 transition-all duration-200 gap-2 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">กลับหน้าหลัก</span>
          </Button>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-4 py-4">
        <SidebarGroup>
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
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-lg shadow-indigo-500/30 border border-indigo-500/50"
                          : "text-slate-300 hover:bg-slate-800/70 hover:text-indigo-300"
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

export default ChatBotMonitorSidebar;

