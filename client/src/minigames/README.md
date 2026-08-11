# Mini-Game Arcade — Developer Guide

The arcade is split into two halves:

| Piece | Location | Owns |
|---|---|---|
| **Catalog** (data) | `shared/games/` | Which games exist, ages, prices, levels. Shared by client **and** server — the server validates every purchase/unlock against it, so prices and age gates can't be spoofed. |
| **Engines** (code) | `client/src/minigames/` | The playable React Native components, rendered on the web via `react-native-web`. |

```
shared/games/
├── types.ts          # GameDefinition, GameLevel, GameSpec, ...
├── levels.ts         # defineGame() + standard level progression
├── catalog/
│   ├── preschool.ts  # Ages 3-5 games
│   ├── elementary.ts # Ages 6-8 games
│   ├── preteen.ts    # Ages 9-12 games
│   ├── puzzles.ts    # Puzzle games (mixed ages)
│   ├── wellness.ts   # Wellness games
│   └── index.ts      # Assembles + validates the catalog at startup
└── index.ts          # Public API — always import from "@shared/games"

client/src/minigames/
├── games/
│   ├── engines/<Name>Engine/   # One folder per engine component
│   ├── registry/gameRegistry.ts# engine id → component map
│   └── types/game.ts           # GameProps contract engines receive
└── shared/                     # GameShell, Timer, ProgressBar, SoundManager, GameLauncher
```

---

## How to add a new game (reusing an existing engine)

**One file, one entry.** Open the catalog file for the game's category
(e.g. `shared/games/catalog/elementary.ts`) and add a `defineGame()` call:

```ts
defineGame({
  id: "planet-quiz",            // stable & unique — never change after shipping
  engine: "quiz",               // any engine from the registry
  title: "Planet Quiz",
  description: "Blast through space trivia!",
  ageGroup: "6-8",              // "3-5" | "6-8" | "9-12"
  difficulty: "medium",
  category: "elementary",
  icon: "🪐",
  rewardPoints: 100,            // score scale at level 1
  purchaseCost: 60,             // reward points to buy (parent approves)
  timeLimit: 90,                // optional, seconds
  themeColors: { primary: "#5E35B1", secondary: "#D1C4E9", background: "#EDE7F6", accent: "#7C4DFF" },
  initialData: { variant: "battle" },  // engine-specific config
}),
```

That's it. The game automatically gets:
- 3 standard levels (see below), purchase flow with parent approval,
  escrow/refund, age gating, high scores, and the Game Zone card UI.
- Server-side validation of its price and levels (the catalog is
  validated at startup — a bad entry fails the build, not a kid's session).

## How to add more levels to an existing game

Levels are data. The default is 3 standard levels:

| Level | Difficulty | Score scale | Time | Unlock cost |
|---|---|---|---|---|
| 1 | base | ×1.0 | ×1.00 | free with purchase |
| 2 | base +1 | ×1.5 | ×0.85 | 50% of purchase cost |
| 3 | base +2 (max hard) | ×2.0 | ×0.70 | 75% of purchase cost |
| n | hard | ×(1 + 0.5(n−1)) | ×max(0.55, 1−0.15(n−1)) | (25 + 25(n−1))% of purchase cost |

- **More standard levels:** add `levels: 5` to the `defineGame()` entry.
- **Hand-tuned levels:** pass an array; anything you set overrides the
  standard value for that level, anything you omit is generated:

```ts
defineGame({
  // ...same fields as before...
  levels: [
    {},                                          // level 1: standard
    { name: "Speed Round", timeLimit: 45 },      // level 2: custom timer
    {},                                          // level 3: standard
    { rewardPoints: 400, unlockCost: 120,        // level 4: fully custom
      initialData: { boardSize: 9 } },
  ],
}),
```

No client, server, or database changes are needed — `unlocked_levels` in
the `game_progress` table is a count, the UI renders one chip per level,
and the server reads unlock costs from the catalog.

## How to add a new category

1. Create `shared/games/catalog/<name>.ts` exporting a `GameDefinition[]`.
2. Spread it into `GAME_CATALOG` in `shared/games/catalog/index.ts`.
3. Add the category to `GameCategory` in `shared/games/types.ts` and a
   tab entry in `client/src/components/kid/game-zone.tsx` (`TABS`).

## How to add a brand-new engine

1. Create `client/src/minigames/games/engines/MyEngine/MyEngine.tsx`.
   It receives `GameProps` (`client/src/minigames/games/types/game.ts`):
   - `game: GameConfig` — per-level config (difficulty, timeLimit,
     rewardPoints, themeColors, `initialData` with a `level` field)
   - `onComplete(score)` — call once when the round ends
   - `onExit()` — call when the child backs out
   Use only core `react-native` primitives (View/Text/Animated/etc. with
   `useNativeDriver: false`) so it runs on the web, and wrap the UI in
   `shared/GameShell` for the standard header/timer. Play sounds through
   `shared/SoundManager` (`tap`, `success`, `fail`, `win`).
2. Register it in `games/registry/gameRegistry.ts`.
3. Add its id to `GameEngineType` in `shared/games/types.ts`.
4. Reference it from a catalog entry (`engine: "myengine"`).

## Rules that keep the economy safe

- The **server** prices everything from `@shared/games` — never trust
  client-sent costs or scores (session scores are clamped server-side).
- Every game **purchase** goes through parent approval; points are
  escrowed on request and auto-refunded on rejection.
- Level unlocks must be **sequential** and require an approved purchase.
- Never reuse or rename a shipped game `id` — DB purchase/progress rows
  reference it.
