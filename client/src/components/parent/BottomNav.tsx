import { Home, CheckSquare, Gift, Users, BarChart3, Settings } from "lucide-react";

export type ParentSection =
  | 'overview' | 'habits' | 'children' | 'rewards' | 'progress' | 'settings';

interface BottomNavProps {
  activeSection: ParentSection;
  onSectionChange: (section: ParentSection) => void;
  approvalCount?: number;
}

// Every section lives directly in the thumb zone — no "More" sheet, so any
// page is always one tap from the Dashboard (Home) and every other section.
const ITEMS: { id: ParentSection; label: string; ariaLabel?: string; icon: typeof Home }[] = [
  { id: 'overview', label: 'Home', icon: Home },
  { id: 'children', label: 'Kids', ariaLabel: 'Children & PINs', icon: Users },
  { id: 'habits', label: 'Habits', icon: CheckSquare },
  { id: 'rewards', label: 'Rewards', icon: Gift },
  { id: 'progress', label: 'Progress', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function BottomNav({ activeSection, onSectionChange, approvalCount = 0 }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] pb-[var(--safe-bottom)]"
      data-testid="sidebar-parent-dashboard"
      aria-label="Main sections"
    >
      <div className="max-w-3xl mx-auto grid grid-cols-6">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          const badge = item.id === 'habits' ? approvalCount : 0;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              data-testid={`sidebar-item-${item.id}`}
              aria-label={item.ariaLabel || item.label}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-2 min-h-[3.5rem] font-bold text-[10px] sm:text-[11px] transition-colors ${
                active ? 'text-coral' : 'text-gray-500'
              }`}
            >
              <span className={`relative rounded-full px-3 py-1 ${active ? 'bg-coral/10' : ''}`}>
                <Icon className="w-5 h-5" />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-destructive text-white text-[10px] font-black flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </span>
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
