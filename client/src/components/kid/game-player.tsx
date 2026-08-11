import { Component, useState, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Star, Zap, X } from "lucide-react";
import GameLauncher from "@/minigames/shared/GameLauncher";
import type { GameConfig } from "@/minigames/games/types/game";
import { getGameLevel, type GameDefinition } from "@shared/games";

interface GamePlayerProps {
  childId: string;
  game: GameDefinition;
  level: number;
  onClose: () => void;
}

// Each level's difficulty, timer, score scale and engine tweaks come
// from the catalog (shared/games), so games can define any number of
// levels without touching this component.
function toGameConfig(game: GameDefinition, level: number): GameConfig {
  const levelDef = getGameLevel(game, level) ?? game.levels[0];
  return {
    id: game.id,
    engine: game.engine,
    title: game.title,
    ageGroup: game.ageGroup,
    difficulty: levelDef.difficulty,
    category: game.category,
    icon: game.icon,
    themeColors: game.themeColors,
    rewardPoints: levelDef.rewardPoints,
    timeLimit: levelDef.timeLimit,
    initialData: {
      ...(game.initialData ?? {}),
      ...(levelDef.initialData ?? {}),
      level: levelDef.level,
    },
  };
}

// A crashing game engine must never take down the whole app for a kid —
// show a friendly recovery screen with a way back to the Game Zone.
class GameCrashBoundary extends Component<
  { onClose: () => void; children: ReactNode },
  { crashed: boolean }
> {
  state = { crashed: false };

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Mini-game crashed:", error);
  }

  render() {
    if (this.state.crashed) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="text-6xl">😵‍💫</div>
          <h2 className="font-fredoka text-2xl text-gray-800">Oops, the game hiccuped!</h2>
          <p className="text-gray-600">Don't worry — your points are safe.</p>
          <Button className="super-button font-bold" onClick={this.props.onClose} data-testid="game-crash-back">
            Back to Game Zone 🏠
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function GamePlayer({ childId, game, level, onClose }: GamePlayerProps) {
  const [result, setResult] = useState<{ score: number } | null>(null);
  const gameConfig = toGameConfig(game, level);

  const sessionMutation = useMutation({
    mutationFn: async (score: number) => {
      const res = await apiRequest(
        "POST",
        `/api/children/${childId}/games/${game.id}/sessions`,
        { level, score },
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId, "game-catalog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children", childId] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/child"] });
    },
  });

  const handleComplete = (score: number) => {
    setResult({ score });
    sessionMutation.mutate(score);
  };

  if (result) {
    const stars =
      result.score >= gameConfig.rewardPoints
        ? 3
        : result.score >= gameConfig.rewardPoints * 0.6
          ? 2
          : 1;
    const messages = ["Good Try! 💪", "Nice Work! 🌟", "Amazing! 🎉"];

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/90 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-t-8"
          style={{ borderTopColor: game.themeColors.primary }}
        >
          <div className="text-6xl mb-2">{game.icon}</div>
          <h2 className="font-fredoka text-3xl text-gray-800 mb-4">{messages[stars - 1]}</h2>
          <div className="flex justify-center gap-2 mb-5">
            {[1, 2, 3].map((i) => (
              <Star
                key={i}
                className={`w-10 h-10 ${i <= stars ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
              />
            ))}
          </div>
          <div
            className="rounded-2xl px-8 py-4 inline-block mb-3"
            style={{ backgroundColor: game.themeColors.background }}
          >
            <div className="text-sm text-gray-500 font-semibold">Score</div>
            <div className="text-5xl font-black" style={{ color: game.themeColors.primary }}>
              {result.score}
            </div>
          </div>
          <div className="flex items-center justify-center gap-1 text-green-600 font-bold mb-6">
            <Zap className="w-4 h-4" />+{result.score} Hero XP earned!
          </div>
          <Button
            className="w-full text-white font-bold text-lg py-6 rounded-full"
            style={{ backgroundColor: game.themeColors.primary }}
            onClick={onClose}
            data-testid="game-completion-back"
          >
            Back to Game Zone 🏠
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div
        className="flex items-center justify-between px-4 py-2 text-white"
        style={{ backgroundColor: game.themeColors.primary }}
      >
        <div className="font-fredoka text-lg flex items-center gap-2">
          <span>{game.icon}</span>
          {game.title}
          <span className="text-xs bg-white/25 rounded-full px-2 py-0.5 font-bold">
            Level {level}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/20"
          aria-label="Exit game"
          data-testid="game-exit"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 min-h-0" style={{ display: "flex" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <GameCrashBoundary onClose={onClose}>
            <GameLauncher gameConfig={gameConfig} onComplete={handleComplete} onExit={onClose} />
          </GameCrashBoundary>
        </div>
      </div>
    </div>
  );
}
