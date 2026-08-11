# Habit Hero — Avatar & Collectible System (Design Spec)

> **Core principle:** avatars are not "skins." A child's hero **evolves with their
> progress**, so the character grows alongside their habits. Reward **effort, not
> spending**.

This document is the design source of truth for the avatar/collectible system and
the phased plan to build it into the current app.

---

## 1. Design principles (ages 3–12)
- **Cute, never scary.** No weapons, violence, or frightening features.
- **Gender‑neutral by default** — any child can use any avatar.
- **Highly expressive** — happy, excited, sleepy, surprised, proud.
- **Large eyes, soft rounded shapes, warm friendly proportions.**
- **Many upgrade paths** — 1,000+ cosmetic items possible over time.
- **Reward effort, not spending** — items are earned with XP/coins from habits.
- **Pixar/DreamWorks‑inspired stylized look** (no existing IP).

---

## 2. Avatar collections (families)

Each collection groups themed characters. **Buddy Heroes** is the flagship.

| # | Collection | Audience | Examples |
|---|------------|----------|----------|
| 1 | **Buddy Heroes** ⭐ | All ages | Sunny Fox, Happy Panda, Tiny Dragon, Brave Lion, Robo Buddy, Space Bunny, Dino Explorer, Penguin Hero, Unicorn Friend, Baby Tiger, Koala Genius, Monkey Adventurer |
| 2 | Fantasy Heroes | Older kids | Mini Wizard, Forest Elf, Fairy Princess, Magic Knight, Pirate Captain, Ninja Kid, Space Ranger, Robot Guardian, Ice Mage, Fire Explorer |
| 3 | Animal World | All ages | Elephant, Giraffe, Red Panda, Dolphin, Whale, Owl, Eagle, Penguin, Cheetah, Bear, Sloth, Cat, Dog, Wolf, Deer |
| 4 | Tiny Monsters (never scary) | All ages | Jelly, Cloud, Candy, Marshmallow, Rainbow Blob, Lava Blob, Star Monster |
| 5 | Space Collection | 6–12 | Alien Buddy, Astro Kid, Robot Puppy, Robot Cat, Galaxy Bear, Moon Bunny |
| 6 | Mythical Collection | 9–12 | Phoenix, Griffin, Unicorn, Dragon, Pegasus, Mermaid, Baby Kraken |
| 7 | Nature Spirits | 6–12 | Flower Spirit, Leaf Guardian, Water Sprite, Mountain Buddy, Cloud Friend, Rainbow Fairy |
| 8 | Career Collection (aspirations) | 6–12 | Doctor, Scientist, Teacher, Astronaut, Firefighter, Pilot, Chef, Farmer, Engineer, Veterinarian |

### Evolution stages (the heart of the system)
Every avatar has **four stages**, unlocked by **XP milestones** — the child sees
their buddy literally grow up:

| Stage | Unlock (XP) — tunable | Feel |
|-------|----------------------|------|
| 🥚 **Baby** | 0 (starter) | Tiny, chubby, biggest eyes |
| 🌱 **Young** | e.g. 500 | Slightly taller, more confident pose |
| 🦸 **Hero** | e.g. 2,000 | Full hero look, cape/pose |
| 👑 **Legendary** | e.g. 6,000 | Glowing accents, aura, "maxed" form |

> XP thresholds live in config so they can be tuned without code changes (see §7).

---

## 3. Customization slots

Every avatar supports interchangeable, scale‑consistent slots:

- **Head:** hair, ears, horns, crown, halo, flower crown, cap, pirate hat, wizard
  hat, helmet, space helmet, bunny ears, cat ears
- **Eyes:** big happy, sleepy, sparkle, rainbow, galaxy, heart, sunglasses, star
  glasses, nerd glasses
- **Mouth:** smile, laugh, wink, tongue‑out, hero smile, surprised, determined
- **Face accessories:** freckles, stars, rainbow paint, bandage, stickers, glitter
- **Outfit:** casual, sports, fantasy, space, adventure, seasonal (see below)
- **Shoes:** sneakers, boots, rocket boots, bunny slippers, rainbow shoes, roller
  skates, ice skates
- **Back:** cape, fairy/dragon/butterfly wings, rocket pack, balloon pack,
  treasure/school backpack, magic book
- **Hand (no weapons):** magic wand, paint brush, book, magnifying glass,
  telescope, teddy bear, ice cream, plant pot, soccer/basketball, puzzle cube
- **Pet** (levels independently, can wear hats): Baby Dragon, Puppy, Kitten, Owl,
  Panda, Bunny, Hamster, Turtle, Baby Dinosaur, Fox, Unicorn, Robot Pet
- **Vehicle** (later): bicycle, scooter, skateboard, hoverboard, rocket scooter,
  rainbow cloud, tiny spaceship
- **Trails & effects:** walking trail (stars, rainbow, fireflies, hearts, leaves,
  sparkles, snowflakes, music notes, lightning, confetti), jump effect, idle
  animation
