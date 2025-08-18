import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, UserPlus, LogIn, Home, Star, Shield, Users, LogOut, Info } from "lucide-react";

export default function ParentAuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // Only redirect to dashboard if user is authenticated AND this redirect is from a successful login/signup
  // Don't redirect if user just visits the auth page while already logged in
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  useEffect(() => {
    // Only redirect if this is a fresh navigation and user is authenticated
    if (!isLoading && isAuthenticated && shouldRedirect) {
      setLocation("/parent");
      setShouldRedirect(false);
    }
  }, [isAuthenticated, isLoading, shouldRedirect, setLocation]);
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  // Registration form state
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    joinFamilyCode: ""
  });

  const [showJoinFamily, setShowJoinFamily] = useState(false);

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
        joinFamilyCode: data.joinFamilyCode || null
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      const joinedFamily = showJoinFamily && registerData.joinFamilyCode;
      toast({
        title: joinedFamily ? "Joined family successfully!" : "Account created!",
        description: joinedFamily 
          ? `Welcome to Habit Heroes! You've joined the family account.`
          : "Welcome to Habit Heroes! Let's set up your first child.",
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
    
    // Validation
    if (!registerData.email || !registerData.password || !registerData.firstName || !registerData.lastName) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate family code if joining existing family
    if (showJoinFamily && (!registerData.joinFamilyCode || registerData.joinFamilyCode.length !== 6)) {
      toast({
        title: "Invalid family code",
        description: "Please enter a valid 6-character family code",
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
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center min-h-screen">
          {/* Hero Section */}
          <div className="text-white space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-300" />
                </div>
                <h1 className="font-fredoka text-4xl lg:text-5xl">Habit Heroes</h1>
              </div>
              <p className="font-nunito text-xl lg:text-2xl text-white/90">
                Transform daily routines into epic adventures for your children
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Home className="w-4 h-4" />
                </div>
                <p className="font-nunito">Gamified habit tracking that kids love</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <p className="font-nunito">Comprehensive parental controls and oversight</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <p className="font-nunito">Multiple child profiles and family management</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-3">
              <h3 className="font-fredoka text-xl">🎮 Features Your Kids Will Love:</h3>
              <ul className="space-y-2 text-sm">
                <li>• Customize their hero avatar (robots, princesses, ninjas, animals)</li>
                <li>• Earn XP and level up by completing daily habits</li>
                <li>• Unlock new gear and avatar customizations</li>
                <li>• Fun visual progress tracking and celebrations</li>
              </ul>
            </div>
          </div>

          {/* Auth Forms Section */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle className="font-fredoka text-2xl">Parent Access</CardTitle>
                <CardDescription>
                  Sign in to manage your children's habits and progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Show alert if user is already authenticated */}
                {isAuthenticated && (
                  <Alert className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>You're already logged in. </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => logoutMutation.mutate()}
                        disabled={logoutMutation.isPending}
                        className="ml-2"
                      >
                        <LogOut className="w-4 h-4 mr-1" />
                        {logoutMutation.isPending ? "Logging out..." : "Logout"}
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                <Tabs defaultValue="login" className="space-y-4">
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
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          placeholder="Enter your email"
                          data-testid="input-login-email"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            placeholder="Enter your password"
                            data-testid="input-login-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full" 
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
                            onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                            placeholder="John"
                            data-testid="input-register-firstname"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-lastName">Last Name *</Label>
                          <Input
                            id="register-lastName"
                            value={registerData.lastName}
                            onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                            placeholder="Smith"
                            data-testid="input-register-lastname"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email *</Label>
                        <Input
                          id="register-email"
                          type="email"
                          value={registerData.email}
                          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                          placeholder="john.smith@example.com"
                          data-testid="input-register-email"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-phone">Phone Number</Label>
                        <Input
                          id="register-phone"
                          type="tel"
                          value={registerData.phoneNumber}
                          onChange={(e) => setRegisterData({ ...registerData, phoneNumber: e.target.value })}
                          placeholder="(555) 123-4567"
                          data-testid="input-register-phone"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Family Setup</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowJoinFamily(!showJoinFamily)}
                            className="text-turquoise hover:text-turquoise/80 text-sm"
                            data-testid="button-toggle-join-family"
                          >
                            {showJoinFamily ? "Create New Family" : "Join Existing Family"}
                          </Button>
                        </div>
                        
                        {showJoinFamily && (
                          <div className="space-y-2 p-3 bg-turquoise/5 border border-turquoise/20 rounded-lg">
                            <Label htmlFor="register-joinFamily" className="text-sm text-turquoise font-medium">
                              Family Code *
                            </Label>
                            <Input
                              id="register-joinFamily"
                              value={registerData.joinFamilyCode}
                              onChange={(e) => setRegisterData({ ...registerData, joinFamilyCode: e.target.value.toUpperCase() })}
                              placeholder="Enter 6-character family code"
                              maxLength={6}
                              className="font-mono text-center text-lg tracking-wider border-turquoise/40 focus:border-turquoise"
                              data-testid="input-register-family-code"
                            />
                            <p className="text-xs text-gray-600">
                              Ask a family member for their family code to join their account
                            </p>
                          </div>
                        )}
                        
                        {!showJoinFamily && (
                          <div className="p-3 bg-mint/5 border border-mint/20 rounded-lg">
                            <p className="text-sm text-gray-600">
                              🏠 Creating a new family? You'll get a unique family code that other parents can use to join your account.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-password">Password *</Label>
                        <div className="relative">
                          <Input
                            id="register-password"
                            type={showPassword ? "text" : "password"}
                            value={registerData.password}
                            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                            placeholder="At least 6 characters"
                            data-testid="input-register-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-register-password"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-confirmPassword">Confirm Password *</Label>
                        <Input
                          id="register-confirmPassword"
                          type="password"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                          placeholder="Confirm your password"
                          data-testid="input-register-confirm-password"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full" 
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
  );
}