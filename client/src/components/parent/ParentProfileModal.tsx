import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Mic, 
  Bell, 
  Volume2, 
  Settings,
  Save,
  Camera
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

interface ParentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
}

export default function ParentProfileModal({ isOpen, onClose, user }: ParentProfileModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [email, setEmail] = useState(user?.email || "");
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(user?.voiceCommandsEnabled || false);
  const [reminderSettings, setReminderSettings] = useState(user?.reminderSettings || {
    enabled: true,
    voiceEnabled: false,
    ringtoneEnabled: true,
    defaultRingtone: "default",
    reminderTime: 15
  } as {
    enabled: boolean;
    voiceEnabled: boolean;
    ringtoneEnabled: true;
    defaultRingtone: string;
    reminderTime: number;
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserType>) => {
      return await apiRequest("PATCH", "/api/profile", updates);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated! ✨",
        description: "Your parent profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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
    updateProfileMutation.mutate({
      email,
      firstName,
      lastName,
      phoneNumber,
      voiceCommandsEnabled,
      reminderSettings,
    });
  };

  const enableVoicePermissions = async () => {
    try {
      const permission = await navigator.mediaDevices.getUserMedia({ audio: true });
      permission.getTracks().forEach(track => track.stop()); // Stop after getting permission
      setVoiceCommandsEnabled(true);
      toast({
        title: "Voice Permission Granted",
        description: "Voice commands are now enabled for habit tracking and parental controls.",
      });
    } catch (error) {
      toast({
        title: "Voice Permission Denied",
        description: "Please allow microphone access to use voice commands.",
        variant: "destructive",
      });
    }
  };

  const testVoiceCommand = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice Recognition Not Supported",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      toast({
        title: "Listening...",
        description: "Say a command like 'Mark habit complete' or 'Enable emergency mode'",
      });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      toast({
        title: "Voice Command Received",
        description: `You said: "${transcript}"`,
      });
    };

    recognition.onerror = () => {
      toast({
        title: "Voice Recognition Error",
        description: "Could not recognize speech. Please try again.",
        variant: "destructive",
      });
    };

    recognition.start();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-coral to-sunshine text-white">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6" />
            <div>
              <h2 className="font-fredoka text-xl hero-title">Parent Profile</h2>
              <p className="text-white/90 text-sm">Manage your account and preferences</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-white hover:bg-white/20 p-2">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Photo Section */}
          <div className="text-center">
            <div className="relative inline-block">
              <img
                src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent((firstName + ' ' + lastName) || email || 'Parent')}&background=ff6b6b&color=fff&size=96`}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 border-coral avatar-glow object-cover mx-auto"
              />
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-coral hover:bg-coral/80"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-fredoka text-lg text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Voice Commands Section */}
          <div className="space-y-4">
            <h3 className="font-fredoka text-lg text-gray-800 flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Voice Commands
            </h3>
            
            <div className="bg-gradient-to-r from-mint/10 to-sky/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-medium">Enable Voice Commands</div>
                  <div className="text-sm text-gray-600">Control habits and parental settings with voice</div>
                </div>
                <Switch
                  checked={voiceCommandsEnabled}
                  onCheckedChange={setVoiceCommandsEnabled}
                />
              </div>
              
              {!voiceCommandsEnabled && (
                <Button
                  onClick={enableVoicePermissions}
                  className="w-full bg-mint hover:bg-mint/80"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Enable Voice Permissions
                </Button>
              )}
              
              {voiceCommandsEnabled && (
                <div className="space-y-3">
                  <Button
                    onClick={testVoiceCommand}
                    className="w-full bg-sky hover:bg-sky/80"
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    Test Voice Command
                  </Button>
                  
                  <div className="bg-white rounded p-3">
                    <div className="text-sm font-medium mb-2">Voice Commands Available:</div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>• "Mark [habit name] complete for [child name]"</div>
                      <div>• "Enable emergency mode for [child name]"</div>
                      <div>• "Set screen time to [number] minutes"</div>
                      <div>• "Show me [child name]'s progress"</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Reminder Settings Section */}
          <div className="space-y-4">
            <h3 className="font-fredoka text-lg text-gray-800 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Reminder Settings
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Enable Reminders</div>
                  <div className="text-sm text-gray-600">Get notified about habit times and parental alerts</div>
                </div>
                <Switch
                  checked={reminderSettings.enabled}
                  onCheckedChange={(checked) => setReminderSettings({ ...reminderSettings, enabled: checked })}
                />
              </div>

              {reminderSettings.enabled && (
                <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Voice Reminders</div>
                      <div className="text-sm text-gray-600">Spoken notifications for habit times</div>
                    </div>
                    <Switch
                      checked={reminderSettings.voiceEnabled}
                      onCheckedChange={(checked) => setReminderSettings({ ...reminderSettings, voiceEnabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Ringtone Alerts</div>
                      <div className="text-sm text-gray-600">Sound alerts for important notifications</div>
                    </div>
                    <Switch
                      checked={reminderSettings.ringtoneEnabled}
                      onCheckedChange={(checked) => setReminderSettings({ ...reminderSettings, ringtoneEnabled: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Default Ringtone</Label>
                    <Select 
                      value={reminderSettings.defaultRingtone} 
                      onValueChange={(value) => setReminderSettings({ ...reminderSettings, defaultRingtone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Alert</SelectItem>
                        <SelectItem value="gentle">Gentle Chime</SelectItem>
                        <SelectItem value="upbeat">Upbeat Melody</SelectItem>
                        <SelectItem value="nature">Nature Sounds</SelectItem>
                        <SelectItem value="hero">Hero Theme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Reminder Time Before Habit</Label>
                    <Select 
                      value={reminderSettings.reminderTime.toString()} 
                      onValueChange={(value) => setReminderSettings({ ...reminderSettings, reminderTime: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutes before</SelectItem>
                        <SelectItem value="10">10 minutes before</SelectItem>
                        <SelectItem value="15">15 minutes before</SelectItem>
                        <SelectItem value="30">30 minutes before</SelectItem>
                        <SelectItem value="60">1 hour before</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={updateProfileMutation.isPending}
              className="bg-coral hover:bg-coral/80"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}