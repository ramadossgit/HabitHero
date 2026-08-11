import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getAvatarImage } from "@/lib/avatars";
import {
  Star, Trophy, Heart, Gamepad2, Shield, Sparkles, ChevronRight, Check,
} from "lucide-react";

// Mobile-first landing tuned to fit a phone WITHOUT scrolling: a compact
// mascot hero, feature chips, two high-contrast entry cards and Start Free
// Trial — all reachable at a glance on the app's own gradient/palette.
export default function Landing() {
  const [, setLocation] = useLocation();

  const features = [
    { icon: Star, label: "Avatars", tint: "bg-coral" },
    { icon: Trophy, label: "XP & Rewards", tint: "bg-sunshine" },
    { icon: Heart, label: "Missions", tint: "bg-sky" },
    { icon: Gamepad2, label: "Mini-Games", tint: "bg-mint" },
    { icon: Shield, label: "Safe", tint: "bg-purple" },
  ];

  return (
    <div className="relative h-[100dvh] hero-gradient overflow-hidden">
      {/* Soft depth blobs (theme colours) */}
      <div className="pointer-events-none absolute -top-16 -left-16 w-56 h-56 rounded-full bg-sunshine/30 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-20 w-64 h-64 rounded-full bg-coral/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-mint/30 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-md h-full px-5 pt-[calc(var(--safe-top)+0.75rem)] pb-[calc(var(--safe-bottom)+1rem)] flex flex-col">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-fredoka text-lg text-white tracking-wide">Habit Heroes</span>
        </div>

        {/* Hero: compact mascot cluster + headline */}
        <div className="text-center flex-shrink-0 mt-2">
          <div className="relative h-24 flex items-end justify-center gap-1">
            <img src={getAvatarImage("ninja")} alt="Ninja hero" className="w-14 h-14 rounded-full border-[3px] border-white/70 shadow-lg object-cover mb-2 float" />
            <img src={getAvatarImage("robot")} alt="Robot hero" className="w-20 h-20 rounded-full border-4 border-white shadow-2xl object-cover float" style={{ animationDelay: "0.6s" }} />
            <img src={getAvatarImage("princess")} alt="Princess hero" className="w-14 h-14 rounded-full border-[3px] border-white/70 shadow-lg object-cover mb-2 float" style={{ animationDelay: "1.2s" }} />
          </div>
          <h1 className="font-fredoka text-4xl leading-none text-white drop-shadow-lg mt-1">Habit Heroes</h1>
          <p className="mt-1.5 text-white/90 font-nunito font-semibold text-base px-2">
            Turn habits into <span className="text-sunshine font-bold">epic adventures</span> 🚀
          </p>
          <div className="inline-flex items-center gap-1.5 mt-2.5 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-3.5 py-1">
            <Check className="w-4 h-4 text-mint" />
            <span className="text-white text-[13px] font-bold">Free 7-day trial · No card needed</span>
          </div>
        </div>

        {/* Feature chips */}
        <div className="mt-3 -mx-5 px-5 overflow-x-auto no-scrollbar flex-shrink-0">
          <div className="flex gap-2 w-max mx-auto">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="flex flex-col items-center gap-1 bg-white/12 backdrop-blur-sm border border-white/15 rounded-2xl px-3 py-2">
                  <div className={`w-9 h-9 ${f.tint} rounded-xl flex items-center justify-center shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white text-[10px] font-bold whitespace-nowrap">{f.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Entry points — pushed to the lower half, always visible */}
        <div className="mt-auto space-y-2.5 flex-shrink-0">
          <button
            onClick={() => setLocation("/kids-login")}
            data-testid="kids-play-button"
            className="w-full flex items-center gap-3 bg-white rounded-3xl p-2.5 shadow-2xl active:scale-[0.98] transition-transform text-left"
          >
            <img src={getAvatarImage("animal")} alt="Kid hero" className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-fredoka text-lg text-gray-800">🎮 Kids Play Here</div>
              <div className="text-xs text-gray-500 font-semibold">Log in & start your adventure</div>
            </div>
            <div className="w-9 h-9 rounded-full hero-gradient flex items-center justify-center flex-shrink-0">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </button>

          {/* High-contrast solid Parents card (was low-visibility glass) */}
          <button
            onClick={() => setLocation("/parent/auth?mode=login")}
            data-testid="parents-manage-button"
            className="w-full flex items-center gap-3 bg-sky rounded-3xl p-2.5 shadow-2xl active:scale-[0.98] transition-transform text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/25 flex items-center justify-center flex-shrink-0 text-2xl">👨‍👩‍👧‍👦</div>
            <div className="min-w-0 flex-1">
              <div className="font-fredoka text-lg text-white">Parents Manage</div>
              <div className="text-xs text-white/90 font-semibold">Set habits, rewards & controls</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </button>

          <Button
            onClick={() => setLocation("/parent/auth?mode=register")}
            data-testid="sign-up-button"
            className="w-full super-button font-bold text-base py-5 rounded-full"
          >
            🚀 Start Free Trial
          </Button>
        </div>

        {/* Social proof */}
        <div className="pt-3 text-center flex-shrink-0">
          <div className="flex items-center justify-center gap-2 text-white/90 text-xs font-semibold">
            <div className="flex -space-x-2">
              {["robot", "princess", "ninja", "animal"].map((t) => (
                <img key={t} src={getAvatarImage(t)} alt="" className="w-6 h-6 rounded-full border-2 border-white object-cover" />
              ))}
            </div>
            <span>Loved by 10,000+ families</span>
            <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-sunshine text-sunshine" />4.9</span>
          </div>
        </div>
      </div>
    </div>
  );
}
