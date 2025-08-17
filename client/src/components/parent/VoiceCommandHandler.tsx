import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

interface VoiceCommandHandlerProps {
  children: any[];
  voiceCommandsEnabled: boolean;
}

export default function VoiceCommandHandler({ children, voiceCommandsEnabled }: VoiceCommandHandlerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (!voiceCommandsEnabled) return;

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice Recognition Not Supported",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.lang = 'en-US';
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = false;

    recognitionInstance.onstart = () => {
      setIsListening(true);
      toast({
        title: "Voice Commands Active",
        description: "Listening for commands...",
      });
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    recognitionInstance.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      handleVoiceCommand(transcript);
    };

    recognitionInstance.onerror = (event: any) => {
      setIsListening(false);
      toast({
        title: "Voice Recognition Error",
        description: "Could not recognize speech. Please try again.",
        variant: "destructive",
      });
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [voiceCommandsEnabled, children]);

  const markHabitCompleteMutation = useMutation({
    mutationFn: async ({ habitId, childId }: { habitId: string; childId: string }) => {
      return await apiRequest("POST", `/api/children/${childId}/habits/${habitId}/complete`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      toast({
        title: "Habit Marked Complete! ✅",
        description: "Voice command executed successfully.",
      });
    },
  });

  const updateParentalControlsMutation = useMutation({
    mutationFn: async ({ childId, updates }: { childId: string; updates: any }) => {
      return await apiRequest("PATCH", `/api/children/${childId}/parental-controls`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      toast({
        title: "Parental Controls Updated! 🛡️",
        description: "Voice command executed successfully.",
      });
    },
  });

  const handleVoiceCommand = async (transcript: string) => {
    console.log("Voice command:", transcript);

    // Command: Mark habit complete
    if (transcript.includes("mark") && transcript.includes("complete")) {
      const child = findChildFromCommand(transcript);
      const habitName = extractHabitName(transcript);
      
      if (child && habitName) {
        // Find habit by name (simplified - in real app, you'd fetch habits)
        toast({
          title: "Voice Command Recognized",
          description: `Marking ${habitName} complete for ${child.name}`,
        });
        // markHabitCompleteMutation.mutate({ habitId: "habit-id", childId: child.id });
      }
    }

    // Command: Enable emergency mode
    else if (transcript.includes("emergency") && transcript.includes("enable")) {
      const child = findChildFromCommand(transcript);
      
      if (child) {
        updateParentalControlsMutation.mutate({
          childId: child.id,
          updates: { emergencyMode: true, blockAllApps: true }
        });
      }
    }

    // Command: Disable emergency mode
    else if (transcript.includes("emergency") && transcript.includes("disable")) {
      const child = findChildFromCommand(transcript);
      
      if (child) {
        updateParentalControlsMutation.mutate({
          childId: child.id,
          updates: { emergencyMode: false, blockAllApps: false }
        });
      }
    }

    // Command: Set screen time
    else if (transcript.includes("screen time")) {
      const child = findChildFromCommand(transcript);
      const minutes = extractNumber(transcript);
      
      if (child && minutes) {
        updateParentalControlsMutation.mutate({
          childId: child.id,
          updates: { dailyScreenTime: minutes }
        });
      }
    }

    // Command: Show progress
    else if (transcript.includes("show") && transcript.includes("progress")) {
      const child = findChildFromCommand(transcript);
      
      if (child) {
        toast({
          title: "Voice Command Recognized",
          description: `Opening progress report for ${child.name}`,
        });
        // Navigate to progress page or open modal
      }
    }

    else {
      toast({
        title: "Command Not Recognized",
        description: `Sorry, I didn't understand: "${transcript}"`,
        variant: "destructive",
      });
    }
  };

  const findChildFromCommand = (transcript: string) => {
    return children.find(child => 
      transcript.includes(child.name.toLowerCase()) ||
      transcript.includes(child.name.toLowerCase().split(' ')[0])
    );
  };

  const extractHabitName = (transcript: string) => {
    // Simple extraction - in real app, you'd use more sophisticated NLP
    const words = transcript.split(' ');
    const markIndex = words.findIndex(word => word.includes('mark'));
    const completeIndex = words.findIndex(word => word.includes('complete'));
    
    if (markIndex >= 0 && completeIndex >= 0) {
      const habitWords = words.slice(markIndex + 1, completeIndex);
      return habitWords.filter(word => !['for', 'the', 'a', 'an'].includes(word)).join(' ');
    }
    
    return null;
  };

  const extractNumber = (transcript: string) => {
    const match = transcript.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  };

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  if (!voiceCommandsEnabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={toggleListening}
        className={`w-14 h-14 rounded-full shadow-lg transition-all ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
            : 'bg-mint hover:bg-mint/80'
        }`}
      >
        {isListening ? (
          <MicOff className="w-6 h-6 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </Button>
      
      {isListening && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <div className="text-sm font-medium mb-2">Listening for commands...</div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>• "Mark [habit] complete for [child]"</div>
            <div>• "Enable emergency mode for [child]"</div>
            <div>• "Set screen time to [X] minutes"</div>
          </div>
        </div>
      )}
    </div>
  );
}