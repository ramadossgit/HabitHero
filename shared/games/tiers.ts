// ─────────────────────────────────────────────────────────────────────────────
//  Game monetization tiers — the freemium funnel, defined in ONE place.
//
//  • Flagship: one universally-fun game shown to EVERY age group, free forever.
//    It is the hook that gets a child attached to the app.
//  • Free tasters: one free game per age band so every child always has
//    something to play without a subscription.
//  • Everything else: premium — unlocked only by an active family subscription.
//    These are what a child asks a parent to unlock ("Ask a grown-up ⭐").
//
//  Tiers are assigned by id here (not scattered across catalog files) so the
//  business model can be tuned without touching game definitions.
// ─────────────────────────────────────────────────────────────────────────────
import type { GameDefinition, GameTier } from "./types";

/** The cross-age hero game — free, shown to all ages. */
export const FLAGSHIP_GAME_ID = "memory-flip";

/** Free "taster" games (in addition to the flagship): one per age band. */
export const FREE_GAME_IDS: ReadonlySet<string> = new Set([
  "color-pop",     // ages 3-5
  "math-runner",   // ages 6-8
  "trivia-battle", // ages 9-12
]);

export function isFlagship(gameId: string): boolean {
  return gameId === FLAGSHIP_GAME_ID;
}

export function tierForGame(gameId: string): GameTier {
  return isFlagship(gameId) || FREE_GAME_IDS.has(gameId) ? "free" : "premium";
}

/** Annotate a game with its tier + flagship flag (used when building the catalog). */
export function applyGameTier(game: GameDefinition): GameDefinition {
  return { ...game, tier: tierForGame(game.id), flagship: isFlagship(game.id) };
}

/** True when a game is hidden behind the subscription for this family.
 *  `premiumUnlocked` is the family's resolved access (see hasPremiumAccess). */
export function isSubscriptionLocked(
  game: Pick<GameDefinition, "tier">,
  premiumUnlocked: boolean,
): boolean {
  return game.tier === "premium" && !premiumUnlocked;
}
