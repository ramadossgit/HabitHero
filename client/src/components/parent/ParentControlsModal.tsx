import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  X, 
  Clock, 
  Moon, 
  Settings, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Lock,
  Wifi,
  Phone
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Child, ParentalControls } from "@shared/schema";

interface ParentControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: Child[];
}

export default function ParentControlsModal({ isOpen, onClose, children }: ParentControlsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id || "");
  const [emergencyLoading, setEmergencyLoading] = useState<string | null>(null);

  // Get parental controls for selected child
  const { data: controls, isLoading } = useQuery<ParentalControls>({
    queryKey: ['/api/children', selectedChildId, 'parental-controls'],
    enabled: !!selectedChildId,
  });

  // Update controls mutation
  const updateControlsMutation = useMutation({
    mutationFn: async (updates: Partial<ParentalControls>) => {
      const response = await fetch(`/api/children/${selectedChildId}/parental-controls`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update controls');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children', selectedChildId, 'parental-controls'] });
      toast({
        title: "Settings Saved",
        description: "Parent controls have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save parent controls.",
        variant: "destructive",
      });
    },
  });

  // Emergency controls mutations
  const emergencyMutation = useMutation({
    mutationFn: async ({ action, childId }: { action: 'activate' | 'deactivate', childId: string }) => {
      const response = await fetch(`/api/children/${childId}/emergency/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to update emergency controls');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/children', variables.childId, 'parental-controls'] });
      setEmergencyLoading(null);
      toast({
        title: variables.action === 'activate' ? "Emergency Mode Activated" : "Emergency Mode Deactivated",
        description: variables.action === 'activate' 
          ? "All apps have been blocked for this child." 
          : "Normal access has been restored.",
      });
    },
    onError: () => {
      setEmergencyLoading(null);
      toast({
        title: "Error",
        description: "Failed to update emergency controls.",
        variant: "destructive",
      });
    },
  });

  const handleSave = (updates: Partial<ParentalControls>) => {
    updateControlsMutation.mutate(updates);
  };

  const handleEmergencyToggle = async (childId: string, activate: boolean) => {
    setEmergencyLoading(childId);
    emergencyMutation.mutate({ 
      action: activate ? 'activate' : 'deactivate', 
      childId 
    });
  };

  if (!isOpen) return null;

  const selectedChild = children.find(c => c.id === selectedChildId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-coral to-sunshine text-white">
          <div>
            <h2 className="font-fredoka text-2xl">Parent Controls</h2>
            <p className="text-white/90">Manage screen time, features, and safety settings</p>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex h-full">
          {/* Child Selector Sidebar */}
          <div className="w-64 border-r bg-gray-50 p-4">
            <h3 className="font-bold text-gray-800 mb-4">Select Child</h3>
            <div className="space-y-2">
              {children.map((child) => (
                <div
                  key={child.id}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedChildId === child.id
                      ? 'bg-coral text-white'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedChildId(child.id)}
                  data-testid={`child-selector-${child.id}`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={child.avatarUrl || `https://ui-avatars.com/api/?name=${child.name}&background=random`}
                      alt={child.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="font-medium">{child.name}</div>
                      <div className="text-xs opacity-70">Level {child.level}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Emergency Controls Section */}
            <div className="mt-6 pt-4 border-t">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Emergency Controls
              </h3>
              <div className="space-y-3">
                {children.map((child) => {
                  const childControls = queryClient.getQueryData<ParentalControls>(['/api/children', child.id, 'parental-controls']);
                  const isEmergencyActive = childControls?.emergencyMode;
                  const isLoading = emergencyLoading === child.id;

                  return (
                    <div key={child.id} className="flex items-center justify-between">
                      <span className="text-sm">{child.name}</span>
                      <Button
                        size="sm"
                        variant={isEmergencyActive ? "destructive" : "outline"}
                        onClick={() => handleEmergencyToggle(child.id, !isEmergencyActive)}
                        disabled={isLoading}
                        data-testid={`emergency-toggle-${child.id}`}
                        className="text-xs"
                      >
                        {isLoading ? "..." : (isEmergencyActive ? "Active" : "Inactive")}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Controls Panel */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-lg">Loading controls...</div>
              </div>
            ) : selectedChild && controls ? (
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="font-fredoka text-xl text-gray-800 mb-2">
                    {selectedChild.name}'s Settings
                  </h3>
                  {controls.emergencyMode && (
                    <Badge variant="destructive" className="mb-4">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Emergency Mode Active
                    </Badge>
                  )}
                </div>

                <Tabs defaultValue="screen-time" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="screen-time" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Screen Time
                    </TabsTrigger>
                    <TabsTrigger value="bedtime" className="flex items-center gap-2">
                      <Moon className="w-4 h-4" />
                      Bedtime
                    </TabsTrigger>
                    <TabsTrigger value="features" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      App Features
                    </TabsTrigger>
                    <TabsTrigger value="emergency" className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Emergency
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="screen-time" className="space-y-6">
                    <ScreenTimeControls controls={controls} onSave={handleSave} />
                  </TabsContent>

                  <TabsContent value="bedtime" className="space-y-6">
                    <BedtimeControls controls={controls} onSave={handleSave} />
                  </TabsContent>

                  <TabsContent value="features" className="space-y-6">
                    <FeatureControls controls={controls} onSave={handleSave} />
                  </TabsContent>

                  <TabsContent value="emergency" className="space-y-6">
                    <EmergencyControls 
                      controls={controls} 
                      childName={selectedChild.name}
                      onEmergencyToggle={() => handleEmergencyToggle(selectedChild.id, !controls.emergencyMode)}
                      isLoading={emergencyLoading === selectedChild.id}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-lg text-gray-500">Select a child to manage controls</div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Screen Time Controls Component
function ScreenTimeControls({ controls, onSave }: { controls: ParentalControls, onSave: (updates: Partial<ParentalControls>) => void }) {
  const [screenTime, setScreenTime] = useState(controls.dailyScreenTime);
  const [bonusTime, setBonusTime] = useState(controls.bonusTimePerHabit);
  const [weekendBonus, setWeekendBonus] = useState(controls.weekendBonus);
  const [maxGameTime, setMaxGameTime] = useState(controls.maxGameTimePerDay);

  const handleSave = () => {
    onSave({
      dailyScreenTime: screenTime,
      bonusTimePerHabit: bonusTime,
      weekendBonus: weekendBonus,
      maxGameTimePerDay: maxGameTime,
    });
  };

  return (
    <Card className="p-6">
      <h4 className="font-bold text-lg mb-4">Daily Screen Time Limits</h4>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label htmlFor="screen-time">Daily Screen Time (minutes)</Label>
          <Input
            id="screen-time"
            type="number"
            value={screenTime}
            onChange={(e) => setScreenTime(Number(e.target.value))}
            data-testid="input-screen-time"
          />
        </div>
        <div>
          <Label htmlFor="bonus-time">Bonus Time per Habit (minutes)</Label>
          <Input
            id="bonus-time"
            type="number"
            value={bonusTime}
            onChange={(e) => setBonusTime(Number(e.target.value))}
            data-testid="input-bonus-time"
          />
        </div>
        <div>
          <Label htmlFor="weekend-bonus">Weekend Bonus (minutes)</Label>
          <Input
            id="weekend-bonus"
            type="number"
            value={weekendBonus}
            onChange={(e) => setWeekendBonus(Number(e.target.value))}
            data-testid="input-weekend-bonus"
          />
        </div>
        <div>
          <Label htmlFor="game-time">Max Game Time per Day (minutes)</Label>
          <Input
            id="game-time"
            type="number"
            value={maxGameTime}
            onChange={(e) => setMaxGameTime(Number(e.target.value))}
            data-testid="input-game-time"
          />
        </div>
      </div>
      <Button onClick={handleSave} className="mt-4" data-testid="button-save-screen-time">
        Save Screen Time Settings
      </Button>
    </Card>
  );
}

// Bedtime Controls Component
function BedtimeControls({ controls, onSave }: { controls: ParentalControls, onSave: (updates: Partial<ParentalControls>) => void }) {
  const [bedtimeMode, setBedtimeMode] = useState(controls.bedtimeMode);
  const [bedtimeStart, setBedtimeStart] = useState(controls.bedtimeStart);
  const [bedtimeEnd, setBedtimeEnd] = useState(controls.bedtimeEnd);

  const handleSave = () => {
    onSave({
      bedtimeMode,
      bedtimeStart,
      bedtimeEnd,
    });
  };

  return (
    <Card className="p-6">
      <h4 className="font-bold text-lg mb-4">Bedtime Settings</h4>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="bedtime-mode">Enable Bedtime Mode</Label>
          <Switch
            id="bedtime-mode"
            checked={bedtimeMode}
            onCheckedChange={setBedtimeMode}
            data-testid="switch-bedtime-mode"
          />
        </div>
        {bedtimeMode && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <Label htmlFor="bedtime-start">Bedtime Start</Label>
              <Input
                id="bedtime-start"
                type="time"
                value={bedtimeStart}
                onChange={(e) => setBedtimeStart(e.target.value)}
                data-testid="input-bedtime-start"
              />
            </div>
            <div>
              <Label htmlFor="bedtime-end">Wake Up Time</Label>
              <Input
                id="bedtime-end"
                type="time"
                value={bedtimeEnd}
                onChange={(e) => setBedtimeEnd(e.target.value)}
                data-testid="input-bedtime-end"
              />
            </div>
          </div>
        )}
      </div>
      <Button onClick={handleSave} className="mt-4" data-testid="button-save-bedtime">
        Save Bedtime Settings
      </Button>
    </Card>
  );
}

// Feature Controls Component
function FeatureControls({ controls, onSave }: { controls: ParentalControls, onSave: (updates: Partial<ParentalControls>) => void }) {
  const [enableHabits, setEnableHabits] = useState(controls.enableHabits);
  const [enableGearShop, setEnableGearShop] = useState(controls.enableGearShop);
  const [enableMiniGames, setEnableMiniGames] = useState(controls.enableMiniGames);
  const [enableRewards, setEnableRewards] = useState(controls.enableRewards);

  const handleSave = () => {
    onSave({
      enableHabits,
      enableGearShop,
      enableMiniGames,
      enableRewards,
    });
  };

  return (
    <Card className="p-6">
      <h4 className="font-bold text-lg mb-4">App Features</h4>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="enable-habits">Daily Habits</Label>
            <p className="text-sm text-gray-600">Allow child to view and complete daily habits</p>
          </div>
          <Switch
            id="enable-habits"
            checked={enableHabits}
            onCheckedChange={setEnableHabits}
            data-testid="switch-enable-habits"
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="enable-gear-shop">Gear Shop</Label>
            <p className="text-sm text-gray-600">Allow purchasing gear and avatar customization</p>
          </div>
          <Switch
            id="enable-gear-shop"
            checked={enableGearShop}
            onCheckedChange={setEnableGearShop}
            data-testid="switch-enable-gear-shop"
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="enable-mini-games">Mini Games</Label>
            <p className="text-sm text-gray-600">Allow access to educational mini-games</p>
          </div>
          <Switch
            id="enable-mini-games"
            checked={enableMiniGames}
            onCheckedChange={setEnableMiniGames}
            data-testid="switch-enable-mini-games"
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="enable-rewards">Rewards System</Label>
            <p className="text-sm text-gray-600">Allow earning and spending reward points</p>
          </div>
          <Switch
            id="enable-rewards"
            checked={enableRewards}
            onCheckedChange={setEnableRewards}
            data-testid="switch-enable-rewards"
          />
        </div>
      </div>
      <Button onClick={handleSave} className="mt-4" data-testid="button-save-features">
        Save Feature Settings
      </Button>
    </Card>
  );
}

// Emergency Controls Component
function EmergencyControls({ 
  controls, 
  childName, 
  onEmergencyToggle, 
  isLoading 
}: { 
  controls: ParentalControls, 
  childName: string,
  onEmergencyToggle: () => void,
  isLoading: boolean
}) {
  return (
    <div className="space-y-6">
      <Card className="p-6 border-red-200">
        <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          Emergency Mode
        </h4>
        <p className="text-gray-600 mb-4">
          Emergency mode will immediately block all apps and restrict access for {childName}. 
          Use this feature only when immediate intervention is required.
        </p>
        
        {controls.emergencyMode ? (
          <div className="bg-red-50 p-4 rounded-lg mb-4">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <Lock className="w-4 h-4" />
              <span className="font-medium">Emergency Mode is Active</span>
            </div>
            <p className="text-sm text-red-600">
              All apps are currently blocked for {childName}. 
              {controls.emergencyActivatedAt && (
                <>Activated on {new Date(controls.emergencyActivatedAt).toLocaleString()}</>
              )}
            </p>
          </div>
        ) : (
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Normal Access</span>
            </div>
            <p className="text-sm text-green-600">
              {childName} has normal access to enabled features.
            </p>
          </div>
        )}

        <Button
          onClick={onEmergencyToggle}
          disabled={isLoading}
          variant={controls.emergencyMode ? "outline" : "destructive"}
          data-testid="button-emergency-toggle"
        >
          {isLoading 
            ? "Processing..." 
            : controls.emergencyMode 
              ? "Deactivate Emergency Mode" 
              : "Activate Emergency Mode"
          }
        </Button>
      </Card>

      <Card className="p-6">
        <h4 className="font-bold text-lg mb-4">Current Emergency Settings</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span className="text-sm">Block All Apps:</span>
            <Badge variant={controls.blockAllApps ? "destructive" : "secondary"}>
              {controls.blockAllApps ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            <span className="text-sm">Limit Internet:</span>
            <Badge variant={controls.limitInternet ? "destructive" : "secondary"}>
              {controls.limitInternet ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span className="text-sm">Parent Contact:</span>
            <Badge variant={controls.parentContactEnabled ? "default" : "secondary"}>
              {controls.parentContactEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}