import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp, Flame, Trophy, Star } from "lucide-react";
import HabitManagement from "@/components/parent/habit-management";
import RewardSettings from "@/components/parent/reward-settings";
import ProgressReports from "@/components/parent/progress-reports";
import ParentalControls from "@/components/parent/parental-controls";
import type { Child, User } from "@shared/schema";

export default function ParentDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  const { data: children, isLoading: childrenLoading } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    enabled: isAuthenticated,
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

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
      <div className="min-h-screen bg-gray-50">
        <header className="bg-gray-800 text-white p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-fredoka text-3xl hero-title">Parent Dashboard</h1>
                <p className="text-gray-300">Habit Heroes - Welcome!</p>
              </div>
              <div className="flex items-center space-x-4">
                <img 
                  src={(user as User)?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60"} 
                  alt="Parent Profile" 
                  className="w-12 h-12 rounded-full border-2 border-white object-cover"
                />
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-6xl mx-auto p-6">
          <Card className="p-8 text-center">
            <h2 className="font-fredoka text-2xl text-gray-800 mb-4">Create Your First Hero</h2>
            <p className="text-gray-600 mb-6">
              Welcome to Habit Heroes! Let's create a hero character for your child to get started.
            </p>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Child's Name"
                className="w-full max-w-sm mx-auto px-4 py-2 border border-gray-300 rounded-lg"
              />
              <div>
                <Button className="bg-coral hover:bg-coral/80 text-white">
                  Create Hero Character
                </Button>
              </div>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  const child = children[0] as Child;
  const completionRate = 85; // TODO: Calculate from actual data
  const currentStreak = 7; // TODO: Calculate from actual data
  const badgesEarned = 23; // TODO: Calculate from actual data

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-800 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" className="text-white hover:bg-gray-700">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Kid View
                </Button>
              </Link>
              <div>
                <h1 className="font-fredoka text-3xl hero-title">Parent Dashboard</h1>
                <p className="text-gray-300">Habit Heroes - Managing {child.name}'s Progress</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-300">Total Family XP This Week</div>
                <div className="font-bold text-xl">{child.totalXp.toLocaleString()} XP</div>
              </div>
              <img 
                src={(user as User)?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60"} 
                alt="Parent Profile" 
                className="w-12 h-12 rounded-full border-2 border-white object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-mint mx-auto mb-3" />
            <div className="font-bold text-2xl text-gray-800">{completionRate}%</div>
            <div className="text-gray-600">Completion Rate</div>
          </Card>
          <Card className="p-6 text-center">
            <Flame className="w-8 h-8 text-orange-500 mx-auto mb-3" />
            <div className="font-bold text-2xl text-gray-800">{currentStreak}</div>
            <div className="text-gray-600">Current Streak</div>
          </Card>
          <Card className="p-6 text-center">
            <Trophy className="w-8 h-8 text-sunshine mx-auto mb-3" />
            <div className="font-bold text-2xl text-gray-800">{badgesEarned}</div>
            <div className="text-gray-600">Badges Earned</div>
          </Card>
          <Card className="p-6 text-center">
            <Star className="w-8 h-8 text-coral mx-auto mb-3" />
            <div className="font-bold text-2xl text-gray-800">{child.level}</div>
            <div className="text-gray-600">Current Level</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <HabitManagement childId={child.id} />
          <RewardSettings childId={child.id} />
        </div>

        <ProgressReports childId={child.id} />
        
        <ParentalControls childId={child.id} />
      </main>
    </div>
  );
}
