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
import { Gift, Plus, Edit, Trash2, Clock, Cookie, Car, Star } from "lucide-react";
import type { Reward } from "@shared/schema";

interface RewardSettingsProps {
  childId: string;
}

export default function RewardSettings({ childId }: RewardSettingsProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [rewardForm, setRewardForm] = useState({
    name: "",
    description: "",
    type: "screen_time",
    value: "",
    cost: 3,
    costType: "habits",
  });

  const { data: rewards, isLoading } = useQuery({
    queryKey: ["/api/children", childId, "rewards"],
  });

  const createRewardMutation = useMutation({
    mutationFn: async (rewardData: any) => {
      await apiRequest("POST", `/api/children/${childId}/rewards`, rewardData);
    },
    onSuccess: () => {
      toast({
        title: "Reward Created!",
        description: "New reward added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "rewards"] });
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

  const updateRewardMutation = useMutation({
    mutationFn: async ({ rewardId, updates }: { rewardId: string; updates: any }) => {
      await apiRequest("PATCH", `/api/rewards/${rewardId}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Reward Updated!",
        description: "Reward updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "rewards"] });
      setIsDialogOpen(false);
      setEditingReward(null);
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

  const deleteRewardMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      await apiRequest("DELETE", `/api/rewards/${rewardId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Reward Deleted",
        description: "Reward removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "rewards"] });
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
    setRewardForm({
      name: "",
      description: "",
      type: "screen_time",
      value: "",
      cost: 3,
      costType: "habits",
    });
  };

  const handleEditReward = (reward: Reward) => {
    setEditingReward(reward);
    setRewardForm({
      name: reward.name,
      description: reward.description || "",
      type: reward.type,
      value: reward.value || "",
      cost: reward.cost,
      costType: reward.costType,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReward) {
      updateRewardMutation.mutate({
        rewardId: editingReward.id,
        updates: rewardForm,
      });
    } else {
      createRewardMutation.mutate(rewardForm);
    }
  };

  const getRewardIcon = (type: string) => {
    const icons = {
      screen_time: Clock,
      treat: Cookie,
      outing: Car,
      privilege: Star,
      gear: Gift,
    };
    return icons[type as keyof typeof icons] || Gift;
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
          <Gift className="text-turquoise mr-3" />
          Reward Settings
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-turquoise text-white hover:bg-turquoise/80"
              onClick={() => {
                setEditingReward(null);
                resetForm();
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Reward
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingReward ? "Edit Reward" : "Create New Reward"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Reward Name</Label>
                <Input
                  id="name"
                  value={rewardForm.name}
                  onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                  placeholder="e.g., Extra Screen Time"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={rewardForm.description}
                  onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                  placeholder="e.g., 30 extra minutes of screen time"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={rewardForm.type} onValueChange={(value) => setRewardForm({ ...rewardForm, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="screen_time">Screen Time</SelectItem>
                      <SelectItem value="treat">Special Treat</SelectItem>
                      <SelectItem value="outing">Outing</SelectItem>
                      <SelectItem value="privilege">Special Privilege</SelectItem>
                      <SelectItem value="gear">Hero Gear</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="value">Value</Label>
                  <Input
                    id="value"
                    value={rewardForm.value}
                    onChange={(e) => setRewardForm({ ...rewardForm, value: e.target.value })}
                    placeholder="e.g., 30_minutes"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost">Cost</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={rewardForm.cost}
                    onChange={(e) => setRewardForm({ ...rewardForm, cost: parseInt(e.target.value) })}
                    min="1"
                    max="20"
                  />
                </div>
                <div>
                  <Label htmlFor="costType">Cost Type</Label>
                  <Select value={rewardForm.costType} onValueChange={(value) => setRewardForm({ ...rewardForm, costType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="habits">Habits Complete</SelectItem>
                      <SelectItem value="xp">XP Points</SelectItem>
                      <SelectItem value="streak">Day Streak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-turquoise text-white hover:bg-turquoise/80"
                disabled={createRewardMutation.isPending || updateRewardMutation.isPending}
              >
                {editingReward ? "Update Reward" : "Create Reward"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="font-nunito font-bold mb-3">Screen Time Rewards</h4>
          <div className="space-y-3">
            {rewards?.filter((reward: Reward) => reward.type === "screen_time").map((reward: Reward) => {
              const IconComponent = getRewardIcon(reward.type);
              
              return (
                <div key={reward.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <IconComponent className="w-5 h-5 text-sky mr-3" />
                    <span>{reward.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {reward.cost} {reward.costType === "habits" ? "habits" : reward.costType}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditReward(reward)}
                    >
                      <Edit className="w-4 h-4 text-sky" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRewardMutation.mutate(reward.id)}
                      disabled={deleteRewardMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="font-nunito font-bold mb-3">Special Treats</h4>
          <div className="space-y-3">
            {rewards?.filter((reward: Reward) => reward.type === "treat").map((reward: Reward) => {
              const IconComponent = getRewardIcon(reward.type);
              
              return (
                <div key={reward.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <IconComponent className="w-5 h-5 text-coral mr-3" />
                    <span>{reward.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {reward.cost} {reward.costType === "habits" ? "habits" : reward.costType}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditReward(reward)}
                    >
                      <Edit className="w-4 h-4 text-sky" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRewardMutation.mutate(reward.id)}
                      disabled={deleteRewardMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="font-nunito font-bold mb-3">Other Rewards</h4>
          <div className="space-y-3">
            {rewards?.filter((reward: Reward) => !["screen_time", "treat"].includes(reward.type)).map((reward: Reward) => {
              const IconComponent = getRewardIcon(reward.type);
              
              return (
                <div key={reward.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <IconComponent className="w-5 h-5 text-turquoise mr-3" />
                    <span>{reward.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {reward.cost} {reward.costType === "habits" ? "habits" : reward.costType}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditReward(reward)}
                    >
                      <Edit className="w-4 h-4 text-sky" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRewardMutation.mutate(reward.id)}
                      disabled={deleteRewardMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full p-3 border-2 border-dashed border-gray-300 text-gray-500 hover:border-turquoise hover:text-turquoise"
          onClick={() => {
            setEditingReward(null);
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Reward
        </Button>
      </div>
    </Card>
  );
}
