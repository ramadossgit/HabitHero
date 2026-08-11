// @vitest-environment node
//
// End-to-end API flow against a RUNNING Habit Hero server (npm run dev).
// Covers: parent auth, child management, habit completion + approval,
// the mini-game purchase/approval/refund economy, rewards, parental
// controls, and the subscription flow.
//
// Skips itself when the server isn't reachable so `npm test` stays green
// in environments without a database.
import { describe, it, expect, beforeAll } from "vitest";

const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";

class Session {
  cookie = "";
  async req(method: string, path: string, body?: unknown) {
    const res = await fetch(BASE + path, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(this.cookie ? { Cookie: this.cookie } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      redirect: "manual",
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) this.cookie = setCookie.split(";")[0];
    let json: any = null;
    const text = await res.text();
    try { json = JSON.parse(text); } catch { json = text; }
    return { status: res.status, body: json };
  }
}

async function serverUp(): Promise<boolean> {
  // Generous timeout + one retry: collection runs in parallel with other
  // test files, and a briefly saturated event loop must not skip the suite.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(BASE + "/api/health", { signal: AbortSignal.timeout(15000) });
      if (res.ok) return true;
    } catch {
      // retry once
    }
  }
  return false;
}

const up = await serverUp();

describe.skipIf(!up)("Habit Hero full API flow", () => {
  const parent = new Session();
  const child = new Session();
  const uniq = Date.now();
  const email = `parent${uniq}@e2e.local`;
  const username = `kid${uniq}`;

  let familyCode = "";
  let childId = "";
  let habitId = "";
  let completionId = "";
  let purchaseId = "";
  let rewardId = "";
  let claimId = "";

  beforeAll(async () => {
    const reg = await parent.req("POST", "/api/auth/register", {
      email, password: "Test1234!", firstName: "Pat", lastName: "Tester",
    });
    expect(reg.status).toBeLessThan(300);
    const me = await parent.req("GET", "/api/auth/user");
    familyCode = me.body.familyCode;
  });

  it("authenticates the parent", async () => {
    const r = await parent.req("GET", "/api/auth/user");
    expect(r.status).toBe(200);
    expect(r.body.email).toBe(email);
  });

  it("creates a child with an age", async () => {
    const r = await parent.req("POST", "/api/children", {
      name: "Zoe", avatarType: "robot", age: 7, level: 1, xp: 0, totalXp: 0,
      rewardPoints: 0, unlockedAvatars: [], unlockedGear: [],
    });
    expect(r.status).toBeLessThan(300);
    expect(r.body.age).toBe(7);
    childId = r.body.id;

    const cred = await parent.req("PATCH", `/api/children/${childId}`, { username, pin: "1234" });
    expect(cred.status).toBe(200);
  });

  it("creates a habit and lets the child complete it (pending approval)", async () => {
    let r = await parent.req("POST", `/api/children/${childId}/habits`, {
      name: "Brush Teeth", icon: "🦷", xpReward: 50, color: "mint", frequency: "daily",
    });
    expect(r.status).toBeLessThan(300);
    habitId = r.body.id;

    r = await child.req("POST", "/api/auth/child-login", { familyCode, username, pin: "1234" });
    expect(r.status).toBe(200);

    r = await child.req("POST", `/api/habits/${habitId}/complete`, {});
    expect(r.status).toBeLessThan(300);
    completionId = r.body.id;
    expect(r.body.status).toBe("pending");

    // No XP or points before parent approval
    const c = await parent.req("GET", `/api/children/${childId}`);
    expect(c.body.totalXp).toBe(0);
    expect(c.body.rewardPoints).toBe(0);
  });

  it("awards XP and points only after parent approval", async () => {
    let r = await parent.req("GET", `/api/children/${childId}/pending-habits`);
    expect(r.body.length).toBeGreaterThanOrEqual(1);

    r = await parent.req("POST", `/api/habit-completions/${completionId}/approve`, { message: "Nice!" });
    expect(r.status).toBe(200);

    const c = await parent.req("GET", `/api/children/${childId}`);
    expect(c.body.totalXp).toBe(50);
    expect(c.body.rewardPoints).toBeGreaterThan(0);
  });

  it("filters the game catalog by the child's age", async () => {
    const r = await child.req("GET", `/api/children/${childId}/game-catalog`);
    expect(r.status).toBe(200);
    // Age 7 sees ages 3-5 + 6-8, never 9-12
    expect(r.body.games.some((g: any) => g.ageGroup === "9-12")).toBe(false);
    expect(r.body.games.every((g: any) => g.status === "locked")).toBe(true);
  });

  it("escrows points on purchase and blocks duplicates + wrong ages", async () => {
    await parent.req("PATCH", `/api/children/${childId}/reward-points`, { pointsGained: 200 });
    const before = (await child.req("GET", `/api/children/${childId}/game-catalog`)).body.rewardPoints;

    let r = await child.req("POST", `/api/children/${childId}/game-purchases`, { gameId: "memory-flip" });
    expect(r.status).toBe(201);
    expect(r.body.status).toBe("pending");
    purchaseId = r.body.id;

    const after = (await child.req("GET", `/api/children/${childId}/game-catalog`)).body.rewardPoints;
    expect(after).toBe(before - 60);

    r = await child.req("POST", `/api/children/${childId}/game-purchases`, { gameId: "memory-flip" });
    expect(r.status).toBe(400); // duplicate

    r = await child.req("POST", `/api/children/${childId}/game-purchases`, { gameId: "sudoku" });
    expect(r.status).toBe(403); // 9-12 game, child is 7
  });

  it("refunds points when the parent rejects the purchase", async () => {
    const before = (await child.req("GET", `/api/children/${childId}/game-catalog`)).body.rewardPoints;

    let r = await parent.req("GET", "/api/game-purchases/pending");
    expect(r.body.some((p: any) => p.id === purchaseId)).toBe(true);

    r = await parent.req("POST", `/api/game-purchases/${purchaseId}/review`, { approve: false, message: "Not today" });
    expect(r.status).toBe(200);
    expect(r.body.status).toBe("rejected");

    const after = (await child.req("GET", `/api/children/${childId}/game-catalog`)).body.rewardPoints;
    expect(after).toBe(before + 60);
  });

  it("unlocks the game at level 1 when the parent approves", async () => {
    let r = await child.req("POST", `/api/children/${childId}/game-purchases`, { gameId: "memory-flip" });
    expect(r.status).toBe(201);

    r = await parent.req("POST", `/api/game-purchases/${r.body.id}/review`, { approve: true });
    expect(r.status).toBe(200);
    expect(r.body.status).toBe("approved");

    const cat = await child.req("GET", `/api/children/${childId}/game-catalog`);
    const game = cat.body.games.find((g: any) => g.id === "memory-flip");
    expect(game.status).toBe("owned");
    expect(game.unlockedLevels).toBe(1);
  });

  it("enforces sequential level unlocks and records sessions as XP", async () => {
    let r = await child.req("POST", `/api/children/${childId}/games/memory-flip/unlock-level`, { level: 3 });
    expect(r.status).toBe(400); // must unlock 2 first

    r = await child.req("POST", `/api/children/${childId}/games/memory-flip/unlock-level`, { level: 2 });
    expect(r.status).toBe(200);
    expect(r.body.unlockedLevels).toBe(2);

    const xpBefore = (await parent.req("GET", `/api/children/${childId}`)).body.totalXp;
    r = await child.req("POST", `/api/children/${childId}/games/memory-flip/sessions`, { level: 2, score: 140 });
    expect(r.status).toBe(200);
    expect(r.body.highScore).toBe(140);
    const xpAfter = (await parent.req("GET", `/api/children/${childId}`)).body.totalXp;
    expect(xpAfter).toBe(xpBefore + 140); // new personal best → full XP

    r = await child.req("POST", `/api/children/${childId}/games/sudoku/sessions`, { level: 1, score: 10 });
    expect(r.status).toBe(400); // not owned
  });

  it("prevents XP grinding: replays below the personal best pay only token XP", async () => {
    const xpBefore = (await parent.req("GET", `/api/children/${childId}`)).body.totalXp;

    const r = await child.req("POST", `/api/children/${childId}/games/memory-flip/sessions`, { level: 2, score: 100 });
    expect(r.status).toBe(200);
    expect(r.body.highScore).toBe(140); // best unchanged

    const xpAfter = (await parent.req("GET", `/api/children/${childId}`)).body.totalXp;
    expect(xpAfter).toBe(xpBefore + 10); // token XP only — habits stay the real progression
  });

  it("blocks game play entirely when the parent disables mini-games", async () => {
    let r = await parent.req("PUT", `/api/children/${childId}/parental-controls`, {
      enableMiniGames: false, enableHabits: true, enableGearShop: true, enableRewards: true,
    });
    expect(r.status).toBe(200);

    r = await child.req("POST", `/api/children/${childId}/games/memory-flip/sessions`, { level: 1, score: 50 });
    expect(r.status).toBe(403);
    r = await child.req("POST", `/api/children/${childId}/games/memory-flip/unlock-level`, { level: 3 });
    expect(r.status).toBe(403);
    r = await child.req("POST", `/api/children/${childId}/game-purchases`, { gameId: "color-pop" });
    expect(r.status).toBe(403);
  });

  it("supports the reward claim + approval flow", async () => {
    let r = await parent.req("POST", `/api/children/${childId}/rewards`, {
      name: "Ice Cream", type: "treat", cost: 1, costType: "habits", category: "daily",
    });
    rewardId = r.body.id;
    expect(rewardId).toBeTruthy();

    r = await child.req("POST", `/api/rewards/${rewardId}/claim`, {});
    expect(r.status).toBeLessThan(300);
    claimId = r.body.id;

    r = await parent.req("POST", `/api/reward-claims/${claimId}/approve`, {});
    expect(r.status).toBe(200);
  });

  it("lets the child read parental controls so the kid UI can enforce them", async () => {
    let r = await parent.req("PUT", `/api/children/${childId}/parental-controls`, {
      dailyScreenTime: 45, enableMiniGames: true, enableHabits: true, enableGearShop: true, enableRewards: true,
    });
    expect(r.status).toBe(200);

    r = await child.req("GET", `/api/children/${childId}/parental-controls`);
    expect(r.status).toBe(200);
    expect(r.body.dailyScreenTime).toBe(45);
  });

  it("manages premium auto-approval settings with validation", async () => {
    let r = await parent.req("GET", "/api/auto-approval-settings");
    expect(r.status).toBe(200);
    expect(r.body).toHaveProperty("enabled");
    expect(r.body).toHaveProperty("timeValue");
    expect(["hours", "days", "weeks"]).toContain(r.body.timeUnit);

    // Trial users count as premium for the trial period
    r = await parent.req("PUT", "/api/auto-approval-settings", {
      enabled: true, timeValue: 24, timeUnit: "hours", applyToAllChildren: true, childSpecificSettings: {},
    });
    expect(r.status).toBe(200);
    expect(r.body.enabled).toBe(true);

    r = await parent.req("PUT", "/api/auto-approval-settings", {
      enabled: true, timeValue: 0, timeUnit: "hours", applyToAllChildren: true, childSpecificSettings: {},
    });
    expect(r.status).toBe(400); // timeValue must be > 0

    r = await parent.req("PUT", "/api/auto-approval-settings", {
      enabled: true, timeValue: 5, timeUnit: "fortnights", applyToAllChildren: true, childSpecificSettings: {},
    });
    expect(r.status).toBe(400); // invalid unit

    r = await parent.req("GET", "/api/auto-approval-stats");
    expect(r.status).toBe(200);
    expect(typeof r.body.thisWeek).toBe("number");
    expect(typeof r.body.totalSaved).toBe("number");
    expect(typeof r.body.pending).toBe("number");
  });

  it("handles the subscription lifecycle (Stripe or dev mode)", async () => {
    let r = await parent.req("GET", "/api/subscription/plans");
    expect(r.status).toBe(200);

    r = await parent.req("POST", "/api/subscription/create", { planId: "monthly" });
    expect(r.status).toBe(200);
    if (r.body.devMode) {
      // No Stripe key: simulated activation
      expect(r.body.status).toBe("active");
    } else {
      // Real Stripe: a payable client secret must come back
      expect(r.body.clientSecret).toBeTruthy();
    }

    r = await parent.req("GET", "/api/subscription/status");
    expect(r.status).toBe(200);

    if ((await parent.req("GET", "/api/subscription/status")).body.status === "active") {
      r = await parent.req("POST", "/api/subscription/cancel", {});
      expect(r.status).toBe(200);
    }
  });
});

if (!up) {
  describe("Habit Hero full API flow", () => {
    it.skip(`skipped — no server at ${BASE} (start with: npm run dev)`, () => {});
  });
}
