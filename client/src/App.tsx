import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useChildAuth } from "@/hooks/useChildAuth";
import ParentVerification from "@/components/ParentVerification";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Home from "@/pages/home";
import ParentDashboard from "@/pages/parent-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { childUser } = useChildAuth();
  const [location, setLocation] = useLocation();
  const [showParentVerification, setShowParentVerification] = useState(false);
  const [isParentVerified, setIsParentVerified] = useState(false);

  if (isLoading) {
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

  // Handle parent verification for accessing parent dashboard from kids view
  const handleParentAccess = () => {
    if (childUser && !isParentVerified) {
      setShowParentVerification(true);
      return;
    }
    setLocation("/parent");
  };

  const handleVerificationSuccess = () => {
    setShowParentVerification(false);
    setIsParentVerified(true);
    setLocation("/parent");
  };

  const handleVerificationCancel = () => {
    setShowParentVerification(false);
    setLocation("/kids");
  };

  return (
    <>
      <Switch>
        {/* Authentication routes */}
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        
        {/* Kids routes - accessible with child login */}
        <Route path="/kids" component={Home} />
        <Route path="/kids/play" component={Home} />
        
        {/* Parent routes - requires parent authentication or verification */}
        <Route path="/parent">
          {isAuthenticated || isParentVerified ? (
            <ParentDashboard />
          ) : (
            <Login />
          )}
        </Route>
        

        
        {/* Main routes */}
        {!isAuthenticated && !childUser ? (
          <Route path="/" component={Landing} />
        ) : (
          <Route path="/" component={childUser ? Home : (isAuthenticated ? ParentDashboard : Home)} />
        )}
        
        <Route component={NotFound} />
      </Switch>

      {/* Parent Verification Modal */}
      {showParentVerification && (
        <ParentVerification
          onVerified={handleVerificationSuccess}
          onCancel={handleVerificationCancel}
        />
      )}
    </>
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
