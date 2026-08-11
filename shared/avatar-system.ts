// ─────────────────────────────────────────────────────────────────────────────
//  Habit Hero — Modular Avatar & Gear System (shared types + catalog + resolver)
//
//  Core principle: the avatar is a LAYERED, MODULAR character. A permanent base
//  body is composited with independent, transparent gear assets attached to
//  named slots. Changing gear NEVER regenerates the avatar image — it just
//  toggles which overlay layers render. See docs/avatars/AVATAR_SYSTEM.md.
// ─────────────────────────────────────────────────────────────────────────────

export type AvatarBodyFamily =
  | "human-child" | "small-animal" | "tall-animal" | "round-animal"
  | "tiny-monster" | "robot" | "dragon" | "fantasy-creature";

export type EquipmentSlot =
  | "skin" | "face" | "hair" | "head" | "eyes" | "face_accessory" | "neck"
  | "top" | "bottom" | "full_outfit" | "hands" | "shoes" | "back"
  | "left_hand" | "right_hand" | "pet" | "vehicle" | "aura" | "trail";

// Strict back-to-front render order. Every layer key maps to a z-index here.
export const AVATAR_LAYER_ORDER = [
  "background_effect", "trail", "back_far", "back", "base_body", "skin",
  "bottom", "shoes", "top", "full_outfit", "neck", "hair_back", "face",
  "eyes", "hair_front", "head", "face_accessory", "hands", "left_hand",
  "right_hand", "aura_front", "pet", "foreground_effect",
] as const;
export type LayerKey = (typeof AVATAR_LAYER_ORDER)[number];
export const layerZ = (key: string): number => {
  const i = (AVATAR_LAYER_ORDER as readonly string[]).indexOf(key);
  return i === -1 ? 500 : i;
};

/** A point/transform expressed as fractions (0..1) of the 1024×1024 master
 *  canvas, so it scales to any display size. */
export interface AnchorPoint { x: number; y: number; rotation?: number; scale?: number; }

export interface AvatarAnchors {
  headCenter: AnchorPoint;
  eyes: AnchorPoint;
  chest: AnchorPoint;
  back: AnchorPoint;
  leftHand: AnchorPoint;
  rightHand: AnchorPoint;
  feet: AnchorPoint;
  pet: AnchorPoint;
}

/** How a gear item is placed relative to one anchor (fractions of canvas). */
export interface GearTransform {
  anchor: keyof AvatarAnchors;
  offsetX?: number; // fraction of canvas
  offsetY?: number;
  scale?: number;   // fraction of canvas the item spans
  rotation?: number;
}

export interface GearVisualLayer {
  assetUrl: string;
  layerKey: LayerKey; // drives z-index
}

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";

export interface GearItem {
  id: string;
  name: string;
  description: string;
  slot: EquipmentSlot;
  rarity: Rarity;
  priceCoins: number;
  supportedBodyFamilies: AvatarBodyFamily[];
  visualLayers: GearVisualLayer[];
  thumbnailUrl: string;
  /** Per-body-family placement (a hat sits differently on a kid vs a panda). */
  transformByBodyFamily: Partial<Record<AvatarBodyFamily, GearTransform>>;
  /** Optional per-avatar fine-tuning that overrides the body-family placement
   *  (keyed by avatar id) — used when one avatar's face/head sits differently
   *  from others in the same body family, so worn gear looks realistic. */
  transformByAvatarId?: Record<string, GearTransform>;
  hidesSlots?: EquipmentSlot[];
  conflictsWithSlots?: EquipmentSlot[];
  minAge?: number;
  maxAge?: number;
  status?: "active" | "hidden" | "seasonal" | "retired";
}

export interface AvatarDefinition {
  id: string;
  name: string;
  bodyFamily: AvatarBodyFamily;
  baseAssetUrl: string;      // the permanent base body image
  anchors: AvatarAnchors;
  minAge: number;            // age-range gating (like games)
  maxAge: number;
  thumbnailUrl: string;
}

export interface EquippedItems { [slot: string]: string | undefined; }

export interface AvatarCustomizationState {
  avatarId: string;
  equipped: EquippedItems;
  temporarilyHidden: EquippedItems; // restored when the conflicting item is removed
  updatedAt: string;
  version: number;
}

