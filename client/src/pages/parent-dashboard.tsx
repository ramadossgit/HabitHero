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
import { ArrowLeft, TrendingUp, Flame, Trophy, Star, Plus, UserRound, Crown, Zap, Heart, Settings, Gift, BarChart3, Shield } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Child, User, InsertChild, Habit, Reward } from "@shared/schema";

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

  const [showAddHero, setShowAddHero] = useState(false);
  const [newHeroName, setNewHeroName] = useState("");
  const [newAvatarType, setNewAvatarType] = useState("robot");

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
            <div>
              <h1 className="font-fredoka text-4xl hero-title">Parent Dashboard</h1>
              <p className="text-white/90 text-lg">🎯 Managing {child.name}'s Hero Journey</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" className="text-white hover:bg-white/20 font-bold">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Kid View
                </Button>
              </Link>
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
        {/* Top Achiever */}
        <div className="bounce-in mb-8">
          <Card className="fun-card p-6 border-4 border-coral">
            <h3 className="font-fredoka text-2xl text-gray-800 mb-4 flex items-center">
              <Trophy className="w-8 h-8 text-sunshine mr-3" />
              Top Achiever This Week
            </h3>
            <div className="flex items-center space-x-6">
              <img 
                src={getAvatarImage(child.avatarType)} 
                alt={`${child.name}'s Hero`} 
                className="w-20 h-20 rounded-full border-4 border-coral avatar-glow object-cover"
              />
              <div className="flex-1">
                <h4 className="font-fredoka text-2xl text-gray-800 mb-1">{child.name}</h4>
                <p className="text-gray-600 text-lg mb-2">
                  Level {child.level} {child.avatarType.charAt(0).toUpperCase() + child.avatarType.slice(1)} Hero
                </p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 text-sunshine" />
                    <span className="font-bold text-gray-800">{child.totalXp.toLocaleString()} XP</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="font-bold text-gray-800">{(child as any).streakCount || 0} day streak</span>
                  </div>
                </div>
              </div>
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
        <div className="space-y-8">
          {/* Habit Management Section */}
          <div className="bounce-in" style={{ animationDelay: '0.2s' }}>
            <HabitManagementSection childId={child.id} />
          </div>

          {/* Kids Management Section */}
          <div className="bounce-in" style={{ animationDelay: '0.25s' }}>
            <KidsManagementSection 
              children={children} 
              createHeroMutation={createHeroMutation} 
              getAvatarImage={getAvatarImage}
              showAddHero={showAddHero}
              setShowAddHero={setShowAddHero}
              newHeroName={newHeroName}
              setNewHeroName={setNewHeroName}
              newAvatarType={newAvatarType}
              setNewAvatarType={setNewAvatarType}
              avatarTypes={avatarTypes}
            />
          </div>

          {/* Reward Settings Section */}
          <div className="bounce-in" style={{ animationDelay: '0.3s' }}>
            <RewardSettingsSection childId={child.id} />
          </div>

          {/* Progress Reports Section */}
          <div className="bounce-in" style={{ animationDelay: '0.4s' }}>
            <ProgressReportsSection childId={child.id} />
          </div>

          {/* Parental Controls Section */}
          <div className="bounce-in" style={{ animationDelay: '0.5s' }}>
            <ParentalControlsSection childId={child.id} />
          </div>
        </div>
      </main>
    </div>
  );
}

// Habit Management Section Component
function HabitManagementSection({ childId }: { childId: string }) {
  const { data: habits, isLoading } = useQuery<Habit[]>({
    queryKey: [`/api/children/${childId}/habits`],
  });

  return (
    <Card className="fun-card p-8 border-4 border-turquoise">
      <h3 className="font-fredoka text-2xl text-gray-800 mb-6 flex items-center">
        <Settings className="w-8 h-8 text-turquoise mr-3" />
        📋 Habit Management
      </h3>
      <p className="text-gray-600 mb-6">Manage daily habits and track progress</p>
      
      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-turquoise border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {habits?.map((habit) => (
            <div key={habit.id} className="flex items-center justify-between p-4 bg-turquoise/10 rounded-lg border-2 border-turquoise/30">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: habit.color }}></div>
                <div>
                  <div className="font-bold text-gray-800">{habit.name}</div>
                  <div className="text-sm text-gray-600">{habit.description}</div>
                </div>
              </div>
              <div className="text-sm font-bold text-turquoise">{habit.xpReward} XP</div>
            </div>
          ))}
          <Button className="w-full bg-turquoise hover:bg-turquoise/80 text-white font-bold">
            + Add New Habit
          </Button>
        </div>
      )}
    </Card>
  );
}

// Reward Settings Section Component
function RewardSettingsSection({ childId }: { childId: string }) {
  const { data: rewards, isLoading } = useQuery<Reward[]>({
    queryKey: [`/api/children/${childId}/rewards`],
  });

  return (
    <Card className="fun-card p-8 border-4 border-purple-500">
      <h3 className="font-fredoka text-2xl text-gray-800 mb-6 flex items-center">
        <Gift className="w-8 h-8 text-purple-500 mr-3" />
        🎁 Reward Settings
      </h3>
      <p className="text-gray-600 mb-6">Set up rewards and incentives</p>
      
      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {rewards?.map((reward) => (
            <div key={reward.id} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <div>
                <div className="font-bold text-gray-800">{reward.name}</div>
                <div className="text-sm text-gray-600">{reward.description}</div>
              </div>
              <div className="text-sm font-bold text-purple-600">
                {reward.cost} {reward.costType === 'habits' ? 'habits' : 'streak days'}
              </div>
            </div>
          ))}
          <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold">
            + Add New Reward
          </Button>
        </div>
      )}
    </Card>
  );
}

