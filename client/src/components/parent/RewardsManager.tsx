// Mobile-first Rewards — a drill-down like Kids & Habits.
//
//   List (per child)  →  Create / Edit reward (full screen)
//
// The reward name is a combobox: tap a suggestion chip OR type your own.
// XP cost is a free numeric entry (not a fixed dropdown). All existing
// endpoints and payload shapes are preserved (the rewards table has no
// icon column, so the chosen emoji is stored inline in the name).
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getAvatarImage } from "@/lib/avatars";
import type { Child, Reward } from "@shared/schema";
import { ArrowLeft, Plus, Pencil, Trash2, Gift, Zap, X } from "lucide-react";

type View = "list" | "create" | "edit";

const SUGGESTIONS = [
  "🍦 Ice Cream", "🎮 Game Time", "📱 Screen Time", "🎬 Movie Night",
  "🍭 Candy Treat", "🛝 Park Trip", "🍕 Pizza Night", "⭐ Gold Star",
  "🧸 New Toy", "🎨 Craft Time", "😴 Later Bedtime", "🎁 Surprise",
];

export default function RewardsManager({ children }: { children: Child[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedChildId, setSelectedChildId] = useState<string>(children[0]?.id || "");
  const [view, setView] = useState<View>("list");
  const [editing, setEditing] = useState<Reward | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Reward | null>(null);

  const childId = selectedChildId || children[0]?.id || "";
  const { data: rewards = [] } = useQuery<Reward[]>({
    queryKey: [`/api/children/${childId}/rewards`],
    enabled: !!childId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/rewards`] });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; cost: number; isActive: boolean }) => {
      await apiRequest("POST", `/api/children/${childId}/rewards`, {
        childId, name: data.name, description: data.description,
        type: "treat", value: data.name, cost: data.cost, costType: "xp", isActive: data.isActive,
      });
    },
    onSuccess: () => { toast({ title: "Reward created! 🎁" }); invalidate(); setView("list"); },
    onError: () => toast({ title: "Error", description: "Could not create the reward.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; description: string; cost: number }) => {
      await apiRequest("PATCH", `/api/rewards/${data.id}`, { name: data.name, description: data.description, cost: data.cost });
    },
    onSuccess: () => { toast({ title: "Reward updated! ✨" }); invalidate(); setView("list"); },
    onError: () => toast({ title: "Error", description: "Could not update the reward.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/rewards/${id}`); },
    onSuccess: () => { toast({ title: "Reward deleted", variant: "destructive" }); invalidate(); },
    onError: () => toast({ title: "Error", description: "Could not delete.", variant: "destructive" }),
  });

  const selectedChild = children.find((c) => c.id === childId);

  if (view === "create" || (view === "edit" && editing)) {
    return (
      <RewardForm
        mode={view === "edit" ? "edit" : "create"}
        reward={view === "edit" ? editing! : undefined}
        childName={selectedChild?.name || "your child"}
        onCancel={() => setView("list")}
        onSubmit={(d) => view === "edit"
          ? updateMutation.mutate({ id: editing!.id, name: d.name, description: d.description, cost: d.cost })
          : createMutation.mutate(d)}
        pending={createMutation.isPending || updateMutation.isPending}
      />
    );
  }

  return (
    <div className="bounce-in">
      {/* Child selector (only when there's more than one) */}
      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-3">
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedChildId(c.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border-2 whitespace-nowrap flex-shrink-0 font-bold text-sm ${childId === c.id ? "border-orange-400 bg-orange-50 text-orange-600" : "border-gray-200 bg-white text-gray-600"}`}
              data-testid={`rewards-child-${c.id}`}
            >
              <img src={c.avatarUrl || getAvatarImage(c.avatarType)} alt="" className="w-6 h-6 rounded-full object-cover" />
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Reward rows */}
      <div className="space-y-2">
        {rewards.map((r) => (
          <div key={r.id} className="flex items-center gap-3 bg-white rounded-2xl p-2.5 shadow-sm border border-gray-100" data-testid={`reward-row-${r.id}`}>
            <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">
              {/* Show a leading emoji from the name if present, else a gift */}
              {/\p{Emoji}/u.test(r.name.trim().charAt(0)) ? r.name.trim().charAt(0) : "🎁"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-gray-800 truncate">{r.name}</div>
              {r.description && <div className="text-xs text-gray-500 truncate">{r.description}</div>}
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 whitespace-nowrap flex items-center gap-0.5">
              <Zap className="w-3 h-3" />{r.cost} XP
            </span>
            <Button size="sm" onClick={() => { setEditing(r); setView("edit"); }} className="h-10 w-10 p-0 rounded-full bg-sky hover:bg-sky/80 text-white shadow-md flex-shrink-0" aria-label={`Edit ${r.name}`}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={() => setDeleteTarget(r)} disabled={deleteMutation.isPending} className="h-10 w-10 p-0 rounded-full bg-destructive hover:bg-destructive/80 text-white shadow-md flex-shrink-0" aria-label={`Delete ${r.name}`}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        {rewards.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <Gift className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="font-medium">No rewards yet{selectedChild ? ` for ${selectedChild.name}` : ""}.</p>
            <p className="text-sm text-gray-400">Tap the + button to create one.</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setView("create")} className="fixed right-4 bottom-[calc(4.5rem+var(--safe-bottom))] z-40 w-14 h-14 rounded-full hero-gradient text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform" aria-label="Add reward" data-testid="rewards-add-fab">
        <Plus className="w-7 h-7" />
      </button>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent data-testid="dialog-delete-reward">
          <AlertDialogHeader><AlertDialogTitle>Delete Reward</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogDescription>Delete "{deleteTarget?.name}"? This can't be undone.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }} className="bg-destructive hover:bg-destructive/80">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RewardForm({ mode, reward, childName, onCancel, onSubmit, pending }: {
  mode: "create" | "edit"; reward?: Reward; childName: string;
  onCancel: () => void; onSubmit: (d: { name: string; description: string; cost: number; isActive: boolean }) => void; pending: boolean;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(reward?.name || "");
  const [description, setDescription] = useState(reward?.description || "");
  const [cost, setCost] = useState(reward ? String(reward.cost) : "100");
  const [active, setActive] = useState(reward?.isActive ?? true);

  const submit = () => {
    if (!name.trim()) { toast({ title: "Enter a reward name", variant: "destructive" }); return; }
    const n = parseInt(cost);
    if (!n || n < 1) { toast({ title: "Enter an XP cost", variant: "destructive" }); return; }
    onSubmit({ name: name.trim(), description: description.trim(), cost: Math.max(1, Math.min(100000, n)), isActive: active });
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col" data-testid="reward-form">
      {/* Top bar */}
      <div className="hero-gradient text-white px-3 pt-[calc(var(--safe-top)+0.5rem)] pb-4 rounded-b-3xl flex-shrink-0">
        <div className="flex items-center justify-between">
          <button onClick={onCancel} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center" aria-label="Back" data-testid="reward-form-back">
            {mode === "create" ? <X className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </button>
          <span className="font-fredoka text-lg">{mode === "edit" ? "Edit Reward" : "Create Reward"}</span>
          <div className="w-10 h-10" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-4 space-y-4">
        {/* Quick suggestions — a combobox: tap to fill, or type your own */}
        <div>
          <label className="text-sm font-bold text-gray-700">Reward Name</label>
          <p className="text-xs text-gray-500 mb-2">Tap a suggestion or type your own.</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => setName(s)} className={`px-2.5 py-1 rounded-full text-xs font-bold border-2 ${name === s ? "border-orange-400 bg-orange-50 text-orange-600" : "border-gray-200 bg-white text-gray-600"}`} data-testid={`reward-suggestion-${s}`}>
                {s}
              </button>
            ))}
          </div>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 🍦 Ice Cream or your own reward..." className="rounded-xl h-12" data-testid="reward-name-input" />
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700">Description (optional)</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a note for your child..." rows={2} className="rounded-xl mt-1" />
        </div>

        {/* XP cost — free numeric entry, not a fixed dropdown */}
        <div>
          <label className="text-sm font-bold text-gray-700">XP Cost</label>
          <div className="relative mt-1">
            <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
            <Input type="number" min={1} max={100000} step={5} inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Enter XP cost" className="rounded-xl h-12 pl-10 text-base font-bold" data-testid="reward-cost-input" />
          </div>
          <p className="text-xs text-gray-500 mt-1">How many XP {childName} spends to redeem this.</p>
        </div>

        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-3">
          <span className="text-sm font-semibold text-gray-700">Active (visible to your child)</span>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>
      </div>

      <div className="px-5 pb-[calc(1rem+var(--safe-bottom))] pt-3 flex-shrink-0">
        <Button onClick={submit} disabled={pending} className="w-full bg-orange-500 hover:bg-orange-500/80 text-white font-bold rounded-full text-base py-6" data-testid="reward-form-submit">
          {pending ? "Saving..." : mode === "edit" ? "💾 Save Changes" : "🎁 Create Reward"}
        </Button>
      </div>
    </div>
  );
}
