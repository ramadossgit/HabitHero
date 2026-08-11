// Demo 3D catalog for the placeholder .glb assets. In production this data comes
// from the DB (avatar_3d_models / avatar_gear_3d_metadata) via the API; the shape
// is identical so the viewer/resolver don't change when the source swaps.
import {
  type Avatar3DDefinition, type Gear3DMetadata, IDENTITY_TRANSFORM,
} from "@shared/avatar-3d";

const A = "/assets/3d";

export const AVATARS_3D: Avatar3DDefinition[] = [
  {
    id: "human-explorer", name: "Human Explorer", bodyFamily: "human-child",
    modelUrl: `${A}/avatars/human-explorer/v1/human-explorer.glb`,
    thumbnailUrl: "/avatars/generated/explorer.png",
    skeletonProfile: "humanoid-v1", defaultAnimation: "idle", availableAnimations: [],
    supportedSlots: ["headwear", "backpack", "water_bottle", "shoes", "left_hand_item", "right_hand_item", "backpack_charm", "pet"],
    active: true,
  },
];

function g(o: Partial<Gear3DMetadata> & Pick<Gear3DMetadata, "id" | "slot" | "name" | "modelUrl" | "primarySocket">): Gear3DMetadata {
  return {
    shopItemId: o.id!, thumbnailUrl: "", supportedBodyFamilies: ["human-child"],
    defaultTransform: IDENTITY_TRANSFORM, triangleCount: 0, materialCount: 1,
    estimatedTextureMemoryBytes: 0, active: true, ...o,
  } as Gear3DMetadata;
}

export const GEAR_3D: Gear3DMetadata[] = [
  g({ id: "classic-backpack", name: "Classic School Backpack", slot: "backpack", primarySocket: "BackSocket",
    modelUrl: `${A}/gear/backpacks/classic-backpack/v1/classic-backpack.glb`,
    defaultTransform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } }),
  g({ id: "space-backpack", name: "Space Explorer Backpack", slot: "backpack", primarySocket: "BackSocket",
    modelUrl: `${A}/gear/backpacks/space-backpack/v1/space-backpack.glb`,
    defaultTransform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } }),
  g({ id: "dino-backpack", name: "Dinosaur Adventure Backpack", slot: "backpack", primarySocket: "BackSocket",
    modelUrl: `${A}/gear/backpacks/dino-backpack/v1/dino-backpack.glb`,
    defaultTransform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } }),
  g({ id: "flip-bottle", name: "Classic Flip-Top Bottle", slot: "water_bottle", primarySocket: "RightHandSocket",
    modelUrl: `${A}/gear/bottles/flip-bottle/v1/flip-bottle.glb`,
    defaultTransform: { position: [0, 0.12, 0.04], rotation: [0, 0, 0], scale: [1, 1, 1] } }),
  g({ id: "school-cap", name: "School Cap", slot: "headwear", primarySocket: "HeadSocket",
    modelUrl: `${A}/gear/headwear/school-cap/v1/school-cap.glb`,
    defaultTransform: { position: [0, -0.02, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } }),
  g({ id: "sneakers", name: "Sneakers", slot: "shoes", primarySocket: "GroundSocket",
    modelUrl: `${A}/gear/shoes/sneakers/v1/sneakers.glb`,
    defaultTransform: { position: [0, 0.05, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } }),
  g({ id: "star-charm", name: "Star Charm", slot: "backpack_charm", primarySocket: "BackpackCharmSocket",
    requiredParentSlot: "backpack",
    modelUrl: `${A}/gear/charms/star-charm/v1/star-charm.glb`,
    defaultTransform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } }),
];

export const GEAR_3D_BY_ID: Record<string, Gear3DMetadata> = Object.fromEntries(GEAR_3D.map((x) => [x.id, x]));
export const AVATAR_3D_BY_ID: Record<string, Avatar3DDefinition> = Object.fromEntries(AVATARS_3D.map((x) => [x.id, x]));

/** Per-position socket + local transform for a water bottle. */
export const BOTTLE_POSITIONS: Record<string, { socket: string; onBackpack: boolean; transform: import("@shared/avatar-3d").GearTransform3D }> = {
  right_hand: { socket: "RightHandSocket", onBackpack: false, transform: { position: [0, 0.12, 0.04], rotation: [0, 0, 0], scale: [1, 1, 1] } },
  left_hand: { socket: "LeftHandSocket", onBackpack: false, transform: { position: [0, 0.12, 0.04], rotation: [0, 0, 0], scale: [1, 1, 1] } },
  left_backpack_pocket: { socket: "BackpackLeftPocketSocket", onBackpack: true, transform: { position: [0, 0.08, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } },
  right_backpack_pocket: { socket: "BackpackRightPocketSocket", onBackpack: true, transform: { position: [0, 0.08, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } },
};
