import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  MessageSquare,
  Settings,
  Crown,
  Timer,
  Zap,
  Bell,
  Lock,
  Info,
} from "lucide-react";

interface Child {
  id: string;
  name: string;
  pendingCount?: number;
}

interface HabitApprovalProps {
  children: Child[];
}

interface AutoApprovalSettings {
  enabled: boolean;
  timeValue: number;
  timeUnit: "hours" | "days" | "weeks";
  applyToAllChildren: boolean;
  childSpecificSettings: Record<
    string,
    {
      enabled: boolean;
      timeValue: number;
      timeUnit: "hours" | "days" | "weeks";
    }
  >;
}

export default function HabitApproval({ children }: HabitApprovalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectMessage, setRejectMessage] = useState("");
  const [showAutoApprovalSettings, setShowAutoApprovalSettings] =
    useState(false);

  // Auto-approval settings state
  const [autoApprovalSettings, setAutoApprovalSettings] =
    useState<AutoApprovalSettings>({
      enabled: false,
      timeValue: 24,
      timeUnit: "hours",
      applyToAllChildren: true,
      childSpecificSettings: {},
    });

  const isPremium = (user as any)?.subscriptionStatus === "active";
  const isTrial = (user as any)?.subscriptionStatus === "trial";
  const hasAutoApprovalFeature = isPremium || isTrial;

  // Get pending habits count for each child
  const { data: pendingCounts } = useQuery({
    queryKey: ["/api/pending-habits/all"],
    select: (data: any[]) => {
      const counts: Record<string, number> = {};
      data.forEach((item) => {
        const childId = item.child.id;
        counts[childId] = (counts[childId] || 0) + 1;
      });
      return counts;
    },
  });

  // Get detailed pending habits for selected child
  const { data: pendingHabits = [] } = useQuery<any[]>({
    queryKey: ["/api/children", selectedChild, "pending-habits"],
    enabled: !!selectedChild,
  });

  // Get current auto-approval settings
  const { data: currentSettings } = useQuery<AutoApprovalSettings>({
    queryKey: ["/api/auto-approval-settings"],
    enabled: hasAutoApprovalFeature,
  });

  // Update local state when settings are fetched
  useEffect(() => {
    if (currentSettings) {
      setAutoApprovalSettings(currentSettings);
    }
  }, [currentSettings]);

  // Get auto-approval statistics
  const { data: autoApprovalStats } = useQuery({
    queryKey: ["/api/auto-approval-stats"],
    enabled: hasAutoApprovalFeature && autoApprovalSettings.enabled,
  });

  const approveHabitMutation = useMutation({
    mutationFn: async ({
      completionId,
      message,
      isAutoApproval = false,
    }: {
      completionId: string;
      message?: string;
      isAutoApproval?: boolean;
    }) => {
      return apiRequest(
        "POST",
        `/api/habit-completions/${completionId}/approve`,
        {
          approvedBy: (user as any)?.id || "parent",
          message,
          isAutoApproval,
        },
      );
    },
    onSuccess: (_, { isAutoApproval }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pending-habits/all"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/children", selectedChild, "pending-habits"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] }); // Sync with kids view

      if (!isAutoApproval) {
        toast({
          title: "Habit Approved!",
          description: "Great job! Reward points have been awarded.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve habit",
        variant: "destructive",
      });
    },
  });

  const rejectHabitMutation = useMutation({
    mutationFn: async ({
      completionId,
      message,
    }: {
      completionId: string;
      message: string;
    }) => {
      return apiRequest(
        "POST",
        `/api/habit-completions/${completionId}/reject`,
        {
          rejectedBy: (user as any)?.id || "parent",
          message,
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pending-habits/all"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/children", selectedChild, "pending-habits"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] }); // Sync with kids view
      setRejectingId(null);
      setRejectMessage("");
      toast({
        title: "Feedback Sent",
        description: "Your child can try completing this habit again.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject habit",
        variant: "destructive",
      });
    },
  });

  const updateAutoApprovalMutation = useMutation({
    mutationFn: async (settings: AutoApprovalSettings) => {
      return apiRequest("PUT", "/api/auto-approval-settings", settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/auto-approval-settings"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auto-approval-stats"] });
      setShowAutoApprovalSettings(false); // Close the settings panel
      toast({
        title: "Auto-Approval Settings Updated",
        description: "Your preferences have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (completionId: string, message?: string) => {
    approveHabitMutation.mutate({ completionId, message });
  };

  const handleReject = (completionId: string) => {
    if (!rejectMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please provide feedback to help your child improve.",
        variant: "destructive",
      });
      return;
    }
    rejectHabitMutation.mutate({ completionId, message: rejectMessage });
  };

  const handleAutoApprovalSettingsChange = (
    newSettings: Partial<AutoApprovalSettings>,
  ) => {
    const updatedSettings = { ...autoApprovalSettings, ...newSettings };
    setAutoApprovalSettings(updatedSettings);
  };

  const saveAutoApprovalSettings = () => {
    updateAutoApprovalMutation.mutate(autoApprovalSettings);
  };

  const formatTimeDisplay = (value: number, unit: string) => {
    if (value === 1) {
      return `1 ${unit.slice(0, -1)}`;
    }
    return `${value} ${unit}`;
  };

  const getTimeInHours = (value: number, unit: "hours" | "days" | "weeks") => {
    switch (unit) {
      case "hours":
        return value;
      case "days":
        return value * 24;
      case "weeks":
        return value * 24 * 7;
      default:
        return value;
    }
  };

  const childrenWithCounts = children.map((child) => ({
    ...child,
    pendingCount: pendingCounts?.[child.id] || 0,
  }));

  // Calculate time until auto-approval for pending habits
  const getPendingHabitsWithTimeLeft = () => {
    if (!autoApprovalSettings.enabled || !hasAutoApprovalFeature)
      return pendingHabits;

    return pendingHabits.map((item) => {
      const completedAt = new Date(item.completion.completedAt);
      const autoApprovalTime =
        getTimeInHours(
          autoApprovalSettings.timeValue,
          autoApprovalSettings.timeUnit,
        ) *
        60 *
        60 *
        1000; // Convert to milliseconds

      const autoApprovalDate = new Date(
        completedAt.getTime() + autoApprovalTime,
      );
      const now = new Date();
      const timeLeft = autoApprovalDate.getTime() - now.getTime();

      return {
        ...item,
        autoApprovalDate,
        timeUntilAutoApproval: timeLeft > 0 ? timeLeft : 0,
        willAutoApprove: timeLeft > 0,
      };
    });
  };

  const formatTimeLeft = (milliseconds: number) => {
    if (milliseconds <= 0) return "Ready for auto-approval";

    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const pendingHabitsWithTimeLeft = getPendingHabitsWithTimeLeft();

  return (
    <Card className="fun-card p-6 border-4 border-mint">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-mint" />
          <div>
            <h3 className="font-fredoka text-xl sm:text-2xl text-gray-800 hero-title">
              Habit Approvals
            </h3>
            <p className="text-gray-600 text-sm sm:text-base">
              Review and approve completed habits
            </p>
          </div>
        </div>

        {hasAutoApprovalFeature && (
          <div className="flex items-center space-x-3">
            {autoApprovalSettings.enabled && (
              <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                <Timer className="w-3 h-3" />
                Auto-approval:{" "}
                {formatTimeDisplay(
                  autoApprovalSettings.timeValue,
                  autoApprovalSettings.timeUnit,
                )}
              </Badge>
            )}
            <Button
              onClick={() =>
                setShowAutoApprovalSettings(!showAutoApprovalSettings)
              }
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>
        )}
      </div>

      {/* Premium Auto-Approval Settings */}
      {hasAutoApprovalFeature && showAutoApprovalSettings && (
        <Card className="mb-6 border-2 border-gold/30 bg-gradient-to-r from-gold/10 to-yellow-50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-gold" />
              <CardTitle className="text-gold">
                Premium Auto-Approval Settings
              </CardTitle>
              {isTrial && (
                <Badge variant="secondary" className="text-xs">
                  Trial Access
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Global Auto-Approval Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
              <div className="space-y-1">
                <div className="font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-gold" />
                  Enable Auto-Approval
                </div>
                <div className="text-sm text-gray-600">
                  Automatically approve habits after the specified time period
                </div>
              </div>
              <Switch
                checked={autoApprovalSettings.enabled}
                onCheckedChange={(enabled) =>
                  handleAutoApprovalSettingsChange({ enabled })
                }
              />
            </div>

            {autoApprovalSettings.enabled && (
              <>
                {/* Time Configuration */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Auto-approve after
                    </label>
                    <Select
                      value={autoApprovalSettings.timeValue.toString()}
                      onValueChange={(value) =>
                        handleAutoApprovalSettingsChange({
                          timeValue: parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                        <SelectItem value="8">8</SelectItem>
                        <SelectItem value="12">12</SelectItem>
                        <SelectItem value="24">24</SelectItem>
                        <SelectItem value="48">48</SelectItem>
                        <SelectItem value="72">72</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Time unit
                    </label>
                    <Select
                      value={autoApprovalSettings.timeUnit}
                      onValueChange={(value: "hours" | "days" | "weeks") =>
                        handleAutoApprovalSettingsChange({ timeUnit: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Preview */}
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Preview:</strong> Habits will be automatically
                    approved after{" "}
                    <strong>
                      {formatTimeDisplay(
                        autoApprovalSettings.timeValue,
                        autoApprovalSettings.timeUnit,
                      )}
                    </strong>{" "}
                    from completion time.
                  </AlertDescription>
                </Alert>

                {/* Statistics */}
                {autoApprovalStats && (
                  <div className="grid grid-cols-3 gap-4 p-4 bg-white/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {(autoApprovalStats as any)?.thisWeek || 0}
                      </div>
                      <div className="text-sm text-gray-600">
                        Auto-approved this week
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {(autoApprovalStats as any)?.totalSaved || 0}
                      </div>
                      <div className="text-sm text-gray-600">
                        Total time saved (hours)
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {(autoApprovalStats as any)?.pending || 0}
                      </div>
                      <div className="text-sm text-gray-600">
                        Pending auto-approval
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={saveAutoApprovalSettings}
                    disabled={updateAutoApprovalMutation.isPending}
                    className="bg-gold hover:bg-gold/80 text-white"
                  >
                    {updateAutoApprovalMutation.isPending
                      ? "Saving..."
                      : "Save Settings"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Non-Premium Notice */}
      {!hasAutoApprovalFeature && (
        <Alert className="mb-6 bg-gradient-to-r from-gold/10 to-yellow-50 border-gold/30">
          <Crown className="h-4 w-4 text-gold" />
          <AlertDescription className="text-gray-700">
            <strong>Premium Feature:</strong> Auto-approval saves time by
            automatically approving habits after your set time period.
            <Button
              variant="link"
              className="p-0 h-auto text-gold font-semibold ml-1"
            >
              Upgrade to Premium
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div>
        {/* Child Selection */}
        <div className="space-y-4">
          <h4 className="font-fredoka text-lg font-bold text-gray-700">
            Select a child to review their habits:
          </h4>
          <div className="grid gap-3">
            {childrenWithCounts.map((child) => (
              <div
                key={child.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedChild === child.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedChild(child.id)}
                data-testid={`select-child-${child.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{child.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {child.pendingCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-orange-100 text-orange-800"
                      >
                        {child.pendingCount} pending
                      </Badge>
                    )}
                    {hasAutoApprovalFeature &&
                      autoApprovalSettings.enabled &&
                      child.pendingCount > 0 && (
                        <Badge
                          variant="outline"
                          className="text-xs flex items-center gap-1"
                        >
                          <Timer className="w-3 h-3" />
                          Auto-approval enabled
                        </Badge>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pending Habits for Selected Child */}
          {selectedChild && pendingHabitsWithTimeLeft && (
            <div className="mt-6 space-y-4">
              <h4 className="font-fredoka text-lg font-bold text-gray-700 hero-title">
                Pending Habits:
              </h4>
              {pendingHabitsWithTimeLeft.length === 0 ? (
                <div className="text-center py-8 bg-green-50 rounded-lg border-2 border-green-200">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-green-700 font-medium">
                    No pending habits for this child.
                  </p>
                  <p className="text-green-600 text-sm">All caught up!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingHabitsWithTimeLeft.map((item: any) => (
                    <Card
                      key={item.completion.id}
                      className="border-orange-200 relative overflow-hidden"
                    >
                      {/* Auto-approval timer indicator */}
                      {hasAutoApprovalFeature &&
                        autoApprovalSettings.enabled &&
                        item.willAutoApprove && (
                          <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-500 to-blue-400 text-white px-3 py-1 text-xs font-medium flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            Auto-approve in{" "}
                            {formatTimeLeft(item.timeUntilAutoApproval)}
                          </div>
                        )}

                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">
                                {item.habit.name}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                +{item.completion.xpEarned} XP
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {item.habit.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(
                                  item.completion.completedAt,
                                ).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(
                                  item.completion.completedAt,
                                ).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Rejection form */}
                        {rejectingId === item.completion.id ? (
                          <div className="mt-4 space-y-3 border-t pt-3">
                            <div>
                              <label className="text-sm font-medium flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Feedback for your child:
                              </label>
                              <Textarea
                                value={rejectMessage}
                                onChange={(e) =>
                                  setRejectMessage(e.target.value)
                                }
                                placeholder="Explain what needs to be improved..."
                                className="mt-1"
                                data-testid={`reject-message-${item.completion.id}`}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleReject(item.completion.id)}
                                disabled={rejectHabitMutation.isPending}
                                className="super-button"
                                data-testid={`confirm-reject-${item.completion.id}`}
                              >
                                {rejectHabitMutation.isPending
                                  ? "Sending..."
                                  : "Send Feedback"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRejectingId(null);
                                  setRejectMessage("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() =>
                                handleApprove(item.completion.id, "Great job!")
                              }
                              disabled={approveHabitMutation.isPending}
                              className="super-button bg-green-600 hover:bg-green-700"
                              data-testid={`approve-habit-${item.completion.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {approveHabitMutation.isPending
                                ? "Approving..."
                                : "Approve"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRejectingId(item.completion.id)}
                              className="border-red-200 text-red-700 hover:bg-red-50"
                              data-testid={`reject-habit-${item.completion.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Needs Work
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
