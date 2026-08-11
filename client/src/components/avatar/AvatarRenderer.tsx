// Modular avatar compositor: stacks a permanent base body with independent,
// transparent gear overlays by z-order and anchor-based transforms. Changing
// gear only toggles layers — the avatar image is never regenerated or flattened.
import { useMemo } from "react";
import {
  buildRenderLayers, type AvatarDefinition, type EquippedItems, type GearItem,
} from "@shared/avatar-system";

export default function AvatarRenderer({
  avatar,
  equipped,
  catalog,
  size = 260,
  className = "",
}: {
  avatar: AvatarDefinition;
  equipped: EquippedItems;
  catalog: Record<string, GearItem>;
  size?: number;
  className?: string;
}) {
  const layers = useMemo(
    () => buildRenderLayers(avatar, equipped, catalog),
    [avatar, equipped, catalog],
  );

  return (
    <div className={`relative select-none ${className}`} style={{ width: size, height: size }} data-testid="avatar-renderer">
      {layers.map((layer) => {
        // Base body fills the whole square, centered (feet on baseline).
        if (!layer.transform) {
          return (
            <img
              key={layer.key}
              src={layer.assetUrl}
              alt=""
              draggable={false}
              className="absolute inset-0 w-full h-full object-contain"
              style={{ zIndex: layer.z }}
            />
          );
        }
        // Gear: placed relative to an avatar anchor (all values are fractions
        // of the master canvas, so they scale to any display size).
        const t = layer.transform;
        const a = avatar.anchors[t.anchor];
        const s = (t.scale ?? 0.4) * size;
        const cx = (a.x + (t.offsetX ?? 0)) * size;
        const cy = (a.y + (t.offsetY ?? 0)) * size;
        return (
          <img
            key={layer.key}
            src={layer.assetUrl}
            alt=""
            draggable={false}
            className="absolute object-contain transition-all duration-300 ease-out"
            style={{
              zIndex: layer.z,
              width: s,
              height: s,
              left: cx - s / 2,
              top: cy - s / 2,
              transform: t.rotation ? `rotate(${t.rotation}deg)` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
