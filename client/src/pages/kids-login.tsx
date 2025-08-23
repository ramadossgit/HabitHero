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
    <div className="min-h-screen hero-gradient">
      {/* Header */}
      <header className="text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <Button
              className="super-button"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <Star className="w-8 h-8 text-sunshine" />
              <h1 className="font-fredoka text-3xl">Habit Heroes</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-6">
        <div className="bounce-in">
          <Card className="fun-card p-8 border-4 border-coral">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-6 magic-gradient rounded-full flex items-center justify-center">
                <Gamepad2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="font-fredoka text-3xl text-gray-800 mb-2">Hero Login</h2>
              <p className="text-gray-600">Enter your hero credentials to start your adventure!</p>
              
              {/* Family Code Instructions */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                <p className="text-blue-800 font-bold text-sm mb-1">Need Help?</p>
                <div className="text-blue-700 text-xs space-y-1">
                  <div>• Ask your parent for the family code</div>
                  <div>• Use your hero username and PIN</div>
                  <div>• Family codes are 6 letters/numbers</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-bold mb-2">Family Code</label>
                <Input
                  type="text"
                  placeholder="Enter family code (e.g., FAM123)"
                  value={familyCode}
                  onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="w-full text-center text-lg py-3 border-2 border-coral font-bold rounded-xl uppercase"
                  data-testid="input-family-code"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">Hero Username</label>
                <Input
                  type="text"
                  placeholder="Enter your username (e.g., loshini)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-center text-lg py-3 border-2 border-sky font-bold rounded-xl"
                  data-testid="input-username"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">Secret PIN</label>
                <Input
                  type="password"
                  placeholder="Enter your 4-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={4}
                  className="w-full text-center text-2xl py-3 border-2 border-turquoise font-bold rounded-xl tracking-widest"
                  data-testid="input-pin"
                />
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full super-button py-4 text-lg"
              >
                {loginMutation.isPending ? "Logging in..." : "Start Adventure! 🚀"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Don't have credentials? Ask your parent to create your hero account!
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}