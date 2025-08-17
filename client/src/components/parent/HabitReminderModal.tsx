import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  X, 
  Clock, 
  Bell, 
  Volume2, 
  Mic, 
  Calendar,
  Save
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Habit } from "@shared/schema";

interface HabitReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit;
}

export default function HabitReminderModal({ isOpen, onClose, habit }: HabitReminderModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [reminderTime, setReminderTime] = useState(habit?.reminderTime || "");
  const [reminderEnabled, setReminderEnabled] = useState(habit?.reminderEnabled || false);
  const [voiceReminderEnabled, setVoiceReminderEnabled] = useState(habit?.voiceReminderEnabled || false);
  const [customRingtone, setCustomRingtone] = useState(habit?.customRingtone || "default");

  const updateHabitMutation = useMutation({
    mutationFn: async (updates: Partial<Habit>) => {
      return await apiRequest("PATCH", `/api/habits/${habit.id}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Reminder Updated! 🔔",
        description: "Habit reminder settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children", habit.childId, "habits"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateHabitMutation.mutate({
      reminderTime,
      reminderEnabled,
      voiceReminderEnabled,
      customRingtone,
    });
  };

  const testReminder = () => {
    if (voiceReminderEnabled && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(`Time to complete your ${habit.name} habit!`);
      utterance.voice = speechSynthesis.getVoices().find(voice => voice.lang === 'en-US') || null;
      speechSynthesis.speak(utterance);
    }

    if (reminderEnabled) {
      // Play ringtone sound
      const audio = new Audio(`/sounds/ringtones/${customRingtone}.mp3`);
      audio.play().catch(() => {
        // Fallback to system notification
        if (Notification.permission === 'granted') {
          new Notification(`Habit Reminder`, {
            body: `Time to complete: ${habit.name}`,
            icon: '/icons/habit-reminder.png'
          });
        }
      });
    }

    toast({
      title: "Test Reminder Played",
      description: "This is how the reminder will sound at the scheduled time.",
    });
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Notifications Not Supported",
        description: "Your browser doesn't support notifications.",
        variant: "destructive",
      });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast({
        title: "Notifications Enabled",
        description: "You'll now receive habit reminders as notifications.",
      });
    } else {
      toast({
        title: "Notifications Denied",
        description: "Please enable notifications in your browser settings.",
        variant: "destructive",
      });
    }
  };

  const timeSlots = [
    "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
    "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-mint to-sky text-white">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6" />
            <div>
              <h2 className="font-fredoka text-xl hero-title">Habit Reminders</h2>
              <p className="text-white/90 text-sm">Set up reminders for {habit.name}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-white hover:bg-white/20 p-2">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Enable Reminders */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Enable Reminders</div>
              <div className="text-sm text-gray-600">Get notified when it's time for this habit</div>
            </div>
            <Switch
              checked={reminderEnabled}
              onCheckedChange={setReminderEnabled}
            />
          </div>

          {reminderEnabled && (
            <div className="space-y-4 bg-mint/10 rounded-lg p-4">
              {/* Time Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Reminder Time
                </Label>
                <Select value={reminderTime} onValueChange={setReminderTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reminder time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Voice Reminders */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Voice Reminders</div>
                  <div className="text-sm text-gray-600">Spoken reminder messages</div>
                </div>
                <Switch
                  checked={voiceReminderEnabled}
                  onCheckedChange={setVoiceReminderEnabled}
                />
              </div>

              {/* Ringtone Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Reminder Sound
                </Label>
                <Select value={customRingtone} onValueChange={setCustomRingtone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Alert</SelectItem>
                    <SelectItem value="gentle">Gentle Chime</SelectItem>
                    <SelectItem value="upbeat">Upbeat Melody</SelectItem>
                    <SelectItem value="nature">Nature Sounds</SelectItem>
                    <SelectItem value="hero">Hero Theme</SelectItem>
                    <SelectItem value="mission">Mission Alert</SelectItem>
                    <SelectItem value="achievement">Achievement Sound</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Test Reminder */}
              <Button
                onClick={testReminder}
                className="w-full bg-sky hover:bg-sky/80"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Test Reminder
              </Button>

              {/* Notification Permission */}
              {Notification.permission !== 'granted' && (
                <Button
                  onClick={requestNotificationPermission}
                  variant="outline"
                  className="w-full"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Enable Browser Notifications
                </Button>
              )}

              {/* Reminder Schedule Info */}
              <div className="bg-white rounded p-3">
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Reminder Schedule
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>• Daily at {reminderTime || "selected time"}</div>
                  <div>• {voiceReminderEnabled ? "With voice message" : "Sound only"}</div>
                  <div>• Ringtone: {customRingtone}</div>
                  <div>• Works even when app is closed</div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={updateHabitMutation.isPending}
              className="bg-mint hover:bg-mint/80"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateHabitMutation.isPending ? "Saving..." : "Save Reminder"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}