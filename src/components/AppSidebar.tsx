import { 
  LayoutDashboard,
  Users,
  Package,
  ArrowDownToLine,
  ShoppingCart,
  Sun,
  Moon,
  LogOut,
  Truck
} from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Fornecedores", url: "/fornecedores", icon: Truck },
  { title: "Produtos", url: "/produtos", icon: Package },
  { title: "Entradas", url: "/entradas", icon: ArrowDownToLine },
  { title: "Saídas (PDV)", url: "/saidas", icon: ShoppingCart },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const collapsed = state === "collapsed";

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
            <SidebarHeader className="!pt-6">
        <div className="flex items-center justify-center">
          {!collapsed && (
            <span className="text-lg font-bold text-primary">                                          
              Dicar Tratores
            </span>
          )}
          {collapsed && (
            <img
              src="/favicon.svg"
              alt="Dicar Tratores"
              className="h-7 w-7"
            />
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="p-0">
          <Separator className="my-2" />
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={isActive
                          ? "bg-primary text-black font-medium hover:bg-primary/90 transition-colors duration-200 [&_svg]:text-black"                                                                      
                          : "hover:bg-sidebar-accent/50 transition-colors duration-200"
                        }
                      >
                        <Icon className="h-5 w-5" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleTheme}
              className="hover:bg-sidebar-accent"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {!collapsed && <span>Trocar Tema</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="hover:bg-destructive/10 text-destructive"
            >
              <LogOut className="h-5 w-5" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
