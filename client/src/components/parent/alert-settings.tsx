import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Clock, Volume2, Bell, Timer, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AlertSettings {
  reminderEnabled: boolean;
  reminderTime: string;
  voiceReminderEnabled: boolean;
  customRingtone: string;
  reminderDuration: number; // in minutes
  timeRangeStart: string;
  timeRangeEnd: string;
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
          />
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
    <AlertSettingsContent
      settings={settings}
      updateSettings={updateSettings}
      testRingtone={testRingtone}
      isTestingRingtone={isTestingRingtone}
      ringtoneOptions={ringtoneOptions}
      timeSlots={timeSlots}
    />
  );
}

function AlertSettingsContent({
  settings,
  updateSettings,
  testRingtone,
  isTestingRingtone,
  ringtoneOptions,
  timeSlots
}: {
  settings: AlertSettings;
  updateSettings: (newSettings: Partial<AlertSettings>) => void;
  testRingtone: () => void;
  isTestingRingtone: boolean;
  ringtoneOptions: Array<{ value: string; label: string; emoji: string }>;
  timeSlots: string[];
}) {
  return (
    <div className="space-y-6">
      {/* Main Reminder Toggle */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-mint/10 to-sky/10 rounded-lg border-2 border-coral/30">
        <div>
          <h3 className="font-fredoka text-lg text-gray-800 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-coral" />
            Daily Reminders
          </h3>
          <p className="text-sm text-gray-600">Get notified when it's time for habits</p>
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
            <Label className="flex items-center gap-2 text-base font-medium">
              <Timer className="w-4 h-4 text-coral" />
              Reminder Duration: {settings.reminderDuration} minutes
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
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 min</span>
                <span>15 min</span>
                <span>30 min</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              How long reminders will continue if not acknowledged
            </p>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeRangeStart">Active From</Label>
              <Input
                id="timeRangeStart"
                type="time"
                value={settings.timeRangeStart}
                onChange={(e) => updateSettings({ timeRangeStart: e.target.value })}
                data-testid="input-time-start"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeRangeEnd">Active Until</Label>
              <Input
                id="timeRangeEnd"
                type="time"
                value={settings.timeRangeEnd}
                onChange={(e) => updateSettings({ timeRangeEnd: e.target.value })}
                data-testid="input-time-end"
              />
            </div>
          </div>

          {/* Voice Reminders */}
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div>
              <div className="font-medium flex items-center">
                <Volume2 className="w-4 h-4 mr-2 text-yellow-600" />
                Voice Reminders
              </div>
              <div className="text-sm text-gray-600">Spoken reminder messages</div>
            </div>
            <Switch
              checked={settings.voiceReminderEnabled}
              onCheckedChange={(checked) => updateSettings({ voiceReminderEnabled: checked })}
              data-testid="toggle-voice-reminders"
            />
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