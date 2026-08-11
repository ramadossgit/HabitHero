// ─────────────────────────────────────────────────────────────────────────────
//  Habit Hero — Interactive 3D Avatar & Modular Gear (shared types)
//
//  This is the 3D counterpart to the 2D layered system in avatar-system.ts.
//  Core principle (same as 2D): the avatar is a permanent base model; gear are
//  independent .glb models attached to NAMED SOCKETS on the avatar. Changing
//  gear never regenerates the avatar — it only mounts/unmounts child models.
//  Nothing here is web- or native-specific, so web + Expo share it.
// ─────────────────────────────────────────────────────────────────────────────

export type AvatarBodyFamily =
  | "human-child"
  | "small-animal"
  | "round-animal"
  | "robot"
  | "fantasy";

export type EquipmentSlot =
  | "headwear"
  | "eyewear"
  | "top"
  | "bottom"
  | "full_outfit"
  | "jacket"
  | "shoes"
  | "backpack"
  | "water_bottle"
  | "lunch_bag"
  | "left_hand_item"
  | "right_hand_item"
  | "left_wrist"
  | "right_wrist"
  | "id_card"
  | "backpack_charm"
  | "keychain"
  | "pet";

/** Where a water bottle can live once owned + equipped. */
export type WaterBottlePosition =
  | "left_backpack_pocket"
  | "right_backpack_pocket"
  | "left_hand"
  | "right_hand";

export type Vector3Tuple = [number, number, number];

export interface GearTransform3D {
  position: Vector3Tuple;
  rotation: Vector3Tuple; // Euler radians
  scale: Vector3Tuple;
}

export const IDENTITY_TRANSFORM: GearTransform3D = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

// ── Socket + skeleton naming (shared across Blender, web, native) ────────────
// One convention everywhere so gear attaches by name, never by hardcoded index.
export const AVATAR_SOCKETS = [
  "HeadSocket", "GlassesSocket", "NeckSocket", "ChestSocket", "BackSocket",
  "LeftHandSocket", "RightHandSocket", "LeftWristSocket", "RightWristSocket",
  "LeftFootSocket", "RightFootSocket", "PetSocket", "GroundSocket",
] as const;

export const BACKPACK_SOCKETS = [
  "BackpackLeftPocketSocket", "BackpackRightPocketSocket",
  "BackpackCharmSocket", "BackpackKeychainSocket", "BackpackLunchClipSocket",
] as const;

export type AvatarSocket = (typeof AVATAR_SOCKETS)[number];
export type BackpackSocket = (typeof BACKPACK_SOCKETS)[number];
export type SocketName = AvatarSocket | BackpackSocket | (string & {});

/** Which socket each slot mounts to by default. */
export const SLOT_PRIMARY_SOCKET: Record<EquipmentSlot, SocketName> = {
  headwear: "HeadSocket",
  eyewear: "GlassesSocket",
  top: "ChestSocket",
  bottom: "GroundSocket",
  full_outfit: "ChestSocket",
  jacket: "ChestSocket",
  shoes: "GroundSocket",
  backpack: "BackSocket",
  water_bottle: "RightHandSocket", // default; pocket positions override
  lunch_bag: "BackpackLunchClipSocket",
  left_hand_item: "LeftHandSocket",
  right_hand_item: "RightHandSocket",
  left_wrist: "LeftWristSocket",
  right_wrist: "RightWristSocket",
  id_card: "NeckSocket",
  backpack_charm: "BackpackCharmSocket",
  keychain: "BackpackKeychainSocket",
  pet: "PetSocket",
};

/** Slots whose gear mounts onto the equipped BACKPACK, not the avatar body. */
export const BACKPACK_CHILD_SLOTS: EquipmentSlot[] = [
  "lunch_bag", "backpack_charm", "keychain",
];

export interface Avatar3DDefinition {
  id: string;
  name: string;
  bodyFamily: AvatarBodyFamily;
  modelUrl: string;
  thumbnailUrl: string;
  skeletonProfile: string;
  defaultAnimation: string;
  availableAnimations: string[];
  supportedSlots: EquipmentSlot[];
  minAge?: number;
  maxAge?: number;
  active: boolean;
}

export interface Gear3DMetadata {
  id: string;
  shopItemId: string; // reuse existing avatar_shop_items id — never a 2nd source of truth
  name: string;
  slot: EquipmentSlot;
  modelUrl: string;
  thumbnailUrl: string;
  previewVideoUrl?: string;

  primarySocket: SocketName;
  alternativeSockets?: SocketName[];

  supportedBodyFamilies: AvatarBodyFamily[];
  compatibleAvatarIds?: string[];
  excludedAvatarIds?: string[];

  defaultTransform: GearTransform3D;
  bodyFamilyTransforms?: Partial<Record<AvatarBodyFamily, GearTransform3D>>;
  avatarTransforms?: Record<string, GearTransform3D>;

  /** For gear that mounts onto a parent (e.g. bottle → backpack pocket). */
  requiredParentSlot?: EquipmentSlot;
  supportedChildSlots?: EquipmentSlot[];

  conflictsWith?: EquipmentSlot[];
  hiddenAvatarMeshes?: string[];

  triangleCount: number;
  materialCount: number;
  estimatedTextureMemoryBytes: number;

  minAge?: number;
  maxAge?: number;
  active: boolean;
}

/** One equipped entry: the gear id plus an optional position (for bottles). */
export interface EquippedEntry {
  gearId: string;
  position?: WaterBottlePosition;
}

export interface Equipped3D {
  [slot: string]: EquippedEntry | undefined;
}

/** Persisted per-child 3D avatar state (mirrors child_avatar_state row). */
export interface Avatar3DState {
  avatarId: string;
  equipped: Equipped3D;
  hidden: Equipped3D; // gear temporarily removed by a conflict, restored later
  version: number;
  updatedAt: string;
}

export function emptyAvatar3DState(avatarId: string): Avatar3DState {
  return { avatarId, equipped: {}, hidden: {}, version: 1, updatedAt: new Date().toISOString() };
}

/** Resolve the transform for a gear on a specific avatar (avatar > family > default). */
export function resolveGearTransform(
  gear: Gear3DMetadata,
  avatar: Pick<Avatar3DDefinition, "id" | "bodyFamily">,
): GearTransform3D {
  return (
    gear.avatarTransforms?.[avatar.id] ??
    gear.bodyFamilyTransforms?.[avatar.bodyFamily] ??
    gear.defaultTransform
  );
}

export function isGear3DCompatible(
  gear: Gear3DMetadata,
  avatar: Pick<Avatar3DDefinition, "id" | "bodyFamily">,
): boolean {
  if (gear.excludedAvatarIds?.includes(avatar.id)) return false;
  if (gear.compatibleAvatarIds && !gear.compatibleAvatarIds.includes(avatar.id)) return false;
  return gear.supportedBodyFamilies.includes(avatar.bodyFamily);
}
