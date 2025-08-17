import { sql } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  varchar,
  jsonb,
  text,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Device registration and tracking for cross-device sync
export const devices = pgTable("devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  deviceId: varchar("device_id").notNull(), // Unique device identifier
  deviceName: varchar("device_name").notNull(), // User-friendly device name
  deviceType: varchar("device_type").notNull(), // web, ios, android
  lastSyncAt: timestamp("last_sync_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  pushToken: varchar("push_token"), // For push notifications
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sync log to track what was synced when
export const syncLogs = pgTable("sync_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  deviceId: varchar("device_id").notNull().references(() => devices.id, { onDelete: "cascade" }),
  syncType: varchar("sync_type").notNull(), // habit_completion, child_update, habit_crud, etc.
  entityType: varchar("entity_type").notNull(), // habits, children, completions, rewards
  entityId: varchar("entity_id").notNull(), // ID of the synced entity
  operation: varchar("operation").notNull(), // create, update, delete
  syncData: jsonb("sync_data"), // The actual synced data
  timestamp: timestamp("timestamp").defaultNow(),
  syncDirection: varchar("sync_direction").notNull(), // push, pull
});

// Conflict resolution for when multiple devices modify the same data
export const syncConflicts = pgTable("sync_conflicts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  entityType: varchar("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  conflictType: varchar("conflict_type").notNull(), // version_conflict, concurrent_edit
  localData: jsonb("local_data"),
  remoteData: jsonb("remote_data"),
  resolvedData: jsonb("resolved_data"),
  resolution: varchar("resolution"), // auto_resolve, manual_resolve, latest_wins
  isResolved: boolean("is_resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Real-time sync events for live updates
export const syncEvents = pgTable("sync_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventType: varchar("event_type").notNull(), // habit_completed, child_created, reward_claimed
  entityType: varchar("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  eventData: jsonb("event_data"),
  timestamp: timestamp("timestamp").defaultNow(),
  processed: boolean("processed").default(false),
  deviceOrigin: varchar("device_origin"), // Which device triggered the event
});

// Export types for TypeScript
export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;
export type SyncLog = typeof syncLogs.$inferSelect;
export type InsertSyncLog = typeof syncLogs.$inferInsert;
export type SyncConflict = typeof syncConflicts.$inferSelect;
export type InsertSyncConflict = typeof syncConflicts.$inferInsert;
export type SyncEvent = typeof syncEvents.$inferSelect;
export type InsertSyncEvent = typeof syncEvents.$inferInsert;

// Zod schemas for validation
export const insertDeviceSchema = createInsertSchema(devices);
export const insertSyncLogSchema = createInsertSchema(syncLogs);
export const insertSyncConflictSchema = createInsertSchema(syncConflicts);
export const insertSyncEventSchema = createInsertSchema(syncEvents);

// Import users reference (this will be imported in the main schema file)
import { users } from "./schema";