// @vitest-environment node
import { describe, it, expect } from "vitest";
import { isHabitScheduledOn, describeSchedule, HABIT_BADGES } from "@shared/habit-schedule";

const d = (s: string) => new Date(s + "T12:00:00");

describe("isHabitScheduledOn", () => {
  it("daily habits run every day inside the window", () => {
    const habit = { frequency: "daily", startDate: "2026-07-01", endDate: "2026-07-31" };
    expect(isHabitScheduledOn(habit, d("2026-07-01"))).toBe(true);
    expect(isHabitScheduledOn(habit, d("2026-07-15"))).toBe(true);
    expect(isHabitScheduledOn(habit, d("2026-06-30"))).toBe(false); // before start
    expect(isHabitScheduledOn(habit, d("2026-08-01"))).toBe(false); // after end
  });

  it("weekly habits run only on their selected weekdays", () => {
    // 2026-07-13 is a Monday
    const habit = { frequency: "weekly", startDate: "2026-07-01", schedule: { weekdays: [1, 3] } };
    expect(isHabitScheduledOn(habit, d("2026-07-13"))).toBe(true);  // Mon
    expect(isHabitScheduledOn(habit, d("2026-07-15"))).toBe(true);  // Wed
    expect(isHabitScheduledOn(habit, d("2026-07-14"))).toBe(false); // Tue
  });

  it("weekly habits without explicit days default to the start date's weekday", () => {
    // 2026-07-03 is a Friday
    const habit = { frequency: "weekly", startDate: "2026-07-03" };
    expect(isHabitScheduledOn(habit, d("2026-07-10"))).toBe(true);  // next Friday
    expect(isHabitScheduledOn(habit, d("2026-07-11"))).toBe(false); // Saturday
  });

  it("monthly habits run on the start date's day of month, clamped for short months", () => {
    const habit = { frequency: "monthly", startDate: "2026-01-31" };
    expect(isHabitScheduledOn(habit, d("2026-03-31"))).toBe(true);
    expect(isHabitScheduledOn(habit, d("2026-04-30"))).toBe(true);  // April has 30 days
    expect(isHabitScheduledOn(habit, d("2026-04-29"))).toBe(false);
    expect(isHabitScheduledOn(habit, d("2026-02-28"))).toBe(true);  // Feb clamp
  });

  it("habits without scheduling info behave like before: every day", () => {
    expect(isHabitScheduledOn({ frequency: "daily" }, d("2026-07-10"))).toBe(true);
    expect(isHabitScheduledOn({}, d("2026-07-10"))).toBe(true);
  });
});

describe("describeSchedule", () => {
  it("summarizes daily times, weekly days and goals", () => {
    expect(describeSchedule({ frequency: "daily", schedule: { times: ["morning", "night"] } })).toBe("Daily · 🌅 🌙");
    expect(describeSchedule({ frequency: "weekly", schedule: { weekdays: [1, 5] } })).toBe("Weekly · Mon, Fri");
    expect(
      describeSchedule({ frequency: "monthly", endDate: "2026-12-31", occurrenceLimit: 6 }),
    ).toBe("Monthly · until 2026-12-31 · 6x goal");
  });
});

describe("HABIT_BADGES", () => {
  it("offers the 12 kid-friendly badge identities", () => {
    expect(HABIT_BADGES).toHaveLength(12);
    expect(HABIT_BADGES.map((b) => b.label)).toContain("Water Warrior");
    expect(HABIT_BADGES.map((b) => b.label)).toContain("Goal Crusher");
  });
});
