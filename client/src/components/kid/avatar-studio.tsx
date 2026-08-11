// Kid Avatar Studio — the joyful customization experience.
//   • Avatar Shop: pick your hero (age-ranged)   • Gear Shop: buy with XP ⚡
//   • Equip / remove / replace gear    • Preview before you buy
//   • Auto-saved to the server, shown everywhere via <ChildAvatar/>
// The base avatar image is never regenerated — only gear layers toggle.
// Currency is XP (⚡) everywhere — the same number shown in the header.
import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import AvatarRenderer from "@/components/avatar/AvatarRenderer";
import InteractiveAvatar from "@/components/avatar/InteractiveAvatar";
import {
  AVATARS, GEAR, GEAR_BY_ID, avatarsForAge, isGearCompatible, isGearForAge,
  avatarTier, gearTier,
  type AvatarDefinition, type EquippedItems, type GearItem,
} from "@shared/avatar-system";
import type { Child } from "@shared/schema";
import { Check, Trash2, Eye, Zap, Sparkles, Lock, ShoppingBag, Shirt, Star } from "lucide-react";

type ChildLike = Child & { avatarId?: string | null; equippedGear?: EquippedItems | null; premiumUnlocked?: boolean };

export default function AvatarStudio({ child }: { child: ChildLike }) {
  const { toast } = useToast();
  const childId = child.id;
  const owned = useMemo(() => new Set((child.unlockedGear as string[]) || []), [child.unlockedGear]);
  const xp = child.rewardPoints || 0; // spendable XP ⚡ (same currency as the header)
  const premiumUnlocked = child.premiumUnlocked ?? false;

  const ageAvatars = useMemo(() => avatarsForAge(child.age), [child.age]);
  const initialAvatar =
    AVATARS.find((a) => a.id === child.avatarId) || ageAvatars[0] || AVATARS[0];

  const [avatar, setAvatar] = useState<AvatarDefinition>(initialAvatar);
  const [equipped, setEquipped] = useState<EquippedItems>((child.equippedGear as EquippedItems) || {});
  const [preview, setPreview] = useState<GearItem | null>(null);
  const [celebrateTick, setCelebrateTick] = useState(0);

  // Re-sync from the server ONLY when switching to a different kid. We must not
  // key this on `equippedGear`, or a background refetch that lands before our
  // save persists would wipe the gear the kid just put on. Local state is the
  // source of truth for the stage; the server catches up via saveMutation.
  useEffect(() => {
    const a = AVATARS.find((x) => x.id === child.avatarId) || avatarsForAge(child.age)[0] || AVATARS[0];
    setAvatar(a);
    setEquipped((child.equippedGear as EquippedItems) || {});
    setPreview(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child.id]);

  // Bumping this makes the InteractiveAvatar jump + sparkle to celebrate.
  const celebrate = () => setCelebrateTick((t) => t + 1);

  const askGrownup = useMutation({
    mutationFn: async (module: "avatars" | "gear") => {
      const res = await apiRequest("POST", `/api/children/${childId}/upgrade-request`, { module });
      return res.json();
    },
    onSuccess: () => toast({ title: "We told your grown-up! ⭐", description: "Ask them to unlock Habit Hero Premium for all heroes & gear!" }),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { avatarId: string; equipped: EquippedItems }) => {
      const res = await apiRequest("PUT", `/api/children/${childId}/avatar`, data);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/auth/child"] }),
    onError: () => toast({ title: "Couldn't save", description: "Please try again.", variant: "destructive" }),
  });

  const purchaseMutation = useMutation({
    mutationFn: async (gearId: string) => {
      const res = await apiRequest("POST", `/api/children/${childId}/avatar/purchase-gear`, { gearId });
      return res.json();
    },
    onSuccess: (_data, gearId) => {
      const item = GEAR_BY_ID[gearId];
      toast({ title: `${item?.name} unlocked! 🎉`, description: "Now wearing it — looking great!" });
      // auto-equip the freshly bought item, then persist and refresh XP balance
      const next = { ...equipped, [item.slot]: item.id };
      setEquipped(next);
      setPreview(null);
      celebrate();
      saveMutation.mutate({ avatarId: avatar.id, equipped: next });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/child"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
    },
    onError: (e: Error) =>
      toast({ title: "Not enough XP yet", description: e.message.replace(/^\d+:\s*/, "") || "Complete more habits to earn XP!", variant: "destructive" }),
  });

  // Show gear that fits this hero's body AND the child's age (like the avatars).
  const gearForAvatar = useMemo(
    () => GEAR.filter((g) => isGearCompatible(g, avatar) && isGearForAge(g, child.age)),
    [avatar, child.age],
  );

  const chooseAvatar = (a: AvatarDefinition) => {
    // Premium heroes need a subscription — nudge the parent instead of switching.
    if (avatarTier(a.id) === "premium" && !premiumUnlocked) {
      askGrownup.mutate("avatars");
      return;
    }
    // Drop gear that doesn't fit the new body, then save.
    const kept: EquippedItems = {};
    for (const [slot, id] of Object.entries(equipped)) {
      const item = id ? GEAR_BY_ID[id] : undefined;
      if (item && isGearCompatible(item, a)) kept[slot] = id;
    }
    setAvatar(a);
    setEquipped(kept);
    setPreview(null);
    celebrate();
    saveMutation.mutate({ avatarId: a.id, equipped: kept });
  };

  const equip = (g: GearItem) => {
    const next = { ...equipped, [g.slot]: g.id };
    setEquipped(next);
    setPreview(null);
    celebrate();
    saveMutation.mutate({ avatarId: avatar.id, equipped: next });
  };

  const remove = (g: GearItem) => {
    const next = { ...equipped };
    delete next[g.slot];
    setEquipped(next);
    saveMutation.mutate({ avatarId: avatar.id, equipped: next });
  };

  const isEquipped = (g: GearItem) => equipped[g.slot] === g.id;
  // What the stage shows: the saved look, plus the previewed item on top.
  const stageEquipped: EquippedItems = preview ? { ...equipped, [preview.slot]: preview.id } : equipped;

  return (
    <div className="space-y-4">
      {/* Stage */}
      <div className="fun-card border-4 border-purple-400 bg-gradient-to-b from-purple-50 to-pink-50 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-fredoka text-lg text-gray-800 flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-purple" /> My Hero
          </h2>
          <span className="inline-flex items-center gap-1 bg-sunshine/20 text-yellow-700 font-bold text-sm rounded-full px-3 py-1" data-testid="studio-xp">
            <Zap className="w-4 h-4 fill-sunshine text-sunshine" /> {xp.toLocaleString()} XP
          </span>
        </div>

        <div className="relative flex justify-center">
          <div className="relative rounded-3xl bg-white/70 p-2" data-testid="studio-stage">
            <InteractiveAvatar
              size={240}
              trigger={celebrateTick}
              ariaLabel={`Tap ${avatar.name} to play!`}
            >
              <AvatarRenderer avatar={avatar} equipped={stageEquipped} catalog={GEAR_BY_ID} size={240} />
            </InteractiveAvatar>
          </div>
        </div>
        <div className="text-center mt-1 font-fredoka text-gray-800 flex items-center justify-center gap-1.5">
          {avatar.name}
          <span className="text-xs text-purple font-nunito font-semibold">· tap me! 👆</span>
        </div>

        {/* Preview action bar */}
        {preview && !owned.has(preview.id) && (
          <div className="mt-3 flex items-center gap-2 bg-white rounded-2xl p-2.5 shadow-sm">
            <div className="min-w-0 flex-1">
              <div className="font-bold text-gray-800 text-sm truncate">Trying: {preview.name}</div>
              <div className="text-xs text-gray-500 flex items-center gap-1"><Zap className="w-3 h-3 fill-sunshine text-sunshine" />{preview.priceCoins} XP</div>
            </div>
            <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setPreview(null)}>Cancel</Button>
            <Button
              size="sm"
              disabled={purchaseMutation.isPending || xp < preview.priceCoins}
              onClick={() => purchaseMutation.mutate(preview.id)}
              className="rounded-full bg-mint hover:bg-mint/80 text-white font-bold"
              data-testid="studio-buy"
            >
              {xp < preview.priceCoins ? "Need more XP" : purchaseMutation.isPending ? "Buying..." : `Buy · ${preview.priceCoins}`}
            </Button>
          </div>
        )}
      </div>

      {/* Avatar Shop — choose your hero (age-ranged) */}
      <div>
        <h3 className="font-fredoka text-gray-800 mb-2 flex items-center gap-1.5">
          <ShoppingBag className="w-5 h-5 text-purple" /> Avatar Shop
          <span className="text-xs text-gray-400 font-nunito font-semibold">· tap a hero to become them!</span>
        </h3>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {ageAvatars.map((a) => {
            const locked = avatarTier(a.id) === "premium" && !premiumUnlocked;
            return (
              <button
                key={a.id}
                onClick={() => chooseAvatar(a)}
                className={`relative flex-shrink-0 w-24 rounded-2xl p-2 border-2 bg-white shadow-sm ${avatar.id === a.id ? "border-purple ring-2 ring-purple/30" : "border-transparent"}`}
                data-testid={`studio-avatar-${a.id}`}
              >
                <img src={a.thumbnailUrl} alt={a.name} className={`w-full aspect-square object-contain ${locked ? "grayscale opacity-70" : ""}`} />
                <div className="text-[11px] font-bold text-gray-700 truncate">{a.name}</div>
                {avatar.id === a.id && <div className="text-[10px] font-bold text-purple">Wearing</div>}
                {locked && (
                  <span className="absolute top-1 right-1 inline-flex items-center gap-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5">
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Gear Shop */}
      <div>
        <h3 className="font-fredoka text-gray-800 mb-2 flex items-center gap-1.5">
          <Shirt className="w-5 h-5 text-purple" /> Gear Shop
          <span className="text-xs text-gray-400 font-nunito font-semibold">· dress up your hero!</span>
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {gearForAvatar.map((g) => {
            const isOwned = owned.has(g.id);
            const equippedNow = isEquipped(g);
            const locked = !isOwned && gearTier(g.id) === "premium" && !premiumUnlocked;
            return (
              <div key={g.id} className="bg-white rounded-2xl p-2.5 shadow-sm flex flex-col" data-testid={`studio-gear-${g.id}`}>
                <div className="relative bg-gray-50 rounded-xl aspect-square flex items-center justify-center mb-1.5">
                  <img src={g.thumbnailUrl} alt={g.name} className={`w-4/5 h-4/5 object-contain ${locked ? "grayscale opacity-70" : ""}`} />
                  {isOwned && <span className="absolute top-1 right-1 text-[10px] font-bold bg-mint text-white rounded-full px-1.5 py-0.5">Owned</span>}
                  {equippedNow && <span className="absolute top-1 left-1 text-[10px] font-bold bg-purple text-white rounded-full px-1.5 py-0.5">Worn</span>}
                  {locked && <span className="absolute top-1 right-1 inline-flex items-center gap-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5"><Lock className="w-2.5 h-2.5" />Premium</span>}
                </div>
                <div className="font-bold text-sm text-gray-800 truncate">{g.name}</div>
                <div className="text-[11px] text-gray-500 mb-2 flex items-center gap-1 capitalize">
                  {g.rarity}{!isOwned && !locked && <><span>·</span><Zap className="w-3 h-3 fill-sunshine text-sunshine" />{g.priceCoins} XP</>}
                </div>

                {locked ? (
                  <Button size="sm" onClick={() => askGrownup.mutate("gear")} disabled={askGrownup.isPending} className="rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold" data-testid={`studio-ask-${g.id}`}>
                    <Star className="w-4 h-4 mr-1 fill-current" />Ask a grown-up
                  </Button>
                ) : isOwned ? (
                  equippedNow ? (
                    <Button size="sm" onClick={() => remove(g)} className="rounded-full bg-destructive hover:bg-destructive/80 text-white font-bold" data-testid={`studio-remove-${g.id}`}>
                      <Trash2 className="w-4 h-4 mr-1" />Take off
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => equip(g)} className="rounded-full bg-mint hover:bg-mint/80 text-white font-bold" data-testid={`studio-equip-${g.id}`}>
                      <Check className="w-4 h-4 mr-1" />Wear it
                    </Button>
                  )
                ) : (
                  <Button size="sm" onClick={() => setPreview(g)} className="rounded-full bg-sky hover:bg-sky/80 text-white font-bold" data-testid={`studio-preview-${g.id}`}>
                    <Eye className="w-4 h-4 mr-1" />Try on
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-gray-400 mt-3">Complete habits to earn more XP ⚡ and unlock cooler gear! 🌟</p>
      </div>
    </div>
  );
}
