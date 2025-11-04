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
          {/* Barra superior fixa com blur e sombra */}
          <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm pt-6">
            <div className="flex items-center justify-between px-6 pb-4">
              <SidebarTrigger />
              <div className="flex-1" />
            </div>
            <Separator className="w-full" />
          </div>
          <div className="pb-8">
            <div className="px-6 max-w-7xl mx-auto pt-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
