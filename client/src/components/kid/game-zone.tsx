import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Gamepad2,
  Lock,
  Star,
  Clock,
  Play,
  Coins,
  Zap,
  Hourglass,
  ShieldQuestion,
} from "lucide-react";
import GamePlayer from "./game-player";
import type { GameDefinition, GameCategory } from "@shared/games";

// Shape returned by GET /api/children/:childId/game-catalog
export interface ChildGame extends GameDefinition {
  status: "owned" | "pending" | "locked";
  subscriptionLocked: boolean;
  lastRejection: { message: string | null; reviewedAt: string | null } | null;
  unlockedLevels: number;
  highScore: number;
  timesPlayed: number;
}

interface GameCatalogResponse {
  games: ChildGame[];
  rewardPoints: number;
  childAge: number | null;
  subscriptionStatus: string;
  premiumUnlocked: boolean;
  premiumLockedCount: number;
}

// Games are already age-filtered server-side, so tabs now sort by how a child
// gets them (free vs. locked) plus the cross-cutting play styles.
type FilterTab = "all" | "free" | "premium" | "puzzle" | "wellness";

const TABS: { key: FilterTab; label: string; emoji: string }[] = [
  { key: "all", label: "All", emoji: "🎮" },
  { key: "free", label: "Free to Play", emoji: "✨" },
  { key: "premium", label: "Unlock More", emoji: "🔒" },
  { key: "puzzle", label: "Puzzles", emoji: "🧩" },
  { key: "wellness", label: "Wellness", emoji: "💚" },
];

export default function GameZone({ childId }: { childId: string }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [playing, setPlaying] = useState<{ game: ChildGame; level: number } | null>(null);

  const { data, isLoading } = useQuery<GameCatalogResponse>({
    queryKey: ["/api/children", childId, "game-catalog"],
    enabled: !!childId,
    // Points arrive from parent-side approvals, so the shop must poll or
    // "Need X more points" never updates
    staleTime: 15_000,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "game-catalog"] });
    queryClient.invalidateQueries({ queryKey: ["/api/children", childId] });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/child"] });
  };

  const purchaseMutation = useMutation({
    mutationFn: async (gameId: string) => {
      const res = await apiRequest("POST", `/api/children/${childId}/game-purchases`, { gameId });
      return res.json();
    },
    onSuccess: (_data, gameId) => {
      const game = data?.games.find((g) => g.id === gameId);
      toast({
        title: "Request sent to your parent! 📨",
        description: `Your points for "${game?.title ?? "the game"}" are saved while you wait. If your parent says no, you get them all back!`,
      });
      invalidate();
    },
    onError: (error: Error) => {
      toast({
        title: "Oops!",
        description: error.message.replace(/^\d+:\s*/, "") || "Could not request the game.",
        variant: "destructive",
      });
    },
  });

  const askGrownupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/children/${childId}/upgrade-request`, { module: "games" });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "We told your grown-up! ⭐",
        description: "Ask them to unlock Habit Hero Premium so you can play all the games!",
      });
    },
  });

  const unlockLevelMutation = useMutation({
    mutationFn: async ({ gameId, level }: { gameId: string; level: number }) => {
      const res = await apiRequest(
        "POST",
        `/api/children/${childId}/games/${gameId}/unlock-level`,
        { level },
      );
      return res.json();
    },
    onSuccess: (_data, { level }) => {
      toast({
        title: `Level ${level} unlocked! 🔓`,
        description: "Time to show what you can do!",
      });
      invalidate();
    },
    onError: (error: Error) => {
      toast({
        title: "Oops!",
        description: error.message.replace(/^\d+:\s*/, "") || "Could not unlock the level.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !data) {
    return (
      <Card className="fun-card">
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading the Game Zone...</p>
        </CardContent>
      </Card>
    );
  }

  const games = data.games.filter((g) => {
    if (activeTab === "all") return true;
    if (activeTab === "free") return g.tier === "free";
    if (activeTab === "premium") return g.subscriptionLocked;
    return g.category === activeTab; // puzzle | wellness
  });
  const ownedCount = data.games.filter((g) => g.status === "owned").length;
  const visibleTabs = TABS.filter((t) => {
    if (t.key === "all") return true;
    if (t.key === "free") return data.games.some((g) => g.tier === "free");
    if (t.key === "premium") return data.games.some((g) => g.subscriptionLocked);
    return data.games.some((g) => g.category === t.key);
  });

  return (
    <div className="space-y-6">
      {playing && (
        <GamePlayer
          childId={childId}
          game={playing.game}
          level={playing.level}
          onClose={() => setPlaying(null)}
        />
      )}

      {/* Header: points balance + collection size */}
      <Card className="fun-card border-4 border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-fredoka text-3xl text-gray-800">Game Zone</h2>
                <p className="text-gray-600 text-sm font-medium">
                  Earn XP from habits, then buy games — your parent approves every purchase!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-2xl px-5 py-2 text-center shadow border-2 border-yellow-300">
                <div className="text-2xl font-black text-orange-500 flex items-center gap-1">
                  <Zap className="w-5 h-5 fill-current" />
                  {data.rewardPoints}
                </div>
                <div className="text-xs text-gray-500 font-semibold">my XP</div>
              </div>
              <div className="bg-white rounded-2xl px-5 py-2 text-center shadow border-2 border-green-300">
                <div className="text-2xl font-black text-green-600">{ownedCount}</div>
                <div className="text-xs text-gray-500 font-semibold">my games</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium upsell banner — the conversion driver for locked games */}
      {!data.premiumUnlocked && data.premiumLockedCount > 0 && (
        <Card className="fun-card border-4 border-yellow-400 bg-gradient-to-r from-amber-50 to-yellow-100 overflow-hidden">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="text-4xl">🎁</div>
            <div className="flex-1 min-w-0">
              <div className="font-fredoka text-lg text-amber-900 leading-tight">
                {data.premiumLockedCount} more games waiting for you!
              </div>
              <div className="text-amber-800 text-sm font-medium">
                Unlock every game with Habit Hero Premium.
              </div>
            </div>
            <Button
              onClick={() => askGrownupMutation.mutate()}
              disabled={askGrownupMutation.isPending}
              className="rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold whitespace-nowrap shadow"
              data-testid="ask-grownup-banner"
            >
              <Star className="w-4 h-4 mr-1 fill-current" />
              Ask a grown-up
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === tab.key
                ? "bg-purple-500 border-purple-500 text-white"
                : "bg-white border-gray-200 text-gray-600 hover:border-purple-300"
            }`}
            data-testid={`game-tab-${tab.key}`}
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Game grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            rewardPoints={data.rewardPoints}
            onBuy={() => purchaseMutation.mutate(game.id)}
            buying={purchaseMutation.isPending && purchaseMutation.variables === game.id}
            onUnlockLevel={(level) => unlockLevelMutation.mutate({ gameId: game.id, level })}
            unlocking={unlockLevelMutation.isPending && unlockLevelMutation.variables?.gameId === game.id}
            onPlay={(level) => setPlaying({ game, level })}
            onAskGrownup={() => askGrownupMutation.mutate()}
            asking={askGrownupMutation.isPending}
          />
        ))}
      </div>

      {games.length === 0 && (
        <div className="text-center py-12 bg-white/50 rounded-lg border-2 border-dashed border-gray-300">
          <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold">No games in this category yet!</p>
        </div>
      )}
    </div>
  );
}

