import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useChildAuth } from "@/hooks/useChildAuth";
import { SyncProvider } from "@/hooks/use-sync";
import { useEffect } from "react";
import { useLocation } from "wouter";
import Landing from "@/pages/landing";
import ParentAuthPage from "@/pages/parent-auth-page";
import SubscriptionPage from "@/pages/subscription";
import PremiumEnrollment from "@/pages/premium-enrollment";
import PremiumCheckout from "@/pages/premium-checkout";
import PremiumSuccess from "@/pages/premium-success";
import Home from "@/pages/home";
import ParentDashboard from "@/pages/parent-dashboard";
import ProgressReportsPage from "@/pages/progress-reports";
import AlertSettingsPage from "@/pages/alert-settings-page";
import KidsLogin from "@/pages/kids-login";
import NotFound from "@/pages/not-found";

function AuthGuard({ 
  children, 
  requireAuth = false, 
  requireChild = false 
}: { 
  children: React.ReactNode;
  requireAuth?: boolean;
  requireChild?: boolean;
}) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { child: childUser, isLoading: childLoading } = useChildAuth();
  const [, setLocation] = useLocation();

  const isLoading = authLoading || (requireChild && childLoading);

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        setLocation('/parent/auth');
      } else if (requireChild && !childUser) {
        setLocation('/kids-login');
      }
    }
  }, [isLoading, isAuthenticated, childUser, requireAuth, requireChild, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 magic-gradient rounded-full mx-auto mb-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          </div>
          <p className="text-white text-xl font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if auth requirements not met (redirect handled by useEffect)
  if ((requireAuth && !isAuthenticated) || (requireChild && !childUser)) {
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Landing} />
      <Route path="/kids-login" component={KidsLogin} />
      <Route path="/parent/auth" component={ParentAuthPage} />

      {/* Kids Routes - Require child authentication */}
      <Route path="/kids">
        <AuthGuard requireChild={true}>
          <Home />
        </AuthGuard>
      </Route>

      {/* Parent Routes - Require parent authentication */}
      <Route path="/parent">
        <AuthGuard requireAuth={true}>
          <ParentDashboard />
        </AuthGuard>
      </Route>

      {/* Legacy route redirect */}
      <Route path="/parent-dashboard">
        <AuthGuard requireAuth={true}>
          <ParentDashboard />
        </AuthGuard>
      </Route>

      <Route path="/subscription">
        <AuthGuard requireAuth={true}>
          <SubscriptionPage />
        </AuthGuard>
      </Route>

      <Route path="/premium-enrollment">
        <AuthGuard requireAuth={true}>
          <PremiumEnrollment />
        </AuthGuard>
      </Route>

      <Route path="/premium-checkout">
        <AuthGuard requireAuth={true}>
          <PremiumCheckout />
        </AuthGuard>
      </Route>

      <Route path="/premium-success">
        <AuthGuard requireAuth={true}>
          <PremiumSuccess />
        </AuthGuard>
      </Route>

      <Route path="/progress-reports">
        <AuthGuard requireAuth={true}>
          <ProgressReportsPage />
        </AuthGuard>
      </Route>

      <Route path="/alert-settings">
        <AuthGuard requireAuth={true}>
          <AlertSettingsPage />
        </AuthGuard>
      </Route>

      <Route path="/alert-settings/:habitId">
        {(params) => (
          <AuthGuard requireAuth={true}>
            <AlertSettingsPage habitId={params.habitId} />
          </AuthGuard>
        )}
      </Route>

      {/* Catch-all route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SyncProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </SyncProvider>
    </QueryClientProvider>
  );
}

export default App;