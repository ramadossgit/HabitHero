import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import WeekendChallengesSection from "./weekend-challenges";
import { 
  Zap, 
  Bed, 
  Heart, 
  Book, 
  Droplets,
  Star,
  CheckCircle,
  Clock,
  Flame,
  RefreshCw,
  Play,
  Pause,
  Volume2,
  VolumeX
} from "lucide-react";
import type { Habit, HabitCompletion, User } from "@shared/schema";

interface DailyMissionsProps {
  childId: string;
}

export default function DailyMissions({ childId }: DailyMissionsProps) {
  const { toast } = useToast();
  
  // Premium voice features state
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get parent/user info for premium features
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  // Subscription and trial status
  const isPremium = user?.subscriptionStatus === 'active';
  const isTrial = user?.subscriptionStatus === 'trial';
  const hasVoiceFeatures = isPremium || isTrial;

  // Voice recording playback functions
  const playVoiceRecording = (habitId: string, voiceRecording: string, customRingtone?: string) => {
    if (isPlaying === habitId) {
      // Stop current playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(null);
      return;
    }

    // Play ringtone first (if available), then voice recording
    const playSequence = async () => {
      setIsPlaying(habitId);
      
      try {
        // Play custom ringtone first (if available)
        if (customRingtone && customRingtone !== 'default') {
          const ringtoneAudio = new Audio(`/api/ringtones/${customRingtone}.mp3`);
          ringtoneAudio.volume = isMuted ? 0 : 0.7;
          await new Promise((resolve) => {
            ringtoneAudio.onended = resolve;
            ringtoneAudio.onerror = resolve; // Continue even if ringtone fails
            ringtoneAudio.play().catch(resolve);
          });
        }

        // Then play voice recording
        audioRef.current = new Audio(voiceRecording);
        audioRef.current.volume = isMuted ? 0 : 1;
        audioRef.current.onended = () => setIsPlaying(null);
        audioRef.current.onerror = () => setIsPlaying(null);
        
        await audioRef.current.play();
        
        toast({
          title: "🎵 Voice Reminder Playing",
          description: "Listen to your custom habit reminder!",
        });
      } catch (error) {
        console.error('Voice playback failed:', error);
        setIsPlaying(null);
        toast({
          title: "Playback Error",
          description: "Could not play voice reminder",
          variant: "destructive",
        });
      }
    };

    playSequence();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = !isMuted ? 0 : 1;
    }
  };

  const { data: habits, isLoading: habitsLoading } = useQuery({
    queryKey: ["/api/children", childId, "habits"],
  });

  const { data: todaysCompletions } = useQuery({
    queryKey: ["/api/children", childId, "completions", "today"],
  });

  const habitsArray = Array.isArray(habits) ? habits : [];
  const completionsArray = Array.isArray(todaysCompletions) ? todaysCompletions : [];

  const completeMissionMutation = useMutation({
    mutationFn: async (habitId: string) => {
      // Time validation removed - kids can complete habits 24/7
      
      await apiRequest("POST", `/api/habits/${habitId}/complete`, {});
    },
    onSuccess: () => {
      toast({
        title: "Mission Complete! 🎉",
        description: "Great job! You earned XP and reward points!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId] });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "completions"] });
    },
    onError: (error) => {
      toast({
        title: "Oops!",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reloadDailyHabitsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/children/${childId}/habits/reload`, {});
    },
    onSuccess: () => {
      // Silent reload - no popup notification to avoid annoyance
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId] });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "completions"] });
    },
    onError: (error) => {
      toast({
        title: "Reload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-reload daily habits when date changes
  useEffect(() => {
    const checkForDateChange = async () => {
      const today = new Date().toISOString().split('T')[0];
      const lastReloadDate = localStorage.getItem(`lastReloadDate-${childId}`);
      
      if (lastReloadDate !== today) {
        // New day detected, reload habits automatically
        try {
          await reloadDailyHabitsMutation.mutateAsync();
          localStorage.setItem(`lastReloadDate-${childId}`, today);
        } catch (error) {
          console.error('Auto-reload failed:', error);
        }
      }
    };

    // Check immediately when component mounts
    checkForDateChange();
    
    // Check every hour for date changes
    const interval = setInterval(checkForDateChange, 3600000); // 1 hour

    return () => clearInterval(interval);
  }, [childId, reloadDailyHabitsMutation]);

  const getIconComponent = (iconName: string) => {
    const icons = {
      tooth: Zap,
      bed: Bed,
      heart: Heart,
      book: Book,
      tint: Droplets,
    };
    return icons[iconName as keyof typeof icons] || Star;
  };

  const getColorClasses = (color: string) => {
    const colors = {
      coral: "text-coral bg-coral/20 border-coral hover:border-coral bg-coral hover:bg-coral/80",
      turquoise: "text-turquoise bg-turquoise/20 border-turquoise hover:border-turquoise bg-turquoise hover:bg-turquoise/80",
      sky: "text-sky bg-sky/20 border-sky hover:border-sky bg-sky hover:bg-sky/80",
      mint: "text-mint bg-mint/20 border-mint hover:border-mint bg-mint hover:bg-mint/80",
      sunshine: "text-orange-500 bg-sunshine/20 border-sunshine hover:border-sunshine bg-sunshine hover:bg-sunshine/80",
    };
    return colors[color as keyof typeof colors] || colors.mint;
  };

  if (habitsLoading) {
    return (
      <section className="mb-8">
        <h2 className="font-fredoka text-3xl text-gray-800 mb-6 flex items-center">
          <Star className="text-coral mr-3" />
          Today's Hero Missions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  // Group completions by status for today
  const today = new Date().toISOString().split('T')[0];
  const todayCompletions = completionsArray.filter(c => c.date === today);
  
  const getHabitStatus = (habitId: string) => {
    const habitCompletions = todayCompletions.filter(c => c.habitId === habitId);
    if (habitCompletions.length === 0) return 'available';
    
    // Check for approved first - if approved, habit is done
    const approved = habitCompletions.find(c => c.status === 'approved');
    if (approved) return 'approved';
    
    // Check for pending - if there's a pending, show pending
    const pending = habitCompletions.find(c => c.status === 'pending');
    if (pending) return 'pending';
    
    // If only rejected, allow try again
    const rejected = habitCompletions.find(c => c.status === 'rejected');
    if (rejected) return 'rejected';
    
    return 'available';
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-fredoka text-3xl text-gray-800 flex items-center">
          <Star className="text-coral mr-3" />
          Today's Hero Missions
        </h2>
        
        {/* Master audio control for Premium voice features */}
        {hasVoiceFeatures && habitsArray.some((h: Habit) => h.voiceRecording && h.voiceReminderEnabled) && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gold font-medium">Voice Controls:</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toggleMute()}
              className="border-gold/30 hover:bg-gold/10"
              data-testid="master-mute-toggle"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-gold mr-1" />
              ) : (
                <Volume2 className="w-4 h-4 text-gold mr-1" />
              )}
              <span className="text-xs text-gold">
                {isMuted ? 'Unmute All' : 'Mute All'}
              </span>
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {habitsArray.map((habit: Habit) => {
          const status = getHabitStatus(habit.id);
          const IconComponent = getIconComponent(habit.icon);
          const colorClasses = getColorClasses(habit.color);
          const [iconColor, bgColor, buttonColor, hoverButtonColor] = colorClasses.split(' ');

          const completion = todayCompletions.find(c => c.habitId === habit.id);
          const parentMessage = completion?.parentMessage;

          return (
            <Card 
              key={habit.id}
              className={`mission-card p-6 fun-card border-2 transform hover:scale-105 transition-all duration-300 ${
                status === 'approved' ? 'border-mint bg-mint/10 shadow-mint/30' : 
                status === 'pending' ? 'border-yellow-400 bg-yellow-50 shadow-yellow-400/30' :
                status === 'rejected' ? 'border-coral bg-coral/10 shadow-coral/30' :
                'border-sky/30 hover:border-sky hover:shadow-sky/30'
              } cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${bgColor} rounded-full p-3`}>
                  <IconComponent className={`${iconColor} text-2xl w-6 h-6`} />
                </div>
                <div className="text-right space-y-1">
                  <div className="bg-gradient-to-r from-sky to-mint text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse">
                    ⚡ +{habit.xpReward} XP
                  </div>

                </div>
              </div>
              
              <h3 className="font-nunito font-extrabold text-lg mb-2 text-black">{habit.name}</h3>
              <p className="text-black/90 mb-2">{habit.description}</p>
              
              {/* Time range and reminder info */}
              {(habit.timeRangeStart && habit.timeRangeEnd) && (
                <div className="mb-3 p-2 bg-sky/10 rounded-lg">
                  <p className="text-xs text-sky font-medium">
                    ⏰ Available: {habit.timeRangeStart} - {habit.timeRangeEnd}
                  </p>
                </div>
              )}
              
              {habit.reminderEnabled && habit.reminderTime && (
                <div className="mb-3 p-2 bg-mint/10 rounded-lg">
                  <p className="text-xs text-mint font-medium">
                    🔔 Daily reminder at {habit.reminderTime}
                  </p>
                </div>
              )}
              
              {/* Enhanced Premium Voice Recording Features */}
              {hasVoiceFeatures && habit.voiceRecording && habit.voiceReminderEnabled && (
                <div className="mb-3 p-3 bg-gradient-to-r from-gold/10 to-yellow-100 rounded-lg border border-gold/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gold rounded-full animate-pulse"></div>
                      <span className="text-xs font-bold text-gold">Premium Voice Reminder</span>
                      {isTrial && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">TRIAL</span>}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleMute()}
                      className="w-6 h-6 p-0 border-gold/30"
                    >
                      {isMuted ? <VolumeX className="w-3 h-3 text-gold" /> : <Volume2 className="w-3 h-3 text-gold" />}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm" 
                        onClick={() => playVoiceRecording(habit.id, habit.voiceRecording, habit.customRingtone)}
                        className="bg-gold hover:bg-gold/80 text-white px-3 py-1 h-7"
                        data-testid={`play-voice-${habit.id}`}
                      >
                        {isPlaying === habit.id ? (
                          <>
                            <Pause className="w-3 h-3 mr-1" />
                            <span className="text-xs">Stop</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 mr-1" />
                            <span className="text-xs">Play</span>
                          </>
                        )}
                      </Button>
                      <div className="text-xs text-gold">
                        {habit.voiceRecordingName || 'Voice message'}
                      </div>
                    </div>
                    
                    {habit.customRingtone && habit.customRingtone !== 'gentle-chime' && (
                      <div className="text-xs text-gold bg-gold/10 px-2 py-0.5 rounded">
                        🎵 Custom tone
                      </div>
                    )}
                  </div>
                  
                  {habit.reminderDuration && habit.reminderDuration > 30 && (
                    <div className="text-xs text-gold/70 mt-1">
                      ⏱️ Plays for {Math.floor(habit.reminderDuration / 60)}h {habit.reminderDuration % 60}m
                    </div>
                  )}
                </div>
              )}

              {/* Upgrade prompt for non-premium users with voice-enabled habits */}
              {!hasVoiceFeatures && habit.voiceRecording && habit.voiceReminderEnabled && (
                <div className="mb-3 p-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg border border-gray-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-xs font-bold text-gray-600">Voice Reminder Available</span>
                    </div>
                    <Button
                      size="sm"
                      className="bg-gold hover:bg-gold/80 text-white px-3 py-1 h-7 text-xs"
                      onClick={() => window.open('/premium', '_blank')}
                    >
                      ⭐ Upgrade
                    </Button>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Upgrade to Premium to hear custom voice reminders!
                  </div>
                </div>
              )}
              
              {/* Parent message for rejected habits */}
              {status === 'rejected' && parentMessage && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">Parent feedback:</p>
                  <p className="text-sm text-red-700">{parentMessage}</p>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                {status === 'approved' ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-mint" />
                      <span className="text-sm font-semibold text-black">Approved!</span>
                    </div>
                    <div className="text-mint font-bold">✓ Done</div>
                  </>
                ) : status === 'pending' ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-semibold text-black">Waiting for approval</span>
                    </div>
                    <div className="text-yellow-600 font-bold">⏳ Pending</div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <span className="text-sm font-semibold text-black">
                        {status === 'rejected' ? 'Try again!' : 'Ready'}
                      </span>
                    </div>
                    <Button 
                      className={`${buttonColor} text-white px-4 py-2 rounded-full font-bold ${hoverButtonColor} transition-colors shadow-lg`}
                      style={{ color: 'white' }}
                      onClick={() => completeMissionMutation.mutate(habit.id)}
                      disabled={completeMissionMutation.isPending}
                      data-testid={`complete-habit-${habit.id}`}
                    >
                      {completeMissionMutation.isPending ? "Completing..." : 
                       status === 'rejected' ? "Try Again!" : "Complete!"}
                    </Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
        
        {/* Weekend Challenges Section */}
        <WeekendChallengesSection childId={childId} />
      </div>
    </section>
  );
}
