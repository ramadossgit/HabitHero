import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
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

  const { data: children, isLoading: childrenLoading } = useQuery({
    queryKey: ["/api/children"],
  });

  const selectedChild = children?.find((child: Child) => child.id === selectedChildId) || children?.[0];

  if (childrenLoading) {
    return (
      <div className="min-h-screen bg-light-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your heroes...</p>
        </div>
      </div>
    );
  }

  if (!children || children.length === 0) {
    return (
      <div className="min-h-screen bg-light-bg">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="font-fredoka text-4xl text-gray-800 mb-8">Welcome to Habit Heroes!</h1>
            <Card className="max-w-md mx-auto p-6">
              <h2 className="font-fredoka text-2xl text-gray-800 mb-4">Create Your First Hero</h2>
              <p className="text-gray-600 mb-6">
                Let's start by creating a hero character for your child!
              </p>
              <Link href="/parent">
                <Button className="bg-coral hover:bg-coral/80 text-white">
                  Go to Parent Dashboard
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg">
      {/* Navigation Toggle */}
      <div className="fixed top-4 right-4 z-50 flex space-x-2">
        {children && children.length > 1 && (
          <div className="bg-white rounded-full p-2 shadow-lg border-2 border-coral">
            <select
              value={selectedChildId || children[0]?.id}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="bg-transparent border-none outline-none text-coral font-bold"
            >
              {children.map((child: Child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <Link href="/parent">
          <Button className="bg-white rounded-full p-3 shadow-lg border-2 border-coral hover:bg-coral hover:text-white">
            <UserCog className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      {selectedChild && (
        <>
          <HeroHeader child={selectedChild} />
          
          <main className="max-w-6xl mx-auto p-6">
            <DailyMissions childId={selectedChild.id} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <HeroCustomization child={selectedChild} />
              <RewardsSection childId={selectedChild.id} />
            </div>
            
            <WeeklyProgress childId={selectedChild.id} />
          </main>
        </>
      )}
    </div>
  );
}
