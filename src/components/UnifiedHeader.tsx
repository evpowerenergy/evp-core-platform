import { SidebarTrigger } from "@/components/ui/sidebar";
import UserProfileDropdown from "./UserProfileDropdown";
import { NotificationBell } from "./notifications/NotificationBell";

interface UnifiedHeaderProps {
  systemName: string;
  systemColor?: string;
  showNotificationBell?: boolean; // ✅ เพิ่ม prop สำหรับแสดง bell เฉพาะระบบ CRM
}

export function UnifiedHeader({ 
  systemName, 
  systemColor = "gray",
  showNotificationBell = false // ✅ default เป็น false (ไม่แสดง)
}: UnifiedHeaderProps) {
  const getSystemStyles = () => {
    const colorMap = {
      gray: {
        border: "border-gray-200/60",
        bg: "bg-white/95",
        backdrop: "supports-[backdrop-filter]:bg-white/90",
        trigger: "hover:bg-gray-50",
        text: "text-gray-800"
      },
      blue: {
        border: "border-blue-200/60",
        bg: "bg-white/95",
        backdrop: "supports-[backdrop-filter]:bg-white/90",
        trigger: "hover:bg-blue-50",
        text: "text-blue-800"
      },
      orange: {
        border: "border-orange-200/60",
        bg: "bg-white/95",
        backdrop: "supports-[backdrop-filter]:bg-white/90",
        trigger: "hover:bg-orange-50",
        text: "text-orange-800"
      },
      green: {
        border: "border-green-200/60",
        bg: "bg-white/95",
        backdrop: "supports-[backdrop-filter]:bg-white/90",
        trigger: "hover:bg-green-50",
        text: "text-green-800"
      },
      teal: {
        border: "border-teal-200/60",
        bg: "bg-white/95",
        backdrop: "supports-[backdrop-filter]:bg-white/90",
        trigger: "hover:bg-teal-50",
        text: "text-teal-800"
      },
      purple: {
        border: "border-indigo-800/50",
        bg: "bg-slate-900/95",
        backdrop: "supports-[backdrop-filter]:bg-slate-900/90",
        trigger: "hover:bg-indigo-600/20",
        text: "text-slate-100"
      }
    };
    
    return colorMap[systemColor as keyof typeof colorMap] || colorMap.gray;
  };

  const styles = getSystemStyles();

  return (
    <header className={`sticky top-0 z-50 border-b ${styles.border} ${styles.bg} backdrop-blur-md ${styles.backdrop} shadow-sm`}>
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className={`${styles.trigger} transition-colors duration-200 rounded-lg p-2`} />
          <div className="hidden md:block">
            <h1 className={`text-lg font-semibold ${styles.text}`}>
              {systemName}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* ✅ แสดง bell เฉพาะระบบ CRM ติดตามลูกค้า */}
          {showNotificationBell && <NotificationBell />}
          <UserProfileDropdown />
        </div>
      </div>
    </header>
  );
}

