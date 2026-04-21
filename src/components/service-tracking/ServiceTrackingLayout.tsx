import { Outlet } from "react-router-dom";
import ServiceTrackingSidebar from "./ServiceTrackingSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { UnifiedHeader } from "../UnifiedHeader";

const ServiceTrackingLayout = () => {
  return (
    <SidebarProvider>
      {/* Sidebar */}
      <ServiceTrackingSidebar />
      
      {/* Main Content */}
      <SidebarInset className="flex-1 flex flex-col min-h-0 min-w-0">
        <UnifiedHeader 
          systemName="Service Tracking System" 
          systemColor="orange" 
        />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default ServiceTrackingLayout;

