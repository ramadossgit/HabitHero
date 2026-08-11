// Dev proof-of-concept for the interactive 3D avatar + modular gear system.
// Route: /dev/avatar-3d  — demonstrates true .glb rendering, 360° orbit, and
// socket-based equip / remove / replace using the SHARED resolver + catalog.
import { useMemo, useState } from "react";
import Avatar3DViewer from "@/components/avatar3d/Avatar3DViewer";
import { AVATARS_3D, GEAR_3D, GEAR_3D_BY_ID } from "@/lib/avatar-3d-catalog";
import {
  emptyAvatar3DState, type Avatar3DState, type WaterBottlePosition,
} from "@shared/avatar-3d";
import { equipGear, unequipSlot, buildMountList } from "@shared/avatar-equipment-resolver";
import { Button } from "@/components/ui/button";

const avatar = AVATARS_3D[0];
// In the real app this comes from the child's inventory; here everything is owned.
const OWNED = new Set(GEAR_3D.map((g) => g.id));

export default function DevAvatar3D() {
  const [state, setState] = useState<Avatar3DState>(() => emptyAvatar3DState(avatar.id));
  const [bottlePos, setBottlePos] = useState<WaterBottlePosition>("right_hand");
  const [msg, setMsg] = useState<string>("");

  const mounts = useMemo(() => buildMountList(state, GEAR_3D_BY_ID), [state]);

  const equip = (gearId: string, position?: WaterBottlePosition) => {
    const r = equipGear(state, GEAR_3D_BY_ID[gearId], avatar, OWNED, { catalog: GEAR_3D_BY_ID, position });
    setMsg(r.ok ? `Equipped ${GEAR_3D_BY_ID[gearId].name}` : r.reason || "Can't equip");
    if (r.ok) setState(r.state);
  };
  const unequip = (slot: any) => setState(unequipSlot(state, slot, GEAR_3D_BY_ID).state);

  const backpacks = GEAR_3D.filter((g) => g.slot === "backpack");
  const equippedBackpack = state.equipped.backpack?.gearId;

  return (
    <div className="min-h-[100dvh] hero-gradient p-4">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="font-fredoka text-2xl text-white text-center">3D Avatar Studio (dev)</h1>

        <div className="fun-card bg-white/90 p-2">
          <Avatar3DViewer avatar={avatar} mounts={mounts} className="h-[420px] w-full rounded-2xl overflow-hidden" />
        </div>

        {msg && <div className="text-center text-white font-bold text-sm bg-black/20 rounded-full py-1">{msg}</div>}

        <div className="fun-card bg-white/95 p-3 space-y-3">
          <div>
            <div className="font-fredoka text-gray-800 mb-1">Backpacks</div>
            <div className="flex flex-wrap gap-2">
              {backpacks.map((b) => (
                <Button key={b.id} size="sm" onClick={() => equip(b.id)}
                  className={`rounded-full ${equippedBackpack === b.id ? "bg-purple text-white" : "bg-sky text-white"}`}>
                  {b.name.replace(/ (Backpack|School.*)/, "")}
                </Button>
              ))}
              {equippedBackpack && (
                <Button size="sm" onClick={() => unequip("backpack")} className="rounded-full bg-destructive text-white">Take off pack</Button>
              )}
            </div>
          </div>

          <div>
            <div className="font-fredoka text-gray-800 mb-1">Water bottle</div>
            <div className="flex flex-wrap gap-1.5 mb-1">
              {(["right_hand", "left_hand", "left_backpack_pocket", "right_backpack_pocket"] as WaterBottlePosition[]).map((p) => (
                <button key={p} onClick={() => setBottlePos(p)}
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${bottlePos === p ? "bg-purple text-white" : "bg-gray-200 text-gray-700"}`}>
                  {p.replace(/_/g, " ")}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => equip("flip-bottle", bottlePos)} className="rounded-full bg-mint text-white">Equip bottle</Button>
              {state.equipped.water_bottle && <Button size="sm" onClick={() => unequip("water_bottle")} className="rounded-full bg-destructive text-white">Remove bottle</Button>}
            </div>
          </div>

          <div>
            <div className="font-fredoka text-gray-800 mb-1">More gear</div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => equip("school-cap")} className="rounded-full bg-sky text-white">Cap</Button>
              <Button size="sm" onClick={() => equip("sneakers")} className="rounded-full bg-sky text-white">Sneakers</Button>
              <Button size="sm" onClick={() => equip("star-charm")} className="rounded-full bg-sky text-white">Charm</Button>
              {state.equipped.headwear && <Button size="sm" onClick={() => unequip("headwear")} className="rounded-full bg-destructive text-white">Cap off</Button>}
            </div>
          </div>
        </div>

        <pre className="text-[10px] text-white/80 bg-black/20 rounded-xl p-2 overflow-x-auto">{JSON.stringify(state.equipped, null, 1)}</pre>
      </div>
    </div>
  );
}
