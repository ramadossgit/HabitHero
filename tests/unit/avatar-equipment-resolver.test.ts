import { describe, it, expect } from "vitest";
import {
  equipGear, unequipSlot, reconcileForAvatar, buildMountList,
} from "../../shared/avatar-equipment-resolver";
import {
  emptyAvatar3DState, IDENTITY_TRANSFORM,
  type Gear3DMetadata, type Avatar3DDefinition,
} from "../../shared/avatar-3d";

const avatar: Pick<Avatar3DDefinition, "id" | "bodyFamily"> = {
  id: "human-explorer", bodyFamily: "human-child",
};

function gear(id: string, slot: Gear3DMetadata["slot"], extra: Partial<Gear3DMetadata> = {}): Gear3DMetadata {
  return {
    id, shopItemId: id, name: id, slot,
    modelUrl: `/x/${id}.glb`, thumbnailUrl: `/x/${id}.webp`,
    primarySocket: "BackSocket",
    supportedBodyFamilies: ["human-child"],
    defaultTransform: IDENTITY_TRANSFORM,
    triangleCount: 100, materialCount: 1, estimatedTextureMemoryBytes: 0,
    active: true, ...extra,
  };
}

const catalog: Record<string, Gear3DMetadata> = {
  "classic-backpack": gear("classic-backpack", "backpack"),
  "space-backpack": gear("space-backpack", "backpack"),
  "flip-bottle": gear("flip-bottle", "water_bottle"),
  "school-cap": gear("school-cap", "headwear"),
  "hoodie": gear("hoodie", "jacket"),
  "space-suit": gear("space-suit", "full_outfit"),
  "dragon-gear": gear("dragon-gear", "headwear", { supportedBodyFamilies: ["fantasy"] }),
  "charm": gear("charm", "backpack_charm", { requiredParentSlot: "backpack" }),
};
const owned = new Set(Object.keys(catalog));

describe("equipGear", () => {
  it("rejects gear the child does not own", () => {
    const r = equipGear(emptyAvatar3DState(avatar.id), catalog["school-cap"], avatar, new Set(), { catalog });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/don't own/i);
  });

  it("rejects gear incompatible with the body family", () => {
    const r = equipGear(emptyAvatar3DState(avatar.id), catalog["dragon-gear"], avatar, owned, { catalog });
    expect(r.ok).toBe(false);
  });

  it("equips a compatible owned item", () => {
    const r = equipGear(emptyAvatar3DState(avatar.id), catalog["school-cap"], avatar, owned, { catalog });
    expect(r.ok).toBe(true);
    expect(r.state.equipped.headwear?.gearId).toBe("school-cap");
    expect(r.state.version).toBe(2);
  });

  it("replaces same-slot gear (new backpack replaces old)", () => {
    let s = emptyAvatar3DState(avatar.id);
    s = equipGear(s, catalog["classic-backpack"], avatar, owned, { catalog }).state;
    s = equipGear(s, catalog["space-backpack"], avatar, owned, { catalog }).state;
    expect(s.equipped.backpack?.gearId).toBe("space-backpack");
  });

  it("blocks a bottle in a backpack pocket when no backpack is worn", () => {
    const r = equipGear(emptyAvatar3DState(avatar.id), catalog["flip-bottle"], avatar, owned, { catalog, position: "left_backpack_pocket" });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/backpack/i);
  });

  it("allows a bottle in a pocket once a backpack is worn", () => {
    let s = equipGear(emptyAvatar3DState(avatar.id), catalog["classic-backpack"], avatar, owned, { catalog }).state;
    const r = equipGear(s, catalog["flip-bottle"], avatar, owned, { catalog, position: "right_backpack_pocket" });
    expect(r.ok).toBe(true);
    expect(r.state.equipped.water_bottle?.position).toBe("right_backpack_pocket");
  });

  it("requires a parent for backpack-child gear (charm)", () => {
    const r = equipGear(emptyAvatar3DState(avatar.id), catalog["charm"], avatar, owned, { catalog });
    expect(r.ok).toBe(false);
  });
});

describe("full outfit hide/restore", () => {
  it("hides top/jacket when a full outfit is equipped and restores on removal", () => {
    let s = emptyAvatar3DState(avatar.id);
    s = equipGear(s, catalog["hoodie"], avatar, owned, { catalog }).state;
    expect(s.equipped.jacket?.gearId).toBe("hoodie");
    s = equipGear(s, catalog["space-suit"], avatar, owned, { catalog }).state;
    expect(s.equipped.jacket).toBeUndefined();     // hidden
    expect(s.equipped.full_outfit?.gearId).toBe("space-suit");
    s = unequipSlot(s, "full_outfit", catalog).state;
    expect(s.equipped.full_outfit).toBeUndefined();
    expect(s.equipped.jacket?.gearId).toBe("hoodie"); // restored
  });
});

describe("unequip backpack detaches children", () => {
  it("returns a pocket bottle to inventory when the backpack is removed", () => {
    let s = equipGear(emptyAvatar3DState(avatar.id), catalog["classic-backpack"], avatar, owned, { catalog }).state;
    s = equipGear(s, catalog["flip-bottle"], avatar, owned, { catalog, position: "left_backpack_pocket" }).state;
    expect(s.equipped.water_bottle).toBeDefined();
    s = unequipSlot(s, "backpack", catalog).state;
    expect(s.equipped.backpack).toBeUndefined();
    expect(s.equipped.water_bottle).toBeUndefined(); // detached
  });

  it("keeps an in-hand bottle when the backpack is removed", () => {
    let s = equipGear(emptyAvatar3DState(avatar.id), catalog["classic-backpack"], avatar, owned, { catalog }).state;
    s = equipGear(s, catalog["flip-bottle"], avatar, owned, { catalog, position: "left_hand" }).state;
    s = unequipSlot(s, "backpack", catalog).state;
    expect(s.equipped.water_bottle?.position).toBe("left_hand"); // stays in hand
  });
});

describe("reconcileForAvatar", () => {
  it("drops gear incompatible with the newly chosen avatar", () => {
    let s = equipGear(emptyAvatar3DState(avatar.id), catalog["school-cap"], avatar, owned, { catalog }).state;
    const dragon = { id: "dragon-hero", bodyFamily: "fantasy" as const };
    s = reconcileForAvatar(s, dragon, catalog);
    expect(s.avatarId).toBe("dragon-hero");
    expect(s.equipped.headwear).toBeUndefined();
  });
});

describe("buildMountList", () => {
  it("parents a pocket bottle onto the backpack", () => {
    let s = equipGear(emptyAvatar3DState(avatar.id), catalog["classic-backpack"], avatar, owned, { catalog }).state;
    s = equipGear(s, catalog["flip-bottle"], avatar, owned, { catalog, position: "right_backpack_pocket" }).state;
    const mounts = buildMountList(s, catalog);
    const bottle = mounts.find((m) => m.slot === "water_bottle")!;
    expect(bottle.parentGearId).toBe("classic-backpack");
  });
});
