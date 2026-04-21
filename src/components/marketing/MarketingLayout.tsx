import { Outlet } from "react-router-dom";
import MarketingSidebar from "./MarketingSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { UnifiedHeader } from "../UnifiedHeader";

const MarketingLayout = () => {
  return (
    <SidebarProvider>
      {/* Sidebar */}
      <MarketingSidebar />
      
      {/* Main Content */}
      <SidebarInset className="flex-1 flex flex-col min-h-0 min-w-0">
        <UnifiedHeader 
          systemName="ระบบ Marketing" 
          systemColor="pink" 
        />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default MarketingLayout;
