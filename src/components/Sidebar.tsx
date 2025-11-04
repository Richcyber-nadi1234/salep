import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  LayoutDashboard, 
  Users, 
  Laptop, 
  DollarSign, 
  BarChart3, 
  UserCircle,
  LogOut,
  Building2
} from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const Sidebar = () => {
  const location = useLocation();
  const { roles, hasRole, hasAnyRole } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out successfully" });
    navigate("/auth");
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: "CEO Overview",
      href: "/ceo",
      icon: Building2,
      show: hasRole('ceo'),
    },
    {
      name: "HR Management",
      href: "/hr",
      icon: Users,
      show: hasAnyRole(['hr', 'ceo']),
    },
    {
      name: "IT Assets",
      href: "/it",
      icon: Laptop,
      show: hasAnyRole(['it', 'ceo']),
    },
    {
      name: "Finance",
      href: "/finance",
      icon: DollarSign,
      show: hasAnyRole(['finance', 'ceo']),
    },
    {
      name: "Manager",
      href: "/manager",
      icon: BarChart3,
      show: hasAnyRole(['manager', 'ceo']),
    },
    {
      name: "My Profile",
      href: "/profile",
      icon: UserCircle,
      show: true,
    },
  ];

  return (
    <div className="flex h-screen w-64 flex-col bg-card border-r">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          OrgManage
        </h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.filter(item => item.show).map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground mb-2">
          Roles: {roles.join(', ') || 'user'}
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};
