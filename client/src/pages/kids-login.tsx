import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Star, Gamepad2, Eye, EyeOff } from "lucide-react";

export default function KidsLogin() {
  const [, setLocation] = useLocation();
  const [familyCode, setFamilyCode] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { familyCode: string; username: string; pin: string }) => {
      return await apiRequest("POST", "/api/auth/child-login", credentials);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/child"] });
      setTimeout(() => {
        setLocation("/kids");
      }, 100);
    },
    onError: (error: any) => {
      // Handle different types of login errors with light gray background
      if (error.emergencyMode) {
        toast({
          title: "🚨 Emergency Mode Active",
          description: "Your parent has temporarily restricted access to the app. Please contact your parent for assistance.",
          // Light gray background with red text/icons for emergency
          className: "bg-gray-100 border-gray-300 text-red-700",
          duration: 6000,
        });
      } else if (error.featureDisabled) {
        toast({
          title: "🔒 Feature Disabled",
          description: "Access to daily habits has been disabled by your parent. Please contact your parent for assistance.",
          // Light gray background with orange text/icons
          className: "bg-gray-100 border-gray-300 text-orange-700",
          duration: 6000,
        });
      } else {
        // Generic login error - light gray background
        toast({
          title: "Login Failed",
          description: error.message || "Invalid family code, username, or PIN",
          className: "bg-gray-100 border-gray-300 text-gray-800",
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
        className: "bg-gray-100 border-gray-300 text-gray-800",
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
    <div className="min-h-screen hero-gradient flex flex-col safe-area-top">
      {/* ✅ HEADER - Full width */}
      <header className="text-white w-full p-4">
        <div className="flex items-center justify-between px-4 sm:px-6">
          <Button
            variant="default"
            size="sm"
            className="bg-white text-gray-800 hover:bg-gray-100 shadow-md"
            onClick={() => setLocation("/")}
            aria-label="Go to home"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Home
          </Button>
          <div className="flex items-center space-x-2">
            <Star className="w-8 h-8 text-joy-yellow sm:w-10 sm:h-10" />
            <h1 className="font-fredoka text-xl sm:text-2xl md:text-3xl text-white whitespace-nowrap">
              Habit Heroes
            </h1>
          </div>
        </div>
      </header>

      {/* ✅ MAIN CONTENT - FULL WIDTH EDGE TO EDGE */}
      <main className="flex-1 flex items-center justify-center w-full p-4 sm:p-6 md:p-8 pb-20">
        <div className="w-full">
          <div className="kid-card p-5 sm:p-6 md:p-8 rounded-2xl">
            {/* Hero Icon and Title */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-hero-blue to-success-green rounded-full flex items-center justify-center">
                <Gamepad2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <h2 className="font-fredoka text-2xl sm:text-3xl md:text-4xl text-gray-800 mb-2 sm:mb-3">
                🦸 Hero Login
              </h2>
              <p className="text-gray-700 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 px-2">
                Enter your hero credentials to start your epic adventure!
              </p>

              {/* Help Instructions */}
              <div className="kid-card bg-gradient-to-r from-blue-50 to-green-50 border border-hero-blue p-3 sm:p-4 rounded-xl mx-2 sm:mx-4">
                <p className="font-bold text-hero-blue text-sm sm:text-base mb-1 sm:mb-2">🆘 Need Help?</p>
                <div className="text-gray-700 text-xs sm:text-sm space-y-0.5 sm:space-y-1">
                  <div>📱 Ask your parent for the family code</div>
                  <div>👤 Use your hero username and secret PIN</div>
                  <div>🔢 Family codes are 6 letters/numbers</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 px-2 sm:px-4">
              {/* Family Code Input */}
              <div>
                <label className="block text-gray-800 mb-2 text-sm sm:text-base font-medium px-1">
                  🏠 Family Code <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={familyCode}
                  onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="w-full text-left text-sm text-black py-3.5 sm:py-4 px-4 sm:px-6 border-2 sm:border-3 border-energy-orange font-normal rounded-lg sm:rounded-xl uppercase bg-white focus:border-hero-blue focus:ring-0"
                />
              </div>

              {/* Username Input */}
              <div>
                <label className="block text-gray-800 mb-2 text-sm sm:text-base font-medium px-1">
                  🦸 Hero Username <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-left text-sm text-black py-3.5 sm:py-4 px-4 sm:px-6 border-2 sm:border-3 border-hero-blue font-normal rounded-lg sm:rounded-xl bg-white focus:border-success-green focus:ring-0"
                />
              </div>

              {/* PIN Input with Eye Toggle */}
              <div className="relative">
                <label className="block text-gray-800 mb-2 text-sm sm:text-base font-medium px-1">
                  🔐 Secret PIN <span className="text-red-500">*</span>
                </label>
                <Input
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={4}
                  className="w-full text-left text-sm text-black py-3.5 sm:py-4 px-4 sm:px-10 border-2 sm:border-3 border-success-green font-normal rounded-lg sm:rounded-xl bg-white focus:border-joy-yellow focus:ring-0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-3 top-8 sm:top-9 h-6 w-6 p-0 hover:bg-transparent"
                  onClick={() => setShowPin(!showPin)}
                  aria-label={showPin ? "Hide PIN" : "Show PIN"}
                >
                  {showPin ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                </Button>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-gradient-to-r from-hero-blue to-success-green hover:from-success-green hover:to-hero-blue text-white font-bold text-lg sm:text-xl py-4 sm:py-5 rounded-lg sm:rounded-xl shadow-md mx-2 sm:mx-0"
              >
                {loginMutation.isPending ? "Logging in..." : "🚀 Start My Adventure!"}
              </Button>
            </form>

            {/* Help Message */}
            <div className="mt-6 sm:mt-8 text-center kid-card bg-gradient-to-r from-joy-yellow/20 to-energy-orange/20 border border-joy-yellow p-3 sm:p-4 rounded-xl mx-2 sm:mx-4">
              <p className="text-gray-700 text-xs sm:text-sm">
                <strong>Don't have an account?</strong>
                <br />
                Ask your parent to create your hero profile in their dashboard!
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Safe bottom padding */}
      <div className="safe-area-bottom h-4"></div>
    </div>
  );
}