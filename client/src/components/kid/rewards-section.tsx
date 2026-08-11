import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Gift,
  IceCream,
  Cookie,
  Clock
} from "lucide-react";
import type { Reward } from "@shared/schema";

interface RewardsSectionProps {
  childId: string;
  userSubscriptionStatus?: string;
}

export default function RewardsSection({ childId, userSubscriptionStatus }: RewardsSectionProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: rewards } = useQuery({
    queryKey: ["/api/children", childId, "rewards"],
  });

  const { data: rewardClaims } = useQuery({
    queryKey: ["/api/children", childId, "reward-claims"],
    // Parent approvals must show up without a reload
    staleTime: 15_000,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });

  const rewardsArray = Array.isArray(rewards) ? rewards : [];
  const claimsArray = Array.isArray(rewardClaims) ? rewardClaims : [];
  
  const isPremium = userSubscriptionStatus === 'active';

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

  const markRewardAsUsedMutation = useMutation({
    mutationFn: async (claimId: string) => {
      await apiRequest("PUT", `/api/reward-claims/${claimId}/mark-used`, {});
    },
    onSuccess: () => {
      toast({
        title: "Great job! 🌟",
        description: "You've confirmed receiving your reward!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
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
    <Card className="p-6 fun-card">
      <h3 className="font-fredoka text-2xl text-gray-800 mb-6 flex items-center">
        <Gift className="text-coral mr-3" />
        🎁 Your Rewards
      </h3>

      {/* Rewards — every one of these is designed by the child's parent */}
      <div>
        <h4 className="font-nunito font-bold mb-3">My Rewards</h4>

        {rewardsArray.length === 0 && (
          <div className="text-center py-8 bg-white/50 rounded-lg border-2 border-dashed border-gray-300" data-testid="rewards-empty-state">
            <Gift className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="font-bold text-gray-600">No rewards yet!</p>
            <p className="text-sm text-gray-500">
              Ask your parent to set up rewards you can earn. 🌟
            </p>
          </div>
        )}

        <div className="space-y-2">
          {rewardsArray.filter(reward => {
            // Filter out rewards that have been used (don't show them anymore)
            const rewardClaim = claimsArray.find(claim => claim.rewardId === reward.id);
            return !rewardClaim || rewardClaim.status !== 'used';
          }).map((reward: Reward) => {
            const IconComponent = getRewardIcon(reward.type);
            const isAvailable = true; // TODO: Check if child meets requirements
            
            // Check if this reward has been claimed and its status
            const rewardClaim = claimsArray.find(claim => claim.rewardId === reward.id);
            const claimStatus = rewardClaim?.status || null;
            
            return (
              <div 
                key={reward.id}
                className={`p-3 rounded-lg flex items-center justify-between border ${
                  claimStatus === 'pending' ? 'bg-orange-100 border-orange-300' :
                  claimStatus === 'approved' ? 'bg-green-100 border-green-300' :
                  isAvailable ? 'bg-sunshine/20 border-sunshine' : 'bg-coral/20 border-coral'
                }`}
              >
                <div className="flex items-center">
                  <IconComponent className={`mr-3 ${
                    claimStatus === 'pending' ? 'text-orange-500' :
                    claimStatus === 'approved' ? 'text-green-500' :
                    isAvailable ? 'text-sunshine' : 'text-coral'
                  }`} />
                  <div>
                    <span className="font-semibold">{reward.name}</span>
                    {claimStatus && (
                      <div className="text-xs text-gray-600 mt-1">
                        {claimStatus === 'pending' && 'Waiting for parent approval...'}
                        {claimStatus === 'approved' && 'Approved! Ask your parent to give you this reward.'}
                      </div>
                    )}
                  </div>
                </div>
                
                {claimStatus === 'pending' ? (
                  <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">
                    Pending
                  </span>
                ) : claimStatus === 'approved' ? (
                  <Button
                    size="sm"
                    className="bg-mint text-white hover:bg-mint/80"
                    onClick={() => markRewardAsUsedMutation.mutate(rewardClaim?.id || '')}
                    disabled={markRewardAsUsedMutation.isPending}
                  >
                    ✓ Got It!
                  </Button>
                ) : isAvailable ? (
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
