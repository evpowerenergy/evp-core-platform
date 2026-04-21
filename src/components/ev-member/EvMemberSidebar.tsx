import { useLocation, useNavigate } from "react-router-dom";
import { Crown, LayoutGrid, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import CompanyLogo from "@/components/CompanyLogo";

export function EvMemberSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const permissions = usePermissions();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <Sidebar className="border-r border-teal-200/50 bg-gradient-to-b from-white to-teal-50/40 shadow-lg z-50">
      <SidebarHeader className="border-b border-teal-200/50 px-3 py-3 bg-gradient-to-r from-teal-50 to-cyan-50">
        <div className="space-y-3">
          <div className="flex items-center justify-center">
            <CompanyLogo size="md" showText={false} clickable={false} />
          </div>
          <div
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border border-teal-200/80 bg-white/80 px-2 py-2",
              state === "expanded" ? "flex-row" : "flex-col gap-1"
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 shadow-sm">
              <Crown className="h-5 w-5 text-white" />
            </div>
            {state === "expanded" && (
              <div className="min-w-0 text-left">
                <p className="text-sm font-bold text-teal-900 leading-tight">EV Member</p>
                <p className="text-[10px] text-teal-700/80 leading-tight">ลูกค้าปิดการขายสำเร็จ</p>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/backoffice")}
            className="w-full gap-2 border-teal-200 text-gray-700 shadow-sm transition-all hover:border-teal-400 hover:bg-teal-50 hover:text-teal-800"
          >
            <ArrowLeft className="h-4 w-4" />
            {state === "expanded" && <span className="text-sm font-medium">Control Center</span>}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarMenu className="space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              onClick={() => navigate("/ev-member")}
              className={cn(
                "w-full justify-start gap-2 rounded-xl py-2.5 text-sm transition-all duration-200",
                isActive("/ev-member")
                  ? "bg-gradient-to-r from-teal-100 to-cyan-100 font-semibold text-teal-800 shadow-sm"
                  : "text-gray-600 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 hover:text-teal-800"
              )}
              isActive={isActive("/ev-member")}
            >
              <LayoutGrid className="h-4 w-4 shrink-0" />
              {state === "expanded" && <span>สรุปสมาชิก / รายการ</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>

          {permissions.canViewReports && (
            <SidebarMenuItem>
              <SidebarMenuButton
                type="button"
                onClick={() => navigate("/reports/sales-closed")}
                className={cn(
                  "w-full justify-start gap-2 rounded-xl py-2.5 text-sm transition-all duration-200",
                  isActive("/reports/sales-closed")
                    ? "bg-gradient-to-r from-teal-100 to-cyan-100 font-semibold text-teal-800 shadow-sm"
                    : "text-gray-600 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 hover:text-teal-800"
                )}
                isActive={isActive("/reports/sales-closed")}
              >
                <FileText className="h-4 w-4 shrink-0" />
                {state === "expanded" && <span>รายงานปิดการขาย</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
