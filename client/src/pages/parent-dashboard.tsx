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
  const [newAvatarImage, setNewAvatarImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  
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
                  Back to Home
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/20 font-bold"
                onClick={() => window.location.href = "/api/logout"}
              >
                Sign Out
              </Button>
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
              {children.length > 1 ? "All Heroes Progress" : "Top Achiever This Week"}
            </h3>
            <div className="space-y-4">
              {children
                .sort((a, b) => b.totalXp - a.totalXp) // Sort by highest XP first
                .map((hero, index) => (
                  <div key={hero.id} className={`flex items-center space-x-6 p-4 rounded-lg ${index === 0 ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-gray-50'}`}>
                    <div className="relative">
                      <img 
                        src={hero.avatarUrl || getAvatarImage(hero.avatarType)} 
                        alt={`${hero.name}'s Hero`} 
                        className="w-16 h-16 rounded-full border-4 border-coral avatar-glow object-cover"
                      />
                      {index === 0 && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Trophy className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-fredoka text-xl text-gray-800 mb-1">
                        {hero.name} {index === 0 && "👑"}
                      </h4>
                      <p className="text-gray-600 mb-2">
                        Level {hero.level} {hero.avatarType.charAt(0).toUpperCase() + hero.avatarType.slice(1)} Hero
                      </p>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-sunshine" />
                          <span className="font-bold text-gray-800">{hero.totalXp.toLocaleString()} XP</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span className="font-bold text-gray-800">{(hero as any).streakCount || 0} day streak</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
            <div key={habit.id} className="p-4 bg-turquoise/10 rounded-lg border-2 border-turquoise/30">
              {editingHabit === habit.id ? (
                <div className="space-y-3">
                  <Input
                    value={editHabitName}
                    onChange={(e) => setEditHabitName(e.target.value)}
                    placeholder="Habit name"
                    className="border-2 border-turquoise"
                  />
                  <Input
                    value={editHabitDescription}
                    onChange={(e) => setEditHabitDescription(e.target.value)}
                    placeholder="Description"
                    className="border-2 border-turquoise"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-bold text-gray-700">Icon</label>
                      <Select value={editHabitIcon} onValueChange={setEditHabitIcon}>
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
                      <Select value={editHabitXP} onValueChange={setEditHabitXP}>
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
                      <Select value={editHabitColor} onValueChange={setEditHabitColor}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="turquoise">🟢 Turquoise</SelectItem>
                          <SelectItem value="coral">🔴 Coral</SelectItem>
                          <SelectItem value="sunshine">🟡 Yellow</SelectItem>
                          <SelectItem value="purple">🟣 Purple</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
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
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: habit.color }}></div>
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
                        setEditHabitDescription(habit.description);
                        setEditHabitIcon(habit.icon);
                        setEditHabitXP(habit.xpReward.toString());
                        setEditHabitColor(habit.color);
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
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-800">Create New Habit</h4>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAddHabit(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
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
                  {createHabitMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create Habit
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

// Reward Settings Section Component
function RewardSettingsSection({ childId, showAddReward, setShowAddReward }: { 
  childId: string; 
  showAddReward: boolean; 
  setShowAddReward: (show: boolean) => void; 
}) {
  const { toast } = useToast();
  const [rewardName, setRewardName] = useState("");
  const [rewardDescription, setRewardDescription] = useState("");
  const [rewardCost, setRewardCost] = useState("1");
  const [rewardType, setRewardType] = useState("habits");
  const [editingReward, setEditingReward] = useState<string | null>(null);
  const [editRewardName, setEditRewardName] = useState("");
  const [editRewardDescription, setEditRewardDescription] = useState("");
  const [editRewardCost, setEditRewardCost] = useState("1");

  const { data: rewards, isLoading } = useQuery<Reward[]>({
    queryKey: [`/api/children/${childId}/rewards`],
  });

  const createRewardMutation = useMutation({
    mutationFn: async (rewardData: any) => {
      await apiRequest("POST", "/api/rewards", rewardData);
    },
    onSuccess: () => {
      toast({
        title: "Reward Created! 🎁",
        description: "New reward has been added successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/rewards`] });
      setRewardName("");
      setRewardDescription("");
      setRewardCost("1");
      setRewardType("habits");
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

  const editRewardMutation = useMutation({
    mutationFn: async (data: { rewardId: string; updates: any }) => {
      await apiRequest("PATCH", `/api/rewards/${data.rewardId}`, data.updates);
    },
    onSuccess: () => {
      toast({
        title: "Reward Updated! 🎁",
        description: "Reward has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/rewards`] });
      setEditingReward(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update reward. Please try again.",
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
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete reward. Please try again.",
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
      cost: parseInt(rewardCost),
      costType: rewardType,
      isActive: true,
    });
  };

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
            <div key={reward.id} className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              {editingReward === reward.id ? (
                <div className="space-y-3">
                  <Input
                    value={editRewardName}
                    onChange={(e) => setEditRewardName(e.target.value)}
                    placeholder="Reward name"
                    className="border-2 border-purple-300"
                  />
                  <Input
                    value={editRewardDescription}
                    onChange={(e) => setEditRewardDescription(e.target.value)}
                    placeholder="Description"
                    className="border-2 border-purple-300"
                  />
                  <Input
                    type="number"
                    value={editRewardCost}
                    onChange={(e) => setEditRewardCost(e.target.value)}
                    placeholder="Cost"
                    min="1"
                    className="border-2 border-purple-300"
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        editRewardMutation.mutate({
                          rewardId: reward.id,
                          updates: {
                            name: editRewardName,
                            description: editRewardDescription,
                            cost: parseInt(editRewardCost),
                          }
                        });
                      }}
                      disabled={editRewardMutation.isPending}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      {editRewardMutation.isPending ? "Saving..." : "💾 Save"}
                    </Button>
                    <Button
                      onClick={() => setEditingReward(null)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-bold text-gray-800">{reward.name}</div>
                    <div className="text-sm text-gray-600">{reward.description}</div>
                    <div className="text-sm text-purple-600">
                      Cost: {reward.cost} {reward.costType === 'habits' ? 'Habits' : 'XP Points'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right mr-4">
                      <div className="text-sm font-bold text-purple-600">
                        {reward.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setEditingReward(reward.id);
                        setEditRewardName(reward.name);
                        setEditRewardDescription(reward.description);
                        setEditRewardCost(reward.cost.toString());
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs"
                    >
                      ✏️ Edit
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
              )}
            </div>
          ))}
          
          {!showAddReward ? (
            <Button 
              onClick={() => setShowAddReward(true)}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold"
            >
              + Add New Reward
            </Button>
          ) : (
            <div className="space-y-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-800">Create New Reward</h4>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAddReward(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <Input
                  placeholder="Reward name (e.g., Extra Screen Time)"
                  value={rewardName}
                  onChange={(e) => setRewardName(e.target.value)}
                />
                <Textarea
                  placeholder="Description (e.g., 30 minutes extra tablet time)"
                  value={rewardDescription}
                  onChange={(e) => setRewardDescription(e.target.value)}
                  rows={2}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-bold text-gray-700">Cost</label>
                    <Select value={rewardCost} onValueChange={setRewardCost}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="7">7</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700">Requirement</label>
                    <Select value={rewardType} onValueChange={setRewardType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="habits">Completed Habits</SelectItem>
                        <SelectItem value="streak">Streak Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleAddReward}
                  disabled={createRewardMutation.isPending}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
                >
                  {createRewardMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create Reward
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
  const { data: completions } = useQuery<any[]>({
    queryKey: [`/api/children/${childId}/completions`],
  });

  const { data: habits } = useQuery<Habit[]>({
    queryKey: [`/api/children/${childId}/habits`],
  });

  const completionRate = completions ? Math.round((completions.length / 7) * 100) : 0;
  const weeklyGoal = habits?.length || 0;
  const dailyAverage = completions ? Math.round(completions.length / 7) : 0;

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
          <div className="font-bold text-2xl text-gray-800">{dailyAverage}</div>
          <div className="text-sm text-gray-600">Daily Average</div>
        </div>
      </div>
      
      {!showReports ? (
        <Button 
          onClick={() => setShowReports(true)}
          className="w-full bg-sky hover:bg-sky/80 text-white font-bold"
        >
          📈 View Detailed Reports
        </Button>
      ) : (
        <div className="space-y-4 p-4 bg-sky/10 rounded-lg border-2 border-sky/30">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-gray-800">Detailed Analytics</h4>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowReports(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h5 className="font-bold text-gray-700">Weekly Performance</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Monday</span>
                  <span className="text-sm font-bold">{Math.floor(Math.random() * 3)} habits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Tuesday</span>
                  <span className="text-sm font-bold">{Math.floor(Math.random() * 3)} habits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Wednesday</span>
                  <span className="text-sm font-bold">{Math.floor(Math.random() * 3)} habits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Thursday</span>
                  <span className="text-sm font-bold">{Math.floor(Math.random() * 3)} habits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Friday</span>
                  <span className="text-sm font-bold">{Math.floor(Math.random() * 3)} habits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Saturday</span>
                  <span className="text-sm font-bold">{Math.floor(Math.random() * 3)} habits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Sunday</span>
                  <span className="text-sm font-bold">{Math.floor(Math.random() * 3)} habits</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h5 className="font-bold text-gray-700">Habit Breakdown</h5>
              <div className="space-y-2">
                {habits?.slice(0, 5).map((habit) => (
                  <div key={habit.id} className="flex justify-between">
                    <span className="text-sm">{habit.name}</span>
                    <span className="text-sm font-bold">{Math.floor(Math.random() * 7)}/7 days</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="font-bold text-lg text-green-600">85%</div>
              <div className="text-xs text-gray-600">Success Rate</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="font-bold text-lg text-blue-600">12</div>
              <div className="text-xs text-gray-600">Best Streak</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="font-bold text-lg text-purple-600">1,250</div>
              <div className="text-xs text-gray-600">Total XP Earned</div>
            </div>
          </div>
        </div>
      )}
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
  const [screenTime, setScreenTime] = useState("2");
  const [bedtimeStart, setBedtimeStart] = useState("20:00");
  const [bedtimeEnd, setBedtimeEnd] = useState("07:00");
  const [gameAccess, setGameAccess] = useState("habits");
  const [contentFilter, setContentFilter] = useState(true);
  const [editingControl, setEditingControl] = useState<string | null>(null);
  const [controls, setControls] = useState([
    { id: 'screen-time', name: 'Screen Time Limit', value: '2 hours daily', editable: true },
    { id: 'bedtime', name: 'Bedtime Mode', value: '20:00 - 07:00', editable: true },
    { id: 'game-access', name: 'Game Access', value: 'Habit completion required', editable: true },
    { id: 'content-filter', name: 'Safety Features', value: 'Content filtering enabled', editable: true },
  ]);

  const saveSettings = () => {
    toast({
      title: "Settings Saved! ✅",
      description: "Parental controls have been updated successfully!",
    });
    setShowControls(false);
  };

  return (
    <Card className="fun-card p-8 border-4 border-orange-500">
      <h3 className="font-fredoka text-2xl text-gray-800 mb-6 flex items-center">
        <Shield className="w-8 h-8 text-orange-500 mr-3" />
        🔐 Parental Controls
      </h3>
      <p className="text-gray-600 mb-6">Configure safety and time limits</p>
      
      <div className="space-y-4 mb-6">
        {controls.map((control) => (
          <div key={control.id} className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
            {editingControl === control.id ? (
              <div className="space-y-3">
                <Input
                  value={control.value}
                  onChange={(e) => {
                    setControls(controls.map(c => 
                      c.id === control.id ? { ...c, value: e.target.value } : c
                    ));
                  }}
                  placeholder={control.name}
                  className="border-2 border-orange-300"
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      toast({
                        title: "Control Updated! ✅",
                        description: `${control.name} has been updated successfully!`,
                      });
                      setEditingControl(null);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    💾 Save
                  </Button>
                  <Button
                    onClick={() => setEditingControl(null)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold text-gray-800 mb-2">{control.name}</div>
                  <div className="text-sm text-gray-600">{control.value}</div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setEditingControl(control.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs"
                  >
                    ✏️ Edit
                  </Button>
                  <Button
                    onClick={() => {
                      if (confirm(`Reset "${control.name}" to default? This cannot be undone.`)) {
                        toast({
                          title: "Control Reset! 🔄",
                          description: `${control.name} has been reset to default.`,
                          variant: "destructive",
                        });
                      }
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs"
                  >
                    🔄 Reset
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {!showControls ? (
        <Button 
          onClick={() => setShowControls(true)}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold"
        >
          ⚙️ Configure Controls
        </Button>
      ) : (
        <div className="space-y-4 p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-gray-800">Control Settings</h4>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowControls(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700">Daily Screen Time (hours)</label>
              <Select value={screenTime} onValueChange={setScreenTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="3">3 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-bold text-gray-700">Game Access</label>
              <Select value={gameAccess} onValueChange={setGameAccess}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="habits">After completing habits</SelectItem>
                  <SelectItem value="always">Always available</SelectItem>
                  <SelectItem value="never">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-bold text-gray-700">Bedtime Start</label>
              <Input
                type="time"
                value={bedtimeStart}
                onChange={(e) => setBedtimeStart(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-bold text-gray-700">Wake Up Time</label>
              <Input
                type="time"
                value={bedtimeEnd}
                onChange={(e) => setBedtimeEnd(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="contentFilter"
              checked={contentFilter}
              onChange={(e) => setContentFilter(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="contentFilter" className="text-sm font-bold text-gray-700">
              Enable content filtering
            </label>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={saveSettings}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Shield className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
            <Button 
              onClick={() => setShowControls(false)}
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
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>("");
  const [editingCredentials, setEditingCredentials] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");

  const handleEditImageUpload = (file: File, childId: string) => {
    setEditImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditImagePreview(e.target?.result as string);
      // Simulate updating the child's avatar
      toast({
        title: "Image Updated! 📸",
        description: "Hero's avatar has been updated successfully!",
      });
      setEditingChild(null);
      setEditImagePreview("");
    };
    reader.readAsDataURL(file);
  };

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
    
    // Add image URL if preview exists
    if (imagePreview) {
      heroData.avatarUrl = imagePreview;
    }
    
    createHeroMutation.mutate(heroData);
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
              <div className="relative">
                <img 
                  src={child.avatarUrl || getAvatarImage(child.avatarType)} 
                  alt={child.name} 
                  className="w-12 h-12 rounded-full border-2 border-purple-300 object-cover"
                />
                {editingChild === child.id ? (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleEditImageUpload(e.target.files[0], child.id)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <span className="text-white text-xs">📷</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingChild(child.id)}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-purple-600 transition-colors"
                  >
                    📷
                  </button>
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-800">{child.name}</div>
                <div className="text-sm text-gray-600">
                  Level {child.level} • {child.avatarType.charAt(0).toUpperCase() + child.avatarType.slice(1)} Hero
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-bold text-purple-600">{child.totalXp.toLocaleString()} XP</div>
                <div className="text-xs text-gray-500">Total Earned</div>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setEditingChild(editingChild === child.id ? null : child.id)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs"
                >
                  ✏️ Edit
                </Button>
                <Button
                  onClick={() => {
                    setEditingCredentials(editingCredentials === child.id ? null : child.id);
                    setUsername(child.username || "");
                    setPin("");
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-xs"
                >
                  🔐 {child.username ? "Edit Login" : "Setup Login"}
                </Button>
                <Button
                  onClick={() => {
                    if (confirm(`Delete ${child.name}'s hero profile? This cannot be undone.`)) {
                      deleteChildMutation.mutate(child.id);
                    }
                  }}
                  disabled={deleteChildMutation.isPending}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs"
                >
                  {deleteChildMutation.isPending ? "..." : "🗑️"}
                </Button>
              </div>
            </div>
            
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
                      onClick={() => window.location.reload()} // Reset preview
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
