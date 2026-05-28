import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogout } from "@workspace/api-client-react";
import { LayoutDashboard, FileText, ListChecks, LogOut, CheckCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        logout();
        setLocation("/login");
      },
    });
  };

  const navItems: { label: string; href: string; icon: any }[] = [];

  if (user?.role === "admin") {
    navItems.push({ label: "Admin Portal", href: "/admin", icon: ShieldCheck });
    navItems.push({ label: "Projects", href: "/projects", icon: FileText });
  } else {
    navItems.push({ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard });
    navItems.push({ label: "Projects", href: "/projects", icon: FileText });
    if (user?.role === "faculty") {
      navItems.push({ label: "Evaluations", href: "/evaluations", icon: ListChecks });
    }
  }

  const roleBadge =
    user?.role === "admin" ? "Admin" : user?.role === "faculty" ? "Faculty" : "Student";

  const roleColor =
    user?.role === "admin"
      ? "bg-amber-500/20 text-amber-200 border-amber-500/30"
      : "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-accent-border";

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <aside className="w-64 border-r bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2 font-bold text-lg text-white">
            <CheckCircle className="h-6 w-6 text-sidebar-primary" />
            <span>SCEM Portal</span>
          </div>
          <div className="mt-1 text-xs text-sidebar-foreground/70 opacity-80 uppercase tracking-wider font-semibold">
            Project Evaluation System
          </div>
        </div>
        
        <div className="p-4 flex-1">
          <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-4 px-2">Menu</div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location === item.href || location.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <div className="px-2 mb-4">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/70 truncate">{user?.email}</p>
            <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${roleColor}`}>
              {roleBadge}
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto bg-gray-50/50">
          {children}
        </div>
      </main>
    </div>
  );
}
