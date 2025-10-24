import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Home,
  Star,
  Shield,
  Users,
  LogOut,
  Info,
} from "lucide-react";

export default function ParentAuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Get the default tab from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get("mode");
  const defaultTab = mode === "login" ? "login" : "register";

  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && shouldRedirect) {
      setLocation("/parent");
      setShouldRedirect(false);
    }
  }, [isAuthenticated, isLoading, shouldRedirect, setLocation]);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const handleFocusWithId = (customId: string) => {
    return (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.placeholder = "";
    };
  };

  const handleBlurWithId = (customId: string, placeholderText: string) => {
    return (e: React.FocusEvent<HTMLInputElement>) => {
      if (e.target.value.trim() === "") {
        e.target.placeholder = placeholderText;
      }
    };
  };

  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Welcome back!",
        description: `Successfully logged in! Your new family code is ${data.familyCode}`,
      });
      setShouldRedirect(true);
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: typeof registerData) => {
      const res = await apiRequest("POST", "/api/auth/register", {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || null,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Account created!",
        description: "Welcome to Habit Heroes! Let's set up your first child.",
      });
      setShouldRedirect(true);
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Logged out",
        description: "You can now sign up or log in with a different account.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Logout failed",
        description: error.message || "Failed to log out",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !registerData.email ||
      !registerData.password ||
      !registerData.firstName ||
      !registerData.lastName
    ) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same",
        variant: "destructive",
      });
      return;
    }

    if (registerData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate(registerData);
  };

  return (
    <>
      {/* ✅ FIXED HEADER — Always stays at top */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 2147483647,
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <Button
          variant="default"
          size="sm"
          className="bg-white text-gray-800 hover:bg-gray-100 shadow-sm"
          onClick={() => setLocation("/")}
          aria-label="Go to home"
        >
          <Home className="w-4 h-4 mr-1" />
          Home
        </Button>
      </header>

      {/* Main Page Content — pushed below header with pt-[60px] */}
      <div className="min-h-screen hero-gradient pt-[60px]">
        <div className="container mx-auto px-4 py-8">
          {/* Two-column layout: Hero on left, Auth form on right (top-aligned) */}
          <div className="grid lg:grid-cols-2 gap-8 items-start min-h-[80vh]">
            {/* Hero Section - LEFT */}
            <div className="text-white space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-300" />
                </div>
                <h1 className="font-fredoka text-4xl lg:text-5xl">
                  Habit Heroes
                </h1>
              </div>
              <p className="font-nunito text-xl lg:text-2xl text-white/90">
                Transform daily routines into epic adventures for your children
              </p>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Home className="w-4 h-4" />
                  </div>
                  <p className="font-nunito">
                    Gamified habit tracking that kids love
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <p className="font-nunito">
                    Comprehensive parental controls and oversight
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <p className="font-nunito">
                    Multiple child profiles and family management
                  </p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-4">
                <h3 className="font-fredoka text-xl text-yellow-300">
                  🎮 Features Your Kids Will Love:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-mint mb-2">
                      🦸 Hero Characters
                    </h4>
                    <ul className="space-y-1 text-white/90">
                      <li>• Create custom avatars (robots, princesses, ninjas)</li>
                      <li>• Unlock new gear and costumes</li>
                      <li>• Level up from novice to legendary hero</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-coral mb-2">
                      🏆 Gamification
                    </h4>
                    <ul className="space-y-1 text-white/90">
                      <li>• Earn XP for completing habits</li>
                      <li>• Build streak counters</li>
                      <li>• Unlock achievement badges</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sky mb-2">
                      🎯 Daily Missions
                    </h4>
                    <ul className="space-y-1 text-white/90">
                      <li>• Turn chores into epic quests</li>
                      <li>• Photo proof submissions</li>
                      <li>• Voice message support</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple mb-2">
                      🎁 Reward System
                    </h4>
                    <ul className="space-y-1 text-white/90">
                      <li>• Earn reward points</li>
                      <li>• Custom family rewards</li>
                      <li>• Mini-games unlock</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-4">
                <h3 className="font-fredoka text-xl text-yellow-300">
                  👨‍👩‍👧‍👦 Parent Dashboard Features:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-mint mb-2">
                      📊 Progress Tracking
                    </h4>
                    <ul className="space-y-1 text-white/90">
                      <li>• Real-time habit completion</li>
                      <li>• Weekly/monthly reports</li>
                      <li>• Streak analytics</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-coral mb-2">
                      ⚙️ Management Tools
                    </h4>
                    <ul className="space-y-1 text-white/90">
                      <li>• Create custom habits</li>
                      <li>• Set reward values</li>
                      <li>• Approve/review submissions</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sky mb-2">
                      👑 Premium Features
                    </h4>
                    <ul className="space-y-1 text-white/90">
                      <li>• Auto-approval settings</li>
                      <li>• Voice recordings</li>
                      <li>• Advanced analytics</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple mb-2">
                      🔒 Safety & Control
                    </h4>
                    <ul className="space-y-1 text-white/90">
                      <li>• COPPA compliant platform</li>
                      <li>• Screen time controls</li>
                      <li>• Content filtering</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-mint/20 to-sky/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="font-fredoka text-xl text-center mb-4">
                  🚀 Get Started in 3 Easy Steps:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-mint rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold">1</span>
                    </div>
                    <h4 className="font-semibold text-mint mb-1">
                      Create Account
                    </h4>
                    <p className="text-white/90">
                      Sign up with your email - takes 30 seconds!
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-coral rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold">2</span>
                    </div>
                    <h4 className="font-semibold text-coral mb-1">
                      Add Children
                    </h4>
                    <p className="text-white/90">
                      Set up profiles and choose hero avatars
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-sky rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold">3</span>
                    </div>
                    <h4 className="font-semibold text-sky mb-1">
                      Start Adventures
                    </h4>
                    <p className="text-white/90">
                      Create habits and watch the magic happen!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Auth Forms Section - RIGHT (top-aligned) */}
            <div className="flex items-start justify-center">
              <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                  <CardTitle className="font-fredoka text-2xl">
                    Parent Access
                  </CardTitle>
                  <CardDescription>
                    Sign in to manage your children's habits and progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={defaultTab} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login" className="flex items-center space-x-2">
                        <LogIn className="w-4 h-4" />
                        <span>Sign In</span>
                      </TabsTrigger>
                      <TabsTrigger value="register" className="flex items-center space-x-2">
                        <UserPlus className="w-4 h-4" />
                        <span>Sign Up</span>
                      </TabsTrigger>
                    </TabsList>

                    {/* Login Form */}
                    <TabsContent value="login">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email">Email</Label>
                          <Input
                            id="login-email"
                            type="email"
                            value={loginData.email}
                            onChange={(e) =>
                              setLoginData({ ...loginData, email: e.target.value })
                            }
                            placeholder="Enter your email"
                            data-testid="input-login-email"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="login-password">Password</Label>
                          <div className="relative">
                            <Input
                              id="login-password"
                              type={showLoginPassword ? "text" : "password"}
                              value={loginData.password}
                              onChange={(e) =>
                                setLoginData({ ...loginData, password: e.target.value })
                              }
                              placeholder="Enter your password"
                              className="pr-10"
                              data-testid="input-login-password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                              data-testid="button-toggle-password"
                            >
                              {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full super-button"
                          disabled={loginMutation.isPending}
                          data-testid="button-login"
                        >
                          {loginMutation.isPending ? "Signing In..." : "Sign In"}
                        </Button>
                      </form>
                    </TabsContent>

                    {/* Registration Form */}
                    <TabsContent value="register">
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="register-firstName">First Name *</Label>
                            <Input
                              id="register-firstName"
                              value={registerData.firstName}
                              onChange={(e) =>
                                setRegisterData({ ...registerData, firstName: e.target.value })
                              }
                              placeholder="John"
                              data-testid="input-register-firstname"
                              onFocus={handleFocusWithId("register-firstName")}
                              onBlur={handleBlurWithId("register-firstName", "John")}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="register-lastName">Last Name *</Label>
                            <Input
                              id="register-lastName"
                              value={registerData.lastName}
                              onChange={(e) =>
                                setRegisterData({ ...registerData, lastName: e.target.value })
                              }
                              placeholder="Smith"
                              data-testid="input-register-lastname"
                              onFocus={handleFocusWithId("register-lastName")}
                              onBlur={handleBlurWithId("register-lastName", "Smith")}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="register-email">Email *</Label>
                          <Input
                            id="register-email"
                            type="email"
                            value={registerData.email}
                            onChange={(e) =>
                              setRegisterData({ ...registerData, email: e.target.value })
                            }
                            placeholder="john.smith@example.com"
                            data-testid="input-register-email"
                            onFocus={handleFocusWithId("register-email")}
                            onBlur={handleBlurWithId("register-email", "john.smith@example.com")}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="register-phone">Phone Number</Label>
                          <Input
                            id="register-phone"
                            type="tel"
                            value={registerData.phoneNumber}
                            onChange={(e) =>
                              setRegisterData({ ...registerData, phoneNumber: e.target.value })
                            }
                            placeholder="(555) 123-4567"
                            data-testid="input-register-phone"
                            onFocus={handleFocusWithId("register-phone")}
                            onBlur={handleBlurWithId("register-phone", "(555) 123-4567")}
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Family Setup</Label>
                          <div className="p-3 bg-mint/5 border border-mint/20 rounded-lg">
                            <p className="text-sm text-gray-600">
                              🏠 Creating a new family? You'll get a unique family code that other parents can use to join your account.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="register-password">Password *</Label>
                          <div className="relative">
                            <Input
                              id="register-password"
                              type={showRegisterPassword ? "text" : "password"}
                              value={registerData.password}
                              onChange={(e) =>
                                setRegisterData({ ...registerData, password: e.target.value })
                              }
                              placeholder="At least 6 characters"
                              className="pr-10"
                              data-testid="input-register-password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                              data-testid="button-toggle-register-password"
                            >
                              {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="register-confirmPassword">Confirm Password *</Label>
                          <div className="relative">
                            <Input
                              id="register-confirmPassword"
                              type={showRegisterPassword ? "text" : "password"}
                              value={registerData.confirmPassword}
                              onChange={(e) =>
                                setRegisterData({ ...registerData, confirmPassword: e.target.value })
                              }
                              placeholder="Confirm your password"
                              className="pr-10"
                              data-testid="input-register-confirm-password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                              data-testid="button-toggle-confirm-password"
                            >
                              {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full super-button"
                          disabled={registerMutation.isPending}
                          data-testid="button-register"
                        >
                          {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}