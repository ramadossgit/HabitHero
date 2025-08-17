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
  Flame
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
      await apiRequest("POST", `/api/habits/${habitId}/complete`, {});
    },
    onSuccess: () => {
      toast({
        title: "Mission Complete! 🎉",
        description: "Great job! You earned XP and continued your streak!",
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

  const completedHabitIds = new Set(completionsArray.map((c: HabitCompletion) => c.habitId) || []);

  return (
    <section className="mb-8">
      <h2 className="font-fredoka text-3xl text-gray-800 mb-6 flex items-center">
        <Star className="text-coral mr-3" />
        Today's Hero Missions
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {habitsArray.map((habit: Habit) => {
          const isCompleted = completedHabitIds.has(habit.id);
          const IconComponent = getIconComponent(habit.icon);
          const colorClasses = getColorClasses(habit.color);
          const [iconColor, bgColor, buttonColor, hoverButtonColor] = colorClasses.split(' ');

          return (
            <Card 
              key={habit.id}
              className={`mission-card p-6 shadow-lg border-2 ${isCompleted ? 'border-mint bg-mint/5 opacity-75' : 'border-transparent hover:' + colorClasses.split('hover:')[1].split(' ')[0]} cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${bgColor} rounded-full p-3`}>
                  <IconComponent className={`${iconColor} text-2xl w-6 h-6`} />
                </div>
                <div className="text-right">
                  <div className="bg-white text-black px-3 py-1 rounded-full text-sm font-bold shadow-lg border-2 border-gray-200">
                    +{habit.xpReward} XP
                  </div>
                </div>
              </div>
              
              <h3 className="font-nunito font-extrabold text-lg mb-2 text-black">{habit.name}</h3>
              <p className="text-black/90 mb-4">{habit.description}</p>
              
              <div className="flex items-center justify-between">
                {isCompleted ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-mint" />
                      <span className="text-sm font-semibold text-black">Completed!</span>
                    </div>
                    <div className="text-mint font-bold">✓ Done</div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <span className="text-sm font-semibold text-black">Ready</span>
                    </div>
                    <Button 
                      className={`${buttonColor} text-white px-4 py-2 rounded-full font-bold ${hoverButtonColor} transition-colors shadow-lg`}
                      style={{ color: 'white' }}
                      onClick={() => completeMissionMutation.mutate(habit.id)}
                      disabled={completeMissionMutation.isPending}
                    >
                      {completeMissionMutation.isPending ? "Completing..." : "Complete!"}
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
