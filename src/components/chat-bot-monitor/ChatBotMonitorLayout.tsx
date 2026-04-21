import React from "react";
import { Outlet } from "react-router-dom";
import ChatBotMonitorSidebar from "./ChatBotMonitorSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { UnifiedHeader } from "../UnifiedHeader";

const ChatBotMonitorLayout = () => {
  // Add dark class to document for Tailwind dark mode
  React.useEffect(() => {
    console.log('Adding dark class to document');
    document.documentElement.classList.add('dark');
    console.log('Document classes:', document.documentElement.className);
    return () => {
      console.log('Removing dark class from document');
      document.documentElement.classList.remove('dark');
    };
  }, []);

  return (
    <SidebarProvider>
      {/* Sidebar */}
      <ChatBotMonitorSidebar />
      
      {/* Main Content */}
      <SidebarInset className="flex-1 flex flex-col min-h-0 min-w-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
        <UnifiedHeader 
          systemName="ระบบ Chat Bot Monitor" 
          systemColor="purple" 
        />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default ChatBotMonitorLayout;

