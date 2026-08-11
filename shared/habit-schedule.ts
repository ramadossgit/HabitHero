// Habit scheduling shared by client and server.
//
// A habit has a start date, an optional end (end date and/or a maximum
// number of occurrences) and a frequency:
//   daily   → optionally tagged with times of day (morning/evening/night)
//   weekly  → runs on selected weekdays
//   monthly → runs on the start date's day of month

export type HabitTimeOfDay = "morning" | "evening" | "night";

export interface HabitSchedule {
  /** daily: which parts of the day the habit belongs to (display/reminder) */
  times?: HabitTimeOfDay[];
  /** weekly: 0 = Sunday … 6 = Saturday */
  weekdays?: number[];
}

export const TIME_OF_DAY_OPTIONS: { id: HabitTimeOfDay; label: string; emoji: string }[] = [
  { id: "morning", label: "Morning", emoji: "🌅" },
  { id: "evening", label: "Evening", emoji: "🌇" },
  { id: "night", label: "Night", emoji: "🌙" },
];

export const WEEKDAY_OPTIONS = [
  { id: 0, label: "Sunday", short: "Sun" },
  { id: 1, label: "Monday", short: "Mon" },
  { id: 2, label: "Tuesday", short: "Tue" },
  { id: 3, label: "Wednesday", short: "Wed" },
  { id: 4, label: "Thursday", short: "Thu" },
  { id: 5, label: "Friday", short: "Fri" },
  { id: 6, label: "Saturday", short: "Sat" },
];

/** Kid-friendly badge identities used as habit icons across the app. */
export const HABIT_BADGES = [
  { icon: "🌞", label: "Morning Master" },
  { icon: "🦷", label: "Super Smiler" },
  { icon: "🍎", label: "Healthy Hero" },
  { icon: "💧", label: "Water Warrior" },
  { icon: "📚", label: "Book Explorer" },
  { icon: "🎨", label: "Creative Genius" },
  { icon: "🏃", label: "Fitness Champion" },
  { icon: "❤️", label: "Kindness King/Queen" },
  { icon: "🧸", label: "Responsibility Ranger" },
  { icon: "🧠", label: "Mind Ninja" },
  { icon: "🌙", label: "Sleep Star" },
  { icon: "🎯", label: "Goal Crusher" },
] as const;

interface ScheduledHabitLike {
  frequency?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  schedule?: HabitSchedule | unknown | null;
}

function toDateOnly(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  // 'YYYY-MM-DD' — parse as LOCAL date (new Date('YYYY-MM-DD') would be UTC)
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/**
 * Is the habit scheduled to run on the given day?
 * Habits without scheduling info behave like before: every day.
 */
export function isHabitScheduledOn(habit: ScheduledHabitLike, day: Date = new Date()): boolean {
  const today = new Date(day.getFullYear(), day.getMonth(), day.getDate());

  const start = habit.startDate ? toDateOnly(habit.startDate) : null;
  if (start && today < start) return false;

  const end = habit.endDate ? toDateOnly(habit.endDate) : null;
  if (end && today > end) return false;

  const schedule = (habit.schedule ?? {}) as HabitSchedule;
  switch (habit.frequency) {
    case "weekly": {
      const weekdays = Array.isArray(schedule.weekdays) && schedule.weekdays.length > 0
        ? schedule.weekdays
        : start
          ? [start.getDay()]
          : null;
      return weekdays ? weekdays.includes(today.getDay()) : true;
    }
    case "monthly": {
      const anchor = start ?? today;
      // Clamp for short months: a habit anchored on the 31st runs on the
      // last day of 30/29/28-day months
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      return today.getDate() === Math.min(anchor.getDate(), lastDay);
    }
    default:
      // daily (times of day are informational)
      return true;
  }
}

/** Human summary of a habit's schedule for parent/kid UIs. */
export function describeSchedule(habit: ScheduledHabitLike & { occurrenceLimit?: number | null }): string {
  const schedule = (habit.schedule ?? {}) as HabitSchedule;
  let base: string;
  switch (habit.frequency) {
    case "weekly": {
      const days = (schedule.weekdays ?? []).map((d) => WEEKDAY_OPTIONS[d]?.short).filter(Boolean);
      base = days.length ? `Weekly · ${days.join(", ")}` : "Weekly";
      break;
    }
    case "monthly":
      base = "Monthly";
      break;
    default: {
      const times = (schedule.times ?? [])
        .map((t) => TIME_OF_DAY_OPTIONS.find((o) => o.id === t)?.emoji)
        .filter(Boolean);
      base = times.length ? `Daily · ${times.join(" ")}` : "Daily";
    }
  }
  if (habit.endDate) base += ` · until ${String(habit.endDate).slice(0, 10)}`;
  if (habit.occurrenceLimit) base += ` · ${habit.occurrenceLimit}x goal`;
  return base;
}
