# Habit Hero — Subscription & Freemium Model

The single reference for how free vs. premium works across the whole app, how a
child's interest converts a parent, and how to extend or tune it.

## 1. The model in one picture

```
Child earns XP by doing habits
        │
        ├─ FREE content (no subscription needed)
        │     • Games:  1 cross-age flagship + 1 free taster per age band
        │     • Avatars: 1 free starter hero per age band (panda / explorer / robot)
        │     • Gear:    2 free items (star glasses, explorer hat)
        │
        └─ PREMIUM content (needs an active family subscription)
              • All other games, avatars, and gear
                        │
        Child taps "Ask a grown-up ⭐"  →  interest recorded on the child
                        │
        Parent dashboard shows WHO wants WHAT + Premium benefits
                        │
                One-tap "Unlock Premium"  →  /subscription  →  all unlocks
```

## 2. Who has premium access

One shared function decides everything: `hasPremiumAccess(user)` in
[`shared/premium.ts`](../shared/premium.ts). It mirrors the client's
`getSubscriptionStatus().canAccessPremiumFeatures`, so server and client always
agree:

| subscriptionStatus | Premium? |
|---|---|
| `active` | yes (until `subscriptionEndDate`, if set) |
| `trial` / `trialing` | yes until `trialEndsAt` (or `createdAt` + 7 days) |
| `cancelled` | yes only while still inside the paid period |
| `expired` / `free` / none | no |

**Trials unlock everything** — families experience the full product, which lifts
conversion. Cancelled users keep access until their paid period ends.

## 3. What's free vs premium (tuning)

All tier decisions live in two files — change them without touching UI or rules:

- **Games:** [`shared/games/tiers.ts`](../shared/games/tiers.ts)
  `FLAGSHIP_GAME_ID`, `FREE_GAME_IDS`.
- **Avatars & gear:** [`shared/avatar-system.ts`](../shared/avatar-system.ts)
  `FREE_AVATAR_IDS`, `FREE_GEAR_IDS`.

Everything not listed there is premium.

## 4. Enforcement (server is authoritative)

The client only *shows* locks; the **server rejects** premium actions without a
subscription (`server/routes.ts`):

| Action | Endpoint | Blocked with |
|---|---|---|
| Buy a premium game | `POST /api/children/:id/game-purchases` | 402 |
| Buy premium gear | `POST /api/children/:id/avatar/purchase-gear` | 402 |
| Select a premium avatar | `PUT /api/children/:id/avatar` | 402 |

Age gating (games + gear + avatars) is also enforced server-side. The child's
`premiumUnlocked` flag is returned by `/api/auth/child` and `/api/auth/child-login`
so the kid UI can render locks; it is never trusted for the actual gate.

## 5. The conversion loop (interest → parent → upgrade)

1. Every "Ask a grown-up ⭐" tap calls
   `POST /api/children/:id/upgrade-request` with `{ module: "games" | "avatars" | "gear" }`.
2. It increments `children.premiumInterestCount`, sets `premiumInterestAt`, and
   bumps a per-module tally in `children.premiumInterestModules`.
3. The parent dashboard renders
   [`PremiumInterestNudge`](../client/src/components/subscription/PremiumInterestNudge.tsx):
   which child, which modules (with counts), the Premium benefits
   (`PREMIUM_BENEFITS`), and a one-tap **Unlock Premium** button → `/subscription`.
4. The nudge auto-hides once the family has premium access.

## 6. Child safety (must stay true)

- Kids can only **ask** — a parent is always the payer and the decision-maker.
- No countdown timers, fake scarcity, loot boxes, or kid-facing "buy for money".
- XP (earned from habits) and real money (subscription) are clearly separated.
- Age filtering guarantees a child never sees older content.

## 7. Where the money flow lives (existing, unchanged)

- Plans & prices: [`shared/subscription-plans.ts`](../shared/subscription-plans.ts).
- Checkout / manage: `/subscription`, `/premium-enrollment`, `/premium-checkout`
  pages and `subscription-management-card` (Stripe-backed, untouched by this work).

## 8. Adding a new gated module later

1. Add the module id to `PremiumModule` + labels in `shared/premium.ts`.
2. Tag items free/premium in that module's catalog (mirror the games/avatar pattern).
3. Gate the write endpoints with `hasPremiumAccess(parent)` → 402.
4. In the kid UI, show a lock + an "Ask a grown-up" button that posts
   `upgrade-request` with the new `module`.
5. The parent nudge picks it up automatically.

## 9. Files

- `shared/premium.ts` — access check, benefits, module labels.
- `shared/games/tiers.ts`, `shared/avatar-system.ts` — free/premium tiers.
- `server/routes.ts` — enforcement (402), `premiumUnlocked` in child responses, upgrade-request.
- `server/storage.ts` — `recordPremiumInterest(childId, module)`.
- `shared/schema.ts` — `children.premiumInterestCount / premiumInterestAt / premiumInterestModules`.
- `client/src/components/kid/game-zone.tsx`, `client/src/components/kid/avatar-studio.tsx` — kid locks + asks.
- `client/src/components/subscription/PremiumInterestNudge.tsx` — parent one-tap upgrade.
- Tests: `tests/unit/game-tiers.test.ts`, `tests/unit/game-catalog.test.ts`.
- Related: `docs/GAMES_FREEMIUM_PLAN.md` (the funnel strategy & metrics).
