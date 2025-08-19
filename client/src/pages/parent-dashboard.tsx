import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { SyncStatus, SyncStatusIndicator } from "@/components/sync-status";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp, Flame, Trophy, Star, Plus, UserRound, Crown, Zap, Heart, Settings, Gift, BarChart3, Shield, X, Check, Clock, Coins, Award, HelpCircle, Bell, Camera } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import HabitApproval from "../components/parent/habit-approval";
import ParentControlsModal from "@/components/parent/ParentControlsModal";
import OnboardingTutorial from "@/components/parent/OnboardingTutorial";
import ParentProfileModal from "@/components/parent/ParentProfileModal";
import { TrialBanner } from "@/components/subscription/trial-banner";
import TrialStatusBanner from "@/components/subscription/trial-status-banner";
import SubscriptionManagementCard from "@/components/subscription/subscription-management-card";

import type { Child, User, InsertChild, Habit, MasterHabit, Reward } from "@shared/schema";

export default function ParentDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  
  console.log("ParentDashboard - Auth State:", { isAuthenticated, isLoading, user });
  const [heroName, setHeroName] = useState("");
  const [avatarType, setAvatarType] = useState("robot");
  const [showParentProfile, setShowParentProfile] = useState(false);
  const [showParentControls, setShowParentControls] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showHabitAssignment, setShowHabitAssignment] = useState(false);

  const { data: children, isLoading: childrenLoading } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    enabled: isAuthenticated,
  });

  const child = children?.[0];

  // Fetch real data for calculations - Always run these hooks
  const { data: weeklyProgress } = useQuery({
    queryKey: ["/api/children", child?.id, "progress/weekly"],
    enabled: isAuthenticated && !!child,
  });

  const { data: habits } = useQuery({
    queryKey: ["/api/children", child?.id, "habits"],
    enabled: isAuthenticated && !!child,
  });

  const { data: completions } = useQuery({
    queryKey: ["/api/children", child?.id, "completions"],
    enabled: isAuthenticated && !!child,
  });

  const createHeroMutation = useMutation({
    mutationFn: async (heroData: { name: string; avatarType: string; avatarUrl?: string }) => {
      console.log("Creating hero with data:", heroData);
      const response = await apiRequest("POST", "/api/children", {
        name: heroData.name,
        avatarType: heroData.avatarType,
        avatarUrl: heroData.avatarUrl,
        level: 1,
        xp: 0,
        totalXp: 0,
        rewardPoints: 0,
        unlockedAvatars: [],
        unlockedGear: [],
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Hero creation failed:", errorText);
        throw new Error(errorText || "Failed to create hero");
      }
      
      const result = await response.json();
      console.log("Hero created successfully:", result);
      return result;
    },
    onSuccess: (newHero) => {
      console.log("Hero creation success callback:", newHero);
      toast({
        title: "Hero Created! 🎉",
        description: `${newHero.name} is ready for adventures!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      setHeroName("");
      setAvatarType("robot");
      setImagePreview("");
    },
    onError: (error) => {
      console.log("Hero creation error callback:", error);
      let errorMessage = "Something went wrong";
      
      // Handle specific error types
      if (error.message?.includes("413") || error.message?.includes("too large")) {
        errorMessage = "Image file is too large. Please choose a smaller image (under 5MB).";
      } else if (error.message?.includes("400")) {
        errorMessage = "Invalid image format. Please use JPG or PNG files.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Failed to create hero",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const generateCredentialsMutation = useMutation({
    mutationFn: async ({ childId, name }: { childId: string; name: string }) => {
      const generatePin = (): string => {
        return Math.floor(1000 + Math.random() * 9000).toString();
      };

      const generateUsername = (name: string): string => {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 100);
      };

      const response = await apiRequest("PATCH", `/api/children/${childId}`, {
        username: generateUsername(name),
        pin: generatePin()
      });
      return await response.json();
    },
    onSuccess: (updatedChild) => {
      toast({
        title: "Login credentials created!",
        description: `${updatedChild.name} can now log in with username "${updatedChild.username}" and PIN "${updatedChild.pin}"`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate credentials",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const generateLoginCredentials = (childId: string, name: string) => {
    generateCredentialsMutation.mutate({ childId, name });
  };

  const deleteChildMutation = useMutation({
    mutationFn: async (childId: string) => {
      await apiRequest("DELETE", `/api/children/${childId}`);
    },
    onSuccess: () => {
      toast({
        title: "Hero Deleted",
        description: "Hero profile has been removed.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete hero profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const [newAvatarImage, setNewAvatarImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please choose an image under 5MB",
        variant: "destructive",
      });
      return;
    }
    
    setNewAvatarImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateHero = () => {
    if (!heroName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your hero!",
        variant: "destructive",
      });
      return;
    }
    
    const heroData: any = { 
      name: heroName.trim(), 
      avatarType 
    };
    
    // Add image URL if preview exists (simulating upload)
    if (imagePreview) {
      heroData.avatarUrl = imagePreview;
    }
    
    createHeroMutation.mutate(heroData);
  };

  const [showAddHero, setShowAddHero] = useState(false);
  const [newHeroName, setNewHeroName] = useState("");
  const [newAvatarType, setNewAvatarType] = useState("robot");
  
  // Form states for different management sections
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const avatarTypes = [
    { id: "robot", name: "🤖 Robot Hero", icon: UserRound, description: "Tech-savvy and logical" },
    { id: "princess", name: "👑 Princess Hero", icon: Crown, description: "Elegant and wise" },
    { id: "ninja", name: "🥷 Ninja Hero", icon: Zap, description: "Stealthy and swift" },
    { id: "animal", name: "🦁 Animal Hero", icon: Heart, description: "Wild and brave" },
  ];

  const getAvatarImage = (type: string) => {
    // Generate cartoon-style SVG avatars instead of human photos
    const avatarSvgs = {
      robot: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#4ECDC4" rx="20"/><rect x="40" y="60" width="120" height="80" fill="#2C3E50" rx="10"/><circle cx="70" cy="90" r="8" fill="#E74C3C"/><circle cx="130" cy="90" r="8" fill="#E74C3C"/><rect x="85" y="110" width="30" height="15" fill="#F39C12" rx="5"/><rect x="60" y="150" width="80" height="30" fill="#34495E" rx="5"/></svg>`)}`,
      princess: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#FFB6C1" rx="20"/><circle cx="100" cy="90" r="40" fill="#FDD5BA"/><circle cx="85" cy="80" r="3" fill="#333"/><circle cx="115" cy="80" r="3" fill="#333"/><path d="M90 95 Q100 105 110 95" stroke="#E91E63" stroke-width="2" fill="none"/><polygon points="70,50 100,30 130,50 120,70 80,70" fill="#FFD700"/><circle cx="100" cy="45" r="5" fill="#FF69B4"/></svg>`)}`,
      ninja: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#2C3E50" rx="20"/><circle cx="100" cy="100" r="50" fill="#34495E"/><rect x="60" y="70" width="80" height="30" fill="#1A252F"/><circle cx="85" cy="85" r="4" fill="#E74C3C"/><circle cx="115" cy="85" r="4" fill="#E74C3C"/><rect x="75" y="120" width="50" height="20" fill="#E67E22" rx="10"/></svg>`)}`,
      animal: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#F39C12" rx="20"/><circle cx="100" cy="110" r="45" fill="#E67E22"/><circle cx="75" cy="85" r="15" fill="#D35400"/><circle cx="125" cy="85" r="15" fill="#D35400"/><circle cx="85" cy="95" r="3" fill="#000"/><circle cx="115" cy="95" r="3" fill="#000"/><ellipse cx="100" cy="110" rx="8" ry="6" fill="#000"/><path d="M100 116 Q90 125 80 120 M100 116 Q110 125 120 120" stroke="#000" stroke-width="2" fill="none"/></svg>`)}`
    };
    return avatarSvgs[type as keyof typeof avatarSvgs] || avatarSvgs.robot;
  };

  // This will be handled by the App.tsx routing logic

  // Check for first-time user and show onboarding
  useEffect(() => {
    const completed = localStorage.getItem('parent-onboarding-completed');
    if (!completed && children && children.length === 0 && isAuthenticated) {
      setShowOnboarding(true);
    }
    setHasCompletedOnboarding(!!completed);
  }, [children, isAuthenticated]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('parent-onboarding-completed', 'true');
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
  };

  const restartOnboarding = () => {
    setShowOnboarding(true);
  };

  if (isLoading || childrenLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!children || children.length === 0) {
    return (
      <div className="min-h-screen hero-gradient">
        <header className="text-white p-6">
          <div className="max-w-6xl mx-auto">
            {/* Family Code Display */}
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20">
                <div className="text-center">
                  <div className="text-white/80 text-sm font-medium">Family Code</div>
                  <div className="text-white font-bold text-2xl tracking-wider font-mono">{(user as User)?.familyCode}</div>
                  <div className="text-white/70 text-xs">Share this code with family members</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-fredoka text-4xl hero-title">Parent Dashboard</h1>
                <p className="text-white/90 text-lg">✨ Welcome to Habit Heroes! ✨</p>
              </div>
              <div className="flex items-center space-x-4">
                {hasCompletedOnboarding && (
                  <Button 
                    variant="ghost" 
                    onClick={restartOnboarding}
                    className="text-white hover:bg-white/20 font-bold"
                  >
                    📚 Tutorial
                  </Button>
                )}
                <div className="flex items-center space-x-2">
                  <SyncStatus />
                </div>
                <Link href="/">
                  <Button variant="ghost" className="text-white hover:bg-white/20 font-bold">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Home
                  </Button>
                </Link>
                <div className="w-12 h-12 rounded-full border-4 border-white avatar-glow bg-coral flex items-center justify-center text-white font-bold text-lg">
                  {((user as User)?.firstName?.[0] || (user as User)?.email?.[0] || 'P').toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-4xl mx-auto p-6">
          <div className="bounce-in">
            <Card className="fun-card p-8 text-center border-4 border-coral">
              <div className="mb-8">
                <div className="w-24 h-24 mx-auto mb-6 magic-gradient rounded-full flex items-center justify-center">
                  <Plus className="w-12 h-12 text-white" />
                </div>
                <h2 className="font-fredoka text-4xl text-gray-800 mb-4 hero-title">Create Your First Hero!</h2>
                <p className="text-gray-600 text-lg mb-8">
                  🌟 Let's create an amazing hero character for your child! Choose their name and avatar type to begin their adventure! 🌟
                </p>
              </div>

              <div className="space-y-8 max-w-2xl mx-auto">
                {/* Hero Preview */}
                <div className="text-center">
                  <div className="relative inline-block">
                    <img 
                      src={getAvatarImage(avatarType)} 
                      alt="Hero Preview" 
                      className="w-32 h-32 rounded-full border-4 border-coral avatar-glow object-cover mx-auto mb-4"
                    />
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-sunshine rounded-full flex items-center justify-center border-4 border-white">
                      <Star className="w-6 h-6 text-gray-800" />
                    </div>
                  </div>
                  <div className="font-nunito font-bold text-xl text-gray-800">
                    {heroName || "Your Hero"} • Level 1
                  </div>
                </div>

                {/* Name Input */}
                <div className="space-y-3">
                  <label className="font-nunito font-bold text-gray-800 text-lg">🦸 Hero Name</label>
                  <Input
                    type="text"
                    placeholder="Enter your child's name..."
                    value={heroName}
                    onChange={(e) => setHeroName(e.target.value)}
                    className="w-full text-center text-xl py-4 border-4 border-sky font-bold rounded-xl"
                  />
                </div>

                {/* Avatar Type Selection */}
                <div className="space-y-4">
                  <label className="font-nunito font-bold text-gray-800 text-lg">🎭 Choose Hero Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    {avatarTypes.map((type) => (
                      <div
                        key={type.id}
                        onClick={() => setAvatarType(type.id)}
                        className={`fun-card p-4 cursor-pointer transition-all border-4 ${
                          avatarType === type.id
                            ? 'border-coral bg-coral/10 transform scale-105'
                            : 'border-gray-200 hover:border-sky hover:bg-sky/10'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-2">{type.name.split(' ')[0]}</div>
                          <div className="font-bold text-gray-800">{type.name.split(' ').slice(1).join(' ')}</div>
                          <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Avatar Upload (Optional) */}
                <div className="space-y-3">
                  <label className="font-nunito font-bold text-gray-800 text-lg">📸 Custom Avatar (Optional)</label>
                  <div className="border-4 border-dashed border-gray-300 rounded-xl p-6 text-center">
                    {imagePreview ? (
                      <div className="space-y-3">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-coral"
                        />
                        <Button 
                          onClick={() => {
                            setImagePreview("");
                            const input = document.getElementById('avatar-upload') as HTMLInputElement;
                            if (input) input.value = '';
                          }}
                          variant="outline"
                          className="text-sm"
                        >
                          Remove Image
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
                          <Camera className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="text-gray-600">
                          <p className="font-medium">Upload your child's photo</p>
                          <p className="text-sm">JPG, PNG files up to 5MB</p>
                        </div>
                        <Button 
                          onClick={() => document.getElementById('avatar-upload')?.click()}
                          variant="outline"
                          className="border-coral text-coral hover:bg-coral hover:text-white"
                        >
                          Choose Image
                        </Button>
                      </div>
                    )}
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                  </div>
                </div>

                {/* Create Button */}
                <div className="pt-4">
                  <Button 
                    onClick={handleCreateHero}
                    disabled={createHeroMutation.isPending || !heroName.trim()}
                    className="w-full py-6 text-xl font-bold bg-gradient-to-r from-coral to-orange-500 hover:from-coral/80 hover:to-orange-400 text-white rounded-xl transform hover:scale-105 transition-all shadow-lg"
                  >
                    {createHeroMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                        Creating Hero...
                      </>
                    ) : (
                      <>
                        🎉 Create Hero Character! 🎉
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    );
  }



  // Calculate real statistics
  const completionRate = weeklyProgress && child ? 
    ((weeklyProgress as any).totalHabits === 0 ? 0 : Math.round(((weeklyProgress as any).completedHabits / (weeklyProgress as any).totalHabits) * 100)) : 0;

  // Calculate current streak - consecutive days with at least one completed habit
  const calculateCurrentStreak = () => {
    if (!completions || (completions as any[]).length === 0) return 0;
    
    const approvedCompletions = (completions as any[]).filter((c: any) => c.status === 'approved');
    if (approvedCompletions.length === 0) return 0;

    // Group completions by date
    const completionsByDate = approvedCompletions.reduce((acc: any, completion: any) => {
      const date = completion.date;
      if (!acc[date]) acc[date] = 0;
      acc[date]++;
      return acc;
    }, {});

    // Calculate streak from most recent date backwards
    let streak = 0;
    const today = new Date();
    let currentDate = new Date(today);
    
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (completionsByDate[dateStr] && completionsByDate[dateStr] > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const currentStreak = calculateCurrentStreak();

  // Calculate badges earned based on achievements
  const calculateBadgesEarned = () => {
    if (!completions || !habits) return 0;
    
    let badges = 0;
    const approvedCompletions = (completions as any[]).filter((c: any) => c.status === 'approved');
    
    // Badge for first completion
    if (approvedCompletions.length > 0) badges++;
    
    // Badge for 10 completions
    if (approvedCompletions.length >= 10) badges++;
    
    // Badge for 50 completions  
    if (approvedCompletions.length >= 50) badges++;
    
    // Badge for 100 completions
    if (approvedCompletions.length >= 100) badges++;
    
    // Badge for 7-day streak
    if (currentStreak >= 7) badges++;
    
    // Badge for 30-day streak
    if (currentStreak >= 30) badges++;
    
    // Badge for having 5+ active habits
    if (habits && (habits as any[]).length >= 5) badges++;
    
    return badges;
  };

  const badgesEarned = calculateBadgesEarned();

  return (
    <div className="min-h-screen hero-gradient">
      <header className="text-white p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Family Code Display */}
          <div className="flex justify-center mb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20">
              <div className="text-center">
                <div className="text-white/80 text-sm font-medium">Family Code</div>
                <div className="text-white font-bold text-2xl tracking-wider font-mono">{(user as User)?.familyCode}</div>
                <div className="text-white/70 text-xs">Share this code with family members</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            {/* Left side - Title and description */}
            <div className="flex-1">
              <h1 className="font-fredoka text-2xl sm:text-4xl hero-title">Parent Dashboard</h1>
              <p className="text-white/90 text-sm sm:text-lg">🎯 Managing {children?.length === 1 ? `${children[0]?.name}'s` : 'Family'} Hero Journey</p>
            </div>
            
            {/* Right side - Profile and XP display */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs text-white/80">Total Family XP</div>
                <div className="font-bold text-xl text-sunshine">{(children?.reduce((total: number, c: any) => total + (c.totalXp || 0), 0) || 0).toLocaleString()} XP ⭐</div>
              </div>
              {/* Profile Avatar - Always show user initials */}
              {user && (
                <div className="relative">
                  <div 
                    className="w-12 h-12 rounded-full border-4 border-white avatar-glow bg-coral flex items-center justify-center cursor-pointer hover:scale-105 transition-transform text-white font-bold text-lg"
                    onClick={() => setShowParentProfile(!showParentProfile)}
                  >
                    {((user as User)?.firstName?.[0] || (user as User)?.email?.[0] || 'P').toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-mint rounded-full border-2 border-white flex items-center justify-center">
                    <Settings className="w-2 h-2 text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation Bar */}
          <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-2xl p-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/20 font-bold text-sm px-3 py-2 rounded-xl flex items-center gap-2"
                onClick={restartOnboarding}
              >
                <HelpCircle className="w-4 h-4" />
                Tutorial
              </Button>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/20 font-bold text-sm px-3 py-2 rounded-xl flex items-center gap-2"
                onClick={() => setShowParentControls(true)}
              >
                <Shield className="w-4 h-4" />
                Controls
              </Button>
              <Link href="/alert-settings">
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/20 font-bold text-sm px-3 py-2 rounded-xl flex items-center gap-2"
                  data-testid="button-global-alert-settings"
                >
                  <Bell className="w-4 h-4" />
                  Alerts
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" className="text-white hover:bg-white/20 font-bold text-sm px-3 py-2 rounded-xl flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back to Home</span>
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/20 font-bold text-sm px-3 py-2 rounded-xl"
                onClick={() => window.location.href = "/api/logout"}
              >
                Sign Out
              </Button>
            </div>
          </div>
          
          {/* Mobile XP Display */}
          <div className="sm:hidden mt-3 text-center">
            <div className="text-xs text-white/80">Total Family XP</div>
            <div className="font-bold text-lg text-sunshine">{(children?.reduce((total, c) => total + (c.totalXp || 0), 0) || 0).toLocaleString()} XP ⭐</div>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Trial Status Banner */}
        <TrialStatusBanner />
        
        {/* Parent Profile Modal */}
        {showParentProfile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-fredoka text-xl text-gray-800">Parent Profile</h3>
                <Button variant="ghost" onClick={() => setShowParentProfile(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="text-center mb-4">
                <img 
                  src={`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="%23ff6b6b"/><text x="48" y="60" text-anchor="middle" fill="white" font-size="36" font-family="Arial">${((user as User)?.firstName?.[0] || (user as User)?.email?.[0] || 'P').toUpperCase()}</text></svg>`)}`} 
                  alt="Parent Profile" 
                  className="w-24 h-24 rounded-full mx-auto mb-3 border-4 border-sunshine"
                />
                <h4 className="font-bold text-gray-800">{(user as User)?.email}</h4>
                <p className="text-gray-600 text-sm">Managing {children?.length || 0} hero{children?.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Total Family XP</span>
                  <span className="font-bold text-coral">{(children?.reduce((total, c) => total + (c.totalXp || 0), 0) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Active Heroes</span>
                  <span className="font-bold text-mint">{children?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Account Type</span>
                  <span className="font-bold text-sky">Parent</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Hero Profile Cards */}
        <div className="mb-8 space-y-4">
          {children?.sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0)).map((childData, index) => {
            const isTopScorer = index === 0 && children.length > 1; // Top scorer only if multiple children
            return (
              <Card key={childData.id} className={`fun-card p-4 sm:p-6 border-4 ${isTopScorer ? 'border-sunshine bg-gradient-to-r from-sunshine/10 to-mint/10' : 'border-sky'}`}>
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <div className="relative flex-shrink-0">
                    <img 
                      src={childData.avatarUrl || getAvatarImage(childData.avatarType)} 
                      alt={`${childData.name}'s Hero`} 
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-sunshine avatar-glow object-cover"
                    />
                    {isTopScorer && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-sunshine rounded-full flex items-center justify-center border-2 border-white">
                        <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h3 className="font-fredoka text-xl sm:text-2xl text-gray-800">{childData.name}</h3>
                      {isTopScorer && <span className="text-sunshine text-sm font-bold">🏆 Top Scorer</span>}
                    </div>
                    <p className="text-gray-600 text-sm">Level {childData.level} {childData.avatarType.charAt(0).toUpperCase() + childData.avatarType.slice(1)} Hero</p>
                    
                    {/* Login Credentials Display */}
                    <div className="mt-3 p-3 bg-turquoise/10 border border-turquoise/20 rounded-lg">
                      <div className="text-xs text-turquoise font-semibold mb-2">🔑 Login Info for {childData.name}</div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-xs text-gray-500">Username</div>
                          <div className="font-mono font-bold text-turquoise">{childData.username || 'Not set'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">PIN</div>
                          <div className="font-mono font-bold text-turquoise text-lg tracking-wider">{childData.pin || 'Not set'}</div>
                        </div>
                      </div>
                      {(!childData.username || !childData.pin) && (
                        <Button
                          size="sm"
                          className="mt-2 bg-turquoise hover:bg-turquoise/80 text-white text-xs"
                          onClick={() => generateLoginCredentials(childData.id, childData.name)}
                        >
                          Generate Login
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                      <span className="px-2 py-1 bg-sunshine/20 text-sunshine-dark rounded-full text-xs font-bold">
                        {childData.totalXp.toLocaleString()} XP
                      </span>
                      <span className="px-2 py-1 bg-coral/20 text-coral-dark rounded-full text-xs font-bold">
                        {childData.rewardPoints} Points
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-8">
          <div className="bounce-in" style={{ animationDelay: '0.1s' }}>
            <Card className="fun-card p-3 sm:p-6 text-center border-4 border-mint">
              <TrendingUp className="w-8 h-8 sm:w-12 sm:h-12 text-mint mx-auto mb-2 sm:mb-3" />
              <div className="font-bold text-2xl sm:text-3xl text-gray-800">{completionRate}%</div>
              <div className="text-gray-600 font-bold text-xs sm:text-base">Completion Rate</div>
            </Card>
          </div>
          <div className="bounce-in" style={{ animationDelay: '0.2s' }}>
            <Card className="fun-card p-3 sm:p-6 text-center border-4 border-orange-500">
              <Flame className="w-8 h-8 sm:w-12 sm:h-12 text-orange-500 mx-auto mb-2 sm:mb-3" />
              <div className="font-bold text-2xl sm:text-3xl text-gray-800">{currentStreak}</div>
              <div className="text-gray-600 font-bold text-xs sm:text-base">Current Streak</div>
            </Card>
          </div>
          <div className="bounce-in" style={{ animationDelay: '0.3s' }}>
            <Card className="fun-card p-3 sm:p-6 text-center border-4 border-sunshine">
              <Trophy className="w-8 h-8 sm:w-12 sm:h-12 text-sunshine mx-auto mb-2 sm:mb-3" />
              <div className="font-bold text-2xl sm:text-3xl text-gray-800">{badgesEarned}</div>
              <div className="text-gray-600 font-bold text-xs sm:text-base">Badges Earned</div>
            </Card>
          </div>
          <div className="bounce-in" style={{ animationDelay: '0.4s' }}>
            <Card className="fun-card p-3 sm:p-6 text-center border-4 border-coral">
              <Star className="w-8 h-8 sm:w-12 sm:h-12 text-coral mx-auto mb-2 sm:mb-3" />
              <div className="font-bold text-2xl sm:text-3xl text-gray-800">{child?.level || 1}</div>
              <div className="text-gray-600 font-bold text-xs sm:text-base">Current Level</div>
            </Card>
          </div>
        </div>

        {/* Management Sections */}
        <div className="space-y-8">
          {/* Habit Management Section */}
          <div className="bounce-in" style={{ animationDelay: '0.2s' }}>
            <HabitManagementSection 
              childId={child?.id || ''} 
              showAddHabit={showAddHabit} 
              setShowAddHabit={setShowAddHabit}
              showHabitAssignment={showHabitAssignment}
              setShowHabitAssignment={setShowHabitAssignment}
              children={children || []}
            />
          </div>

          {/* Habit Approval Section */}
          <div className="bounce-in" style={{ animationDelay: '0.25s' }}>
            <HabitApproval children={children} />
          </div>

          {/* Kids Management Section */}
          <div className="bounce-in" style={{ animationDelay: '0.3s' }}>
            <KidsManagementSection 
              children={children} 
              createHeroMutation={createHeroMutation}
              deleteChildMutation={deleteChildMutation}
              getAvatarImage={getAvatarImage}
              showAddHero={showAddHero}
              setShowAddHero={setShowAddHero}
              newHeroName={newHeroName}
              setNewHeroName={setNewHeroName}
              newAvatarType={newAvatarType}
              setNewAvatarType={setNewAvatarType}
              avatarTypes={avatarTypes}
              imagePreview={imagePreview}
              handleImageUpload={handleImageUpload}
            />
          </div>

          {/* Reward Settings Section */}
          <div className="bounce-in" style={{ animationDelay: '0.35s' }}>
            <RewardSettingsSection childId={child?.id || ''} showAddReward={showAddReward} setShowAddReward={setShowAddReward} />
          </div>

          {/* Reward Approval Section */}
          <div className="bounce-in" style={{ animationDelay: '0.4s' }}>
            <RewardApprovalSection childId={child?.id || ''} />
          </div>

          {/* Progress Reports Section */}
          <div className="bounce-in" style={{ animationDelay: '0.45s' }}>
            <Card className="fun-card p-4 sm:p-8 border-4 border-coral">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center">
                  <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-coral mr-2 sm:mr-3" />
                  <div>
                    <h3 className="font-fredoka text-xl sm:text-2xl text-gray-800 hero-title">📊 Progress Reports</h3>
                    <p className="text-gray-600 text-sm sm:text-base">View detailed analytics and insights</p>
                  </div>
                </div>
                <Link href="/progress-reports">
                  <Button className="bg-coral hover:bg-coral/80 text-white">
                    View Reports
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-mint/10 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{completionRate}%</div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
                <div className="text-center p-4 bg-orange-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{currentStreak}</div>
                  <div className="text-sm text-gray-600">Day Streak</div>
                </div>
                <div className="text-center p-4 bg-sunshine/10 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{(habits as any[])?.filter(h => h.isActive).length || 0}</div>
                  <div className="text-sm text-gray-600">Active Habits</div>
                </div>
                <div className="text-center p-4 bg-coral/10 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{child?.level || 1}</div>
                  <div className="text-sm text-gray-600">Level</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Subscription Management Section */}
          <div className="bounce-in" style={{ animationDelay: '0.5s' }}>
            <SubscriptionManagementCard />
          </div>

          {/* Parental Controls Section */}
          <div className="bounce-in" style={{ animationDelay: '0.55s' }}>
            <Card 
              className="fun-card p-4 sm:p-8 border-4 border-red-500 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setShowParentControls(true)}
              data-testid="card-parental-controls"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-fredoka text-xl sm:text-2xl text-gray-800 hero-title flex items-center">
                    <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mr-2 sm:mr-3" />
                    🛡️ Parent Controls
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">Per-child screen time, bedtime, app features & emergency controls</p>
                </div>
                <div className="text-red-500">
                  <Settings className="w-8 h-8" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Parent Controls Modal */}
      <ParentControlsModal 
        isOpen={showParentControls}
        onClose={() => setShowParentControls(false)}
        children={children || []}
      />
      
      {/* Onboarding Tutorial */}
      <ParentProfileModal
        isOpen={showParentProfile}
        onClose={() => setShowParentProfile(false)}
        user={user as User}
      />

      <OnboardingTutorial 
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
      
      {/* Habit Assignment Modal */}
      {showHabitAssignment && (
        <HabitAssignmentModal 
          isOpen={showHabitAssignment}
          onClose={() => setShowHabitAssignment(false)}
          children={children || []}
        />
      )}
    </div>
  );
}

// New Habit Assignment Modal Component - Shows all habits with Active/Inactive status
function HabitAssignmentModal({ 
  isOpen, 
  onClose, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  children: Child[];
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all master habits for parent
  const { data: masterHabits, isLoading } = useQuery<MasterHabit[]>({
    queryKey: ["/api/habits/master"],
    enabled: isOpen
  });

  // Get current child habit assignments
  const { data: allHabits } = useQuery<(Habit & { childName?: string })[]>({
    queryKey: ["/api/habits/all"],
    enabled: isOpen
  });

  // Toggle habit active/inactive status
  const toggleHabitStatusMutation = useMutation({
    mutationFn: async ({ habitId, isActive }: { habitId: string; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/habits/${habitId}`, { isActive });
    },
    onSuccess: () => {
      toast({
        title: "Habit Status Updated!",
        description: "Habit status has been changed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/habits/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update habit status.",
        variant: "destructive",
      });
    },
  });

  // Assign habit to child
  const assignHabitMutation = useMutation({
    mutationFn: async ({ childId, habitData }: { childId: string; habitData: any }) => {
      await apiRequest("POST", `/api/children/${childId}/habits`, habitData);
    },
    onSuccess: () => {
      toast({
        title: "Habit Assigned!",
        description: "Habit has been assigned to child successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/habits/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign habit to child.",
        variant: "destructive",
      });
    },
  });

  // Remove habit assignment from child
  const removeHabitMutation = useMutation({
    mutationFn: async ({ habitId }: { habitId: string }) => {
      await apiRequest("DELETE", `/api/habits/${habitId}`);
    },
    onSuccess: () => {
      toast({
        title: "Habit Removed!",
        description: "Habit has been removed from child.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/habits/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove habit from child.",
        variant: "destructive",
      });
    },
  });

  // Group current habit assignments by master habit ID
  const habitAssignmentsByMaster = React.useMemo(() => {
    if (!allHabits) return {};
    
    const groups: Record<string, (Habit & { childName?: string })[]> = {};
    allHabits.forEach(habit => {
      const masterHabitId = habit.masterHabitId || 'legacy-' + habit.id; // Handle legacy habits
      if (!groups[masterHabitId]) {
        groups[masterHabitId] = [];
      }
      groups[masterHabitId].push(habit);
    });
    
    return groups;
  }, [allHabits]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-fredoka text-2xl text-gray-800">🎯 Habit Assignment Center</h3>
              <p className="text-gray-600">Manage which habits are active for each child</p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {children.length < 2 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">You need at least 2 children to manage individual habit assignments.</p>
              <p className="text-sm text-gray-500 mt-2">Add more children to use this feature.</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-turquoise mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading habits...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Children Header */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gradient-to-r from-turquoise/10 to-sky/10 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800 mb-3">👥 Your Children ({children.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {children.map((child) => (
                      <div key={child.id} className="flex items-center space-x-2 bg-white/50 p-2 rounded">
                        <div className="w-8 h-8 rounded-full bg-coral text-white flex items-center justify-center font-bold text-sm">
                          {child.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{child.name}</div>
                          <div className="text-xs text-gray-500">Level {child.level}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Habits Assignment Grid */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-800">📋 Habit Assignment Overview</h4>
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <p><strong>Active habits</strong> appear in children's daily habit list</p>
                  <p><strong>Inactive habits</strong> are hidden from children and won't sync to their devices</p>
                </div>

                {!masterHabits || masterHabits.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No master habits created yet</p>
                    <p className="text-sm text-gray-500 mt-1">Create habits in the Habit Management section first</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {masterHabits.map((masterHabit) => {
                      const habitAssignments = habitAssignmentsByMaster[masterHabit.id] || [];
                      
                      return (
                        <Card key={masterHabit.id} className="p-4 border-2 border-gray-200">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{masterHabit.icon}</span>
                              <div>
                                <h5 className="font-bold text-gray-800">{masterHabit.name}</h5>
                                <p className="text-sm text-gray-600">{masterHabit.description || 'No description'}</p>
                                <div className="text-xs text-gray-500 mt-1">
                                  {masterHabit.xpReward} XP • {masterHabit.frequency} • {masterHabit.color}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Child Assignment Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {children.map((child) => {
                              const childHabit = habitAssignments.find(h => h.childId === child.id);
                              const hasHabit = !!childHabit;
                              const isActive = childHabit?.isActive ?? false;

                              return (
                                <div key={child.id} className={`p-3 rounded-lg border-2 ${
                                  hasHabit 
                                    ? isActive 
                                      ? 'border-green-300 bg-green-50' 
                                      : 'border-yellow-300 bg-yellow-50'
                                    : 'border-gray-200 bg-gray-50'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-6 h-6 rounded-full bg-coral text-white flex items-center justify-center font-bold text-xs">
                                        {child.name.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="font-medium text-sm">{child.name}</span>
                                    </div>
                                    
                                    {hasHabit ? (
                                      <div className="flex items-center space-x-2">
                                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                                          isActive ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                                        }`}>
                                          {isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            toggleHabitStatusMutation.mutate({
                                              habitId: childHabit!.id,
                                              isActive: !isActive
                                            });
                                          }}
                                          disabled={toggleHabitStatusMutation.isPending}
                                          className="h-6 w-12 p-1 text-xs"
                                          data-testid={`button-toggle-habit-${child.id}`}
                                        >
                                          {isActive ? '⏸️' : '▶️'}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            removeHabitMutation.mutate({
                                              habitId: childHabit!.id
                                            });
                                          }}
                                          disabled={removeHabitMutation.isPending}
                                          className="h-6 w-6 p-1 text-xs text-red-600 hover:bg-red-100"
                                          data-testid={`button-remove-habit-${child.id}`}
                                        >
                                          ❌
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          assignHabitMutation.mutate({
                                            childId: child.id,
                                            habitData: {
                                              masterHabitId: masterHabit.id,
                                              name: masterHabit.name,
                                              description: masterHabit.description,
                                              icon: masterHabit.icon,
                                              color: masterHabit.color,
                                              frequency: masterHabit.frequency,
                                              xpReward: masterHabit.xpReward,
                                              isActive: true
                                            }
                                          });
                                        }}
                                        disabled={assignHabitMutation.isPending || !masterHabit.isActive}
                                        className={`text-xs px-3 py-1 h-7 ${
                                          !masterHabit.isActive 
                                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                                        }`}
                                        data-testid={`button-assign-habit-${child.id}`}
                                      >
                                        {assignHabitMutation.isPending 
                                          ? 'Adding...' 
                                          : !masterHabit.isActive 
                                            ? 'Inactive' 
                                            : 'Assign'
                                        }
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Summary Stats */}
              <div className="border-t pt-4 mt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-turquoise/10 rounded-lg">
                    <div className="text-xl font-bold text-gray-800">{masterHabits?.length || 0}</div>
                    <div className="text-sm text-gray-600">Total Habits</div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <div className="text-xl font-bold text-gray-800">
                      {allHabits?.filter((h: any) => h.isActive).length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Active Assignments</div>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <div className="text-xl font-bold text-gray-800">
                      {allHabits?.filter((h: any) => !h.isActive).length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Inactive Assignments</div>
                  </div>
                  <div className="p-3 bg-coral/10 rounded-lg">
                    <div className="text-xl font-bold text-gray-800">{children.length}</div>
                    <div className="text-sm text-gray-600">Children</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// Habit Management Section Component
function HabitManagementSection({ childId, showAddHabit, setShowAddHabit, showHabitAssignment, setShowHabitAssignment, children }: { 
  childId: string; 
  showAddHabit: boolean; 
  setShowAddHabit: (show: boolean) => void;
  showHabitAssignment: boolean; 
  setShowHabitAssignment: (show: boolean) => void;
  children: Child[];
}) {
  const { toast } = useToast();
  const [habitName, setHabitName] = useState("");
  const [habitDescription, setHabitDescription] = useState("");
  const [habitIcon, setHabitIcon] = useState("⚡");
  const [habitXP, setHabitXP] = useState("50");
  const [habitColor, setHabitColor] = useState("turquoise");
  const [editingHabit, setEditingHabit] = useState<string | null>(null);
  const [editHabitName, setEditHabitName] = useState("");
  const [editHabitDescription, setEditHabitDescription] = useState("");
  const [editHabitIcon, setEditHabitIcon] = useState("⚡");
  const [editHabitXP, setEditHabitXP] = useState("50");
  const [editHabitColor, setEditHabitColor] = useState("turquoise");

  // Get master habits for this parent
  const { data: masterHabits, isLoading } = useQuery<MasterHabit[]>({
    queryKey: ["/api/habits/master"],
  });

  // Also get child-specific habits for this specific child (for display)
  const { data: childHabits } = useQuery<Habit[]>({
    queryKey: [`/api/children/${childId}/habits`],
  });

  const createMasterHabitMutation = useMutation({
    mutationFn: async (habitData: any) => {
      await apiRequest("POST", `/api/habits/master`, habitData);
    },
    onSuccess: () => {
      toast({
        title: "Master Habit Created! 🎯",
        description: "New master habit template created! Use Assignment Center to assign to children.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/habits/master"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits/all"] });
      setHabitName("");
      setHabitDescription("");
      setHabitIcon("⚡");
      setHabitXP("50");
      setHabitColor("turquoise");
      setShowAddHabit(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create master habit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMasterHabitMutation = useMutation({
    mutationFn: async (data: { masterHabitId: string; updates: any }) => {
      await apiRequest("PATCH", `/api/habits/master/${data.masterHabitId}`, data.updates);
    },
    onSuccess: () => {
      toast({
        title: "Master Habit Updated! 🎯",
        description: "Master habit has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/habits/master"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits/all"] });
      setEditingHabit(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update master habit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const editHabitMutation = useMutation({
    mutationFn: async (data: { habitId: string; updates: any }) => {
      await apiRequest("PATCH", `/api/habits/${data.habitId}`, data.updates);
    },
    onSuccess: () => {
      toast({
        title: "Habit Updated! 🎯",
        description: "Habit has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/habits`] });
      setEditingHabit(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update habit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteHabitMutation = useMutation({
    mutationFn: async (habitId: string) => {
      await apiRequest("DELETE", `/api/habits/${habitId}`);
    },
    onSuccess: () => {
      toast({
        title: "Habit Deleted! 🗑️",
        description: "Habit has been removed successfully!",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/habits`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete habit. Please try again.",
        variant: "destructive",
      });
    },
  });

  // For child habit status updates (assignment-level)
  const toggleHabitStatusMutation = useMutation({
    mutationFn: async ({ habitId, isActive }: { habitId: string; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/habits/${habitId}`, { isActive });
    },
    onSuccess: () => {
      toast({
        title: "Habit Status Updated!",
        description: "Habit status has been changed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/habits`] });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] }); // Refresh child data for sync
      queryClient.invalidateQueries({ queryKey: ["/api/habits/all"] }); // Refresh master habits
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update habit status.",
        variant: "destructive",
      });
    },
  });

  // For master habit status updates (template-level)
  const toggleMasterHabitStatusMutation = useMutation({
    mutationFn: async ({ habitId, isActive }: { habitId: string; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/master-habits/${habitId}`, { isActive });
    },
    onSuccess: () => {
      toast({
        title: "Master Habit Status Updated!",
        description: "Master habit status has been changed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/habits/all"] }); // Refresh master habits
      queryClient.invalidateQueries({ queryKey: ["/api/children"] }); // Refresh child data for sync
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update master habit status.",
        variant: "destructive",
      });
    },
  });

  const handleAddHabit = () => {
    if (!habitName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the habit!",
        variant: "destructive",
      });
      return;
    }
    createMasterHabitMutation.mutate({
      name: habitName.trim(),
      description: habitDescription.trim(),
      icon: habitIcon,
      xpReward: parseInt(habitXP),
      color: habitColor,
      frequency: "daily",
    });
  };

  return (
    <Card className="fun-card p-4 sm:p-8 border-4 border-turquoise">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center">
          <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-turquoise mr-2 sm:mr-3" />
          <div>
            <h3 className="font-fredoka text-xl sm:text-2xl text-gray-800 hero-title">📋 Habit Management</h3>
            <p className="text-gray-600 text-sm sm:text-base">Manage daily habits and control active/inactive status</p>
          </div>
        </div>
        {masterHabits && masterHabits.length > 0 && (
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1 bg-green-100 px-3 py-1 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium text-green-800">
                {masterHabits.length} Master Habits
              </span>
            </div>
            <div className="flex items-center space-x-1 bg-blue-100 px-3 py-1 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-blue-800">
                {childHabits?.filter(h => h.isActive).length || 0} Assigned
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Status Explanation */}
      {masterHabits && masterHabits.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <h4 className="font-semibold text-blue-800 mb-2">🎯 Master Habit System</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• <span className="font-medium">Master habits</span> are templates you can assign to any child</p>
            <p>• Use the <span className="font-medium">Assignment Center</span> to assign master habits to specific children</p>
            <p>• Each child can have different habits active/inactive independently</p>
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-turquoise border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {masterHabits?.map((habit) => (
            <div key={habit.id} className="p-4 bg-turquoise/10 rounded-lg border-2 border-turquoise/30">
              {editingHabit === habit.id ? (
                <div className="space-y-3">
                  <Input
                    value={editHabitName}
                    onChange={(e) => setEditHabitName(e.target.value)}
                    placeholder="Habit name"
                    className="border-2 border-turquoise"
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        updateMasterHabitMutation.mutate({
                          masterHabitId: habit.id,
                          updates: {
                            name: editHabitName,
                            description: editHabitDescription,
                            icon: editHabitIcon,
                            xpReward: parseInt(editHabitXP),
                            color: editHabitColor,
                          }
                        });
                      }}
                      disabled={updateMasterHabitMutation.isPending}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      {editHabitMutation.isPending ? "Saving..." : "💾 Save"}
                    </Button>
                    <Button
                      onClick={() => setEditingHabit(null)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{habit.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="font-bold text-gray-800">{habit.name}</div>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          habit.isActive 
                            ? 'bg-green-200 text-green-800' 
                            : 'bg-yellow-200 text-yellow-800'
                        }`}>
                          {habit.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">{habit.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {habit.isActive 
                          ? "Appears in child's daily habit list" 
                          : "Hidden from child - won't sync to their device"
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right mr-4">
                      <div className="text-sm font-bold text-turquoise">{habit.xpReward} XP</div>
                      <div className="text-xs text-gray-500">Reward</div>
                    </div>
                    <Button
                      onClick={() => {
                        toggleMasterHabitStatusMutation.mutate({
                          habitId: habit.id,
                          isActive: !habit.isActive
                        });
                      }}
                      disabled={toggleMasterHabitStatusMutation.isPending}
                      className={`px-3 py-1 text-xs font-medium ${
                        habit.isActive 
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {toggleMasterHabitStatusMutation.isPending 
                        ? "..." 
                        : habit.isActive 
                          ? "⏸️ Make Inactive" 
                          : "▶️ Make Active"
                      }
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingHabit(habit.id);
                        setEditHabitName(habit.name);
                        setEditHabitDescription(habit.description || "");
                        setEditHabitIcon(habit.icon);
                        setEditHabitXP(habit.xpReward.toString());
                        setEditHabitColor(habit.color || "turquoise");
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs"
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm(`Delete "${habit.name}" habit? This cannot be undone.`)) {
                          deleteHabitMutation.mutate(habit.id);
                        }
                      }}
                      disabled={deleteHabitMutation.isPending}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs"
                    >
                      {deleteHabitMutation.isPending ? "..." : "🗑️"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {!showAddHabit ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <Button 
                  onClick={() => setShowAddHabit(true)}
                  className="bg-turquoise hover:bg-turquoise/80 text-white font-bold"
                >
                  + Add New Habit
                </Button>
                <Button 
                  onClick={() => setShowHabitAssignment(true)}
                  className="bg-sky hover:bg-sky/80 text-white font-bold"
                  disabled={!children || children.length < 2}
                >
                  🔄 Manage Assignments
                </Button>
              </div>
              
              {children && children.length < 2 && (
                <div className="text-sm text-gray-500 mb-4 p-3 bg-blue-50 rounded-lg">
                  💡 Add more children to use the individual habit assignment feature
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 p-4 bg-turquoise/10 rounded-lg border-2 border-turquoise/30">
              <h4 className="font-bold text-gray-800">Create New Habit</h4>
              
              <div className="space-y-3">
                <Input
                  placeholder="Habit name (e.g., Brush Teeth)"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={habitDescription}
                  onChange={(e) => setHabitDescription(e.target.value)}
                  rows={2}
                />
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-bold text-gray-700">Icon</label>
                    <Select value={habitIcon} onValueChange={setHabitIcon}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="⚡">⚡ Energy</SelectItem>
                        <SelectItem value="🦷">🦷 Teeth</SelectItem>
                        <SelectItem value="📚">📚 Reading</SelectItem>
                        <SelectItem value="🏃">🏃 Exercise</SelectItem>
                        <SelectItem value="🥗">🥗 Healthy Food</SelectItem>
                        <SelectItem value="💤">💤 Sleep</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700">XP Reward</label>
                    <Select value={habitXP} onValueChange={setHabitXP}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25 XP</SelectItem>
                        <SelectItem value="50">50 XP</SelectItem>
                        <SelectItem value="75">75 XP</SelectItem>
                        <SelectItem value="100">100 XP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700">Color</label>
                    <Select value={habitColor} onValueChange={setHabitColor}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="turquoise">🔵 Turquoise</SelectItem>
                        <SelectItem value="coral">🔴 Coral</SelectItem>
                        <SelectItem value="sunshine">🟡 Sunshine</SelectItem>
                        <SelectItem value="mint">🟢 Mint</SelectItem>
                        <SelectItem value="purple">🟣 Purple</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleAddHabit}
                  disabled={createMasterHabitMutation.isPending}
                  className="flex-1 bg-turquoise hover:bg-turquoise/80 text-white"
                >
                  {createMasterHabitMutation.isPending ? "Creating..." : "🎯 Create Master Habit"}
                </Button>
                <Button 
                  onClick={() => setShowAddHabit(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// Kids Management Section Component
function KidsManagementSection({ 
  children, 
  createHeroMutation,
  deleteChildMutation,
  getAvatarImage,
  showAddHero,
  setShowAddHero,
  newHeroName,
  setNewHeroName,
  newAvatarType,
  setNewAvatarType,
  avatarTypes,
  imagePreview,
  handleImageUpload
}: { 
  children: Child[]; 
  createHeroMutation: any;
  deleteChildMutation: any;
  getAvatarImage: (type: string) => string;
  showAddHero: boolean;
  setShowAddHero: (show: boolean) => void;
  newHeroName: string;
  setNewHeroName: (name: string) => void;
  newAvatarType: string;
  setNewAvatarType: (type: string) => void;
  avatarTypes: any[];
  imagePreview: string;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingChild, setEditingChild] = useState<string | null>(null);
  const [editingCredentials, setEditingCredentials] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [editChildName, setEditChildName] = useState("");
  const [editChildAvatarType, setEditChildAvatarType] = useState("");
  const [editImagePreview, setEditImagePreview] = useState("");

  const updateCredentialsMutation = useMutation({
    mutationFn: async (data: { childId: string; username: string; pin: string }) => {
      await apiRequest("PATCH", `/api/children/${data.childId}`, {
        username: data.username,
        pin: data.pin
      });
    },
    onSuccess: () => {
      toast({
        title: "Login Credentials Updated! 🔐",
        description: "Child can now log in with their username and PIN!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      setEditingCredentials(null);
      setUsername("");
      setPin("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update credentials. Username might already be taken.",
        variant: "destructive",
      });
    },
  });

  const updateChildMutation = useMutation({
    mutationFn: async (data: { childId: string; name: string; avatarType: string; avatarUrl?: string }) => {
      await apiRequest("PATCH", `/api/children/${data.childId}`, {
        name: data.name,
        avatarType: data.avatarType,
        avatarUrl: data.avatarUrl
      });
    },
    onSuccess: () => {
      toast({
        title: "Hero Updated! ✨",
        description: "Hero profile has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      setEditingChild(null);
      setEditChildName("");
      setEditChildAvatarType("");
      setEditImagePreview("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update hero profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateCredentials = (childId: string) => {
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username for the child!",
        variant: "destructive",
      });
      return;
    }
    if (!pin.trim() || pin.length !== 4) {
      toast({
        title: "PIN required",
        description: "Please enter a 4-digit PIN!",
        variant: "destructive",
      });
      return;
    }
    updateCredentialsMutation.mutate({ childId, username: username.trim(), pin: pin.trim() });
  };

  const handleAddHero = () => {
    if (!newHeroName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the hero!",
        variant: "destructive",
      });
      return;
    }
    
    const heroData: any = { 
      name: newHeroName.trim(), 
      avatarType: newAvatarType 
    };
    
    if (imagePreview) {
      heroData.avatarUrl = imagePreview;
    }
    
    createHeroMutation.mutate(heroData);
    setNewHeroName("");
    setNewAvatarType("robot");
    setShowAddHero(false);
  };

  return (
    <Card className="fun-card p-4 sm:p-8 border-4 border-purple-500">
      <div className="flex items-center mb-4 sm:mb-6">
        <UserRound className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 mr-2 sm:mr-3" />
        <div>
          <h3 className="font-fredoka text-xl sm:text-2xl text-gray-800 hero-title">👨‍👩‍👧‍👦 Kids Management</h3>
          <p className="text-gray-600 text-sm sm:text-base">Manage all your children's hero accounts</p>
        </div>
      </div>
      
      <div className="space-y-3 sm:space-y-4 mb-6">
        {children.map((child) => (
          <div key={child.id} className="p-3 sm:p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="relative flex-shrink-0">
                  <img 
                    src={child.avatarUrl || getAvatarImage(child.avatarType)} 
                    alt={child.name} 
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-purple-300 object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-gray-800 text-sm sm:text-base truncate">{child.name}</div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Level {child.level} • {child.avatarType.charAt(0).toUpperCase() + child.avatarType.slice(1)} Hero
                  </div>
                  <div className="text-xs mt-1">
                    {child.username ? (
                      <span className="text-green-600 font-medium">✅ Login: {child.username}</span>
                    ) : (
                      <span className="text-orange-600 font-medium">⚠️ No login set up</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="text-left sm:text-right">
                  <div className="text-sm font-bold text-purple-600">{child.totalXp.toLocaleString()} XP</div>
                  <div className="text-xs text-gray-500">Total Earned</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      setEditingChild(editingChild === child.id ? null : child.id);
                      setEditChildName(child.name);
                      setEditChildAvatarType(child.avatarType);
                      setEditImagePreview("");
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 sm:px-3 py-1 text-xs"
                  >
                    ✏️ Edit
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingCredentials(editingCredentials === child.id ? null : child.id);
                      setUsername(child.username || "");
                      setPin("");
                    }}
                    className={`${child.username ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'} text-white px-2 sm:px-3 py-1 text-xs`}
                  >
                    {child.username ? '🔐 Edit Login' : '🔐 Setup Login'}
                  </Button>
                  <Button
                    onClick={() => {
                      if (confirm(`Delete ${child.name}'s hero profile? This cannot be undone.`)) {
                        deleteChildMutation.mutate(child.id);
                      }
                    }}
                    disabled={deleteChildMutation.isPending}
                    className="bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 py-1 text-xs"
                  >
                    {deleteChildMutation.isPending ? "..." : "🗑️"}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Edit Child Profile */}
            {editingChild === child.id && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <h4 className="font-bold text-gray-800 mb-3">✏️ Edit Hero Profile</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-bold text-gray-700">Hero Name</label>
                    <Input
                      type="text"
                      placeholder="Enter hero name..."
                      value={editChildName}
                      onChange={(e) => setEditChildName(e.target.value)}
                      className="border-2 border-blue-300"
                    />
                  </div>
                  
                  {/* Avatar Type Selection */}
                  <div>
                    <label className="text-sm font-bold text-gray-700">Hero Type</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {avatarTypes.map((type) => (
                        <div
                          key={type.id}
                          onClick={() => setEditChildAvatarType(type.id)}
                          className={`p-2 rounded-lg cursor-pointer border-2 text-center ${
                            editChildAvatarType === type.id
                              ? 'border-blue-500 bg-blue-100'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="text-xl mb-1">{type.name.split(' ')[0]}</div>
                          <div className="text-xs text-gray-600">{type.name.split(' ').slice(1).join(' ')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Image Upload */}
                  <div>
                    <label className="text-sm font-bold text-gray-700">Custom Avatar (Optional)</label>
                    <div className="flex items-center space-x-3 mt-2">
                      {editImagePreview ? (
                        <img src={editImagePreview} alt="Preview" className="w-12 h-12 rounded-full border-2 border-blue-300 object-cover" />
                      ) : (
                        <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center bg-gray-50">
                          <span className="text-gray-400 text-xs">📷</span>
                        </div>
                      )}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleEditImageUpload(e.target.files[0])}
                          className="hidden"
                          id={`edit-avatar-${child.id}`}
                        />
                        <label
                          htmlFor={`edit-avatar-${child.id}`}
                          className="inline-block px-3 py-2 bg-blue-100 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-200 transition-colors text-sm font-bold"
                        >
                          📷 Upload
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        updateChildMutation.mutate({
                          childId: child.id,
                          name: editChildName.trim(),
                          avatarType: editChildAvatarType,
                          avatarUrl: editImagePreview || undefined
                        });
                      }}
                      disabled={updateChildMutation.isPending || !editChildName.trim()}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {updateChildMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>✨ Save Changes</>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingChild(null);
                        setEditChildName("");
                        setEditChildAvatarType("");
                        setEditImagePreview("");
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Login Credentials Setup */}
            {editingCredentials === child.id && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <h4 className="font-bold text-gray-800 mb-3">🔐 Setup Child Login</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Create a username and 4-digit PIN so {child.name} can log in independently!
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-bold text-gray-700">Username</label>
                    <Input
                      type="text"
                      placeholder="Choose a fun username..."
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="border-2 border-green-300"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700">4-Digit PIN</label>
                    <Input
                      type="password"
                      placeholder="Enter 4-digit PIN (e.g. 1234)"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.slice(0, 4))}
                      maxLength={4}
                      className="border-2 border-green-300"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleUpdateCredentials(child.id)}
                      disabled={updateCredentialsMutation.isPending}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      {updateCredentialsMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>🔐 Save Login</>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingCredentials(null);
                        setUsername("");
                        setPin("");
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                  {child.username && (
                    <div className="text-sm text-green-600 bg-green-100 p-2 rounded">
                      ✅ {child.name} can log in with username: <strong>{child.username}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {!showAddHero ? (
        <Button 
          onClick={() => setShowAddHero(true)}
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Hero
        </Button>
      ) : (
        <div className="space-y-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
          <h4 className="font-bold text-gray-800">Create New Hero</h4>
          
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="Enter hero name..."
              value={newHeroName}
              onChange={(e) => setNewHeroName(e.target.value)}
              className="border-2 border-purple-300"
            />
            
            {/* Image Upload Section */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Custom Avatar Image (Optional)</label>
              <div className="flex items-center space-x-4">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-16 h-16 rounded-full border-2 border-purple-300 object-cover"
                    />
                    <button
                      onClick={() => window.location.reload()}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center bg-gray-50">
                    <span className="text-gray-400 text-xs">📷</span>
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    className="hidden"
                    id="avatar-upload-new"
                  />
                  <label
                    htmlFor="avatar-upload-new"
                    className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-lg cursor-pointer hover:bg-purple-200 transition-colors text-sm font-bold"
                  >
                    📷 Upload Image
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Upload a custom avatar or use default type below</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {avatarTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setNewAvatarType(type.id)}
                  className={`p-3 rounded-lg cursor-pointer border-2 text-center ${
                    newAvatarType === type.id
                      ? 'border-purple-500 bg-purple-100'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.name.split(' ')[0]}</div>
                  <div className="text-xs text-gray-600">{type.name.split(' ').slice(1).join(' ')}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={handleAddHero}
              disabled={createHeroMutation.isPending}
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
            >
              {createHeroMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Hero
            </Button>
            <Button 
              onClick={() => setShowAddHero(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// Reward Settings Section Component
function RewardSettingsSection({ childId, showAddReward, setShowAddReward }: { 
  childId: string; 
  showAddReward: boolean; 
  setShowAddReward: (show: boolean) => void; 
}) {
  const { toast } = useToast();
  const [rewardName, setRewardName] = useState("");
  const [rewardDescription, setRewardDescription] = useState("");
  const [rewardCost, setRewardCost] = useState("100");
  const [rewardIcon, setRewardIcon] = useState("🎁");
  const [editingReward, setEditingReward] = useState<string | null>(null);
  const [editRewardName, setEditRewardName] = useState("");
  const [editRewardDescription, setEditRewardDescription] = useState("");
  const [editRewardCost, setEditRewardCost] = useState("100");
  const [editRewardIcon, setEditRewardIcon] = useState("🎁");

  const { data: rewards, isLoading } = useQuery<Reward[]>({
    queryKey: [`/api/children/${childId}/rewards`],
  });

  const createRewardMutation = useMutation({
    mutationFn: async (rewardData: any) => {
      await apiRequest("POST", `/api/children/${childId}/rewards`, rewardData);
    },
    onSuccess: () => {
      toast({
        title: "Reward Created! 🎁",
        description: "New reward has been added successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/rewards`] });
      setRewardName("");
      setRewardDescription("");
      setRewardCost("100");
      setRewardIcon("🎁");
      setShowAddReward(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create reward. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteRewardMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      await apiRequest("DELETE", `/api/rewards/${rewardId}`);
    },
    onSuccess: () => {
      toast({
        title: "Reward Deleted! 🗑️",
        description: "Reward has been removed successfully!",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/rewards`] });
    },
  });

  const updateRewardMutation = useMutation({
    mutationFn: async (data: { rewardId: string; name: string; description: string; icon: string; cost: number }) => {
      await apiRequest("PATCH", `/api/rewards/${data.rewardId}`, {
        name: data.name,
        description: data.description,
        icon: data.icon,
        cost: data.cost
      });
    },
    onSuccess: () => {
      toast({
        title: "Reward Updated! 🎁",
        description: "Reward has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/rewards`] });
      setEditingReward(null);
      setEditRewardName("");
      setEditRewardDescription("");
      setEditRewardCost("100");
      setEditRewardIcon("🎁");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update reward. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddReward = () => {
    if (!rewardName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the reward!",
        variant: "destructive",
      });
      return;
    }
    createRewardMutation.mutate({
      childId,
      name: rewardName.trim(),
      description: rewardDescription.trim(),
      icon: rewardIcon,
      cost: parseInt(rewardCost),
      isActive: true,
    });
  };

  return (
    <Card className="fun-card p-4 sm:p-8 border-4 border-orange-500">
      <div className="flex items-center mb-4 sm:mb-6">
        <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mr-2 sm:mr-3" />
        <div>
          <h3 className="font-fredoka text-xl sm:text-2xl text-gray-800 hero-title">🎁 Reward Settings</h3>
          <p className="text-gray-600 text-sm sm:text-base">Set up rewards for completing habits</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {rewards?.map((reward) => (
            <div key={reward.id} className="space-y-4">
              <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🎁</div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">{reward.name}</div>
                      <div className="text-sm text-gray-600">{reward.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right mr-4">
                      <div className="text-sm font-bold text-orange-600">{reward.cost} XP</div>
                      <div className="text-xs text-gray-500">Cost</div>
                    </div>
                    <Button
                      onClick={() => {
                        setEditingReward(editingReward === reward.id ? null : reward.id);
                        setEditRewardName(reward.name);
                        setEditRewardDescription(reward.description || "");
                        setEditRewardCost(reward.cost.toString());
                        setEditRewardIcon("🎁");
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs"
                    >
                      ✏️
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm(`Delete "${reward.name}" reward? This cannot be undone.`)) {
                          deleteRewardMutation.mutate(reward.id);
                        }
                      }}
                      disabled={deleteRewardMutation.isPending}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs"
                    >
                      {deleteRewardMutation.isPending ? "..." : "🗑️"}
                    </Button>
                  </div>
                </div>
              </div>
              
              {editingReward === reward.id && (
                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <h4 className="font-bold text-gray-800 mb-3">✏️ Edit Reward</h4>
                  <div className="space-y-3">
                    <Input
                      placeholder="Reward name"
                      value={editRewardName}
                      onChange={(e) => setEditRewardName(e.target.value)}
                    />
                    <Textarea
                      placeholder="Description (optional)"
                      value={editRewardDescription}
                      onChange={(e) => setEditRewardDescription(e.target.value)}
                      rows={2}
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-bold text-gray-700">Icon</label>
                        <Select value={editRewardIcon} onValueChange={setEditRewardIcon}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="🎁">🎁 Gift</SelectItem>
                            <SelectItem value="🍭">🍭 Candy</SelectItem>
                            <SelectItem value="🎮">🎮 Game Time</SelectItem>
                            <SelectItem value="📱">📱 Screen Time</SelectItem>
                            <SelectItem value="🎉">🎉 Special Treat</SelectItem>
                            <SelectItem value="⭐">⭐ Gold Star</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-700">XP Cost</label>
                        <Select value={editRewardCost} onValueChange={setEditRewardCost}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="50">50 XP</SelectItem>
                            <SelectItem value="100">100 XP</SelectItem>
                            <SelectItem value="200">200 XP</SelectItem>
                            <SelectItem value="300">300 XP</SelectItem>
                            <SelectItem value="500">500 XP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-3">
                    <Button
                      onClick={() => {
                        updateRewardMutation.mutate({
                          rewardId: reward.id,
                          name: editRewardName.trim(),
                          description: editRewardDescription.trim(),
                          icon: editRewardIcon,
                          cost: parseInt(editRewardCost)
                        });
                      }}
                      disabled={updateRewardMutation.isPending || !editRewardName.trim()}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {updateRewardMutation.isPending ? "Saving..." : "✨ Save Changes"}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingReward(null);
                        setEditRewardName("");
                        setEditRewardDescription("");
                        setEditRewardCost("100");
                        setEditRewardIcon("🎁");
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {!showAddReward ? (
            <Button 
              onClick={() => setShowAddReward(true)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold"
            >
              + Add New Reward
            </Button>
          ) : (
            <div className="space-y-4 p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
              <h4 className="font-bold text-gray-800">Create New Reward</h4>
              
              <div className="space-y-3">
                <Input
                  placeholder="Reward name (e.g., Extra Screen Time)"
                  value={rewardName}
                  onChange={(e) => setRewardName(e.target.value)}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={rewardDescription}
                  onChange={(e) => setRewardDescription(e.target.value)}
                  rows={2}
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-bold text-gray-700">Icon</label>
                    <Select value={rewardIcon} onValueChange={setRewardIcon}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="🎁">🎁 Gift</SelectItem>
                        <SelectItem value="🍭">🍭 Candy</SelectItem>
                        <SelectItem value="🎮">🎮 Game Time</SelectItem>
                        <SelectItem value="📱">📱 Screen Time</SelectItem>
                        <SelectItem value="🎉">🎉 Special Treat</SelectItem>
                        <SelectItem value="⭐">⭐ Gold Star</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700">XP Cost</label>
                    <Select value={rewardCost} onValueChange={setRewardCost}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50 XP</SelectItem>
                        <SelectItem value="100">100 XP</SelectItem>
                        <SelectItem value="200">200 XP</SelectItem>
                        <SelectItem value="300">300 XP</SelectItem>
                        <SelectItem value="500">500 XP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleAddReward}
                  disabled={createRewardMutation.isPending}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {createRewardMutation.isPending ? "Creating..." : "🎁 Create Reward"}
                </Button>
                <Button 
                  onClick={() => setShowAddReward(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// Progress Reports Section Component
function ProgressReportsSection({ childId, showReports, setShowReports }: { 
  childId: string; 
  showReports: boolean; 
  setShowReports: (show: boolean) => void; 
}) {
  const [timeFrame, setTimeFrame] = useState("week");

  const { data: child } = useQuery<Child>({
    queryKey: [`/api/children/${childId}`],
  });

  const { data: habits } = useQuery<Habit[]>({
    queryKey: [`/api/children/${childId}/habits`],
  });

  const { data: completions } = useQuery({
    queryKey: [`/api/children/${childId}/completions`, timeFrame],
  });

  // Mock data for demonstration - in real app would come from API
  const weeklyData = [
    { day: "Mon", xp: 75, habits: 3 },
    { day: "Tue", xp: 100, habits: 4 },
    { day: "Wed", xp: 50, habits: 2 },
    { day: "Thu", xp: 125, habits: 5 },
    { day: "Fri", xp: 75, habits: 3 },
    { day: "Sat", xp: 150, habits: 6 },
    { day: "Sun", xp: 100, habits: 4 },
  ];

  const habitStats = habits?.map(habit => ({
    name: habit.name,
    icon: habit.icon,
    completions: Math.floor(Math.random() * 7) + 1, // Mock data
    streak: Math.floor(Math.random() * 10) + 1, // Mock data
    totalXP: habit.xpReward * (Math.floor(Math.random() * 7) + 1)
  })) || [];

  return (
    <Card className="fun-card p-4 sm:p-8 border-4 border-mint">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <div className="flex items-center">
          <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-mint mr-2 sm:mr-3" />
          <div>
            <h3 className="font-fredoka text-xl sm:text-2xl text-gray-800 hero-title">📊 Progress Reports</h3>
            <p className="text-gray-600 text-sm sm:text-base">Track your child's progress over time</p>
          </div>
        </div>
        <Select value={timeFrame} onValueChange={setTimeFrame}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-mint/10 p-4 rounded-lg border-2 border-mint/30">
          <div className="text-2xl font-bold text-mint">{child?.totalXp || 0}</div>
          <div className="text-sm text-gray-600">Total XP</div>
        </div>
        <div className="bg-orange-100 p-4 rounded-lg border-2 border-orange-300">
          <div className="text-2xl font-bold text-orange-600">{child?.level || 1}</div>
          <div className="text-sm text-gray-600">Current Level</div>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg border-2 border-purple-300">
          <div className="text-2xl font-bold text-purple-600">5</div>
          <div className="text-sm text-gray-600">Best Streak</div>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg border-2 border-blue-300">
          <div className="text-2xl font-bold text-blue-600">{habits?.length || 0}</div>
          <div className="text-sm text-gray-600">Active Habits</div>
        </div>
      </div>

      {/* Weekly XP Chart */}
      <div className="mb-6">
        <h4 className="font-bold text-gray-800 mb-3">Weekly XP Progress</h4>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-end justify-between h-32 space-x-2">
            {weeklyData.map((day, index) => (
              <div key={day.day} className="flex-1 flex flex-col items-center">
                <div 
                  className="bg-mint rounded-t w-full transition-all hover:bg-mint/80"
                  style={{ height: `${(day.xp / 150) * 100}%`, minHeight: '8px' }}
                  title={`${day.xp} XP`}
                ></div>
                <div className="text-xs text-gray-600 mt-2">{day.day}</div>
                <div className="text-xs font-bold text-mint">{day.xp}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Habit Performance */}
      <div>
        <h4 className="font-bold text-gray-800 mb-3">Habit Performance</h4>
        <div className="space-y-3">
          {habitStats.map((habit, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{habit.icon}</div>
                  <div>
                    <div className="font-bold text-gray-800">{habit.name}</div>
                    <div className="text-sm text-gray-600">
                      {habit.completions} completions • {habit.streak} day streak
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-mint">{habit.totalXP} XP</div>
                  <div className="text-xs text-gray-500">Earned</div>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-mint h-2 rounded-full transition-all"
                    style={{ width: `${(habit.completions / 7) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{habit.completions}/7 this week</div>
              </div>
            </div>
          ))}
        </div>
        
        {habitStats.length === 0 && (
          <div className="text-center py-8">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No habits created yet. Add some habits to see progress reports!</p>
          </div>
        )}
      </div>
    </Card>
  );
}



// Reward Approval Section Component
function RewardApprovalSection({ childId }: { childId: string }) {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: pendingRewards, isLoading } = useQuery({
    queryKey: [`/api/children/${childId}/pending-rewards`],
  });

  const { data: rewardTransactions } = useQuery({
    queryKey: [`/api/children/${childId}/reward-transactions`],
  });

  const approveRewardMutation = useMutation({
    mutationFn: async ({ transactionId, approvedBy }: { transactionId: string; approvedBy: string }) => {
      await apiRequest("POST", `/api/reward-transactions/${transactionId}/approve`, { approvedBy });
    },
    onSuccess: () => {
      toast({
        title: "Reward Approved! 🎉",
        description: "Your child can now use their reward points!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/pending-rewards`] });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/reward-transactions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}`] });
    },
    onError: (error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createBonusRewardMutation = useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description: string }) => {
      await apiRequest("POST", `/api/children/${childId}/reward-transactions`, {
        type: 'bonus_earned',
        amount,
        source: 'parent_bonus',
        description,
        requiresApproval: false,
        isApproved: true,
      });
    },
    onSuccess: () => {
      toast({
        title: "Bonus Added! ✨",
        description: "Your child received bonus reward points!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/reward-transactions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}`] });
    },
    onError: (error) => {
      toast({
        title: "Bonus Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pendingRewardsArray = Array.isArray(pendingRewards) ? pendingRewards : [];
  const transactionsArray = Array.isArray(rewardTransactions) ? rewardTransactions.slice(0, 5) : [];
  
  const handleApprove = (transactionId: string) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }
    approveRewardMutation.mutate({ transactionId, approvedBy: user.id });
  };

  const handleGiveBonus = (amount: number, description: string) => {
    createBonusRewardMutation.mutate({ amount, description });
  };

  if (isLoading) {
    return (
      <Card className="fun-card p-6 border-4 border-purple-500">
        <div className="flex items-center space-x-3 mb-4">
          <Gift className="w-6 h-6 text-purple-500" />
          <h3 className="font-fredoka text-xl text-gray-800">Reward Approval</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="fun-card p-6 border-4 border-purple-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Gift className="w-6 h-6 text-purple-500" />
          <div>
            <h3 className="font-fredoka text-xl text-gray-800 hero-title">🎁 Reward Management</h3>
            <p className="text-gray-600">Approve earned rewards and give bonus points</p>
          </div>
        </div>
        {pendingRewardsArray.length > 0 && (
          <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full">
            {pendingRewardsArray.length} pending
          </span>
        )}
      </div>

      {/* Pending Approvals */}
      {pendingRewardsArray.length > 0 && (
        <div className="mb-6">
          <h4 className="font-nunito font-bold text-gray-700 mb-3 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-orange-500" />
            Pending Approvals
          </h4>
          <div className="space-y-3">
            {pendingRewardsArray.map((transaction: any) => (
              <div
                key={transaction.id}
                className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Coins className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-nunito font-semibold text-gray-800">
                      +{transaction.amount} reward points
                    </p>
                    <p className="text-xs text-gray-600">{transaction.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleApprove(transaction.id)}
                  disabled={approveRewardMutation.isPending}
                  className="bg-green-500 hover:bg-green-600 text-white"
                  size="sm"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Bonus Actions */}
      <div className="mb-6">
        <h4 className="font-nunito font-bold text-gray-700 mb-3 flex items-center">
          <Award className="w-4 h-4 mr-2 text-purple-500" />
          Give Bonus Points
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <Button
            onClick={() => handleGiveBonus(10, "Good behavior bonus")}
            disabled={createBonusRewardMutation.isPending}
            variant="outline"
            className="h-16 flex flex-col border-green-200 hover:border-green-400 hover:bg-green-50"
          >
            <span className="font-bold text-green-600">+10</span>
            <span className="text-xs">Good Behavior</span>
          </Button>
          <Button
            onClick={() => handleGiveBonus(25, "Extra effort bonus")}
            disabled={createBonusRewardMutation.isPending}
            variant="outline"
            className="h-16 flex flex-col border-blue-200 hover:border-blue-400 hover:bg-blue-50"
          >
            <span className="font-bold text-blue-600">+25</span>
            <span className="text-xs">Extra Effort</span>
          </Button>
          <Button
            onClick={() => handleGiveBonus(50, "Outstanding achievement")}
            disabled={createBonusRewardMutation.isPending}
            variant="outline"
            className="h-16 flex flex-col border-purple-200 hover:border-purple-400 hover:bg-purple-50"
          >
            <span className="font-bold text-purple-600">+50</span>
            <span className="text-xs">Outstanding!</span>
          </Button>
        </div>
      </div>

      {/* Recent Transactions */}
      {transactionsArray.length > 0 && (
        <div>
          <h4 className="font-nunito font-bold text-gray-700 mb-3">Recent Activity</h4>
          <div className="space-y-2">
            {transactionsArray.map((transaction: any) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <Coins className={`w-3 h-3 ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount} points
                    </p>
                    <p className="text-xs text-gray-500">{transaction.description}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(transaction.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingRewardsArray.length === 0 && transactionsArray.length === 0 && (
        <div className="text-center py-8">
          <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No reward activity yet</p>
          <p className="text-sm text-gray-400">Your child's earned rewards will appear here for approval</p>
        </div>
      )}
    </Card>
  );
}