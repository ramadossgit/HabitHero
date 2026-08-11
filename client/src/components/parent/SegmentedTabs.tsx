import type { LucideIcon } from "lucide-react";

export interface Segment<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  badge?: number;
}

interface SegmentedTabsProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (id: T) => void;
  testIdPrefix?: string;
}

/**
 * Option-1 style segmented control (Habits | Assign | Approvals).
 * Sub-navigation inside a section — keeps the app's coral theme.
 */
export function SegmentedTabs<T extends string>({
  segments, value, onChange, testIdPrefix = "segment",
}: SegmentedTabsProps<T>) {
  return (
    <div
      className="flex items-center gap-1 overflow-x-auto"
      role="tablist"
      aria-label="Section tabs"
    >
      {segments.map((seg) => {
        const Icon = seg.icon;
        const active = value === seg.id;
        return (
          <button
            key={seg.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(seg.id)}
            data-testid={`${testIdPrefix}-${seg.id}`}
            className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-bold transition-colors flex-shrink-0 ${
              active
                ? "bg-coral text-white shadow"
                : "bg-white/70 text-gray-600 hover:bg-white"
            }`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {seg.label}
            {!!seg.badge && seg.badge > 0 && (
              <span
                className={`min-w-[1.15rem] h-[1.15rem] px-1 rounded-full text-[10px] font-black flex items-center justify-center ${
                  active ? "bg-white text-coral" : "bg-red-500 text-white"
                }`}
              >
                {seg.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface FilterPillsProps<T extends string> {
  filters: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
  testIdPrefix?: string;
}

/** Option-1 style filter row (All | Active | Inactive | Unassigned). */
export function FilterPills<T extends string>({
  filters, value, onChange, testIdPrefix = "filter",
}: FilterPillsProps<T>) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
      {filters.map((f) => {
        const active = value === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            data-testid={`${testIdPrefix}-${f.id}`}
            aria-pressed={active}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold border-2 transition-colors flex-shrink-0 ${
              active
                ? "bg-mint text-white border-mint"
                : "bg-white text-gray-600 border-gray-200 hover:border-mint/50"
            }`}
          >
            {f.label}
            {f.count !== undefined && ` (${f.count})`}
          </button>
        );
      })}
    </div>
  );
}
