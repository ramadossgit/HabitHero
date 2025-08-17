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
import { Gamepad2, Trophy, Star, Settings, Lock } from "lucide-react";
import type { Child, ParentalControls } from "@shared/schema";

export default function Home() {
  const [activeTab, setActiveTab] = useState("missions");
  
  // Single-user experience - only for logged in children
  const { child: loggedInChild, isChildAuthenticated, isLoading: childAuthLoading } = useChildAuth();

  // Fetch habits and completions for health meter
  const { data: habits = [] } = useQuery({
    queryKey: ["/api/children", loggedInChild?.id, "habits"],
    enabled: !!loggedInChild?.id,
  });

  const { data: todaysCompletions = [] } = useQuery({
    queryKey: ["/api/children", loggedInChild?.id, "completions", "today"],
    enabled: !!loggedInChild?.id,
  });

  if (childAuthLoading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 magic-gradient rounded-full mx-auto mb-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          </div>
          <p className="text-white text-xl font-bold">✨ Loading your hero... ✨</p>
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
            <h1 className="font-fredoka text-6xl mb-8 hero-title bounce-in">🎉 Welcome to Habit Heroes! 🎉</h1>
            <div className="fun-card max-w-md mx-auto">
              <CardContent className="p-8">
                <h2 className="font-fredoka text-3xl rainbow-text mb-4">🦸 Start Your Adventure!</h2>
                <p className="text-gray-700 mb-6 text-lg font-semibold">
                  Login with your hero credentials to start your EPIC adventure! 🚀
                </p>
                <div className="space-y-4">
                  <Button 
                    className="super-button text-xl px-8 py-4 w-full"
                    onClick={() => window.location.href = "/kids-login"}
                  >
                    🎮 Start Adventure ⚡
                  </Button>
                  <div className="text-sm text-gray-600">
                    Login with your hero username and PIN to start your adventure!
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
          <h2 className="text-2xl mb-4">No hero data found!</h2>
          <Button onClick={() => window.location.href = "/kids-login"}>
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  const currentChild = loggedInChild as Child;

  // Fetch parental controls for the current child
  const { data: parentalControls } = useQuery<ParentalControls>({
    queryKey: ['/api/children', currentChild.id, 'parental-controls'],
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
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger 
              value="missions" 
              className="flex items-center gap-2"
              disabled={!featuresEnabled.habits}
            >
              {featuresEnabled.habits ? <Gamepad2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              Missions
            </TabsTrigger>
            <TabsTrigger 
              value="customize" 
              className="flex items-center gap-2"
              disabled={!featuresEnabled.gearShop}
            >
              {featuresEnabled.gearShop ? <Settings className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              Customize
            </TabsTrigger>
            <TabsTrigger 
              value="rewards" 
              className="flex items-center gap-2"
              disabled={!featuresEnabled.rewards}
            >
              {featuresEnabled.rewards ? <Trophy className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              Rewards
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="missions" className="space-y-6">
            {featuresEnabled.habits ? (
              <>
                <HabitHealthMeter 
                  habits={habits} 
                  completions={todaysCompletions} 
                  childName={currentChild.name} 
                />
                <DailyMissions childId={currentChild.id} />
              </>
            ) : (
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Your parent has disabled daily habits. Contact your parent to enable this feature.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="customize" className="space-y-6">
            {featuresEnabled.gearShop ? (
              <HeroCustomization child={currentChild} />
            ) : (
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Your parent has disabled hero customization. Contact your parent to enable this feature.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            {featuresEnabled.rewards ? (
              <RewardsSection childId={currentChild.id} />
            ) : (
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Your parent has disabled rewards. Contact your parent to enable this feature.
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