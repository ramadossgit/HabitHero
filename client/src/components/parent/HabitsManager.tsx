// Mobile-first Habit Management — a drill-down flow, not a long scroll.
//
//   List  →  Habit Detail  →  focused actions
//   List  →  Create / Edit wizard (Basic Info → Settings → Review)
//   List  →  Assign Habit (kids with toggles)
//   List  →  Pending Approvals
//
// Every screen has one job and fits a phone. Detail / wizard / assign take
// over the full screen with their own top bar; the list stays inside the
// dashboard so the bottom nav is still reachable. All existing features are
// preserved: master-habit CRUD, scheduling, auto-assign, per-child
// assignment, and premium voice reminders.
import { useMemo, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import HabitApproval from "@/components/parent/habit-approval";
import { getAvatarImage } from "@/lib/avatars";
import { HABIT_BADGES, TIME_OF_DAY_OPTIONS, WEEKDAY_OPTIONS, describeSchedule } from "@shared/habit-schedule";
import { canRecordAudio, recordingUnavailableReason, playRingtonePreviewTone } from "@/lib/audio-support";
import type { Child, User, MasterHabit, Habit } from "@shared/schema";
import {
  ArrowLeft, Plus, Search, ChevronRight, Pencil, Users, Clock, Copy, Trash2,
  Check, MoreVertical, Bell, BarChart3, Mic, Play, X, Zap,
} from "lucide-react";

type View = "list" | "detail" | "create" | "edit" | "assign" | "approvals";
type Filter = "all" | "active" | "inactive" | "unassigned";

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function HabitsManager({
  children, user, pendingApprovalCount = 0,
}: {
  children: Child[];
  user?: User;
  pendingApprovalCount?: number;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: masterHabits = [] } = useQuery<MasterHabit[]>({ queryKey: ["/api/habits/master"] });
  const { data: allHabits = [] } = useQuery<(Habit & { childName?: string })[]>({ queryKey: ["/api/habits/all"] });

  const [view, setView] = useState<View>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [quickActionsFor, setQuickActionsFor] = useState<MasterHabit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MasterHabit | null>(null);

  const selected = masterHabits.find((h) => h.id === selectedId) || null;

  const assignmentsByMaster = useMemo(() => {
    const groups: Record<string, (Habit & { childName?: string })[]> = {};
    allHabits.forEach((h) => {
      if (h.masterHabitId) (groups[h.masterHabitId] ||= []).push(h);
    });
    return groups;
  }, [allHabits]);

  const assignedCount = (id: string) => (assignmentsByMaster[id] || []).filter((h) => h.isActive).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return masterHabits
      .filter((h) => {
        if (filter === "active") return h.isActive;
        if (filter === "inactive") return !h.isActive;
        if (filter === "unassigned") return (assignmentsByMaster[h.id] || []).length === 0;
        return true;
      })
      .filter((h) => !q || h.name.toLowerCase().includes(q));
  }, [masterHabits, filter, search, assignmentsByMaster]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/habits/master"] });
    queryClient.invalidateQueries({ queryKey: ["/api/habits/all"] });
    queryClient.invalidateQueries({ queryKey: ["/api/children"] });
    children.forEach((c) => queryClient.invalidateQueries({ queryKey: [`/api/children/${c.id}/habits`] }));
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/habits/master", data);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Habit created! 🎯", description: "Assign it to your kids to get started." });
      invalidateAll();
      setView("list");
    },
    onError: () => toast({ title: "Error", description: "Could not create the habit.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      const res = await apiRequest("PATCH", `/api/master-habits/${data.id}`, data.updates);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Habit updated! ✨" });
      invalidateAll();
      setView("detail");
    },
    onError: () => toast({ title: "Error", description: "Could not update the habit.", variant: "destructive" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/master-habits/${id}`, { isActive });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => invalidateAll(),
    onError: () => toast({ title: "Error", description: "Could not change status.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/habits/${id}`); },
    onSuccess: () => {
      toast({ title: "Habit deleted 🗑️", variant: "destructive" });
      invalidateAll();
      setView("list");
      setSelectedId(null);
    },
    onError: () => toast({ title: "Error", description: "Could not delete.", variant: "destructive" }),
  });

  const autoAssignMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/habits/auto-assign-all", {}); },
    onSuccess: () => { toast({ title: "Assigned! 🚀", description: "All habits assigned to every child." }); invalidateAll(); },
    onError: () => toast({ title: "Error", description: "Auto-assign failed.", variant: "destructive" }),
  });

  const duplicate = (h: MasterHabit) => {
    createMutation.mutate({
      name: `${h.name} (Copy)`, description: h.description, icon: h.icon, xpReward: h.xpReward,
      color: h.color, frequency: h.frequency, startDate: h.startDate, endDate: h.endDate,
      occurrenceLimit: h.occurrenceLimit, schedule: h.schedule,
    });
  };

  // ── Screen routing ─────────────────────────────────────────────────────────
  if (view === "create" || (view === "edit" && selected)) {
    return (
      <HabitWizard
        mode={view === "edit" ? "edit" : "create"}
        habit={view === "edit" ? selected! : undefined}
        user={user}
        onCancel={() => setView(view === "edit" ? "detail" : "list")}
        onSubmit={(data) => (view === "edit" ? updateMutation.mutate({ id: selected!.id, updates: data }) : createMutation.mutate(data))}
        pending={createMutation.isPending || updateMutation.isPending}
      />
    );
  }

  if (view === "assign" && selected) {
    return (
      <AssignScreen
        habit={selected}
        children={children}
        assignments={assignmentsByMaster[selected.id] || []}
        onBack={() => setView("detail")}
        onChanged={invalidateAll}
      />
    );
  }

  if (view === "approvals") {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col" data-testid="habit-approvals-screen">
        <TopBar title="Pending Approvals" badge={pendingApprovalCount} onBack={() => setView("list")} />
        <div className="flex-1 overflow-y-auto p-3">
          <HabitApproval children={children} />
        </div>
      </div>
    );
  }

  if (view === "detail" && selected) {
    return (
      <>
        <HabitDetail
          habit={selected}
          assignedCount={assignedCount(selected.id)}
          onBack={() => setView("list")}
          onToggleActive={(isActive) => toggleActiveMutation.mutate({ id: selected.id, isActive })}
          onEdit={() => setView("edit")}
          onAssign={() => setView("assign")}
          onDuplicate={() => duplicate(selected)}
          onDelete={() => setDeleteTarget(selected)}
        />
        <DeleteDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={(id) => { deleteMutation.mutate(id); setDeleteTarget(null); }} pending={deleteMutation.isPending} />
      </>
    );
  }

  // ── LIST ──
  return (
    <div className="bounce-in">
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search habits..." className="pl-9 rounded-full bg-white border-gray-200" data-testid="habits-search" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-full p-1 mb-3 text-[13px]">
        {([["all", "All"], ["active", "Active"], ["inactive", "Inactive"], ["unassigned", "Unassigned"]] as [Filter, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} className={`flex-1 rounded-full py-1.5 font-bold transition-colors ${filter === id ? "bg-white text-turquoise shadow-sm" : "text-gray-500"}`} data-testid={`habits-filter-${id}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Master count + auto-assign */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 bg-turquoise/10 text-turquoise font-bold text-sm rounded-full px-3 py-1.5">
          ⭐ Master Habits ({masterHabits.length})
        </span>
        {masterHabits.length > 0 && children.length > 0 && (
          <Button size="sm" onClick={() => autoAssignMutation.mutate()} disabled={autoAssignMutation.isPending} className="rounded-full bg-coral hover:bg-coral/80 text-white font-bold text-xs px-3" data-testid="habits-auto-assign">
            {autoAssignMutation.isPending ? "Assigning..." : "🚀 Auto-Assign All"}
          </Button>
        )}
      </div>

      {/* Approvals entry point — always reachable so auto-approval settings
          stay accessible even with nothing pending (progressive disclosure) */}
      <button onClick={() => setView("approvals")} className={`w-full flex items-center gap-2 rounded-2xl p-3 mb-3 text-left border ${pendingApprovalCount > 0 ? "bg-mint/10 border-mint/30" : "bg-gray-50 border-gray-200"}`} data-testid="habits-approvals-banner">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${pendingApprovalCount > 0 ? "bg-mint text-white" : "bg-gray-200 text-gray-500"}`}><Check className="w-4 h-4" /></span>
        <span className="flex-1 font-bold text-gray-800 text-sm">
          {pendingApprovalCount > 0 ? `${pendingApprovalCount} habit${pendingApprovalCount === 1 ? "" : "s"} awaiting approval` : "Approvals & auto-approval settings"}
        </span>
        <ChevronRight className={`w-5 h-5 ${pendingApprovalCount > 0 ? "text-mint" : "text-gray-400"}`} />
      </button>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((h) => (
          <div key={h.id} className="w-full flex items-center gap-3 bg-white rounded-2xl p-2.5 shadow-sm border border-gray-100" data-testid={`habit-row-${h.id}`}>
            <button onClick={() => { setSelectedId(h.id); setView("detail"); }} className="flex items-center gap-3 flex-1 min-w-0 text-left">
              <span className="text-2xl flex-shrink-0 w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">{h.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-bold truncate ${h.isActive ? "text-gray-800" : "text-gray-400"}`}>{h.name}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${h.isActive ? "bg-mint/15 text-mint" : "bg-sunshine/20 text-yellow-700"}`}>{h.isActive ? "Active" : "Inactive"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span>{describeSchedule(h)}</span>
                  <span className="text-gray-300">·</span>
                  <span className="inline-flex items-center gap-0.5 text-turquoise font-bold"><Zap className="w-3 h-3" />{h.xpReward} XP</span>
                </div>
              </div>
            </button>
            <button onClick={() => setQuickActionsFor(h)} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 flex-shrink-0" aria-label="Quick actions" data-testid={`habit-menu-${h.id}`}>
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <p className="font-medium">{search ? "No habits match your search." : "No habits yet."}</p>
            <p className="text-sm text-gray-400">Tap the + button to create your first habit.</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setView("create")} className="fixed right-4 bottom-[calc(4.5rem+var(--safe-bottom))] z-40 w-14 h-14 rounded-full hero-gradient text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform" aria-label="Add habit" data-testid="habits-add-fab">
        <Plus className="w-7 h-7" />
      </button>

      {/* Quick actions bottom sheet */}
      {quickActionsFor && (
        <QuickActionsSheet
          habit={quickActionsFor}
          onClose={() => setQuickActionsFor(null)}
          onMakeActive={() => { toggleActiveMutation.mutate({ id: quickActionsFor.id, isActive: true }); setQuickActionsFor(null); }}
          onMakeInactive={() => { toggleActiveMutation.mutate({ id: quickActionsFor.id, isActive: false }); setQuickActionsFor(null); }}
          onEdit={() => { setSelectedId(quickActionsFor.id); setQuickActionsFor(null); setView("edit"); }}
          onAssign={() => { setSelectedId(quickActionsFor.id); setQuickActionsFor(null); setView("assign"); }}
          onDuplicate={() => { duplicate(quickActionsFor); setQuickActionsFor(null); }}
          onDelete={() => { setDeleteTarget(quickActionsFor); setQuickActionsFor(null); }}
        />
      )}

      <DeleteDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={(id) => { deleteMutation.mutate(id); setDeleteTarget(null); }} pending={deleteMutation.isPending} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Shared top bar
// ════════════════════════════════════════════════════════════════════════════
function TopBar({ title, onBack, badge, right }: { title: string; onBack: () => void; badge?: number; right?: React.ReactNode }) {
  return (
    <div className="hero-gradient text-white px-3 pt-[calc(var(--safe-top)+0.5rem)] pb-4 rounded-b-3xl flex-shrink-0">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center" aria-label="Back" data-testid="habit-back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-fredoka text-lg flex items-center gap-2">
          {title}
          {badge ? <span className="bg-white text-coral text-xs font-black rounded-full w-6 h-6 flex items-center justify-center">{badge}</span> : null}
        </span>
        <div className="w-10 h-10 flex items-center justify-center">{right}</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// HABIT DETAIL
// ════════════════════════════════════════════════════════════════════════════
function HabitDetail({
  habit, assignedCount, onBack, onToggleActive, onEdit, onAssign, onDuplicate, onDelete,
}: {
  habit: MasterHabit; assignedCount: number; onBack: () => void;
  onToggleActive: (isActive: boolean) => void;
  onEdit: () => void; onAssign: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col" data-testid="habit-detail">
      <div className="hero-gradient text-white px-3 pt-[calc(var(--safe-top)+0.5rem)] pb-6 rounded-b-3xl flex-shrink-0">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center" aria-label="Back" data-testid="habit-back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10" />
        </div>
        <div className="flex flex-col items-center -mb-2">
          <div className="text-5xl w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center">{habit.icon}</div>
          <h2 className="font-fredoka text-2xl mt-2">{habit.name}</h2>
          <div className="flex items-center gap-2 mt-1 text-sm">
            <span className={`px-2 py-0.5 rounded-full font-bold ${habit.isActive ? "bg-white/25" : "bg-black/20"}`}>{habit.isActive ? "Active" : "Inactive"}</span>
            <span className="inline-flex items-center gap-0.5 text-sunshine font-bold"><Zap className="w-4 h-4" />{habit.xpReward} XP</span>
            <span>· {cap(habit.frequency)}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 -mt-3">
        {/* Sync toggles */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-3 mb-4 divide-y divide-gray-100">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-semibold text-gray-700">Hidden from child</span>
            <Switch checked={!habit.isActive} onCheckedChange={(hidden) => onToggleActive(!hidden)} data-testid="detail-hidden-toggle" />
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-semibold text-gray-700">Syncs to child's daily list</span>
            <Switch checked={!!habit.isActive} onCheckedChange={(sync) => onToggleActive(sync)} data-testid="detail-sync-toggle" />
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 divide-y divide-gray-100 overflow-hidden mb-4">
          <ActionRow icon={Pencil} label="Edit Habit" onClick={onEdit} testid="detail-action-edit" />
          <ActionRow icon={Users} label="Assign Habit" hint={assignedCount > 0 ? `${assignedCount} assigned` : undefined} onClick={onAssign} testid="detail-action-assign" />
          <Link href="/alert-settings">
            <ActionRow icon={Bell} label="Reminders" hint={habit.voiceReminderEnabled ? "Voice on" : undefined} onClick={() => {}} testid="detail-action-reminders" />
          </Link>
          <ActionRow icon={Copy} label="Duplicate Habit" onClick={onDuplicate} testid="detail-action-duplicate" />
          <ActionRow icon={Trash2} label="Delete Habit" danger onClick={onDelete} testid="detail-action-delete" />
        </div>
      </div>
    </div>
  );
}

function ActionRow({ icon: Icon, label, hint, danger, onClick, testid }: {
  icon: typeof Pencil; label: string; hint?: string; danger?: boolean; onClick: () => void; testid?: string;
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors" data-testid={testid}>
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${danger ? "bg-destructive/10 text-destructive" : "bg-turquoise/10 text-turquoise"}`}>
        <Icon className="w-5 h-5" />
      </span>
      <span className={`flex-1 font-bold ${danger ? "text-destructive" : "text-gray-800"}`}>{label}</span>
      {hint && <span className="text-xs text-gray-400 mr-1">{hint}</span>}
      <ChevronRight className={`w-5 h-5 ${danger ? "text-destructive/40" : "text-gray-300"}`} />
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// QUICK ACTIONS bottom sheet (the ⋮ menu)
// ════════════════════════════════════════════════════════════════════════════
function QuickActionsSheet({ habit, onClose, onMakeActive, onMakeInactive, onEdit, onAssign, onDuplicate, onDelete }: {
  habit: MasterHabit; onClose: () => void;
  onMakeActive: () => void; onMakeInactive: () => void; onEdit: () => void; onAssign: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  const items = [
    ...(habit.isActive
      ? [{ icon: X, label: "Make Inactive", onClick: onMakeInactive, color: "text-yellow-600" }]
      : [{ icon: Check, label: "Make Active", onClick: onMakeActive, color: "text-mint" }]),
    { icon: Pencil, label: "Edit Habit", onClick: onEdit, color: "text-sky" },
    { icon: Users, label: "Assign Habit", onClick: onAssign, color: "text-turquoise" },
    { icon: Copy, label: "Duplicate Habit", onClick: onDuplicate, color: "text-purple" },
    { icon: Trash2, label: "Delete Habit", onClick: onDelete, color: "text-destructive" },
  ];
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={onClose} data-testid="habit-quick-actions">
      <div className="w-full bg-white rounded-t-3xl p-3 pb-[calc(1rem+var(--safe-bottom))]" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-gray-300" />
        <div className="flex items-center gap-2 px-2 py-2 mb-1">
          <span className="text-2xl">{habit.icon}</span>
          <div className="min-w-0">
            <div className="font-bold text-gray-800 truncate">{habit.name}</div>
            <div className="text-xs text-gray-500">{cap(habit.frequency)} · {habit.isActive ? "Active" : "Inactive"} · {habit.xpReward} XP</div>
          </div>
        </div>
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <button key={it.label} onClick={it.onClick} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 text-left">
              <Icon className={`w-5 h-5 ${it.color}`} />
              <span className={`font-bold ${it.label.includes("Delete") ? "text-destructive" : "text-gray-800"}`}>{it.label}</span>
            </button>
          );
        })}
        <Button variant="ghost" onClick={onClose} className="w-full mt-1 text-gray-500 font-bold rounded-full">Cancel</Button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CREATE / EDIT WIZARD — Basic Info → Settings → Review
// ════════════════════════════════════════════════════════════════════════════
const COLORS = [
  { value: "turquoise", label: "🔵 Turquoise" }, { value: "coral", label: "🔴 Coral" },
  { value: "sunshine", label: "🟡 Sunshine" }, { value: "mint", label: "🟢 Mint" }, { value: "purple", label: "🟣 Purple" },
];

function HabitWizard({ mode, habit, user, onCancel, onSubmit, pending }: {
  mode: "create" | "edit"; habit?: MasterHabit; user?: User;
  onCancel: () => void; onSubmit: (data: any) => void; pending: boolean;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  const [name, setName] = useState(habit?.name || "");
  const [description, setDescription] = useState(habit?.description || "");
  const [icon, setIcon] = useState(habit?.icon || "🌞");
  const [xp, setXp] = useState(String(habit?.xpReward ?? 50));
  const [color, setColor] = useState(habit?.color || "turquoise");
  const [frequency, setFrequency] = useState(habit?.frequency || "daily");
  const [startDate, setStartDate] = useState((habit?.startDate as any) || new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState((habit?.endDate as any) || "");
  const [occurrences, setOccurrences] = useState(habit?.occurrenceLimit ? String(habit.occurrenceLimit) : "");
  const [times, setTimes] = useState<string[]>((habit?.schedule as any)?.times || ["morning"]);
  const [weekdays, setWeekdays] = useState<number[]>((habit?.schedule as any)?.weekdays || [1]);
  const [active, setActive] = useState(habit?.isActive ?? true);

  const isPremium = user?.subscriptionStatus === "active";
  const isTrial = user?.subscriptionStatus === "trial";
  const hasVoice = isPremium || isTrial;
  const [voice, setVoice] = useState<{ blob: Blob | null; name: string }>({ blob: null, name: habit?.voiceRecordingName || "" });
  const [ringtone, setRingtone] = useState(habit?.customRingtone || "gentle-chime");
  const [reminderDuration, setReminderDuration] = useState(habit?.reminderDuration || 30);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const startRec = async () => {
    if (!canRecordAudio()) { toast({ title: "Recording unavailable", description: recordingUnavailableReason(), variant: "destructive" }); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const rec = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      rec.onstop = () => { setVoice({ blob: new Blob(chunks, { type: "audio/webm" }), name: `Voice reminder ${new Date().toLocaleTimeString()}` }); stream.getTracks().forEach((t) => t.stop()); };
      recorderRef.current = rec; rec.start(); setRecording(true);
    } catch { toast({ title: "Recording error", description: "Could not access the microphone.", variant: "destructive" }); }
  };
  const stopRec = () => { recorderRef.current?.stop(); setRecording(false); };
  const playRec = () => { if (voice.blob) new Audio(URL.createObjectURL(voice.blob)).play().catch(() => {}); };

  const next = () => {
    if (step === 1 && !name.trim()) { toast({ title: "Enter a habit name", variant: "destructive" }); return; }
    setStep((s) => Math.min(3, s + 1));
  };
  const back = () => (step === 1 ? onCancel() : setStep((s) => s - 1));

  const submit = async () => {
    let voiceRecordingUrl = habit?.voiceRecording || "";
    if (voice.blob && hasVoice) {
      try {
        const up = await apiRequest("POST", "/api/objects/upload");
        const { uploadURL } = await up.json();
        const put = await fetch(uploadURL, { method: "PUT", body: voice.blob, headers: { "Content-Type": "audio/webm" } });
        if (put.ok) voiceRecordingUrl = uploadURL.split("?")[0];
      } catch { /* keep going without voice */ }
    }
    onSubmit({
      name: name.trim(), description: description.trim(), icon,
      xpReward: Math.max(5, Math.min(1000, parseInt(xp) || 50)), color, frequency,
      startDate: startDate || null, endDate: endDate || null,
      occurrenceLimit: occurrences ? parseInt(occurrences) : null,
      schedule: frequency === "daily" ? { times } : frequency === "weekly" ? { weekdays } : {},
      isActive: active,
      voiceRecording: voiceRecordingUrl, voiceRecordingName: voice.name || habit?.voiceRecordingName,
      reminderDuration: hasVoice ? reminderDuration : 30, customRingtone: hasVoice ? ringtone : "gentle-chime",
      voiceReminderEnabled: hasVoice && (!!voice.blob || !!habit?.voiceRecording),
    });
  };

  const steps = ["Basic Info", "Settings", "Review"];

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col" data-testid="habit-wizard">
      <div className="px-4 pt-[calc(var(--safe-top)+0.5rem)] pb-2 flex items-center justify-between flex-shrink-0">
        <button onClick={back} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center" aria-label="Back" data-testid="habit-wizard-back">
          {step === 1 ? <X className="w-5 h-5 text-gray-600" /> : <ArrowLeft className="w-5 h-5 text-gray-600" />}
        </button>
        <span className="font-fredoka text-lg text-gray-800">{mode === "edit" ? "Edit Habit" : "Create New Habit"}</span>
        <div className="w-10 h-10" />
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 px-6 py-3 flex-shrink-0">
        {steps.map((label, i) => {
          const n = i + 1, done = n < step, active2 = n === step;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${done ? "bg-turquoise text-white" : active2 ? "hero-gradient text-white" : "bg-gray-200 text-gray-400"}`}>{done ? <Check className="w-4 h-4" /> : n}</div>
                <span className={`text-[11px] font-semibold ${active2 ? "text-turquoise" : "text-gray-400"}`}>{label}</span>
              </div>
              {n < steps.length && <div className={`w-8 h-0.5 -mt-4 ${done ? "bg-turquoise" : "bg-gray-200"}`} />}
            </div>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-1">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-700">Habit Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Brush Teeth" className="mt-1 rounded-xl" data-testid="habit-wizard-name" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700">Description (optional)</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter description..." rows={2} className="mt-1 rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700">Icon</label>
              <div className="grid grid-cols-6 gap-2 mt-1">
                {HABIT_BADGES.map((b) => (
                  <button key={b.icon} onClick={() => setIcon(b.icon)} className={`aspect-square rounded-xl text-2xl flex items-center justify-center border-2 ${icon === b.icon ? "border-turquoise bg-turquoise/5" : "border-gray-200"}`} title={b.label} data-testid={`habit-icon-${b.icon}`}>{b.icon}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-gray-700">Frequency</label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">XP Reward</label>
                <Input type="number" min={5} max={1000} step={5} inputMode="numeric" value={xp} onChange={(e) => setXp(e.target.value)} className="mt-1 rounded-xl" data-testid="habit-wizard-xp" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-700">Color</label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{COLORS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Schedule */}
            <div className="bg-turquoise/5 border border-turquoise/20 rounded-2xl p-3 space-y-3">
              <div className="text-sm font-bold text-gray-700">📅 Schedule</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600">Start date</label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-xl mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600">End date (optional)</label>
                  <Input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-xl mt-1" />
                </div>
              </div>
              {frequency === "daily" && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-600 w-full">Time of day:</span>
                  {TIME_OF_DAY_OPTIONS.map((t) => (
                    <button key={t.id} onClick={() => setTimes((p) => p.includes(t.id) ? (p.length > 1 ? p.filter((x) => x !== t.id) : p) : [...p, t.id])} className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${times.includes(t.id) ? "bg-turquoise text-white border-turquoise" : "bg-white text-gray-600 border-gray-200"}`}>{t.emoji} {t.label}</button>
                  ))}
                </div>
              )}
              {frequency === "weekly" && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-600 w-full">Days:</span>
                  {WEEKDAY_OPTIONS.map((d) => (
                    <button key={d.id} onClick={() => setWeekdays((p) => p.includes(d.id) ? (p.length > 1 ? p.filter((x) => x !== d.id) : p) : [...p, d.id].sort())} className={`px-2.5 py-1 rounded-full text-xs font-bold border-2 ${weekdays.includes(d.id) ? "bg-turquoise text-white border-turquoise" : "bg-white text-gray-600 border-gray-200"}`}>{d.short}</button>
                  ))}
                </div>
              )}
              {frequency === "monthly" && <p className="text-xs text-gray-500">Repeats monthly on day {startDate ? new Date(startDate + "T00:00").getDate() : new Date().getDate()}.</p>}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-600">Stop after</label>
                <Input type="number" min={1} max={999} inputMode="numeric" placeholder="∞" value={occurrences} onChange={(e) => setOccurrences(e.target.value)} className="w-20 h-8 rounded-lg" />
                <span className="text-xs text-gray-500">times (blank = keep going)</span>
              </div>
            </div>

            {/* Voice reminder (premium) */}
            {hasVoice && (
              <div className="bg-gradient-to-r from-gold/10 to-yellow-100 border-2 border-gold/30 rounded-2xl p-3 space-y-2">
                <div className="font-bold text-gold flex items-center gap-2">⭐ Voice Reminder {isTrial && <span className="text-[10px] bg-sky/15 text-sky px-2 py-0.5 rounded-full">TRIAL</span>}</div>
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant={recording ? "destructive" : "default"} onClick={recording ? stopRec : startRec} className="rounded-full">
                    {recording ? <>Stop</> : <><Mic className="w-4 h-4 mr-1" />Record</>}
                  </Button>
                  {(voice.blob || habit?.voiceRecording) && <Button type="button" size="sm" variant="outline" onClick={playRec} className="rounded-full"><Play className="w-4 h-4 mr-1" />Play</Button>}
                </div>
                {voice.name && <p className="text-xs text-mint">✓ {voice.name}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-600">Ringtone</label>
                    <Select value={ringtone} onValueChange={setRingtone}>
                      <SelectTrigger className="rounded-xl mt-1 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["gentle-chime", "happy-bells", "nature-sounds", "soft-piano", "cheerful-tune"].map((r) => <SelectItem key={r} value={r}>{r.replace(/-/g, " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600">Duration</label>
                    <Select value={String(reminderDuration)} onValueChange={(v) => setReminderDuration(parseInt(v))}>
                      <SelectTrigger className="rounded-xl mt-1 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{[15, 30, 45, 60].map((m) => <SelectItem key={m} value={String(m)}>{m} min</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <button type="button" onClick={() => playRingtonePreviewTone(ringtone).catch(() => {})} className="text-xs text-sky font-bold">🔊 Preview tone</button>
              </div>
            )}

            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-3">
              <span className="text-sm font-semibold text-gray-700">Active (syncs to kids)</span>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-5">
              <div className="flex flex-col items-center mb-4">
                <div className="text-5xl w-20 h-20 rounded-3xl bg-turquoise/10 flex items-center justify-center">{icon}</div>
                <div className="font-fredoka text-xl text-gray-800 mt-2">{name || "—"}</div>
              </div>
              <ReviewRow label="XP Reward" value={`${xp} XP`} />
              <ReviewRow label="Frequency" value={cap(frequency)} />
              <ReviewRow label="Schedule" value={describeSchedule({ frequency, startDate, endDate, schedule: frequency === "daily" ? { times } : frequency === "weekly" ? { weekdays } : {} } as any)} />
              <ReviewRow label="Status" value={active ? "Active — syncs to kids" : "Inactive — hidden"} />
              {hasVoice && (voice.blob || habit?.voiceRecording) && <ReviewRow label="Voice reminder" value="On" />}
            </div>
          </div>
        )}
      </div>

      <div className="px-5 pb-[calc(1rem+var(--safe-bottom))] pt-3 flex-shrink-0">
        {step < 3 ? (
          <Button onClick={next} className="w-full super-button font-bold rounded-full text-base py-6" data-testid="habit-wizard-next">Next →</Button>
        ) : (
          <Button onClick={submit} disabled={pending} className="w-full bg-turquoise hover:bg-turquoise/80 text-white font-bold rounded-full text-base py-6" data-testid="habit-wizard-submit">
            {pending ? "Saving..." : mode === "edit" ? "💾 Save Changes" : "🎯 Create Habit"}
          </Button>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0 gap-3">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className="font-bold text-gray-800 text-right">{value}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ASSIGN SCREEN — kids with toggles
// ════════════════════════════════════════════════════════════════════════════
function AssignScreen({ habit, children, assignments, onBack, onChanged }: {
  habit: MasterHabit; children: Child[]; assignments: (Habit & { childName?: string })[]; onBack: () => void; onChanged: () => void;
}) {
  const { toast } = useToast();
  const [busyChild, setBusyChild] = useState<string | null>(null);

  const assignmentFor = (childId: string) => assignments.find((a) => a.childId === childId);

  const toggle = async (child: Child, on: boolean) => {
    setBusyChild(child.id);
    try {
      const existing = assignmentFor(child.id);
      if (on) {
        if (existing) {
          await apiRequest("PATCH", `/api/habits/${existing.id}`, { isActive: true });
        } else {
          await apiRequest("POST", `/api/children/${child.id}/habits`, {
            masterHabitId: habit.id, name: habit.name, description: habit.description, icon: habit.icon,
            color: habit.color, frequency: habit.frequency, xpReward: habit.xpReward, isActive: true,
          });
        }
      } else if (existing) {
        await apiRequest("DELETE", `/api/habits/${existing.id}`);
      }
      onChanged();
    } catch {
      toast({ title: "Error", description: "Could not update assignment.", variant: "destructive" });
    } finally {
      setBusyChild(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col" data-testid="habit-assign-screen">
      <TopBar title="Assign Habit" onBack={onBack} />
      <div className="px-4 pt-3 pb-1 flex-shrink-0">
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <span className="text-xl">{habit.icon}</span>
          <span className="font-bold text-gray-800">{habit.name}</span>
          <span className="text-gray-400">· pick kids to assign</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pt-2 space-y-2">
        {children.map((child) => {
          const on = !!assignmentFor(child.id)?.isActive;
          return (
            <div key={child.id} className="flex items-center gap-3 bg-white rounded-2xl p-2.5 shadow-sm border border-gray-100" data-testid={`assign-row-${child.id}`}>
              <img src={child.avatarUrl || getAvatarImage(child.avatarType)} alt={child.name} className="w-11 h-11 rounded-full object-cover border-2 border-turquoise/30" />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-gray-800 truncate">{child.name}</div>
                <div className="text-xs text-gray-500">Lv {child.level} · {cap(child.avatarType)}</div>
              </div>
              <Switch checked={on} disabled={busyChild === child.id} onCheckedChange={(v) => toggle(child, v)} data-testid={`assign-toggle-${child.id}`} />
            </div>
          );
        })}
        {children.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <p className="font-medium">No kids yet.</p>
            <p className="text-sm text-gray-400">Add a hero first, then assign habits.</p>
          </div>
        )}
      </div>
      <div className="px-5 pb-[calc(1rem+var(--safe-bottom))] pt-3 flex-shrink-0">
        <Button onClick={onBack} className="w-full super-button font-bold rounded-full text-base py-6" data-testid="assign-done">Done</Button>
      </div>
    </div>
  );
}

function DeleteDialog({ target, onClose, onConfirm, pending }: {
  target: MasterHabit | null; onClose: () => void; onConfirm: (id: string) => void; pending: boolean;
}) {
  return (
    <AlertDialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent data-testid="dialog-delete-habit">
        <AlertDialogHeader><AlertDialogTitle>Delete Habit</AlertDialogTitle></AlertDialogHeader>
        <AlertDialogDescription>
          Delete "{target?.name}"? This removes it from every child and can't be undone.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => target && onConfirm(target.id)} disabled={pending} className="bg-destructive hover:bg-destructive/80">
            {pending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
