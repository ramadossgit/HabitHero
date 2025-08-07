import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Gift, 
  Play, 
  Lock, 
  Calculator, 
  Puzzle, 
  Brain,
  IceCream,
  Cookie,
  Clock
} from "lucide-react";
import type { Reward } from "@shared/schema";

interface RewardsSectionProps {
  childId: string;
}

export default function RewardsSection({ childId }: RewardsSectionProps) {
  const { toast } = useToast();

  const defaultMiniGames = [
    {
      id: "word-puzzle",
      name: "Word Puzzle Adventure",
      description: "Solve puzzles and learn new words!",
      icon: "puzzle",
      unlockRequirement: 2,
      isActive: true,
    },
    {
      id: "math-hero",
      name: "Math Hero Challenge",
      description: "Practice math skills with fun challenges!",
      icon: "calculator",
      unlockRequirement: 2,
      isActive: true,
    },
    {
      id: "memory-master",
      name: "Memory Master",
      description: "Test your memory with colorful patterns!",
      icon: "brain",
      unlockRequirement: 3,
      isActive: true,
    },
  ];

  const { data: rewards } = useQuery({
    queryKey: ["/api/children", childId, "rewards"],
  });

  const { data: miniGames } = useQuery({
    queryKey: ["/api/mini-games"],
  });

  const rewardsArray = Array.isArray(rewards) ? rewards : [];
  const miniGamesArray = Array.isArray(miniGames) ? miniGames : defaultMiniGames;

  const claimRewardMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      await apiRequest("POST", `/api/rewards/${rewardId}/claim`, { childId });
    },
    onSuccess: () => {
      toast({
        title: "Reward Claimed! 🎁",
        description: "Your reward is pending parent approval!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId] });
    },
    onError: (error) => {
      toast({
        title: "Claim failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getRewardIcon = (type: string) => {
    const icons = {
      screen_time: Clock,
      treat: Cookie,
      outing: IceCream,
      privilege: Gift,
    };
    return icons[type as keyof typeof icons] || Gift;
  };

  return (
    <Card className="p-6 shadow-lg">
      <h3 className="font-fredoka text-2xl text-gray-800 mb-6 flex items-center">
        <Gift className="text-turquoise mr-3" />
        Your Rewards
      </h3>

      {/* Available Mini-Games */}
      <div className="mb-6">
        <h4 className="font-nunito font-bold mb-3">Play Mini-Games</h4>
        <div className="space-y-3">
          {miniGamesArray.map((game, index) => {
            const isUnlocked = index < 2; // First 2 games unlocked
            const IconComponent = game.icon === "puzzle" ? Puzzle : game.icon === "calculator" ? Calculator : Brain;
            const gradientColors = [
              "from-mint to-turquoise",
              "from-sky to-blue-500",
              "from-purple-400 to-purple-600"
            ];

            if (isUnlocked) {
              return (
                <Button 
                  key={game.id}
                  className={`w-full p-4 bg-gradient-to-r ${gradientColors[index]} text-white rounded-xl hover:opacity-80 transition-all transform hover:scale-105`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <IconComponent className="w-6 h-6 mr-3" />
                      <span className="font-bold">{game.name}</span>
                    </div>
                    <Play className="w-5 h-5" />
                  </div>
                </Button>
              );
            } else {
              return (
                <div key={game.id} className="w-full p-4 bg-gray-100 text-gray-400 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Lock className="w-6 h-6 mr-3" />
                      <span className="font-bold">{game.name} (Complete 3 more habits to unlock)</span>
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* Real-World Rewards */}
      <div>
        <h4 className="font-nunito font-bold mb-3">Real-World Rewards</h4>
        <div className="space-y-2">
          {rewardsArray.map((reward: Reward) => {
            const IconComponent = getRewardIcon(reward.type);
            const isAvailable = true; // TODO: Check if child meets requirements
            
            return (
              <div 
                key={reward.id}
                className={`p-3 rounded-lg flex items-center justify-between border ${
                  isAvailable 
                    ? 'bg-sunshine/20 border-sunshine' 
                    : 'bg-coral/20 border-coral'
                }`}
              >
                <div className="flex items-center">
                  <IconComponent className={`mr-3 ${isAvailable ? 'text-sunshine' : 'text-coral'}`} />
                  <span className="font-semibold">{reward.name}</span>
                </div>
                {isAvailable ? (
                  <Button
                    size="sm"
                    className="bg-sunshine text-gray-800 hover:bg-sunshine/80"
                    onClick={() => claimRewardMutation.mutate(reward.id)}
                    disabled={claimRewardMutation.isPending}
                  >
                    Claim
                  </Button>
                ) : (
                  <span className="text-xs bg-coral text-white px-2 py-1 rounded-full">
                    {reward.cost} more habits needed
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
