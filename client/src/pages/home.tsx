import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCog } from "lucide-react";
import { Link } from "wouter";
import HeroHeader from "@/components/kid/hero-header";
import DailyMissions from "@/components/kid/daily-missions";
import HeroCustomization from "@/components/kid/hero-customization";
import RewardsSection from "@/components/kid/rewards-section";
import WeeklyProgress from "@/components/kid/weekly-progress";
import type { Child } from "@shared/schema";

export default function Home() {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const { data: children, isLoading: childrenLoading } = useQuery<Child[]>({
    queryKey: ["/api/children"],
  });

  const selectedChild = children?.find((child: Child) => child.id === selectedChildId) || children?.[0];

  if (childrenLoading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 magic-gradient rounded-full mx-auto mb-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          </div>
          <p className="text-white text-xl font-bold">✨ Loading your heroes... ✨</p>
        </div>
      </div>
    );
  }

  if (!children || children.length === 0) {
    return (
      <div className="min-h-screen hero-gradient">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="font-fredoka text-6xl mb-8 hero-title bounce-in">🎉 Welcome to Habit Heroes! 🎉</h1>
            <div className="fun-card max-w-md mx-auto">
              <CardContent className="p-8">
                <h2 className="font-fredoka text-3xl rainbow-text mb-4">🦸 Create Your First Hero!</h2>
                <p className="text-gray-700 mb-6 text-lg font-semibold">
                  Let's start your EPIC adventure by creating an amazing hero character! 🚀
                </p>
                <Link href="/parent">
                  <Button className="super-button text-xl px-8 py-4">
                    🎮 Go to Parent Dashboard ⚡
                  </Button>
                </Link>
              </CardContent>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-16 h-16 bg-sunshine rounded-full float"></div>
        <div className="absolute top-32 right-16 w-12 h-12 bg-purple rounded-full float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-16 w-10 h-10 bg-mint rounded-full float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-10 right-10 w-14 h-14 bg-orange rounded-full float" style={{ animationDelay: '0.5s' }}></div>
      </div>
      
      {/* Navigation Toggle */}
      <div className="fixed top-4 right-4 z-50 flex space-x-2">
        {/* Logout Button */}
        <Button 
          onClick={() => window.location.href = "/api/logout"}
          className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg shadow-lg"
        >
          🚪 Sign Out
        </Button>
        
        {children && children.length > 1 && (
          <div className="fun-card p-3">
            <select
              value={selectedChildId || children[0]?.id}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="bg-transparent border-none outline-none text-gray-800 font-bold text-lg"
            >
              {children.map((child: Child) => (
                <option key={child.id} value={child.id}>
                  🦸 {child.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <Link href="/parent">
          <div className="fun-card p-3">
            <Button variant="ghost" className="text-gray-800 hover:bg-purple/20 font-bold">
              <UserCog className="w-5 h-5 mr-2" />
              👨‍👩‍👧‍👦 Parent
            </Button>
          </div>
        </Link>
      </div>

      {selectedChild && (
        <div className="relative z-10">
          <div className="bounce-in">
            <HeroHeader child={selectedChild} />
          </div>
          
          <main className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="bounce-in" style={{ animationDelay: '0.2s' }}>
              <DailyMissions childId={selectedChild.id} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bounce-in" style={{ animationDelay: '0.4s' }}>
                <HeroCustomization child={selectedChild} />
              </div>
              <div className="bounce-in" style={{ animationDelay: '0.6s' }}>
                <RewardsSection childId={selectedChild.id} />
              </div>
            </div>
            
            <div className="bounce-in" style={{ animationDelay: '0.8s' }}>
              <WeeklyProgress childId={selectedChild.id} />
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
