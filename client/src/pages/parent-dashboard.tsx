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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp, Flame, Trophy, Star, Plus, UserRound, Crown, Zap, Heart, Settings, Gift, BarChart3, Shield, X, Check, Clock, Coins, Award, HelpCircle, Bell, Camera, Mic, Play, Volume2, CheckSquare, Users, Pencil, Trash2, KeyRound, ChevronRight, LogOut } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { queryClient, apiRequest } from "@/lib/queryClient";
import HabitApproval from "../components/parent/habit-approval";
import GamePurchaseApproval from "../components/parent/game-purchase-approval";
import ParentControlsModal from "@/components/parent/ParentControlsModal";
import OnboardingTutorial from "@/components/parent/OnboardingTutorial";
import ParentProfileModal from "@/components/parent/ParentProfileModal";
import BottomNav from "@/components/parent/BottomNav";
import KidsManager from "@/components/parent/KidsManager";
import HabitsManager from "@/components/parent/HabitsManager";
import RewardsManager from "@/components/parent/RewardsManager";
import { SegmentedTabs, FilterPills } from "@/components/parent/SegmentedTabs";
import { TrialBanner } from "@/components/subscription/trial-banner";
import TrialStatusBanner from "@/components/subscription/trial-status-banner";
import SubscriptionManagementCard from "@/components/subscription/subscription-management-card";
import PremiumInterestNudge from "@/components/subscription/PremiumInterestNudge";
import SubscriptionRequiredLayout from "@/components/subscription/subscription-required-layout";
import { requiresSubscription, getSubscriptionStatus } from "@/lib/subscriptionUtils";
import { getAvatarImage } from "@/lib/avatars";
import { HABIT_BADGES, TIME_OF_DAY_OPTIONS, WEEKDAY_OPTIONS, describeSchedule } from "@shared/habit-schedule";
import { canRecordAudio, recordingUnavailableReason, playRingtonePreviewTone } from "@/lib/audio-support";

import type { Child, User, InsertChild, Habit, MasterHabit, Reward } from "@shared/schema";

