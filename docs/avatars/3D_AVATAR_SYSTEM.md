# Habit Hero — Interactive 3D Avatar & Modular Gear

This is the **3D** system added alongside the existing 2D layered avatar system.
It is **additive** — it reuses the existing avatar shop, purchase, XP/coin, and
parent-approval backend and does not replace any existing functionality.

## What's implemented (foundation vertical slice)

| Piece | File | Status |
|-------|------|--------|
| Shared 3D types | `shared/avatar-3d.ts` | ✅ done |
| Equipment resolver (equip/remove/replace, conflicts, backpack children) | `shared/avatar-equipment-resolver.ts` | ✅ done, 12 unit tests |
| Placeholder `.glb` generator (avatar + gear + sockets) | `scripts/3d/generate-placeholder-glb.ts` | ✅ done |
| GLB validator (container, budgets, required sockets) | `scripts/validate-glb.ts` (`npm run 3d:validate`) | ✅ done |
| Web R3F viewer (360° orbit, zoom, camera shortcuts, socket attach) | `client/src/components/avatar3d/Avatar3DViewer.tsx` | ✅ done |
| Demo catalog + dev page | `client/src/lib/avatar-3d-catalog.ts`, `client/src/pages/dev-avatar-3d.tsx` (`/dev/avatar-3d`) | ✅ done |

**Dependencies added (web only):** `three`, `@react-three/fiber`. `@gltf-transform/core`
is a **dev/offline** tool for asset generation + validation (not a runtime dep).
`@react-three/drei` is installed but **not used** — Vite could not reliably
pre-bundle it, and the viewer only needs `GLTFLoader` + `OrbitControls` from
`three/examples`, so drei was dropped from the runtime path.

## Core principle (same as the 2D system)

The avatar is a **permanent base `.glb`**. Gear are **independent `.glb` models**
mounted onto **named sockets** on the avatar (or onto an equipped backpack's
pocket sockets). Changing gear never regenerates the avatar — child objects are
added/removed. See `AVATAR_SOCKETS` / `BACKPACK_SOCKETS` in `shared/avatar-3d.ts`
for the naming convention shared across Blender, web, and (future) native.

Coordinate convention: glTF 2.0 `.glb`, **meters, Y-up, avatar faces +Z**,
applied transforms, predictable node names, no cameras/lights baked in.

## The honest asset reality

Higgsfield produces **images/video, not `.glb`**. Real production avatars require
a modeling pipeline that is **offline art work**, not something the app generates
at runtime. The `.glb` files currently in `client/public/assets/3d/` are
**procedurally-generated blocky placeholders** with correct geometry + sockets so
the whole system works end-to-end today. Swap them for real art (keeping the
node/socket names) and nothing else changes.

## Production asset pipeline (per gear/avatar)

```
Asset spec  →  Higgsfield concept + multi-view turnaround (prompts in the master brief)
            →  3D mesh reconstruction  →  Blender: retopo, UV, texture bake, rig, sockets
            →  GLB export (meters, Y-up, named sockets)  →  npm run 3d:validate
            →  visual QA  →  publish under client/public/assets/3d/<type>/<id>/v<N>/
```

Every asset ships a manifest (`§29` of the brief) and must pass
`npm run 3d:validate` (status → `passed`) before publication. The validator
enforces the mobile budgets in `scripts/validate-glb.ts` (avatar ≤30k tris,
gear ≤8k tris) and required avatar sockets.

## Adding a new gear item

1. Produce/generate `<id>.glb` with a clear silhouette and (for backpacks) its
   own pocket/charm sockets.
2. `npm run 3d:validate -- client/public/assets/3d/gear/.../<id>.glb`
3. Add a `Gear3DMetadata` row (slot, `primarySocket`, `supportedBodyFamilies`,
   `defaultTransform`, per-body/per-avatar overrides) — in the DB in production,
   or `client/src/lib/avatar-3d-catalog.ts` for the demo.
4. The resolver + viewer pick it up automatically.

## Regenerate placeholders

```bash
npm run 3d:generate   # writes avatars + gear .glb under client/public/assets/3d
npm run 3d:validate   # all should report ✅
```

## Remaining work (not in this slice)

Wired for, but not yet built out: Drizzle tables (`avatar_3d_models`,
`avatar_gear_3d_metadata`, `child_avatar_state`) + migration; the avatar-state
Express APIs; existing-shop purchase/preview integration; WebSocket broadcast of
3D state; the Expo (`expo-gl` + `@react-three/fiber/native`) mobile viewer; the
`/admin/avatar-3d-fit` alignment tool; Playwright/WebDriverIO GPU-state tests;
and — the big one — **real rigged `.glb` art** to replace the placeholders.
