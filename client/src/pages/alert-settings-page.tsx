import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Save, X } from "lucide-react";
import AlertSettings from "@/components/parent/alert-settings";
import type { Habit } from "@shared/schema";

interface AlertSettingsPageProps {
  habitId?: string;
}

export default function AlertSettingsPage({ habitId }: AlertSettingsPageProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Get habit data if editing an existing habit
  const { data: habit, isLoading } = useQuery<Habit>({
    queryKey: ["/api/habits", habitId],
    enabled: !!habitId,
  });

  const [settings, setSettings] = useState({
    reminderEnabled: habit?.reminderEnabled || false,
    reminderTime: habit?.reminderTime || "",
    voiceReminderEnabled: habit?.voiceReminderEnabled || false,
    customRingtone: habit?.customRingtone || "default",
    reminderDuration: 5, // Default 5 minutes
    timeRangeStart: habit?.timeRangeStart || "07:00",
    timeRangeEnd: habit?.timeRangeEnd || "20:00",
  });

  const updateHabitMutation = useMutation({
    mutationFn: async (alertSettings: any) => {
      if (!habitId) {
        throw new Error("No habit ID provided");
      }
      await apiRequest("PATCH", `/api/habits/${habitId}`, alertSettings);
    },
    onSuccess: () => {
      toast({
        title: "Alert Settings Updated!",
        description: "Reminder and notification preferences have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/habits", habitId] });
      setLocation("/parent-dashboard");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateGlobalSettingsMutation = useMutation({
    mutationFn: async (alertSettings: any) => {
      await apiRequest("PATCH", `/api/profile`, {
        reminderSettings: {
          enabled: alertSettings.reminderEnabled,
          voiceEnabled: alertSettings.voiceReminderEnabled,
          ringtoneEnabled: true,
          defaultRingtone: alertSettings.customRingtone,
          reminderTime: alertSettings.reminderDuration
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Global Settings Updated!",
        description: "Default alert preferences have been saved for all future habits.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setLocation("/parent-dashboard");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (habitId) {
      // Update specific habit's alert settings
      updateHabitMutation.mutate(settings);
    } else {
      // Update global default settings
      updateGlobalSettingsMutation.mutate(settings);
    }
  };

  const handleCancel = () => {
    setLocation("/parent-dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-mint/20 to-sky/20 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const pageTitle = habitId 
    ? `Alert Settings - ${habit?.name || "Habit"}` 
    : "Default Alert Settings";

  const pageDescription = habitId
    ? "Configure reminders and notifications for this specific habit"
    : "Set default alert preferences for all new habits";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl h-[95vh] overflow-hidden flex flex-col">
        {/* Header with coral-to-sunshine gradient matching controls popup */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-gradient-to-r from-coral to-sunshine flex-shrink-0 min-h-[80px]">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={handleCancel} 
              className="text-gray-800 hover:bg-white/20 p-2 rounded-full bg-white/20 border border-white/30"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="font-fredoka text-lg sm:text-2xl text-gray-800 font-bold drop-shadow-lg">{pageTitle}</h2>
              <p className="text-gray-700 text-xs sm:text-sm font-medium">{pageDescription}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={handleCancel} 
            className="text-gray-800 hover:bg-white/20 p-2 rounded-full bg-white/20 border border-white/30 flex-shrink-0" 
            data-testid="button-close"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <AlertSettings
            initialSettings={settings}
            onSettingsChange={setSettings}
            onSave={handleSave}
            onCancel={handleCancel}
            isStandalone={false}
            title={habitId ? "Habit Alert Settings" : "Default Alert Settings"}
          />
        </div>

        {/* Footer with action buttons */}
        <div className="flex-shrink-0 p-6 border-t bg-gray-50">
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleCancel}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateHabitMutation.isPending || updateGlobalSettingsMutation.isPending}
              className="super-button"
              data-testid="button-save"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateHabitMutation.isPending || updateGlobalSettingsMutation.isPending 
                ? "Saving..." 
                : "Save Settings"
              }
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}