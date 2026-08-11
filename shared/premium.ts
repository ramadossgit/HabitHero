// ─────────────────────────────────────────────────────────────────────────────
//  Habit Hero — Premium / Freemium core (shared by server + web + native)
//
//  ONE source of truth for "does this family have premium access" and what the
//  premium tiers/benefits are, so every module (games, avatars, gear, …) gates
//  content the same way. Pure & dependency-free.
// ─────────────────────────────────────────────────────────────────────────────

/** The kid-facing modules that have free vs. premium content. */
export type PremiumModule = "games" | "avatars" | "gear";

export const PREMIUM_MODULE_LABELS: Record<PremiumModule, string> = {
  games: "Mini-Games",
  avatars: "Hero Avatars",
  gear: "Avatar Gear",
};

export const PREMIUM_MODULE_EMOJI: Record<PremiumModule, string> = {
  games: "🎮",
  avatars: "🦸",
  gear: "🎒",
};

/** What a family gets with Habit Hero Premium — shown in every upsell + the
 *  parent upgrade CTA so the value is always clear. */
export const PREMIUM_BENEFITS: string[] = [
  "All 20+ mini-games unlocked",
  "Every hero avatar + all gear & accessories",
  "New games, avatars & content added every month",
  "The complete, unlimited Habit Hero experience",
];

/** Minimal subscription-bearing fields (a User row, on server or client). */
export interface SubscriptionUserLike {
  subscriptionStatus?: string | null;
  trialEndsAt?: Date | string | null;
  subscriptionEndDate?: Date | string | null;
  createdAt?: Date | string | null;
}

const ms = (d?: Date | string | null): number | null =>
  d == null ? null : new Date(d).getTime();

const TRIAL_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * True when a family can use premium content. Mirrors the client's
 * getSubscriptionStatus().canAccessPremiumFeatures, but works anywhere:
 *   • active    → premium (until subscriptionEndDate, if set)
 *   • trial     → premium until trialEndsAt (or createdAt + 7 days)
 *   • cancelled → premium only while still inside the paid period
 *   • expired / free / unknown → no premium
 */
export function hasPremiumAccess(user: SubscriptionUserLike | null | undefined): boolean {
  if (!user) return false;
  const now = Date.now();
  const status = (user.subscriptionStatus || "").toLowerCase();
  const subEnd = ms(user.subscriptionEndDate);

  if (status === "active") return subEnd == null ? true : now < subEnd;
  if (status === "cancelled") return subEnd != null && now < subEnd;
  if (status === "trial" || status === "trialing") {
    let trialEnd = ms(user.trialEndsAt);
    if (trialEnd == null) {
      const created = ms(user.createdAt);
      trialEnd = created != null ? created + TRIAL_DAYS_MS : null;
    }
    return trialEnd == null ? true : now < trialEnd;
  }
  return false;
}

/** Generic gate: a premium item is locked when the family has no premium access. */
export function isPremiumLocked(tier: "free" | "premium" | undefined, premiumUnlocked: boolean): boolean {
  return tier === "premium" && !premiumUnlocked;
}