// ── Resolver ─────────────────────────────────────────────────────────────────
// Equip an item: remove same-slot item, apply hidden-slot rules, and remember
// anything temporarily hidden so it comes back when the item is removed.
export function equipItem(
  state: AvatarCustomizationState,
  item: GearItem,
): AvatarCustomizationState {
  const equipped: EquippedItems = { ...state.equipped };
  const hidden: EquippedItems = { ...state.temporarilyHidden };

  // Hidden slots (e.g. a full outfit hides top+bottom) — stash and clear them.
  for (const s of item.hidesSlots ?? []) {
    if (equipped[s]) { hidden[s] = equipped[s]; delete equipped[s]; }
  }
  equipped[item.slot] = item.id;

  return { ...state, equipped, temporarilyHidden: hidden, updatedAt: new Date().toISOString(), version: state.version + 1 };
}

// Remove an item from a slot and restore anything it was hiding.
export function removeSlot(
  state: AvatarCustomizationState,
  slot: EquipmentSlot,
  catalog: Record<string, GearItem>,
): AvatarCustomizationState {
  const equipped: EquippedItems = { ...state.equipped };
  const hidden: EquippedItems = { ...state.temporarilyHidden };
  const removedId = equipped[slot];
  delete equipped[slot];

  // If the removed item was hiding other slots, bring them back.
  const removed = removedId ? catalog[removedId] : undefined;
  for (const s of removed?.hidesSlots ?? []) {
    if (hidden[s]) { equipped[s] = hidden[s]; delete hidden[s]; }
  }
  return { ...state, equipped, temporarilyHidden: hidden, updatedAt: new Date().toISOString(), version: state.version + 1 };
}

export function isGearCompatible(item: GearItem, avatar: AvatarDefinition): boolean {
  return item.supportedBodyFamilies.includes(avatar.bodyFamily);
}

/** A single resolved layer ready to render, in fractions of the canvas. */
export interface RenderLayer {
  key: string;
  z: number;
  assetUrl: string;
  transform?: GearTransform;
}

/** Turn an avatar + equipped set into an ordered list of layers to composite. */
export function buildRenderLayers(
  avatar: AvatarDefinition,
  equipped: EquippedItems,
  catalog: Record<string, GearItem>,
): RenderLayer[] {
  const layers: RenderLayer[] = [
    { key: "base_body", z: layerZ("base_body"), assetUrl: avatar.baseAssetUrl },
  ];
  for (const slot of Object.keys(equipped)) {
    const id = equipped[slot];
    if (!id) continue;
    const item = catalog[id];
    if (!item || !isGearCompatible(item, avatar)) continue;
    // Always resolve to SOME transform so a catalog gap can never make gear
    // render full-frame over the avatar (the base body is the only layer that
    // legitimately has no transform).
    const transform = item.transformByAvatarId?.[avatar.id]
      ?? item.transformByBodyFamily[avatar.bodyFamily]
      ?? { anchor: "chest" as const, scale: 0.4 };
    for (const vl of item.visualLayers) {
      layers.push({ key: `${item.id}:${vl.layerKey}`, z: layerZ(vl.layerKey), assetUrl: vl.assetUrl, transform });
    }
  }
  return layers.sort((a, b) => a.z - b.z);
}

// ── Starter catalog (proof of concept, Higgsfield-generated assets) ──────────
const A = "/avatars/generated";

