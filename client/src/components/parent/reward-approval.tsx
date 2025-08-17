import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Gift, Check, X, Clock, Coins, Award } from "lucide-react";
import type { RewardTransaction } from "@shared/schema";

interface RewardApprovalProps {
  childId: string;
}

export default function RewardApproval({ childId }: RewardApprovalProps) {
  const { toast } = useToast();

  const { data: pendingRewards, isLoading } = useQuery({
    queryKey: ["/api/children", childId, "pending-rewards"],
  });

  const { data: rewardTransactions } = useQuery({
    queryKey: ["/api/children", childId, "reward-transactions"],
  });

  const approveRewardMutation = useMutation({
    mutationFn: async ({ transactionId, approvedBy }: { transactionId: string; approvedBy: string }) => {
      await apiRequest("POST", `/api/reward-transactions/${transactionId}/approve`, { approvedBy });
    },
    onSuccess: () => {
      toast({
        title: "Reward Approved! 🎉",
        description: "Your child can now use their reward points!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "pending-rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "reward-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId] });
    },
    onError: (error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createBonusRewardMutation = useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description: string }) => {
      await apiRequest("POST", `/api/children/${childId}/reward-transactions`, {
        type: 'bonus_earned',
        amount,
        source: 'parent_bonus',
        description,
        requiresApproval: false,
        isApproved: true,
      });
    },
    onSuccess: () => {
      toast({
        title: "Bonus Added! ✨",
        description: "Your child received bonus reward points!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "reward-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId] });
    },
    onError: (error) => {
      toast({
        title: "Bonus Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pendingRewardsArray = Array.isArray(pendingRewards) ? pendingRewards : [];
  const transactionsArray = Array.isArray(rewardTransactions) ? rewardTransactions.slice(0, 5) : [];

  const handleApprove = (transactionId: string) => {
    // In a real app, we'd get the current user ID from context/session
    approveRewardMutation.mutate({ transactionId, approvedBy: "parent" });
  };

  const handleGiveBonus = (amount: number, description: string) => {
    createBonusRewardMutation.mutate({ amount, description });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Gift className="w-6 h-6 text-purple-500" />
          <h3 className="font-fredoka text-xl text-gray-800">Reward Approval</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Gift className="w-6 h-6 text-purple-500" />
          <h3 className="font-fredoka text-xl text-gray-800">Reward Management</h3>
        </div>
        {pendingRewardsArray.length > 0 && (
          <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full">
            {pendingRewardsArray.length} pending
          </span>
        )}
      </div>

      {/* Pending Approvals */}
      {pendingRewardsArray.length > 0 && (
        <div className="mb-6">
          <h4 className="font-nunito font-bold text-gray-700 mb-3 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-orange-500" />
            Pending Approvals
          </h4>
          <div className="space-y-3">
            {pendingRewardsArray.map((transaction: RewardTransaction) => (
              <div
                key={transaction.id}
                className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Coins className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-nunito font-semibold text-gray-800">
                      +{transaction.amount} reward points
                    </p>
                    <p className="text-xs text-gray-600">{transaction.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.createdAt!).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleApprove(transaction.id)}
                  disabled={approveRewardMutation.isPending}
                  className="bg-green-500 hover:bg-green-600 text-white"
                  size="sm"
                  data-testid={`button-approve-${transaction.id}`}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Bonus Actions */}
      <div className="mb-6">
        <h4 className="font-nunito font-bold text-gray-700 mb-3 flex items-center">
          <Award className="w-4 h-4 mr-2 text-purple-500" />
          Give Bonus Points
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <Button
            onClick={() => handleGiveBonus(10, "Good behavior bonus")}
            disabled={createBonusRewardMutation.isPending}
            variant="outline"
            className="h-16 flex flex-col border-green-200 hover:border-green-400 hover:bg-green-50"
            data-testid="button-bonus-good-behavior"
          >
            <span className="font-bold text-green-600">+10</span>
            <span className="text-xs">Good Behavior</span>
          </Button>
          <Button
            onClick={() => handleGiveBonus(25, "Extra effort bonus")}
            disabled={createBonusRewardMutation.isPending}
            variant="outline"
            className="h-16 flex flex-col border-blue-200 hover:border-blue-400 hover:bg-blue-50"
            data-testid="button-bonus-extra-effort"
          >
            <span className="font-bold text-blue-600">+25</span>
            <span className="text-xs">Extra Effort</span>
          </Button>
          <Button
            onClick={() => handleGiveBonus(50, "Outstanding achievement")}
            disabled={createBonusRewardMutation.isPending}
            variant="outline"
            className="h-16 flex flex-col border-purple-200 hover:border-purple-400 hover:bg-purple-50"
            data-testid="button-bonus-outstanding"
          >
            <span className="font-bold text-purple-600">+50</span>
            <span className="text-xs">Outstanding!</span>
          </Button>
        </div>
      </div>

      {/* Recent Transactions */}
      {transactionsArray.length > 0 && (
        <div>
          <h4 className="font-nunito font-bold text-gray-700 mb-3">Recent Activity</h4>
          <div className="space-y-2">
            {transactionsArray.map((transaction: RewardTransaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <Coins className={`w-3 h-3 ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount} points
                    </p>
                    <p className="text-xs text-gray-500">{transaction.description}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(transaction.createdAt!).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingRewardsArray.length === 0 && transactionsArray.length === 0 && (
        <div className="text-center py-8">
          <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No reward activity yet</p>
          <p className="text-sm text-gray-400">Your child's earned rewards will appear here for approval</p>
        </div>
      )}
    </Card>
  );
}