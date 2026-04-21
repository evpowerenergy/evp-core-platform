import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UnifiedHeader } from "@/components/UnifiedHeader";
import { AppointmentToastNotifier } from "@/components/notifications/AppointmentToastNotifier";
import { EvMemberSidebar } from "./EvMemberSidebar";

interface EvMemberLayoutProps {
  children: ReactNode;
}

export function EvMemberLayout({ children }: EvMemberLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden bg-background">
        <EvMemberSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <UnifiedHeader systemName="EV Member" systemColor="teal" showNotificationBell={false} />
          <main className="relative flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-teal-50/25">
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.06]" aria-hidden />
            <div className="relative z-0 p-4 md:p-6">{children}</div>
          </main>
          <AppointmentToastNotifier />
        </div>
      </div>
    </SidebarProvider>
  );
}
