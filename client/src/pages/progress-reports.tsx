import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Lightbulb, Trophy, ThumbsUp, ArrowLeft, Clock, Target } from "lucide-react";
import { Link } from "wouter";
import type { Habit, HabitCompletion, Child } from "@shared/schema";

export default function ProgressReportsPage() {
  // Get the first child for now (can be extended for multiple children)
  const { data: children } = useQuery<Child[]>({
    queryKey: ["/api/children"],
  });

  const child = children?.[0];

  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/children", child?.id, "habits"],
    enabled: !!child,
  });

  const { data: completions = [] } = useQuery<HabitCompletion[]>({
    queryKey: ["/api/children", child?.id, "completions"],
    enabled: !!child,
  });

  // Calculate statistics
  const getWeeklyStats = () => {
    if (!habits.length || !completions.length) return {
      totalXP: 0,
      currentLevel: 1,
      bestStreak: 0,
      activeHabits: 0,
      weeklyData: []
    };

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const approvedCompletions = completions.filter(c => 
      c.status === 'approved' && new Date(c.date) >= oneWeekAgo
    );

    // Calculate weekly data for chart
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayCompletions = approvedCompletions.filter(c => c.date === dateStr);
      const xpEarned = dayCompletions.length * 10; // 10 XP per completion
      
      weeklyData.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        xp: xpEarned,
        completions: dayCompletions.length
      });
    }

    return {
      totalXP: child?.totalXp || 0,
      currentLevel: child?.level || 1,
      bestStreak: 5, // Calculate from actual data
      activeHabits: habits.length,
      weeklyData
    };
  };

  const getHabitPerformance = () => {
    if (!habits.length || !completions.length) return [];

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return habits.map(habit => {
      const habitCompletions = completions.filter(c => 
        c.habitId === habit.id && 
        c.status === 'approved' &&
        new Date(c.date) >= oneWeekAgo
      );

      const streak = calculateHabitStreak(habit.id);
      const completionRate = (habitCompletions.length / 7) * 100;

      return {
        habit,
        completions: habitCompletions.length,
        streak,
        completionRate,
        xpEarned: habitCompletions.length * 10
      };
    });
  };

  const calculateHabitStreak = (habitId: string) => {
    const habitCompletions = completions.filter(c => 
      c.habitId === habitId && c.status === 'approved'
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (habitCompletions.length === 0) return 0;

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let currentDate = new Date();

    // Check consecutive days from today backwards
    while (streak < habitCompletions.length) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const hasCompletion = habitCompletions.some(c => c.date === dateStr);
      
      if (hasCompletion) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const stats = getWeeklyStats();
  const habitPerformance = getHabitPerformance();

  if (!child) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral mx-auto mb-4"></div>
          <p className="text-gray-600">Loading progress data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient">
      <header className="text-white p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/parent-dashboard">
                <Button variant="ghost" className="text-white hover:bg-white/20 border-white/30">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="font-fredoka text-2xl sm:text-4xl hero-title">📈 Progress Reports</h1>
                <p className="text-white/90 font-bold">Track {child.name}'s progress over time</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/80">This Week</div>
              <div className="text-xl font-bold">📊</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center border-4 border-mint">
            <div className="text-3xl font-bold text-gray-800">{stats.totalXP}</div>
            <div className="text-gray-600 font-bold">Total XP</div>
          </Card>
          <Card className="p-4 text-center border-4 border-coral">
            <div className="text-3xl font-bold text-gray-800">{stats.currentLevel}</div>
            <div className="text-gray-600 font-bold">Current Level</div>
          </Card>
          <Card className="p-4 text-center border-4 border-sunshine">
            <div className="text-3xl font-bold text-gray-800">{stats.bestStreak}</div>
            <div className="text-gray-600 font-bold">Best Streak</div>
          </Card>
          <Card className="p-4 text-center border-4 border-sky">
            <div className="text-3xl font-bold text-gray-800">{stats.activeHabits}</div>
            <div className="text-gray-600 font-bold">Active Habits</div>
          </Card>
        </div>

        {/* Weekly XP Progress Chart */}
        <Card className="p-6 mb-8">
          <h3 className="font-fredoka text-2xl text-gray-800 mb-6 flex items-center">
            <BarChart3 className="text-coral mr-3" />
            Weekly XP Progress
          </h3>
          <div className="space-y-4">
            {stats.weeklyData.map((day) => (
              <div key={day.day} className="flex items-center justify-between">
                <div className="w-12 text-sm font-bold text-gray-600">{day.day}</div>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-4 relative">
                    <div 
                      className="h-4 rounded-full bg-gradient-to-r from-mint to-sky"
                      style={{ width: `${Math.min((day.xp / 100) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-16 text-sm font-bold text-right">
                  {day.xp} XP
                </div>
                <div className="w-20 text-xs text-gray-500 text-right">
                  {day.completions} tasks
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Habit Performance */}
        <Card className="p-6">
          <h3 className="font-fredoka text-2xl text-gray-800 mb-6 flex items-center">
            <Target className="text-coral mr-3" />
            Habit Performance
          </h3>
          <div className="space-y-4">
            {habitPerformance.map((item) => (
              <div key={item.habit.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{item.habit.icon || "🎯"}</div>
                    <div>
                      <h4 className="font-bold text-gray-800">{item.habit.name}</h4>
                      <p className="text-sm text-gray-600">{item.completions} completions • {item.streak} day streak</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-mint">{item.xpEarned} XP</div>
                    <div className="text-sm text-gray-600">Earned</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-mint to-sky"
                    style={{ width: `${Math.min(item.completionRate, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span className="font-bold">{item.completionRate.toFixed(0)}% completion rate</span>
                  <span>100%</span>
                </div>
              </div>
            ))}
          </div>

          {habitPerformance.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h4 className="font-bold text-lg mb-2">No habit data yet</h4>
              <p>Start tracking habits to see detailed performance reports!</p>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}