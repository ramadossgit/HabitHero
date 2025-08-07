import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Shield, Clock, Gamepad2, Moon, Edit, Save } from "lucide-react";
import type { ParentalControls } from "@shared/schema";

interface ParentalControlsProps {
  childId: string;
}

export default function ParentalControls({ childId }: ParentalControlsProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    dailyScreenTime: 60,
    bonusTimePerHabit: 10,
    weekendBonus: 30,
    gameUnlockRequirement: 2,
    maxGameTimePerDay: 20,
    bedtimeMode: true,
    bedtimeStart: "20:00",
    bedtimeEnd: "07:00",
  });

  const { data: parentalControls, isLoading } = useQuery({
    queryKey: ["/api/children", childId, "parental-controls"],
    onSuccess: (data: ParentalControls) => {
      if (data) {
        setFormData({
          dailyScreenTime: data.dailyScreenTime,
          bonusTimePerHabit: data.bonusTimePerHabit,
          weekendBonus: data.weekendBonus,
          gameUnlockRequirement: data.gameUnlockRequirement,
          maxGameTimePerDay: data.maxGameTimePerDay,
          bedtimeMode: data.bedtimeMode,
          bedtimeStart: data.bedtimeStart,
          bedtimeEnd: data.bedtimeEnd,
        });
      }
    },
  });

  const updateControlsMutation = useMutation({
    mutationFn: async (controls: any) => {
      await apiRequest("PUT", `/api/children/${childId}/parental-controls`, controls);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated!",
        description: "Parental controls have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "parental-controls"] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateControlsMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (parentalControls) {
      setFormData({
        dailyScreenTime: parentalControls.dailyScreenTime,
        bonusTimePerHabit: parentalControls.bonusTimePerHabit,
        weekendBonus: parentalControls.weekendBonus,
        gameUnlockRequirement: parentalControls.gameUnlockRequirement,
        maxGameTimePerDay: parentalControls.maxGameTimePerDay,
        bedtimeMode: parentalControls.bedtimeMode,
        bedtimeStart: parentalControls.bedtimeStart,
        bedtimeEnd: parentalControls.bedtimeEnd,
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card className="p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-fredoka text-2xl text-gray-800 flex items-center">
          <Shield className="text-purple-600 mr-3" />
          Parental Controls
        </h3>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={updateControlsMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateControlsMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateControlsMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="text-purple-600 border-purple-600 hover:bg-purple-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Settings
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Screen Time Management */}
        <div>
          <h4 className="font-nunito font-bold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-sky" />
            Screen Time Management
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <Label htmlFor="dailyScreenTime" className="flex-1">
                Daily base screen time
              </Label>
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      id="dailyScreenTime"
                      type="number"
                      value={formData.dailyScreenTime}
                      onChange={(e) => setFormData({ ...formData, dailyScreenTime: parseInt(e.target.value) })}
                      min="30"
                      max="300"
                      className="w-20"
                    />
                    <span className="text-sm text-gray-600">min</span>
                  </div>
                ) : (
                  <span className="font-bold">{formData.dailyScreenTime} minutes</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <Label htmlFor="bonusTimePerHabit" className="flex-1">
                Bonus time per habit
              </Label>
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      id="bonusTimePerHabit"
                      type="number"
                      value={formData.bonusTimePerHabit}
                      onChange={(e) => setFormData({ ...formData, bonusTimePerHabit: parseInt(e.target.value) })}
                      min="5"
                      max="60"
                      className="w-20"
                    />
                    <span className="text-sm text-gray-600">min</span>
                  </div>
                ) : (
                  <span className="font-bold">{formData.bonusTimePerHabit} minutes</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <Label htmlFor="weekendBonus" className="flex-1">
                Weekend bonus
              </Label>
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      id="weekendBonus"
                      type="number"
                      value={formData.weekendBonus}
                      onChange={(e) => setFormData({ ...formData, weekendBonus: parseInt(e.target.value) })}
                      min="0"
                      max="120"
                      className="w-20"
                    />
                    <span className="text-sm text-gray-600">min</span>
                  </div>
                ) : (
                  <span className="font-bold">{formData.weekendBonus} minutes</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Game Access Rules */}
        <div>
          <h4 className="font-nunito font-bold mb-4 flex items-center">
            <Gamepad2 className="w-5 h-5 mr-2 text-turquoise" />
            Game Access Rules
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <Label htmlFor="gameUnlockRequirement" className="flex-1">
                Mini-games unlock after
              </Label>
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      id="gameUnlockRequirement"
                      type="number"
                      value={formData.gameUnlockRequirement}
                      onChange={(e) => setFormData({ ...formData, gameUnlockRequirement: parseInt(e.target.value) })}
                      min="1"
                      max="10"
                      className="w-20"
                    />
                    <span className="text-sm text-gray-600">habits</span>
                  </div>
                ) : (
                  <span className="font-bold">{formData.gameUnlockRequirement} habits complete</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <Label htmlFor="maxGameTimePerDay" className="flex-1">
                Max game time per day
              </Label>
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      id="maxGameTimePerDay"
                      type="number"
                      value={formData.maxGameTimePerDay}
                      onChange={(e) => setFormData({ ...formData, maxGameTimePerDay: parseInt(e.target.value) })}
                      min="10"
                      max="120"
                      className="w-20"
                    />
                    <span className="text-sm text-gray-600">min</span>
                  </div>
                ) : (
                  <span className="font-bold">{formData.maxGameTimePerDay} minutes</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <Label htmlFor="bedtimeMode" className="flex items-center flex-1">
                <Moon className="w-4 h-4 mr-2 text-purple-600" />
                Bedtime mode
              </Label>
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Input
                        type="time"
                        value={formData.bedtimeStart}
                        onChange={(e) => setFormData({ ...formData, bedtimeStart: e.target.value })}
                        className="w-24"
                      />
                      <span className="text-sm text-gray-600">to</span>
                      <Input
                        type="time"
                        value={formData.bedtimeEnd}
                        onChange={(e) => setFormData({ ...formData, bedtimeEnd: e.target.value })}
                        className="w-24"
                      />
                    </div>
                    <Switch
                      id="bedtimeMode"
                      checked={formData.bedtimeMode}
                      onCheckedChange={(checked) => setFormData({ ...formData, bedtimeMode: checked })}
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm">
                      {formData.bedtimeMode ? `${formData.bedtimeStart} - ${formData.bedtimeEnd}` : "Disabled"}
                    </span>
                    <div className={`w-8 h-4 rounded-full ${formData.bedtimeMode ? 'bg-green-500' : 'bg-gray-300'} relative`}>
                      <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${formData.bedtimeMode ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Info */}
      <div className="mt-8 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h4 className="font-nunito font-bold mb-2 text-purple-800 flex items-center">
          <Shield className="w-4 h-4 mr-2" />
          Safety Guidelines
        </h4>
        <ul className="text-sm text-purple-700 space-y-1">
          <li>• Bedtime mode restricts app access during specified hours</li>
          <li>• Screen time limits help maintain healthy digital habits</li>
          <li>• Game unlocks encourage completion of real-world habits first</li>
          <li>• All data is stored securely and never shared with third parties</li>
        </ul>
      </div>
    </Card>
  );
}
