import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Star, Trophy, Medal, Gem, Flame, Hourglass } from "lucide-react";
import type { HabitCompletion } from "@shared/schema";

interface WeeklyProgressProps {
  childId: string;
}

export default function WeeklyProgress({ childId }: WeeklyProgressProps) {
  const { data: completions } = useQuery({
    queryKey: ["/api/children", childId, "completions"],
  });

  // Calculate weekly progress
  const getWeeklyData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

    return days.map((day, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      
      const dayCompletions = Array.isArray(completions) ? completions.filter((completion: HabitCompletion) => {
        const completionDate = new Date(completion.date);
        return completionDate.toDateString() === date.toDateString();
      }) : [];

      const completionCount = dayCompletions.length;
      const maxHabits = 5; // Assuming 5 habits per day
      
      let icon = Hourglass;
      let bgColor = "bg-gray-100 border-dashed border-gray-300";
      
      if (completionCount >= maxHabits) {
        icon = Star;
        bgColor = "bg-mint";
      } else if (completionCount >= 4) {
        icon = Trophy;
        bgColor = "bg-turquoise";
      } else if (completionCount >= 3) {
        icon = Medal;
        bgColor = "bg-sky";
      } else if (completionCount >= 2) {
        icon = Gem;
        bgColor = "bg-sunshine";
      } else if (completionCount >= 1) {
        icon = Flame;
        bgColor = "bg-coral";
      }

      const isToday = date.toDateString() === today.toDateString();
      const isFuture = date > today;

      return {
        day,
        date,
        completionCount,
        maxHabits,
        icon,
        bgColor: isFuture ? "bg-gray-100 border-dashed border-gray-300" : bgColor,
        isToday,
        isFuture,
      };
    });
  };

  const weeklyData = getWeeklyData();
  const totalCompleted = weeklyData.reduce((sum, day) => sum + (day.isFuture ? 0 : day.completionCount), 0);
  const totalPossible = weeklyData.reduce((sum, day) => sum + (day.isFuture ? 0 : day.maxHabits), 0);

  return (
    <Card className="p-6 shadow-lg">
      <h3 className="font-fredoka text-2xl text-gray-800 mb-6 flex items-center">
        <TrendingUp className="text-sky mr-3" />
        This Week's Hero Journey
      </h3>
      
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weeklyData.map((dayData) => {
          const IconComponent = dayData.icon;
          
          return (
            <div key={dayData.day} className="text-center">
              <div className={`text-xs font-bold mb-2 ${dayData.isFuture ? 'text-gray-400' : 'text-gray-600'}`}>
                {dayData.day.toUpperCase()}
              </div>
              <div className={`h-20 rounded-lg flex items-center justify-center ${
                dayData.isToday && !dayData.isFuture 
                  ? `${dayData.bgColor} animate-pulse-slow` 
                  : dayData.bgColor
              } ${dayData.isFuture ? 'border-2' : ''}`}>
                <IconComponent className={`text-xl w-6 h-6 ${
                  dayData.isFuture 
                    ? 'text-gray-400' 
                    : dayData.bgColor.includes('bg-gray') 
                      ? 'text-gray-400' 
                      : 'text-white'
                }`} />
              </div>
              <div className={`text-xs mt-1 font-semibold ${
                dayData.isFuture ? 'text-gray-400' : ''
              }`}>
                {dayData.isFuture ? '0/5' : `${dayData.completionCount}/${dayData.maxHabits}`}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <div className="font-nunito font-extrabold text-lg mb-2">
          This Week: {totalCompleted}/{totalPossible} Habits Complete
        </div>
        <div className="text-gray-600">
          {totalCompleted >= totalPossible * 0.8 
            ? "You're doing amazing! Keep it up, Hero!" 
            : totalCompleted >= totalPossible * 0.6
              ? "Great progress! You're on the right track!"
              : "Every hero starts somewhere! Keep going!"
          }
        </div>
      </div>
    </Card>
  );
}
