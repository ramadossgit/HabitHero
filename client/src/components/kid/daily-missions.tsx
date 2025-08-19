import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import WeekendChallengesSection from "./weekend-challenges";
import { 
  Zap, 
  Bed, 
  Heart, 
  Book, 
  Droplets,
  Star,
  CheckCircle,
  Clock,
  Flame,
  RefreshCw
} from "lucide-react";
import type { Habit, HabitCompletion } from "@shared/schema";

interface DailyMissionsProps {
  childId: string;
}

export default function DailyMissions({ childId }: DailyMissionsProps) {
  const { toast } = useToast();



  const { data: habits, isLoading: habitsLoading } = useQuery({
    queryKey: ["/api/children", childId, "habits"],
  });

  const { data: todaysCompletions } = useQuery({
    queryKey: ["/api/children", childId, "completions", "today"],
  });

  const habitsArray = Array.isArray(habits) ? habits : [];
  const completionsArray = Array.isArray(todaysCompletions) ? todaysCompletions : [];

  const completeMissionMutation = useMutation({
    mutationFn: async (habitId: string) => {
      // Get the habit to check time restrictions
      const habit = habitsArray.find(h => h.id === habitId);
      if (habit && habit.timeRangeStart && habit.timeRangeEnd) {
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        
        if (currentTime < habit.timeRangeStart || currentTime > habit.timeRangeEnd) {
          throw new Error(`This habit can only be completed between ${habit.timeRangeStart} and ${habit.timeRangeEnd}. Come back during the allowed time!`);
        }
      }
      
      await apiRequest("POST", `/api/habits/${habitId}/complete`, {});
    },
    onSuccess: () => {
      toast({
        title: "Mission Complete! 🎉",
        description: "Great job! You earned XP and reward points!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId] });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "completions"] });
    },
    onError: (error) => {
      toast({
        title: "Oops!",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reloadDailyHabitsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/children/${childId}/habits/reload`, {});
    },
    onSuccess: () => {
      // Silent reload - no popup notification to avoid annoyance
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId] });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "completions"] });
    },
    onError: (error) => {
      toast({
        title: "Reload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-reload daily habits when date changes
  useEffect(() => {
    const checkForDateChange = async () => {
      const today = new Date().toISOString().split('T')[0];
      const lastReloadDate = localStorage.getItem(`lastReloadDate-${childId}`);
      
      if (lastReloadDate !== today) {
        // New day detected, reload habits automatically
        try {
          await reloadDailyHabitsMutation.mutateAsync();
          localStorage.setItem(`lastReloadDate-${childId}`, today);
        } catch (error) {
          console.error('Auto-reload failed:', error);
        }
      }
    };

    // Check immediately when component mounts
    checkForDateChange();
    
    // Check every hour for date changes
    const interval = setInterval(checkForDateChange, 3600000); // 1 hour

    return () => clearInterval(interval);
  }, [childId, reloadDailyHabitsMutation]);

  const getIconComponent = (iconName: string) => {
    const icons = {
      tooth: Zap,
      bed: Bed,
      heart: Heart,
      book: Book,
      tint: Droplets,
    };
    return icons[iconName as keyof typeof icons] || Star;
  };

  const getColorClasses = (color: string) => {
    const colors = {
      coral: "text-coral bg-coral/20 border-coral hover:border-coral bg-coral hover:bg-coral/80",
      turquoise: "text-turquoise bg-turquoise/20 border-turquoise hover:border-turquoise bg-turquoise hover:bg-turquoise/80",
      sky: "text-sky bg-sky/20 border-sky hover:border-sky bg-sky hover:bg-sky/80",
      mint: "text-mint bg-mint/20 border-mint hover:border-mint bg-mint hover:bg-mint/80",
      sunshine: "text-orange-500 bg-sunshine/20 border-sunshine hover:border-sunshine bg-sunshine hover:bg-sunshine/80",
    };
    return colors[color as keyof typeof colors] || colors.mint;
  };

  if (habitsLoading) {
    return (
      <section className="mb-8">
        <h2 className="font-fredoka text-3xl text-gray-800 mb-6 flex items-center">
          <Star className="text-coral mr-3" />
          Today's Hero Missions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  // Group completions by status for today
  const today = new Date().toISOString().split('T')[0];
  const todayCompletions = completionsArray.filter(c => c.date === today);
  
  const getHabitStatus = (habitId: string) => {
    const habitCompletions = todayCompletions.filter(c => c.habitId === habitId);
    if (habitCompletions.length === 0) return 'available';
    
    // Check for approved first - if approved, habit is done
    const approved = habitCompletions.find(c => c.status === 'approved');
    if (approved) return 'approved';
    
    // Check for pending - if there's a pending, show pending
    const pending = habitCompletions.find(c => c.status === 'pending');
    if (pending) return 'pending';
    
    // If only rejected, allow try again
    const rejected = habitCompletions.find(c => c.status === 'rejected');
    if (rejected) return 'rejected';
    
    return 'available';
  };

  return (
    <section className="mb-8">
      <h2 className="font-fredoka text-3xl text-gray-800 mb-6 flex items-center">
        <Star className="text-coral mr-3" />
        Today's Hero Missions
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {habitsArray.map((habit: Habit) => {
          const status = getHabitStatus(habit.id);
          const IconComponent = getIconComponent(habit.icon);
          const colorClasses = getColorClasses(habit.color);
          const [iconColor, bgColor, buttonColor, hoverButtonColor] = colorClasses.split(' ');

          const completion = todayCompletions.find(c => c.habitId === habit.id);
          const parentMessage = completion?.parentMessage;

          return (
            <Card 
              key={habit.id}
              className={`mission-card p-6 fun-card border-2 transform hover:scale-105 transition-all duration-300 ${
                status === 'approved' ? 'border-mint bg-mint/10 shadow-mint/30' : 
                status === 'pending' ? 'border-yellow-400 bg-yellow-50 shadow-yellow-400/30' :
                status === 'rejected' ? 'border-coral bg-coral/10 shadow-coral/30' :
                'border-sky/30 hover:border-sky hover:shadow-sky/30'
              } cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${bgColor} rounded-full p-3`}>
                  <IconComponent className={`${iconColor} text-2xl w-6 h-6`} />
                </div>
                <div className="text-right space-y-1">
                  <div className="bg-gradient-to-r from-sky to-mint text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse">
                    ⚡ +{habit.xpReward} XP
                  </div>
                  {habit.rewardPoints && (
                    <div className="bg-gradient-to-r from-coral to-orange-400 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                      🎁 +{habit.rewardPoints}
                    </div>
                  )}
                </div>
              </div>
              
              <h3 className="font-nunito font-extrabold text-lg mb-2 text-black">{habit.name}</h3>
              <p className="text-black/90 mb-2">{habit.description}</p>
              
              {/* Time range and reminder info */}
              {(habit.timeRangeStart && habit.timeRangeEnd) && (
                <div className="mb-3 p-2 bg-sky/10 rounded-lg">
                  <p className="text-xs text-sky font-medium">
                    ⏰ Available: {habit.timeRangeStart} - {habit.timeRangeEnd}
                  </p>
                </div>
              )}
              
              {habit.reminderEnabled && habit.reminderTime && (
                <div className="mb-3 p-2 bg-mint/10 rounded-lg">
                  <p className="text-xs text-mint font-medium">
                    🔔 Daily reminder at {habit.reminderTime}
                  </p>
                </div>
              )}
              
              {/* Parent message for rejected habits */}
              {status === 'rejected' && parentMessage && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">Parent feedback:</p>
                  <p className="text-sm text-red-700">{parentMessage}</p>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                {status === 'approved' ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-mint" />
                      <span className="text-sm font-semibold text-black">Approved!</span>
                    </div>
                    <div className="text-mint font-bold">✓ Done</div>
                  </>
                ) : status === 'pending' ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-semibold text-black">Waiting for approval</span>
                    </div>
                    <div className="text-yellow-600 font-bold">⏳ Pending</div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <span className="text-sm font-semibold text-black">
                        {status === 'rejected' ? 'Try again!' : 'Ready'}
                      </span>
                    </div>
                    <Button 
                      className={`${buttonColor} text-white px-4 py-2 rounded-full font-bold ${hoverButtonColor} transition-colors shadow-lg`}
                      style={{ color: 'white' }}
                      onClick={() => completeMissionMutation.mutate(habit.id)}
                      disabled={completeMissionMutation.isPending}
                      data-testid={`complete-habit-${habit.id}`}
                    >
                      {completeMissionMutation.isPending ? "Completing..." : 
                       status === 'rejected' ? "Try Again!" : "Complete!"}
                    </Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
        
        {/* Weekend Challenges Section */}
        <WeekendChallengesSection childId={childId} />
      </div>
    </section>
  );
}
