import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Clock, Volume2, Bell, Timer, Play, Pause, Mic, MicOff, Upload, Trash2, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AlertSettings {
  reminderEnabled: boolean;
  reminderTime: string;
  voiceReminderEnabled: boolean;
  customRingtone: string;
  reminderDuration: number; // in minutes
  timeRangeStart: string;
  timeRangeEnd: string;
  voiceRecording?: string; // Base64 encoded audio data
  voiceRecordingName?: string; // Name for the recording
}

interface AlertSettingsProps {
  initialSettings: AlertSettings;
  onSettingsChange: (settings: AlertSettings) => void;
  onSave?: () => void;
  onCancel?: () => void;
  isStandalone?: boolean;
  title?: string;
}

const ringtoneOptions = [
  { value: "default", label: "Default Alert", emoji: "🔔" },
  { value: "cheerful", label: "Cheerful Bell", emoji: "😊" },
  { value: "gentle", label: "Gentle Chime", emoji: "🎵" },
  { value: "upbeat", label: "Upbeat Melody", emoji: "🎶" },
  { value: "nature", label: "Nature Sounds", emoji: "🌿" },
  { value: "hero", label: "Hero Theme", emoji: "🦸" },
  { value: "mission", label: "Mission Alert", emoji: "🎯" },
  { value: "achievement", label: "Achievement Sound", emoji: "🏆" },
  { value: "adventure", label: "Adventure Call", emoji: "⚔️" },
  { value: "magic", label: "Magic Sparkle", emoji: "✨" },
];

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

