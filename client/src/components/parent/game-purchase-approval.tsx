import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Gamepad2, Check, X, Coins } from "lucide-react";
import { getGameById } from "@shared/games";
import type { GamePurchase } from "@shared/schema";

type PendingPurchase = GamePurchase & { childName: string };

export default function GamePurchaseApproval() {
  const { toast } = useToast();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectMessage, setRejectMessage] = useState("");

  const { data: pending = [], isLoading } = useQuery<PendingPurchase[]>({
    queryKey: ["/api/game-purchases/pending"],
    // Requests are made on the CHILD's device — the parent dashboard must
    // poll or new requests never show up (global default is staleTime:
    // Infinity, i.e. fetch-once). Same cadence as habit/reward approvals.
    staleTime: 15_000,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ purchaseId, approve, message }: { purchaseId: string; approve: boolean; message?: string }) => {
      const res = await apiRequest("POST", `/api/game-purchases/${purchaseId}/review`, {
        approve,
        message,
      });
      return res.json();
    },
    onSuccess: (_data, { approve }) => {
      toast({
        title: approve ? "Game approved! 🎮" : "Purchase declined",
        description: approve
          ? "The game is now unlocked in your child's Game Zone."
          : "The reward points were refunded to your child.",
      });
      setRejectingId(null);
      setRejectMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/game-purchases/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message.replace(/^\d+:\s*/, "") || "Failed to review the purchase.",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="fun-card p-4 sm:p-8 border-4 border-blue-500">
      <div className="flex items-center mb-4 sm:mb-6">
        <Gamepad2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mr-2 sm:mr-3" />
        <div>
          <h3 className="font-fredoka text-xl sm:text-2xl text-gray-800 hero-title">
            🎮 Game Purchase Requests
          </h3>
          <p className="text-gray-600 text-sm sm:text-base">
            Approve or decline mini-games your kids want to buy with their reward points
          </p>
        </div>
        {pending.length > 0 && (
          <span className="ml-auto bg-red-500 text-white text-sm font-bold rounded-full px-3 py-1">
            {pending.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading requests...</div>
      ) : pending.length === 0 ? (
        <div className="text-center py-8 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
          <Gamepad2 className="w-12 h-12 text-blue-300 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">No pending game requests right now.</p>
          <p className="text-gray-500 text-sm">
            When a child buys a game, it shows up here for your approval.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((purchase) => {
            const game = getGameById(purchase.gameId);
            return (
              <div
                key={purchase.id}
                className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200"
                data-testid={`game-purchase-request-${purchase.id}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: game?.themeColors.secondary ?? "#E3F2FD" }}
                    >
                      {game?.icon ?? "🎮"}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">
                        {purchase.childName} wants to buy{" "}
                        <span className="text-blue-700">{purchase.gameTitle}</span>
                      </div>
                      <div className="text-sm text-gray-600 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                        <span className="flex items-center gap-1 font-semibold text-orange-600">
                          <Coins className="w-3.5 h-3.5" />
                          {purchase.pointsCost} points
                        </span>
                        {game && <span>Ages {game.ageGroup}</span>}
                        {purchase.requestedAt && (
                          <span>
                            Requested {new Date(purchase.requestedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {game?.description && (
                        <div className="text-xs text-gray-500 mt-1">{game.description}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      onClick={() =>
                        reviewMutation.mutate({ purchaseId: purchase.id, approve: true })
                      }
                      disabled={reviewMutation.isPending && reviewMutation.variables?.purchaseId === purchase.id}
                      className="bg-mint hover:bg-mint/80 text-white font-bold rounded-full"
                      data-testid={`approve-game-purchase-${purchase.id}`}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      onClick={() =>
                        setRejectingId(rejectingId === purchase.id ? null : purchase.id)
                      }
                      disabled={reviewMutation.isPending && reviewMutation.variables?.purchaseId === purchase.id}
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive hover:text-white font-bold rounded-full"
                      data-testid={`reject-game-purchase-${purchase.id}`}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>

                {rejectingId === purchase.id && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-red-200 space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      Optional message for {purchase.childName}
                    </label>
                    <Textarea
                      placeholder="e.g. Let's finish this week's reading habit first!"
                      value={rejectMessage}
                      onChange={(e) => setRejectMessage(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          reviewMutation.mutate({
                            purchaseId: purchase.id,
                            approve: false,
                            message: rejectMessage.trim() || undefined,
                          })
                        }
                        disabled={reviewMutation.isPending && reviewMutation.variables?.purchaseId === purchase.id}
                        className="bg-destructive hover:bg-destructive/80 text-white font-bold"
                        data-testid={`confirm-reject-game-purchase-${purchase.id}`}
                      >
                        Decline & refund {purchase.pointsCost} points
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setRejectingId(null);
                          setRejectMessage("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
