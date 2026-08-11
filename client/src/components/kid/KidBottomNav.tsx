import { Gamepad2, Settings, Trophy, Star, Lock, type LucideIcon } from "lucide-react";

export type KidTab = "missions" | "customize" | "rewards" | "games" | "progress";

interface KidBottomNavProps {
  active: KidTab;
  onSelect: (tab: KidTab) => void;
  featuresEnabled: {
    habits: boolean;
    gearShop: boolean;
    rewards: boolean;
    miniGames: boolean;
  };
}

const ITEMS: { id: KidTab; label: string; icon: LucideIcon; active: string; feature?: keyof KidBottomNavProps["featuresEnabled"] }[] = [
  { id: "missions", label: "Missions", icon: Gamepad2, active: "text-coral", feature: "habits" },
  { id: "customize", label: "Customize", icon: Settings, active: "text-mint", feature: "gearShop" },
  { id: "rewards", label: "Rewards", icon: Trophy, active: "text-sunshine", feature: "rewards" },
  { id: "games", label: "Games", icon: Gamepad2, active: "text-turquoise", feature: "miniGames" },
  { id: "progress", label: "Progress", icon: Star, active: "text-sunshine" },
];

// Kid navigation in the thumb zone (mobile-first). Same theme colours;
// a locked feature shows a padlock and can't be tapped.
export default function KidBottomNav({ active, onSelect, featuresEnabled }: KidBottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] pb-[var(--safe-bottom)]"
      aria-label="Sections"
      data-testid="kid-bottom-nav"
    >
      <div className="max-w-2xl mx-auto grid grid-cols-5">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const enabled = item.feature ? featuresEnabled[item.feature] : true;
          const isActive = active === item.id && enabled;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              aria-label={item.label}
              disabled={!enabled}
              onClick={() => enabled && onSelect(item.id)}
              data-testid={`kid-tab-${item.id}`}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 min-h-[3.5rem] font-bold text-[11px] transition-colors ${
                !enabled ? "text-gray-300" : isActive ? item.active : "text-gray-500"
              }`}
            >
              <span className={`rounded-full px-3.5 py-1 ${isActive ? "bg-current/10" : ""}`}>
                {enabled ? <Icon className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </span>
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