export const AVATARS: AvatarDefinition[] = [
  {
    id: "friendly-panda", name: "Friendly Panda", bodyFamily: "round-animal",
    baseAssetUrl: `${A}/panda.png`, thumbnailUrl: `${A}/panda.png`,
    minAge: 3, maxAge: 6,
    anchors: {
      headCenter: { x: 0.5, y: 0.28 }, eyes: { x: 0.5, y: 0.32 },
      chest: { x: 0.5, y: 0.6 }, back: { x: 0.5, y: 0.55 },
      leftHand: { x: 0.3, y: 0.62 }, rightHand: { x: 0.7, y: 0.62 },
      feet: { x: 0.5, y: 0.95 }, pet: { x: 0.82, y: 0.85 },
    },
  },
  {
    id: "human-explorer", name: "Human Explorer", bodyFamily: "human-child",
    baseAssetUrl: `${A}/explorer.png`, thumbnailUrl: `${A}/explorer.png`,
    minAge: 6, maxAge: 9,
    anchors: {
      headCenter: { x: 0.5, y: 0.2 }, eyes: { x: 0.5, y: 0.26 },
      chest: { x: 0.5, y: 0.48 }, back: { x: 0.5, y: 0.42 },
      leftHand: { x: 0.28, y: 0.6 }, rightHand: { x: 0.72, y: 0.6 },
      feet: { x: 0.5, y: 0.94 }, pet: { x: 0.82, y: 0.85 },
    },
  },
  {
    id: "tiny-robot", name: "Tiny Robot", bodyFamily: "robot",
    baseAssetUrl: `${A}/robot.png`, thumbnailUrl: `${A}/robot.png`,
    minAge: 9, maxAge: 12,
    anchors: {
      headCenter: { x: 0.5, y: 0.3 }, eyes: { x: 0.5, y: 0.36 },
      chest: { x: 0.5, y: 0.6 }, back: { x: 0.5, y: 0.55 },
      leftHand: { x: 0.28, y: 0.68 }, rightHand: { x: 0.72, y: 0.68 },
      feet: { x: 0.5, y: 0.95 }, pet: { x: 0.82, y: 0.85 },
    },
  },
  {
    // human-child body family → automatically reuses all human-child gear.
    id: "brave-princess", name: "Brave Princess", bodyFamily: "human-child",
    baseAssetUrl: `${A}/princess.png`, thumbnailUrl: `${A}/princess.png`,
    minAge: 3, maxAge: 9,
    anchors: {
      headCenter: { x: 0.5, y: 0.2 }, eyes: { x: 0.5, y: 0.26 },
      chest: { x: 0.5, y: 0.48 }, back: { x: 0.5, y: 0.42 },
      leftHand: { x: 0.28, y: 0.6 }, rightHand: { x: 0.72, y: 0.6 },
      feet: { x: 0.5, y: 0.94 }, pet: { x: 0.82, y: 0.85 },
    },
  },
  {
    id: "super-kid", name: "Super Kid", bodyFamily: "human-child",
    baseAssetUrl: `${A}/superkid.png`, thumbnailUrl: `${A}/superkid.png`,
    minAge: 6, maxAge: 12,
    anchors: {
      headCenter: { x: 0.5, y: 0.2 }, eyes: { x: 0.5, y: 0.26 },
      chest: { x: 0.5, y: 0.48 }, back: { x: 0.5, y: 0.42 },
      leftHand: { x: 0.28, y: 0.6 }, rightHand: { x: 0.72, y: 0.6 },
      feet: { x: 0.5, y: 0.94 }, pet: { x: 0.82, y: 0.85 },
    },
  },
  {
    id: "sporty-girl", name: "Sporty Girl", bodyFamily: "human-child",
    baseAssetUrl: `${A}/sporty-girl.png`, thumbnailUrl: `${A}/sporty-girl.png`,
    minAge: 6, maxAge: 12,
    anchors: {
      headCenter: { x: 0.5, y: 0.2 }, eyes: { x: 0.5, y: 0.26 },
      chest: { x: 0.5, y: 0.48 }, back: { x: 0.5, y: 0.42 },
      leftHand: { x: 0.28, y: 0.6 }, rightHand: { x: 0.72, y: 0.6 },
      feet: { x: 0.5, y: 0.94 }, pet: { x: 0.82, y: 0.85 },
    },
  },
  {
    id: "happy-bunny", name: "Happy Bunny", bodyFamily: "round-animal",
    baseAssetUrl: `${A}/bunny.png`, thumbnailUrl: `${A}/bunny.png`,
    minAge: 3, maxAge: 7,
    anchors: {
      headCenter: { x: 0.5, y: 0.36 }, eyes: { x: 0.5, y: 0.4 },
      chest: { x: 0.5, y: 0.66 }, back: { x: 0.5, y: 0.6 },
      leftHand: { x: 0.28, y: 0.68 }, rightHand: { x: 0.72, y: 0.68 },
      feet: { x: 0.5, y: 0.96 }, pet: { x: 0.82, y: 0.85 },
    },
  },
  {
    id: "space-robot", name: "Space Robot", bodyFamily: "robot",
    baseAssetUrl: `${A}/space-robot.png`, thumbnailUrl: `${A}/space-robot.png`,
    minAge: 8, maxAge: 12,
    anchors: {
      headCenter: { x: 0.5, y: 0.3 }, eyes: { x: 0.5, y: 0.36 },
      chest: { x: 0.5, y: 0.6 }, back: { x: 0.5, y: 0.55 },
      leftHand: { x: 0.28, y: 0.68 }, rightHand: { x: 0.72, y: 0.68 },
      feet: { x: 0.5, y: 0.95 }, pet: { x: 0.82, y: 0.85 },
    },
  },
];

