import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useChildAuth } from "@/hooks/useChildAuth";
import Landing from "@/pages/landing";
import ParentAuthPage from "@/pages/parent-auth-page";
import Home from "@/pages/home";
import ParentDashboard from "@/pages/parent-dashboard";
import ProgressReportsPage from "@/pages/progress-reports";
import KidsLogin from "@/pages/kids-login";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { child: childUser, isLoading: childLoading } = useChildAuth();
  
  console.log("Router debug:", { childUser, childLoading, isAuthenticated, isLoading });

  if (isLoading || childLoading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 magic-gradient rounded-full mx-auto mb-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          </div>
          <p className="text-white text-xl font-bold">✨ Loading... ✨</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Kids Routes */}
      <Route path="/kids-login" component={KidsLogin} />
      <Route path="/kids">
        {childUser ? <Home /> : <KidsLogin />}
      </Route>
      
      {/* Parent Authentication Route */}
      <Route path="/parent/auth" component={ParentAuthPage} />
      
      {/* Parent Dashboard - Full Management Interface */}
      <Route path="/parent">
        {isAuthenticated ? <ParentDashboard /> : <ParentAuthPage />}
      </Route>
      <Route path="/progress-reports">
        {isAuthenticated ? <ProgressReportsPage /> : <ParentAuthPage />}
      </Route>
      
      {/* Default Route */}
      <Route path="/" component={Landing} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
