import { NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Building2,
  Database,
  LayoutDashboard,
  Settings,
  Sun,
} from "lucide-react";
import UserProfileDropdown from "@/components/UserProfileDropdown";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

const links = [
  { to: "/solar-monitoring/overview", label: "ภาพรวม", icon: LayoutDashboard },
  { to: "/solar-monitoring/plants", label: "โรงไฟฟ้า", icon: Building2 },
  { to: "/solar-monitoring/alarms", label: "การแจ้งเตือน", icon: AlertTriangle },
  { to: "/solar-monitoring/data-health", label: "คุณภาพข้อมูล", icon: Database },
];

export function SolarMonitoringLayout({ children }: { children: React.ReactNode }) {
  const permissions = usePermissions();
  const location = useLocation();
  const isOverview = location.pathname === "/solar-monitoring"
    || location.pathname === "/solar-monitoring/"
    || location.pathname === "/solar-monitoring/overview";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-amber-400/15 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1700px] items-center gap-4 px-4 py-3 sm:px-6">
          <NavLink to="/backoffice" className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg shadow-amber-500/20">
              <Sun className="h-6 w-6 text-white" />
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate font-semibold">Solar Monitoring</span>
              <span className="block text-xs text-slate-400">Huawei SmartPVMS Analytics</span>
            </span>
          </NavLink>
          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                  isActive ? "bg-amber-400/15 text-amber-300" : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            ))}
            {permissions.userRole === "super_admin" && (
              <NavLink
                to="/solar-monitoring/settings"
                className={({ isActive }) => cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                  isActive ? "bg-amber-400/15 text-amber-300" : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <Settings className="h-4 w-4" /> ตั้งค่า
              </NavLink>
            )}
          </nav>
          <div className="ml-auto lg:ml-3"><UserProfileDropdown /></div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 lg:hidden">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => cn(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm",
              isActive ? "bg-amber-400/15 text-amber-300" : "text-slate-400",
            )}>{link.label}</NavLink>
          ))}
        </nav>
      </header>
      <main className={cn(
        "relative mx-auto w-full",
        isOverview
          ? "max-w-none px-0 py-0"
          : "max-w-[1700px] px-4 py-6 sm:px-6 lg:py-8",
      )}>
        <div className="pointer-events-none fixed inset-0 -z-0 opacity-40" aria-hidden>
          <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
        </div>
        <div className="relative z-10">{children}</div>
      </main>
    </div>
  );
}

export function SolarPageHeader({
  title,
  description,
  freshness,
}: {
  title: string;
  description: string;
  freshness?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
      {freshness && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Activity className="h-4 w-4 text-emerald-400" /> อัปเดตล่าสุด {freshness}
        </div>
      )}
    </div>
  );
}
