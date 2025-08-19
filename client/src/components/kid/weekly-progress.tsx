import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, Clock, XCircle } from "lucide-react";

interface WeeklyProgressProps {
  childId: string;
}

interface DailyBreakdown {
  date: string;
  completed: number;
  total: number;
}

interface WeeklyProgressData {
  totalHabits: number;
  completedHabits: number;
  pendingHabits: number;
  weekStart: string;
  weekEnd: string;
  status: 'red' | 'yellow' | 'green';
  dailyBreakdown: DailyBreakdown[];
}

export default function WeeklyProgress({ childId }: WeeklyProgressProps) {
  const { data: weeklyProgress, isLoading } = useQuery<WeeklyProgressData>({
    queryKey: ["/api/children", childId, "progress", "weekly"],
  });

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-48"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="grid grid-cols-7 gap-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weeklyProgress) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No weekly progress data available</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'yellow':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'red':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'green':
        return <CheckCircle className="w-5 h-5" />;
      case 'yellow':
        return <Clock className="w-5 h-5" />;
      case 'red':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const getStatusMessage = (status: string, completed: number, total: number) => {
    switch (status) {
      case 'green':
        return `Amazing! All ${total} habits completed this week!`;
      case 'yellow':
        return `Good progress! ${completed} out of ${total} habits completed`;
      case 'red':
        return `Let's work harder! Only ${completed} out of ${total} habits completed`;
      default:
        return `${completed} out of ${total} habits completed`;
    }
  };

  const getDayColor = (day: DailyBreakdown) => {
    const percentage = day.total > 0 ? (day.completed / day.total) * 100 : 0;
    if (percentage === 100) return 'bg-green-500 text-white';
    if (percentage >= 50) return 'bg-yellow-500 text-white';
    if (day.total > 0 && percentage < 50) return 'bg-red-500 text-white';
    return 'bg-gray-200 text-gray-600';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const completionPercentage = weeklyProgress.totalHabits > 0 
    ? Math.round((weeklyProgress.completedHabits / weeklyProgress.totalHabits) * 100) 
    : 0;

  return (
    <Card className="w-full fun-card">
      <CardHeader>
        <CardTitle className="font-fredoka text-xl flex items-center">
          <Calendar className="w-6 h-6 mr-2 text-sky" />
          📅 This Week's Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Status */}
        <div className={`p-4 rounded-lg border-2 ${getStatusColor(weeklyProgress.status)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(weeklyProgress.status)}
              <div>
                <h3 className="font-bold text-lg">{completionPercentage}% Complete</h3>
                <p className="text-sm">
                  {getStatusMessage(weeklyProgress.status, weeklyProgress.completedHabits, weeklyProgress.totalHabits)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-mint/20 rounded-lg border border-mint">
            <div className="text-2xl font-bold text-mint">{weeklyProgress.completedHabits}</div>
            <div className="text-sm text-mint font-bold">Completed</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">{weeklyProgress.pendingHabits}</div>
            <div className="text-sm text-yellow-700">Pending</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{weeklyProgress.totalHabits}</div>
            <div className="text-sm text-blue-700">Total</div>
          </div>
        </div>

        {/* Daily Breakdown */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-3">Daily Breakdown</h4>
          <div className="grid grid-cols-7 gap-2">
            {weeklyProgress.dailyBreakdown.map((day, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg text-center text-xs font-medium ${getDayColor(day)}`}
                data-testid={`day-progress-${index}`}
              >
                <div className="font-bold">{formatDate(day.date).split(' ')[0]}</div>
                <div className="mt-1">{day.completed}/{day.total}</div>
                <div className="text-xs mt-1">
                  {day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Color Legend */}
        <div className="flex justify-center space-x-6 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>100% Complete</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>50%+ Complete</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Some Complete</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <span>None Complete</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}