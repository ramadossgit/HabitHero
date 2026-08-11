// Mobile-first Kids Management — a drill-down flow, not a long scroll.
//
//   List  →  Child Detail  →  focused editor panels
//   List  →  Create Hero wizard (Basic Info → Avatar → Review)
//
// Each screen has one job and fits a phone without scrolling. Detail and
// the wizard take over the full screen with their own top bar; the list
// stays inside the dashboard so the bottom nav is still reachable.
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getAvatarImage, AVATAR_TYPES } from "@/lib/avatars";
import type { Child } from "@shared/schema";
import {
  ArrowLeft, Plus, Search, ChevronRight, Pencil, Palette, Shield,
  BarChart3, Gift, Trash2, Check, Camera, Crown, Star, Sparkles, X,
} from "lucide-react";

type View = "list" | "detail" | "create";
type Panel = "menu" | "profile" | "avatar" | "security" | "stats";
type Filter = "all" | "active" | "inactive";

const memberSince = (d?: string | Date | null) => {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function KidsManager({
  onNavigate,
}: {
  onNavigate?: (section: "rewards" | "progress") => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: children = [] } = useQuery<Child[]>({ queryKey: ["/api/children"] });

  const [view, setView] = useState<View>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Child | null>(null);

  const selected = children.find((c) => c.id === selectedId) || null;
  const familyXp = children.reduce((t, c) => t + (c.totalXp || 0), 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return children
      .filter((c) => {
        if (filter === "active") return !!c.username;
        if (filter === "inactive") return !c.username;
        return true;
      })
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0));
  }, [children, filter, search]);

  const topScorerId = children.slice().sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0))[0]?.id;

  // ── Mutations ──────────────────────────────────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/children"] });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; avatarType: string; avatarUrl?: string; age?: number }) => {
      const res = await apiRequest("POST", "/api/children", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Hero created! ✨", description: "Your new hero is ready for adventure." });
      invalidate();
      setView("list");
    },
    onError: () => toast({ title: "Error", description: "Could not create the hero. Try again.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { childId: string; updates: Partial<Child> }) => {
      await apiRequest("PATCH", `/api/children/${data.childId}`, data.updates);
    },
    onSuccess: (_d, vars) => {
      toast({ title: "Saved ✨", description: "Hero profile updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      void vars;
    },
    onError: () => toast({ title: "Error", description: "Could not save. Try again.", variant: "destructive" }),
  });

  const credentialsMutation = useMutation({
    mutationFn: async (data: { childId: string; username: string; pin: string }) => {
      await apiRequest("PATCH", `/api/children/${data.childId}`, { username: data.username, pin: data.pin });
    },
    onSuccess: () => {
      toast({ title: "Login saved 🔐", description: "Your hero can log in now." });
      invalidate();
    },
    onError: () => toast({ title: "Error", description: "Username may be taken. Try another.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (childId: string) => { await apiRequest("DELETE", `/api/children/${childId}`); },
    onSuccess: () => {
      toast({ title: "Hero deleted", description: "Profile removed.", variant: "destructive" });
      invalidate();
      setView("list");
      setSelectedId(null);
    },
    onError: () => toast({ title: "Error", description: "Could not delete. Try again.", variant: "destructive" }),
  });

  const openDetail = (id: string) => { setSelectedId(id); setView("detail"); };

  // ── Render ───────────────────────────────────────────────────────────────
  if (view === "create") {
    return <CreateWizard onCancel={() => setView("list")} onCreate={(d) => createMutation.mutate(d)} pending={createMutation.isPending} />;
  }

  if (view === "detail" && selected) {
    return (
      <>
        <ChildDetail
          child={selected}
          isTopScorer={selected.id === topScorerId && children.length > 1}
          onBack={() => setView("list")}
          onSaveProfile={(updates) => updateMutation.mutate({ childId: selected.id, updates })}
          onSaveCredentials={(username, pin) => credentialsMutation.mutate({ childId: selected.id, username, pin })}
          onDelete={() => setDeleteTarget(selected)}
          onNavigate={onNavigate}
          savingProfile={updateMutation.isPending}
          savingCredentials={credentialsMutation.isPending}
        />
        <DeleteDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={(id) => { deleteMutation.mutate(id); setDeleteTarget(null); }} pending={deleteMutation.isPending} />
      </>
    );
  }

  // ── LIST ──
  return (
    <div className="bounce-in">
      {/* Family summary chip */}
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 bg-mint/15 text-mint font-bold text-sm rounded-full px-3 py-1.5">
          <Sparkles className="w-4 h-4" /> {children.length} Kids
        </span>
        <span className="inline-flex items-center gap-1.5 bg-sunshine/15 text-gray-700 font-bold text-sm rounded-full px-3 py-1.5">
          <Star className="w-4 h-4 text-sunshine fill-sunshine" /> Family XP: {familyXp.toLocaleString()}
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search kids..."
          className="pl-9 rounded-full bg-white border-gray-200"
          data-testid="kids-search"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-full p-1 mb-3">
        {([["all", "All"], ["active", "Active"], ["inactive", "No login"]] as [Filter, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`flex-1 rounded-full py-1.5 text-sm font-bold transition-colors ${
              filter === id ? "bg-white text-mint shadow-sm" : "text-gray-500"
            }`}
            data-testid={`kids-filter-${id}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((child) => (
          <button
            key={child.id}
            onClick={() => openDetail(child.id)}
            className="w-full flex items-center gap-3 bg-white rounded-2xl p-2.5 shadow-sm border border-gray-100 text-left hover:border-mint/40 transition-colors"
            data-testid={`kid-row-${child.id}`}
          >
            <div className="relative flex-shrink-0">
              <img src={child.avatarUrl || getAvatarImage(child.avatarType)} alt={child.name} className="w-12 h-12 rounded-full object-cover border-2 border-mint/30" />
              {child.id === topScorerId && children.length > 1 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-sunshine rounded-full flex items-center justify-center border-2 border-white">
                  <Crown className="w-2.5 h-2.5 text-white" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800 truncate">{child.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="inline-flex items-center gap-0.5 text-sunshine font-bold"><Star className="w-3 h-3 fill-sunshine" />{(child.totalXp || 0).toLocaleString()} XP</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">Lv {child.level} · {cap(child.avatarType)}{child.age != null ? ` · Age ${child.age}` : ""}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <p className="font-medium">{search ? "No kids match your search." : "No heroes yet."}</p>
            <p className="text-sm text-gray-400">Tap the + button to add your first hero.</p>
          </div>
        )}
      </div>

      {/* FAB — add hero */}
      <button
        onClick={() => setView("create")}
        className="fixed right-4 bottom-[calc(4.5rem+var(--safe-bottom))] z-40 w-14 h-14 rounded-full hero-gradient text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Add hero"
        data-testid="kids-add-fab"
      >
        <Plus className="w-7 h-7" />
      </button>

      <DeleteDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={(id) => { deleteMutation.mutate(id); setDeleteTarget(null); }} pending={deleteMutation.isPending} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHILD DETAIL — full-screen takeover with a menu of focused editor panels
// ════════════════════════════════════════════════════════════════════════════
function ChildDetail({
  child, isTopScorer, onBack, onSaveProfile, onSaveCredentials, onDelete, onNavigate, savingProfile, savingCredentials,
}: {
  child: Child;
  isTopScorer: boolean;
  onBack: () => void;
  onSaveProfile: (updates: Partial<Child>) => void;
  onSaveCredentials: (username: string, pin: string) => void;
  onDelete: () => void;
  onNavigate?: (section: "rewards" | "progress") => void;
  savingProfile: boolean;
  savingCredentials: boolean;
}) {
  const [panel, setPanel] = useState<Panel>("menu");

  const actions: { id: Panel | "rewards" | "delete"; icon: typeof Pencil; label: string; danger?: boolean }[] = [
    { id: "profile", icon: Pencil, label: "Edit Profile" },
    { id: "avatar", icon: Palette, label: "Avatar & Theme" },
    { id: "security", icon: Shield, label: "Security & Login" },
    { id: "stats", icon: BarChart3, label: "Statistics" },
    { id: "rewards", icon: Gift, label: "Rewards" },
    { id: "delete", icon: Trash2, label: "Delete Hero", danger: true },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col" data-testid="child-detail">
      {/* Top bar */}
      <div className="hero-gradient text-white px-3 pt-[calc(var(--safe-top)+0.5rem)] pb-6 rounded-b-3xl relative flex-shrink-0">
        <div className="flex items-center justify-between">
          <button onClick={panel === "menu" ? onBack : () => setPanel("menu")} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center" aria-label="Back" data-testid="detail-back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-fredoka text-lg">{panel === "menu" ? "Hero Profile" : ""}</span>
          <div className="w-10 h-10" />
        </div>
        <div className="flex flex-col items-center -mb-2 mt-1">
          <div className="relative">
            <img src={child.avatarUrl || getAvatarImage(child.avatarType)} alt={child.name} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
            {isTopScorer && (
              <span className="absolute -top-1 -right-1 w-7 h-7 bg-sunshine rounded-full flex items-center justify-center border-2 border-white">
                <Crown className="w-4 h-4 text-white" />
              </span>
            )}
          </div>
          <h2 className="font-fredoka text-2xl mt-2">{child.name}</h2>
          <span className="inline-flex items-center gap-1 text-sunshine font-bold"><Star className="w-4 h-4 fill-sunshine" />{(child.totalXp || 0).toLocaleString()} XP</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 -mt-3">
        {panel === "menu" && (
          <>
            {/* Stat strip */}
            <div className="grid grid-cols-3 gap-2 bg-white rounded-2xl shadow-md border border-gray-100 p-3 mb-4">
              <Stat label="Level" value={`${child.level}`} />
              <Stat label="Age" value={child.age != null ? `${child.age}` : "—"} />
              <Stat label="Member" value={memberSince(child.createdAt as any)} />
            </div>

            {/* Action list */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 divide-y divide-gray-100 overflow-hidden">
              {actions.map((a) => {
                const Icon = a.icon;
                const onClick =
                  a.id === "delete" ? onDelete
                  : a.id === "rewards" ? () => onNavigate?.("rewards")
                  : () => setPanel(a.id as Panel);
                return (
                  <button
                    key={a.id}
                    onClick={onClick}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
                    data-testid={`detail-action-${a.id}`}
                  >
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${a.danger ? "bg-destructive/10 text-destructive" : "bg-mint/10 text-mint"}`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className={`flex-1 font-bold ${a.danger ? "text-destructive" : "text-gray-800"}`}>{a.label}</span>
                    <ChevronRight className={`w-5 h-5 ${a.danger ? "text-destructive/40" : "text-gray-300"}`} />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {panel === "profile" && (
          <ProfilePanel child={child} saving={savingProfile} onSave={(updates) => { onSaveProfile(updates); setPanel("menu"); }} />
        )}
        {panel === "avatar" && (
          <AvatarPanel child={child} saving={savingProfile} onSave={(avatarType, avatarUrl) => { onSaveProfile({ avatarType, avatarUrl }); setPanel("menu"); }} />
        )}
        {panel === "security" && (
          <SecurityPanel child={child} saving={savingCredentials} onSave={(u, p) => { onSaveCredentials(u, p); setPanel("menu"); }} />
        )}
        {panel === "stats" && (
          <StatsPanel child={child} onViewReports={() => onNavigate?.("progress")} />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="font-fredoka text-lg text-gray-800 leading-tight">{value}</div>
      <div className="text-[11px] text-gray-500 font-semibold">{label}</div>
    </div>
  );
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-fredoka text-xl text-gray-800 mb-3 mt-1">{children}</h3>;
}

// ── Editor panels ────────────────────────────────────────────────────────────
function ProfilePanel({ child, saving, onSave }: { child: Child; saving: boolean; onSave: (u: Partial<Child>) => void }) {
  const [name, setName] = useState(child.name);
  const [age, setAge] = useState(child.age != null ? String(child.age) : "");
  return (
    <div className="pb-6">
      <PanelTitle>Edit Profile</PanelTitle>
      <label className="text-sm font-bold text-gray-700">Hero Name</label>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter hero name..." className="mb-4 mt-1 rounded-xl" />
      <label className="text-sm font-bold text-gray-700">Age (3–12)</label>
      <Input type="number" min={3} max={12} inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age (3–12 years)" className="mt-1 rounded-xl" />
      <p className="text-xs text-gray-500 mt-1 mb-4">Age picks which mini-games appear in their Game Zone.</p>
      <Button
        onClick={() => onSave({ name: name.trim(), age: age ? parseInt(age, 10) : null })}
        disabled={saving || !name.trim()}
        className="w-full super-button font-bold rounded-full"
      >
        {saving ? "Saving..." : "✨ Save Changes"}
      </Button>
    </div>
  );
}

function AvatarPanel({ child, saving, onSave }: { child: Child; saving: boolean; onSave: (avatarType: string, avatarUrl?: string) => void }) {
  const [type, setType] = useState(child.avatarType);
  const [preview, setPreview] = useState<string>("");
  const onUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div className="pb-6">
      <PanelTitle>Choose Avatar</PanelTitle>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {AVATAR_TYPES.map((a) => {
          const active = !preview && type === a.id;
          return (
            <button
              key={a.id}
              onClick={() => { setType(a.id); setPreview(""); }}
              className={`relative rounded-2xl p-3 border-2 flex flex-col items-center gap-1 transition-all ${active ? "border-mint bg-mint/5" : "border-gray-200 bg-white"}`}
              data-testid={`avatar-choice-${a.id}`}
            >
              {active && <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-mint flex items-center justify-center"><Check className="w-3 h-3 text-white" /></span>}
              <img src={getAvatarImage(a.id)} alt={a.name} className="w-16 h-16 rounded-full object-cover" />
              <span className="text-sm font-bold text-gray-700">{a.name.replace(/^\S+\s/, "")}</span>
            </button>
          );
        })}
      </div>

      <label htmlFor="avatar-upload" className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-sky/50 text-sky rounded-2xl py-4 mb-4 cursor-pointer font-bold hover:bg-sky/5">
        {preview ? <img src={preview} alt="preview" className="w-8 h-8 rounded-full object-cover" /> : <Camera className="w-5 h-5" />}
        {preview ? "Custom photo selected" : "Upload Custom Avatar"}
      </label>
      <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />

      <Button onClick={() => onSave(type, preview || undefined)} disabled={saving} className="w-full super-button font-bold rounded-full">
        {saving ? "Saving..." : "✨ Save Avatar"}
      </Button>
    </div>
  );
}

function SecurityPanel({ child, saving, onSave }: { child: Child; saving: boolean; onSave: (username: string, pin: string) => void }) {
  const { toast } = useToast();
  const [username, setUsername] = useState(child.username || "");
  const [pin, setPin] = useState("");
  const submit = () => {
    if (!username.trim()) { toast({ title: "Username required", variant: "destructive" }); return; }
    if (pin.length !== 4) { toast({ title: "Enter a 4-digit PIN", variant: "destructive" }); return; }
    onSave(username.trim(), pin);
  };
  return (
    <div className="pb-6">
      <PanelTitle>Security & Login</PanelTitle>
      <p className="text-sm text-gray-600 mb-4">Create a username and 4-digit PIN so {child.name} can log in on their own device.</p>
      <label className="text-sm font-bold text-gray-700">Username</label>
      <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a fun username..." className="mb-4 mt-1 rounded-xl" />
      <label className="text-sm font-bold text-gray-700">4-Digit PIN</label>
      <Input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="e.g. 1234" className="mt-1 rounded-xl mb-4" />
      <Button onClick={submit} disabled={saving} className="w-full super-button font-bold rounded-full">
        {saving ? "Saving..." : "🔐 Save Login"}
      </Button>
      {child.username && (
        <p className="text-sm text-mint bg-mint/10 rounded-xl p-2.5 mt-3 text-center">✅ Logs in as <strong>{child.username}</strong></p>
      )}
    </div>
  );
}

function StatsPanel({ child, onViewReports }: { child: Child; onViewReports: () => void }) {
  const tiles = [
    { label: "Total XP", value: (child.totalXp || 0).toLocaleString(), bg: "bg-sunshine/10", fg: "text-gray-800" },
    { label: "Reward Points", value: (child.rewardPoints || 0).toLocaleString(), bg: "bg-coral/10", fg: "text-gray-800" },
    { label: "Current Level", value: `${child.level}`, bg: "bg-mint/10", fg: "text-gray-800" },
    { label: "Current XP", value: (child.xp || 0).toLocaleString(), bg: "bg-sky/10", fg: "text-gray-800" },
  ];
  return (
    <div className="pb-6">
      <PanelTitle>Statistics</PanelTitle>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {tiles.map((t) => (
          <div key={t.label} className={`${t.bg} rounded-2xl p-4 text-center`}>
            <div className={`font-fredoka text-2xl ${t.fg}`}>{t.value}</div>
            <div className="text-xs text-gray-500 font-semibold">{t.label}</div>
          </div>
        ))}
      </div>
      <Button onClick={onViewReports} className="w-full bg-coral hover:bg-coral/80 text-white font-bold rounded-full">
        📊 View Full Reports
      </Button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CREATE WIZARD — Basic Info → Avatar → Review, one step per screen
// ════════════════════════════════════════════════════════════════════════════
function CreateWizard({ onCancel, onCreate, pending }: {
  onCancel: () => void;
  onCreate: (d: { name: string; avatarType: string; avatarUrl?: string; age?: number }) => void;
  pending: boolean;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [avatarType, setAvatarType] = useState("robot");
  const [preview, setPreview] = useState<string>("");

  const onUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const next = () => {
    if (step === 1 && !name.trim()) { toast({ title: "Enter a hero name", variant: "destructive" }); return; }
    setStep((s) => Math.min(3, s + 1));
  };
  const back = () => (step === 1 ? onCancel() : setStep((s) => s - 1));

  const steps = ["Basic Info", "Avatar", "Review"];

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col" data-testid="create-wizard">
      {/* Top bar */}
      <div className="px-4 pt-[calc(var(--safe-top)+0.5rem)] pb-2 flex items-center justify-between flex-shrink-0">
        <button onClick={back} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center" aria-label="Back" data-testid="wizard-back">
          {step === 1 ? <X className="w-5 h-5 text-gray-600" /> : <ArrowLeft className="w-5 h-5 text-gray-600" />}
        </button>
        <span className="font-fredoka text-lg text-gray-800">New Hero</span>
        <div className="w-10 h-10" />
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 px-6 py-3 flex-shrink-0">
        {steps.map((label, i) => {
          const n = i + 1;
          const done = n < step, active = n === step;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${done ? "bg-mint text-white" : active ? "hero-gradient text-white" : "bg-gray-200 text-gray-400"}`}>
                  {done ? <Check className="w-4 h-4" /> : n}
                </div>
                <span className={`text-[11px] font-semibold ${active ? "text-mint" : "text-gray-400"}`}>{label}</span>
              </div>
              {n < steps.length && <div className={`w-8 h-0.5 -mt-4 ${done ? "bg-mint" : "bg-gray-200"}`} />}
            </div>
          );
        })}
      </div>

      {/* Step body */}
      <div className="flex-1 overflow-y-auto px-5 pt-2">
        {step === 1 && (
          <div>
            <h3 className="font-fredoka text-xl text-mint mb-4">Basic Information</h3>
            <label className="text-sm font-bold text-gray-700">Hero Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter hero name..." className="mt-1 mb-4 rounded-xl" data-testid="wizard-name" />
            <label className="text-sm font-bold text-gray-700">Child's Age</label>
            <Input type="number" min={3} max={12} inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age (3–12 years)" className="mt-1 rounded-xl" data-testid="wizard-age" />
            <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 mt-3">Age picks which mini-games appear in their Game Zone.</p>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="font-fredoka text-xl text-mint mb-4">Choose Avatar</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {AVATAR_TYPES.map((a) => {
                const active = !preview && avatarType === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => { setAvatarType(a.id); setPreview(""); }}
                    className={`relative rounded-2xl p-3 border-2 flex flex-col items-center gap-1 transition-all ${active ? "border-mint bg-mint/5" : "border-gray-200 bg-white"}`}
                    data-testid={`wizard-avatar-${a.id}`}
                  >
                    {active && <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-mint flex items-center justify-center"><Check className="w-3 h-3 text-white" /></span>}
                    <img src={getAvatarImage(a.id)} alt={a.name} className="w-20 h-20 rounded-full object-cover" />
                    <span className="text-sm font-bold text-gray-700">{a.name.replace(/^\S+\s/, "")}</span>
                  </button>
                );
              })}
            </div>
            <label htmlFor="wizard-upload" className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-sky/50 text-sky rounded-2xl py-4 cursor-pointer font-bold hover:bg-sky/5">
              {preview ? <img src={preview} alt="preview" className="w-8 h-8 rounded-full object-cover" /> : <Camera className="w-5 h-5" />}
              {preview ? "Custom photo selected" : "Upload Custom Avatar"}
            </label>
            <input id="wizard-upload" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="font-fredoka text-xl text-mint mb-4">Review & Confirm</h3>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-5">
              <div className="flex justify-center mb-4">
                <img src={preview || getAvatarImage(avatarType)} alt="avatar" className="w-24 h-24 rounded-full object-cover border-4 border-mint/20" />
              </div>
              <ReviewRow label="Hero Name" value={name || "—"} />
              <ReviewRow label="Age" value={age ? `${age} Years` : "—"} />
              <ReviewRow label="Avatar" value={preview ? "Custom photo" : cap(avatarType)} />
            </div>
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="px-5 pb-[calc(1rem+var(--safe-bottom))] pt-3 flex-shrink-0 space-y-2">
        {step < 3 ? (
          <Button onClick={next} className="w-full super-button font-bold rounded-full text-base py-6" data-testid="wizard-continue">
            Continue →
          </Button>
        ) : (
          <>
            <Button
              onClick={() => onCreate({ name: name.trim(), avatarType, avatarUrl: preview || undefined, age: age ? parseInt(age, 10) : undefined })}
              disabled={pending}
              className="w-full bg-mint hover:bg-mint/80 text-white font-bold rounded-full text-base py-6"
              data-testid="wizard-create"
            >
              {pending ? "Creating..." : "✨ Create Hero"}
            </Button>
            <Button onClick={onCancel} variant="ghost" className="w-full text-gray-500 font-bold rounded-full">Cancel</Button>
          </>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="font-bold text-gray-800">{value}</span>
    </div>
  );
}

function DeleteDialog({ target, onClose, onConfirm, pending }: {
  target: Child | null; onClose: () => void; onConfirm: (id: string) => void; pending: boolean;
}) {
  return (
    <AlertDialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent data-testid="dialog-delete-child">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Hero Profile</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          Are you sure you want to delete {target?.name}'s hero profile? This permanently removes all their progress, habits and rewards.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => target && onConfirm(target.id)}
            disabled={pending}
            className="bg-destructive hover:bg-destructive/80"
          >
            {pending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