- **Emotes:** happy, cry, laugh, dance, clap, thumbs up, thinking, celebrate,
  victory, sleep
- **Room decoration (future):** bed, lamp, rug, trophy shelf, aquarium, bookshelf,
  desk, plants, posters, pet house

### Outfit sub‑categories
Casual · Sports (soccer, basketball, cricket, tennis, swimming, karate, archery,
cycling) · Fantasy (wizard robe, knight armor, fairy dress, ninja suit, pirate) ·
Space (NASA suit, alien armor, rocket backpack) · Adventure (explorer vest,
safari, camping) · Seasonal (Christmas, Halloween, Easter, summer beach, spring).

---

## 4. Economy & progression

Items are organized into **rarity tiers** (not sold à la carte) to create
long‑term excitement. Currency = **reward coins/points earned from habits**.

| Tier | Coins | Visual quality |
|------|-------|----------------|
| Common | 100–300 | Basic colors & accessories |
| Uncommon | 400–800 | Better textures, themed items |
| Rare | 1,000–2,000 | Animated details, unique outfits |
| Epic | 3,000–6,000 | Special effects, glowing elements |
| Legendary | 8,000–15,000 | Complete themed set + exclusive pet & trail |
| Mythic | Seasonal / achievement‑only | Limited edition, premium animations |

### Premium Legendary bundles (sell complete themes, not randoms)
Galaxy Hero · Candy Kingdom · Jungle Explorer · Ocean Adventure · Time Traveler ·
Super Scientist · Dream Wizard — each a matched set (hat, outfit, shoes, back,
pet, trail, aura).

### Effort‑not‑spending rules
- Avatar **evolution** is unlocked by **XP** (earned only by completing habits) —
  never purchasable.
- Cosmetics are bought with **coins** earned from habits/streaks.
- Mythic items are **achievement/seasonal** only — status from effort.

---

## 5. Age‑based unlock strategy

| Age | Style | Complexity |
|-----|-------|-----------|
| 3–5 | Chubby animals, simple shapes, bright colors, big expressions | 2–4 slots (hat, outfit, pet, trail) |
| 6–8 | Adventure buddies, fantasy heroes, sports | 5–7 slots (+ backpack, glasses, shoes) |
| 9–12 | Detailed explorers, sci‑fi, career, mythical | Full customization (+ effects, emotes, titles, vehicles) |

The app already stores each child's **age**; it drives which slots/collections are
offered (mirrors how age already gates the Game Zone).

---

## 6. Art pipeline (Higgsfield AI)

Because Habit Hero is a **React/web app** (avatars render as `<img>`), we produce
**high‑quality stylized character images**, not rigged Unity layers. Realistic
plan:

- **Per‑character images** at each evolution stage (Baby/Young/Hero/Legendary),
  square, centered, kid‑friendly, on a clean/transparent background.
- Consistent style prompt so the whole collection feels like one set.
- Cosmetic items shown as their own shop thumbnails; where feasible, pre‑rendered
  "equipped" variants per character keep it simple for a web app (true real‑time
  layering would require a rig we don't have).

### File & naming convention
```
client/public/avatars/
  buddy/
    sunny-fox/baby.png  young.png  hero.png  legendary.png
    happy-panda/…
  fantasy/…
  shop-items/head/wizard-hat.png  …
```

### Base generation prompt (reuse for every character)
> High‑quality 3D stylized collectible avatar for a children's habit app, ages
> 3–12: oversized expressive eyes, soft rounded shapes, vibrant but not
> over‑saturated colors, warm friendly personality, Pixar/DreamWorks‑inspired (no
> existing IP). Full body, front view, centered, clean/transparent background, no
> weapons or scary features, collectible and instantly lovable. **Character:**
> `<name>`. **Stage:** `<baby|young|hero|legendary>`.

---

## 7. Implementation roadmap (this app)

**Phase 1 — Design (this doc).** ✅

**Phase 2 — Starter art (Higgsfield).** Generate a first Buddy Hero across all
four evolution stages, save under `client/public/avatars/…`, ready to display.

**Phase 3 — Data model & shop wiring.**
- `avatar_collections` / `avatar_items` config (id, collection, stage, rarity,
  coin cost, minAge, xpToUnlock) — start as a typed config module in
  `shared/` (like `subscription-plans.ts`) so it's easily editable in one place.
- Extend the child record's `unlockedAvatars` / `unlockedGear` usage to store
  owned collectibles and the equipped set.
- Surface collections + evolution progress in the kid **Avatar Shop** and
  **Gear Shop**, gated by age and driven by XP (evolution) and coins (cosmetics).

**Phase 4 — Progression polish.** Trails/emotes/pets, Legendary bundles, seasonal
Mythics, "your buddy evolved!" celebration moments.

> Everything tunable (XP thresholds, coin prices, age gates, which collections are
> live) is kept in shared config so product changes don't require touching UI.
