import { useState } from "react";
import { useChildAuth } from "@/hooks/useChildAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HeroHeader from "@/components/kid/hero-header";
import DailyMissions from "@/components/kid/daily-missions";
import HeroCustomization from "@/components/kid/hero-customization";
import RewardsSection from "@/components/kid/rewards-section";
import WeeklyProgress from "@/components/kid/weekly-progress";
import { Gamepad2, Trophy, Star, Settings } from "lucide-react";
import type { Child } from "@shared/schema";

export default function Home() {
  const [activeTab, setActiveTab] = useState("missions");
  
  // Single-user experience - only for logged in children
  const { child: loggedInChild, isChildAuthenticated, isLoading: childAuthLoading } = useChildAuth();

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

  return (
    <div className="min-h-screen hero-gradient">
      {/* Hero Header */}
      <HeroHeader child={currentChild} />

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="missions" className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              Missions
            </TabsTrigger>
            <TabsTrigger value="customize" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Customize
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Rewards
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="missions" className="space-y-6">
            <DailyMissions childId={currentChild.id} />
          </TabsContent>

          <TabsContent value="customize" className="space-y-6">
            <HeroCustomization child={currentChild} />
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            <RewardsSection childId={currentChild.id} />
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <WeeklyProgress childId={currentChild.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}