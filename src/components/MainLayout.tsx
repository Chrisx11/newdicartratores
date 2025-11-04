import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

export const MainLayout = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 relative">
          <SidebarTrigger className="absolute top-6 left-6 z-10" />
          <div className="pt-[68px] pb-8">
            <Separator className="mb-6 w-full" />
            <div className="px-6 max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
