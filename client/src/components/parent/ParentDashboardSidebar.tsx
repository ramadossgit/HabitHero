import { Home, Users, CheckSquare, Gift, BarChart3, Settings } from "lucide-react";
import type { User } from "@shared/schema";

interface SidebarProps {
  activeSection: 'overview' | 'habits' | 'children' | 'rewards' | 'progress' | 'settings';
  onSectionChange: (section: 'overview' | 'habits' | 'children' | 'rewards' | 'progress' | 'settings') => void;
  user?: User;
}

const menuItems = [
  { id: 'overview' as const, label: 'Overview', icon: Home },
  { id: 'children' as const, label: 'Children & PINs', icon: Users },
  { id: 'habits' as const, label: 'Habits', icon: CheckSquare },
  { id: 'rewards' as const, label: 'Rewards', icon: Gift },
  { id: 'progress' as const, label: 'Progress', icon: BarChart3 },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
];

// Horizontal pill navigation — same pattern as the kid dashboard's tab bar.
// Always visible (no hamburger), sticky, icons-only on phones with the
// active section's label shown so every section is one tap away.
export default function ParentDashboardSidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <nav
      className="sticky top-0 z-40 px-2 pt-2 sm:px-4"
      data-testid="sidebar-parent-dashboard"
      aria-label="Dashboard sections"
    >
      <div className="max-w-6xl mx-auto flex items-center gap-1 overflow-x-auto rounded-2xl bg-white/95 backdrop-blur-sm border border-white/20 shadow-md p-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              data-testid={`sidebar-item-${item.id}`}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-bold transition-colors flex-shrink-0 ${
                active
                  ? 'bg-coral text-white shadow'
                  : 'text-gray-600 hover:bg-coral/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              {/* phones show only the active label to save space */}
              <span className={active ? 'inline' : 'hidden sm:inline'}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
