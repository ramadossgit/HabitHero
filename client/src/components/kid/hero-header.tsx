import { Progress } from "@/components/ui/progress";
import ChildAvatar from "@/components/avatar/ChildAvatar";
import InteractiveAvatar from "@/components/avatar/InteractiveAvatar";
import { Button } from "@/components/ui/button";
import { Zap, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AVATAR_BY_ID } from "@shared/avatar-system";
import type { Child } from "@shared/schema";

interface HeroHeaderProps {
  child: Child;
}

export default function HeroHeader({ child }: HeroHeaderProps) {
  const { toast } = useToast();

  // ── One currency across the whole app: XP ⚡ ──────────────────────────────
  // `rewardPoints` is the spendable XP kids earn from habits and spend in the
  // shop. The Level bar is a separate RANK meter (driven by level progress),
  // so buying gear never lowers a kid's level.
  const xp = child.rewardPoints || 0;
  const level = child.level || 1;
  const levelProgress = Math.min(100, ((child.xp || 0) / 1000) * 100);

  const handleLogout = () => {
    toast({ title: "Logging out...", description: "See you next time, hero!" });
    window.location.href = "/api/logout";
  };

  // Prefer the modular hero's name so the header matches the avatar on screen.
  const modular = child.avatarId ? AVATAR_BY_ID[child.avatarId] : undefined;
  const avatarTypeCapitalized = (child.avatarType || "robot").charAt(0).toUpperCase() +
    (child.avatarType || "robot").slice(1);
  const heroLabel = modular?.name || `${avatarTypeCapitalized} Hero`;

  return (
    <header className="hero-gradient text-white px-4 pt-3 pb-4 sm:p-6 rounded-b-3xl">
      <div className="max-w-6xl mx-auto">
        {/* Single compact row: avatar, name + level, XP + logout */}
        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-6">
          <InteractiveAvatar
            size={64}
            bubble={false}
            trigger={child.xp || 0}
            className="flex-shrink-0"
            ariaLabel={`Tap ${child.name || 'your hero'} to say hi!`}
          >
            <ChildAvatar
              child={child as any}
              size={64}
              className="w-16 h-16 rounded-full border-4 border-white avatar-glow bg-white/20"
            />
          </InteractiveAvatar>
          <div className="min-w-0 flex-1">
            <h1 className="font-fredoka text-xl sm:text-2xl truncate">{child.name || 'Hero'}</h1>
            <p className="text-white/90 font-nunito font-semibold text-sm sm:text-base truncate">
              Level {level} · {heroLabel}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span
              className="inline-flex items-center gap-1 bg-white/25 rounded-full px-2.5 py-1 font-fredoka text-sm sm:text-base"
              data-testid="header-xp"
            >
              <Zap className="w-4 h-4 fill-sunshine text-sunshine" /> {xp.toLocaleString()} XP
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:text-white whitespace-nowrap"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Level rank meter (progress toward the next level) */}
        <div className="space-y-1 sm:space-y-2">
          <div className="flex justify-between text-xs sm:text-sm font-nunito font-semibold">
            <span>Level {level}</span>
            <span className="text-white/80">Level {level + 1}</span>
          </div>
          <Progress value={levelProgress} className="h-2.5" />
        </div>
      </div>
    </header>
  );
}
