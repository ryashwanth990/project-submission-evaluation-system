import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { setupApi } from "@/lib/api-setup";
import { AppLayout } from "@/components/layout/app-layout";

import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import NewProject from "@/pages/projects/new";
import ProjectDetail from "@/pages/projects/[id]";
import Evaluations from "@/pages/evaluations";
import AdminPortal from "@/pages/admin";
import NotFound from "@/pages/not-found";

setupApi();
const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, roles }: { component: any, roles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  const [location, setLocation] = useLocation();

  const defaultRedirect = user?.role === "admin" ? "/admin" : "/dashboard";

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    } else if (roles && user && !roles.includes(user.role)) {
      setLocation(defaultRedirect);
    }
  }, [isAuthenticated, user, roles, setLocation, defaultRedirect]);

  if (!isAuthenticated || (roles && user && !roles.includes(user.role))) {
    return null;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function PublicRoute({ component: Component }: { component: any }) {
  const { isAuthenticated, user } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation(user?.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [isAuthenticated, user, setLocation]);

  if (isAuthenticated) return null;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <PublicRoute component={Login} />} />
      <Route path="/login" component={() => <PublicRoute component={Login} />} />
      <Route path="/register" component={() => <PublicRoute component={Register} />} />
      
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} roles={["student", "faculty"]} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={AdminPortal} roles={["admin"]} />} />
      <Route path="/projects" component={() => <ProtectedRoute component={Projects} />} />
      <Route path="/projects/new" component={() => <ProtectedRoute component={NewProject} roles={["student"]} />} />
      <Route path="/projects/:id" component={() => <ProtectedRoute component={ProjectDetail} />} />
      <Route path="/evaluations" component={() => <ProtectedRoute component={Evaluations} roles={["faculty"]} />} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
