import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Settings, 
  Plus, 
  X, 
  Star, 
  Trophy, 
  Target, 
  Users, 
  Calendar, 
  Crown,
  TrendingUp,
  BarChart3,
  Mic,
  Volume2,
  Play,
  Lock,
  Check,
  Zap,
  Heart,
  Sparkles,
  Bell,
  Shield
} from "lucide-react";
import { requiresSubscription, getSubscriptionStatus } from "@/lib/subscriptionUtils";
import type { User, Child, MasterHabit, Habit } from "@shared/schema";
import HabitManagement from "@/components/parent/habit-management";
import RewardSystem from "@/components/parent/reward-system";
import ParentalControls from "@/components/parent/parental-controls";
import ProfileModal from "@/components/parent/profile-modal";
import OnboardingTutorial from "@/components/parent/OnboardingTutorial";
import ProgressReports from "@/components/parent/progress-reports";
import SubscriptionModal from "@/components/parent/subscription-modal";

// Habit Management Section Component with Enhanced Premium Voice Features
function HabitManagementSection({ childId, showAddHabit, setShowAddHabit, showHabitAssignment, setShowHabitAssignment, children, user }: { 
  childId: string; 
  showAddHabit: boolean; 
  setShowAddHabit: (show: boolean) => void;
  showHabitAssignment: boolean; 
  setShowHabitAssignment: (show: boolean) => void;
  children: Child[];
  user?: User;
}) {
  const { toast } = useToast();
  const [habitName, setHabitName] = useState("");
  const [habitDescription, setHabitDescription] = useState("");
  const [habitIcon, setHabitIcon] = useState("⚡");
  const [habitXP, setHabitXP] = useState("50");
  const [habitColor, setHabitColor] = useState("turquoise");
  
  // Premium voice reminder states
  const [isRecording, setIsRecording] = useState(false);
  const [voiceRecordingBlob, setVoiceRecordingBlob] = useState<Blob | null>(null);
  const [voiceRecordingName, setVoiceRecordingName] = useState("");
  const [reminderDuration, setReminderDuration] = useState(30);
  const [customRingtone, setCustomRingtone] = useState("gentle-chime");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  
  const [editingHabit, setEditingHabit] = useState<string | null>(null);
  const [editHabitName, setEditHabitName] = useState("");
  const [editHabitDescription, setEditHabitDescription] = useState("");
  const [editHabitIcon, setEditHabitIcon] = useState("⚡");
  const [editHabitXP, setEditHabitXP] = useState("50");
  const [editHabitColor, setEditHabitColor] = useState("turquoise");
  
  // Premium voice reminder states for editing
  const [editVoiceRecordingBlob, setEditVoiceRecordingBlob] = useState<Blob | null>(null);
  const [editVoiceRecordingName, setEditVoiceRecordingName] = useState("");
  const [editReminderDuration, setEditReminderDuration] = useState(30);
  const [editCustomRingtone, setEditCustomRingtone] = useState("gentle-chime");
  const [editIsRecording, setEditIsRecording] = useState(false);
  const [editMediaRecorder, setEditMediaRecorder] = useState<MediaRecorder | null>(null);
  const [editRecordingDuration, setEditRecordingDuration] = useState(0);
  const [editRecordingTimer, setEditRecordingTimer] = useState<NodeJS.Timeout | null>(null);

  // Check if user has premium features
  const isPremium = user?.subscriptionStatus === 'active';
  const isTrial = user?.subscriptionStatus === 'trial';
  const hasVoiceFeatures = isPremium || isTrial;

  // Ringtone options based on subscription
  const getRingtoneOptions = () => {
    const freeRingtones = [
      { value: "gentle-chime", label: "🎵 Gentle Chime", preview: "gentle-chime.mp3" },
      { value: "happy-bells", label: "🔔 Happy Bells", preview: "happy-bells.mp3" },
      { value: "nature-sounds", label: "🌿 Nature Sounds", preview: "nature-sounds.mp3" },
      { value: "soft-piano", label: "🎹 Soft Piano", preview: "soft-piano.mp3" },
      { value: "cheerful-tune", label: "🎶 Cheerful Tune", preview: "cheerful-tune.mp3" }
    ];

    const premiumRingtones = [
      { value: "ocean-waves", label: "🌊 Ocean Waves", premium: true, preview: "ocean-waves.mp3" },
      { value: "bird-song", label: "🐦 Bird Song", premium: true, preview: "bird-song.mp3" },
      { value: "wind-chimes", label: "🎐 Wind Chimes", premium: true, preview: "wind-chimes.mp3" },
      { value: "magical-sparkle", label: "✨ Magical Sparkle", premium: true, preview: "magical-sparkle.mp3" },
      { value: "forest-whisper", label: "🌲 Forest Whisper", premium: true, preview: "forest-whisper.mp3" },
      { value: "gentle-rain", label: "🌧️ Gentle Rain", premium: true, preview: "gentle-rain.mp3" },
      { value: "crystal-bells", label: "💎 Crystal Bells", premium: true, preview: "crystal-bells.mp3" },
      { value: "morning-breeze", label: "🌅 Morning Breeze", premium: true, preview: "morning-breeze.mp3" },
      { value: "zen-meditation", label: "🧘 Zen Meditation", premium: true, preview: "zen-meditation.mp3" },
      { value: "fairy-dust", label: "🧚 Fairy Dust", premium: true, preview: "fairy-dust.mp3" },
      { value: "bamboo-fountain", label: "🎋 Bamboo Fountain", premium: true, preview: "bamboo-fountain.mp3" },
      { value: "starlight-melody", label: "⭐ Starlight Melody", premium: true, preview: "starlight-melody.mp3" },
      { value: "butterfly-dance", label: "🦋 Butterfly Dance", premium: true, preview: "butterfly-dance.mp3" },
      { value: "moonlight-serenade", label: "🌙 Moonlight Serenade", premium: true, preview: "moonlight-serenade.mp3" },
      { value: "dream-whistle", label: "💫 Dream Whistle", premium: true, preview: "dream-whistle.mp3" }
    ];

    return isPremium ? [...freeRingtones, ...premiumRingtones] : freeRingtones;
  };

  const ringtoneOptions = getRingtoneOptions();

  // Play ringtone preview
  const playRingtonePreview = (ringtoneValue: string) => {
    const ringtone = ringtoneOptions.find(r => r.value === ringtoneValue);
    if (ringtone?.preview) {
      // In a real app, you would play the actual audio file
      // For now, we'll just show a toast
      toast({
        title: "Playing Preview",
        description: `🎵 ${ringtone.label}`,
      });
    }
  };

  // Get master habits for this parent
  const { data: masterHabits, isLoading } = useQuery<MasterHabit[]>({
    queryKey: ["/api/habits/master"],
  });

  // Also get child-specific habits for this specific child (for display)
  const { data: childHabits } = useQuery<Habit[]>({
    queryKey: [`/api/children/${childId}/habits`],
  });

  const createMasterHabitMutation = useMutation({
    mutationFn: async (habitData: any) => {
      const response = await apiRequest("POST", `/api/habits/master`, habitData);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create master habit");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Master Habit Created!",
        description: "New master habit template created! Use Assignment Center to assign to children.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/habits/master"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      resetNewHabitForm();
    },
    onError: (error) => {
      console.error("Master habit creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create master habit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMasterHabitMutation = useMutation({
    mutationFn: async (data: { masterHabitId: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/master-habits/${data.masterHabitId}`, data.updates);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update master habit");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Master Habit Updated!",
        description: "Master habit has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/habits/master"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      resetEditForm();
    },
    onError: (error) => {
      console.error("Master habit update error:", error);
      toast({
        title: "Error",
        description: "Failed to update master habit. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reset form functions
  const resetNewHabitForm = () => {
    setHabitName("");
    setHabitDescription("");
    setHabitIcon("⚡");
    setHabitXP("50");
    setHabitColor("turquoise");
    setVoiceRecordingBlob(null);
    setVoiceRecordingName("");
    setReminderDuration(30);
    setCustomRingtone("gentle-chime");
    setRecordingDuration(0);
    if (recordingTimer) clearInterval(recordingTimer);
    setShowAddHabit(false);
  };

  const resetEditForm = () => {
    setEditingHabit(null);
    setEditVoiceRecordingBlob(null);
    setEditVoiceRecordingName("");
    setEditReminderDuration(30);
    setEditCustomRingtone("gentle-chime");
    setEditRecordingDuration(0);
    if (editRecordingTimer) clearInterval(editRecordingTimer);
  };

  // Voice recording functions with enhanced features
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setVoiceRecordingBlob(blob);
        setVoiceRecordingName(`Voice reminder ${new Date().toLocaleTimeString()}`);
        stream.getTracks().forEach(track => track.stop());
        if (recordingTimer) clearInterval(recordingTimer);
        setRecordingDuration(0);
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      
      // Start timer
      const timer = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          // Auto-stop at 60 seconds
          if (newDuration >= 60) {
            stopRecording();
            return 60;
          }
          return newDuration;
        });
      }, 1000);
      setRecordingTimer(timer);

    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
    }
  };

  const playRecording = () => {
    if (voiceRecordingBlob) {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      const audio = new Audio(URL.createObjectURL(voiceRecordingBlob));
      setAudioElement(audio);
      audio.play().catch(error => {
        toast({
          title: "Playback Error",
          description: "Could not play recording",
          variant: "destructive",
        });
      });
    }
  };

  const deleteRecording = () => {
    setVoiceRecordingBlob(null);
    setVoiceRecordingName("");
    setRecordingDuration(0);
    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
    }
  };

  // Edit voice recording functions with same enhancements
  const startEditRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setEditVoiceRecordingBlob(blob);
        setEditVoiceRecordingName(`Voice reminder ${new Date().toLocaleTimeString()}`);
        stream.getTracks().forEach(track => track.stop());
        if (editRecordingTimer) clearInterval(editRecordingTimer);
        setEditRecordingDuration(0);
      };

      setEditMediaRecorder(recorder);
      recorder.start();
      setEditIsRecording(true);
      
      // Start timer
      const timer = setInterval(() => {
        setEditRecordingDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= 60) {
            stopEditRecording();
            return 60;
          }
          return newDuration;
        });
      }, 1000);
      setEditRecordingTimer(timer);

    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopEditRecording = () => {
    if (editMediaRecorder && editIsRecording) {
      editMediaRecorder.stop();
      setEditIsRecording(false);
      if (editRecordingTimer) {
        clearInterval(editRecordingTimer);
        setEditRecordingTimer(null);
      }
    }
  };

  const playEditRecording = () => {
    if (editVoiceRecordingBlob) {
      const audio = new Audio(URL.createObjectURL(editVoiceRecordingBlob));
      audio.play().catch(error => {
        toast({
          title: "Playback Error",
          description: "Could not play recording",
          variant: "destructive",
        });
      });
    }
  };

  const deleteEditRecording = () => {
    setEditVoiceRecordingBlob(null);
    setEditVoiceRecordingName("");
    setEditRecordingDuration(0);
  };

  const handleAddHabit = async () => {
    if (!habitName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the habit!",
        variant: "destructive",
      });
      return;
    }

    let voiceRecordingUrl = "";
    
    // Upload voice recording if exists and user has voice features
    if (voiceRecordingBlob && hasVoiceFeatures) {
      try {
        const uploadResponse = await apiRequest("POST", "/api/objects/upload");
        const { uploadURL } = await uploadResponse.json();

        const uploadResult = await fetch(uploadURL, {
          method: 'PUT',
          body: voiceRecordingBlob,
          headers: {
            'Content-Type': 'audio/webm'
          }
        });

        if (uploadResult.ok) {
          voiceRecordingUrl = uploadURL.split('?')[0];
        }
      } catch (error) {
        console.error("Voice upload failed:", error);
      }
    }

    createMasterHabitMutation.mutate({
      name: habitName.trim(),
      description: habitDescription.trim(),
      icon: habitIcon,
      xpReward: parseInt(habitXP),
      color: habitColor,
      frequency: "daily",
      voiceRecording: voiceRecordingUrl,
      voiceRecordingName,
      reminderDuration: hasVoiceFeatures ? reminderDuration : 30,
      customRingtone: hasVoiceFeatures ? customRingtone : "gentle-chime",
      voiceReminderEnabled: hasVoiceFeatures && !!voiceRecordingBlob,
    });
  };

  // Format recording duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="fun-card p-4 sm:p-8 border-4 border-turquoise">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center">
          <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-turquoise mr-2 sm:mr-3" />
          <div>
            <h3 className="font-fredoka text-xl sm:text-2xl text-gray-800 hero-title">Habit Management</h3>
            <p className="text-gray-600 text-sm sm:text-base">Manage daily habits and control active/inactive status</p>
          </div>
        </div>
        {masterHabits && masterHabits.length > 0 && (
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1 bg-green-100 px-3 py-1 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium text-green-800">
                {masterHabits.length} Master Habits
              </span>
            </div>
            <div className="flex items-center space-x-1 bg-blue-100 px-3 py-1 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-blue-800">
                {childHabits?.filter(h => h.isActive).length || 0} Assigned
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Voice Features Availability Notice */}
      {!hasVoiceFeatures && (
        <div className="mb-6 p-4 bg-gradient-to-r from-gold/10 to-yellow-50 border-2 border-gold/30 rounded-lg">
          <h4 className="font-bold text-gold mb-2 flex items-center">
            <Crown className="w-5 h-5 mr-2" />
            Premium Voice Reminder Features
          </h4>
          <p className="text-sm text-gray-700 mb-3">
            Upgrade to Premium to unlock custom voice messages, extended ringtone library (20 total), and advanced reminder settings.
          </p>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-white/50 p-2 rounded">
              <strong>Free Plan:</strong> 5 basic ringtones, 30min reminders
            </div>
            <div className="bg-gold/20 p-2 rounded">
              <strong>Premium:</strong> Custom voice messages, 20 ringtones, flexible timings
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-turquoise border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Existing habits display code would go here */}
          
          {!showAddHabit ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <Button 
                  onClick={() => setShowAddHabit(true)}
                  className="bg-turquoise hover:bg-turquoise/80 text-white font-bold"
                >
                  + Add New Habit
                </Button>
                <Button 
                  onClick={() => setShowHabitAssignment(true)}
                  className="bg-sky hover:bg-sky/80 text-white font-bold"
                  disabled={!children || children.length === 0}
                >
                  Manage Assignments
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-6 bg-turquoise/10 rounded-lg border-2 border-turquoise/30">
              <h4 className="font-bold text-gray-800 text-lg">Create New Habit</h4>
              
              <div className="space-y-3">
                <Input
                  placeholder="Habit name (e.g., Brush Teeth)"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={habitDescription}
                  onChange={(e) => setHabitDescription(e.target.value)}
                  rows={2}
                />
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-bold text-gray-700">Icon</label>
                    <Select value={habitIcon} onValueChange={setHabitIcon}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="⚡">⚡ Energy</SelectItem>
                        <SelectItem value="🦷">🦷 Teeth</SelectItem>
                        <SelectItem value="📚">📚 Reading</SelectItem>
                        <SelectItem value="🏃">🏃 Exercise</SelectItem>
                        <SelectItem value="🥗">🥗 Healthy Food</SelectItem>
                        <SelectItem value="💤">💤 Sleep</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700">XP Reward</label>
                    <Select value={habitXP} onValueChange={setHabitXP}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25 XP</SelectItem>
                        <SelectItem value="50">50 XP</SelectItem>
                        <SelectItem value="75">75 XP</SelectItem>
                        <SelectItem value="100">100 XP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700">Color</label>
                    <Select value={habitColor} onValueChange={setHabitColor}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="turquoise">🔵 Turquoise</SelectItem>
                        <SelectItem value="coral">🔴 Coral</SelectItem>
                        <SelectItem value="sunshine">🟡 Sunshine</SelectItem>
                        <SelectItem value="mint">🟢 Mint</SelectItem>
                        <SelectItem value="purple">🟣 Purple</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Enhanced Voice Reminder Features */}
              <div className={`mt-6 p-4 rounded-lg border-2 ${
                hasVoiceFeatures 
                  ? 'bg-gradient-to-r from-gold/10 to-yellow-100 border-gold/30' 
                  : 'bg-gray-100 border-gray-300'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-bold ${hasVoiceFeatures ? 'text-gold' : 'text-gray-500'} flex items-center`}>
                    <Mic className="w-4 h-4 mr-2" />
                    Voice Reminder Features
                    {!hasVoiceFeatures && <Lock className="w-4 h-4 ml-2" />}
                  </h4>
                  {isPremium && (
                    <span className="text-xs bg-gold/20 text-gold px-2 py-1 rounded-full font-medium">
                      Premium
                    </span>
                  )}
                  {isTrial && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                      Trial Access
                    </span>
                  )}
                </div>
                
                {hasVoiceFeatures ? (
                  <>
                    {/* Custom Voice Recording */}
                    <div className="mb-4">
                      <label className="text-sm font-bold text-gray-700 mb-2 block">Custom Voice Message</label>
                      <div className="flex items-center space-x-3 mb-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={isRecording ? "destructive" : "default"}
                          onClick={isRecording ? stopRecording : startRecording}
                          className="flex items-center space-x-2"
                          disabled={!hasVoiceFeatures}
                        >
                          {isRecording ? (
                            <>
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                              <span>Stop ({formatDuration(recordingDuration)})</span>
                            </>
                          ) : (
                            <>
                              <Mic className="w-4 h-4" />
                              <span>Record Message</span>
                            </>
                          )}
                        </Button>
                        {voiceRecordingBlob && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={playRecording}
                              className="flex items-center space-x-2"
                            >
                              <Play className="w-4 h-4" />
                              <span>Play</span>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={deleteRecording}
                              className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                              <span>Delete</span>
                            </Button>
                          </>
                        )}
                      </div>
                      {voiceRecordingName && (
                        <p className="text-sm text-green-600">✓ {voiceRecordingName}</p>
                      )}
                      {isRecording && (
                        <p className="text-xs text-orange-600 mt-1">Max recording time: 60 seconds</p>
                      )}
                    </div>

                    {/* Reminder Duration */}
                    <div className="mb-4">
                      <label className="text-sm font-bold text-gray-700">Reminder Duration</label>
                      <Select 
                        value={reminderDuration.toString()} 
                        onValueChange={(value) => setReminderDuration(parseInt(value))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                          <SelectItem value="180">3 hours</SelectItem>
                          <SelectItem value="240">4 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* System Ringtones */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-bold text-gray-700">
                          System Ringtone ({ringtoneOptions.length} available)
                        </label>
                        {customRingtone && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => playRingtonePreview(customRingtone)}
                            className="flex items-center space-x-1 text-xs"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>Preview</span>
                          </Button>
                        )}
                      </div>
                      <Select value={customRingtone} onValueChange={setCustomRingtone}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {ringtoneOptions.map((ringtone) => (
                            <SelectItem 
                              key={ringtone.value} 
                              value={ringtone.value}
                              className={ringtone.premium && !isPremium ? 'opacity-50' : ''}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>{ringtone.label}</span>
                                {ringtone.premium && !isPremium && (
                                  <span className="ml-2 text-xs bg-gold/20 text-gold px-1 py-0.5 rounded">
                                    Premium
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        {isPremium 
                          ? "All 20 ringtones available with Premium subscription"
                          : isTrial
                          ? "Trial access - upgrade for full library"
                          : "5 free ringtones available - upgrade for 15 more premium options"
                        }
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 space-y-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                      <Lock className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="text-gray-600">
                      <p className="font-medium">Premium Voice Features</p>
                      <p className="text-sm">Custom voice messages and extended ringtone library</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-xs max-w-sm mx-auto">
                      <div className="bg-white/50 p-2 rounded border">
                        <strong>Free:</strong> 5 basic ringtones, standard reminders
                      </div>
                      <div className="bg-gold/10 p-2 rounded border border-gold/30">
                        <strong>Premium:</strong> Custom voice + 20 ringtones + flexible timing
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-gold hover:bg-gold/80 text-white"
                      onClick={() => {
                        toast({
                          title: "Upgrade to Premium",
                          description: "Visit billing settings to unlock voice features",
                        });
                      }}
                    >
                      Upgrade Now
                    </Button>
                  </div>
                )}

                {/* Basic ringtone selection for free users */}
                {!hasVoiceFeatures && (
                  <div className="mt-4 pt-4 border-t">
                    <label className="text-sm font-bold text-gray-700 mb-2 block">
                      Basic Ringtone (5 available)
                    </label>
                    <div className="flex items-center space-x-3">
                      <Select value={customRingtone} onValueChange={setCustomRingtone}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ringtoneOptions.slice(0, 5).map((ringtone) => (
                            <SelectItem key={ringtone.value} value={ringtone.value}>
                              {ringtone.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => playRingtonePreview(customRingtone)}
                        className="flex items-center space-x-1"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Preview</span>
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Free plan includes 5 basic ringtones
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleAddHabit}
                  disabled={createMasterHabitMutation.isPending || !habitName.trim()}
                  className="flex-1 bg-turquoise hover:bg-turquoise/80 text-white"
                >
                  {createMasterHabitMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    "Create Master Habit"
                  )}
                </Button>
                <Button 
                  onClick={resetNewHabitForm}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Display existing habits */}
          {masterHabits?.map((habit) => (
            <div key={habit.id} className="p-6 bg-turquoise/10 rounded-lg border-2 border-turquoise/30 shadow-sm">
              {editingHabit === habit.id ? (
                <div className="space-y-4">
                  {/* Edit form would go here - similar structure to the create form */}
                  <Input
                    value={editHabitName}
                    onChange={(e) => setEditHabitName(e.target.value)}
                    placeholder="Habit name"
                    className="border-2 border-turquoise"
                  />
                  <Textarea
                    value={editHabitDescription}
                    onChange={(e) => setEditHabitDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="border-2 border-turquoise"
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-bold text-gray-700">Icon</label>
                      <Select value={editHabitIcon} onValueChange={setEditHabitIcon}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="⚡">⚡ Energy</SelectItem>
                          <SelectItem value="🏃">🏃 Exercise</SelectItem>
                          <SelectItem value="📚">📚 Study</SelectItem>
                          <SelectItem value="🧘">🧘 Mindfulness</SelectItem>
                          <SelectItem value="💧">💧 Water</SelectItem>
                          <SelectItem value="🥗">🥗 Healthy Food</SelectItem>
                          <SelectItem value="💤">💤 Sleep</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-700">XP Reward</label>
                      <Select value={editHabitXP} onValueChange={setEditHabitXP}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25 XP</SelectItem>
                          <SelectItem value="50">50 XP</SelectItem>
                          <SelectItem value="75">75 XP</SelectItem>
                          <SelectItem value="100">100 XP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-700">Color</label>
                      <Select value={editHabitColor} onValueChange={setEditHabitColor}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="turquoise">Turquoise</SelectItem>
                          <SelectItem value="coral">Coral</SelectItem>
                          <SelectItem value="sunshine">Sunshine</SelectItem>
                          <SelectItem value="mint">Mint</SelectItem>
                          <SelectItem value="purple">Purple</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Enhanced Voice Features for Editing */}
                  {hasVoiceFeatures && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-gold/10 to-yellow-100 rounded-lg border-2 border-gold/30">
                      <h4 className="font-bold text-gold mb-3 flex items-center">
                        <Mic className="w-4 h-4 mr-2" />
                        Voice Reminder Features
                      </h4>
                      
                      {/* Edit Voice Recording */}
                      <div className="mb-4">
                        <label className="text-sm font-bold text-gray-700 mb-2 block">Custom Voice Message</label>
                        <div className="flex items-center space-x-3 mb-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={editIsRecording ? "destructive" : "default"}
                            onClick={editIsRecording ? stopEditRecording : startEditRecording}
                            className="flex items-center space-x-2"
                          >
                            {editIsRecording ? (
                              <>
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <span>Stop ({formatDuration(editRecordingDuration)})</span>
                              </>
                            ) : (
                              <>
                                <Mic className="w-4 h-4" />
                                <span>Record New</span>
                              </>
                            )}
                          </Button>
                          {(editVoiceRecordingBlob || habit.voiceRecording) && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={playEditRecording}
                                className="flex items-center space-x-2"
                              >
                                <Play className="w-4 h-4" />
                                <span>Play</span>
                              </Button>
                              {editVoiceRecordingBlob && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={deleteEditRecording}
                                  className="flex items-center space-x-2 text-red-600"
                                >
                                  <X className="w-4 h-4" />
                                  <span>Delete New</span>
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                        {editVoiceRecordingName && (
                          <p className="text-sm text-green-600">✓ New: {editVoiceRecordingName}</p>
                        )}
                        {habit.voiceRecording && !editVoiceRecordingName && (
                          <p className="text-sm text-blue-600">✓ Current: {habit.voiceRecordingName || 'Voice reminder'}</p>
                        )}
                      </div>

                      {/* Edit Reminder Duration */}
                      <div className="mb-4">
                        <label className="text-sm font-bold text-gray-700">Reminder Duration</label>
                        <Select 
                          value={editReminderDuration.toString()} 
                          onValueChange={(value) => setEditReminderDuration(parseInt(value))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="90">1.5 hours</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                            <SelectItem value="180">3 hours</SelectItem>
                            <SelectItem value="240">4 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Edit System Ringtones */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-bold text-gray-700">System Ringtone</label>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => playRingtonePreview(editCustomRingtone)}
                            className="flex items-center space-x-1 text-xs"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>Preview</span>
                          </Button>
                        </div>
                        <Select value={editCustomRingtone} onValueChange={setEditCustomRingtone}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            {ringtoneOptions.map((ringtone) => (
                              <SelectItem 
                                key={ringtone.value} 
                                value={ringtone.value}
                                className={ringtone.premium && !isPremium ? 'opacity-50' : ''}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{ringtone.label}</span>
                                  {ringtone.premium && !isPremium && (
                                    <span className="ml-2 text-xs bg-gold/20 text-gold px-1 py-0.5 rounded">
                                      Premium
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={async () => {
                        let editVoiceRecordingUrl = "";
                        
                        // Upload new voice recording if exists and user has voice features
                        if (editVoiceRecordingBlob && hasVoiceFeatures) {
                          try {
                            const uploadResponse = await apiRequest("POST", "/api/objects/upload");
                            const { uploadURL } = await uploadResponse.json();

                            const uploadResult = await fetch(uploadURL, {
                              method: 'PUT',
                              body: editVoiceRecordingBlob,
                              headers: { 'Content-Type': 'audio/webm' }
                            });

                            if (uploadResult.ok) {
                              editVoiceRecordingUrl = uploadURL.split('?')[0];
                            }
                          } catch (error) {
                            console.error("Voice upload failed:", error);
                          }
                        }
                        
                        updateMasterHabitMutation.mutate({
                          masterHabitId: habit.id,
                          updates: {
                            name: editHabitName,
                            description: editHabitDescription,
                            icon: editHabitIcon,
                            xpReward: parseInt(editHabitXP),
                            color: editHabitColor,
                            voiceRecording: editVoiceRecordingUrl || habit.voiceRecording,
                            voiceRecordingName: editVoiceRecordingName || habit.voiceRecordingName,
                            reminderDuration: hasVoiceFeatures ? editReminderDuration : habit.reminderDuration,
                            customRingtone: hasVoiceFeatures ? editCustomRingtone : habit.customRingtone,
                            voiceReminderEnabled: hasVoiceFeatures && (!!editVoiceRecordingBlob || !!habit.voiceRecording),
                          }
                        });
                      }}
                      disabled={updateMasterHabitMutation.isPending}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      {updateMasterHabitMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      onClick={resetEditForm}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="text-3xl">{habit.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <div className="font-bold text-gray-800 text-lg">{habit.name}</div>
                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                          habit.isActive 
                            ? 'bg-green-200 text-green-800' 
                            : 'bg-yellow-200 text-yellow-800'
                        }`}>
                          {habit.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {habit.voiceRecording && hasVoiceFeatures && (
                          <span className="text-xs bg-gold/20 text-gold px-2 py-1 rounded-full font-medium">
                            Voice Enabled
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">{habit.description}</div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>{habit.xpReward} XP • {habit.customRingtone || 'Default ringtone'}</div>
                        {hasVoiceFeatures && habit.reminderDuration && (
                          <div>Reminder duration: {habit.reminderDuration} minutes</div>
                        )}
                        <div>
                          {habit.isActive 
                            ? "Appears in child's daily habit list and syncs to their device" 
                            : "Hidden from child - won't sync to their device"
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-4">
                    <div className="text-left lg:text-right lg:min-w-[80px]">
                      <div className="text-sm font-bold text-turquoise">{habit.xpReward} XP</div>
                      <div className="text-xs text-gray-500">Reward</div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                      <Button
                        onClick={() => {
                          // Toggle habit status logic would go here
                        }}
                        size="sm"
                        className={`flex-1 sm:flex-initial px-3 py-2 text-sm font-medium min-w-[140px] whitespace-nowrap ${
                          habit.isActive 
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        {habit.isActive ? "Make Inactive" : "Make Active"}
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingHabit(habit.id);
                          setEditHabitName(habit.name);
                          setEditHabitDescription(habit.description || "");
                          setEditHabitIcon(habit.icon);
                          setEditHabitXP(habit.xpReward.toString());
                          setEditHabitColor(habit.color || "turquoise");
                          setEditReminderDuration(habit.reminderDuration || 30);
                          setEditCustomRingtone(habit.customRingtone || "gentle-chime");
                          setEditVoiceRecordingName(habit.voiceRecordingName || "");
                        }}
                        size="sm"
                        className="flex-1 sm:flex-initial bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 text-sm min-w-[80px]"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => {
                          if (confirm(`Delete "${habit.name}" habit? This cannot be undone.`)) {
                            // Delete habit logic would go here
                          }
                        }}
                        size="sm"
                        className="flex-1 sm:flex-initial bg-red-500 hover:bg-red-600 text-white px-3 py-2 text-sm min-w-[80px]"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// Main Parent Dashboard Component
export default function ParentDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Fetch authenticated user
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  // Fetch children
  const { data: children = [], isLoading: childrenLoading } = useQuery<Child[]>({
    queryKey: ['/api/children'],
  });

  // Check if subscription is required
  const subscriptionRequired = user ? requiresSubscription(user) : false;
  const subscriptionStatus = user ? getSubscriptionStatus(user) : null;

  // Auto-select first child if none selected
  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  // Show loading state
  if (userLoading || childrenLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mint-50 to-turquoise-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-mint-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show subscription screen if required
  if (subscriptionRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mint-50 to-turquoise-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="mb-8">
            <Crown className="w-16 h-16 text-coral-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              🏆 Habit Heroes Premium
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Your trial has ended. Upgrade to continue your family's habit-building journey!
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border-4 border-turquoise-200 dark:border-turquoise-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-coral-500" />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    📱 Subscription Management
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">Manage your plan and billing</p>
                </div>
              </div>
              <Button
                onClick={() => setShowSubscriptionModal(true)}
                className="super-button px-6 py-3 text-white font-semibold"
              >
                🔧 Manage
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Current Plan
                </p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-mint-100 text-mint-800 dark:bg-mint-900 dark:text-mint-200">
                    TRIAL
                  </Badge>
                  <span className="text-mint-600 dark:text-mint-400 font-medium">Free Trial</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Free for 7 days
                </p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Trial Period Ended
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  🔒 To continue managing your family's habits, rewards, and progress tracking, please upgrade to a Premium subscription.
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Current Features</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">1 Hero Character</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">5 Daily Habits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Basic Progress Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Simple Rewards</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-coral-50 to-sunshine-50 dark:from-coral-900/20 dark:to-sunshine-900/20 p-6 rounded-xl mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-coral-500" />
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Upgrade to Premium to unlock unlimited heroes, habits, and premium features!
                </span>
              </div>
            </div>

            <Button
              onClick={() => setShowSubscriptionModal(true)}
              className="w-full super-button py-4 text-lg font-semibold text-white"
            >
              🚀 Upgrade to Premium
            </Button>
          </div>
        </div>

        {showSubscriptionModal && (
          <SubscriptionModal
            user={user}
            onClose={() => setShowSubscriptionModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint-50 to-turquoise-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b-4 border-turquoise-200 dark:border-turquoise-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-mint-400 to-turquoise-500 p-3 rounded-xl">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Habit Heroes
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Parent Dashboard
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {subscriptionStatus && (
                <Badge className={
                  subscriptionStatus.isTrialActive 
                    ? "bg-mint-100 text-mint-800 dark:bg-mint-900 dark:text-mint-200"
                    : "bg-coral-100 text-coral-800 dark:bg-coral-900 dark:text-coral-200"
                }>
                  {subscriptionStatus.isTrialActive 
                    ? `Trial: ${subscriptionStatus.daysLeft} days left`
                    : "Premium Active"
                  }
                </Badge>
              )}
              
              <Button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center space-x-2 bg-coral-500 hover:bg-coral-600 text-white"
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-coral-600 text-white text-sm">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">{user?.firstName}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-lg">
            {[
              { id: "dashboard", label: "📊 Dashboard", icon: BarChart3 },
              { id: "habits", label: "⚡ Habits", icon: Zap },
              { id: "rewards", label: "🎁 Rewards", icon: Trophy },
              { id: "controls", label: "🛡️ Controls", icon: Shield },
              { id: "reports", label: "📈 Reports", icon: TrendingUp }
            ].map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[120px] ${
                  activeTab === tab.id
                    ? "super-button text-white"
                    : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Child Selector */}
        {children.length > 0 && (
          <div className="mb-6">
            <Card className="border-2 border-turquoise-200 dark:border-turquoise-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Select Child
                  </h3>
                  <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Choose a child" />
                    </SelectTrigger>
                    <SelectContent>
                      {children.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{child.avatarType === 'robot' ? '🤖' : child.avatarType === 'princess' ? '👸' : child.avatarType === 'ninja' ? '🥷' : '🐾'}</span>
                            <span>{child.name}</span>
                            <Badge className="ml-2">Level {child.level}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Content */}
        {selectedChildId && (
          <>
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <ProgressReports childId={selectedChildId} />
              </div>
            )}
            
            {activeTab === "habits" && (
              <HabitManagement childId={selectedChildId} />
            )}
            
            {activeTab === "rewards" && (
              <RewardSystem childId={selectedChildId} />
            )}
            
            {activeTab === "controls" && (
              <ParentalControls childId={selectedChildId} />
            )}
            
            {activeTab === "reports" && (
              <div className="space-y-6">
                <ProgressReports childId={selectedChildId} />
              </div>
            )}
          </>
        )}

        {/* No Children State */}
        {children.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Children Added Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Add your first child to start building healthy habits together!
            </p>
            <Button 
              onClick={() => setShowOnboarding(true)}
              className="super-button text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Child
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showProfileModal && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
        />
      )}
      
      {showSubscriptionModal && (
        <SubscriptionModal
          user={user}
          onClose={() => setShowSubscriptionModal(false)}
        />
      )}
      
      {showOnboarding && (
        <OnboardingTutorial
          onClose={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
}