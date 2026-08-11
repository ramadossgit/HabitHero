import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { getAvatarImage } from "@/lib/avatars";
import { Eye, EyeOff, UserPlus, LogIn, Home, Sparkles, ChevronDown } from "lucide-react";

// Mobile-first parent access: a single focused card over the app gradient.
// The login/register forms, every field, all mutations and data-testids are
// unchanged; the marketing detail collapses behind a toggle on phones.
export default function ParentAuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get("mode");
  const defaultTab = mode === "login" ? "login" : "register";

  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && shouldRedirect) {
      setLocation("/parent");
      setShouldRedirect(false);
    }
  }, [isAuthenticated, isLoading, shouldRedirect, setLocation]);

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    email: "", password: "", confirmPassword: "", firstName: "", lastName: "", phoneNumber: "",
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Welcome back!", description: `Successfully logged in! Your family code is ${data.familyCode}` });
      setShouldRedirect(true);
    },
    onError: (error: any) => {
      toast({ title: "Login failed", description: error.message || "Invalid email or password", variant: "destructive" });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: typeof registerData) => {
      const res = await apiRequest("POST", "/api/auth/register", {
        email: data.email, password: data.password, firstName: data.firstName,
        lastName: data.lastName, phoneNumber: data.phoneNumber || null,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Account created!", description: "Welcome to Habit Heroes! Let's set up your first child." });
      setShouldRedirect(true);
    },
    onError: (error: any) => {
      toast({ title: "Registration failed", description: error.message || "Failed to create account", variant: "destructive" });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast({ title: "Missing information", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.email || !registerData.password || !registerData.firstName || !registerData.lastName) {
      toast({ title: "Missing information", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure both passwords are the same", variant: "destructive" });
      return;
    }
    if (registerData.password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters long", variant: "destructive" });
      return;
    }
    registerMutation.mutate(registerData);
  };

  const inputCls = "h-12 rounded-2xl border-2 border-gray-200 focus:border-sky text-base";

  return (
    <div className="relative min-h-[100dvh] hero-gradient overflow-hidden">
      <div className="pointer-events-none absolute -top-16 -left-16 w-64 h-64 rounded-full bg-coral/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -right-16 w-72 h-72 rounded-full bg-mint/30 blur-3xl" />

      {/* Home */}
      <button onClick={() => setLocation("/")} aria-label="Go to home" className="absolute top-[calc(var(--safe-top)+0.75rem)] left-4 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/25 flex items-center justify-center text-white">
        <Home className="w-5 h-5" />
      </button>

      <div className="relative z-10 mx-auto w-full max-w-md px-5 pt-[calc(var(--safe-top)+2.5rem)] pb-[calc(var(--safe-bottom)+1.5rem)]">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2.5 mb-3 bounce-in">
          <div className="relative">
            <img src={getAvatarImage("princess")} alt="" className="w-12 h-12 rounded-full border-4 border-white shadow-lg object-cover" />
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-sunshine" />
          </div>
          <div>
            <h1 className="font-fredoka text-2xl text-white leading-none">Habit Heroes</h1>
            <p className="text-white/85 text-xs font-semibold">Parent Access</p>
          </div>
        </div>

        {/* Auth card */}
        <div className="bg-white rounded-3xl shadow-2xl p-5 bounce-in" style={{ animationDelay: "0.1s" }}>
          <Tabs defaultValue={defaultTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-full p-1 h-auto">
              <TabsTrigger value="login" className="flex items-center gap-2 rounded-full py-2 data-[state=active]:bg-white data-[state=active]:text-sky data-[state=active]:shadow-sm font-bold">
                <LogIn className="w-4 h-4" /> Sign In
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center gap-2 rounded-full py-2 data-[state=active]:bg-white data-[state=active]:text-sky data-[state=active]:shadow-sm font-bold">
                <UserPlus className="w-4 h-4" /> Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Login */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="font-bold text-gray-700">Email <span className="text-coral">*</span></Label>
                  <Input id="login-email" type="email" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} placeholder="you@example.com" className={inputCls} data-testid="input-login-email" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-password" className="font-bold text-gray-700">Password <span className="text-coral">*</span></Label>
                  <div className="relative">
                    <Input id="login-password" type={showLoginPassword ? "text" : "password"} value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} placeholder="Enter your password" className={`${inputCls} pr-11`} data-testid="input-login-password" />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowLoginPassword(!showLoginPassword)} data-testid="button-toggle-password">
                      {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full super-button font-bold text-lg py-6 rounded-full" disabled={loginMutation.isPending} data-testid="button-login">
                  {loginMutation.isPending ? "Signing In..." : "Sign In"}
                </Button>

                {/* Latest updates fill the space below the short login form */}
                <div className="pt-1">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-4 h-4 text-sky" />
                    <span className="font-fredoka text-sm text-gray-800">What's New</span>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { emoji: "🎮", text: "Mini-games now play smoothly on every device" },
                      { emoji: "✅", text: "Faster habit & reward approvals from one screen" },
                      { emoji: "👑", text: "Premium voice reminders & auto-approval" },
                    ].map((u) => (
                      <div key={u.text} className="flex items-center gap-2.5 bg-gray-50 rounded-2xl px-3 py-2">
                        <span className="text-lg flex-shrink-0">{u.emoji}</span>
                        <span className="text-xs text-gray-600 font-semibold">{u.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </TabsContent>

            {/* Register */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="register-firstName" className="font-bold text-gray-700">First Name <span className="text-coral">*</span></Label>
                    <Input id="register-firstName" value={registerData.firstName} onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })} placeholder="John" className={inputCls} data-testid="input-register-firstname" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="register-lastName" className="font-bold text-gray-700">Last Name <span className="text-coral">*</span></Label>
                    <Input id="register-lastName" value={registerData.lastName} onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })} placeholder="Smith" className={inputCls} data-testid="input-register-lastname" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="register-email" className="font-bold text-gray-700">Email <span className="text-coral">*</span></Label>
                  <Input id="register-email" type="email" value={registerData.email} onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })} placeholder="john.smith@example.com" className={inputCls} data-testid="input-register-email" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="register-phone" className="font-bold text-gray-700">Phone Number</Label>
                  <Input id="register-phone" type="tel" value={registerData.phoneNumber} onChange={(e) => setRegisterData({ ...registerData, phoneNumber: e.target.value })} placeholder="(555) 123-4567" className={inputCls} data-testid="input-register-phone" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="register-password" className="font-bold text-gray-700">Password <span className="text-coral">*</span></Label>
                  <div className="relative">
                    <Input id="register-password" type={showRegisterPassword ? "text" : "password"} value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} placeholder="At least 6 characters" className={`${inputCls} pr-11`} data-testid="input-register-password" />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowRegisterPassword(!showRegisterPassword)} data-testid="button-toggle-register-password">
                      {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="register-confirmPassword" className="font-bold text-gray-700">Confirm Password <span className="text-coral">*</span></Label>
                  <div className="relative">
                    <Input id="register-confirmPassword" type={showRegisterPassword ? "text" : "password"} value={registerData.confirmPassword} onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })} placeholder="Confirm your password" className={`${inputCls} pr-11`} data-testid="input-register-confirm-password" />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowRegisterPassword(!showRegisterPassword)} data-testid="button-toggle-confirm-password">
                      {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="bg-mint/5 border border-mint/20 rounded-2xl p-3">
                  <p className="text-xs text-gray-600 font-semibold">🏠 You'll get a unique family code that other parents can use to join your family.</p>
                </div>
                <Button type="submit" className="w-full super-button font-bold text-lg py-6 rounded-full" disabled={registerMutation.isPending} data-testid="button-register">
                  {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Free-trial reassurance */}
        <p className="text-center text-white/90 text-sm font-semibold mt-4">✨ Free 7-day trial · No credit card · Cancel anytime</p>

        {/* Collapsible marketing detail */}
        <button type="button" onClick={() => setShowInfo(!showInfo)} className="mt-4 w-full flex items-center justify-center gap-1.5 bg-white/12 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 font-bold text-white text-sm" data-testid="toggle-auth-info">
          {showInfo ? "Hide details" : "What's inside Habit Heroes?"}
          <ChevronDown className={`w-4 h-4 transition-transform ${showInfo ? "rotate-180" : ""}`} />
        </button>

        {showInfo && (
          <div className="mt-3 space-y-3 bounce-in">
            <div className="bg-white/12 backdrop-blur-sm border border-white/15 rounded-2xl p-4">
              <h3 className="font-fredoka text-lg text-sunshine mb-2">🎮 Kids will love</h3>
              <ul className="text-white/90 text-sm space-y-1 font-nunito">
                <li>🦸 Custom hero avatars, gear & levels</li>
                <li>🏆 Earn XP, streaks & achievement badges</li>
                <li>🎯 Daily missions with photo & voice proof</li>
                <li>🎁 Reward points that unlock mini-games</li>
              </ul>
            </div>
            <div className="bg-white/12 backdrop-blur-sm border border-white/15 rounded-2xl p-4">
              <h3 className="font-fredoka text-lg text-mint mb-2">👨‍👩‍👧‍👦 Parents get</h3>
              <ul className="text-white/90 text-sm space-y-1 font-nunito">
                <li>📊 Real-time progress & weekly reports</li>
                <li>⚙️ Custom habits, rewards & approvals</li>
                <li>👑 Premium: auto-approval, voice reminders, analytics</li>
                <li>🔒 COPPA-compliant, screen-time & safety controls</li>
              </ul>
            </div>
            <div className="bg-gradient-to-r from-mint/20 to-sky/20 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
              <h3 className="font-fredoka text-base text-white text-center mb-3">🚀 Start in 3 easy steps</h3>
              <div className="flex items-start justify-between gap-2 text-center">
                {[["1", "Create account", "bg-mint"], ["2", "Add your kids", "bg-coral"], ["3", "Start adventures", "bg-sky"]].map(([n, t, bg]) => (
                  <div key={n} className="flex-1">
                    <div className={`w-9 h-9 ${bg} rounded-full flex items-center justify-center mx-auto mb-1 text-white font-bold`}>{n}</div>
                    <p className="text-white/90 text-[11px] font-semibold">{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
