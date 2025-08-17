import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  text,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth - parents)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Children managed by parents
export const children = pgTable("children", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  username: varchar("username").unique(), // for child login
  pin: varchar("pin"), // 4-digit PIN for child login
  avatarType: varchar("avatar_type").notNull().default("robot"), // robot, princess, ninja, animal
  avatarUrl: varchar("avatar_url"),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  totalXp: integer("total_xp").notNull().default(0),
  rewardPoints: integer("reward_points").notNull().default(0), // Points for purchasing avatars
  unlockedAvatars: jsonb("unlocked_avatars").default(["robot"]), // Available avatars for user
  unlockedGear: jsonb("unlocked_gear").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Habits that children can complete
export const habits = pgTable("habits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon").notNull(),
  xpReward: integer("xp_reward").notNull().default(50),
  color: varchar("color").notNull().default("mint"),
  isActive: boolean("is_active").notNull().default(true),
  frequency: varchar("frequency").notNull().default("daily"), // daily, weekly
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily habit completions
export const habitCompletions = pgTable("habit_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  habitId: varchar("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  xpEarned: integer("xp_earned").notNull(),
  streakCount: integer("streak_count").notNull().default(1),
  completedAt: timestamp("completed_at").defaultNow(),
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  parentMessage: text("parent_message"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by"),
  requiresApproval: boolean("requires_approval").notNull().default(true),
  rewardPointsEarned: integer("reward_points_earned").notNull().default(0),
});

// Rewards that can be earned
export const rewards = pgTable("rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // screen_time, treat, outing, gear
  value: varchar("value"), // e.g., "30_minutes", "ice_cream", "park_visit"
  cost: integer("cost").notNull(), // XP or habits required
  costType: varchar("cost_type").notNull().default("habits"), // habits, xp, streak
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Claimed rewards
export const rewardClaims = pgTable("reward_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rewardId: varchar("reward_id").notNull().references(() => rewards.id, { onDelete: "cascade" }),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  claimedAt: timestamp("claimed_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  isApproved: boolean("is_approved").notNull().default(false),
});

// Mini-games and their unlock requirements
export const miniGames = pgTable("mini_games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon").notNull(),
  unlockRequirement: integer("unlock_requirement").notNull().default(2), // habits needed
  isActive: boolean("is_active").notNull().default(true),
});

