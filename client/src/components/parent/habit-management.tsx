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
import { CheckSquare, Plus, Edit, Trash2, Zap, Bed, Heart, Book, Droplets, Clock, Volume2, Gift, Apple, Dumbbell, Utensils, CircleDot, Music, Palette, PenTool, Sparkles } from "lucide-react";
import type { Habit } from "@shared/schema";

interface HabitManagementProps {
  childId: string;
}

export default function HabitManagement({ childId }: HabitManagementProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitForm, setHabitForm] = useState({
    name: "",
    description: "",
    icon: "star",
    xpReward: 50,
    color: "mint",
    rewardPoints: 5,
    reminderEnabled: false,
    reminderTime: "",
    voiceReminderEnabled: false,
    customRingtone: "default",
    timeRangeStart: "07:00",
    timeRangeEnd: "20:00",
  });

  const { data: habits, isLoading } = useQuery({
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
      rewardPoints: 5,
      reminderEnabled: false,
      reminderTime: "",
      voiceReminderEnabled: false,
      customRingtone: "default",
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
      rewardPoints: habit.rewardPoints || 5,
      reminderEnabled: habit.reminderEnabled || false,
      reminderTime: habit.reminderTime || "",
      voiceReminderEnabled: habit.voiceReminderEnabled || false,
      customRingtone: habit.customRingtone || "default",
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
    <Card className="p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-fredoka text-2xl text-gray-800 flex items-center">
          <CheckSquare className="text-sky mr-3" />
          🎯 Manage Habits
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
          <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-fredoka text-gray-800">
                {editingHabit ? "Edit Habit" : "Create New Habit"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pb-6">
              <div>
                <Label htmlFor="name">Habit Name</Label>
                <Input
                  id="name"
                  value={habitForm.name}
                  onChange={(e) => setHabitForm({ ...habitForm, name: e.target.value })}
                  placeholder="e.g., Brush Teeth"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={habitForm.description}
                  onChange={(e) => setHabitForm({ ...habitForm, description: e.target.value })}
                  placeholder="e.g., Keep your smile sparkling bright!"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon">Icon</Label>
                  <Select value={habitForm.icon} onValueChange={(value) => setHabitForm({ ...habitForm, icon: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tooth">🦷 Tooth</SelectItem>
                      <SelectItem value="bed">🛏️ Bed</SelectItem>
                      <SelectItem value="heart">❤️ Heart</SelectItem>
                      <SelectItem value="book">📚 Book</SelectItem>
                      <SelectItem value="tint">💧 Water Drop</SelectItem>
                      <SelectItem value="apple">🍎 Healthy Food</SelectItem>
                      <SelectItem value="dumbbell">🏋️ Exercise</SelectItem>
                      <SelectItem value="utensils">🍽️ Eating</SelectItem>
                      <SelectItem value="shower">🚿 Shower</SelectItem>
                      <SelectItem value="soccer">⚽ Sports</SelectItem>
                      <SelectItem value="music">🎵 Music Practice</SelectItem>
                      <SelectItem value="art">🎨 Art/Drawing</SelectItem>
                      <SelectItem value="homework">📝 Homework</SelectItem>
                      <SelectItem value="cleaning">✨ Cleaning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Select value={habitForm.color} onValueChange={(value) => setHabitForm({ ...habitForm, color: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coral">🪸 Coral</SelectItem>
                      <SelectItem value="turquoise">🌊 Turquoise</SelectItem>
                      <SelectItem value="sky">☁️ Sky</SelectItem>
                      <SelectItem value="mint">🌿 Mint</SelectItem>
                      <SelectItem value="sunshine">☀️ Sunshine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="xpReward" className="flex items-center">
                    ⚡ XP Reward
                  </Label>
                  <Input
                    id="xpReward"
                    type="number"
                    value={habitForm.xpReward}
                    onChange={(e) => setHabitForm({ ...habitForm, xpReward: parseInt(e.target.value) || 0 })}
                    min="10"
                    max="200"
                  />
                </div>
                <div>
                  <Label htmlFor="rewardPoints" className="flex items-center">
                    <Gift className="w-4 h-4 mr-2 text-coral" />
                    🎁 Reward Points
                  </Label>
                  <Input
                    id="rewardPoints"
                    type="number"
                    value={habitForm.rewardPoints}
                    onChange={(e) => setHabitForm({ ...habitForm, rewardPoints: parseInt(e.target.value) || 0 })}
                    min="1"
                    max="50"
                  />
                </div>
              </div>

              {/* Time Range Settings */}
              <div className="p-4 bg-gray-50 rounded-lg border-2 border-sky/30">
                <h4 className="font-fredoka text-lg text-gray-800 mb-3 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-sky" />
                  🕐 Time Range Settings
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timeRangeStart">Start Time</Label>
                    <Input
                      id="timeRangeStart"
                      type="time"
                      value={habitForm.timeRangeStart}
                      onChange={(e) => setHabitForm({ ...habitForm, timeRangeStart: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeRangeEnd">End Time</Label>
                    <Input
                      id="timeRangeEnd"
                      type="time"
                      value={habitForm.timeRangeEnd}
                      onChange={(e) => setHabitForm({ ...habitForm, timeRangeEnd: e.target.value })}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Child can complete this habit between {habitForm.timeRangeStart} and {habitForm.timeRangeEnd}
                </p>
              </div>

              {/* Reminder Settings */}
              <div className="p-4 bg-gradient-to-r from-mint/10 to-sky/10 rounded-lg border-2 border-coral/30">
                <h4 className="font-fredoka text-lg text-gray-800 mb-3 flex items-center">
                  <Volume2 className="w-5 h-5 mr-2 text-coral" />
                  🔔 Reminder Settings
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reminderEnabled" className="flex-1">
                      Enable Daily Reminders
                    </Label>
                    <Switch
                      id="reminderEnabled"
                      checked={habitForm.reminderEnabled}
                      onCheckedChange={(checked) => setHabitForm({ ...habitForm, reminderEnabled: checked })}
                    />
                  </div>

                  {habitForm.reminderEnabled && (
                    <>
                      <div>
                        <Label htmlFor="reminderTime">Reminder Time</Label>
                        <Input
                          id="reminderTime"
                          type="time"
                          value={habitForm.reminderTime}
                          onChange={(e) => setHabitForm({ ...habitForm, reminderTime: e.target.value })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="voiceReminderEnabled" className="flex-1">
                          Voice Reminders
                        </Label>
                        <Switch
                          id="voiceReminderEnabled"
                          checked={habitForm.voiceReminderEnabled}
                          onCheckedChange={(checked) => setHabitForm({ ...habitForm, voiceReminderEnabled: checked })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="customRingtone">Ringtone</Label>
                        <Select value={habitForm.customRingtone} onValueChange={(value) => setHabitForm({ ...habitForm, customRingtone: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">🔔 Default Chime</SelectItem>
                            <SelectItem value="cheerful">😊 Cheerful Bell</SelectItem>
                            <SelectItem value="gentle">🌸 Gentle Notification</SelectItem>
                            <SelectItem value="playful">🎵 Playful Tune</SelectItem>
                            <SelectItem value="hero">🦸 Hero Theme</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              </div>
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
            <div key={habit.id} className="p-4 border border-gray-200 rounded-lg hover:border-mint transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex items-center mr-3">
                    <span className="text-2xl mr-2">{getHabitEmoji(habit.icon)}</span>
                    <IconComponent className={`${colorClass} w-5 h-5`} />
                  </div>
                  <div>
                    <h4 className="font-bold flex items-center">
                      {habit.name}
                      {habit.isActive && <span className="ml-2 text-green-500">✅</span>}
                    </h4>
                    <p className="text-sm text-gray-600 flex items-center">
                      📅 Daily • ⚡ {habit.xpReward} XP • 🎁 {habit.rewardPoints} pts • {habit.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-bold ${colorClass} flex items-center`}>
                    {habit.isActive ? "🟢 Active" : "🔴 Inactive"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditHabit(habit)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteHabitMutation.mutate(habit.id)}
                    disabled={deleteHabitMutation.isPending}
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
          className="w-full p-4 border-2 border-dashed border-gray-300 text-gray-500 hover:border-sky hover:text-sky"
          onClick={() => {
            setEditingHabit(null);
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Habit
        </Button>
      </div>
    </Card>
  );
}
