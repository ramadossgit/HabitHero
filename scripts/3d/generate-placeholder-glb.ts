// ─────────────────────────────────────────────────────────────────────────────
//  Offline tool: generate VALID placeholder .glb avatars + gear with correctly
//  named attachment sockets, so the whole interactive-3D system works end-to-end
//  today. These blocky primitives stand in for real Higgsfield→Blender art;
//  swap the .glb files (keeping node/socket names) and nothing else changes.
//
//  Run:  npx tsx scripts/3d/generate-placeholder-glb.ts
//  NOT a runtime dependency of the Express server.
// ─────────────────────────────────────────────────────────────────────────────
import { Document, NodeIO, type Material, type Mesh } from "@gltf-transform/core";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { AVATAR_SOCKETS, BACKPACK_SOCKETS } from "../../shared/avatar-3d";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../client/public/assets/3d");

type Vec3 = [number, number, number];

// Box geometry centered at origin with per-face normals (24 verts, 36 indices).
function boxArrays(w: number, h: number, d: number) {
  const x = w / 2, y = h / 2, z = d / 2;
  const faces: { n: Vec3; v: Vec3[] }[] = [
    { n: [1, 0, 0], v: [[x, -y, -z], [x, -y, z], [x, y, z], [x, y, -z]] },
    { n: [-1, 0, 0], v: [[-x, -y, z], [-x, -y, -z], [-x, y, -z], [-x, y, z]] },
    { n: [0, 1, 0], v: [[-x, y, -z], [x, y, -z], [x, y, z], [-x, y, z]] },
    { n: [0, -1, 0], v: [[-x, -y, z], [x, -y, z], [x, -y, -z], [-x, -y, -z]] },
    { n: [0, 0, 1], v: [[-x, -y, z], [-x, y, z], [x, y, z], [x, -y, z]] },
    { n: [0, 0, -1], v: [[x, -y, -z], [x, y, -z], [-x, y, -z], [-x, -y, -z]] },
  ];
  const pos: number[] = [], nor: number[] = [], idx: number[] = [];
  faces.forEach((f, i) => {
    f.v.forEach((vv) => { pos.push(...vv); nor.push(...f.n); });
    const b = i * 4;
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  return { pos: new Float32Array(pos), nor: new Float32Array(nor), idx: new Uint16Array(idx) };
}

export function makeGenerator() {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const io = new NodeIO();

  const material = (name: string, rgb: Vec3, rough = 0.85): Material =>
    doc.createMaterial(name).setBaseColorFactor([...rgb, 1]).setRoughnessFactor(rough).setMetallicFactor(0.05);

  function boxMesh(name: string, w: number, h: number, d: number, mat: Material): Mesh {
    const g = boxArrays(w, h, d);
    const pos = doc.createAccessor().setType("VEC3").setArray(g.pos).setBuffer(buffer);
    const nor = doc.createAccessor().setType("VEC3").setArray(g.nor).setBuffer(buffer);
    const idx = doc.createAccessor().setType("SCALAR").setArray(g.idx).setBuffer(buffer);
    const prim = doc.createPrimitive().setAttribute("POSITION", pos).setAttribute("NORMAL", nor).setIndices(idx).setMaterial(mat);
    return doc.createMesh(name).addPrimitive(prim);
  }
  return { doc, io, material, boxMesh };
}

async function write(doc: Document, io: NodeIO, outPath: string) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await io.write(outPath, doc);
  console.log("wrote", path.relative(ROOT, outPath));
}

// ── Avatar: human-explorer (blocky child figure ~1.2 m, Y-up, faces +Z) ──────
async function buildAvatar() {
  const { doc, io, material, boxMesh } = makeGenerator();
  const scene = doc.createScene("Scene");
  const root = doc.createNode("AvatarRoot");
  scene.addChild(root);
  const model = doc.createNode("AvatarModel");
  root.addChild(model);

  const skin = material("skin", [0.98, 0.82, 0.68]);
  const shirt = material("shirt", [0.85, 0.5, 0.25]);
  const pants = material("pants", [0.35, 0.4, 0.55]);
  const hair = material("hair", [0.25, 0.16, 0.1]);

  const parts: [string, ReturnType<typeof boxMesh>, Vec3][] = [
    ["Head", boxMesh("Head", 0.34, 0.34, 0.32, skin), [0, 1.02, 0]],
    ["Hair", boxMesh("Hair", 0.37, 0.16, 0.35, hair), [0, 1.16, -0.01]],
    ["Torso", boxMesh("Torso", 0.42, 0.42, 0.24, shirt), [0, 0.66, 0]],
    ["LeftArm", boxMesh("LeftArm", 0.12, 0.4, 0.14, skin), [0.3, 0.66, 0]],
    ["RightArm", boxMesh("RightArm", 0.12, 0.4, 0.14, skin), [-0.3, 0.66, 0]],
    ["LeftLeg", boxMesh("LeftLeg", 0.16, 0.42, 0.16, pants), [0.11, 0.22, 0]],
    ["RightLeg", boxMesh("RightLeg", 0.16, 0.42, 0.16, pants), [-0.11, 0.22, 0]],
  ];
  for (const [name, mesh, t] of parts) {
    model.addChild(doc.createNode(name).setMesh(mesh).setTranslation(t));
  }

  // Attachment sockets = named empty nodes (no mesh). Gear mounts here by name.
  const socketPos: Record<string, Vec3> = {
    HeadSocket: [0, 1.2, 0], GlassesSocket: [0, 1.03, 0.17], NeckSocket: [0, 0.86, 0.13],
    ChestSocket: [0, 0.72, 0.14], BackSocket: [0, 0.74, -0.14],
    LeftHandSocket: [0.3, 0.44, 0.02], RightHandSocket: [-0.3, 0.44, 0.02],
    LeftWristSocket: [0.3, 0.5, 0.02], RightWristSocket: [-0.3, 0.5, 0.02],
    LeftFootSocket: [0.11, 0.02, 0.03], RightFootSocket: [-0.11, 0.02, 0.03],
    PetSocket: [0.45, 0.0, 0.12], GroundSocket: [0, 0.0, 0],
  };
  for (const s of AVATAR_SOCKETS) {
    root.addChild(doc.createNode(s).setTranslation(socketPos[s] ?? [0, 0, 0]));
  }
  await write(doc, io, path.join(ROOT, "avatars/human-explorer/v1/human-explorer.glb"));
}

// ── Backpack (carries its own pocket/charm sockets so children mount on it) ──
async function buildBackpack(id: string, color: Vec3) {
  const { doc, io, material, boxMesh } = makeGenerator();
  const scene = doc.createScene("Scene");
  const root = doc.createNode("GearRoot");
  scene.addChild(root);
  const body = material("bag", color);
  const strap = material("strap", [color[0] * 0.7, color[1] * 0.7, color[2] * 0.7]);
  root.addChild(doc.createNode("BagBody").setMesh(boxMesh("BagBody", 0.34, 0.42, 0.18, body)).setTranslation([0, 0, -0.02]));
  root.addChild(doc.createNode("FrontPocket").setMesh(boxMesh("FrontPocket", 0.26, 0.2, 0.06, body)).setTranslation([0, -0.06, -0.11]));
  root.addChild(doc.createNode("LeftStrap").setMesh(boxMesh("LeftStrap", 0.05, 0.4, 0.05, strap)).setTranslation([0.14, 0.02, 0.14]));
  root.addChild(doc.createNode("RightStrap").setMesh(boxMesh("RightStrap", 0.05, 0.4, 0.05, strap)).setTranslation([-0.14, 0.02, 0.14]));
  const socketPos: Record<string, Vec3> = {
    BackpackLeftPocketSocket: [0.19, -0.08, -0.02], BackpackRightPocketSocket: [-0.19, -0.08, -0.02],
    BackpackCharmSocket: [0.1, -0.14, -0.14], BackpackKeychainSocket: [-0.1, -0.14, -0.14],
    BackpackLunchClipSocket: [0, -0.22, -0.02],
  };
  for (const s of BACKPACK_SOCKETS) root.addChild(doc.createNode(s).setTranslation(socketPos[s] ?? [0, 0, 0]));
  await write(doc, io, path.join(ROOT, `gear/backpacks/${id}/v1/${id}.glb`));
}

async function buildSimpleGear(dir: string, id: string, build: (g: ReturnType<typeof makeGenerator>, root: any) => void) {
  const g = makeGenerator();
  const scene = g.doc.createScene("Scene");
  const root = g.doc.createNode("GearRoot");
  scene.addChild(root);
  build(g, root);
  await write(g.doc, g.io, path.join(ROOT, `gear/${dir}/${id}/v1/${id}.glb`));
}

(async () => {
  await buildAvatar();
  await buildBackpack("classic-backpack", [0.2, 0.45, 0.8]);
  await buildBackpack("space-backpack", [0.55, 0.55, 0.6]);
  await buildBackpack("dino-backpack", [0.3, 0.65, 0.35]);

  await buildSimpleGear("bottles", "flip-bottle", ({ doc, material, boxMesh }, root) => {
    root.addChild(doc.createNode("BottleBody").setMesh(boxMesh("BottleBody", 0.09, 0.24, 0.09, material("bottle", [0.2, 0.7, 0.9]))));
    root.addChild(doc.createNode("BottleCap").setMesh(boxMesh("BottleCap", 0.07, 0.05, 0.07, material("cap", [0.95, 0.5, 0.3]))).setTranslation([0, 0.14, 0]));
    root.addChild(doc.createNode("BottleGripSocket").setTranslation([0, 0, 0]));
  });
  await buildSimpleGear("headwear", "school-cap", ({ doc, material, boxMesh }, root) => {
    root.addChild(doc.createNode("CapDome").setMesh(boxMesh("CapDome", 0.36, 0.16, 0.36, material("cap", [0.2, 0.4, 0.8]))));
    root.addChild(doc.createNode("CapBrim").setMesh(boxMesh("CapBrim", 0.34, 0.04, 0.2, material("brim", [0.15, 0.3, 0.6]))).setTranslation([0, -0.05, 0.24]));
  });
  await buildSimpleGear("shoes", "sneakers", ({ doc, material, boxMesh }, root) => {
    const c = material("shoe", [0.85, 0.25, 0.25]);
    root.addChild(doc.createNode("LeftShoe").setMesh(boxMesh("LeftShoe", 0.16, 0.1, 0.3, c)).setTranslation([0.11, 0, 0.05]));
    root.addChild(doc.createNode("RightShoe").setMesh(boxMesh("RightShoe", 0.16, 0.1, 0.3, c)).setTranslation([-0.11, 0, 0.05]));
  });
  await buildSimpleGear("charms", "star-charm", ({ doc, material, boxMesh }, root) => {
    root.addChild(doc.createNode("Charm").setMesh(boxMesh("Charm", 0.08, 0.08, 0.03, material("charm", [1.0, 0.8, 0.1]))));
  });
  console.log("\nPlaceholder .glb assets generated under client/public/assets/3d/");
})();