export default function ParentDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  
  console.log("ParentDashboard - Auth State:", { isAuthenticated, isLoading, user });
  const [heroName, setHeroName] = useState("");
  const [heroAge, setHeroAge] = useState("");
  const [avatarType, setAvatarType] = useState("robot");
  const [showParentProfile, setShowParentProfile] = useState(false);
  // Child cards start collapsed; tapping one reveals its details
  const [expandedChildId, setExpandedChildId] = useState<string | null>(null);
  const [showParentControls, setShowParentControls] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showHabitAssignment, setShowHabitAssignment] = useState(false);
  const [habitsTab, setHabitsTab] = useState<'manage' | 'approvals'>('manage');
  const [rewardsTab, setRewardsTab] = useState<'manage' | 'approvals'>('manage');
  const [activeSection, setActiveSection] = useState<'overview' | 'habits' | 'children' | 'rewards' | 'progress' | 'settings'>('overview');

  // Switching sections should always open at the top, never mid-scroll
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeSection]);

  // Alert dialog states
  const [removeHabitDialog, setRemoveHabitDialog] = useState<{ open: boolean; habitId?: string; childName?: string }>({ open: false });
  const [deleteHabitDialog, setDeleteHabitDialog] = useState<{ open: boolean; habitId?: string; habitName?: string }>({ open: false });
  const [deleteChildDialog, setDeleteChildDialog] = useState<{ open: boolean; childId?: string; childName?: string }>({ open: false });
  const [deleteRewardDialog, setDeleteRewardDialog] = useState<{ open: boolean; rewardId?: string; rewardName?: string }>({ open: false });

  const { data: children, isLoading: childrenLoading } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    enabled: isAuthenticated,
  });

  const child = children?.[0];

  // Habits awaiting review — drives the badge on the bottom nav
  const { data: allPendingHabits } = useQuery<any[]>({
    queryKey: ["/api/pending-habits/all"],
    enabled: isAuthenticated,
    staleTime: 15_000,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });
  const pendingApprovalCount = Array.isArray(allPendingHabits) ? allPendingHabits.length : 0;

  // Overview: the child whose profile panel is open, plus their activity
  const selectedOverviewChild = children?.find((c) => c.id === expandedChildId);
  const { data: selectedChildCompletions = [] } = useQuery<any[]>({
    queryKey: ["/api/children", expandedChildId, "completions"],
    enabled: !!expandedChildId,
  });
  const todayStr = new Date().toISOString().split("T")[0];
  const selectedChildTodayCount = new Set(
    selectedChildCompletions
      .filter((c) => c.date === todayStr && c.status !== "rejected")
      .map((c) => c.habitId),
  ).size;
  const selectedChildStreak = (() => {
    const approvedByDate = new Set(
      selectedChildCompletions.filter((c) => c.status === "approved").map((c) => c.date),
    );
    let streak = 0;
    const cursor = new Date();
    while (approvedByDate.has(cursor.toISOString().split("T")[0])) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  })();

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
    mutationFn: async (heroData: { name: string; avatarType: string; avatarUrl?: string; age?: number }) => {
      console.log("Creating hero with data:", heroData);
      const response = await apiRequest("POST", "/api/children", {
        name: heroData.name,
        avatarType: heroData.avatarType,
        avatarUrl: heroData.avatarUrl,
        age: heroData.age,
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

  // Remove habit assignment from child
  const removeHabitMutation = useMutation({
    mutationFn: async ({ habitId }: { habitId: string }) => {
      const response = await apiRequest("DELETE", `/api/habits/${habitId}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to remove habit from child");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Habit Removed!",
        description: "Habit has been removed from child.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/habits/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits/master"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      // Invalidate all child habits to refresh the display
      if (children) {
        children.forEach(child => {
          queryClient.invalidateQueries({ queryKey: [`/api/children/${child.id}/habits`] });
        });
      }
    },
    onError: (error) => {
      console.error("Habit removal error:", error);
      toast({
        title: "Error",
        description: "Failed to remove habit from child.",
        variant: "destructive",
      });
    },
  });

  // Delete master habit mutation
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
      queryClient.invalidateQueries({ queryKey: ["/api/habits/master"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits/all"] });
      if (children) {
        children.forEach(child => {
          queryClient.invalidateQueries({ queryKey: [`/api/children/${child.id}/habits`] });
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete habit. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete reward mutation
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
      if (child) {
        queryClient.invalidateQueries({ queryKey: [`/api/children/${child.id}/rewards`] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete reward. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-assign all master habits to all children mutation
  const autoAssignAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/habits/auto-assign-all", {});
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Auto-Assignment Complete! 🚀",
        description: "All master habits have been assigned to all children",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      queryClient.invalidateQueries({ queryKey: ["/api/master-habits"] });
    },
    onError: (error) => {
      toast({
        title: "Auto-Assignment Failed",
        description: error.message || "Could not auto-assign habits. Please try again.",
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

    if (heroAge) {
      heroData.age = parseInt(heroAge, 10);
    }

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

  // Uses the generated cartoon avatar art (see @/lib/avatars)

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

  // Check if user needs subscription access
  if (user && requiresSubscription(user)) {
    return <SubscriptionRequiredLayout user={user} />;
  }

  if (!children || children.length === 0) {
    return (
      <div className="min-h-screen hero-gradient">
        <header className="text-white p-6">
          <div className="max-w-6xl mx-auto">
            {/* Family Code Display */}
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                <div className="text-center">
                  <div className="text-white/80 text-sm font-medium">Family Code</div>
                  <div className="text-white font-bold text-xl tracking-wider font-mono">{(user as User)?.familyCode}</div>
                  <div className="text-white/70 text-xs">Share this code with family members</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="font-fredoka text-3xl sm:text-4xl hero-title">Parent Dashboard</h1>
                <p className="text-white/90 text-base sm:text-lg">✨ Welcome to Habit Heroes! ✨</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                {hasCompletedOnboarding && (
                  <Button
                    onClick={restartOnboarding}
                    className="super-button font-bold"
                  >
                    📚 Tutorial
                  </Button>
                )}
                <div className="flex items-center space-x-2">
                  <SyncStatus />
                </div>
                <Link href="/">
                  <Button className="super-button font-bold">
                    <ArrowLeft className="w-5 h-5 sm:mr-2" />
                    <span className="hidden sm:inline">Back to Home</span>
                  </Button>
                </Link>
                <div className="w-12 h-12 shrink-0 rounded-full border-4 border-white avatar-glow bg-coral flex items-center justify-center text-white font-bold text-lg">
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
                  <label className="font-nunito font-bold text-gray-800 text-lg">🦸 Hero Name <span className="text-red-500">*</span></label>
                  <Input
                    type="text"
                    placeholder="Enter your child's name..."
                    value={heroName}
                    onChange={(e) => setHeroName(e.target.value)}
                    className="w-full text-center text-xl py-4 border-4 border-sky font-bold rounded-xl"
                  />
                </div>

                {/* Age Input */}
                <div className="space-y-3">
                  <label className="font-nunito font-bold text-gray-800 text-lg">🎂 Child's Age (3-12)</label>
                  <Input
                    type="number"
                    min={3}
                    max={12}
                    inputMode="numeric"
                    placeholder="How old is your child?"
                    value={heroAge}
                    onChange={(e) => setHeroAge(e.target.value)}
                    className="w-full text-center text-xl py-4 border-4 border-sky font-bold rounded-xl"
                    data-testid="input-first-hero-age"
                  />
                  <p className="text-sm text-gray-500">
                    Age picks which mini-games appear in their Game Zone.
                  </p>
                </div>

                {/* Avatar Type Selection */}
                <div className="space-y-4 md:space-y-8">
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
                          className="super-button text-sm p-2"
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
                          className="super-button"
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
                        if (file) handleImageUpload(e);
                      }}
                    />
                  </div>
                </div>

                {/* Create Button */}
                <div className="pt-4">
                  <Button 
                    onClick={handleCreateHero}
                    disabled={createHeroMutation.isPending || !heroName.trim()}
                    className="w-full super-button py-6 text-xl"
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
    <div className="min-h-[100dvh] hero-gradient">
      {/* Main Dashboard Content */}
      <div>
        <div className="hero-gradient">
      {/* Primary navigation lives in the thumb zone at the bottom */}
      <BottomNav
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        approvalCount={pendingApprovalCount}
      />
      <header className="text-white px-4 pt-3 pb-2 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-2">
          {/* Title row: everything important on one line */}
          <div className="flex items-center justify-between gap-3">
            {activeSection !== 'overview' && (
              <button
                type="button"
                onClick={() => setActiveSection('overview')}
                aria-label="Back to Dashboard"
                data-testid="header-back-to-dashboard"
                className="flex-shrink-0 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="font-fredoka text-2xl sm:text-4xl hero-title">
                {activeSection === 'overview' ? 'Parent Dashboard'
                  : activeSection === 'children' ? 'Kids'
                  : activeSection === 'habits' ? 'Habits'
                  : activeSection === 'rewards' ? 'Rewards'
                  : activeSection === 'progress' ? 'Progress'
                  : 'Settings'}
              </h1>
              {activeSection === 'overview' && (
                <p className="text-white/90 text-xs sm:text-base truncate">🎯 Managing {children?.length === 1 ? `${children[0]?.name}'s` : 'Family'} Hero Journey</p>
              )}
            </div>
            {/* Profile Avatar - Always show user initials */}
            {user && (
              <div className="relative flex-shrink-0">
                <div
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-4 border-white avatar-glow bg-coral flex items-center justify-center cursor-pointer hover:scale-105 transition-transform text-white font-bold text-lg"
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

          {/* Stats chips + utility bar: overview only. Focused section
              screens keep a minimal header so the content fits without
              scrolling (mobile-first). */}
          {activeSection === 'overview' && (<>
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <button
              type="button"
              title="Tap to copy — share this code with family members"
              onClick={() => {
                navigator.clipboard?.writeText((user as User)?.familyCode || "");
                toast({ title: "Family code copied!", description: "Share it with family members to join." });
              }}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 font-medium flex items-center gap-1.5"
              data-testid="chip-family-code"
            >
              👨‍👩‍👧 Code: <span className="font-mono font-bold tracking-wider">{(user as User)?.familyCode}</span> 📋
            </button>
            <span className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 font-medium">
              ⭐ Family XP: <span className="font-bold text-sunshine">{(children?.reduce((total: number, c: any) => total + (c.totalXp || 0), 0) || 0).toLocaleString()}</span>
            </span>
          </div>

          {/* Utility bar lives up here, right below the family chips */}
          <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap bg-white/10 backdrop-blur-sm rounded-2xl p-1.5">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20 font-bold text-xs sm:text-sm h-8 px-2 sm:px-3 rounded-xl flex items-center gap-1.5 flex-shrink-0"
              onClick={restartOnboarding}
            >
              <HelpCircle className="w-4 h-4" />
              Tutorial
            </Button>
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20 font-bold text-xs sm:text-sm h-8 px-2 sm:px-3 rounded-xl flex items-center gap-1.5 flex-shrink-0"
              onClick={() => setShowParentControls(true)}
            >
              <Shield className="w-4 h-4" />
              Controls
            </Button>
            <Link href="/alert-settings">
              <Button
                variant="ghost"
                className="text-white hover:bg-white/20 font-bold text-xs sm:text-sm h-8 px-2 sm:px-3 rounded-xl flex items-center gap-1.5 flex-shrink-0"
                data-testid="button-global-alert-settings"
              >
                <Bell className="w-4 h-4" />
                Alerts
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20 font-bold text-xs sm:text-sm h-8 px-2 sm:px-3 rounded-xl ml-auto flex-shrink-0"
              onClick={() => window.location.href = "/api/logout"}
            >
              Sign Out
            </Button>
          </div>
          </>)}

        </div>
      </header>
      
      <main className="max-w-6xl mx-auto p-4 sm:p-6 pb-[calc(5rem+var(--safe-bottom))]">
        {/* Trial Status Banner */}
        <TrialStatusBanner />

        {/* Kids asked to unlock Premium → one-tap upgrade */}
        <div className="mb-4">
          <PremiumInterestNudge />
        </div>

        {/* Overview hero: horizontal child cards; tap one to see their profile */}
        {activeSection === 'overview' && (
          <div className="mb-6">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {children?.sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0)).map((childData, index) => {
                const isTopScorer = index === 0 && children.length > 1;
                const isSelected = expandedChildId === childData.id;
                return (
                  <button
                    key={childData.id}
                    type="button"
                    onClick={() => setExpandedChildId(isSelected ? null : childData.id)}
                    aria-expanded={isSelected}
                    data-testid={`child-card-toggle-${childData.id}`}
                    className={`flex-shrink-0 w-36 bg-white rounded-2xl p-3 text-center shadow-md border-4 transition-transform ${
                      isSelected ? 'border-coral scale-[1.03]' : 'border-transparent hover:border-sky'
                    }`}
                  >
                    <div className="relative inline-block">
                      <img
                        src={childData.avatarUrl || getAvatarImage(childData.avatarType)}
                        alt={`${childData.name}'s Hero`}
                        className="w-16 h-16 rounded-full border-4 border-sunshine avatar-glow object-cover mx-auto"
                      />
                      {isTopScorer && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-sunshine rounded-full flex items-center justify-center border-2 border-white">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="font-fredoka text-sm text-gray-800 mt-2 truncate">{childData.name}</div>
                    <div className="text-[11px] text-gray-500 truncate">Level {childData.level} {childData.avatarType.charAt(0).toUpperCase() + childData.avatarType.slice(1)} Hero</div>
                    <div className="text-xs font-bold text-gray-700 mt-1">{childData.totalXp.toLocaleString()} XP</div>
                  </button>
                );
              })}
              {/* Add Child */}
              <button
                type="button"
                onClick={() => { setActiveSection('children'); setShowAddHero(true); }}
                className="flex-shrink-0 w-36 rounded-2xl p-3 text-center border-4 border-dashed border-white/50 bg-white/10 hover:bg-white/20 transition-colors"
                data-testid="overview-add-child"
              >
                <div className="w-16 h-16 rounded-full bg-white mx-auto flex items-center justify-center">
                  <Plus className="w-8 h-8 text-sky" />
                </div>
                <div className="font-fredoka text-sm text-white mt-2">Add Child</div>
              </button>
            </div>

            {selectedOverviewChild ? (
              /* Tapped a kid → their profile panel */
              <Card className="fun-card p-4 sm:p-6 border-4 border-sky mt-2" data-testid={`child-card-details-${selectedOverviewChild.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedOverviewChild.avatarUrl || getAvatarImage(selectedOverviewChild.avatarType)}
                      alt={selectedOverviewChild.name}
                      className="w-14 h-14 rounded-full border-4 border-sunshine avatar-glow object-cover"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-fredoka text-xl text-gray-800">{selectedOverviewChild.name}</h3>
                        {children && children.length > 1 && children.slice().sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0))[0]?.id === selectedOverviewChild.id && (
                          <span className="text-sunshine text-xs font-bold">🏆 Top Scorer</span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">Level {selectedOverviewChild.level} {selectedOverviewChild.avatarType.charAt(0).toUpperCase() + selectedOverviewChild.avatarType.slice(1)} Hero</p>
                    </div>
                  </div>
                  <button type="button" className="text-gray-400 hover:text-gray-600" onClick={() => setExpandedChildId(null)} aria-label="Close profile">✕</button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="bg-sunshine/10 rounded-xl p-3">
                    <div className="text-xl font-black text-gray-800">⭐ {selectedOverviewChild.totalXp.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 font-semibold">Total XP</div>
                  </div>
                  <div className="bg-coral/10 rounded-xl p-3">
                    <div className="text-xl font-black text-gray-800">🪙 {selectedOverviewChild.rewardPoints}</div>
                    <div className="text-xs text-gray-500 font-semibold">Available Points</div>
                  </div>
                  <div className="bg-mint/10 rounded-xl p-3">
                    <div className="text-xl font-black text-gray-800">✅ {selectedChildTodayCount}</div>
                    <div className="text-xs text-gray-500 font-semibold">Habits today</div>
                  </div>
                  <div className="bg-orange-100 rounded-xl p-3">
                    <div className="text-xl font-black text-gray-800">🔥 {selectedChildStreak} days</div>
                    <div className="text-xs text-gray-500 font-semibold">Current Streak</div>
                  </div>
                </div>

                <div className="mt-3 px-3 py-2 bg-turquoise/10 border border-turquoise/20 rounded-lg flex flex-wrap items-center gap-x-6 gap-y-1">
                  <span className="text-xs text-turquoise font-semibold">🔑 Login</span>
                  <span className="text-sm"><span className="text-xs text-gray-500 mr-1">Username</span><span className="font-mono font-bold text-turquoise">{selectedOverviewChild.username || 'Not set'}</span></span>
                  <span className="text-sm"><span className="text-xs text-gray-500 mr-1">PIN</span><span className="font-mono font-bold text-turquoise tracking-wider">{selectedOverviewChild.pin || 'Not set'}</span></span>
                  {(!selectedOverviewChild.username || !selectedOverviewChild.pin) && (
                    <Button size="sm" className="ml-auto bg-turquoise hover:bg-turquoise/80 text-white text-xs h-7"
                      onClick={() => generateLoginCredentials(selectedOverviewChild.id, selectedOverviewChild.name)}>
                      Generate Login
                    </Button>
                  )}
                </div>

                <Button
                  className="w-full mt-4 bg-sky hover:bg-sky/80 text-white font-bold rounded-full"
                  onClick={() => setActiveSection('children')}
                  data-testid="view-full-profile"
                >
                  View Full Profile
                </Button>
              </Card>
            ) : null /* Section shortcuts removed — every section lives on the bottom nav */}
          </div>
        )}

        {/* Overview Section - Quick Stats.
            Phones get a compact one-glance strip; md+ keeps the original web layout. */}
        {activeSection === 'overview' && (
          <>
            {/* Mobile: compact 6-tile strip */}
            <div className="grid grid-cols-3 gap-2 mb-6 bounce-in md:hidden">
              <Card className="fun-card p-2.5 text-center border-2 border-mint">
                <div className="flex items-center justify-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-mint flex-shrink-0" />
                  <span className="font-bold text-lg text-gray-800">{completionRate}%</span>
                </div>
                <div className="text-gray-600 font-semibold text-[11px]">Completion</div>
              </Card>
              <Card className="fun-card p-2.5 text-center border-2 border-orange-500">
                <div className="flex items-center justify-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <span className="font-bold text-lg text-gray-800">{currentStreak}</span>
                </div>
                <div className="text-gray-600 font-semibold text-[11px]">Streak</div>
              </Card>
              <Card className="fun-card p-2.5 text-center border-2 border-sunshine">
                <div className="flex items-center justify-center gap-1.5">
                  <Trophy className="w-4 h-4 text-sunshine flex-shrink-0" />
                  <span className="font-bold text-lg text-gray-800">{badgesEarned}</span>
                </div>
                <div className="text-gray-600 font-semibold text-[11px]">Badges</div>
              </Card>
              <Card className="fun-card p-2.5 text-center border-2 border-coral">
                <div className="flex items-center justify-center gap-1.5">
                  <Star className="w-4 h-4 text-coral flex-shrink-0" />
                  <span className="font-bold text-lg text-gray-800">{child?.level || 1}</span>
                </div>
                <div className="text-gray-600 font-semibold text-[11px]">Level</div>
              </Card>
              <Card className="fun-card p-2.5 text-center border-2 border-mint">
                <div className="flex items-center justify-center gap-1.5">
                  <UserRound className="w-4 h-4 text-mint flex-shrink-0" />
                  <span className="font-bold text-lg text-gray-800">{children?.length || 0}</span>
                </div>
                <div className="text-gray-600 font-semibold text-[11px]">Heroes</div>
              </Card>
              <Card className="fun-card p-2.5 text-center border-2 border-coral">
                <div className="flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4 text-coral flex-shrink-0" />
                  <span className="font-bold text-lg text-gray-800">{(habits as any[])?.filter(h => h.isActive).length || 0}</span>
                </div>
                <div className="text-gray-600 font-semibold text-[11px]">Habits</div>
              </Card>
            </div>

            {/* Web (md+): original large stat cards */}
            <div className="hidden md:grid grid-cols-4 gap-6 mb-8">
              <div className="bounce-in" style={{ animationDelay: '0.1s' }}>
                <Card className="fun-card p-6 text-center border-4 border-mint">
                  <TrendingUp className="w-12 h-12 text-mint mx-auto mb-3" />
                  <div className="font-bold text-3xl text-gray-800">{completionRate}%</div>
                  <div className="text-gray-600 font-bold text-base">Completion Rate</div>
                </Card>
              </div>
              <div className="bounce-in" style={{ animationDelay: '0.2s' }}>
                <Card className="fun-card p-6 text-center border-4 border-orange-500">
                  <Flame className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                  <div className="font-bold text-3xl text-gray-800">{currentStreak}</div>
                  <div className="text-gray-600 font-bold text-base">Current Streak</div>
                </Card>
              </div>
              <div className="bounce-in" style={{ animationDelay: '0.3s' }}>
                <Card className="fun-card p-6 text-center border-4 border-sunshine">
                  <Trophy className="w-12 h-12 text-sunshine mx-auto mb-3" />
                  <div className="font-bold text-3xl text-gray-800">{badgesEarned}</div>
                  <div className="text-gray-600 font-bold text-base">Badges Earned</div>
                </Card>
              </div>
              <div className="bounce-in" style={{ animationDelay: '0.4s' }}>
                <Card className="fun-card p-6 text-center border-4 border-coral">
                  <Star className="w-12 h-12 text-coral mx-auto mb-3" />
                  <div className="font-bold text-3xl text-gray-800">{child?.level || 1}</div>
                  <div className="text-gray-600 font-bold text-base">Current Level</div>
                </Card>
              </div>
            </div>

            {/* Web (md+): original Quick Overview summary card */}
            <div className="hidden md:block space-y-6 mb-6">
              <Card className="p-6 border-2 border-mint">
                <h3 className="font-fredoka text-xl text-gray-800 mb-4">Quick Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-mint/10 rounded-lg">
                    <UserRound className="w-8 h-8 text-mint" />
                    <div>
                      <div className="font-bold text-gray-800">{children?.length || 0} Heroes</div>
                      <div className="text-sm text-gray-600">Active in your family</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-coral/10 rounded-lg">
                    <Check className="w-8 h-8 text-coral" />
                    <div>
                      <div className="font-bold text-gray-800">{(habits as any[])?.filter(h => h.isActive).length || 0} Active Habits</div>
                      <div className="text-sm text-gray-600">Daily missions</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Pending approvals hub — habits, reward claims, and game
                purchases surface right on the dashboard so parents can act
                without navigating */}
            <div className="grid gap-4 lg:grid-cols-2 items-start">
              <Card className="fun-card p-4 md:p-6 border-4 border-mint">
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare className="w-5 h-5 text-mint flex-shrink-0" />
                  <h3 className="font-fredoka text-lg md:text-xl text-gray-800 hero-title">✅ Pending Approvals</h3>
                  {pendingApprovalCount > 0 && (
                    <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-0.5 rounded-full ml-auto whitespace-nowrap">
                      {pendingApprovalCount} pending
                    </span>
                  )}
                </div>
                {pendingApprovalCount > 0 ? (
                  <div className="flex items-center justify-between gap-3 p-3 bg-mint/10 rounded-xl border border-mint/30">
                    <p className="text-sm text-gray-700 font-medium">
                      {pendingApprovalCount} habit{pendingApprovalCount === 1 ? '' : 's'} waiting for your review
                    </p>
                    <Button
                      size="sm"
                      className="bg-mint hover:bg-mint/80 text-white font-bold rounded-full px-4 flex-shrink-0"
                      onClick={() => { setActiveSection('habits'); setHabitsTab('approvals'); }}
                      data-testid="overview-review-habits"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">All caught up — no habits waiting.</p>
                )}

                {/* Reward claims from every child, approvable inline */}
                <OverviewRewardClaims children={children || []} />
              </Card>

              <GamePurchaseApproval />
            </div>
          </>
        )}

        {/* Habits Section */}
        {activeSection === 'habits' && (
          <HabitsManager
            children={children || []}
            user={user as User}
            pendingApprovalCount={pendingApprovalCount}
          />
        )}

        {/* Children Section */}
        {activeSection === 'children' && (
          <KidsManager onNavigate={(s) => setActiveSection(s)} />
        )}

        {/* Rewards Section */}
        {activeSection === 'rewards' && (
          <div className="space-y-4 bounce-in">
            {/* One purpose per screen: Manage rewards OR review approvals */}
            <div className="flex gap-1 bg-gray-100 rounded-full p-1 text-sm">
              <button
                onClick={() => setRewardsTab('manage')}
                className={`flex-1 rounded-full py-2 font-bold transition-colors ${rewardsTab === 'manage' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500'}`}
                data-testid="rewards-tab-manage"
              >
                🎁 Rewards
              </button>
              <button
                onClick={() => setRewardsTab('approvals')}
                className={`flex-1 rounded-full py-2 font-bold transition-colors ${rewardsTab === 'approvals' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500'}`}
                data-testid="rewards-tab-approvals"
              >
                ✅ Approvals
              </button>
            </div>

            {rewardsTab === 'manage' && (
              <RewardsManager children={children || []} />
            )}

            {rewardsTab === 'approvals' && (
              <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 md:items-start">
                <RewardApprovalSection childId={child?.id || ''} />
                <GamePurchaseApproval />
              </div>
            )}
          </div>
        )}

        {/* Progress Section */}
        {activeSection === 'progress' && (
          <div className="space-y-4 md:space-y-8">
            {/* Progress Reports Section */}
            <div className="bounce-in" style={{ animationDelay: '0.45s' }}>
              <Card className="fun-card p-4 md:p-8 border-4 border-coral">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-6">
                <BarChart3 className="w-5 h-5 md:w-8 md:h-8 text-coral flex-shrink-0" />
                <div>
                  <h3 className="font-fredoka text-lg md:text-2xl text-gray-800 hero-title">
                    <span className="md:hidden">📊 Progress</span>
                    <span className="hidden md:inline">📊 Progress Reports</span>
                  </h3>
                  <p className="hidden md:block text-gray-600 text-base">View detailed analytics and insights</p>
                </div>
                <Link href="/progress-reports" className="ml-auto">
                  <Button size="sm" className="bg-coral hover:bg-coral/80 text-white whitespace-nowrap md:h-10 md:px-4">
                    View Reports
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                <div className="text-center p-2.5 md:p-4 bg-mint/10 rounded-lg">
                  <div className="text-xl md:text-2xl font-bold text-gray-800">{completionRate}%</div>
                  <div className="text-xs md:text-sm text-gray-600">
                    <span className="md:hidden">Completion</span>
                    <span className="hidden md:inline">Completion Rate</span>
                  </div>
                </div>
                <div className="text-center p-2.5 md:p-4 bg-orange-500/10 rounded-lg">
                  <div className="text-xl md:text-2xl font-bold text-gray-800">{currentStreak}</div>
                  <div className="text-xs md:text-sm text-gray-600">Day Streak</div>
                </div>
                <div className="text-center p-2.5 md:p-4 bg-sunshine/10 rounded-lg">
                  <div className="text-xl md:text-2xl font-bold text-gray-800">{(habits as any[])?.filter(h => h.isActive).length || 0}</div>
                  <div className="text-xs md:text-sm text-gray-600">Active Habits</div>
                </div>
                <div className="text-center p-2.5 md:p-4 bg-coral/10 rounded-lg">
                  <div className="text-xl md:text-2xl font-bold text-gray-800">{child?.level || 1}</div>
                  <div className="text-xs md:text-sm text-gray-600">Level</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div className="space-y-4 bounce-in">
            {/* Subscription card stays at the top */}
            <SubscriptionManagementCard />

            {/* Everything else as a clean action-row list (mobile-first) */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 divide-y divide-gray-100 overflow-hidden">
              <SettingsRow icon={Shield} tint="text-red-500 bg-red-50" label="Parent Controls" hint="Screen time, bedtime, features" onClick={() => setShowParentControls(true)} testid="settings-row-controls" />
              <Link href="/alert-settings">
                <SettingsRow icon={Bell} tint="text-sky bg-sky/10" label="Alerts & Reminders" hint="Notification preferences" onClick={() => {}} testid="settings-row-alerts" />
              </Link>
              <SettingsRow icon={HelpCircle} tint="text-mint bg-mint/10" label="Tutorial" hint="Replay the walkthrough" onClick={restartOnboarding} testid="settings-row-tutorial" />
              <SettingsRow icon={UserRound} tint="text-purple bg-purple/10" label="My Profile" hint="Name, email & family code" onClick={() => setShowParentProfile(true)} testid="settings-row-profile" />
              <SettingsRow icon={LogOut} tint="text-destructive bg-destructive/10" label="Sign Out" danger onClick={() => (window.location.href = "/api/logout")} testid="settings-row-signout" />
            </div>
          </div>
        )}

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
      
      {/* Alert Dialogs */}
      {/* Remove Habit Dialog */}
      <AlertDialog open={removeHabitDialog.open} onOpenChange={(open) => setRemoveHabitDialog({ ...removeHabitDialog, open })}>
        <AlertDialogContent data-testid="dialog-remove-habit">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Habit</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Are you sure you want to remove this habit from {removeHabitDialog.childName}? This action cannot be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-remove-habit">Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-remove-habit"
              onClick={() => {
                if (removeHabitDialog.habitId) {
                  removeHabitMutation.mutate({ habitId: removeHabitDialog.habitId });
                }
                setRemoveHabitDialog({ open: false });
              }}
              className="bg-destructive hover:bg-destructive/80"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Habit Dialog */}
      <AlertDialog open={deleteHabitDialog.open} onOpenChange={(open) => setDeleteHabitDialog({ ...deleteHabitDialog, open })}>
        <AlertDialogContent data-testid="dialog-delete-habit">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Habit</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Are you sure you want to delete "{deleteHabitDialog.habitName}"? This action cannot be undone and will remove this habit from all children.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-habit">Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete-habit"
              onClick={() => {
                if (deleteHabitDialog.habitId) {
                  deleteHabitMutation.mutate(deleteHabitDialog.habitId);
                }
                setDeleteHabitDialog({ open: false });
              }}
              className="bg-destructive hover:bg-destructive/80"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Child Dialog */}
      <AlertDialog open={deleteChildDialog.open} onOpenChange={(open) => setDeleteChildDialog({ ...deleteChildDialog, open })}>
        <AlertDialogContent data-testid="dialog-delete-child">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Hero Profile</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Are you sure you want to delete {deleteChildDialog.childName}'s hero profile? This action cannot be undone and will permanently delete all their progress, habits, and rewards.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-child">Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete-child"
              onClick={() => {
                if (deleteChildDialog.childId) {
                  deleteChildMutation.mutate(deleteChildDialog.childId);
                }
                setDeleteChildDialog({ open: false });
              }}
              className="bg-destructive hover:bg-destructive/80"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Reward Dialog */}
      <AlertDialog open={deleteRewardDialog.open} onOpenChange={(open) => setDeleteRewardDialog({ ...deleteRewardDialog, open })}>
        <AlertDialogContent data-testid="dialog-delete-reward">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reward</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Are you sure you want to delete "{deleteRewardDialog.rewardName}"? This action cannot be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-reward">Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete-reward"
              onClick={() => {
                if (deleteRewardDialog.rewardId) {
                  deleteRewardMutation.mutate(deleteRewardDialog.rewardId);
                }
                setDeleteRewardDialog({ open: false });
              }}
              className="bg-destructive hover:bg-destructive/80"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </div>
      </div>
    </div>
  );
}

// Reward Settings Section Component
function RewardSettingsSection({
  childId, 
  showAddReward, 
  setShowAddReward, 
  children,
  setDeleteRewardDialog,
  deleteRewardMutation
}: { 
  childId: string; 
  showAddReward: boolean; 
  setShowAddReward: (show: boolean) => void; 
  children: Child[];
  setDeleteRewardDialog: (dialog: { open: boolean; rewardId?: string; rewardName?: string }) => void;
  deleteRewardMutation: any;
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
  const [editSelectedKids, setEditSelectedKids] = useState<string[]>([]);

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
    
    // Create reward for the current child
    createRewardMutation.mutate({
      childId: childId,
      name: rewardName.trim(),
      description: rewardDescription.trim(),
      type: "treat", // Default type for custom rewards
      value: rewardName.trim(), // Use name as value
      cost: parseInt(rewardCost),
      costType: "xp", // Using XP cost type
      isActive: true,
    });
  };

  return (
    <Card className="fun-card p-4 md:p-8 border-4 border-orange-500">
      <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-6">
        <Gift className="w-5 h-5 md:w-8 md:h-8 text-orange-500 flex-shrink-0" />
        <div>
          <h3 className="font-fredoka text-lg md:text-2xl text-gray-800 hero-title">
            <span className="md:hidden">🎁 Rewards</span>
            <span className="hidden md:inline">🎁 Reward Settings</span>
          </h3>
          <p className="hidden md:block text-gray-600 text-base">Set up rewards for completing habits</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-2 md:space-y-4">
          {rewards?.map((reward) => (
            <div key={reward.id} className="space-y-2 md:space-y-4">
              <div className="p-3 md:p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                <div className="flex items-center gap-2.5 md:gap-3">
                  {/* Slim row on phones; web keeps the XP cost block */}
                  <div className="text-2xl flex-shrink-0">🎁</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-bold text-gray-800 truncate">{reward.name}</span>
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 whitespace-nowrap md:hidden">
                        🪙 {reward.cost} XP
                      </span>
                    </div>
                    {reward.description && (
                      <div className="text-xs md:text-sm text-gray-600 truncate md:whitespace-normal">{reward.description}</div>
                    )}
                  </div>
                  <div className="hidden md:block text-right mr-2">
                    <div className="text-sm font-bold text-orange-600">{reward.cost} XP</div>
                    <div className="text-xs text-gray-500">Cost</div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      onClick={() => {
                        setEditingReward(editingReward === reward.id ? null : reward.id);
                        setEditRewardName(reward.name);
                        setEditRewardDescription(reward.description || "");
                        setEditRewardCost(reward.cost.toString());
                        setEditRewardIcon("🎁");
                        setEditSelectedKids([reward.childId]);
                      }}
                      size="sm"
                      className="h-10 w-10 p-0 rounded-full bg-sky hover:bg-sky/80 text-white shadow-md"
                      aria-label={`Edit ${reward.name}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        setDeleteRewardDialog({ open: true, rewardId: reward.id, rewardName: reward.name });
                      }}
                      disabled={deleteRewardMutation.isPending}
                      size="sm"
                      className="h-10 w-10 p-0 rounded-full bg-destructive hover:bg-destructive/80 text-white shadow-md"
                      aria-label={`Delete ${reward.name}`}
                      data-testid={`button-delete-reward-${reward.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
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

                    {/* Kid Assignment for Edit Reward */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Assign to Kids</label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {children.map((child) => (
                          <div key={child.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`edit-reward-kid-${child.id}`}
                              checked={editSelectedKids.includes(child.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditSelectedKids([...editSelectedKids, child.id]);
                                } else {
                                  setEditSelectedKids(editSelectedKids.filter(id => id !== child.id));
                                }
                              }}
                              className="w-4 h-4 text-orange-500 border-2 border-orange-300 rounded focus:ring-orange-500"
                            />
                            <label htmlFor={`edit-reward-kid-${child.id}`} className="text-sm font-medium text-gray-700 flex items-center">
                              <span className="text-lg mr-1">{child.avatarType === 'robot' ? '🤖' : child.avatarType === 'princess' ? '👑' : child.avatarType === 'ninja' ? '🥷' : '🐾'}</span>
                              {child.name} (Level {child.level})
                            </label>
                          </div>
                        ))}
                        {children.length === 0 && (
                          <p className="text-sm text-gray-500 italic">No kids available. Add a child first.</p>
                        )}
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
                      variant="outline"
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
                        setEditSelectedKids([]);
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
              variant="outline"
              className="w-full"
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
                  variant="outline"
                  className="flex-1"
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

  // Rewards the child has CLAIMED and is waiting on (e.g. "Ice cream")
  const { data: rewardClaims } = useQuery({
    queryKey: [`/api/children/${childId}/reward-claims`],
    enabled: !!childId,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });

  const { data: childRewards } = useQuery({
    queryKey: [`/api/children/${childId}/rewards`],
    enabled: !!childId,
  });

  const approveClaimMutation = useMutation({
    mutationFn: async (claimId: string) => {
      await apiRequest("POST", `/api/reward-claims/${claimId}/approve`, {});
    },
    onSuccess: () => {
      toast({
        title: "Reward approved! 🎁",
        description: "Now give your child their reward — they'll confirm with 'Got it!'",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/reward-claims`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve the reward claim.",
        variant: "destructive",
      });
    },
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
  const claimsArray = Array.isArray(rewardClaims) ? rewardClaims : [];
  const rewardsArray = Array.isArray(childRewards) ? childRewards : [];
  const pendingClaims = claimsArray.filter((c: any) => c.status === "pending");
  const rewardNameFor = (rewardId: string) =>
    rewardsArray.find((r: any) => r.id === rewardId)?.name || "a reward";
  
  const handleApprove = (transactionId: string) => {
    if (!(user as User)?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }
    approveRewardMutation.mutate({ transactionId, approvedBy: (user as User).id });
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
    <Card className="fun-card p-4 md:p-6 border-4 border-purple-500">
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <Gift className="w-5 h-5 md:w-6 md:h-6 text-purple-500 flex-shrink-0" />
        <div>
          <h3 className="font-fredoka text-lg md:text-xl text-gray-800 hero-title">
            <span className="md:hidden">🎁 Approvals & Bonus</span>
            <span className="hidden md:inline">🎁 Reward Management</span>
          </h3>
          <p className="hidden md:block text-gray-600">Approve earned rewards and give bonus points</p>
        </div>
        {(pendingRewardsArray.length + pendingClaims.length) > 0 && (
          <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-0.5 md:py-1 rounded-full ml-auto whitespace-nowrap">
            {pendingRewardsArray.length + pendingClaims.length} pending
          </span>
        )}
      </div>

      {/* Claimed rewards waiting for a parent's OK */}
      {pendingClaims.length > 0 && (
        <div className="mb-6">
          <h4 className="font-nunito font-bold text-gray-700 mb-3 flex items-center">
            <Gift className="w-4 h-4 mr-2 text-purple-500" />
            Reward Claims
          </h4>
          <div className="space-y-3">
            {pendingClaims.map((claim: any) => (
              <div
                key={claim.id}
                className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2"
                data-testid={`reward-claim-${claim.id}`}
              >
                <div>
                  <p className="font-nunito font-semibold text-gray-800">
                    🎁 Wants to redeem: <span className="text-purple-700">{rewardNameFor(claim.rewardId)}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Claimed {claim.claimedAt ? new Date(claim.claimedAt).toLocaleString() : ""}
                  </p>
                </div>
                <Button
                  onClick={() => approveClaimMutation.mutate(claim.id)}
                  disabled={approveClaimMutation.isPending}
                  className="bg-mint hover:bg-mint/80 text-white rounded-full font-bold"
                  data-testid={`approve-claim-${claim.id}`}
                >
                  ✓ Approve
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  className="bg-mint hover:bg-mint/80 text-white"
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
            className="group h-16 flex flex-col border-mint hover:bg-mint hover:text-white [&:hover_span]:text-white"
          >
            <span className="font-bold text-mint">+10</span>
            <span className="text-xs text-gray-600">Good Behavior</span>
          </Button>
          <Button
            onClick={() => handleGiveBonus(25, "Extra effort bonus")}
            disabled={createBonusRewardMutation.isPending}
            variant="outline"
            className="group h-16 flex flex-col border-sky hover:bg-sky hover:text-white [&:hover_span]:text-white"
          >
            <span className="font-bold text-sky">+25</span>
            <span className="text-xs text-gray-600">Extra Effort</span>
          </Button>
          <Button
            onClick={() => handleGiveBonus(50, "Outstanding achievement")}
            disabled={createBonusRewardMutation.isPending}
            variant="outline"
            className="group h-16 flex flex-col border-purple hover:bg-purple hover:text-white [&:hover_span]:text-white"
          >
            <span className="font-bold text-purple">+50</span>
            <span className="text-xs text-gray-600">Outstanding!</span>
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

// Overview: reward claims from every child with one-tap approval, so the
// parent never has to leave the dashboard for routine sign-offs
function OverviewRewardClaims({ children }: { children: Child[] }) {
  if (!children.length) return null;
  return (
    <div className="space-y-2 mt-3">
      {children.map((child) => (
        <OverviewChildClaims key={child.id} child={child} />
      ))}
    </div>
  );
}

function OverviewChildClaims({ child }: { child: Child }) {
  const { toast } = useToast();

  const { data: rewardClaims } = useQuery({
    queryKey: [`/api/children/${child.id}/reward-claims`],
    enabled: !!child.id,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });

  const { data: childRewards } = useQuery({
    queryKey: [`/api/children/${child.id}/rewards`],
    enabled: !!child.id,
  });

  const approveClaimMutation = useMutation({
    mutationFn: async (claimId: string) => {
      await apiRequest("POST", `/api/reward-claims/${claimId}/approve`, {});
    },
    onSuccess: () => {
      toast({
        title: "Reward approved! 🎁",
        description: `Now give ${child.name} their reward — they'll confirm with 'Got it!'`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${child.id}/reward-claims`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve the reward claim.",
        variant: "destructive",
      });
    },
  });

  const claims = (Array.isArray(rewardClaims) ? rewardClaims : []).filter((c: any) => c.status === "pending");
  const rewards = Array.isArray(childRewards) ? childRewards : [];
  const rewardNameFor = (rewardId: string) =>
    rewards.find((r: any) => r.id === rewardId)?.name || "a reward";

  if (claims.length === 0) return null;

  return (
    <>
      {claims.map((claim: any) => (
        <div
          key={claim.id}
          className="bg-purple/5 border-2 border-purple/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2"
          data-testid={`overview-reward-claim-${claim.id}`}
        >
          <div className="min-w-0">
            <p className="font-nunito font-semibold text-gray-800 text-sm">
              🎁 <span className="font-bold">{child.name}</span> wants: <span className="text-purple">{rewardNameFor(claim.rewardId)}</span>
            </p>
            <p className="text-xs text-gray-500">
              Claimed {claim.claimedAt ? new Date(claim.claimedAt).toLocaleString() : ""}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => approveClaimMutation.mutate(claim.id)}
            disabled={approveClaimMutation.isPending}
            className="bg-mint hover:bg-mint/80 text-white font-bold rounded-full px-4 flex-shrink-0"
            data-testid={`overview-approve-claim-${claim.id}`}
          >
            <Check className="w-4 h-4 mr-1" />
            Approve
          </Button>
        </div>
      ))}
    </>
  );
}
// Settings action-row (mobile-first list item)
function SettingsRow({ icon: Icon, tint, label, hint, danger, onClick, testid }: {
  icon: typeof Shield; tint: string; label: string; hint?: string; danger?: boolean; onClick: () => void; testid?: string;
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors" data-testid={testid}>
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${tint}`}>
        <Icon className="w-5 h-5" />
      </span>
      <span className="flex-1 min-w-0">
        <span className={`block font-bold ${danger ? "text-destructive" : "text-gray-800"}`}>{label}</span>
        {hint && <span className="block text-xs text-gray-500 truncate">{hint}</span>}
      </span>
      <ChevronRight className={`w-5 h-5 ${danger ? "text-destructive/40" : "text-gray-300"}`} />
    </button>
  );
}