export const GEAR: GearItem[] = [
  {
    id: "explorer-hat", name: "Explorer Hat", description: "A trusty safari hat for big adventures.",
    slot: "head", rarity: "uncommon", priceCoins: 60,
    supportedBodyFamilies: ["human-child", "round-animal", "robot", "small-animal", "tall-animal"],
    visualLayers: [{ assetUrl: `${A}/gear-explorer-hat.png`, layerKey: "head" }],
    thumbnailUrl: `${A}/gear-explorer-hat.png`,
    transformByBodyFamily: {
      "human-child": { anchor: "headCenter", offsetY: -0.03, scale: 0.46 },
      "round-animal": { anchor: "headCenter", offsetY: -0.05, scale: 0.6 },
      "robot": { anchor: "headCenter", offsetY: -0.06, scale: 0.52 },
    },
    minAge: 5, maxAge: 12, status: "active",
  },
  {
    id: "star-glasses", name: "Star Sunglasses", description: "Cool shades with a little star.",
    slot: "eyes", rarity: "common", priceCoins: 40,
    supportedBodyFamilies: ["human-child", "round-animal", "robot", "small-animal", "tall-animal"],
    visualLayers: [{ assetUrl: `${A}/gear-star-glasses.png`, layerKey: "eyes" }],
    thumbnailUrl: `${A}/gear-star-glasses.png`,
    transformByBodyFamily: {
      "human-child": { anchor: "eyes", offsetY: -0.03, scale: 0.30 },
      "round-animal": { anchor: "eyes", offsetY: -0.05, scale: 0.36 },
      "robot": { anchor: "eyes", offsetY: -0.05, scale: 0.34 },
    },
    transformByAvatarId: {
      "brave-princess": { anchor: "eyes", offsetY: -0.05, scale: 0.28 },
    },
    minAge: 3, maxAge: 12, status: "active",
  },
  {
    id: "wizard-hat", name: "Wizard Hat", description: "A starry hat full of magic and wonder.",
    slot: "head", rarity: "rare", priceCoins: 100,
    supportedBodyFamilies: ["human-child", "round-animal", "robot", "small-animal", "tall-animal"],
    visualLayers: [{ assetUrl: `${A}/gear-wizard-hat.png`, layerKey: "head" }],
    thumbnailUrl: `${A}/gear-wizard-hat.png`,
    transformByBodyFamily: {
      "human-child": { anchor: "headCenter", offsetY: -0.11, scale: 0.5 },
      "round-animal": { anchor: "headCenter", offsetY: -0.14, scale: 0.62 },
      "robot": { anchor: "headCenter", offsetY: -0.15, scale: 0.56 },
    },
    minAge: 4, maxAge: 10, status: "active",
  },
  {
    id: "golden-crown", name: "Golden Crown", description: "Only for the truly legendary hero!",
    slot: "head", rarity: "epic", priceCoins: 150,
    supportedBodyFamilies: ["human-child", "round-animal", "robot", "small-animal", "tall-animal"],
    visualLayers: [{ assetUrl: `${A}/gear-golden-crown.png`, layerKey: "head" }],
    thumbnailUrl: `${A}/gear-golden-crown.png`,
    transformByBodyFamily: {
      "human-child": { anchor: "headCenter", offsetY: -0.05, scale: 0.4 },
      "round-animal": { anchor: "headCenter", offsetY: -0.07, scale: 0.52 },
      "robot": { anchor: "headCenter", offsetY: -0.08, scale: 0.46 },
    },
    minAge: 3, maxAge: 9, status: "active",
  },
  {
    id: "superhero-cape", name: "Superhero Cape", description: "Whoosh! Fly into your habits like a hero.",
    slot: "back", rarity: "rare", priceCoins: 90,
    supportedBodyFamilies: ["human-child", "round-animal", "robot", "small-animal", "tall-animal"],
    visualLayers: [{ assetUrl: `${A}/gear-superhero-cape.png`, layerKey: "back" }],
    thumbnailUrl: `${A}/gear-superhero-cape.png`,
    transformByBodyFamily: {
      "human-child": { anchor: "back", offsetY: 0.12, scale: 0.72 },
      "round-animal": { anchor: "back", offsetY: 0.1, scale: 0.85 },
      "robot": { anchor: "back", offsetY: 0.12, scale: 0.78 },
    },
    minAge: 4, maxAge: 12, status: "active",
  },
  {
    id: "magic-wand", name: "Magic Wand", description: "Wave it and make good habits happen!",
    slot: "right_hand", rarity: "uncommon", priceCoins: 70,
    supportedBodyFamilies: ["human-child", "round-animal", "robot", "small-animal", "tall-animal"],
    visualLayers: [{ assetUrl: `${A}/gear-magic-wand.png`, layerKey: "right_hand" }],
    thumbnailUrl: `${A}/gear-magic-wand.png`,
    transformByBodyFamily: {
      "human-child": { anchor: "rightHand", offsetY: -0.1, scale: 0.4 },
      "round-animal": { anchor: "rightHand", offsetY: -0.1, scale: 0.42 },
      "robot": { anchor: "rightHand", offsetY: -0.1, scale: 0.42 },
    },
    minAge: 3, maxAge: 9, status: "active",
  },
  {
    id: "puppy-pal", name: "Puppy Pal", description: "A loyal little friend who cheers you on.",
    slot: "pet", rarity: "epic", priceCoins: 200,
    supportedBodyFamilies: ["human-child", "round-animal", "robot", "small-animal", "tall-animal"],
    visualLayers: [{ assetUrl: `${A}/gear-puppy.png`, layerKey: "pet" }],
    thumbnailUrl: `${A}/gear-puppy.png`,
    transformByBodyFamily: {
      "human-child": { anchor: "pet", offsetY: 0.05, scale: 0.34 },
      "round-animal": { anchor: "pet", offsetY: 0.05, scale: 0.34 },
      "robot": { anchor: "pet", offsetY: 0.05, scale: 0.34 },
    },
    minAge: 3, maxAge: 8, status: "active",
  },
  {
    id: "flower-headband", name: "Flower Headband", description: "Pretty daisies for a blooming hero.",
    slot: "head", rarity: "uncommon", priceCoins: 50,
    supportedBodyFamilies: ["human-child", "round-animal", "robot", "small-animal", "tall-animal"],
    visualLayers: [{ assetUrl: `${A}/gear-flower-headband.png`, layerKey: "head" }],
    thumbnailUrl: `${A}/gear-flower-headband.png`,
    transformByBodyFamily: {
      "human-child": { anchor: "headCenter", offsetY: -0.06, scale: 0.34 },
      "round-animal": { anchor: "headCenter", offsetY: -0.1, scale: 0.44 },
      "robot": { anchor: "headCenter", offsetY: -0.12, scale: 0.42 },
    },
    transformByAvatarId: {
      "brave-princess": { anchor: "headCenter", offsetY: -0.05, scale: 0.36 },
    },
    minAge: 3, maxAge: 9, status: "active",
  },
  {
    id: "rocket-sneakers", name: "Rocket Sneakers", description: "Zoom through your day in style!",
    slot: "shoes", rarity: "rare", priceCoins: 80,
    supportedBodyFamilies: ["human-child", "round-animal", "robot", "small-animal", "tall-animal"],
    visualLayers: [{ assetUrl: `${A}/gear-rocket-sneakers.png`, layerKey: "shoes" }],
    thumbnailUrl: `${A}/gear-rocket-sneakers.png`,
    transformByBodyFamily: {
      "human-child": { anchor: "feet", offsetY: -0.02, scale: 0.42 },
      "round-animal": { anchor: "feet", offsetY: -0.02, scale: 0.46 },
      "robot": { anchor: "feet", offsetY: -0.02, scale: 0.44 },
    },
    minAge: 6, maxAge: 12, status: "active",
  },
  {
    id: "heart-glasses", name: "Heart Glasses", description: "See the world with love!",
    slot: "eyes", rarity: "common", priceCoins: 40,
    supportedBodyFamilies: ["human-child", "round-animal", "robot", "small-animal", "tall-animal"],
    visualLayers: [{ assetUrl: `${A}/gear-heart-glasses.png`, layerKey: "eyes" }],
    thumbnailUrl: `${A}/gear-heart-glasses.png`,
    transformByBodyFamily: {
      "human-child": { anchor: "eyes", offsetY: -0.03, scale: 0.30 },
      "round-animal": { anchor: "eyes", offsetY: -0.05, scale: 0.36 },
      "robot": { anchor: "eyes", offsetY: -0.05, scale: 0.34 },
    },
    transformByAvatarId: {
      "brave-princess": { anchor: "eyes", offsetY: -0.05, scale: 0.28 },
    },
    minAge: 3, maxAge: 10, status: "active",
  },
  {
    id: "baseball-cap", name: "Baseball Cap", description: "A sporty cap for a cool hero.",
    slot: "head", rarity: "uncommon", priceCoins: 60,
    supportedBodyFamilies: ["human-child", "round-animal", "robot", "small-animal", "tall-animal"],
    visualLayers: [{ assetUrl: `${A}/gear-baseball-cap.png`, layerKey: "head" }],
    thumbnailUrl: `${A}/gear-baseball-cap.png`,
    transformByBodyFamily: {
      "human-child": { anchor: "headCenter", offsetY: -0.03, scale: 0.44 },
      "round-animal": { anchor: "headCenter", offsetY: -0.05, scale: 0.56 },
      "robot": { anchor: "headCenter", offsetY: -0.06, scale: 0.5 },
    },
    minAge: 5, maxAge: 12, status: "active",
  },
  {
    id: "bow-tie", name: "Bow Tie", description: "Dressed up and dapper!",
    slot: "neck", rarity: "uncommon", priceCoins: 45,
    supportedBodyFamilies: ["human-child", "round-animal", "robot", "small-animal", "tall-animal"],
    visualLayers: [{ assetUrl: `${A}/gear-bow-tie.png`, layerKey: "neck" }],
    thumbnailUrl: `${A}/gear-bow-tie.png`,
    transformByBodyFamily: {
      "human-child": { anchor: "chest", offsetY: -0.03, scale: 0.2 },
      "round-animal": { anchor: "chest", offsetY: -0.12, scale: 0.24 },
      "robot": { anchor: "chest", offsetY: -0.1, scale: 0.22 },
    },
    minAge: 3, maxAge: 12, status: "active",
  },
  {
    id: "balloons", name: "Balloon Bunch", description: "Up, up and away with your habits!",
    slot: "left_hand", rarity: "common", priceCoins: 35,
    supportedBodyFamilies: ["human-child", "round-animal", "robot", "small-animal", "tall-animal"],
    visualLayers: [{ assetUrl: `${A}/gear-balloons.png`, layerKey: "left_hand" }],
    thumbnailUrl: `${A}/gear-balloons.png`,
    transformByBodyFamily: {
      "human-child": { anchor: "leftHand", offsetY: -0.18, scale: 0.42 },
      "round-animal": { anchor: "leftHand", offsetY: -0.2, scale: 0.42 },
      "robot": { anchor: "leftHand", offsetY: -0.2, scale: 0.42 },
    },
    minAge: 3, maxAge: 9, status: "active",
  },

  // ── Explorer Set ───────────────────────────────────────────────────────────
  {
    id: "explorer-backpack", name: "Explorer Backpack", description: "Carry your adventure gear!",
    slot: "back", rarity: "uncommon", priceCoins: 60,
    supportedBodyFamilies: ["human-child", "round-animal", "robot", "small-animal", "tall-animal"],
    visualLayers: [{ assetUrl: `${A}/gear-explorer-backpack.png`, layerKey: "back" }],
    thumbnailUrl: `${A}/gear-explorer-backpack.png`,
    transformByBodyFamily: {
      "human-child": { anchor: "back", offsetY: 0.04, scale: 0.6 },
      "round-animal": { anchor: "back", offsetY: 0.02, scale: 0.68 },
      "robot": { anchor: "back", offsetY: 0.04, scale: 0.62 },
    },
    minAge: 4, maxAge: 12, status: "active",
  },
  {
    id: "monkey-pet", name: "Monkey Pal", description: "A playful jungle buddy!",
    slot: "pet", rarity: "rare", priceCoins: 130,
    supportedBodyFamilies: ["human-child", "round-animal", "robot", "small-animal", "tall-animal"],
    visualLayers: [{ assetUrl: `${A}/gear-monkey-pet.png`, layerKey: "pet" }],
    thumbnailUrl: `${A}/gear-monkey-pet.png`,
    transformByBodyFamily: {
      "human-child": { anchor: "pet", offsetY: 0.05, scale: 0.34 },
      "round-animal": { anchor: "pet", offsetY: 0.05, scale: 0.34 },
      "robot": { anchor: "pet", offsetY: 0.05, scale: 0.34 },
    },
    minAge: 3, maxAge: 9, status: "active",
  },

  // ── Space Set ──────────────────────────────────────────────────────────────
  {
    id: "space-helmet", name: "Space Helmet", description: "Blast off to the stars!",
    slot: "head", rarity: "rare", priceCoins: 110,
    supportedBodyFamilies: ["human-child", "round-animal", "robot", "small-animal", "tall-animal"],
    visualLayers: [{ assetUrl: `${A}/gear-space-helmet.png`, layerKey: "head" }],
    thumbnailUrl: `${A}/gear-space-helmet.png`,
    transformByBodyFamily: {
      "human-child": { anchor: "headCenter", offsetY: 0.02, scale: 0.56 },
      "round-animal": { anchor: "headCenter", offsetY: 0.0, scale: 0.68 },
      "robot": { anchor: "headCenter", offsetY: 0.0, scale: 0.6 },
    },
    minAge: 5, maxAge: 12, status: "active",
  },
  {
    id: "rocket-backpack", name: "Rocket Jetpack", description: "Zoom to the moon!",
    slot: "back", rarity: "epic", priceCoins: 150,
    supportedBodyFamilies: ["human-child", "round-animal", "robot", "small-animal", "tall-animal"],
    visualLayers: [{ assetUrl: `${A}/gear-rocket-backpack.png`, layerKey: "back" }],
    thumbnailUrl: `${A}/gear-rocket-backpack.png`,
    transformByBodyFamily: {
      "human-child": { anchor: "back", offsetY: 0.06, scale: 0.64 },
      "round-animal": { anchor: "back", offsetY: 0.04, scale: 0.72 },
      "robot": { anchor: "back", offsetY: 0.06, scale: 0.66 },
    },
    minAge: 5, maxAge: 12, status: "active",
  },
  {
    id: "robot-pet", name: "Robo Buddy", description: "Your loyal little droid!",
    slot: "pet", rarity: "rare", priceCoins: 130,
    supportedBodyFamilies: ["human-child", "round-animal", "robot", "small-animal", "tall-animal"],
    visualLayers: [{ assetUrl: `${A}/gear-robot-pet.png`, layerKey: "pet" }],
    thumbnailUrl: `${A}/gear-robot-pet.png`,
    transformByBodyFamily: {
      "human-child": { anchor: "pet", offsetY: 0.02, scale: 0.32 },
      "round-animal": { anchor: "pet", offsetY: 0.02, scale: 0.32 },
      "robot": { anchor: "pet", offsetY: 0.02, scale: 0.32 },
    },
    minAge: 6, maxAge: 12, status: "active",
  },
  {
    id: "star-aura", name: "Star Aura", description: "Shine bright like a superstar!",
    slot: "aura", rarity: "epic", priceCoins: 160,
    supportedBodyFamilies: ["human-child", "round-animal", "robot", "small-animal", "tall-animal"],
    visualLayers: [{ assetUrl: `${A}/gear-star-aura.png`, layerKey: "background_effect" }],
    thumbnailUrl: `${A}/gear-star-aura.png`,
    transformByBodyFamily: {
      "human-child": { anchor: "chest", offsetY: 0.02, scale: 1.0 },
      "round-animal": { anchor: "chest", offsetY: -0.1, scale: 1.0 },
      "robot": { anchor: "chest", offsetY: -0.1, scale: 1.0 },
    },
    minAge: 4, maxAge: 12, status: "active",
  },
  {
    id: "moon-boots", name: "Moon Boots", description: "One giant leap for habits!",
    slot: "shoes", rarity: "uncommon", priceCoins: 70,
    supportedBodyFamilies: ["human-child", "round-animal", "robot", "small-animal", "tall-animal"],
    visualLayers: [{ assetUrl: `${A}/gear-moon-boots.png`, layerKey: "shoes" }],
    thumbnailUrl: `${A}/gear-moon-boots.png`,
    transformByBodyFamily: {
      "human-child": { anchor: "feet", offsetY: -0.02, scale: 0.44 },
      "round-animal": { anchor: "feet", offsetY: -0.02, scale: 0.46 },
      "robot": { anchor: "feet", offsetY: -0.02, scale: 0.44 },
    },
    minAge: 5, maxAge: 12, status: "active",
  },

  // ── School Set ─────────────────────────────────────────────────────────────
  {
    id: "school-backpack", name: "School Backpack", description: "Ready for a day of learning!",
    slot: "back", rarity: "common", priceCoins: 45,
    supportedBodyFamilies: ["human-child", "round-animal", "robot", "small-animal", "tall-animal"],
    visualLayers: [{ assetUrl: `${A}/gear-school-backpack.png`, layerKey: "back" }],
    thumbnailUrl: `${A}/gear-school-backpack.png`,
    transformByBodyFamily: {
      "human-child": { anchor: "back", offsetY: 0.04, scale: 0.58 },
      "round-animal": { anchor: "back", offsetY: 0.02, scale: 0.66 },
      "robot": { anchor: "back", offsetY: 0.04, scale: 0.6 },
    },
    minAge: 4, maxAge: 12, status: "active",
  },
  {
    id: "story-book", name: "Story Book", description: "Adventures live inside every page!",
    slot: "right_hand", rarity: "common", priceCoins: 30,
    supportedBodyFamilies: ["human-child", "round-animal", "robot", "small-animal", "tall-animal"],
    visualLayers: [{ assetUrl: `${A}/gear-book.png`, layerKey: "right_hand" }],
    thumbnailUrl: `${A}/gear-book.png`,
    transformByBodyFamily: {
      "human-child": { anchor: "rightHand", offsetY: -0.02, scale: 0.3 },
      "round-animal": { anchor: "rightHand", offsetY: -0.02, scale: 0.3 },
      "robot": { anchor: "rightHand", offsetY: -0.02, scale: 0.3 },
    },
    minAge: 4, maxAge: 12, status: "active",
  },
];