// Avatar shop items that can be purchased with reward points
export const avatarShopItems = pgTable("avatar_shop_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // "Ninja Warrior", "Space Princess", etc.
  avatarType: varchar("avatar_type").notNull(), // ninja, princess, robot, animal, wizard, superhero
  cost: integer("cost").notNull(), // reward points needed
  description: text("description"),
  rarity: varchar("rarity").notNull().default("common"), // common, rare, epic, legendary
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Gear shop items for avatar customization
export const gearShopItems = pgTable("gear_shop_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  gearType: varchar("gear_type").notNull(), // helmet, armor, weapon, accessory
  description: text("description").notNull(),
  cost: integer("cost").notNull().default(30),
  rarity: varchar("rarity").notNull().default("common"),
  effect: varchar("effect"), // bonus effect description
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reward point transactions for tracking and approval
export const rewardTransactions = pgTable("reward_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // 'earned', 'spent', 'bonus_earned'
  amount: integer("amount").notNull(),
  source: varchar("source").notNull(), // 'habit_completion', 'avatar_purchase', 'gear_purchase', 'parent_bonus'
  description: text("description"),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  isApproved: boolean("is_approved").notNull().default(true),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Weekend challenges for bonus points
export const weekendChallenges = pgTable("weekend_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  pointsReward: integer("points_reward").notNull().default(20),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  isAccepted: boolean("is_accepted").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Parental control settings
export const parentalControls = pgTable("parental_controls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  childId: varchar("child_id").notNull().references(() => children.id, { onDelete: "cascade" }),
  dailyScreenTime: integer("daily_screen_time").notNull().default(60), // minutes
  bonusTimePerHabit: integer("bonus_time_per_habit").notNull().default(10), // minutes
  weekendBonus: integer("weekend_bonus").notNull().default(30), // minutes
  gameUnlockRequirement: integer("game_unlock_requirement").notNull().default(2), // habits
  maxGameTimePerDay: integer("max_game_time_per_day").notNull().default(20), // minutes
  bedtimeMode: boolean("bedtime_mode").notNull().default(true),
  bedtimeStart: varchar("bedtime_start").notNull().default("20:00"),
  bedtimeEnd: varchar("bedtime_end").notNull().default("07:00"),
  // App Features Control
  enableHabits: boolean("enable_habits").notNull().default(true),
  enableGearShop: boolean("enable_gear_shop").notNull().default(true),
  enableMiniGames: boolean("enable_mini_games").notNull().default(true),
  enableRewards: boolean("enable_rewards").notNull().default(true),
  // Emergency Controls
  emergencyMode: boolean("emergency_mode").notNull().default(false),
  blockAllApps: boolean("block_all_apps").notNull().default(false),
  limitInternet: boolean("limit_internet").notNull().default(false),
  parentContactEnabled: boolean("parent_contact_enabled").notNull().default(true),
  emergencyActivatedAt: timestamp("emergency_activated_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  children: many(children),
}));

export const childrenRelations = relations(children, ({ one, many }) => ({
  parent: one(users, {
    fields: [children.parentId],
    references: [users.id],
  }),
  habits: many(habits),
  habitCompletions: many(habitCompletions),
  rewards: many(rewards),
  rewardClaims: many(rewardClaims),
  weekendChallenges: many(weekendChallenges),
  parentalControls: one(parentalControls),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  child: one(children, {
    fields: [habits.childId],
    references: [children.id],
  }),
  completions: many(habitCompletions),
}));

export const habitCompletionsRelations = relations(habitCompletions, ({ one }) => ({
  habit: one(habits, {
    fields: [habitCompletions.habitId],
    references: [habits.id],
  }),
  child: one(children, {
    fields: [habitCompletions.childId],
    references: [children.id],
  }),
}));

export const rewardsRelations = relations(rewards, ({ one, many }) => ({
  child: one(children, {
    fields: [rewards.childId],
    references: [children.id],
  }),
  claims: many(rewardClaims),
}));

export const rewardClaimsRelations = relations(rewardClaims, ({ one }) => ({
  reward: one(rewards, {
    fields: [rewardClaims.rewardId],
    references: [rewards.id],
  }),
  child: one(children, {
    fields: [rewardClaims.childId],
    references: [children.id],
  }),
}));

export const weekendChallengesRelations = relations(weekendChallenges, ({ one }) => ({
  child: one(children, {
    fields: [weekendChallenges.childId],
    references: [children.id],
  }),
}));

export const parentalControlsRelations = relations(parentalControls, ({ one }) => ({
  child: one(children, {
    fields: [parentalControls.childId],
    references: [children.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChildSchema = createInsertSchema(children).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHabitSchema = createInsertSchema(habits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHabitCompletionSchema = createInsertSchema(habitCompletions).omit({
  id: true,
  completedAt: true,
  reviewedAt: true,
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  createdAt: true,
});

export const insertRewardClaimSchema = createInsertSchema(rewardClaims).omit({
  id: true,
  claimedAt: true,
});

export const insertParentalControlsSchema = createInsertSchema(parentalControls).omit({
  id: true,
  updatedAt: true,
});

export const insertAvatarShopItemSchema = createInsertSchema(avatarShopItems).omit({
  id: true,
  createdAt: true,
});

export const insertWeekendChallengeSchema = createInsertSchema(weekendChallenges).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertGearShopItemSchema = createInsertSchema(gearShopItems).omit({
  id: true,
  createdAt: true,
});

export const insertRewardTransactionSchema = createInsertSchema(rewardTransactions).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Child = typeof children.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Habit = typeof habits.$inferSelect;
export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type HabitCompletion = typeof habitCompletions.$inferSelect;
export type InsertHabitCompletion = z.infer<typeof insertHabitCompletionSchema>;
export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type RewardClaim = typeof rewardClaims.$inferSelect;
export type InsertRewardClaim = z.infer<typeof insertRewardClaimSchema>;
export type MiniGame = typeof miniGames.$inferSelect;
export type ParentalControls = typeof parentalControls.$inferSelect;
export type InsertParentalControls = z.infer<typeof insertParentalControlsSchema>;
export type AvatarShopItem = typeof avatarShopItems.$inferSelect;
export type InsertAvatarShopItem = z.infer<typeof insertAvatarShopItemSchema>;
export type WeekendChallenge = typeof weekendChallenges.$inferSelect;
export type InsertWeekendChallenge = z.infer<typeof insertWeekendChallengeSchema>;
export type GearShopItem = typeof gearShopItems.$inferSelect;
export type InsertGearShopItem = z.infer<typeof insertGearShopItemSchema>;
export type RewardTransaction = typeof rewardTransactions.$inferSelect;
export type InsertRewardTransaction = z.infer<typeof insertRewardTransactionSchema>;
