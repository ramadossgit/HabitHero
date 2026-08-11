// Premium auto-approval: parents can opt in to have pending habit
// completions approved automatically after a configurable delay.
// Settings live on users.autoApprovalSettings (jsonb); the processor
// sweeps periodically and approves overdue pending completions.

import { db } from "./db";
import { children, habitCompletions, users } from "@shared/schema";
import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { storage } from "./storage";

export interface AutoApprovalSettings {
  enabled: boolean;
  timeValue: number;
  timeUnit: "hours" | "days" | "weeks";
  applyToAllChildren: boolean;
  childSpecificSettings: Record<string, { enabled: boolean }>;
}

export const DEFAULT_AUTO_APPROVAL_SETTINGS: AutoApprovalSettings = {
  enabled: false,
  timeValue: 24,
  timeUnit: "hours",
  applyToAllChildren: true,
  childSpecificSettings: {},
};

export const AUTO_APPROVAL_REVIEWER = "auto-approval";

const UNIT_MS: Record<AutoApprovalSettings["timeUnit"], number> = {
  hours: 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
  weeks: 7 * 24 * 60 * 60 * 1000,
};

export function validateAutoApprovalSettings(input: any): string | null {
  if (typeof input.enabled !== "boolean") return "'enabled' must be a boolean";
  if (!Number.isInteger(input.timeValue) || input.timeValue <= 0 || input.timeValue > 999) {
    return "'timeValue' must be a whole number greater than 0";
  }
  if (!["hours", "days", "weeks"].includes(input.timeUnit)) {
    return "'timeUnit' must be one of hours, days, weeks";
  }
  return null;
}

export function settingsWithDefaults(raw: unknown): AutoApprovalSettings {
  return { ...DEFAULT_AUTO_APPROVAL_SETTINGS, ...(raw && typeof raw === "object" ? (raw as object) : {}) };
}

export class AutoApprovalService {
  static async getSettings(userId: string): Promise<AutoApprovalSettings> {
    const user = await storage.getUser(userId);
    return settingsWithDefaults((user as any)?.autoApprovalSettings);
  }

  static async updateSettings(userId: string, settings: AutoApprovalSettings): Promise<AutoApprovalSettings> {
    const user = await storage.getUser(userId);
    if (user) {
      await db
        .update(users)
        .set({ autoApprovalSettings: settings, updatedAt: new Date() })
        .where(eq(users.id, userId));
    }
    return settings;
  }

  static async getStats(parentId: string): Promise<{ thisWeek: number; totalSaved: number; pending: number }> {
    const kids = await db.select({ id: children.id }).from(children).where(eq(children.parentId, parentId));
    const childIds = kids.map((k) => k.id);
    if (childIds.length === 0) {
      return { thisWeek: 0, totalSaved: 0, pending: 0 };
    }

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [pendingRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(habitCompletions)
      .where(and(inArray(habitCompletions.childId, childIds), eq(habitCompletions.status, "pending")));

    const [totalRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(habitCompletions)
      .where(and(inArray(habitCompletions.childId, childIds), eq(habitCompletions.reviewedBy, AUTO_APPROVAL_REVIEWER)));

    const [weekRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(habitCompletions)
      .where(
        and(
          inArray(habitCompletions.childId, childIds),
          eq(habitCompletions.reviewedBy, AUTO_APPROVAL_REVIEWER),
          gte(habitCompletions.reviewedAt, weekAgo),
        ),
      );

    return {
      thisWeek: weekRow?.count ?? 0,
      totalSaved: totalRow?.count ?? 0,
      pending: pendingRow?.count ?? 0,
    };
  }

  /** Approves pending completions that are older than the parent's configured delay. */
  static async sweep(): Promise<number> {
    let approvedCount = 0;
    try {
      const parents = await db
        .select({ id: users.id, settings: users.autoApprovalSettings })
        .from(users)
        .where(sql`${users.autoApprovalSettings} ->> 'enabled' = 'true'`);

      for (const parent of parents) {
        const settings = settingsWithDefaults(parent.settings);
        const cutoff = new Date(Date.now() - settings.timeValue * UNIT_MS[settings.timeUnit]);

        const overdue = await db
          .select({ completion: habitCompletions, childId: children.id })
          .from(habitCompletions)
          .innerJoin(children, eq(habitCompletions.childId, children.id))
          .where(
            and(
              eq(children.parentId, parent.id),
              eq(habitCompletions.status, "pending"),
              lt(habitCompletions.completedAt, cutoff),
            ),
          );

        for (const row of overdue) {
          if (!settings.applyToAllChildren && settings.childSpecificSettings?.[row.childId]?.enabled === false) {
            continue;
          }
          try {
            await storage.approveHabitCompletion(
              row.completion.id,
              AUTO_APPROVAL_REVIEWER,
              "Approved automatically by your auto-approval settings",
            );
            approvedCount++;
          } catch (err) {
            console.error("Auto-approval failed for completion", row.completion.id, err);
          }
        }
      }
      if (approvedCount > 0) {
        console.log(`Auto-approval sweep approved ${approvedCount} habit completion(s)`);
      }
    } catch (err) {
      console.error("Auto-approval sweep error:", err);
    }
    return approvedCount;
  }

  private static timer: ReturnType<typeof setInterval> | null = null;

  static startProcessor(intervalMs = 5 * 60 * 1000) {
    if (this.timer) return;
    this.timer = setInterval(() => void this.sweep(), intervalMs);
    console.log("Auto-approval processor started");
  }
}
