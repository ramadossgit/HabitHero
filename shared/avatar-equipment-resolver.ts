// ─────────────────────────────────────────────────────────────────────────────
//  Habit Hero — 3D Equipment Resolver (shared, pure, deterministic)
//
//  Single source of equip/unequip rules for BOTH web and native. Never hardcode
//  these rules in UI components. Operates on Avatar3DState and returns a new
//  state plus a human-readable reason when an action is rejected.
// ─────────────────────────────────────────────────────────────────────────────
import {
  type Avatar3DState, type Avatar3DDefinition, type Gear3DMetadata,
  type Equipped3D, type EquippedEntry, type EquipmentSlot, type WaterBottlePosition,
  BACKPACK_CHILD_SLOTS, isGear3DCompatible,
} from "./avatar-3d";

export interface EquipResult {
  ok: boolean;
  state: Avatar3DState;
  reason?: string;
}

type Catalog = Record<string, Gear3DMetadata>;

const clone = (s: Avatar3DState): Avatar3DState => ({
  ...s,
  equipped: { ...s.equipped },
  hidden: { ...s.hidden },
});

const bump = (s: Avatar3DState): Avatar3DState => {
  s.version += 1;
  s.updatedAt = new Date().toISOString();
  return s;
};

/** Slots hidden (and later restored) when a full outfit is worn. */
const FULL_OUTFIT_HIDES: EquipmentSlot[] = ["top", "bottom", "jacket"];

/** Equip a gear item. Server must have already confirmed `owned`. */
export function equipGear(
  state: Avatar3DState,
  gear: Gear3DMetadata,
  avatar: Pick<Avatar3DDefinition, "id" | "bodyFamily">,
  owned: ReadonlySet<string>,
  opts: { position?: WaterBottlePosition; catalog: Catalog },
): EquipResult {
  const { catalog } = opts;

  if (!owned.has(gear.shopItemId) && !owned.has(gear.id)) {
    return { ok: false, state, reason: "You don't own this yet." };
  }
  if (!isGear3DCompatible(gear, avatar)) {
    return { ok: false, state, reason: "This gear doesn't fit this hero yet." };
  }

  // Water bottle in a backpack pocket requires a backpack to be equipped.
  let position = opts.position;
  if (gear.slot === "water_bottle") {
    position = position ?? "right_hand";
    if (position === "left_backpack_pocket" || position === "right_backpack_pocket") {
      if (!state.equipped.backpack) {
        return { ok: false, state, reason: "Equip a backpack first to use its pocket." };
      }
    }
  }

  // Gear that mounts onto a parent (charm/keychain/lunch bag → backpack).
  if (gear.requiredParentSlot && !state.equipped[gear.requiredParentSlot]) {
    return { ok: false, state, reason: `Equip a ${gear.requiredParentSlot.replace("_", " ")} first.` };
  }

  const next = clone(state);

  // Same-slot replacement is implicit (we overwrite the slot below).
  // Explicit cross-slot conflicts:
  for (const c of gear.conflictsWith ?? []) {
    delete next.equipped[c];
  }

  // Full outfit hides top/bottom/jacket; stash them so removal restores them.
  if (gear.slot === "full_outfit") {
    for (const s of FULL_OUTFIT_HIDES) {
      if (next.equipped[s]) { next.hidden[s] = next.equipped[s]; delete next.equipped[s]; }
    }
  }
  // Putting on a top/bottom/jacket while a full outfit is worn removes the outfit.
  if (FULL_OUTFIT_HIDES.includes(gear.slot) && next.equipped.full_outfit) {
    delete next.equipped.full_outfit;
  }

  const entry: EquippedEntry = { gearId: gear.id };
  if (gear.slot === "water_bottle") entry.position = position;
  next.equipped[gear.slot] = entry;

  return { ok: true, state: bump(next) };
}

/** Remove a slot. Removing a backpack detaches its children; removing a full
 *  outfit restores the previously hidden top/bottom/jacket. */
export function unequipSlot(
  state: Avatar3DState,
  slot: EquipmentSlot,
  catalog: Catalog,
): EquipResult {
  if (!state.equipped[slot]) return { ok: true, state };
  const next = clone(state);
  delete next.equipped[slot];

  // Backpack removed → any bottle sitting in a pocket, plus charm/keychain/lunch
  // bag, return to inventory (unequipped). Ownership is untouched.
  if (slot === "backpack") {
    for (const child of BACKPACK_CHILD_SLOTS) delete next.equipped[child];
    const bottle = next.equipped.water_bottle;
    if (bottle?.position === "left_backpack_pocket" || bottle?.position === "right_backpack_pocket") {
      delete next.equipped.water_bottle;
    }
  }

  // Full outfit removed → restore whatever it was hiding.
  if (slot === "full_outfit") {
    for (const s of FULL_OUTFIT_HIDES) {
      if (next.hidden[s]) { next.equipped[s] = next.hidden[s]; delete next.hidden[s]; }
    }
  }

  return { ok: true, state: bump(next) };
}

/** Replace whatever is in `gear`'s slot with `gear` (equip is already a replace,
 *  this is a named convenience for the UI's "replace" action). */
export function replaceGear(
  state: Avatar3DState,
  gear: Gear3DMetadata,
  avatar: Pick<Avatar3DDefinition, "id" | "bodyFamily">,
  owned: ReadonlySet<string>,
  opts: { position?: WaterBottlePosition; catalog: Catalog },
): EquipResult {
  return equipGear(state, gear, avatar, owned, opts);
}

/** Drop any equipped gear that isn't compatible with a newly chosen avatar. */
export function reconcileForAvatar(
  state: Avatar3DState,
  avatar: Pick<Avatar3DDefinition, "id" | "bodyFamily">,
  catalog: Catalog,
): Avatar3DState {
  const next = clone(state);
  next.avatarId = avatar.id;
  for (const [slot, entry] of Object.entries(next.equipped)) {
    if (!entry) continue;
    const gear = catalog[entry.gearId];
    if (!gear || !isGear3DCompatible(gear, avatar)) delete next.equipped[slot];
  }
  return bump(next);
}

/** Flatten equipped state into an ordered mount list for the renderer:
 *  each item resolved to its gear + parent (backpack children mount on backpack). */
export interface MountInstruction {
  slot: EquipmentSlot;
  gear: Gear3DMetadata;
  position?: WaterBottlePosition;
  /** parent gear id if this mounts onto another gear (e.g. bottle in pocket). */
  parentGearId?: string;
}

export function buildMountList(state: Avatar3DState, catalog: Catalog): MountInstruction[] {
  const out: MountInstruction[] = [];
  const backpack = state.equipped.backpack;
  for (const [slot, entry] of Object.entries(state.equipped) as [EquipmentSlot, EquippedEntry][]) {
    if (!entry) continue;
    const gear = catalog[entry.gearId];
    if (!gear) continue;
    const m: MountInstruction = { slot, gear, position: entry.position };
    const pocket = entry.position === "left_backpack_pocket" || entry.position === "right_backpack_pocket";
    if ((BACKPACK_CHILD_SLOTS.includes(slot) || (slot === "water_bottle" && pocket)) && backpack) {
      m.parentGearId = backpack.gearId;
    }
    out.push(m);
  }
  return out;
}
