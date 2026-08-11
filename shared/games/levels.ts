// Standard level progression and the defineGame() helper.
//
// The default progression reproduces the original 3-level economy:
//   level 1: base difficulty/time/score, included with purchase
//   level 2: +50% score, 85% time, unlock = 50% of purchase cost
//   level 3: +100% score, 70% time, unlock = 75% of purchase cost
// and extends smoothly for games that want more levels
// (level 4: +150% score, unlock = 100% of purchase cost, and so on).

import type { GameDefinition, GameDifficulty, GameLevel, GameSpec } from "./types";

const DIFFICULTY_LADDER: GameDifficulty[] = ["easy", "medium", "hard"];
export const DEFAULT_LEVEL_COUNT = 3;

function standardDifficulty(base: GameDifficulty, level: number): GameDifficulty {
  const idx = Math.min(DIFFICULTY_LADDER.length - 1, DIFFICULTY_LADDER.indexOf(base) + (level - 1));
  return DIFFICULTY_LADDER[idx];
}

function standardScoreFactor(level: number): number {
  return 1 + 0.5 * (level - 1);
}

function standardTimeFactor(level: number): number {
  return Math.max(0.55, 1 - 0.15 * (level - 1));
}

function standardUnlockCost(purchaseCost: number, level: number): number {
  if (level <= 1) return 0;
  return Math.round(purchaseCost * (0.25 + 0.25 * (level - 1)));
}

/** The standard level `n` for a game, before any per-level overrides. */
function standardLevel(spec: Omit<GameSpec, "levels">, level: number): GameLevel {
  return {
    level,
    difficulty: standardDifficulty(spec.difficulty, level),
    rewardPoints: Math.round(spec.rewardPoints * standardScoreFactor(level)),
    timeLimit: spec.timeLimit
      ? Math.max(15, Math.round(spec.timeLimit * standardTimeFactor(level)))
      : undefined,
    unlockCost: standardUnlockCost(spec.purchaseCost, level),
  };
}

/**
 * Build a full GameDefinition from an author-friendly spec.
 *
 * Adding a new game is one defineGame() call in a catalog file.
 * Adding levels to an existing game is `levels: 4` (or 5, ...), or an
 * array to hand-tune individual levels:
 *
 *   defineGame({
 *     ...,
 *     levels: [
 *       {},                                        // level 1: standard
 *       { name: "Speed Round", timeLimit: 45 },    // level 2: custom timer
 *       {},                                        // level 3: standard
 *       { rewardPoints: 400, unlockCost: 120 },    // level 4: custom
 *     ],
 *   })
 */
export function defineGame(spec: GameSpec): GameDefinition {
  const { levels: levelInput, ...base } = spec;

  let levels: GameLevel[];
  if (Array.isArray(levelInput)) {
    levels = levelInput.map((overrides, i) => ({
      ...standardLevel(base, i + 1),
      ...overrides,
      level: i + 1,
    }));
  } else {
    const count = levelInput ?? DEFAULT_LEVEL_COUNT;
    levels = Array.from({ length: count }, (_, i) => standardLevel(base, i + 1));
  }

  return { ...base, levels };
}
