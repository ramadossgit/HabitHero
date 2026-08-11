// DEV-ONLY proof of concept for the modular avatar & gear system.
// Demonstrates the spec's core promises with real Higgsfield assets:
//   • pick a base avatar (age-ranged)   • equip gear   • remove gear
//   • replace gear in a slot            • persists after refresh (localStorage)
//   • the base avatar image is NEVER regenerated — only overlay layers toggle
// Routed only in dev (see App.tsx). Existing kid Customize is untouched.
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import AvatarRenderer from "@/components/avatar/AvatarRenderer";
import {
  AVATARS, GEAR, GEAR_BY_ID, avatarsForAge, equipItem, removeSlot, isGearCompatible,
  type AvatarCustomizationState, type AvatarDefinition, type GearItem,
} from "@shared/avatar-system";
import { Check, Trash2, Sparkles } from "lucide-react";

const emptyState = (avatarId: string): AvatarCustomizationState => ({
  avatarId, equipped: {}, temporarilyHidden: {}, updatedAt: new Date().toISOString(), version: 0,
});

const storageKey = (avatarId: string) => `habitHero_avatarState_${avatarId}`;

export default function DevAvatarStudio() {
  const params = new URLSearchParams(window.location.search);
  const age = params.get("age") ? parseInt(params.get("age")!, 10) : null;
  const available = avatarsForAge(age);

  const [avatar, setAvatar] = useState<AvatarDefinition>(available[0] ?? AVATARS[0]);
  const [state, setState] = useState<AvatarCustomizationState>(() => emptyState(avatar.id));

  // Load persisted look for the selected avatar (proves persistence on refresh)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(avatar.id));
      setState(raw ? JSON.parse(raw) : emptyState(avatar.id));
    } catch {
      setState(emptyState(avatar.id));
    }
  }, [avatar.id]);

  const save = (next: AvatarCustomizationState) => {
    setState(next);
    try { localStorage.setItem(storageKey(avatar.id), JSON.stringify(next)); } catch { /* ignore */ }
  };

  const gearForAvatar = useMemo(
    () => GEAR.filter((g) => isGearCompatible(g, avatar)),
    [avatar],
  );

  const isEquipped = (g: GearItem) => state.equipped[g.slot] === g.id;

  const toggle = (g: GearItem) => {
    if (isEquipped(g)) {
      save(removeSlot(state, g.slot, GEAR_BY_ID));
    } else {
      // Equipping replaces whatever is in that slot (equip/replace in one action)
      save(equipItem(state, g));
    }
  };

  return (
    <div className="min-h-[100dvh] hero-gradient overflow-hidden">
      <div className="mx-auto w-full max-w-md px-4 pt-[calc(var(--safe-top)+1rem)] pb-8 flex flex-col">
        <div className="flex items-center gap-2 text-white mb-3">
          <Sparkles className="w-5 h-5" />
          <h1 className="font-fredoka text-2xl">Avatar Studio</h1>
          <span className="ml-auto text-xs bg-white/20 rounded-full px-2 py-0.5">DEV preview</span>
        </div>

        {/* Stage — the rendered modular avatar over a themed backdrop */}
        <div className="bg-white/90 rounded-3xl shadow-2xl p-4 flex flex-col items-center">
          <div className="rounded-2xl bg-gradient-to-b from-sky/15 to-mint/15 p-2" data-testid="avatar-stage">
            <AvatarRenderer avatar={avatar} equipped={state.equipped} catalog={GEAR_BY_ID} size={280} />
          </div>
          <div className="mt-2 font-fredoka text-lg text-gray-800">{avatar.name}</div>
          <div className="text-xs text-gray-500">Ages {avatar.minAge}–{avatar.maxAge} · {avatar.bodyFamily}</div>
        </div>

        {/* Choose base avatar (age-ranged) */}
        <h2 className="text-white font-bold mt-5 mb-2 text-sm">Choose your hero {age != null ? `(age ${age})` : ""}</h2>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {available.map((a) => (
            <button
              key={a.id}
              onClick={() => setAvatar(a)}
              className={`flex-shrink-0 w-20 rounded-2xl p-1.5 border-2 bg-white ${avatar.id === a.id ? "border-coral" : "border-transparent"}`}
              data-testid={`studio-avatar-${a.id}`}
            >
              <img src={a.thumbnailUrl} alt={a.name} className="w-full aspect-square object-contain" />
              <div className="text-[10px] font-bold text-gray-700 truncate">{a.name}</div>
            </button>
          ))}
        </div>

        {/* Gear — equip / remove / replace */}
        <h2 className="text-white font-bold mt-5 mb-2 text-sm">Gear</h2>
        <div className="grid grid-cols-2 gap-2">
          {gearForAvatar.map((g) => {
            const equipped = isEquipped(g);
            return (
              <div key={g.id} className="bg-white rounded-2xl p-2.5 shadow-sm flex flex-col" data-testid={`studio-gear-${g.id}`}>
                <div className="bg-gray-50 rounded-xl aspect-square flex items-center justify-center mb-1.5">
                  <img src={g.thumbnailUrl} alt={g.name} className="w-4/5 h-4/5 object-contain" />
                </div>
                <div className="font-bold text-sm text-gray-800 truncate">{g.name}</div>
                <div className="text-[11px] text-gray-500 mb-2 flex items-center gap-1">
                  <span className="capitalize">{g.rarity}</span><span>·</span><span>🪙 {g.priceCoins}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => toggle(g)}
                  className={`rounded-full font-bold ${equipped ? "bg-destructive hover:bg-destructive/80 text-white" : "bg-mint hover:bg-mint/80 text-white"}`}
                  data-testid={`studio-toggle-${g.id}`}
                >
                  {equipped ? (<><Trash2 className="w-4 h-4 mr-1" />Remove</>) : (<><Check className="w-4 h-4 mr-1" />Equip</>)}
                </Button>
              </div>
            );
          })}
        </div>

        <p className="text-white/80 text-xs mt-4 text-center">
          Your look is saved automatically — refresh and it stays. The base avatar
          image never changes; only gear layers are added or removed.
        </p>
      </div>
    </div>
  );
}
