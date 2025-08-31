import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useChildAuth } from "@/hooks/useChildAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HeroHeader from "@/components/kid/hero-header";
import DailyMissions from "@/components/kid/daily-missions";
import HeroCustomization from "@/components/kid/hero-customization";
import RewardsSection from "@/components/kid/rewards-section";
import WeeklyProgress from "@/components/kid/weekly-progress";
import HabitHealthMeter from "@/components/kid/habit-health-meter";
import {
  Gamepad2,
  Trophy,
  Star,
  Settings,
  Lock,
  Zap,
  Clock,
  CheckCircle,
} from "lucide-react";
import type {
  Child,
  ParentalControls,
  Habit,
  HabitCompletion,
} from "@shared/schema";

export default function Home() {
  const [activeTab, setActiveTab] = useState("missions");
  const { toast } = useToast();

  // Single-user experience - only for logged in children
  const {
    child: loggedInChild,
    isChildAuthenticated,
    isLoading: childAuthLoading,
  } = useChildAuth();

  // Fetch habits and completions for health meter
  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/children", (loggedInChild as Child)?.id, "habits"],
    enabled: !!(loggedInChild as Child)?.id,
  });

  const { data: todaysCompletions = [] } = useQuery<HabitCompletion[]>({
    queryKey: [
      "/api/children",
      (loggedInChild as Child)?.id,
      "completions",
      "today",
    ],
    enabled: !!(loggedInChild as Child)?.id,
  });

  // Mission completion mutation - same as DailyMissions component
  const completeMissionMutation = useMutation({
    mutationFn: async (habitId: string) => {
      console.log("Completing habit:", habitId);
      const response = await apiRequest("POST", `/api/habits/${habitId}/complete`, {});
      console.log("Completion response:", response);
      return response;
    },
    onSuccess: (data, habitId) => {
      console.log("Mission completed successfully:", habitId);
      toast({
        title: "Mission Complete! 🎉",
        description: "Great job! You earned XP and reward points!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children", (loggedInChild as Child)?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/children", (loggedInChild as Child)?.id, "completions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children", (loggedInChild as Child)?.id, "completions", "today"] });
    },
    onError: (error) => {
      console.error("Mission completion failed:", error);
      toast({
        title: "Oops!",
        description: error.message || "Could not complete mission. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Status calculation function - same as DailyMissions component
  const getHabitStatus = (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const todayCompletions = todaysCompletions.filter(c => c.date === today);
    const habitCompletions = todayCompletions.filter(c => c.habitId === habitId);
    
    if (habitCompletions.length === 0) return 'available';
    
    // Check for approved first - if approved, habit is done
    const approved = habitCompletions.find(c => c.status === 'approved');
    if (approved) return 'approved';
    
    // Check for pending - if there's a pending, show pending
    const pending = habitCompletions.find(c => c.status === 'pending');
    if (pending) return 'pending';
    
    // If only rejected, allow try again
    const rejected = habitCompletions.find(c => c.status === 'rejected');
    if (rejected) return 'rejected';
    
    return 'available';
  };

  if (childAuthLoading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 magic-gradient rounded-full mx-auto mb-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          </div>
          <p className="text-white text-xl font-bold drop-shadow-lg">
            Loading your hero...
          </p>
        </div>
      </div>
    );
  }

  // If no child is logged in, show the welcome screen
  if (!isChildAuthenticated) {
    return (
      <div className="min-h-screen hero-gradient">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="font-fredoka text-4xl sm:text-6xl mb-8 hero-title bounce-in text-white drop-shadow-lg">
              Welcome to Habit Heroes!
            </h1>
            <div className="fun-card max-w-md mx-auto">
              <CardContent className="p-8">
                <h2 className="font-fredoka text-3xl rainbow-text mb-4">
                  Start Your Adventure!
                </h2>
                <p className="text-gray-700 mb-6 text-lg font-semibold">
                  Login with your hero credentials to start your EPIC adventure!
                </p>
                <div className="space-y-4">
                  <Button
                    className="super-button text-xl px-8 py-4 w-full"
                    onClick={() => (window.location.href = "/kids-login")}
                  >
                    Start Adventure
                  </Button>
                  <div className="text-sm text-gray-600 font-medium">
                    Login with your hero username and PIN to start your
                    adventure!
                  </div>
                </div>
              </CardContent>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!loggedInChild) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl mb-4 drop-shadow-lg">No hero data found!</h2>
          <Button
            onClick={() => (window.location.href = "/kids-login")}
            className="super-button"
          >
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  const currentChild = loggedInChild as Child;

  // Fetch parental controls for the current child
  const { data: parentalControls } = useQuery<ParentalControls>({
    queryKey: ["/api/children", currentChild.id, "parental-controls"],
    enabled: !!currentChild.id,
  });

  // Check parent's subscription status for Premium features
  const { data: subscriptionInfo } = useQuery({
    queryKey: ["/api/subscription/check-feature-access"],
    queryFn: async () => {
      const response = await fetch("/api/subscription/check-feature-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature: "mini_games" }),
      });
      return response.json();
    },
    enabled: !!currentChild.id,
  });

  // Check if specific features are enabled
  const featuresEnabled = {
    habits: parentalControls?.enableHabits !== false,
    gearShop: parentalControls?.enableGearShop !== false,
    miniGames: parentalControls?.enableMiniGames !== false,
    rewards: parentalControls?.enableRewards !== false,
  };

  return (
    <div className="min-h-screen hero-gradient safe-area-top">
      {/* Hero Header */}
      <HeroHeader child={currentChild} />

      {/* Main Content - Kid-friendly layout */}
      <div className="container mx-auto px-4 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="responsive-grid grid-cols-2 sm:grid-cols-4 mb-6 bg-white/95 backdrop-blur-sm border-4 border-white/30 rounded-2xl p-2 shadow-lg">
            <TabsTrigger
              value="missions"
              className="kid-button flex flex-col items-center gap-1 data-[state=active]:bg-hero-blue data-[state=active]:text-white font-bold text-gray-700 py-3 px-4 touch-target min-h-16"
              disabled={!featuresEnabled.habits}
              data-testid="tab-missions"
            >
              {featuresEnabled.habits ? (
                <Gamepad2 className="w-6 h-6" />
              ) : (
                <Lock className="w-6 h-6" />
              )}
              <span className="readable-text text-sm">🎮 Missions</span>
            </TabsTrigger>
            <TabsTrigger
              value="customize"
              className="kid-button flex flex-col items-center gap-1 data-[state=active]:bg-success-green data-[state=active]:text-white font-bold text-gray-700 py-3 px-4 touch-target min-h-16"
              disabled={!featuresEnabled.gearShop}
              data-testid="tab-customize"
            >
              {featuresEnabled.gearShop ? (
                <Settings className="w-6 h-6" />
              ) : (
                <Lock className="w-6 h-6" />
              )}
              <span className="readable-text text-sm">🎨 Style</span>
            </TabsTrigger>
            <TabsTrigger
              value="rewards"
              className="kid-button flex flex-col items-center gap-1 data-[state=active]:bg-joy-yellow data-[state=active]:text-gray-800 font-bold text-gray-700 py-3 px-4 touch-target min-h-16"
              disabled={!featuresEnabled.rewards}
              data-testid="tab-rewards"
            >
              {featuresEnabled.rewards ? (
                <Trophy className="w-6 h-6" />
              ) : (
                <Lock className="w-6 h-6" />
              )}
              <span className="readable-text text-sm">🏆 Prizes</span>
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="kid-button flex flex-col items-center gap-1 data-[state=active]:bg-purple data-[state=active]:text-white font-bold text-gray-700 py-3 px-4 touch-target min-h-16"
              data-testid="tab-progress"
            >
              <Star className="w-6 h-6" />
              <span className="readable-text text-sm">📊 Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="missions" className="space-y-6">
            {featuresEnabled.habits ? (
              <div className="space-y-6">
                {/* Enhanced Habit Health Meter - Kid-friendly */}
                <div className="kid-card bg-gradient-to-r from-hero-blue/10 to-success-green/10 border-hero-blue p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-fredoka text-2xl sm:text-3xl readable-text-large text-gray-800 flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-hero-blue to-success-green rounded-full flex items-center justify-center magic-glow">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      🌟 Hero Health Meter
                    </h2>
                      {/* Smaller health indicator */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-red-400 to-green-400 rounded-full border-2 border-white shadow-sm"></div>
                        <span className="text-sm font-bold text-gray-700">
                          {todaysCompletions.length}/{habits.length}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white/70 rounded-lg p-4 border-2 border-purple-200">
                      <div className="text-sm text-gray-600 mb-2 font-medium">
                        Health Score
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                        <div
                          className="bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 h-4 rounded-full transition-all duration-500 ease-out"
                          style={{
                            width:
                              habits.length > 0
                                ? `${(todaysCompletions.length / habits.length) * 100}%`
                                : "0%",
                          }}
                        ></div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-800">
                          {habits.length > 0
                            ? Math.round(
                                (todaysCompletions.length / habits.length) *
                                  100,
                              )
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Daily Missions Section - Kid-friendly */}
                <div className="kid-card bg-gradient-to-r from-energy-orange/10 to-joy-yellow/10 border-energy-orange p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-energy-orange to-joy-yellow rounded-full flex items-center justify-center magic-glow">
                      <Gamepad2 className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="font-fredoka text-3xl sm:text-4xl readable-text-large text-gray-800">
                      🎮 Today's Hero Missions
                    </h2>
                  </div>

                  <div className="responsive-grid gap-4">
                      {habits.map((habit) => {
                        const status = getHabitStatus(habit.id);
                        const completion = todaysCompletions.find(
                          (c) => c.habitId === habit.id,
                        );
                        const isCompleted = status === "approved";
                        const isPending = status === "pending";
                        const canComplete = status === "available" || status === "rejected";

                        return (
                          <Card
                            key={habit.id}
                            className={`relative overflow-hidden transition-all duration-300 hover:scale-105 border-3 ${
                              isCompleted
                                ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50"
                                : isPending
                                  ? "border-orange-400 bg-gradient-to-br from-orange-50 to-yellow-50"
                                  : "border-gray-300 bg-gradient-to-br from-white to-gray-50 hover:border-coral"
                            }`}
                          >
                            <CardContent className="p-6">
                              {/* XP Badge - Now clearly visible */}
                              <div className="absolute top-3 right-3">
                                <div className="bg-gradient-to-r from-sunshine to-orange-400 text-gray-800 px-3 py-1 rounded-full text-sm font-bold shadow-lg border-2 border-white flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  {habit.xpReward} XP
                                </div>
                              </div>

                              {/* Status Icon */}
                              <div className="mb-3">
                                {isCompleted ? (
                                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-white" />
                                  </div>
                                ) : isPending ? (
                                  <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                    <Star className="w-5 h-5 text-gray-600" />
                                  </div>
                                )}
                              </div>

                              {/* Habit Info */}
                              <h3 className="font-fredoka text-xl text-gray-800 mb-2 pr-16">
                                {habit.name}
                              </h3>

                              {habit.description && (
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                  {habit.description}
                                </p>
                              )}

                              {/* Time availability */}
                              <div className="flex items-center gap-2 mb-4 text-xs">
                                <Clock className="w-3 h-3 text-turquoise" />
                                <span className="text-turquoise font-medium">
                                  Available: 07:00 - 20:00
                                </span>
                              </div>

                              {/* Status and Action */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {isCompleted && (
                                    <>
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                      <span className="text-green-600 font-bold text-sm">
                                        Completed!
                                      </span>
                                    </>
                                  )}
                                  {isPending && (
                                    <>
                                      <Clock className="w-4 h-4 text-orange-600" />
                                      <span className="text-orange-600 font-bold text-sm">
                                        Pending
                                      </span>
                                    </>
                                  )}
                                  {canComplete && (
                                    <>
                                      <div className="w-4 h-4 bg-coral rounded-full animate-pulse"></div>
                                      <span className="text-coral font-bold text-sm">
                                        {status === 'rejected' ? 'Try Again' : 'Ready'}
                                      </span>
                                    </>
                                  )}
                                </div>

                                {canComplete && (
                                  <Button 
                                    className="super-button px-4 py-2 text-sm font-bold"
                                    onClick={() => completeMissionMutation.mutate(habit.id)}
                                    disabled={completeMissionMutation.isPending}
                                    data-testid={`complete-habit-${habit.id}`}
                                  >
                                    {completeMissionMutation.isPending 
                                      ? "Completing..." 
                                      : status === 'rejected' 
                                        ? "Try Again!" 
                                        : "Complete!"
                                    }
                                  </Button>
                                )}

                                {isPending && (
                                  <Button
                                    disabled
                                    className="bg-orange-100 text-orange-600 px-4 py-2 text-sm font-bold cursor-not-allowed"
                                  >
                                    Pending
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {habits.length === 0 && (
                      <div className="text-center py-12 bg-white/50 rounded-lg border-2 border-dashed border-gray-300">
                        <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-600 mb-2">
                          No missions yet!
                        </h3>
                        <p className="text-gray-500">
                          Ask your parent to create some awesome habits for you!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
            ) : (
              <Alert className="border-2 border-orange-300 bg-orange-50">
                <Lock className="h-5 w-5 text-orange-600" />
                <AlertDescription className="text-orange-800 font-medium text-base">
                  Your parent has disabled daily habits. Contact your parent to
                  enable this feature.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="customize" className="space-y-6">
            {featuresEnabled.gearShop ? (
              <HeroCustomization child={currentChild} />
            ) : (
              <Alert className="border-2 border-orange-300 bg-orange-50">
                <Lock className="h-5 w-5 text-orange-600" />
                <AlertDescription className="text-orange-800 font-medium text-base">
                  Your parent has disabled hero customization. Contact your
                  parent to enable this feature.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            {featuresEnabled.rewards ? (
              <RewardsSection
                childId={currentChild.id}
                userSubscriptionStatus={
                  subscriptionInfo?.user?.subscriptionStatus || "free"
                }
              />
            ) : (
              <Alert className="border-2 border-orange-300 bg-orange-50">
                <Lock className="h-5 w-5 text-orange-600" />
                <AlertDescription className="text-orange-800 font-medium text-base">
                  Your parent has disabled rewards. Contact your parent to
                  enable this feature.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <WeeklyProgress childId={currentChild.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
