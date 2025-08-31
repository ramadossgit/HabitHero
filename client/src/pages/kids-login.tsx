import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Star, Gamepad2 } from "lucide-react";

export default function KidsLogin() {
  const [, setLocation] = useLocation();
  const [familyCode, setFamilyCode] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { familyCode: string; username: string; pin: string }) => {
      return await apiRequest("POST", "/api/auth/child-login", credentials);
    },
    onSuccess: () => {
      // Removed welcome back message to reduce popup notifications
      // Invalidate auth queries to refresh authentication state
      queryClient.invalidateQueries({ queryKey: ["/api/auth/child"] });
      setTimeout(() => {
        setLocation("/kids");
      }, 100);
    },
    onError: (error: any) => {
      // Handle different types of login errors
      if (error.emergencyMode) {
        toast({
          title: "🚨 Emergency Mode Active",
          description: "Your parent has temporarily restricted access to the app. Please contact your parent for assistance.",
          variant: "destructive",
          duration: 6000,
        });
      } else if (error.featureDisabled) {
        toast({
          title: "🔒 Feature Disabled",
          description: "Access to daily habits has been disabled by your parent. Please contact your parent for assistance.",
          variant: "destructive",
          duration: 6000,
        });
      } else {
        toast({
          title: "Login Failed",
          description: error.message || "Invalid username or PIN",
          variant: "destructive",
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyCode.trim() || !username.trim() || !pin.trim()) {
      toast({
        title: "Missing Information", 
        description: "Please enter family code, username and PIN",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ 
      familyCode: familyCode.trim().toUpperCase(), 
      username: username.trim(), 
      pin: pin.trim() 
    });
  };

  return (
    <div className="min-h-screen hero-gradient safe-area-top">
      {/* Header - Kid-friendly design */}
      <header className="text-white p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <Button
              className="kid-button bg-white text-gray-800 hover:bg-gray-100 touch-target"
              onClick={() => setLocation("/")}
              data-testid="back-button"
            >
              <ArrowLeft className="w-6 h-6 mr-2" />
              <span className="readable-text">Back Home</span>
            </Button>
            <div className="flex items-center space-x-3">
              <Star className="w-10 h-10 text-joy-yellow float" />
              <h1 className="font-fredoka text-2xl sm:text-4xl readable-text-large text-white">
                Habit Heroes
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Improved layout */}
      <main className="max-w-lg mx-auto p-4 sm:p-6 pb-20">
        <div className="bounce-in">
          <div className="kid-card p-6 sm:p-8">
            {/* Hero Icon and Title */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-hero-blue to-success-green rounded-full flex items-center justify-center magic-glow">
                <Gamepad2 className="w-12 h-12 text-white" />
              </div>
              <h2 className="font-fredoka text-3xl sm:text-4xl readable-text-large text-gray-800 mb-3">
                🦸 Hero Login
              </h2>
              <p className="readable-text text-gray-700 mb-4">
                Enter your hero credentials to start your epic adventure!
              </p>
              
              {/* Help Instructions - More visible */}
              <div className="kid-card bg-gradient-to-r from-blue-50 to-green-50 border-hero-blue p-4">
                <p className="readable-text font-bold text-hero-blue mb-2">🆘 Need Help?</p>
                <div className="readable-text text-gray-700 space-y-1">
                  <div>📱 Ask your parent for the family code</div>
                  <div>👤 Use your hero username and secret PIN</div>
                  <div>🔢 Family codes are 6 letters/numbers</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Family Code Input */}
              <div>
                <label className="block readable-text-large text-gray-800 mb-3">
                  🏠 Family Code
                </label>
                <Input
                  type="text"
                  placeholder="FAM123"
                  value={familyCode}
                  onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="w-full text-center text-xl sm:text-2xl py-4 px-6 border-4 border-energy-orange font-bold rounded-2xl uppercase bg-white focus:border-hero-blue transition-colors kid-button"
                  data-testid="input-family-code"
                />
              </div>

              {/* Username Input */}
              <div>
                <label className="block readable-text-large text-gray-800 mb-3">
                  🦸 Hero Username
                </label>
                <Input
                  type="text"
                  placeholder="superhero123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-center text-xl sm:text-2xl py-4 px-6 border-4 border-hero-blue font-bold rounded-2xl bg-white focus:border-success-green transition-colors kid-button"
                  data-testid="input-username"
                />
              </div>

              {/* PIN Input */}
              <div>
                <label className="block readable-text-large text-gray-800 mb-3">
                  🔐 Secret PIN
                </label>
                <Input
                  type="password"
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={4}
                  className="w-full text-center text-3xl py-4 px-6 border-4 border-success-green font-bold rounded-2xl tracking-widest bg-white focus:border-joy-yellow transition-colors kid-button"
                  data-testid="input-pin"
                />
              </div>

              {/* Login Button - Extra large and colorful */}
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full kid-button bg-gradient-to-r from-hero-blue to-success-green hover:from-success-green hover:to-hero-blue text-white font-bold text-xl py-6 px-8 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200 min-h-16"
                data-testid="login-button"
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="loading-spinner mr-3"></div>
                    <span>Logging in...</span>
                  </div>
                ) : (
                  "🚀 Start My Adventure!"
                )}
              </Button>
            </form>

            {/* Help Message */}
            <div className="mt-8 text-center kid-card bg-gradient-to-r from-joy-yellow/20 to-energy-orange/20 border-joy-yellow">
              <p className="readable-text text-gray-700">
                <strong>Don't have an account?</strong>
                <br />
                Ask your parent to create your hero profile in their dashboard!
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Safe bottom padding */}
      <div className="safe-area-bottom"></div>
    </div>
  );
}