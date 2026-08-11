// Public API of the mini-game module. Client and server import from
// "@shared/games" only — never from the internal files directly.

import type { AgeGroup, GameDefinition, GameLevel } from "./types";
import { GAME_CATALOG } from "./catalog";

export * from "./types";
export { defineGame, DEFAULT_LEVEL_COUNT } from "./levels";
export { GAME_CATALOG };
export {
  FLAGSHIP_GAME_ID, FREE_GAME_IDS, isFlagship, tierForGame,
  isSubscriptionLocked,
} from "./tiers";

export function getGameById(gameId: string): GameDefinition | undefined {
  return GAME_CATALOG.find((g) => g.id === gameId);
}

/** Maps a child's age in years to their primary age group. */
export function ageGroupForAge(age: number): AgeGroup {
  if (age <= 5) return "3-5";
  if (age <= 8) return "6-8";
  return "9-12";
}

/**
 * Games a child sees: ONLY their own age group, so the Game Zone stays
 * age-appropriate — plus the cross-age flagship game, which is shown to every
 * age group. The flagship is always listed first. When no age is set, all
 * games are shown (the parent should set the child's age).
 */
export function getGamesForAge(age: number | null | undefined): GameDefinition[] {
  const flagships = GAME_CATALOG.filter((g) => g.flagship);
  if (age === null || age === undefined) return GAME_CATALOG;
  const group = ageGroupForAge(age);
  const inGroup = GAME_CATALOG.filter((g) => g.ageGroup === group && !g.flagship);
  return [...flagships, ...inGroup];
}

/** The level definition, or undefined if the game doesn't have that level. */
export function getGameLevel(game: GameDefinition, level: number): GameLevel | undefined {
  return game.levels.find((l) => l.level === level);
}

/** Highest level a game offers. */
export function maxLevel(game: GameDefinition): number {
  return game.levels.length;
}

/** Cost to unlock a given level (undefined for level 1 or unknown levels). */
export function levelUnlockCost(game: GameDefinition, level: number): number | undefined {
  if (level < 2) return undefined;
  return getGameLevel(game, level)?.unlockCost;
}

/**
 * Upper bound for a plausible session score, used server-side to clamp
 * reported scores. Engines can slightly exceed a level's nominal score
 * scale, so a 1.5x margin is allowed on the hardest level.
 */
export function maxSessionScore(game: GameDefinition): number {
  const best = Math.max(...game.levels.map((l) => l.rewardPoints));
  return Math.round(best * 1.5);
}
