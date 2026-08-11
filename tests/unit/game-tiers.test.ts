import { describe, it, expect } from "vitest";
import {
  getGamesForAge, GAME_CATALOG, FLAGSHIP_GAME_ID,
  tierForGame, isSubscriptionLocked, ageGroupForAge,
} from "../../shared/games";
import { hasPremiumAccess } from "../../shared/premium";

describe("age filtering", () => {
  it("shows a 9-year-old only 9-12 games plus the flagship (never 3-5/6-8)", () => {
    const games = getGamesForAge(9);
    // every non-flagship game is in the child's own group
    for (const g of games) {
      if (!g.flagship) expect(g.ageGroup).toBe("9-12");
    }
    // the cross-age flagship is present
    expect(games.some((g) => g.id === FLAGSHIP_GAME_ID)).toBe(true);
    // and no younger-only game leaks in
    expect(games.some((g) => g.ageGroup === "3-5" && !g.flagship)).toBe(false);
    expect(games.some((g) => g.ageGroup === "6-8" && !g.flagship)).toBe(false);
  });

  it("shows a 4-year-old only 3-5 games plus the flagship", () => {
    const games = getGamesForAge(4);
    for (const g of games) if (!g.flagship) expect(g.ageGroup).toBe("3-5");
    expect(games.some((g) => g.id === FLAGSHIP_GAME_ID)).toBe(true);
  });

  it("lists the flagship first", () => {
    expect(getGamesForAge(11)[0].id).toBe(FLAGSHIP_GAME_ID);
  });

  it("maps ages to the right group", () => {
    expect(ageGroupForAge(3)).toBe("3-5");
    expect(ageGroupForAge(7)).toBe("6-8");
    expect(ageGroupForAge(12)).toBe("9-12");
  });
});

describe("tiers + subscription lock", () => {
  it("marks the flagship as free", () => {
    expect(tierForGame(FLAGSHIP_GAME_ID)).toBe("free");
  });

  it("every game has a tier assigned in the catalog", () => {
    for (const g of GAME_CATALOG) expect(g.tier === "free" || g.tier === "premium").toBe(true);
  });

  it("premium games are locked without access, free games never are", () => {
    const premium = GAME_CATALOG.find((g) => g.tier === "premium")!;
    const free = GAME_CATALOG.find((g) => g.tier === "free")!;
    expect(isSubscriptionLocked(premium, false)).toBe(true);
    expect(isSubscriptionLocked(premium, true)).toBe(false);
    expect(isSubscriptionLocked(free, false)).toBe(false);
  });

  it("active + trial grant premium access; cancelled(no end)/free/expired do not", () => {
    expect(hasPremiumAccess({ subscriptionStatus: "active" })).toBe(true);
    expect(hasPremiumAccess({ subscriptionStatus: "trial", createdAt: new Date() })).toBe(true);
    expect(hasPremiumAccess({ subscriptionStatus: "cancelled" })).toBe(false);
    expect(hasPremiumAccess({ subscriptionStatus: "free" })).toBe(false);
    expect(hasPremiumAccess(null)).toBe(false);
    // cancelled but still inside paid period keeps access
    expect(hasPremiumAccess({ subscriptionStatus: "cancelled", subscriptionEndDate: new Date(Date.now() + 5 * 864e5) })).toBe(true);
  });
});
