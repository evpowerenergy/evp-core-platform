import { useNavigate } from "react-router-dom";
import {
  Building2,
  Users2,
  Package2,
  FileText,
  Megaphone,
  Bot,
  LayoutDashboard,
  Zap,
  Crown,
  BatteryCharging,
} from "lucide-react";
import UserProfileDropdown from "@/components/UserProfileDropdown";
import { AppointmentToastNotifier } from "@/components/notifications/AppointmentToastNotifier";
import { usePermissions } from "@/hooks/usePermissions";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

const BackofficePortal = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  const modules = [
    {
      id: "executive-dashboard",
      title: "Executive Dashboard",
      description: "ภาพรวมข้อมูลทั้งหมดจากทุกระบบ",
      icon: LayoutDashboard,
      status: "active",
      route: "/executive-dashboard",
      requiredPermission: () => true,
      color: "indigo",
    },
    {
      id: "ev-member",
      title: "EV Member",
      description: "ลูกค้าปิดการขายสำเร็จ สรุปยอด จำนวนครั้ง และอันดับ",
      icon: Crown,
      status: "active",
      route: "/ev-member",
      requiredPermission: () => permissions.canAccessEvMember,
      color: "teal",
    },
    {
      id: "charging-station",
      title: "สถานีชาร์จ",
      description:
        "Super EV Hub — อัปโหลดไฟล์ CSV แล้วดูรายได้ Utilization Rate และลูกค้า (ประมวลผลบนเครื่องคุณ)",
      icon: BatteryCharging,
      status: "active",
      route: "/charging-station",
      requiredPermission: () => permissions.canAccessEvMember,
      color: "amber",
    },
    {
      id: "crm",
      title: "ระบบ CRM",
      description: "บริหารจัดการลูกค้าสัมพันธ์",
      icon: Users2,
      status: "active",
      route: "/",
      requiredPermission: () => permissions.canAccessCrm,
      color: "cyan",
    },
    {
      id: "inventory",
      title: "ระบบคลังสินค้า",
      description: "จัดการสต็อกและ Purchase Orders",
      icon: Package2,
      status: "active",
      route: "/inventory",
      requiredPermission: () => permissions.canAccessInventory,
      color: "emerald",
    },
    {
      id: "service-tracking",
      title: "ระบบติดตามการขออนุญาต",
      description: "ติดตามการขออนุญาตติดตั้ง",
      icon: FileText,
      status: "active",
      route: "/service-tracking",
      requiredPermission: () => permissions.canAccessServiceTracking,
      color: "orange",
    },
    {
      id: "marketing",
      title: "ระบบ Marketing",
      description: "จัดการการตลาดและแคมเปญ",
      icon: Megaphone,
      status: "active",
      route: "/marketing",
      requiredPermission: () => permissions.canAccessMarketing,
      color: "pink",
    },
    {
      id: "chat-bot-monitor",
      title: "Chat Bot Monitor",
      description: "ติดตามและจัดการ Chatbot",
      icon: Bot,
      status: "active",
      route: "/chat-bot-monitor/performance",
      requiredPermission: () => permissions.canAccessChatBotMonitor,
      color: "purple",
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<
      string,
      {
        border: string;
        bg: string;
        iconBg: string;
        text: string;
        glow: string;
        ringHover: string;
      }
    > = {
      indigo: {
        border: "border-indigo-400/50",
        bg: "bg-indigo-500/10",
        iconBg: "bg-gradient-to-br from-indigo-500 to-purple-600",
        text: "text-indigo-300",
        glow: "shadow-indigo-500/40",
        ringHover: "group-hover:ring-indigo-400/40",
      },
      cyan: {
        border: "border-cyan-400/50",
        bg: "bg-cyan-500/10",
        iconBg: "bg-gradient-to-br from-cyan-500 to-blue-600",
        text: "text-cyan-300",
        glow: "shadow-cyan-500/40",
        ringHover: "group-hover:ring-cyan-400/40",
      },
      emerald: {
        border: "border-emerald-400/50",
        bg: "bg-emerald-500/10",
        iconBg: "bg-gradient-to-br from-emerald-500 to-green-600",
        text: "text-emerald-300",
        glow: "shadow-emerald-500/40",
        ringHover: "group-hover:ring-emerald-400/40",
      },
      orange: {
        border: "border-orange-400/50",
        bg: "bg-orange-500/10",
        iconBg: "bg-gradient-to-br from-orange-500 to-amber-600",
        text: "text-orange-300",
        glow: "shadow-orange-500/40",
        ringHover: "group-hover:ring-orange-400/40",
      },
      pink: {
        border: "border-pink-400/50",
        bg: "bg-pink-500/10",
        iconBg: "bg-gradient-to-br from-pink-500 to-rose-600",
        text: "text-pink-300",
        glow: "shadow-pink-500/40",
        ringHover: "group-hover:ring-pink-400/40",
      },
      purple: {
        border: "border-purple-400/50",
        bg: "bg-purple-500/10",
        iconBg: "bg-gradient-to-br from-purple-500 to-indigo-600",
        text: "text-purple-300",
        glow: "shadow-purple-500/40",
        ringHover: "group-hover:ring-purple-400/40",
      },
      teal: {
        border: "border-teal-400/50",
        bg: "bg-teal-500/10",
        iconBg: "bg-gradient-to-br from-teal-500 to-cyan-600",
        text: "text-teal-300",
        glow: "shadow-teal-500/40",
        ringHover: "group-hover:ring-teal-400/40",
      },
      amber: {
        border: "border-amber-400/50",
        bg: "bg-amber-500/10",
        iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
        text: "text-amber-300",
        glow: "shadow-amber-500/40",
        ringHover: "group-hover:ring-amber-400/40",
      },
    };
    return colorMap[color] || colorMap.cyan;
  };

  const accessibleCount = modules.filter((m) => m.requiredPermission()).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 relative overflow-x-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[min(90vw,56rem)] h-64 bg-indigo-500/5 rounded-full blur-3xl"
          style={{ animationDelay: "0.5s" }}
        />
      </div>

      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative border-b border-cyan-400/20 bg-slate-900/50 backdrop-blur-xl z-50">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 tracking-tight truncate">
                EV Power Energy
              </h1>
              <p className="text-slate-400 mt-0.5 sm:mt-1 text-xs sm:text-sm">Control Center</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/30 backdrop-blur-sm">
                  <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 border-l border-cyan-400/20 pl-2 sm:pl-6">
                <UserProfileDropdown />
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="relative z-10 container mx-auto px-4 sm:px-6 py-8 pb-28 max-w-7xl">
        <section
          className="mb-8 md:mb-10 rounded-2xl border border-orange-400/25 bg-slate-900/40 backdrop-blur-xl p-5 sm:p-6 md:p-8 overflow-hidden relative shadow-xl shadow-orange-500/10"
          aria-label="Control Center"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
            <div className="relative shrink-0 mx-auto sm:mx-0">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 border-2 border-orange-400/50 shadow-2xl shadow-orange-500/40 flex flex-col items-center justify-center">
                <Zap className="h-10 w-10 sm:h-11 sm:w-11 text-white drop-shadow-md" />
              </div>
            </div>
            <div className="text-center sm:text-left flex-1 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Control Center
              </h2>
              <p className="text-orange-100/90 mt-1 text-sm sm:text-base">
                EV Power Energy — เลือกระบบจากการ์ดด้านล่างเพื่อเข้าใช้งาน
              </p>
              <p className="text-slate-500 text-xs sm:text-sm mt-3">
                พร้อมใช้งาน {accessibleCount} จาก {modules.length} ระบบ (ตามสิทธิ์บัญชี)
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {modules.map((module) => {
            const colors = getColorClasses(module.color);
            const hasPermission = module.requiredPermission();
            const Icon = module.icon;
            const isDisabled = module.status !== "active" || !hasPermission;

            return (
              <article
                key={module.id}
                role="button"
                tabIndex={isDisabled ? -1 : 0}
                onClick={() => !isDisabled && navigate(module.route)}
                onKeyDown={(e) => {
                  if (!isDisabled && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    navigate(module.route);
                  }
                }}
                className={cn(
                  "group relative rounded-2xl border p-5 md:p-6 text-left",
                  "bg-slate-900/45 backdrop-blur-xl transition-all duration-300",
                  "ring-1 ring-white/5",
                  colors.border,
                  isDisabled
                    ? "opacity-55 cursor-not-allowed grayscale-[0.35]"
                    : [
                        "cursor-pointer",
                        "hover:-translate-y-1 hover:shadow-2xl",
                        colors.glow,
                        colors.ringHover,
                        "hover:ring-2",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50",
                      ]
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
                    colors.bg,
                    !isDisabled && "group-hover:opacity-100"
                  )}
                />

                <div className="relative flex flex-col gap-3 min-h-[8.5rem]">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={cn(
                        colors.iconBg,
                        "p-3 rounded-xl shadow-lg transition-transform duration-300",
                        !isDisabled && "group-hover:scale-105"
                      )}
                    >
                      <Icon className="h-7 w-7 text-white" aria-hidden />
                    </div>
                    {!hasPermission && (
                      <span
                        className="shrink-0 rounded-full bg-red-500/85 px-2 py-0.5 text-[10px] font-medium text-white"
                        title="ไม่มีสิทธิ์เข้าใช้"
                      >
                        ล็อก
                      </span>
                    )}
                  </div>

                  <div>
                    <h3
                      className={cn(
                        "font-bold text-base md:text-lg leading-snug",
                        hasPermission ? colors.text : "text-slate-500"
                      )}
                    >
                      {module.title}
                    </h3>
                    <p className="text-slate-400 text-xs md:text-sm mt-1.5 line-clamp-3 leading-relaxed">
                      {module.description}
                    </p>
                  </div>

                  {!isDisabled && hasPermission && (
                    <span className="text-cyan-400/90 text-xs font-medium mt-auto pt-1 inline-flex items-center gap-1">
                      เข้าสู่ระบบ
                      <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                        →
                      </span>
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </main>

      <div className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 pointer-events-none">
        <p className="text-slate-500 text-[10px] sm:text-xs text-center bg-slate-950/60 backdrop-blur-md rounded-full px-3 py-1 border border-slate-700/50 pointer-events-auto">
          <span className="hidden sm:inline">เลือก</span>ระบบที่ต้องการใช้งาน • {accessibleCount}{" "}
          ระบบพร้อมใช้งาน
        </p>
      </div>

      <AppointmentToastNotifier />
    </div>
  );
};

export default BackofficePortal;
