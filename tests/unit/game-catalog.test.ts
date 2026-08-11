// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  GAME_CATALOG,
  getGameById,
  getGamesForAge,
  ageGroupForAge,
  getGameLevel,
  maxLevel,
  levelUnlockCost,
  maxSessionScore,
  defineGame,
  type GameSpec,
} from "@shared/games";

const baseSpec: Omit<GameSpec, "levels"> = {
  id: "test-game",
  engine: "quiz",
  title: "Test Game",
  description: "test",
  ageGroup: "6-8",
  difficulty: "easy",
  category: "elementary",
  icon: "🎮",
  themeColors: { primary: "#000", secondary: "#111", background: "#222", accent: "#333" },
  rewardPoints: 100,
  purchaseCost: 60,
  timeLimit: 100,
};

describe("game catalog", () => {
  it("contains 23 games with unique ids", () => {
    expect(GAME_CATALOG.length).toBe(23);
    const ids = new Set(GAME_CATALOG.map((g) => g.id));
    expect(ids.size).toBe(GAME_CATALOG.length);
  });

  it("every game has at least one level, starting free at level 1", () => {
    for (const game of GAME_CATALOG) {
      expect(game.levels.length).toBeGreaterThanOrEqual(1);
      expect(game.levels[0].level).toBe(1);
      expect(game.levels[0].unlockCost).toBe(0);
      game.levels.forEach((lvl, i) => expect(lvl.level).toBe(i + 1));
    }
  });

  it("getGameById finds catalog entries", () => {
    expect(getGameById("memory-flip")?.title).toBe("Memory Flip Quest");
    expect(getGameById("nope")).toBeUndefined();
  });
});

describe("age gating", () => {
  it("maps ages to groups", () => {
    expect(ageGroupForAge(3)).toBe("3-5");
    expect(ageGroupForAge(5)).toBe("3-5");
    expect(ageGroupForAge(6)).toBe("6-8");
    expect(ageGroupForAge(8)).toBe("6-8");
    expect(ageGroupForAge(9)).toBe("9-12");
    expect(ageGroupForAge(12)).toBe("9-12");
  });

  it("children see ONLY their own group plus the cross-age flagship", () => {
    // A 4-year-old: every non-flagship game is 3-5; no 6-8 or 9-12 leaks in.
    expect(getGamesForAge(4).every((g) => g.flagship || g.ageGroup === "3-5")).toBe(true);
    // A 7-year-old never sees 9-12 content.
    expect(getGamesForAge(7).some((g) => g.ageGroup === "9-12")).toBe(false);
    // An 11-year-old does NOT see the whole catalog anymore (age-appropriate).
    expect(getGamesForAge(11).length).toBeLessThan(GAME_CATALOG.length);
    // The flagship shows for every age.
    expect(getGamesForAge(4).some((g) => g.flagship)).toBe(true);
    expect(getGamesForAge(11).some((g) => g.flagship)).toBe(true);
  });

  it("shows all games when age is unset", () => {
    expect(getGamesForAge(null).length).toBe(GAME_CATALOG.length);
    expect(getGamesForAge(undefined).length).toBe(GAME_CATALOG.length);
  });
});

describe("standard level economy", () => {
  it("generates 3 levels matching the original progression", () => {
    const game = getGameById("math-runner")!; // base: 100 pts, 60 cost, 120s
    expect(game.levels).toHaveLength(3);
    expect(game.levels[0]).toMatchObject({ level: 1, rewardPoints: 100, timeLimit: 120, unlockCost: 0 });
    expect(game.levels[1]).toMatchObject({ level: 2, rewardPoints: 150, timeLimit: 102, unlockCost: 30 });
    expect(game.levels[2]).toMatchObject({ level: 3, rewardPoints: 200, timeLimit: 84, unlockCost: 45 });
  });

  it("difficulty escalates from the game's base and caps at hard", () => {
    const game = getGameById("math-runner")!; // base medium
    expect(game.levels.map((l) => l.difficulty)).toEqual(["medium", "hard", "hard"]);
  });

  it("levelUnlockCost is undefined for level 1 and reads levels otherwise", () => {
    const game = getGameById("math-runner")!;
    expect(levelUnlockCost(game, 1)).toBeUndefined();
    expect(levelUnlockCost(game, 2)).toBe(30);
    expect(levelUnlockCost(game, 99)).toBeUndefined();
  });

  it("maxSessionScore allows 1.5x the hardest level", () => {
    const game = getGameById("math-runner")!;
    expect(maxSessionScore(game)).toBe(300);
  });
});

describe("defineGame extensibility", () => {
  it("levels: N generates N standard levels with a smooth cost curve", () => {
    const game = defineGame({ ...baseSpec, levels: 5 });
    expect(maxLevel(game)).toBe(5);
    expect(game.levels.map((l) => l.unlockCost)).toEqual([0, 30, 45, 60, 75]);
  });

  it("array specs override individual levels and keep defaults elsewhere", () => {
    const game = defineGame({
      ...baseSpec,
      levels: [{}, { name: "Speed Round", timeLimit: 45 }, {}, { rewardPoints: 400, unlockCost: 120 }],
    });
    expect(maxLevel(game)).toBe(4);
    expect(getGameLevel(game, 2)).toMatchObject({ name: "Speed Round", timeLimit: 45, unlockCost: 30 });
    expect(getGameLevel(game, 3)).toMatchObject({ rewardPoints: 200, unlockCost: 45 });
    expect(getGameLevel(game, 4)).toMatchObject({ rewardPoints: 400, unlockCost: 120 });
  });

  it("untimed games stay untimed at every level", () => {
    const { timeLimit: _omit, ...spec } = baseSpec;
    const game = defineGame({ ...spec, id: "untimed" });
    expect(game.levels.every((l) => l.timeLimit === undefined)).toBe(true);
  });
});
