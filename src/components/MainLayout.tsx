import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";

export const MainLayout = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 relative">
          <SidebarTrigger className="absolute top-6 left-6 z-10" />
          <div className="pl-12">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
