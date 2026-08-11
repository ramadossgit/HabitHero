import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useChildAuth } from "@/hooks/useChildAuth";
import { SyncProvider } from "@/hooks/use-sync";
import { Component, useEffect, type ReactNode } from "react";
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
import DevGameTest from "@/pages/dev-game-test";
import DevAvatarStudio from "@/pages/dev-avatar-studio";
import DevAvatar3D from "@/pages/dev-avatar-3d";

// A thrown render error (e.g. after an idle session expires and a component
// hits unexpected data) must never blank the whole app. This catches it and
// shows a friendly recovery screen on the app gradient.
class AppErrorBoundary extends Component<{ children: ReactNode }, { crashed: boolean }> {
  state = { crashed: false };
  static getDerivedStateFromError() {
    return { crashed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("App crashed:", error);
  }
  render() {
    if (this.state.crashed) {
      return (
        <div className="min-h-[100dvh] hero-gradient flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-sm w-full">
            <div className="text-5xl mb-3">😅</div>
            <h1 className="font-fredoka text-2xl text-gray-800 mb-1">Oops, a little hiccup!</h1>
            <p className="text-gray-600 mb-5">Let's get you back on track.</p>
            <button
              onClick={() => { window.location.href = "/"; }}
              className="w-full super-button font-bold py-4 rounded-full"
            >
              Reload Habit Heroes
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Reset scroll to the top whenever the route changes so a new page never
// opens already scrolled down.
function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

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

      {/* Dev-only: isolated mini-game harness (no auth/API) for debugging gameplay */}
      {import.meta.env.DEV && <Route path="/dev/game-test" component={DevGameTest} />}
      {import.meta.env.DEV && <Route path="/dev/avatar-studio" component={DevAvatarStudio} />}
      {import.meta.env.DEV && <Route path="/dev/avatar-3d" component={DevAvatar3D} />}

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
          <AppErrorBoundary>
            <ScrollToTop />
            <Router />
          </AppErrorBoundary>
        </TooltipProvider>
      </SyncProvider>
    </QueryClientProvider>
  );
}

export default App;