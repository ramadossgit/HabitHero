import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useChildAuth } from "@/hooks/useChildAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import KidBottomNav, { type KidTab } from "@/components/kid/KidBottomNav";
import HeroHeader from "@/components/kid/hero-header";
import DailyMissions from "@/components/kid/daily-missions";
import HeroCustomization from "@/components/kid/hero-customization";
import AvatarStudio from "@/components/kid/avatar-studio";
import RewardsSection from "@/components/kid/rewards-section";
import GameZone from "@/components/kid/game-zone";
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
import { isHabitScheduledOn } from "@shared/habit-schedule";
import type {
  Child,
  ParentalControls,
  Habit,
  HabitCompletion,
} from "@shared/schema";

// Friendly fallback if a single tab's content ever errors — the header and
// bottom menu stay put so the kid can always navigate to another section.
function TabError() {
  return (
    <div className="fun-card border-4 border-purple-300 bg-white p-6 text-center">
      <div className="text-4xl mb-2">🐣</div>
      <h3 className="font-fredoka text-lg text-gray-800">Oops, this bit needs a moment</h3>
      <p className="text-gray-600 text-sm mb-4">Tap another button below, or try again.</p>
      <Button onClick={() => window.location.reload()} className="super-button font-bold rounded-full">
        Try again
      </Button>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("missions");
  const { toast } = useToast();

  // Switching kid tabs should always open at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Single-user experience - only for logged in children
  const {
    child: loggedInChild,
    isChildAuthenticated,
    isLoading: childAuthLoading,
  } = useChildAuth();

  // Fetch habits and completions for health meter
  const kidPolling = {
    // Approvals happen on the parent's device; poll so the kid sees them
    staleTime: 15_000,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  } as const;

  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/children", (loggedInChild as Child)?.id, "habits"],
    enabled: !!(loggedInChild as Child)?.id,
    ...kidPolling,
  });

  const { data: todaysCompletions = [] } = useQuery<HabitCompletion[]>({
    queryKey: [
      "/api/children",
      (loggedInChild as Child)?.id,
      "completions",
      "today",
    ],
    enabled: !!(loggedInChild as Child)?.id,
    ...kidPolling,
  });

  // Mission completion mutation - same as DailyMissions component
  const completeMissionMutation = useMutation({
    mutationFn: async (habitId: string) => {
      console.log("Completing habit:", habitId);
      const response = await apiRequest(
        "POST",
        `/api/habits/${habitId}/complete`,
        {},
      );
      console.log("Completion response:", response);
      return response;
    },
    onSuccess: (data, habitId) => {
      console.log("Mission completed successfully:", habitId);
      toast({
        title: "Mission Complete! 🎉",
        description: "Great job! You earned XP and reward points!",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/children", (loggedInChild as Child)?.id],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "/api/children",
          (loggedInChild as Child)?.id,
          "completions",
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "/api/children",
          (loggedInChild as Child)?.id,
          "completions",
          "today",
        ],
      });
    },
    onError: (error) => {
      console.error("Mission completion failed:", error);
      toast({
        title: "Oops!",
        description:
          error.message || "Could not complete mission. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Status calculation function - same as DailyMissions component
  const getHabitStatus = (habitId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const todayCompletions = todaysCompletions.filter((c) => c.date === today);
    const habitCompletions = todayCompletions.filter(
      (c) => c.habitId === habitId,
    );

    if (habitCompletions.length === 0) return "available";

    // Check for approved first - if approved, habit is done
    const approved = habitCompletions.find((c) => c.status === "approved");
    if (approved) return "approved";

    // Check for pending - if there's a pending, show pending
    const pending = habitCompletions.find((c) => c.status === "pending");
    if (pending) return "pending";

    // If only rejected, allow try again
    const rejected = habitCompletions.find((c) => c.status === "rejected");
    if (rejected) return "rejected";

    return "available";
  };

  // Only habits scheduled for today appear as missions (weekly habits on
  // their days, monthly on their day, and nothing before its start date
  // or after its end date)
  const todaysHabits = habits.filter((h) => h.isActive !== false && isHabitScheduledOn(h));

  // Health score counts each habit at most once, no matter how many
  // completion rows it has today (a rejected try + a redo used to double
  // count and push the meter past 100%)
  const today = new Date().toISOString().split("T")[0];
  const completedHabitsToday = new Set(
    todaysCompletions
      .filter((c) => c.date === today && c.status !== "rejected")
      .map((c) => c.habitId),
  ).size;
  const healthPercent =
    todaysHabits.length > 0
      ? Math.min(100, Math.round((completedHabitsToday / todaysHabits.length) * 100))
      : 0;

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
    <div className="min-h-[100dvh] hero-gradient">
      {/* Hero Header */}
      <HeroHeader child={currentChild} />

      {/* Main Content — bottom nav lives in the thumb zone */}
      <div className="container mx-auto px-4 pb-[calc(5rem+var(--safe-bottom))]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <KidBottomNav
            active={activeTab as KidTab}
            onSelect={(t) => setActiveTab(t)}
            featuresEnabled={featuresEnabled}
          />

          <TabsContent value="missions" className="space-y-3 md:space-y-6">
            <ErrorBoundary fallback={<TabError />}>
            {featuresEnabled.habits ? (
              <>
                {/* Enhanced Habit Health Meter */}
                <Card className="fun-card border-4 border-purple-400 bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardContent className="p-3 md:p-6">
                    {/* Compact strip on phones; web keeps the original larger meter */}
                    <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                      <div className="w-7 h-7 md:w-10 md:h-10 shrink-0 bg-purple-500 rounded-full flex items-center justify-center">
                        <Star className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <h2 className="font-fredoka text-base md:text-2xl text-gray-800 truncate">
                        <span className="md:hidden">Habit Health</span>
                        <span className="hidden md:inline">Habit Health Meter</span>
                      </h2>
                      <span className="text-sm font-bold text-gray-700 whitespace-nowrap ml-auto" data-testid="health-meter-count">
                        {completedHabitsToday}/{todaysHabits.length}
                      </span>
                      <span className="text-base md:text-lg font-bold text-gray-800" data-testid="health-meter-percent">
                        {healthPercent}%
                      </span>
                    </div>
                    <div className="md:bg-white/70 md:rounded-lg md:p-4 md:border-2 md:border-purple-200">
                      <div className="hidden md:block text-sm text-gray-600 mb-2 font-medium">
                        Health Score
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 md:h-4 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 h-3 md:h-4 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${healthPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Daily Missions Section */}
                <Card className="fun-card border-4 border-coral bg-gradient-to-r from-coral/5 to-orange/5">
                  <CardContent className="p-3 md:p-6">
                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-6">
                      <div className="w-8 h-8 md:w-12 md:h-12 bg-coral rounded-full flex items-center justify-center flex-shrink-0">
                        <Gamepad2 className="w-4 h-4 md:w-6 md:h-6 text-white" />
                      </div>
                      <h2 className="font-fredoka text-lg md:text-3xl text-gray-800">
                        <span className="md:hidden">Today's Missions</span>
                        <span className="hidden md:inline">Today's Hero Missions</span>
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                      {todaysHabits.map((habit) => {
                        const status = getHabitStatus(habit.id);
                        const completion = todaysCompletions.find(
                          (c) => c.habitId === habit.id,
                        );
                        // The parent's feedback from the most recent rejection
                        const rejectionFeedback =
                          status === "rejected"
                            ? todaysCompletions
                                .filter(
                                  (c) =>
                                    c.habitId === habit.id &&
                                    c.status === "rejected" &&
                                    c.parentMessage,
                                )
                                .sort(
                                  (a, b) =>
                                    new Date(b.completedAt || 0).getTime() -
                                    new Date(a.completedAt || 0).getTime(),
                                )[0]?.parentMessage
                            : null;
                        const isCompleted = status === "approved";
                        const isPending = status === "pending";
                        const canComplete =
                          status === "available" || status === "rejected";

                        return (
                          <Card
                            key={habit.id}
                            className={`relative overflow-hidden transition-all duration-300 md:hover:scale-105 border-3 ${
                              isCompleted
                                ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50"
                                : isPending
                                  ? "border-orange-400 bg-gradient-to-br from-orange-50 to-yellow-50"
                                  : "border-gray-300 bg-gradient-to-br from-white to-gray-50 hover:border-coral"
                            }`}
                          >
                            <CardContent className="p-3 md:p-6">
                              {/* Dense row on phones; web stacks into the original card shape */}
                              <div className="flex items-center gap-2.5 md:flex-col md:items-start md:gap-3">
                                {isCompleted ? (
                                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="w-5 h-5 text-white" />
                                  </div>
                                ) : isPending ? (
                                  <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-5 h-5 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Star className="w-5 h-5 text-gray-600" />
                                  </div>
                                )}

                                <div className="min-w-0 flex-1 md:w-full">
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    <h3 className="font-fredoka text-base md:text-xl text-gray-800 truncate">
                                      {habit.name}
                                    </h3>
                                    <span className="bg-gradient-to-r from-sunshine to-orange-400 text-gray-800 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-bold border border-white md:border-2 md:shadow-lg flex items-center gap-0.5 whitespace-nowrap">
                                      <Zap className="w-3 h-3" />
                                      {habit.xpReward} XP
                                    </span>
                                  </div>
                                  <div className="text-xs md:text-sm text-gray-500 truncate md:whitespace-normal md:overflow-visible md:mt-1">
                                    {habit.description ? `${habit.description} · ` : ""}
                                    <span className="text-turquoise font-medium">
                                      <span className="md:hidden">07:00–20:00</span>
                                      <span className="hidden md:inline">Available: 07:00 - 20:00</span>
                                    </span>
                                    {isCompleted && (
                                      <span className="text-green-600 font-bold"> · Completed!</span>
                                    )}
                                    {isPending && (
                                      <span className="text-orange-600 font-bold"> · Waiting for parent</span>
                                    )}
                                  </div>
                                </div>

                                {canComplete && (
                                  <Button
                                    className="super-button px-4 py-2 text-sm font-bold flex-shrink-0 md:self-end"
                                    onClick={() =>
                                      completeMissionMutation.mutate(habit.id)
                                    }
                                    // Only THIS habit's button reflects its own
                                    // in-flight completion
                                    disabled={
                                      completeMissionMutation.isPending &&
                                      completeMissionMutation.variables === habit.id
                                    }
                                    data-testid={`complete-habit-${habit.id}`}
                                  >
                                    {completeMissionMutation.isPending &&
                                    completeMissionMutation.variables === habit.id
                                      ? "..."
                                      : status === "rejected"
                                        ? "Try Again!"
                                        : "Complete!"}
                                  </Button>
                                )}

                                {isPending && (
                                  <Button
                                    disabled
                                    size="sm"
                                    className="bg-muted text-orange px-3 text-sm font-bold cursor-not-allowed flex-shrink-0 md:self-end"
                                  >
                                    Pending
                                  </Button>
                                )}
                              </div>

                              {/* Parent's feedback on a rejected attempt */}
                              {rejectionFeedback && (
                                <div
                                  className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700"
                                  data-testid={`rejection-feedback-${habit.id}`}
                                >
                                  <span className="font-bold">💬 From your parent: </span>
                                  "{rejectionFeedback}"
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {todaysHabits.length === 0 && (
                      <div className="text-center py-8 md:py-12 bg-white/50 rounded-lg border-2 border-dashed border-gray-300">
                        <Gamepad2 className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 md:mb-4" />
                        <h3 className="text-lg md:text-xl font-bold text-gray-600 mb-1 md:mb-2">
                          No missions yet!
                        </h3>
                        <p className="text-gray-500 text-sm md:text-base">
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
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="customize" className="space-y-6">
            {featuresEnabled.gearShop ? (
              <ErrorBoundary fallback={<TabError />}>
                <AvatarStudio child={currentChild as any} />
              </ErrorBoundary>
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
              <ErrorBoundary fallback={<TabError />}>
                <RewardsSection
                  childId={currentChild.id}
                  userSubscriptionStatus={
                    subscriptionInfo?.user?.subscriptionStatus || "free"
                  }
                />
              </ErrorBoundary>
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

          <TabsContent value="games" className="space-y-6">
            {featuresEnabled.miniGames ? (
              <ErrorBoundary fallback={<TabError />}>
                <GameZone childId={currentChild.id} />
              </ErrorBoundary>
            ) : (
              <Alert className="border-2 border-orange-300 bg-orange-50">
                <Lock className="h-5 w-5 text-orange-600" />
                <AlertDescription className="text-orange-800 font-medium text-base">
                  Your parent has disabled mini-games. Contact your parent to
                  enable this feature.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <ErrorBoundary fallback={<TabError />}>
              <WeeklyProgress childId={currentChild.id} />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
