// Assembles the full game catalog from the per-category files and
// validates it at startup, so a bad entry fails the build/server boot
// instead of breaking a child's Game Zone at runtime.

import type { GameDefinition } from "../types";
import { applyGameTier } from "../tiers";
import { preschoolGames } from "./preschool";
import { elementaryGames } from "./elementary";
import { preteenGames } from "./preteen";
import { puzzleGames } from "./puzzles";
import { wellnessGames } from "./wellness";

// New category files must be spread in here. Every game is annotated with its
// monetization tier (free/premium) + flagship flag from tiers.ts.
export const GAME_CATALOG: GameDefinition[] = [
  ...preschoolGames,
  ...elementaryGames,
  ...preteenGames,
  ...puzzleGames,
  ...wellnessGames,
].map(applyGameTier);

function validateCatalog(catalog: GameDefinition[]): void {
  const seen = new Set<string>();
  for (const game of catalog) {
    const where = `Game catalog entry "${game.id}"`;
    if (seen.has(game.id)) {
      throw new Error(`${where}: duplicate game id`);
    }
    seen.add(game.id);

    if (game.levels.length === 0) {
      throw new Error(`${where}: must have at least one level`);
    }
    game.levels.forEach((lvl, i) => {
      if (lvl.level !== i + 1) {
        throw new Error(`${where}: levels must be sequential starting at 1 (found ${lvl.level} at position ${i})`);
      }
      if (i === 0 && lvl.unlockCost !== 0) {
        throw new Error(`${where}: level 1 must have unlockCost 0 (included with purchase)`);
      }
      if (lvl.unlockCost < 0 || lvl.rewardPoints <= 0) {
        throw new Error(`${where}: level ${lvl.level} has invalid costs/points`);
      }
    });

    if (game.purchaseCost <= 0) {
      throw new Error(`${where}: purchaseCost must be positive`);
    }
  }
}

validateCatalog(GAME_CATALOG);
