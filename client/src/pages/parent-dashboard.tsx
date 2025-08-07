import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp, Flame, Trophy, Star, Plus, UserRound, Crown, Zap, Heart } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Child, User, InsertChild } from "@shared/schema";

export default function ParentDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [heroName, setHeroName] = useState("");
  const [avatarType, setAvatarType] = useState("robot");

  const { data: children, isLoading: childrenLoading } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    enabled: isAuthenticated,
  });

  const createHeroMutation = useMutation({
    mutationFn: async (heroData: { name: string; avatarType: string }) => {
      await apiRequest("POST", "/api/children", {
        name: heroData.name,
        avatarType: heroData.avatarType,
        level: 1,
        xp: 0,
        totalXp: 0,
        streakCount: 0,
        unlockedGear: [],
      });
    },
    onSuccess: () => {
      toast({
        title: "Hero Created! 🎉",
        description: "Your hero is ready for adventures!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      setHeroName("");
      setAvatarType("robot");
    },
    onError: (error) => {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateHero = () => {
    if (!heroName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your hero!",
        variant: "destructive",
      });
      return;
    }
    createHeroMutation.mutate({ name: heroName.trim(), avatarType });
  };

  const avatarTypes = [
    { id: "robot", name: "🤖 Robot Hero", icon: UserRound, description: "Tech-savvy and logical" },
    { id: "princess", name: "👑 Princess Hero", icon: Crown, description: "Elegant and wise" },
    { id: "ninja", name: "🥷 Ninja Hero", icon: Zap, description: "Stealthy and swift" },
    { id: "animal", name: "🦁 Animal Hero", icon: Heart, description: "Wild and brave" },
  ];

  const getAvatarImage = (type: string) => {
    const images = {
      robot: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
      princess: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
      ninja: "https://images.unsplash.com/photo-1555952517-2e8e729e0b44?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
      animal: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    };
    return images[type as keyof typeof images] || images.robot;
  };

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
      <div className="min-h-screen hero-gradient">
        <header className="text-white p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-fredoka text-4xl hero-title">Parent Dashboard</h1>
                <p className="text-white/90 text-lg">✨ Welcome to Habit Heroes! ✨</p>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <Button variant="ghost" className="text-white hover:bg-white/20 font-bold">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Home
                  </Button>
                </Link>
                <img 
                  src={(user as User)?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60"} 
                  alt="Parent Profile" 
                  className="w-12 h-12 rounded-full border-4 border-white avatar-glow object-cover"
                />
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

  const child = children[0] as Child;
  const completionRate = 85; // TODO: Calculate from actual data
  const currentStreak = 7; // TODO: Calculate from actual data
  const badgesEarned = 23; // TODO: Calculate from actual data

  return (
    <div className="min-h-screen hero-gradient">
      <header className="text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" className="text-white hover:bg-white/20 font-bold">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Kid View
                </Button>
              </Link>
              <div>
                <h1 className="font-fredoka text-4xl hero-title">Parent Dashboard</h1>
                <p className="text-white/90 text-lg">🎯 Managing {child.name}'s Hero Journey</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-white/80">Total Family XP This Week</div>
                <div className="font-bold text-2xl">{child.totalXp.toLocaleString()} XP ⭐</div>
              </div>
              <img 
                src={(user as User)?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60"} 
                alt="Parent Profile" 
                className="w-12 h-12 rounded-full border-4 border-white avatar-glow object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 relative z-10">
        {/* Hero Overview */}
        <div className="bounce-in mb-8">
          <Card className="fun-card p-6 border-4 border-coral">
            <div className="flex items-center space-x-6">
              <img 
                src={getAvatarImage(child.avatarType)} 
                alt={`${child.name}'s Hero`} 
                className="w-24 h-24 rounded-full border-4 border-coral avatar-glow object-cover"
              />
              <div className="flex-1">
                <h2 className="font-fredoka text-3xl text-gray-800 mb-2">{child.name}</h2>
                <p className="text-gray-600 text-lg mb-3">
                  Level {child.level} {child.avatarType.charAt(0).toUpperCase() + child.avatarType.slice(1)} Hero
                </p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 text-sunshine" />
                    <span className="font-bold text-gray-800">{child.totalXp.toLocaleString()} XP</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="font-bold text-gray-800">{child.streakCount} day streak</span>
                  </div>
                </div>
              </div>
              <Button 
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Another Hero
              </Button>
            </div>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bounce-in" style={{ animationDelay: '0.1s' }}>
            <Card className="fun-card p-6 text-center border-4 border-mint">
              <TrendingUp className="w-12 h-12 text-mint mx-auto mb-3" />
              <div className="font-bold text-3xl text-gray-800">{completionRate}%</div>
              <div className="text-gray-600 font-bold">Completion Rate</div>
            </Card>
          </div>
          <div className="bounce-in" style={{ animationDelay: '0.2s' }}>
            <Card className="fun-card p-6 text-center border-4 border-orange-500">
              <Flame className="w-12 h-12 text-orange-500 mx-auto mb-3" />
              <div className="font-bold text-3xl text-gray-800">{currentStreak}</div>
              <div className="text-gray-600 font-bold">Current Streak</div>
            </Card>
          </div>
          <div className="bounce-in" style={{ animationDelay: '0.3s' }}>
            <Card className="fun-card p-6 text-center border-4 border-sunshine">
              <Trophy className="w-12 h-12 text-sunshine mx-auto mb-3" />
              <div className="font-bold text-3xl text-gray-800">{badgesEarned}</div>
              <div className="text-gray-600 font-bold">Badges Earned</div>
            </Card>
          </div>
          <div className="bounce-in" style={{ animationDelay: '0.4s' }}>
            <Card className="fun-card p-6 text-center border-4 border-coral">
              <Star className="w-12 h-12 text-coral mx-auto mb-3" />
              <div className="font-bold text-3xl text-gray-800">{child.level}</div>
              <div className="text-gray-600 font-bold">Current Level</div>
            </Card>
          </div>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bounce-in" style={{ animationDelay: '0.5s' }}>
            <Card className="fun-card p-8 border-4 border-turquoise">
              <h3 className="font-fredoka text-2xl text-gray-800 mb-6 flex items-center">
                📋 Habit Management
              </h3>
              <p className="text-gray-600 mb-4">Manage daily habits and track progress</p>
              <Button className="w-full bg-turquoise hover:bg-turquoise/80 text-white font-bold">
                Configure Habits
              </Button>
            </Card>
          </div>
          <div className="bounce-in" style={{ animationDelay: '0.6s' }}>
            <Card className="fun-card p-8 border-4 border-purple-500">
              <h3 className="font-fredoka text-2xl text-gray-800 mb-6 flex items-center">
                🎁 Reward Settings
              </h3>
              <p className="text-gray-600 mb-4">Set up rewards and incentives</p>
              <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold">
                Manage Rewards
              </Button>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bounce-in" style={{ animationDelay: '0.7s' }}>
            <Card className="fun-card p-8 border-4 border-sky">
              <h3 className="font-fredoka text-2xl text-gray-800 mb-6 flex items-center">
                📊 Progress Reports
              </h3>
              <p className="text-gray-600 mb-4">View detailed analytics and progress</p>
              <Button className="w-full bg-sky hover:bg-sky/80 text-white font-bold">
                View Reports
              </Button>
            </Card>
          </div>
          <div className="bounce-in" style={{ animationDelay: '0.8s' }}>
            <Card className="fun-card p-8 border-4 border-orange-500">
              <h3 className="font-fredoka text-2xl text-gray-800 mb-6 flex items-center">
                🔐 Parental Controls
              </h3>
              <p className="text-gray-600 mb-4">Configure safety and time limits</p>
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold">
                Manage Controls
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