export default function AlertSettings({
  initialSettings,
  onSettingsChange,
  onSave,
  onCancel,
  isStandalone = false,
  title = "Alert & Reminder Settings"
}: AlertSettingsProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AlertSettings>(initialSettings);
  const [isTestingRingtone, setIsTestingRingtone] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const updateSettings = (newSettings: Partial<AlertSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    onSettingsChange(updatedSettings);
  };

  const testRingtone = async () => {
    setIsTestingRingtone(true);
    
    try {
      // Create a simple audio test for the selected ringtone
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different frequencies for different ringtones
      const frequencies: Record<string, number[]> = {
        default: [800, 1000],
        cheerful: [523, 659, 784],
        gentle: [440, 554],
        upbeat: [523, 659, 784, 1047],
        nature: [200, 300, 400],
        hero: [392, 523, 659],
        mission: [1000, 800, 1200],
        achievement: [523, 659, 784, 1047, 1319],
        adventure: [294, 392, 523],
        magic: [523, 784, 1047, 1319]
      };
      
      const freq = frequencies[settings.customRingtone] || frequencies.default;
      let currentFreq = 0;
      
      const playNote = () => {
        if (currentFreq < freq.length) {
          oscillator.frequency.setValueAtTime(freq[currentFreq], audioContext.currentTime);
          currentFreq++;
          setTimeout(playNote, 200);
        } else {
          oscillator.stop();
          setIsTestingRingtone(false);
        }
      };
      
      oscillator.start();
      playNote();
      
      if (settings.voiceReminderEnabled) {
        setTimeout(() => {
          toast({
            title: "Voice Reminder Preview",
            description: "Hey there! Don't forget your daily habit. You're doing amazing!",
            duration: 3000,
          });
        }, freq.length * 200 + 500);
      }
      
    } catch (error) {
      console.error('Audio test failed:', error);
      toast({
        title: "Ringtone Test",
        description: `Testing ${settings.customRingtone} ringtone`,
        duration: 2000,
      });
      setIsTestingRingtone(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          updateSettings({ 
            voiceRecording: base64,
            voiceRecordingName: `Recording ${new Date().toLocaleTimeString()}`
          });
          toast({
            title: "Recording Saved!",
            description: "Your voice reminder has been recorded successfully.",
          });
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak your personalized reminder message now.",
      });
    } catch (error) {
      console.error('Recording failed:', error);
      toast({
        title: "Recording Failed",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const playRecording = () => {
    if (settings.voiceRecording && !isPlayingRecording) {
      if (audioRef.current) {
        audioRef.current.src = settings.voiceRecording;
        audioRef.current.play();
        setIsPlayingRecording(true);
        
        audioRef.current.onended = () => {
          setIsPlayingRecording(false);
        };
      }
    }
  };
  
  const deleteRecording = () => {
    updateSettings({ 
      voiceRecording: undefined,
      voiceRecordingName: undefined
    });
    toast({
      title: "Recording Deleted",
      description: "Voice reminder has been removed.",
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
    }
    toast({
      title: "Settings Saved!",
      description: "Alert and reminder preferences have been updated.",
    });
  };

  if (isStandalone) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-fredoka text-gray-800 mb-2">{title}</h1>
          <p className="text-gray-600">Configure how and when reminders are delivered</p>
        </div>
        
        <Card className="p-6">
          <AlertSettingsContent
            settings={settings}
            updateSettings={updateSettings}
            testRingtone={testRingtone}
            isTestingRingtone={isTestingRingtone}
            ringtoneOptions={ringtoneOptions}
            timeSlots={timeSlots}
            startRecording={startRecording}
            stopRecording={stopRecording}
            playRecording={playRecording}
            deleteRecording={deleteRecording}
            isRecording={isRecording}
            isPlayingRecording={isPlayingRecording}
          />
          <audio ref={audioRef} style={{ display: 'none' }} />
        </Card>
        
        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} className="bg-coral hover:bg-coral/80">
            Save Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AlertSettingsContent
        settings={settings}
        updateSettings={updateSettings}
        testRingtone={testRingtone}
        isTestingRingtone={isTestingRingtone}
        ringtoneOptions={ringtoneOptions}
        timeSlots={timeSlots}
        startRecording={startRecording}
        stopRecording={stopRecording}
        playRecording={playRecording}
        deleteRecording={deleteRecording}
        isRecording={isRecording}
        isPlayingRecording={isPlayingRecording}
      />
      <audio ref={audioRef} style={{ display: 'none' }} />
    </>
  );
}

function AlertSettingsContent({
  settings,
  updateSettings,
  testRingtone,
  isTestingRingtone,
  ringtoneOptions,
  timeSlots,
  startRecording,
  stopRecording,
  playRecording,
  deleteRecording,
  isRecording,
  isPlayingRecording
}: {
  settings: AlertSettings;
  updateSettings: (newSettings: Partial<AlertSettings>) => void;
  testRingtone: () => void;
  isTestingRingtone: boolean;
  ringtoneOptions: Array<{ value: string; label: string; emoji: string }>;
  timeSlots: string[];
  startRecording: () => void;
  stopRecording: () => void;
  playRecording: () => void;
  deleteRecording: () => void;
  isRecording: boolean;
  isPlayingRecording: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Main Reminder Toggle */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-mint/10 to-sky/10 dark:from-mint/20 dark:to-sky/20 rounded-lg border-2 border-coral/30 dark:border-coral/40">
        <div>
          <h3 className="font-fredoka text-lg text-gray-800 dark:text-gray-100 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-coral" />
            🔔 Daily Reminders
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Get notified when it's time for habits</p>
        </div>
        <Switch
          checked={settings.reminderEnabled}
          onCheckedChange={(checked) => updateSettings({ reminderEnabled: checked })}
          data-testid="toggle-reminders"
        />
      </div>

      {settings.reminderEnabled && (
        <div className="space-y-6">
          {/* Reminder Time */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-medium">
              <Clock className="w-4 h-4 text-coral" />
              Reminder Time
            </Label>
            <Select 
              value={settings.reminderTime} 
              onValueChange={(value) => updateSettings({ reminderTime: value })}
            >
              <SelectTrigger data-testid="select-reminder-time">
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

          {/* Reminder Duration */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300">
              <Timer className="w-4 h-4 text-coral" />
              ⏱️ Reminder Duration: {settings.reminderDuration} minutes
            </Label>
            <div className="px-3">
              <Slider
                value={[settings.reminderDuration]}
                onValueChange={([value]) => updateSettings({ reminderDuration: value })}
                max={30}
                min={1}
                step={1}
                className="w-full"
                data-testid="slider-reminder-duration"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>1 min</span>
                <span>15 min</span>
                <span>30 min</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              How long reminders will continue if not acknowledged
            </p>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeRangeStart" className="text-gray-700 dark:text-gray-300">🌅 Active From</Label>
              <Input
                id="timeRangeStart"
                type="time"
                value={settings.timeRangeStart}
                onChange={(e) => updateSettings({ timeRangeStart: e.target.value })}
                data-testid="input-time-start"
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeRangeEnd" className="text-gray-700 dark:text-gray-300">🌙 Active Until</Label>
              <Input
                id="timeRangeEnd"
                type="time"
                value={settings.timeRangeEnd}
                onChange={(e) => updateSettings({ timeRangeEnd: e.target.value })}
                data-testid="input-time-end"
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Voice Reminders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <div>
                <div className="font-medium flex items-center text-gray-800 dark:text-gray-100">
                  <Volume2 className="w-4 h-4 mr-2 text-yellow-600" />
                  🔊 Voice Reminders
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Spoken reminder messages</div>
              </div>
              <Switch
                checked={settings.voiceReminderEnabled}
                onCheckedChange={(checked) => updateSettings({ voiceReminderEnabled: checked })}
                data-testid="toggle-voice-reminders"
              />
            </div>

            {/* Voice Recording Section */}
            {settings.voiceReminderEnabled && (
              <div className="p-4 bg-gradient-to-r from-purple/10 to-pink/10 dark:from-purple/20 dark:to-pink/20 rounded-lg border-2 border-purple/30 dark:border-purple/40">
                <h4 className="font-fredoka text-base text-gray-800 dark:text-gray-100 mb-3 flex items-center">
                  <Mic className="w-4 h-4 mr-2 text-purple" />
                  🎤 Personal Voice Message
                </h4>
                
                {!settings.voiceRecording ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Record your own voice reminder for a personal touch!
                    </p>
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`${isRecording 
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                        : 'bg-purple hover:bg-purple/80'
                      } text-white`}
                      data-testid={isRecording ? "button-stop-recording" : "button-start-recording"}
                    >
                      {isRecording ? (
                        <>
                          <Square className="w-4 h-4 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Start Recording
                        </>
                      )}
                    </Button>
                    {isRecording && (
                      <p className="text-sm text-red-600 mt-2 animate-pulse">
                        🔴 Recording... Speak your reminder message now
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple/20 rounded-full flex items-center justify-center mr-3">
                          <Mic className="w-4 h-4 text-purple" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {settings.voiceRecordingName || "Voice Recording"}
                          </div>
                          <div className="text-xs text-gray-500">
                            Personal reminder message
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={playRecording}
                          disabled={isPlayingRecording}
                          data-testid="button-play-recording"
                        >
                          {isPlayingRecording ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={deleteRecording}
                          className="text-red-600 hover:text-red-700"
                          data-testid="button-delete-recording"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={isRecording ? stopRecording : startRecording}
                      className="w-full"
                      data-testid="button-re-record"
                    >
                      {isRecording ? (
                        <>
                          <Square className="w-4 h-4 mr-2" />
                          Stop Re-recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Record New Message
                        </>
                      )}
                    </Button>
                    {isRecording && (
                      <p className="text-sm text-red-600 text-center animate-pulse">
                        🔴 Recording... Speak your new reminder message
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ringtone Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-medium">
              <Volume2 className="w-4 h-4 text-coral" />
              Reminder Sound
            </Label>
            <Select 
              value={settings.customRingtone} 
              onValueChange={(value) => updateSettings({ customRingtone: value })}
            >
              <SelectTrigger data-testid="select-ringtone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ringtoneOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="mr-2">{option.emoji}</span>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Test Reminder */}
          <Button
            onClick={testRingtone}
            disabled={isTestingRingtone}
            className="w-full bg-sky hover:bg-sky/80"
            data-testid="button-test-reminder"
          >
            {isTestingRingtone ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Testing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Test Reminder
              </>
            )}
          </Button>

          {/* Settings Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">Current Settings Summary</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>• Daily at {settings.reminderTime || "selected time"}</div>
              <div>• Duration: {settings.reminderDuration} minutes</div>
              <div>• Active: {settings.timeRangeStart} - {settings.timeRangeEnd}</div>
              <div>• {settings.voiceReminderEnabled ? "With voice message" : "Sound only"}</div>
              <div>• Ringtone: {ringtoneOptions.find(r => r.value === settings.customRingtone)?.label}</div>
              <div>• Works even when app is closed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}