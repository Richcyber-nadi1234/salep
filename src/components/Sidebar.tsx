import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Laptop, 
  DollarSign, 
  BarChart3, 
  UserCircle,
  LogOut,
  Building2,
  Shield,
  TrendingUp,
  Target,
  Megaphone,
  X
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
  const [isOpen, setIsOpen] = useState(true);

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
      name: "Performance",
      href: "/performance",
      icon: TrendingUp,
      show: true,
    },
    {
      name: "Goals",
      href: "/goals",
      icon: Target,
      show: true,
    },
    {
      name: "Announcements",
      href: "/announcements",
      icon: Megaphone,
      show: true,
    },
    {
      name: "Admin Panel",
      href: "/admin",
      icon: Shield,
      show: hasAnyRole(['ceo', 'hr']),
    },
    {
      name: "My Profile",
      href: "/profile",
      icon: UserCircle,
      show: true,
    },
  ];

  const handleNavClick = () => {
    // Auto-close sidebar on mobile/tablet
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className={cn(
        "fixed lg:relative h-screen w-64 flex-col glass-card border-r z-50 transition-transform duration-300 ease-in-out animate-slide-in-left",
        isOpen ? "flex translate-x-0" : "flex -translate-x-full lg:translate-x-0"
      )}>
        <div className="flex h-16 items-center justify-between border-b px-6 backdrop-blur-xl">
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent animate-scale-in">
            OrgManage
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.filter(item => item.show).map((item, index) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  "hover:scale-[1.02] hover:shadow-md active:scale-[0.98]",
                  isActive
                    ? "bg-gradient-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground backdrop-blur-sm"
                )}
                style={{
                  animation: `fly-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s forwards`,
                  opacity: 0,
                }}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4 backdrop-blur-xl bg-card/50">
          <div className="text-xs text-muted-foreground mb-3 px-1">
            <span className="font-medium">Roles:</span> {roles.join(', ') || 'user'}
          </div>
          <Button
            variant="outline"
            className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] glass-effect"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Toggle button for mobile */}
      {!isOpen && (
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-40 lg:hidden glass-effect shadow-elevated animate-scale-in"
          onClick={() => setIsOpen(true)}
        >
          <LayoutDashboard className="h-5 w-5" />
        </Button>
      )}
    </>
  );
};
