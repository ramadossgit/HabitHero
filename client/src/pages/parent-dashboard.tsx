import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp, Flame, Trophy, Star, Plus, UserRound, Crown, Zap, Heart, Settings, Gift, BarChart3, Shield, X } from "lucide-react";
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
    mutationFn: async (heroData: { name: string; avatarType: string; avatarUrl?: string }) => {
      await apiRequest("POST", "/api/children", {
        name: heroData.name,
        avatarType: heroData.avatarType,
        avatarUrl: heroData.avatarUrl,
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

  const deleteChildMutation = useMutation({
    mutationFn: async (childId: string) => {
      await apiRequest("DELETE", `/api/children/${childId}`);
    },
    onSuccess: () => {
      toast({
        title: "Hero Deleted",
        description: "Hero profile has been removed.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete hero profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const [newAvatarImage, setNewAvatarImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  
  const handleImageUpload = (file: File) => {
    setNewAvatarImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateHero = () => {
    if (!heroName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your hero!",
        variant: "destructive",
      });
      return;
    }
    
    const heroData: any = { 
      name: heroName.trim(), 
      avatarType 
    };
    
    // Add image URL if preview exists (simulating upload)
    if (imagePreview) {
      heroData.avatarUrl = imagePreview;
    }
    
    createHeroMutation.mutate(heroData);
  };

  const [showAddHero, setShowAddHero] = useState(false);
  const [newHeroName, setNewHeroName] = useState("");
  const [newAvatarType, setNewAvatarType] = useState("robot");
  
  // Form states for different management sections
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showControls, setShowControls] = useState(false);

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
      <header className="text-white p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="font-fredoka text-2xl sm:text-4xl hero-title">Parent Dashboard</h1>
              <p className="text-white/90 text-sm sm:text-lg">🎯 Managing {child.name}'s Hero Journey</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <div className="flex gap-2">
                <Link href="/">
                  <Button variant="ghost" className="text-white hover:bg-white/20 font-bold text-xs sm:text-sm px-2 sm:px-4">
                    <ArrowLeft className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Back to Home</span>
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/20 font-bold text-xs sm:text-sm px-2 sm:px-4"
                  onClick={() => window.location.href = "/api/logout"}
                >
                  Sign Out
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs sm:text-sm text-white/80">Total Family XP</div>
                  <div className="font-bold text-lg sm:text-2xl">{child.totalXp.toLocaleString()} XP ⭐</div>
                </div>
                <img 
                  src={(user as User)?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60"} 
                  alt="Parent Profile" 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-white avatar-glow object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Hero Profile Card */}
        <div className="mb-8">
          <Card className="fun-card p-4 sm:p-8 border-4 border-sunshine">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative flex-shrink-0">
                <img 
                  src={child.avatarUrl || getAvatarImage(child.avatarType)} 
                  alt={`${child.name}'s Hero`} 
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-sunshine avatar-glow object-cover"
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 bg-coral rounded-full flex items-center justify-center border-4 border-white">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="font-fredoka text-2xl sm:text-3xl text-gray-800 hero-title">{child.name}</h2>
                <p className="text-gray-600 text-sm sm:text-base">Level {child.level} {child.avatarType.charAt(0).toUpperCase() + child.avatarType.slice(1)} Hero</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                  <span className="px-3 py-1 bg-sunshine/20 text-sunshine-dark rounded-full text-xs font-bold">
                    {child.totalXp.toLocaleString()} Total XP
                  </span>
                  <span className="px-3 py-1 bg-coral/20 text-coral-dark rounded-full text-xs font-bold">
                    Current Streak: 5 days
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-8">
          <div className="bounce-in" style={{ animationDelay: '0.1s' }}>
            <Card className="fun-card p-3 sm:p-6 text-center border-4 border-mint">
              <TrendingUp className="w-8 h-8 sm:w-12 sm:h-12 text-mint mx-auto mb-2 sm:mb-3" />
              <div className="font-bold text-2xl sm:text-3xl text-gray-800">{completionRate}%</div>
              <div className="text-gray-600 font-bold text-xs sm:text-base">Completion Rate</div>
            </Card>
          </div>
          <div className="bounce-in" style={{ animationDelay: '0.2s' }}>
            <Card className="fun-card p-3 sm:p-6 text-center border-4 border-orange-500">
              <Flame className="w-8 h-8 sm:w-12 sm:h-12 text-orange-500 mx-auto mb-2 sm:mb-3" />
              <div className="font-bold text-2xl sm:text-3xl text-gray-800">{currentStreak}</div>
              <div className="text-gray-600 font-bold text-xs sm:text-base">Current Streak</div>
            </Card>
          </div>
          <div className="bounce-in" style={{ animationDelay: '0.3s' }}>
            <Card className="fun-card p-3 sm:p-6 text-center border-4 border-sunshine">
              <Trophy className="w-8 h-8 sm:w-12 sm:h-12 text-sunshine mx-auto mb-2 sm:mb-3" />
              <div className="font-bold text-2xl sm:text-3xl text-gray-800">{badgesEarned}</div>
              <div className="text-gray-600 font-bold text-xs sm:text-base">Badges Earned</div>
            </Card>
          </div>
          <div className="bounce-in" style={{ animationDelay: '0.4s' }}>
            <Card className="fun-card p-3 sm:p-6 text-center border-4 border-coral">
              <Star className="w-8 h-8 sm:w-12 sm:h-12 text-coral mx-auto mb-2 sm:mb-3" />
              <div className="font-bold text-2xl sm:text-3xl text-gray-800">{child.level}</div>
              <div className="text-gray-600 font-bold text-xs sm:text-base">Current Level</div>
            </Card>
          </div>
        </div>

        {/* Management Sections */}
        <div className="space-y-8">
          {/* Habit Management Section */}
          <div className="bounce-in" style={{ animationDelay: '0.2s' }}>
            <HabitManagementSection childId={child.id} showAddHabit={showAddHabit} setShowAddHabit={setShowAddHabit} />
          </div>

          {/* Kids Management Section */}
          <div className="bounce-in" style={{ animationDelay: '0.25s' }}>
            <KidsManagementSection 
              children={children} 
              createHeroMutation={createHeroMutation}
              deleteChildMutation={deleteChildMutation}
              getAvatarImage={getAvatarImage}
              showAddHero={showAddHero}
              setShowAddHero={setShowAddHero}
              newHeroName={newHeroName}
              setNewHeroName={setNewHeroName}
              newAvatarType={newAvatarType}
              setNewAvatarType={setNewAvatarType}
              avatarTypes={avatarTypes}
              imagePreview={imagePreview}
              handleImageUpload={handleImageUpload}
            />
          </div>

          {/* Reward Settings Section */}
          <div className="bounce-in" style={{ animationDelay: '0.3s' }}>
            <RewardSettingsSection childId={child.id} showAddReward={showAddReward} setShowAddReward={setShowAddReward} />
          </div>

          {/* Progress Reports Section */}
          <div className="bounce-in" style={{ animationDelay: '0.4s' }}>
            <ProgressReportsSection childId={child.id} showReports={showReports} setShowReports={setShowReports} />
          </div>

          {/* Parental Controls Section */}
          <div className="bounce-in" style={{ animationDelay: '0.5s' }}>
            <ParentalControlsSection childId={child.id} showControls={showControls} setShowControls={setShowControls} />
          </div>
        </div>
      </main>
    </div>
  );
}

// Habit Management Section Component
function HabitManagementSection({ childId, showAddHabit, setShowAddHabit }: { 
  childId: string; 
  showAddHabit: boolean; 
  setShowAddHabit: (show: boolean) => void; 
}) {
  const { toast } = useToast();
  const [habitName, setHabitName] = useState("");
  const [habitDescription, setHabitDescription] = useState("");
  const [habitIcon, setHabitIcon] = useState("⚡");
  const [habitXP, setHabitXP] = useState("50");
  const [habitColor, setHabitColor] = useState("turquoise");
  const [editingHabit, setEditingHabit] = useState<string | null>(null);
  const [editHabitName, setEditHabitName] = useState("");
  const [editHabitDescription, setEditHabitDescription] = useState("");
  const [editHabitIcon, setEditHabitIcon] = useState("⚡");
  const [editHabitXP, setEditHabitXP] = useState("50");
  const [editHabitColor, setEditHabitColor] = useState("turquoise");

  const { data: habits, isLoading } = useQuery<Habit[]>({
    queryKey: [`/api/children/${childId}/habits`],
  });

  const createHabitMutation = useMutation({
    mutationFn: async (habitData: any) => {
      await apiRequest("POST", `/api/children/${childId}/habits`, habitData);
    },
    onSuccess: () => {
      toast({
        title: "Habit Created! 🎯",
        description: "New habit has been added successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/habits`] });
      setHabitName("");
      setHabitDescription("");
      setHabitIcon("⚡");
      setHabitXP("50");
      setHabitColor("turquoise");
      setShowAddHabit(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create habit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const editHabitMutation = useMutation({
    mutationFn: async (data: { habitId: string; updates: any }) => {
      await apiRequest("PATCH", `/api/habits/${data.habitId}`, data.updates);
    },
    onSuccess: () => {
      toast({
        title: "Habit Updated! 🎯",
        description: "Habit has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/habits`] });
      setEditingHabit(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update habit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteHabitMutation = useMutation({
    mutationFn: async (habitId: string) => {
      await apiRequest("DELETE", `/api/habits/${habitId}`);
    },
    onSuccess: () => {
      toast({
        title: "Habit Deleted! 🗑️",
        description: "Habit has been removed successfully!",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/habits`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete habit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddHabit = () => {
    if (!habitName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the habit!",
        variant: "destructive",
      });
      return;
    }
    createHabitMutation.mutate({
      childId,
      name: habitName.trim(),
      description: habitDescription.trim(),
      icon: habitIcon,
      xpReward: parseInt(habitXP),
      color: habitColor,
      frequency: "daily",
      isActive: true,
    });
  };

  return (
    <Card className="fun-card p-4 sm:p-8 border-4 border-turquoise">
      <div className="flex items-center mb-4 sm:mb-6">
        <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-turquoise mr-2 sm:mr-3" />
        <div>
          <h3 className="font-fredoka text-xl sm:text-2xl text-gray-800 hero-title">📋 Habit Management</h3>
          <p className="text-gray-600 text-sm sm:text-base">Manage daily habits and track progress</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-turquoise border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {habits?.map((habit) => (
            <div key={habit.id} className="p-4 bg-turquoise/10 rounded-lg border-2 border-turquoise/30">
              {editingHabit === habit.id ? (
                <div className="space-y-3">
                  <Input
                    value={editHabitName}
                    onChange={(e) => setEditHabitName(e.target.value)}
                    placeholder="Habit name"
                    className="border-2 border-turquoise"
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        editHabitMutation.mutate({
                          habitId: habit.id,
                          updates: {
                            name: editHabitName,
                            description: editHabitDescription,
                            icon: editHabitIcon,
                            xpReward: parseInt(editHabitXP),
                            color: editHabitColor,
                          }
                        });
                      }}
                      disabled={editHabitMutation.isPending}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      {editHabitMutation.isPending ? "Saving..." : "💾 Save"}
                    </Button>
                    <Button
                      onClick={() => setEditingHabit(null)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{habit.icon}</div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">{habit.name}</div>
                      <div className="text-sm text-gray-600">{habit.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right mr-4">
                      <div className="text-sm font-bold text-turquoise">{habit.xpReward} XP</div>
                      <div className="text-xs text-gray-500">Reward</div>
                    </div>
                    <Button
                      onClick={() => {
                        setEditingHabit(habit.id);
                        setEditHabitName(habit.name);
                        setEditHabitDescription(habit.description || "");
                        setEditHabitIcon(habit.icon);
                        setEditHabitXP(habit.xpReward.toString());
                        setEditHabitColor(habit.color || "turquoise");
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs"
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm(`Delete "${habit.name}" habit? This cannot be undone.`)) {
                          deleteHabitMutation.mutate(habit.id);
                        }
                      }}
                      disabled={deleteHabitMutation.isPending}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs"
                    >
                      {deleteHabitMutation.isPending ? "..." : "🗑️"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {!showAddHabit ? (
            <Button 
              onClick={() => setShowAddHabit(true)}
              className="w-full bg-turquoise hover:bg-turquoise/80 text-white font-bold"
            >
              + Add New Habit
            </Button>
          ) : (
            <div className="space-y-4 p-4 bg-turquoise/10 rounded-lg border-2 border-turquoise/30">
              <h4 className="font-bold text-gray-800">Create New Habit</h4>
              
              <div className="space-y-3">
                <Input
                  placeholder="Habit name (e.g., Brush Teeth)"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={habitDescription}
                  onChange={(e) => setHabitDescription(e.target.value)}
                  rows={2}
                />
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-bold text-gray-700">Icon</label>
                    <Select value={habitIcon} onValueChange={setHabitIcon}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="⚡">⚡ Energy</SelectItem>
                        <SelectItem value="🦷">🦷 Teeth</SelectItem>
                        <SelectItem value="📚">📚 Reading</SelectItem>
                        <SelectItem value="🏃">🏃 Exercise</SelectItem>
                        <SelectItem value="🥗">🥗 Healthy Food</SelectItem>
                        <SelectItem value="💤">💤 Sleep</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700">XP Reward</label>
                    <Select value={habitXP} onValueChange={setHabitXP}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25 XP</SelectItem>
                        <SelectItem value="50">50 XP</SelectItem>
                        <SelectItem value="75">75 XP</SelectItem>
                        <SelectItem value="100">100 XP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700">Color</label>
                    <Select value={habitColor} onValueChange={setHabitColor}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="turquoise">🔵 Turquoise</SelectItem>
                        <SelectItem value="coral">🔴 Coral</SelectItem>
                        <SelectItem value="sunshine">🟡 Sunshine</SelectItem>
                        <SelectItem value="mint">🟢 Mint</SelectItem>
                        <SelectItem value="purple">🟣 Purple</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleAddHabit}
                  disabled={createHabitMutation.isPending}
                  className="flex-1 bg-turquoise hover:bg-turquoise/80 text-white"
                >
                  {createHabitMutation.isPending ? "Creating..." : "🎯 Create Habit"}
                </Button>
                <Button 
                  onClick={() => setShowAddHabit(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// Kids Management Section Component
function KidsManagementSection({ 
  children, 
  createHeroMutation,
  deleteChildMutation,
  getAvatarImage,
  showAddHero,
  setShowAddHero,
  newHeroName,
  setNewHeroName,
  newAvatarType,
  setNewAvatarType,
  avatarTypes,
  imagePreview,
  handleImageUpload
}: { 
  children: Child[]; 
  createHeroMutation: any;
  deleteChildMutation: any;
  getAvatarImage: (type: string) => string;
  showAddHero: boolean;
  setShowAddHero: (show: boolean) => void;
  newHeroName: string;
  setNewHeroName: (name: string) => void;
  newAvatarType: string;
  setNewAvatarType: (type: string) => void;
  avatarTypes: any[];
  imagePreview: string;
  handleImageUpload: (file: File) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingChild, setEditingChild] = useState<string | null>(null);
  const [editingCredentials, setEditingCredentials] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [editChildName, setEditChildName] = useState("");
  const [editChildAvatarType, setEditChildAvatarType] = useState("");
  const [editImagePreview, setEditImagePreview] = useState("");

  const updateCredentialsMutation = useMutation({
    mutationFn: async (data: { childId: string; username: string; pin: string }) => {
      await apiRequest("PATCH", `/api/children/${data.childId}`, {
        username: data.username,
        pin: data.pin
      });
    },
    onSuccess: () => {
      toast({
        title: "Login Credentials Updated! 🔐",
        description: "Child can now log in with their username and PIN!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      setEditingCredentials(null);
      setUsername("");
      setPin("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update credentials. Username might already be taken.",
        variant: "destructive",
      });
    },
  });

  const updateChildMutation = useMutation({
    mutationFn: async (data: { childId: string; name: string; avatarType: string; avatarUrl?: string }) => {
      await apiRequest("PATCH", `/api/children/${data.childId}`, {
        name: data.name,
        avatarType: data.avatarType,
        avatarUrl: data.avatarUrl
      });
    },
    onSuccess: () => {
      toast({
        title: "Hero Updated! ✨",
        description: "Hero profile has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      setEditingChild(null);
      setEditChildName("");
      setEditChildAvatarType("");
      setEditImagePreview("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update hero profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateCredentials = (childId: string) => {
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username for the child!",
        variant: "destructive",
      });
      return;
    }
    if (!pin.trim() || pin.length !== 4) {
      toast({
        title: "PIN required",
        description: "Please enter a 4-digit PIN!",
        variant: "destructive",
      });
      return;
    }
    updateCredentialsMutation.mutate({ childId, username: username.trim(), pin: pin.trim() });
  };

  const handleAddHero = () => {
    if (!newHeroName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the hero!",
        variant: "destructive",
      });
      return;
    }
    
    const heroData: any = { 
      name: newHeroName.trim(), 
      avatarType: newAvatarType 
    };
    
    if (imagePreview) {
      heroData.avatarUrl = imagePreview;
    }
    
    createHeroMutation.mutate(heroData);
    setNewHeroName("");
    setNewAvatarType("robot");
    setShowAddHero(false);
  };

  return (
    <Card className="fun-card p-4 sm:p-8 border-4 border-purple-500">
      <div className="flex items-center mb-4 sm:mb-6">
        <UserRound className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 mr-2 sm:mr-3" />
        <div>
          <h3 className="font-fredoka text-xl sm:text-2xl text-gray-800 hero-title">👨‍👩‍👧‍👦 Kids Management</h3>
          <p className="text-gray-600 text-sm sm:text-base">Manage all your children's hero accounts</p>
        </div>
      </div>
      
      <div className="space-y-3 sm:space-y-4 mb-6">
        {children.map((child) => (
          <div key={child.id} className="p-3 sm:p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="relative flex-shrink-0">
                  <img 
                    src={child.avatarUrl || getAvatarImage(child.avatarType)} 
                    alt={child.name} 
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-purple-300 object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-gray-800 text-sm sm:text-base truncate">{child.name}</div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Level {child.level} • {child.avatarType.charAt(0).toUpperCase() + child.avatarType.slice(1)} Hero
                  </div>
                  <div className="text-xs mt-1">
                    {child.username ? (
                      <span className="text-green-600 font-medium">✅ Login: {child.username}</span>
                    ) : (
                      <span className="text-orange-600 font-medium">⚠️ No login set up</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="text-left sm:text-right">
                  <div className="text-sm font-bold text-purple-600">{child.totalXp.toLocaleString()} XP</div>
                  <div className="text-xs text-gray-500">Total Earned</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      setEditingChild(editingChild === child.id ? null : child.id);
                      setEditChildName(child.name);
                      setEditChildAvatarType(child.avatarType);
                      setEditImagePreview("");
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 sm:px-3 py-1 text-xs"
                  >
                    ✏️ Edit
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingCredentials(editingCredentials === child.id ? null : child.id);
                      setUsername(child.username || "");
                      setPin("");
                    }}
                    className={`${child.username ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'} text-white px-2 sm:px-3 py-1 text-xs`}
                  >
                    {child.username ? '🔐 Edit Login' : '🔐 Setup Login'}
                  </Button>
                  <Button
                    onClick={() => {
                      if (confirm(`Delete ${child.name}'s hero profile? This cannot be undone.`)) {
                        deleteChildMutation.mutate(child.id);
                      }
                    }}
                    disabled={deleteChildMutation.isPending}
                    className="bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 py-1 text-xs"
                  >
                    {deleteChildMutation.isPending ? "..." : "🗑️"}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Edit Child Profile */}
            {editingChild === child.id && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <h4 className="font-bold text-gray-800 mb-3">✏️ Edit Hero Profile</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-bold text-gray-700">Hero Name</label>
                    <Input
                      type="text"
                      placeholder="Enter hero name..."
                      value={editChildName}
                      onChange={(e) => setEditChildName(e.target.value)}
                      className="border-2 border-blue-300"
                    />
                  </div>
                  
                  {/* Avatar Type Selection */}
                  <div>
                    <label className="text-sm font-bold text-gray-700">Hero Type</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {avatarTypes.map((type) => (
                        <div
                          key={type.id}
                          onClick={() => setEditChildAvatarType(type.id)}
                          className={`p-2 rounded-lg cursor-pointer border-2 text-center ${
                            editChildAvatarType === type.id
                              ? 'border-blue-500 bg-blue-100'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="text-xl mb-1">{type.name.split(' ')[0]}</div>
                          <div className="text-xs text-gray-600">{type.name.split(' ').slice(1).join(' ')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Image Upload */}
                  <div>
                    <label className="text-sm font-bold text-gray-700">Custom Avatar (Optional)</label>
                    <div className="flex items-center space-x-3 mt-2">
                      {editImagePreview ? (
                        <img src={editImagePreview} alt="Preview" className="w-12 h-12 rounded-full border-2 border-blue-300 object-cover" />
                      ) : (
                        <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center bg-gray-50">
                          <span className="text-gray-400 text-xs">📷</span>
                        </div>
                      )}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleEditImageUpload(e.target.files[0])}
                          className="hidden"
                          id={`edit-avatar-${child.id}`}
                        />
                        <label
                          htmlFor={`edit-avatar-${child.id}`}
                          className="inline-block px-3 py-2 bg-blue-100 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-200 transition-colors text-sm font-bold"
                        >
                          📷 Upload
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        updateChildMutation.mutate({
                          childId: child.id,
                          name: editChildName.trim(),
                          avatarType: editChildAvatarType,
                          avatarUrl: editImagePreview || undefined
                        });
                      }}
                      disabled={updateChildMutation.isPending || !editChildName.trim()}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {updateChildMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>✨ Save Changes</>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingChild(null);
                        setEditChildName("");
                        setEditChildAvatarType("");
                        setEditImagePreview("");
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Login Credentials Setup */}
            {editingCredentials === child.id && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <h4 className="font-bold text-gray-800 mb-3">🔐 Setup Child Login</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Create a username and 4-digit PIN so {child.name} can log in independently!
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-bold text-gray-700">Username</label>
                    <Input
                      type="text"
                      placeholder="Choose a fun username..."
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="border-2 border-green-300"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700">4-Digit PIN</label>
                    <Input
                      type="password"
                      placeholder="Enter 4-digit PIN (e.g. 1234)"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.slice(0, 4))}
                      maxLength={4}
                      className="border-2 border-green-300"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleUpdateCredentials(child.id)}
                      disabled={updateCredentialsMutation.isPending}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      {updateCredentialsMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>🔐 Save Login</>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingCredentials(null);
                        setUsername("");
                        setPin("");
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                  {child.username && (
                    <div className="text-sm text-green-600 bg-green-100 p-2 rounded">
                      ✅ {child.name} can log in with username: <strong>{child.username}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}
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
            
            {/* Image Upload Section */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Custom Avatar Image (Optional)</label>
              <div className="flex items-center space-x-4">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-16 h-16 rounded-full border-2 border-purple-300 object-cover"
                    />
                    <button
                      onClick={() => window.location.reload()}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center bg-gray-50">
                    <span className="text-gray-400 text-xs">📷</span>
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    className="hidden"
                    id="avatar-upload-new"
                  />
                  <label
                    htmlFor="avatar-upload-new"
                    className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-lg cursor-pointer hover:bg-purple-200 transition-colors text-sm font-bold"
                  >
                    📷 Upload Image
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Upload a custom avatar or use default type below</p>
                </div>
              </div>
            </div>
            
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

// Reward Settings Section Component
function RewardSettingsSection({ childId, showAddReward, setShowAddReward }: { 
  childId: string; 
  showAddReward: boolean; 
  setShowAddReward: (show: boolean) => void; 
}) {
  const { toast } = useToast();
  const [rewardName, setRewardName] = useState("");
  const [rewardDescription, setRewardDescription] = useState("");
  const [rewardCost, setRewardCost] = useState("100");
  const [rewardIcon, setRewardIcon] = useState("🎁");
  const [editingReward, setEditingReward] = useState<string | null>(null);
  const [editRewardName, setEditRewardName] = useState("");
  const [editRewardDescription, setEditRewardDescription] = useState("");
  const [editRewardCost, setEditRewardCost] = useState("100");
  const [editRewardIcon, setEditRewardIcon] = useState("🎁");

  const { data: rewards, isLoading } = useQuery<Reward[]>({
    queryKey: [`/api/children/${childId}/rewards`],
  });

  const createRewardMutation = useMutation({
    mutationFn: async (rewardData: any) => {
      await apiRequest("POST", `/api/children/${childId}/rewards`, rewardData);
    },
    onSuccess: () => {
      toast({
        title: "Reward Created! 🎁",
        description: "New reward has been added successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/rewards`] });
      setRewardName("");
      setRewardDescription("");
      setRewardCost("100");
      setRewardIcon("🎁");
      setShowAddReward(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create reward. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteRewardMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      await apiRequest("DELETE", `/api/rewards/${rewardId}`);
    },
    onSuccess: () => {
      toast({
        title: "Reward Deleted! 🗑️",
        description: "Reward has been removed successfully!",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/rewards`] });
    },
  });

  const updateRewardMutation = useMutation({
    mutationFn: async (data: { rewardId: string; name: string; description: string; icon: string; cost: number }) => {
      await apiRequest("PATCH", `/api/rewards/${data.rewardId}`, {
        name: data.name,
        description: data.description,
        icon: data.icon,
        cost: data.cost
      });
    },
    onSuccess: () => {
      toast({
        title: "Reward Updated! 🎁",
        description: "Reward has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/rewards`] });
      setEditingReward(null);
      setEditRewardName("");
      setEditRewardDescription("");
      setEditRewardCost("100");
      setEditRewardIcon("🎁");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update reward. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddReward = () => {
    if (!rewardName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the reward!",
        variant: "destructive",
      });
      return;
    }
    createRewardMutation.mutate({
      childId,
      name: rewardName.trim(),
      description: rewardDescription.trim(),
      icon: rewardIcon,
      cost: parseInt(rewardCost),
      isActive: true,
    });
  };

  return (
    <Card className="fun-card p-4 sm:p-8 border-4 border-orange-500">
      <div className="flex items-center mb-4 sm:mb-6">
        <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mr-2 sm:mr-3" />
        <div>
          <h3 className="font-fredoka text-xl sm:text-2xl text-gray-800 hero-title">🎁 Reward Settings</h3>
          <p className="text-gray-600 text-sm sm:text-base">Set up rewards for completing habits</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {rewards?.map((reward) => (
            <div key={reward.id} className="space-y-4">
              <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🎁</div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">{reward.name}</div>
                      <div className="text-sm text-gray-600">{reward.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right mr-4">
                      <div className="text-sm font-bold text-orange-600">{reward.cost} XP</div>
                      <div className="text-xs text-gray-500">Cost</div>
                    </div>
                    <Button
                      onClick={() => {
                        setEditingReward(editingReward === reward.id ? null : reward.id);
                        setEditRewardName(reward.name);
                        setEditRewardDescription(reward.description || "");
                        setEditRewardCost(reward.cost.toString());
                        setEditRewardIcon("🎁");
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs"
                    >
                      ✏️
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm(`Delete "${reward.name}" reward? This cannot be undone.`)) {
                          deleteRewardMutation.mutate(reward.id);
                        }
                      }}
                      disabled={deleteRewardMutation.isPending}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs"
                    >
                      {deleteRewardMutation.isPending ? "..." : "🗑️"}
                    </Button>
                  </div>
                </div>
              </div>
              
              {editingReward === reward.id && (
                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <h4 className="font-bold text-gray-800 mb-3">✏️ Edit Reward</h4>
                  <div className="space-y-3">
                    <Input
                      placeholder="Reward name"
                      value={editRewardName}
                      onChange={(e) => setEditRewardName(e.target.value)}
                    />
                    <Textarea
                      placeholder="Description (optional)"
                      value={editRewardDescription}
                      onChange={(e) => setEditRewardDescription(e.target.value)}
                      rows={2}
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-bold text-gray-700">Icon</label>
                        <Select value={editRewardIcon} onValueChange={setEditRewardIcon}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="🎁">🎁 Gift</SelectItem>
                            <SelectItem value="🍭">🍭 Candy</SelectItem>
                            <SelectItem value="🎮">🎮 Game Time</SelectItem>
                            <SelectItem value="📱">📱 Screen Time</SelectItem>
                            <SelectItem value="🎉">🎉 Special Treat</SelectItem>
                            <SelectItem value="⭐">⭐ Gold Star</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-700">XP Cost</label>
                        <Select value={editRewardCost} onValueChange={setEditRewardCost}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="50">50 XP</SelectItem>
                            <SelectItem value="100">100 XP</SelectItem>
                            <SelectItem value="200">200 XP</SelectItem>
                            <SelectItem value="300">300 XP</SelectItem>
                            <SelectItem value="500">500 XP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-3">
                    <Button
                      onClick={() => {
                        updateRewardMutation.mutate({
                          rewardId: reward.id,
                          name: editRewardName.trim(),
                          description: editRewardDescription.trim(),
                          icon: editRewardIcon,
                          cost: parseInt(editRewardCost)
                        });
                      }}
                      disabled={updateRewardMutation.isPending || !editRewardName.trim()}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {updateRewardMutation.isPending ? "Saving..." : "✨ Save Changes"}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingReward(null);
                        setEditRewardName("");
                        setEditRewardDescription("");
                        setEditRewardCost("100");
                        setEditRewardIcon("🎁");
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {!showAddReward ? (
            <Button 
              onClick={() => setShowAddReward(true)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold"
            >
              + Add New Reward
            </Button>
          ) : (
            <div className="space-y-4 p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
              <h4 className="font-bold text-gray-800">Create New Reward</h4>
              
              <div className="space-y-3">
                <Input
                  placeholder="Reward name (e.g., Extra Screen Time)"
                  value={rewardName}
                  onChange={(e) => setRewardName(e.target.value)}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={rewardDescription}
                  onChange={(e) => setRewardDescription(e.target.value)}
                  rows={2}
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-bold text-gray-700">Icon</label>
                    <Select value={rewardIcon} onValueChange={setRewardIcon}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="🎁">🎁 Gift</SelectItem>
                        <SelectItem value="🍭">🍭 Candy</SelectItem>
                        <SelectItem value="🎮">🎮 Game Time</SelectItem>
                        <SelectItem value="📱">📱 Screen Time</SelectItem>
                        <SelectItem value="🎉">🎉 Special Treat</SelectItem>
                        <SelectItem value="⭐">⭐ Gold Star</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700">XP Cost</label>
                    <Select value={rewardCost} onValueChange={setRewardCost}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50 XP</SelectItem>
                        <SelectItem value="100">100 XP</SelectItem>
                        <SelectItem value="200">200 XP</SelectItem>
                        <SelectItem value="300">300 XP</SelectItem>
                        <SelectItem value="500">500 XP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleAddReward}
                  disabled={createRewardMutation.isPending}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {createRewardMutation.isPending ? "Creating..." : "🎁 Create Reward"}
                </Button>
                <Button 
                  onClick={() => setShowAddReward(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// Progress Reports Section Component
function ProgressReportsSection({ childId, showReports, setShowReports }: { 
  childId: string; 
  showReports: boolean; 
  setShowReports: (show: boolean) => void; 
}) {
  const [timeFrame, setTimeFrame] = useState("week");

  const { data: child } = useQuery<Child>({
    queryKey: [`/api/children/${childId}`],
  });

  const { data: habits } = useQuery<Habit[]>({
    queryKey: [`/api/children/${childId}/habits`],
  });

  const { data: completions } = useQuery({
    queryKey: [`/api/children/${childId}/completions`, timeFrame],
  });

  // Mock data for demonstration - in real app would come from API
  const weeklyData = [
    { day: "Mon", xp: 75, habits: 3 },
    { day: "Tue", xp: 100, habits: 4 },
    { day: "Wed", xp: 50, habits: 2 },
    { day: "Thu", xp: 125, habits: 5 },
    { day: "Fri", xp: 75, habits: 3 },
    { day: "Sat", xp: 150, habits: 6 },
    { day: "Sun", xp: 100, habits: 4 },
  ];

  const habitStats = habits?.map(habit => ({
    name: habit.name,
    icon: habit.icon,
    completions: Math.floor(Math.random() * 7) + 1, // Mock data
    streak: Math.floor(Math.random() * 10) + 1, // Mock data
    totalXP: habit.xpReward * (Math.floor(Math.random() * 7) + 1)
  })) || [];

  return (
    <Card className="fun-card p-4 sm:p-8 border-4 border-mint">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <div className="flex items-center">
          <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-mint mr-2 sm:mr-3" />
          <div>
            <h3 className="font-fredoka text-xl sm:text-2xl text-gray-800 hero-title">📊 Progress Reports</h3>
            <p className="text-gray-600 text-sm sm:text-base">Track your child's progress over time</p>
          </div>
        </div>
        <Select value={timeFrame} onValueChange={setTimeFrame}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-mint/10 p-4 rounded-lg border-2 border-mint/30">
          <div className="text-2xl font-bold text-mint">{child?.totalXp || 0}</div>
          <div className="text-sm text-gray-600">Total XP</div>
        </div>
        <div className="bg-orange-100 p-4 rounded-lg border-2 border-orange-300">
          <div className="text-2xl font-bold text-orange-600">{child?.level || 1}</div>
          <div className="text-sm text-gray-600">Current Level</div>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg border-2 border-purple-300">
          <div className="text-2xl font-bold text-purple-600">5</div>
          <div className="text-sm text-gray-600">Best Streak</div>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg border-2 border-blue-300">
          <div className="text-2xl font-bold text-blue-600">{habits?.length || 0}</div>
          <div className="text-sm text-gray-600">Active Habits</div>
        </div>
      </div>

      {/* Weekly XP Chart */}
      <div className="mb-6">
        <h4 className="font-bold text-gray-800 mb-3">Weekly XP Progress</h4>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-end justify-between h-32 space-x-2">
            {weeklyData.map((day, index) => (
              <div key={day.day} className="flex-1 flex flex-col items-center">
                <div 
                  className="bg-mint rounded-t w-full transition-all hover:bg-mint/80"
                  style={{ height: `${(day.xp / 150) * 100}%`, minHeight: '8px' }}
                  title={`${day.xp} XP`}
                ></div>
                <div className="text-xs text-gray-600 mt-2">{day.day}</div>
                <div className="text-xs font-bold text-mint">{day.xp}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Habit Performance */}
      <div>
        <h4 className="font-bold text-gray-800 mb-3">Habit Performance</h4>
        <div className="space-y-3">
          {habitStats.map((habit, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{habit.icon}</div>
                  <div>
                    <div className="font-bold text-gray-800">{habit.name}</div>
                    <div className="text-sm text-gray-600">
                      {habit.completions} completions • {habit.streak} day streak
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-mint">{habit.totalXP} XP</div>
                  <div className="text-xs text-gray-500">Earned</div>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-mint h-2 rounded-full transition-all"
                    style={{ width: `${(habit.completions / 7) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{habit.completions}/7 this week</div>
              </div>
            </div>
          ))}
        </div>
        
        {habitStats.length === 0 && (
          <div className="text-center py-8">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No habits created yet. Add some habits to see progress reports!</p>
          </div>
        )}
      </div>
    </Card>
  );
}

// Parental Controls Section Component
function ParentalControlsSection({ childId, showControls, setShowControls }: { 
  childId: string; 
  showControls: boolean; 
  setShowControls: (show: boolean) => void; 
}) {
  const { toast } = useToast();
  const [screenTimeLimit, setScreenTimeLimit] = useState("60");
  const [bedtimeMode, setBedtimeMode] = useState(false);
  const [bedtimeStart, setBedtimeStart] = useState("20:00");
  const [bedtimeEnd, setBedtimeEnd] = useState("07:00");
  const [gameAccess, setGameAccess] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [parentApprovalRequired, setParentApprovalRequired] = useState(false);

  const { data: child } = useQuery<Child>({
    queryKey: [`/api/children/${childId}`],
  });

  const updateControlsMutation = useMutation({
    mutationFn: async (controlsData: any) => {
      await apiRequest("PATCH", `/api/children/${childId}/controls`, controlsData);
    },
    onSuccess: () => {
      toast({
        title: "Controls Updated! 🛡️",
        description: "Parental controls have been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update controls. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveControls = () => {
    updateControlsMutation.mutate({
      screenTimeLimit: parseInt(screenTimeLimit),
      bedtimeMode,
      bedtimeStart,
      bedtimeEnd,
      gameAccess,
      notificationsEnabled,
      parentApprovalRequired,
    });
  };

  return (
    <Card className="fun-card p-4 sm:p-8 border-4 border-red-500">
      <h3 className="font-fredoka text-xl sm:text-2xl text-gray-800 mb-4 sm:mb-6 flex items-center">
        <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mr-2 sm:mr-3" />
        🛡️ Parental Controls
      </h3>
      <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Manage app usage and safety settings</p>
      
      <div className="space-y-6">
        {/* Screen Time Limits */}
        <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center">
            <Settings className="w-5 h-5 text-red-500 mr-2" />
            Screen Time Limits
          </h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-bold text-gray-700">Daily App Usage Limit</label>
              <Select value={screenTimeLimit} onValueChange={setScreenTimeLimit}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-gray-600">
              Current usage today: 23 minutes remaining
            </div>
          </div>
        </div>

        {/* Bedtime Mode */}
        <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center">
            <Settings className="w-5 h-5 text-purple-500 mr-2" />
            Bedtime Mode
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">Enable Bedtime Mode</span>
              <Button
                onClick={() => setBedtimeMode(!bedtimeMode)}
                variant={bedtimeMode ? "default" : "outline"}
                size="sm"
                className={bedtimeMode ? "bg-purple-500 hover:bg-purple-600" : ""}
              >
                {bedtimeMode ? "Enabled" : "Disabled"}
              </Button>
            </div>
            {bedtimeMode && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-gray-700">Bedtime Start</label>
                  <Input
                    type="time"
                    value={bedtimeStart}
                    onChange={(e) => setBedtimeStart(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">Wake Up Time</label>
                  <Input
                    type="time"
                    value={bedtimeEnd}
                    onChange={(e) => setBedtimeEnd(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
            <div className="text-sm text-gray-600">
              {bedtimeMode ? `App will be locked from ${bedtimeStart} to ${bedtimeEnd}` : "Child can use app anytime"}
            </div>
          </div>
        </div>

        {/* App Features */}
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center">
            <Settings className="w-5 h-5 text-blue-500 mr-2" />
            App Features
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-gray-700">Mini-Games Access</div>
                <div className="text-xs text-gray-500">Allow child to play educational mini-games</div>
              </div>
              <Button
                onClick={() => setGameAccess(!gameAccess)}
                variant={gameAccess ? "default" : "outline"}
                size="sm"
                className={gameAccess ? "bg-blue-500 hover:bg-blue-600" : ""}
              >
                {gameAccess ? "Enabled" : "Disabled"}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-gray-700">Push Notifications</div>
                <div className="text-xs text-gray-500">Send habit reminders and achievement notifications</div>
              </div>
              <Button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                variant={notificationsEnabled ? "default" : "outline"}
                size="sm"
                className={notificationsEnabled ? "bg-blue-500 hover:bg-blue-600" : ""}
              >
                {notificationsEnabled ? "Enabled" : "Disabled"}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-gray-700">Parent Approval Required</div>
                <div className="text-xs text-gray-500">Require approval for reward redemptions</div>
              </div>
              <Button
                onClick={() => setParentApprovalRequired(!parentApprovalRequired)}
                variant={parentApprovalRequired ? "default" : "outline"}
                size="sm"
                className={parentApprovalRequired ? "bg-blue-500 hover:bg-blue-600" : ""}
              >
                {parentApprovalRequired ? "Required" : "Not Required"}
              </Button>
            </div>
          </div>
        </div>

        {/* Emergency Controls */}
        <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center">
            <Shield className="w-5 h-5 text-yellow-600 mr-2" />
            Emergency Controls
          </h4>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full border-yellow-400 text-yellow-700 hover:bg-yellow-100"
            >
              🚫 Temporarily Lock App (1 hour)
            </Button>
            <Button
              variant="outline"
              className="w-full border-orange-400 text-orange-700 hover:bg-orange-100"
            >
              🔄 Reset All Progress (Caution!)
            </Button>
            <div className="text-xs text-gray-500">
              Emergency controls take effect immediately and will send notifications to your child.
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex space-x-2">
          <Button
            onClick={handleSaveControls}
            disabled={updateControlsMutation.isPending}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold"
          >
            {updateControlsMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Saving...
              </>
            ) : (
              <>🛡️ Save Controls</>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}