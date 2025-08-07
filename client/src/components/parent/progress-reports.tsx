import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, ThumbsUp, Lightbulb, Trophy, TrendingUp } from "lucide-react";
import type { Habit, HabitCompletion } from "@shared/schema";

interface ProgressReportsProps {
  childId: string;
}

export default function ProgressReports({ childId }: ProgressReportsProps) {
  const { data: habits } = useQuery({
    queryKey: ["/api/children", childId, "habits"],
  });

  const { data: completions } = useQuery({
    queryKey: ["/api/children", childId, "completions"],
  });

  // Calculate weekly performance for each habit
  const getWeeklyPerformance = () => {
    if (!habits || !completions) return [];

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return habits.map((habit: Habit) => {
      const habitCompletions = completions.filter((completion: HabitCompletion) => 
        completion.habitId === habit.id && 
        new Date(completion.date) >= oneWeekAgo
      );

      const completionRate = (habitCompletions.length / 7) * 100;
      
      return {
        habit,
        completions: habitCompletions.length,
        total: 7,
        percentage: completionRate,
      };
    });
  };

  const getInsights = () => {
    const performance = getWeeklyPerformance();
    const insights = [];

    // Find best performing habit
    const bestHabit = performance.reduce((best, current) => 
      current.percentage > best.percentage ? current : best, 
      performance[0] || { percentage: 0, habit: { name: "" } }
    );

    if (bestHabit.percentage >= 85) {
      insights.push({
        type: "success",
        icon: ThumbsUp,
        title: "Great job!",
        message: `Excellent consistency with ${bestHabit.habit.name}. This shows strong commitment!`,
        color: "mint"
      });
    }

    // Find habit that needs improvement
    const needsImprovement = performance.find(p => p.percentage < 60);
    if (needsImprovement) {
      insights.push({
        type: "suggestion",
        icon: Lightbulb,
        title: "Suggestion",
        message: `Consider adding reminders or breaking down ${needsImprovement.habit.name} into smaller steps to improve consistency.`,
        color: "sunshine"
      });
    }

    // Check for streaks
    const highPerformers = performance.filter(p => p.percentage >= 70);
    if (highPerformers.length >= 3) {
      insights.push({
        type: "achievement",
        icon: Trophy,
        title: "Achievement",
        message: "Amazing! Multiple habits are being completed consistently. Keep up the fantastic work!",
        color: "sky"
      });
    }

    return insights;
  };

  const weeklyPerformance = getWeeklyPerformance();
  const insights = getInsights();
  const overallCompletion = weeklyPerformance.length > 0 
    ? weeklyPerformance.reduce((sum, habit) => sum + habit.percentage, 0) / weeklyPerformance.length 
    : 0;

  return (
    <Card className="p-6 shadow-lg mb-8">
      <h3 className="font-fredoka text-2xl text-gray-800 mb-6 flex items-center">
        <BarChart3 className="text-coral mr-3" />
        Progress Reports
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Weekly Overview */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-nunito font-bold">This Week's Performance</h4>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-bold text-green-500">
                {overallCompletion.toFixed(0)}% Overall
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            {weeklyPerformance.map((item) => {
              const getColorByPercentage = (percentage: number) => {
                if (percentage >= 85) return "bg-mint";
                if (percentage >= 70) return "bg-sky";
                if (percentage >= 50) return "bg-turquoise";
                if (percentage >= 30) return "bg-sunshine";
                return "bg-coral";
              };

              return (
                <div key={item.habit.id} className="flex items-center justify-between">
                  <span className="text-gray-600 min-w-0 flex-1 mr-4 truncate">
                    {item.habit.name}
                  </span>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <div className="w-20 bg-gray-200 rounded-full h-2 relative">
                      <div 
                        className={`h-2 rounded-full ${getColorByPercentage(item.percentage)}`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold min-w-[3rem] text-right">
                      {item.completions}/{item.total}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {weeklyPerformance.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No habit data available yet.</p>
              <p className="text-sm">Data will appear as habits are completed.</p>
            </div>
          )}
        </div>

        {/* Insights & Recommendations */}
        <div>
          <h4 className="font-nunito font-bold mb-4">Insights & Recommendations</h4>
          <div className="space-y-3">
            {insights.map((insight, index) => {
              const IconComponent = insight.icon;
              const colorClasses = {
                mint: "bg-mint/10 border-mint text-mint",
                sunshine: "bg-sunshine/10 border-sunshine text-orange-500",
                sky: "bg-sky/10 border-sky text-sky",
                coral: "bg-coral/10 border-coral text-coral",
              };
              const colorClass = colorClasses[insight.color as keyof typeof colorClasses];

              return (
                <div key={index} className={`p-3 border-l-4 rounded-r-lg ${colorClass.replace('text-', 'border-').split(' ')[1]} ${colorClass.split(' ')[0]}`}>
                  <div className="flex items-center mb-1">
                    <IconComponent className={`w-5 h-5 mr-2 ${colorClass.split(' ')[2]}`} />
                    <span className={`font-bold ${colorClass.split(' ')[2]}`}>
                      {insight.title}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{insight.message}</p>
                </div>
              );
            })}

            {insights.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Insights will appear as more habit data is collected.</p>
                <p className="text-sm">Keep tracking habits to see personalized recommendations!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Summary */}
      {weeklyPerformance.length > 0 && (
        <div className="mt-8 p-4 bg-gradient-to-r from-sky/10 to-mint/10 rounded-lg border border-sky/20">
          <h4 className="font-nunito font-bold mb-2 text-gray-800">Weekly Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-xl text-sky">
                {weeklyPerformance.reduce((sum, item) => sum + item.completions, 0)}
              </div>
              <div className="text-gray-600">Total Completions</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-xl text-mint">
                {weeklyPerformance.filter(item => item.percentage >= 70).length}
              </div>
              <div className="text-gray-600">Habits on Track</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-xl text-coral">
                {overallCompletion.toFixed(0)}%
              </div>
              <div className="text-gray-600">Overall Success Rate</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
