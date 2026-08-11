// ─────────────────────────────────────────────────────────────────────────────
//  GLB validator (§30). Rejects assets that would break the runtime viewer or
//  blow the mobile performance budget BEFORE they can be published.
//
//  Run:  npm run 3d:validate            (validates every .glb under assets/3d)
//        npm run 3d:validate -- <file>  (validate one file)
// ─────────────────────────────────────────────────────────────────────────────
import { NodeIO, type Document } from "@gltf-transform/core";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { AVATAR_SOCKETS } from "../shared/avatar-3d";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSET_ROOT = path.resolve(__dirname, "../client/public/assets/3d");

// Mobile performance budgets (§28).
const BUDGET = {
  avatar: { maxTris: 30000, maxMaterials: 4 },
  gear: { maxTris: 8000, maxMaterials: 3 },
};

interface Report { file: string; kind: "avatar" | "gear"; tris: number; materials: number; errors: string[]; warnings: string[]; }

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : p.endsWith(".glb") ? [p] : [];
  });
}

async function validate(file: string): Promise<Report> {
  const kind: Report["kind"] = file.includes(`${path.sep}avatars${path.sep}`) ? "avatar" : "gear";
  const r: Report = { file, kind, tris: 0, materials: 0, errors: [], warnings: [] };
  let doc: Document;
  try {
    doc = await new NodeIO().read(file);
  } catch (e) {
    r.errors.push(`Not a valid GLB / glTF 2.0 container: ${(e as Error).message}`);
    return r;
  }
  const rootList = doc.getRoot();
  const scenes = rootList.listScenes();
  if (scenes.length === 0) r.errors.push("No scene.");

  const meshes = rootList.listMeshes();
  if (meshes.length === 0) r.errors.push("No mesh geometry (not a real 3D model).");
  for (const mesh of meshes) {
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      const pos = prim.getAttribute("POSITION");
      if (!pos) r.errors.push(`Primitive in "${mesh.getName()}" has no POSITION.`);
      if (!prim.getAttribute("NORMAL")) r.warnings.push(`"${mesh.getName()}" has no NORMAL (flat shading).`);
      r.tris += (idx ? idx.getCount() : (pos?.getCount() ?? 0)) / 3;
    }
  }
  r.materials = rootList.listMaterials().length;

  // Missing textures referenced by materials.
  for (const tex of rootList.listTextures()) {
    if (!tex.getImage() || (tex.getImage() as Uint8Array).byteLength === 0) {
      r.errors.push(`Texture "${tex.getName() || "(unnamed)"}" has no image data.`);
    }
  }

  const nodeNames = new Set(rootList.listNodes().map((n) => n.getName()).filter(Boolean));
  // Duplicate node names break name-based socket lookup.
  const seen = new Set<string>();
  for (const n of rootList.listNodes()) {
    const nm = n.getName();
    if (nm && seen.has(nm)) r.errors.push(`Duplicate node name "${nm}".`);
    if (nm) seen.add(nm);
  }

  if (kind === "avatar") {
    const required = ["HeadSocket", "BackSocket", "LeftHandSocket", "RightHandSocket", "GroundSocket"];
    for (const s of required) if (!nodeNames.has(s)) r.errors.push(`Avatar missing required socket "${s}".`);
    // Non-fatal: report any of the full socket set that's absent.
    const missing = AVATAR_SOCKETS.filter((s) => !nodeNames.has(s));
    if (missing.length) r.warnings.push(`Missing optional sockets: ${missing.join(", ")}.`);
  }

  const budget = BUDGET[kind];
  if (r.tris > budget.maxTris) r.errors.push(`Triangle count ${r.tris} exceeds ${kind} budget ${budget.maxTris}.`);
  if (r.materials > budget.maxMaterials) r.warnings.push(`Material count ${r.materials} over ${kind} budget ${budget.maxMaterials}.`);
  if (rootList.listCameras().length) r.warnings.push("Contains cameras (should be stripped).");

  return r;
}

(async () => {
  const arg = process.argv[2];
  const files = arg ? [path.resolve(arg)] : walk(ASSET_ROOT);
  if (files.length === 0) { console.log("No .glb files found under", ASSET_ROOT); return; }
  let failed = 0;
  for (const f of files) {
    const r = await validate(f);
    const rel = path.relative(ASSET_ROOT, f);
    if (r.errors.length) {
      failed++;
      console.log(`\n❌ ${rel}  [${r.kind}] tris=${r.tris} mats=${r.materials}`);
      r.errors.forEach((e) => console.log("   ERROR:", e));
    } else {
      console.log(`✅ ${rel}  [${r.kind}] tris=${r.tris} mats=${r.materials}`);
    }
    r.warnings.forEach((w) => console.log("   warn:", w));
  }
  console.log(`\n${files.length - failed}/${files.length} passed.`);
  if (failed) process.exit(1);
})();
