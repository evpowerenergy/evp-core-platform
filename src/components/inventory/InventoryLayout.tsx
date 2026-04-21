import { ReactNode } from "react";
import { InventorySidebar } from "./InventorySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UnifiedHeader } from "../UnifiedHeader";

interface InventoryLayoutProps {
  children: ReactNode;
}

export function InventoryLayout({ children }: InventoryLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <InventorySidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <UnifiedHeader 
            systemName="ระบบจัดการสินค้า" 
            systemColor="blue" 
          />
          
          {/* Main content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}