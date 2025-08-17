import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Star, Gift, Clock, Sparkles, Calendar, CheckCircle2 } from "lucide-react";
import type { WeekendChallenge } from "@shared/schema";

interface WeekendChallengesSectionProps {
  childId: string;
}

export default function WeekendChallengesSection({ childId }: WeekendChallengesSectionProps) {
  const { toast } = useToast();

  const { data: challenges = [], isLoading } = useQuery<WeekendChallenge[]>({
    queryKey: ["/api/weekend-challenges", childId],
  });

  const acceptChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      return await apiRequest("POST", `/api/weekend-challenges/${challengeId}/accept`, {
        childId,
      });
    },
    onSuccess: () => {
      toast({
        title: "Challenge Accepted! 🎯",
        description: "You've got this! Complete it for bonus rewards!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/weekend-challenges", childId] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to accept challenge",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const completeChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      return await apiRequest("POST", `/api/weekend-challenges/${challengeId}/complete`, {
        childId,
      });
    },
    onSuccess: () => {
      toast({
        title: "Challenge Completed! 🎉",
        description: "Amazing work! You've earned bonus points!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/weekend-challenges", childId] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/child"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to complete challenge",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} days left`;
    if (hours > 0) return `${hours} hours left`;
    return "Less than 1 hour left";
  };

  if (isLoading) {
    return (
      <Card className="mission-card bg-gradient-to-br from-sunshine to-orange-300 p-6 shadow-lg border-2 border-yellow-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent mx-auto mb-2"></div>
          <p className="text-white font-bold">Loading weekend challenges...</p>
        </div>
      </Card>
    );
  }

  const activeChallenge = challenges.find(c => !c.isCompleted && c.isAccepted);
  const availableChallenges = challenges.filter(c => !c.isCompleted && !c.isAccepted);
  const completedChallenges = challenges.filter(c => c.isCompleted);

  return (
    <div className="space-y-4">
      {/* Active Challenge */}
      {activeChallenge && (
        <Card className="mission-card bg-gradient-to-br from-blue-400 to-blue-600 p-6 shadow-lg border-2 border-blue-400">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/30 rounded-full p-3">
              <Star className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div className="text-right">
              <Badge className="bg-white text-blue-600 font-bold">
                ACTIVE +{activeChallenge.pointsReward} Points
              </Badge>
            </div>
          </div>
          
          <h3 className="font-nunito font-extrabold text-lg mb-2 text-white">
            {activeChallenge.name}
          </h3>
          <p className="text-white/90 mb-4">{activeChallenge.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-white/80">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{getTimeRemaining(new Date(activeChallenge.endDate))}</span>
            </div>
            <Button 
              className="bg-white text-blue-600 px-4 py-2 rounded-full font-bold hover:bg-white/90 transition-colors"
              onClick={() => completeChallengeMutation.mutate(activeChallenge.id)}
              disabled={completeChallengeMutation.isPending}
            >
              {completeChallengeMutation.isPending ? "Completing..." : "Complete Challenge!"}
            </Button>
          </div>
        </Card>
      )}

      {/* Available Challenges */}
      {availableChallenges.map((challenge) => (
        <Card key={challenge.id} className="mission-card bg-gradient-to-br from-sunshine to-orange-300 p-6 shadow-lg border-2 border-yellow-400">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/30 rounded-full p-3">
              <Gift className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div className="text-right">
              <Badge className="bg-white text-yellow-600 font-bold">
                BONUS +{challenge.pointsReward} Points
              </Badge>
            </div>
          </div>
          
          <h3 className="font-nunito font-extrabold text-lg mb-2 text-black">
            {challenge.name}
          </h3>
          <p className="text-black/90 mb-4">{challenge.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-black/70">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{getTimeRemaining(new Date(challenge.endDate))}</span>
            </div>
            <Button 
              className="bg-white text-black px-4 py-2 rounded-full font-bold hover:bg-white/90 transition-colors"
              onClick={() => acceptChallengeMutation.mutate(challenge.id)}
              disabled={acceptChallengeMutation.isPending}
            >
              {acceptChallengeMutation.isPending ? "Accepting..." : "Accept Challenge!"}
            </Button>
          </div>
        </Card>
      ))}

      {/* Completed Challenges (show latest 2) */}
      {completedChallenges.slice(0, 2).map((challenge) => (
        <Card key={challenge.id} className="mission-card bg-gradient-to-br from-green-400 to-green-600 p-4 shadow-lg border-2 border-green-400 opacity-80">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/30 rounded-full p-2">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-nunito font-bold text-white">{challenge.name}</h4>
                <p className="text-white/80 text-sm">Completed</p>
              </div>
            </div>
            <Badge className="bg-white text-green-600 font-bold">
              +{challenge.pointsReward}
            </Badge>
          </div>
        </Card>
      ))}

      {/* No Challenges Available */}
      {challenges.length === 0 && (
        <Card className="mission-card bg-gradient-to-br from-gray-400 to-gray-600 p-6 shadow-lg border-2 border-gray-400">
          <div className="text-center">
            <div className="bg-white/30 rounded-full p-3 mx-auto mb-4 w-fit">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-nunito font-extrabold text-lg mb-2 text-white">
              No Weekend Challenges
            </h3>
            <p className="text-white/90">Check back later for exciting bonus challenges!</p>
          </div>
        </Card>
      )}
    </div>
  );
}