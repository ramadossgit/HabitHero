# Habit Heroes — Feature Documentation

Habit Heroes turns children's daily habits into an epic hero adventure. Parents
create habits and rewards; kids complete "missions" to earn XP and reward
points, level up their hero, unlock avatars & gear, and play mini-games.

This folder documents **every feature currently in the app**, split by audience,
with each functionality in its own file. Every document describes how the
feature behaves in **Free Trial mode** and in **Subscription (paid) mode**.

---

## How to read these docs

| Folder | Audience | Files |
|--------|----------|-------|
| [`parent/`](./parent) | The parent dashboard | Dashboard, Kids, Habits, Rewards, Progress, Settings |
| [`kids/`](./kids) | The child hero app | Missions, Customize, Rewards, Games, Progress |

### Parent features
- [Dashboard](./parent/Dashboard.md) — home overview, pending approvals hub, family stats
- [Kids](./parent/Kids.md) — manage child hero profiles, logins, avatars
- [Habits](./parent/Habits.md) — create/assign habits, schedules, voice reminders, approvals
- [Rewards](./parent/Rewards.md) — create rewards, approve claims, bonus points, game purchases
- [Progress](./parent/Progress.md) — completion stats, streaks, reports & analytics
- [Settings](./parent/Settings.md) — Parent Controls, Alerts & Reminders, Tutorial, My Profile, Subscription

### Kid features
- [Missions](./kids/Missions.md) — complete daily habits, earn XP & reward points
- [Customize](./kids/Customize.md) — Avatar Shop & Gear Shop
- [Rewards](./kids/Rewards.md) — browse & redeem rewards
- [Games](./kids/Games.md) — Game Zone mini-games
- [Progress](./kids/Progress.md) — weekly progress, levels, streaks & badges

---

## Account modes at a glance

Every parent account starts with a **7‑day free trial** (no credit card
required). After the trial, the account needs an active subscription to keep
using the premium parent dashboard.

### Free Trial mode (7 days)
- Full access to set up the family: create children, habits and rewards.
- Kids can log in, complete missions, earn XP/points, redeem rewards and
  customize their hero.
- Premium extras are available to *try* during the trial window (voice
  reminders, time‑based auto‑approval, the Avatar Builder, and the Balloon Pop
  mini‑game).
- A trial‑status banner shows the days remaining.

### Subscription mode (paid)
Unlocks and keeps everything after the trial ends:

- Unlimited habits & levels
- All mini‑games unlocked
- Exclusive avatars & costumes
- Advanced parent dashboard
- Progress insights & analytics
- Custom rewards & challenges
- Voice reminders (with the full premium ringtone library)
- Streak bonuses & achievements
- Recurring rewards & weekend‑challenge rewards
- Priority support

### Expired (trial ended, no subscription)
- The parent dashboard is gated behind a "subscribe to continue" screen.
- Existing family data is preserved and returns as soon as a plan is active.

### Plans
| Plan | Price | Notes |
|------|-------|-------|
| Monthly | $4.99 / month | |
| Quarterly | $12.99 / 3 months | Most popular · Save $1.98 (~$4.33/mo) |
| Yearly | $49.99 / year | Best value · Save $9.89 (~$4.17/mo) |

> Prices are defined in a single place — `shared/subscription-plans.ts`. Edit a
> plan's `price` there and the per‑month figure, the "Save $X" badge, the API
> and every screen update automatically.

> **Note on modes in this documentation:** each feature file has a
> **"Availability by mode"** section describing exactly what Free Trial and
> Subscription users can do with that feature.

---

## Safety & platform
- COPPA‑compliant design; children log in with a family code + username + PIN
  (no email required for kids).
- Parents approve habit completions, reward redemptions and game purchases.
- Per‑child parental controls (screen time, bedtime, feature toggles,
  emergency mode).
- Works on phones, tablets and the web with a mobile‑first layout.
