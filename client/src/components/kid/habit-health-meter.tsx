import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Zap, Star, Trophy, Target, CheckCircle, XCircle } from "lucide-react";
import type { Habit, HabitCompletion } from "@shared/schema";

interface HabitHealthMeterProps {
  habits: Habit[];
  completions: HabitCompletion[];
  childName: string;
}

interface HealthStatus {
  level: "excellent" | "good" | "okay" | "needs-work" | "critical";
  score: number;
  message: string;
  color: string;
  icon: React.ReactNode;
  animation: string;
}

export default function HabitHealthMeter({ habits, completions, childName }: HabitHealthMeterProps) {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousScore, setPreviousScore] = useState(0);

  // Calculate today's completion rate
  const calculateHealthStatus = (): HealthStatus => {
    if (habits.length === 0) {
      return {
        level: "critical",
        score: 0,
        message: "Ready to start your hero journey!",
        color: "from-gray-400 to-gray-500",
        icon: <Target className="w-6 h-6 text-white" />,
        animation: "bounce"
      };
    }

    const today = new Date().toDateString();
    const todayCompletions = completions.filter(c => 
      c.completedAt && new Date(c.completedAt).toDateString() === today && c.status === 'approved'
    );
    
    const completionRate = (todayCompletions.length / habits.length) * 100;
    
    if (completionRate >= 90) {
      return {
        level: "excellent",
        score: completionRate,
        message: `🎉 LEGENDARY! ${childName} is a true habit hero!`,
        color: "from-green-400 via-emerald-400 to-teal-500",
        icon: <Trophy className="w-6 h-6 text-yellow-300" />,
        animation: "celebrate"
      };
    } else if (completionRate >= 75) {
      return {
        level: "good",
        score: completionRate,
        message: `🌟 Amazing work! ${childName} is building strong habits!`,
        color: "from-emerald-400 to-green-500",
        icon: <Star className="w-6 h-6 text-yellow-300" />,
        animation: "pulse"
      };
    } else if (completionRate >= 50) {
      return {
        level: "okay",
        score: completionRate,
        message: `⚡ Good progress! ${childName} is on the right track!`,
        color: "from-yellow-400 to-orange-500",
        icon: <Zap className="w-6 h-6 text-white" />,
        animation: "wiggle"
      };
    } else if (completionRate >= 25) {
      return {
        level: "needs-work",
        score: completionRate,
        message: `💪 Keep trying! ${childName} can do this!`,
        color: "from-orange-400 to-red-500",
        icon: <Heart className="w-6 h-6 text-white" />,
        animation: "shake"
      };
    } else {
      return {
        level: "critical",
        score: completionRate,
        message: `🚀 Fresh start! Every hero begins somewhere!`,
        color: "from-red-400 to-pink-500",
        icon: <Target className="w-6 h-6 text-white" />,
        animation: "bounce"
      };
    }
  };

  useEffect(() => {
    const newStatus = calculateHealthStatus();
    
    // Check for score improvement to trigger celebration
    if (previousScore > 0 && newStatus.score > previousScore && newStatus.level === "excellent") {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
    
    setPreviousScore(newStatus.score);
    setHealthStatus(newStatus);
  }, [habits, completions, childName, previousScore]);

  if (!healthStatus) return null;

  const completedToday = completions.filter(c => 
    c.completedAt && new Date(c.completedAt).toDateString() === new Date().toDateString() && c.status === 'approved'
  ).length;

  const pendingToday = completions.filter(c => 
    c.completedAt && new Date(c.completedAt).toDateString() === new Date().toDateString() && c.status === 'pending'
  ).length;

  const remainingHabits = habits.length - completedToday - pendingToday;

  return (
    <Card className="fun-card relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-r ${healthStatus.color} opacity-10`}></div>
      
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 backdrop-blur-sm">
          <div className="text-6xl animate-bounce">
            🎉
          </div>
        </div>
      )}

      <CardContent className="p-6 relative z-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-fredoka text-2xl text-gray-800">
            🏥 Habit Health Meter
          </h3>
          
          <div
            className={`w-16 h-16 rounded-full bg-gradient-to-r ${healthStatus.color} flex items-center justify-center shadow-lg ${
              healthStatus.animation === "celebrate" ? "animate-spin" :
              healthStatus.animation === "pulse" ? "animate-pulse" :
              healthStatus.animation === "bounce" ? "animate-bounce" :
              "animate-pulse"
            }`}
          >
            {healthStatus.icon}
          </div>
        </div>

        {/* Health Score Progress */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="font-nunito font-semibold text-gray-700">Health Score</span>
            <Badge 
              variant="secondary" 
              className={`bg-gradient-to-r ${healthStatus.color} text-white font-bold px-3 py-1`}
            >
              {Math.round(healthStatus.score)}%
            </Badge>
          </div>
          
          <div className="w-full">
            <Progress 
              value={healthStatus.score} 
              className="h-4 bg-gray-200"
            />
          </div>
        </div>

        {/* Status Message */}
        <div className="text-center mb-6">
          <p className="font-nunito text-lg font-semibold text-gray-800 leading-relaxed">
            {healthStatus.message}
          </p>
        </div>

        {/* Habit Progress Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-xl border-2 border-green-200">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="font-fredoka text-2xl text-green-600">{completedToday}</div>
            <div className="font-nunito text-sm text-green-700 font-semibold">Completed</div>
          </div>

          <div className="text-center p-3 bg-yellow-50 rounded-xl border-2 border-yellow-200">
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white text-sm font-bold">⏳</span>
            </div>
            <div className="font-fredoka text-2xl text-yellow-600">{pendingToday}</div>
            <div className="font-nunito text-sm text-yellow-700 font-semibold">Pending</div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-xl border-2 border-gray-200">
            <XCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <div className="font-fredoka text-2xl text-gray-600">{remainingHabits}</div>
            <div className="font-nunito text-sm text-gray-700 font-semibold">Remaining</div>
          </div>
        </div>

        {/* Motivational Tips */}
        {healthStatus.level !== "excellent" && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
            <h4 className="font-fredoka text-lg text-blue-700 mb-2">💡 Hero Tip:</h4>
            <p className="font-nunito text-sm text-blue-600">
              {healthStatus.level === "good" 
                ? "You're so close to becoming a legendary hero! Complete one more habit to reach excellence!"
                : healthStatus.level === "okay"
                ? "Every small step counts! Try completing just one more habit today to level up your health score."
                : healthStatus.level === "needs-work"
                ? "Remember, even the greatest heroes had to start somewhere. You've got this!"
                : "Today is a fresh start! Pick your easiest habit and begin your hero journey!"
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}