export const GEAR_BY_ID: Record<string, GearItem> = Object.fromEntries(GEAR.map((g) => [g.id, g]));
export const AVATAR_BY_ID: Record<string, AvatarDefinition> = Object.fromEntries(AVATARS.map((a) => [a.id, a]));

/** Avatars appropriate for a child's age (age-range display, like games). */
export function avatarsForAge(age: number | null | undefined): AvatarDefinition[] {
  if (age == null) return AVATARS;
  return AVATARS.filter((a) => age >= a.minAge - 1 && age <= a.maxAge + 2);
}

// ── Freemium tiers ───────────────────────────────────────────────────────────
// One free starter hero per age band, plus two free gear items. Everything else
// is Premium (unlocked by a family subscription). Tuned here in one place.
export const FREE_AVATAR_IDS: ReadonlySet<string> = new Set([
  "friendly-panda",  // 3-6
  "human-explorer",  // 6-9
  "tiny-robot",      // 9-12
]);
export const FREE_GEAR_IDS: ReadonlySet<string> = new Set([
  "star-glasses",
  "explorer-hat",
]);

export function avatarTier(avatarId: string): "free" | "premium" {
  return FREE_AVATAR_IDS.has(avatarId) ? "free" : "premium";
}
export function gearTier(gearId: string): "free" | "premium" {
  return FREE_GEAR_IDS.has(gearId) ? "free" : "premium";
}

/** Is a gear item age-appropriate for a child? (small tolerance, like avatars). */
export function isGearForAge(g: GearItem, age: number | null | undefined): boolean {
  if (age == null) return true;
  const min = g.minAge ?? 0;
  const max = g.maxAge ?? 99;
  return age >= min - 1 && age <= max + 1;
}

/** Gear appropriate for a child's age, active only. */
export function gearForAge(age: number | null | undefined): GearItem[] {
  return GEAR.filter((g) => g.status !== "hidden" && g.status !== "retired" && isGearForAge(g, age));
}
