import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, Plus, Edit, Trash2, Zap, Bed, Heart, Book, Droplets, Clock, Volume2, Gift, Apple, Dumbbell, Utensils, CircleDot, Music, Palette, PenTool, Sparkles, Settings } from "lucide-react";
import { useLocation } from "wouter";
import AlertSettings from "./alert-settings";
import type { Habit } from "@shared/schema";

interface HabitManagementProps {
  childId: string;
}

export default function HabitManagement({ childId }: HabitManagementProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitForm, setHabitForm] = useState({
    name: "",
    description: "",
    icon: "star",
    xpReward: 50,
    color: "mint",
    reminderEnabled: false,
    reminderTime: "",
    voiceReminderEnabled: false,
    customRingtone: "default",
    reminderDuration: 5,
    voiceRecording: undefined as string | undefined,
    voiceRecordingName: undefined as string | undefined,
    timeRangeStart: "07:00",
    timeRangeEnd: "20:00",
  });

  const { data: habits, isLoading } = useQuery<Habit[]>({
    queryKey: ["/api/children", childId, "habits"],
  });

  const createHabitMutation = useMutation({
    mutationFn: async (habitData: any) => {
      await apiRequest("POST", `/api/children/${childId}/habits`, habitData);
    },
    onSuccess: () => {
      toast({
        title: "Habit Created!",
        description: "New habit added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "habits"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateHabitMutation = useMutation({
    mutationFn: async ({ habitId, updates }: { habitId: string; updates: any }) => {
      await apiRequest("PATCH", `/api/habits/${habitId}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Habit Updated!",
        description: "Habit updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "habits"] });
      setIsDialogOpen(false);
      setEditingHabit(null);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteHabitMutation = useMutation({
    mutationFn: async (habitId: string) => {
      await apiRequest("DELETE", `/api/habits/${habitId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Habit Deleted",
        description: "Habit removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "habits"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setHabitForm({
      name: "",
      description: "",
      icon: "star",
      xpReward: 50,
      color: "mint",
      reminderEnabled: false,
      reminderTime: "",
      voiceReminderEnabled: false,
      customRingtone: "default",
      reminderDuration: 5,
      voiceRecording: undefined,
      voiceRecordingName: undefined,
      timeRangeStart: "07:00",
      timeRangeEnd: "20:00",
    });
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitForm({
      name: habit.name,
      description: habit.description || "",
      icon: habit.icon,
      xpReward: habit.xpReward,
      color: habit.color,
      reminderEnabled: habit.reminderEnabled || false,
      reminderTime: habit.reminderTime || "",
      voiceReminderEnabled: habit.voiceReminderEnabled || false,
      customRingtone: habit.customRingtone || "default",
      reminderDuration: habit.reminderDuration || 5,
      voiceRecording: habit.voiceRecording || undefined,
      voiceRecordingName: habit.voiceRecordingName || undefined,
      timeRangeStart: habit.timeRangeStart || "07:00",
      timeRangeEnd: habit.timeRangeEnd || "20:00",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingHabit) {
      updateHabitMutation.mutate({
        habitId: editingHabit.id,
        updates: habitForm,
      });
    } else {
      createHabitMutation.mutate(habitForm);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons = {
      tooth: Zap,
      bed: Bed,
      heart: Heart,
      book: Book,
      tint: Droplets,
      apple: Apple,
      dumbbell: Dumbbell,
      utensils: Utensils,
      shower: Droplets,
      soccer: CircleDot,
      music: Music,
      art: Palette,
      homework: PenTool,
      cleaning: Sparkles,
    };
    return icons[iconName as keyof typeof icons] || CheckSquare;
  };

  const getHabitEmoji = (iconName: string) => {
    const emojis = {
      tooth: "🦷",
      bed: "🛏️", 
      heart: "❤️",
      book: "📚",
      tint: "💧",
      apple: "🍎",
      dumbbell: "🏋️",
      utensils: "🍽️",
      shower: "🚿",
      soccer: "⚽",
      music: "🎵",
      art: "🎨",
      homework: "📝",
      cleaning: "✨",
    };
    return emojis[iconName as keyof typeof emojis] || "⭐";
  };

  const getColorClasses = (color: string) => {
    const colors = {
      coral: "text-coral",
      turquoise: "text-turquoise",
      sky: "text-sky",
      mint: "text-mint",
      sunshine: "text-orange-500",
    };
    return colors[color as keyof typeof colors] || "text-mint";
  };

  if (isLoading) {
    return (
      <Card className="p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 fun-card bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-fredoka text-2xl text-gray-800 dark:text-gray-100 flex items-center">
          <CheckSquare className="text-sky mr-3" />
          <span className="emoji mr-2">🎯</span> Manage Habits
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-sky text-white hover:bg-sky/80"
              onClick={() => {
                setEditingHabit(null);
                resetForm();
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Habit
            </Button>
          </DialogTrigger>
          <DialogContent className="fun-card max-w-4xl max-h-[90vh] w-[90vw] overflow-y-auto bg-white dark:bg-gray-800 p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-fredoka text-gray-800 dark:text-gray-100">
                {editingHabit ? "Edit Habit" : "Create New Habit"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pb-8">
              

              
              <div>
                <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Habit Name</Label>
                <Input
                  id="name"
                  value={habitForm.name}
                  onChange={(e) => setHabitForm({ ...habitForm, name: e.target.value })}
                  placeholder="e.g., Brush Teeth"
                  required
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">Description</Label>
                <Input
                  id="description"
                  value={habitForm.description}
                  onChange={(e) => setHabitForm({ ...habitForm, description: e.target.value })}
                  placeholder="e.g., Keep your smile sparkling bright!"
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              {/* Alert Settings */}
              <div className="p-6 bg-gradient-to-r from-mint/10 to-sky/10 dark:from-mint/20 dark:to-sky/20 rounded-lg border-2 border-sky/30 dark:border-sky/40">
                <div className="mb-4">
                  <h3 className="font-fredoka text-xl text-gray-800 dark:text-gray-100 flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-sky" />
                    Reminder & Voice Settings
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure alerts, voice recordings, and reminder preferences</p>
                </div>
                
                <AlertSettings
                  initialSettings={{
                    reminderEnabled: habitForm.reminderEnabled,
                    reminderTime: habitForm.reminderTime,
                    voiceReminderEnabled: habitForm.voiceReminderEnabled,
                    customRingtone: habitForm.customRingtone,
                    reminderDuration: habitForm.reminderDuration,
                    voiceRecording: habitForm.voiceRecording,
                    voiceRecordingName: habitForm.voiceRecordingName,
                    timeRangeStart: habitForm.timeRangeStart,
                    timeRangeEnd: habitForm.timeRangeEnd,
                  }}
                  onSettingsChange={(newSettings) => {
                    setHabitForm({ 
                      ...habitForm, 
                      ...newSettings,
                      voiceRecording: newSettings.voiceRecording || habitForm.voiceRecording,
                      voiceRecordingName: newSettings.voiceRecordingName || habitForm.voiceRecordingName
                    });
                  }}
                  isStandalone={false}
                  title="Reminder & Voice Settings"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon" className="text-gray-700 dark:text-gray-300">Icon</Label>
                  <Select value={habitForm.icon} onValueChange={(value) => setHabitForm({ ...habitForm, icon: value })}>
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tooth"><span className="emoji">🦷</span> Tooth</SelectItem>
                      <SelectItem value="bed"><span className="emoji">🛏️</span> Bed</SelectItem>
                      <SelectItem value="heart"><span className="emoji">❤️</span> Heart</SelectItem>
                      <SelectItem value="book"><span className="emoji">📚</span> Book</SelectItem>
                      <SelectItem value="tint"><span className="emoji">💧</span> Water Drop</SelectItem>
                      <SelectItem value="apple"><span className="emoji">🍎</span> Healthy Food</SelectItem>
                      <SelectItem value="dumbbell"><span className="emoji">🏋️</span> Exercise</SelectItem>
                      <SelectItem value="utensils"><span className="emoji">🍽️</span> Eating</SelectItem>
                      <SelectItem value="shower"><span className="emoji">🚿</span> Shower</SelectItem>
                      <SelectItem value="soccer"><span className="emoji">⚽</span> Sports</SelectItem>
                      <SelectItem value="music"><span className="emoji">🎵</span> Music Practice</SelectItem>
                      <SelectItem value="art"><span className="emoji">🎨</span> Art/Drawing</SelectItem>
                      <SelectItem value="homework"><span className="emoji">📝</span> Homework</SelectItem>
                      <SelectItem value="cleaning"><span className="emoji">✨</span> Cleaning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="color" className="text-gray-700 dark:text-gray-300">Color</Label>
                  <Select value={habitForm.color} onValueChange={(value) => setHabitForm({ ...habitForm, color: value })}>
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coral"><span className="emoji">🪸</span> Coral</SelectItem>
                      <SelectItem value="turquoise"><span className="emoji">🌊</span> Turquoise</SelectItem>
                      <SelectItem value="sky"><span className="emoji">☁️</span> Sky</SelectItem>
                      <SelectItem value="mint"><span className="emoji">🌿</span> Mint</SelectItem>
                      <SelectItem value="sunshine"><span className="emoji">☀️</span> Sunshine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="xpReward" className="flex items-center text-gray-700 dark:text-gray-300">
                    <span className="emoji mr-1">⚡</span> XP Reward
                  </Label>
                  <Input
                    id="xpReward"
                    type="number"
                    value={habitForm.xpReward}
                    onChange={(e) => setHabitForm({ ...habitForm, xpReward: parseInt(e.target.value) || 0 })}
                    min="10"
                    max="200"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Original Alert Settings section has been moved above */}
              <Button 
                type="submit" 
                className="w-full bg-sky text-white hover:bg-sky/80"
                disabled={createHabitMutation.isPending || updateHabitMutation.isPending}
              >
                {editingHabit ? "Update Habit" : "Create Habit"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {(habits || []).map((habit: Habit) => {
          const IconComponent = getIconComponent(habit.icon);
          const colorClass = getColorClasses(habit.color);
          
          return (
            <div key={habit.id} className="p-4 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg hover:border-mint dark:hover:border-mint transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex items-center mr-3">
                    <span className="emoji text-3xl mr-2">{getHabitEmoji(habit.icon)}</span>
                    <IconComponent className={`${colorClass} w-5 h-5`} />
                  </div>
                  <div>
                    <h4 className="font-bold flex items-center text-gray-800 dark:text-gray-100">
                      {habit.name}
                      {habit.isActive && <span className="emoji ml-2 text-green-500">✅</span>}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                      <span className="emoji mr-1">📅</span> Daily • <span className="emoji mr-1">⚡</span> {habit.xpReward} XP • {habit.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-bold ${colorClass} flex items-center`}>
                    <span className="emoji mr-1">{habit.isActive ? "🟢" : "🔴"}</span> {habit.isActive ? "Active" : "Inactive"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocation(`/alert-settings/${habit.id}`)}
                    title="Configure Alert Settings"
                    data-testid={`button-alert-settings-${habit.id}`}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditHabit(habit)}
                    data-testid={`button-edit-${habit.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteHabitMutation.mutate(habit.id)}
                    disabled={deleteHabitMutation.isPending}
                    data-testid={`button-delete-${habit.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        <Button
          variant="outline"
          className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-sky hover:text-sky dark:hover:border-sky dark:hover:text-sky bg-white dark:bg-gray-800"
          onClick={() => {
            setEditingHabit(null);
            resetForm();
            setIsDialogOpen(true);
          }}
          data-testid="button-add-new-habit"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Habit
        </Button>
      </div>
    </Card>
  );
}
