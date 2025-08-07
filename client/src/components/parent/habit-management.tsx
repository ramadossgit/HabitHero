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
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, Plus, Edit, Trash2, Zap, Bed, Heart, Book, Droplets } from "lucide-react";
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
    };
    return icons[iconName as keyof typeof icons] || CheckSquare;
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
          Manage Habits
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingHabit ? "Edit Habit" : "Create New Habit"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                      <SelectItem value="tooth">Tooth</SelectItem>
                      <SelectItem value="bed">Bed</SelectItem>
                      <SelectItem value="heart">Heart</SelectItem>
                      <SelectItem value="book">Book</SelectItem>
                      <SelectItem value="tint">Water Drop</SelectItem>
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
                      <SelectItem value="coral">Coral</SelectItem>
                      <SelectItem value="turquoise">Turquoise</SelectItem>
                      <SelectItem value="sky">Sky</SelectItem>
                      <SelectItem value="mint">Mint</SelectItem>
                      <SelectItem value="sunshine">Sunshine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="xpReward">XP Reward</Label>
                <Input
                  id="xpReward"
                  type="number"
                  value={habitForm.xpReward}
                  onChange={(e) => setHabitForm({ ...habitForm, xpReward: parseInt(e.target.value) })}
                  min="10"
                  max="200"
                />
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
        {habits?.map((habit: Habit) => {
          const IconComponent = getIconComponent(habit.icon);
          const colorClass = getColorClasses(habit.color);
          
          return (
            <div key={habit.id} className="p-4 border border-gray-200 rounded-lg hover:border-mint transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <IconComponent className={`${colorClass} text-xl mr-3 w-6 h-6`} />
                  <div>
                    <h4 className="font-bold">{habit.name}</h4>
                    <p className="text-sm text-gray-600">
                      Daily • {habit.xpReward} XP • {habit.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-bold ${colorClass}`}>
                    {habit.isActive ? "Active" : "Inactive"}
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