// Progress Reports Section Component
function ProgressReportsSection({ childId }: { childId: string }) {
  const { data: completions } = useQuery<any[]>({
    queryKey: [`/api/children/${childId}/completions`],
  });

  const completionRate = completions ? Math.round((completions.length / 7) * 100) : 0;

  return (
    <Card className="fun-card p-8 border-4 border-sky">
      <h3 className="font-fredoka text-2xl text-gray-800 mb-6 flex items-center">
        <BarChart3 className="w-8 h-8 text-sky mr-3" />
        📊 Progress Reports
      </h3>
      <p className="text-gray-600 mb-6">View detailed analytics and progress</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-sky/10 rounded-lg border-2 border-sky/30">
          <div className="font-bold text-2xl text-gray-800">{completionRate}%</div>
          <div className="text-sm text-gray-600">This Week</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
          <div className="font-bold text-2xl text-gray-800">{completions?.length || 0}</div>
          <div className="text-sm text-gray-600">Total Completions</div>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
          <div className="font-bold text-2xl text-gray-800">7</div>
          <div className="text-sm text-gray-600">Days Tracked</div>
        </div>
      </div>
      
      <Button className="w-full bg-sky hover:bg-sky/80 text-white font-bold">
        📈 View Detailed Reports
      </Button>
    </Card>
  );
}

// Parental Controls Section Component
function ParentalControlsSection({ childId }: { childId: string }) {
  return (
    <Card className="fun-card p-8 border-4 border-orange-500">
      <h3 className="font-fredoka text-2xl text-gray-800 mb-6 flex items-center">
        <Shield className="w-8 h-8 text-orange-500 mr-3" />
        🔐 Parental Controls
      </h3>
      <p className="text-gray-600 mb-6">Configure safety and time limits</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
          <div className="font-bold text-gray-800 mb-2">Screen Time Limit</div>
          <div className="text-sm text-gray-600">2 hours daily</div>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
          <div className="font-bold text-gray-800 mb-2">Bedtime Mode</div>
          <div className="text-sm text-gray-600">8:00 PM - 7:00 AM</div>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
          <div className="font-bold text-gray-800 mb-2">Game Access</div>
          <div className="text-sm text-gray-600">Habit completion required</div>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
          <div className="font-bold text-gray-800 mb-2">Safety Features</div>
          <div className="text-sm text-gray-600">Content filtering enabled</div>
        </div>
      </div>
      
      <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold">
        ⚙️ Configure Controls
      </Button>
    </Card>
  );
}

// Kids Management Section Component
function KidsManagementSection({ 
  children, 
  createHeroMutation, 
  getAvatarImage,
  showAddHero,
  setShowAddHero,
  newHeroName,
  setNewHeroName,
  newAvatarType,
  setNewAvatarType,
  avatarTypes
}: { 
  children: Child[]; 
  createHeroMutation: any;
  getAvatarImage: (type: string) => string;
  showAddHero: boolean;
  setShowAddHero: (show: boolean) => void;
  newHeroName: string;
  setNewHeroName: (name: string) => void;
  newAvatarType: string;
  setNewAvatarType: (type: string) => void;
  avatarTypes: any[];
}) {
  const { toast } = useToast();

  const handleAddHero = () => {
    if (!newHeroName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the hero!",
        variant: "destructive",
      });
      return;
    }
    createHeroMutation.mutate({ 
      name: newHeroName.trim(), 
      avatarType: newAvatarType 
    });
    setNewHeroName("");
    setNewAvatarType("robot");
    setShowAddHero(false);
  };

  return (
    <Card className="fun-card p-8 border-4 border-purple-500">
      <h3 className="font-fredoka text-2xl text-gray-800 mb-6 flex items-center">
        <UserRound className="w-8 h-8 text-purple-500 mr-3" />
        👨‍👩‍👧‍👦 Kids Management
      </h3>
      <p className="text-gray-600 mb-6">Manage all your children's hero accounts</p>
      
      <div className="space-y-4 mb-6">
        {children.map((child) => (
          <div key={child.id} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
            <div className="flex items-center space-x-4">
              <img 
                src={getAvatarImage(child.avatarType)} 
                alt={child.name} 
                className="w-12 h-12 rounded-full border-2 border-purple-300 object-cover"
              />
              <div>
                <div className="font-bold text-gray-800">{child.name}</div>
                <div className="text-sm text-gray-600">
                  Level {child.level} • {child.avatarType.charAt(0).toUpperCase() + child.avatarType.slice(1)} Hero
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-purple-600">{child.totalXp.toLocaleString()} XP</div>
              <div className="text-xs text-gray-500">Total Earned</div>
            </div>
          </div>
        ))}
      </div>

      {!showAddHero ? (
        <Button 
          onClick={() => setShowAddHero(true)}
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Hero
        </Button>
      ) : (
        <div className="space-y-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
          <h4 className="font-bold text-gray-800">Create New Hero</h4>
          
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="Enter hero name..."
              value={newHeroName}
              onChange={(e) => setNewHeroName(e.target.value)}
              className="border-2 border-purple-300"
            />
            
            <div className="grid grid-cols-2 gap-2">
              {avatarTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setNewAvatarType(type.id)}
                  className={`p-3 rounded-lg cursor-pointer border-2 text-center ${
                    newAvatarType === type.id
                      ? 'border-purple-500 bg-purple-100'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.name.split(' ')[0]}</div>
                  <div className="text-xs text-gray-600">{type.name.split(' ').slice(1).join(' ')}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={handleAddHero}
              disabled={createHeroMutation.isPending}
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
            >
              {createHeroMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Hero
            </Button>
            <Button 
              onClick={() => setShowAddHero(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
