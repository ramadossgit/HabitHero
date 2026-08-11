// Dev-only: composite avatar + gear the SAME way <AvatarRenderer/> does, using
// the real catalog transforms, so we can visually check alignment/"realism".
// Run: npx tsx scripts/preview-composite.ts
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AVATAR_BY_ID, GEAR_BY_ID, buildRenderLayers, type EquippedItems,
} from "../shared/avatar-system";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, "../client/public");
const OUT = path.resolve(__dirname, "../.preview");
const SIZE = 512; // render size (renderer uses fractions of canvas, so any size works)

const toDisk = (assetUrl: string) => path.join(PUBLIC, assetUrl);

async function layer(assetUrl: string, sPx: number, leftPx: number, topPx: number) {
  const s = Math.round(sPx);
  let buf = await sharp(toDisk(assetUrl))
    .resize(s, s, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toBuffer();
  let left = Math.round(leftPx), top = Math.round(topPx);
  const cropL = left < 0 ? -left : 0;
  const cropT = top < 0 ? -top : 0;
  if (cropL || cropT) {
    const w = s - cropL, h = s - cropT;
    if (w <= 0 || h <= 0) return null;
    buf = await sharp(buf).extract({ left: cropL, top: cropT, width: w, height: h }).png().toBuffer();
    left = Math.max(0, left); top = Math.max(0, top);
  }
  if (left >= SIZE || top >= SIZE) return null;
  return { input: buf, left, top };
}

async function renderCombo(avatarId: string, equipped: EquippedItems, file: string) {
  const avatar = AVATAR_BY_ID[avatarId];
  const layers = buildRenderLayers(avatar, equipped, GEAR_BY_ID);
  const composites = [];
  // Composite ALL layers in z-order (matching the app's z-index), so back-layer
  // gear (backpacks, jetpacks, auras) correctly renders BEHIND the base body.
  for (const l of layers) {
    if (!l.transform) {
      // base body (or any transform-less layer) fills the frame
      const full = await sharp(toDisk(l.assetUrl))
        .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png().toBuffer();
      composites.push({ input: full, left: 0, top: 0 });
      continue;
    }
    const t = l.transform;
    const a = avatar.anchors[t.anchor];
    const s = (t.scale ?? 0.4) * SIZE;
    const cx = (a.x + (t.offsetX ?? 0)) * SIZE;
    const cy = (a.y + (t.offsetY ?? 0)) * SIZE;
    const comp = await layer(l.assetUrl, s, cx - s / 2, cy - s / 2);
    if (comp) composites.push(comp);
  }
  const canvas = await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 245, g: 240, b: 255, alpha: 1 } } }).png().toBuffer();
  await sharp(canvas).composite(composites).png().toFile(path.join(OUT, file));
  console.log("wrote", file, "layers:", composites.length);
}

const combos: [string, EquippedItems, string][] = [
  ["human-explorer", { head: "explorer-hat", back: "explorer-backpack", pet: "monkey-pet", right_hand: "story-book" }, "explorer-set.png"],
  ["tiny-robot", { head: "space-helmet", back: "rocket-backpack", pet: "robot-pet", aura: "star-aura", shoes: "moon-boots" }, "space-set.png"],
  ["super-kid", { head: "baseball-cap", back: "school-backpack", right_hand: "story-book", shoes: "rocket-sneakers" }, "school-set.png"],
  ["friendly-panda", { head: "space-helmet", aura: "star-aura", pet: "monkey-pet" }, "panda-space.png"],
  ["sporty-girl", { back: "explorer-backpack", shoes: "moon-boots", pet: "robot-pet", eyes: "heart-glasses" }, "sporty-mix.png"],
];

(async () => {
  await sharp({ create: { width: 1, height: 1, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }); // warm up
  const fs = await import("node:fs");
  fs.mkdirSync(OUT, { recursive: true });
  for (const [a, e, f] of combos) await renderCombo(a, e, f);
  // Build one contact sheet for easy viewing
  const files = combos.map((c) => c[2]);
  const tiles = await Promise.all(files.map((f) => sharp(path.join(OUT, f)).resize(320, 320).png().toBuffer()));
  const cols = files.length;
  await sharp({ create: { width: 320 * cols, height: 320, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .composite(tiles.map((input, i) => ({ input, left: i * 320, top: 0 })))
    .png().toFile(path.join(OUT, "_contact-sheet.png"));
  console.log("wrote _contact-sheet.png");
})();