function GameCard({
  game,
  rewardPoints,
  onBuy,
  buying,
  onUnlockLevel,
  unlocking,
  onPlay,
  onAskGrownup,
  asking,
}: {
  game: ChildGame;
  rewardPoints: number;
  onBuy: () => void;
  buying: boolean;
  onUnlockLevel: (level: number) => void;
  unlocking: boolean;
  onPlay: (level: number) => void;
  onAskGrownup: () => void;
  asking: boolean;
}) {
  const canAfford = rewardPoints >= game.purchaseCost;
  const nextLevel = game.unlockedLevels < game.levels.length ? game.unlockedLevels + 1 : null;

  return (
    <Card
      className={`fun-card overflow-hidden border-t-8 transition-transform hover:scale-[1.02] ${game.subscriptionLocked ? "relative" : ""}`}
      style={{ borderTopColor: game.subscriptionLocked ? "#f59e0b" : game.themeColors.primary }}
      data-testid={`game-card-${game.id}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl ${game.subscriptionLocked ? "grayscale opacity-70" : ""}`}
            style={{ backgroundColor: game.themeColors.secondary }}
          >
            {game.icon}
          </div>
          <div className="flex flex-col items-end gap-1">
            {game.flagship && (
              <Badge className="font-bold bg-yellow-400 text-yellow-900 border-0">⭐ Star Game</Badge>
            )}
            {game.tier === "free" && !game.flagship && (
              <Badge className="font-bold bg-green-100 text-green-700 border-0">Free</Badge>
            )}
            {game.subscriptionLocked && (
              <Badge className="font-bold bg-amber-500 text-white border-0 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Premium
              </Badge>
            )}
            <Badge variant="outline" className="font-bold">
              Ages {game.ageGroup}
            </Badge>
          </div>
        </div>

        <h3 className="font-fredoka text-xl text-gray-800 mb-1">{game.title}</h3>
        <p className="text-gray-600 text-sm mb-3 min-h-[2.5rem]">{game.description}</p>

        {game.timeLimit && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
            <Clock className="w-3 h-3" />
            {game.timeLimit}s per round
          </div>
        )}

        {game.status === "owned" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 font-bold text-gray-700">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                Best: {game.highScore}
              </span>
              <span className="text-gray-500">Played {game.timesPlayed}x</span>
            </div>

            {/* Level selector — one chip per catalog-defined level */}
            <div className="flex flex-wrap gap-2">
              {game.levels.map((levelDef) => {
                const level = levelDef.level;
                const isUnlocked = level <= game.unlockedLevels;
                const isNext = level === nextLevel;
                return (
                  <button
                    key={level}
                    onClick={() => {
                      if (isUnlocked) onPlay(level);
                      else if (isNext) onUnlockLevel(level);
                    }}
                    disabled={(!isUnlocked && !isNext) || (isNext && unlocking)}
                    title={levelDef.name ?? `Level ${level}`}
                    className={`flex-1 min-w-[4rem] rounded-xl border-2 py-2 text-center transition-colors ${
                      isUnlocked
                        ? "border-green-400 bg-green-50 hover:bg-green-100 cursor-pointer"
                        : isNext
                          ? "border-yellow-400 bg-yellow-50 hover:bg-yellow-100 cursor-pointer"
                          : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                    }`}
                    data-testid={`game-${game.id}-level-${level}`}
                  >
                    <div className="text-xs font-bold text-gray-700">
                      {levelDef.name ?? `Lv ${level}`}
                    </div>
                    {isUnlocked ? (
                      <Play className="w-4 h-4 mx-auto text-green-600" />
                    ) : isNext ? (
                      <div className="text-[10px] font-bold text-yellow-700 flex items-center justify-center gap-0.5">
                        <Zap className="w-3 h-3 fill-current" />
                        {levelDef.unlockCost}
                      </div>
                    ) : (
                      <Lock className="w-4 h-4 mx-auto text-gray-400" />
                    )}
                  </button>
                );
              })}
            </div>

            <Button
              className="w-full super-button font-bold"
              onClick={() => onPlay(game.unlockedLevels)}
              data-testid={`game-play-${game.id}`}
            >
              <Play className="w-4 h-4 mr-2" />
              Play Level {game.unlockedLevels}
            </Button>
          </div>
        )}

        {game.status === "pending" && (
          <div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-3 text-center">
            <Hourglass className="w-6 h-6 text-orange-500 mx-auto mb-1 animate-pulse" />
            <div className="font-bold text-orange-700 text-sm">Waiting for your parent!</div>
            <div className="text-xs text-orange-600 mt-1">
              {game.purchaseCost} XP are saved for this game. If it's a no, you get them back.
            </div>
          </div>
        )}

        {game.subscriptionLocked && (
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3 text-center space-y-2">
            <div className="text-sm font-bold text-amber-800 flex items-center justify-center gap-1">
              <Lock className="w-4 h-4" /> Premium game
            </div>
            <p className="text-xs text-amber-700">Ask a grown-up to unlock this and lots more!</p>
            <Button
              onClick={onAskGrownup}
              disabled={asking}
              className="w-full rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold"
              data-testid={`game-ask-${game.id}`}
            >
              <Star className="w-4 h-4 mr-1 fill-current" />
              Ask a grown-up ⭐
            </Button>
          </div>
        )}

        {game.status === "locked" && !game.subscriptionLocked && (
          <div className="space-y-2">
            {game.lastRejection && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700">
                <span className="font-bold flex items-center gap-1">
                  <ShieldQuestion className="w-3 h-3" />
                  Your parent said not this time.
                </span>
                {game.lastRejection.message && <span>"{game.lastRejection.message}"</span>}
                <span> Your XP was returned — you can ask again!</span>
              </div>
            )}
            <Button
              className="w-full font-bold text-white"
              style={{ backgroundColor: canAfford ? game.themeColors.primary : undefined }}
              disabled={!canAfford || buying}
              variant={canAfford ? "default" : "secondary"}
              onClick={onBuy}
              data-testid={`game-buy-${game.id}`}
            >
              <Zap className="w-4 h-4 mr-2 fill-current" />
              {canAfford
                ? `Buy for ${game.purchaseCost} XP (parent approves)`
                : `Need ${game.purchaseCost - rewardPoints} more XP`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
