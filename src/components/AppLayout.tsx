import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { UnifiedHeader } from "./UnifiedHeader";
import { AppointmentToastNotifier } from "./notifications/AppointmentToastNotifier";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-x-hidden">
          <UnifiedHeader 
            systemName="EV Power Energy CRM" 
            systemColor="green"
            showNotificationBell={true} // ✅ แสดง bell เฉพาะระบบ CRM
          />

          {/* Enhanced Main Content with background pattern */}
          <main className="flex-1 min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-white to-green-50/30 relative overflow-x-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="relative z-0">
              {children}
            </div>
          </main>
          
          {/* Toast Notification System */}
          <AppointmentToastNotifier />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
