import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
    <div className="min-h-screen hero-gradient">
      {/* Hero Header */}
      <HeroHeader child={currentChild} />

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-white/90 backdrop-blur-sm border border-white/20">
            <TabsTrigger
              value="missions"
              className="flex items-center gap-2 data-[state=active]:bg-coral data-[state=active]:text-white font-bold text-gray-700"
              disabled={!featuresEnabled.habits}
            >
              {featuresEnabled.habits ? (
                <Gamepad2 className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Missions</span>
            </TabsTrigger>
            <TabsTrigger
              value="customize"
              className="flex items-center gap-2 data-[state=active]:bg-mint data-[state=active]:text-white font-bold text-gray-700"
              disabled={!featuresEnabled.gearShop}
            >
              {featuresEnabled.gearShop ? (
                <Settings className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Customize</span>
            </TabsTrigger>
            <TabsTrigger
              value="rewards"
              className="flex items-center gap-2 data-[state=active]:bg-sunshine data-[state=active]:text-gray-800 font-bold text-gray-700"
              disabled={!featuresEnabled.rewards}
            >
              {featuresEnabled.rewards ? (
                <Trophy className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Rewards</span>
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white font-bold text-gray-700"
            >
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="missions" className="space-y-6">
            {featuresEnabled.habits ? (
              <>
                {/* Enhanced Habit Health Meter */}
                <Card className="fun-card border-4 border-purple-400 bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-fredoka text-2xl text-gray-800 flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                          <Star className="w-5 h-5 text-white" />
                        </div>
                        Habit Health Meter
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
                  </CardContent>
                </Card>

                {/* Enhanced Daily Missions Section */}
                <Card className="fun-card border-4 border-coral bg-gradient-to-r from-coral/5 to-orange/5">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-coral rounded-full flex items-center justify-center">
                        <Gamepad2 className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="font-fredoka text-3xl text-gray-800">
                        Today's Hero Missions
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {habits.map((habit) => {
                        const completion = todaysCompletions.find(
                          (c) => c.habitId === habit.id,
                        );
                        const isCompleted = completion?.status === "approved";
                        const isPending = completion?.status === "pending";
                        const canComplete = !completion;

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
                                        Ready
                                      </span>
                                    </>
                                  )}
                                </div>

                                {canComplete && (
                                  <Button className="super-button px-4 py-2 text-sm font-bold">
                                    Complete!
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
                  </CardContent>
                </Card>
              </>
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
