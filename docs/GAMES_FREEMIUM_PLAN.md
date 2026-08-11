# Habit Hero — Games Freemium & Subscription Conversion Plan

A production plan for turning the Game Zone into a kid-driven subscription funnel:
kids fall in love with a free flagship game, discover locked premium games in
their age range, and **ask their parent to unlock them** — the classic
"pester-power → parent converts" loop, done safely and transparently.

## 1. Product model (shipped)

**One currency, three tiers of access:**

| Tier | What it is | Gate |
|------|-----------|------|
| ⭐ **Flagship** (`memory-flip`) | The single "hero" game, shown to **every** age group | Free — the hook |
| ✨ **Free tasters** (`color-pop` 3‑5, `math-runner` 6‑8, `trivia-battle` 9‑12) | One free game per age band | Free (earn XP from habits → parent approves) |
| 🔒 **Premium** (all other games) | The bulk of the library | **Active family subscription** required |

**Age-appropriate by default:** a child now sees **only their own age group** plus
the cross-age flagship — no more browsing all 23 games. (Bug fixed: a 9-year-old
previously saw 3‑5 + 6‑8 + 9‑12.)

**Server is authoritative.** Age gating, tier, and the subscription lock are all
enforced in `server/routes.ts`; the client is never trusted. Premium purchase is
blocked with HTTP 402 until the family subscribes.

## 2. The conversion loop

```
Habit done → earn XP  →  play the FREE flagship + free taster  →  get hooked
                                        │
                        sees 5 shiny PREMIUM games in their age range (🔒)
                                        │
                     taps "Ask a grown-up ⭐"  →  parent gets a nudge
                                        │
                         parent subscribes → all games unlock
```

Two kid-facing prompts drive this (both shipped in the Game Zone):
- A **gold upsell banner**: "*N more games waiting for you!*" with an *Ask a grown-up* button.
- Each **premium game card** shows a Premium lock + its own *Ask a grown-up ⭐* button.

Each tap records `premiumInterestCount` / `premiumInterestAt` on the child
(`POST /api/children/:id/upgrade-request`) so the parent side can quantify demand.

## 3. Safety & trust (non-negotiable for a kids' app)

- **No dark patterns aimed at children.** No countdown timers, no fake scarcity,
  no loot boxes, no in-game "buy now" that charges money. Kids can only *ask*; a
  parent is always the payer and the decision-maker.
- **Transparent to parents.** The nudge tells parents exactly what the child wants
  and what it costs. XP spent on games is refundable (existing parent-approval flow).
- **Clear currency separation** between earned XP (habits) and real money (subscription).
- **Age-appropriate content only** — the age filter guarantees a child never sees
  older games.

## 4. Rollout phases

**Phase 1 — Foundation (shipped ✅)**
Age filter fix; free/premium tiers; flagship; server lock + purchase guard;
kid upsell banner + premium lock cards + "ask a grown-up"; interest tracking; unit tests.

**Phase 2 — Parent-side conversion surface (next)**
- Parent dashboard badge: "⭐ {child} asked to unlock premium games (Nx)".
- One-tap "Unlock all games" CTA on that badge → existing subscription checkout.
- Email/push when a child asks (respecting existing notification prefs).

**Phase 3 — Optimize the funnel**
- Free-trial default for premium so families taste it (trial already unlocks premium).
- "Play 3 free, then it's premium" teaser: let a locked game show a 30‑second
  preview round to build desire before the lock.
- A/B test flagship choice, free-taster mix, banner copy, and price points.
- Instrument the funnel: catalog views → ask taps → parent opens → subscribe.

**Phase 4 — Content cadence & retention**
- Add 1–2 premium games/month; feature a rotating "New this week" premium game.
- Seasonal free flagship swaps to keep the hook fresh.
- Streak/achievement unlocks that grant temporary premium access (earn, not just buy).

## 5. Key metrics

- **Hook rate:** % of new kids who play the flagship in week 1.
- **Ask rate:** premium-locked card views → "ask a grown-up" taps.
- **Conversion:** asks → parent subscription starts.
- **Trial→paid**, churn, and ARPU.
- **Guardrail:** kid frustration (repeated asks with no unlock) — cap prompts so it
  stays a delight, not nagging.

## 6. Tuning without code changes

The whole model lives in `shared/games/tiers.ts` — change `FLAGSHIP_GAME_ID`,
`FREE_GAME_IDS`, or what counts as an unlocking subscription in one place. Prices
per game stay in the catalog; subscription prices in `shared/subscription-plans.ts`.

## 7. Files (this implementation)

- `shared/games/tiers.ts` — tiers, flagship, `premiumUnlocked`, `isSubscriptionLocked`.
- `shared/games/index.ts` — `getGamesForAge` (own group + flagship).
- `server/routes.ts` — subscription-aware catalog, purchase guard (402), upgrade-request.
- `client/src/components/kid/game-zone.tsx` — upsell banner, premium locks, ask CTA, tier tabs.
- `shared/schema.ts` — `children.premiumInterestCount` / `premiumInterestAt`.
- Tests: `tests/unit/game-tiers.test.ts`.
