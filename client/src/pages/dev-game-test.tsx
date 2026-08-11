// DEV-ONLY harness: mounts a mini-game engine directly, with no auth or
// API dependencies, so gameplay (drag, tap, timers) can be exercised and
// debugged in isolation. Routed only when import.meta.env.DEV (see App.tsx).
import { useState } from "react";
import GameLauncher from "@/minigames/shared/GameLauncher";
import { getGameById } from "@shared/games";
import type { GameConfig } from "@/minigames/games/types/game";

export default function DevGameTest() {
  const [result, setResult] = useState<number | null>(null);
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("game") || "shape-match";
  const game = getGameById(gameId);

  if (!game) {
    return <div className="p-8">Unknown game id "{gameId}"</div>;
  }

  const levelDef = game.levels[0];
  const config: GameConfig = {
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
    initialData: { ...(game.initialData ?? {}), level: 1 },
  };

  if (result !== null) {
    return (
      <div className="p-8 text-center" data-testid="dev-game-result">
        <h1 className="text-2xl font-bold">Game complete</h1>
        <p className="text-lg">Score: {result}</p>
        <button className="mt-4 underline" onClick={() => setResult(null)}>
          Play again
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      <GameLauncher
        gameConfig={config}
        onComplete={(score) => setResult(score)}
        onExit={() => setResult(-1)}
      />
    </div>
  );
}
