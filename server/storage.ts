import {
  users,
  children,
  masterHabits,
  habits,
  habitCompletions,
  rewards,
  rewardClaims,
  miniGames,
  parentalControls,
  avatarShopItems,
  weekendChallenges,
  gearShopItems,
  rewardTransactions,
  type User,
  type UpsertUser,
  type Child,
  type InsertChild,
  type MasterHabit,
  type InsertMasterHabit,
  type Habit,
  type InsertHabit,
  type HabitCompletion,
  type InsertHabitCompletion,
  type Reward,
  type InsertReward,
  type RewardClaim,
  type InsertRewardClaim,
  type MiniGame,
  type ParentalControls,
  type InsertParentalControls,
  type AvatarShopItem,
  type InsertAvatarShopItem,
  type WeekendChallenge,
  type InsertWeekendChallenge,
  type GearShopItem,
  type InsertGearShopItem,
  type RewardTransaction,
  type InsertRewardTransaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, desc, sql, or } from "drizzle-orm";

export interface IStorage {
  // User operations (custom authentication)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFamilyCode(familyCode: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  updateUserProfile(id: string, updates: Partial<User>): Promise<User>;
  upsertUser(user: Partial<UpsertUser>): Promise<User>;
  
  // Child operations
  getChildrenByParent(parentId: string): Promise<Child[]>;
  getChild(id: string): Promise<Child | undefined>;
  getChildByUsername(username: string): Promise<Child | undefined>;
  getChildByUsernameAndPin(username: string, pin: string, parentId?: string): Promise<Child | undefined>;
  createChild(child: InsertChild): Promise<Child>;
  updateChild(id: string, updates: Partial<InsertChild>): Promise<Child>;
  deleteChild(id: string): Promise<void>;
  updateChildXP(childId: string, xpGained: number): Promise<Child>;
  
  // Master habit operations (templates for assignment)
  getMasterHabitsByParent(parentId: string): Promise<MasterHabit[]>;
  getMasterHabit(id: string): Promise<MasterHabit | undefined>;
  createMasterHabit(masterHabit: InsertMasterHabit): Promise<MasterHabit>;
  updateMasterHabit(id: string, updates: Partial<InsertMasterHabit>): Promise<MasterHabit>;
  deleteMasterHabit(id: string): Promise<void>;
  
  // Habit operations (child-specific assignments)
  getHabitsByChild(childId: string): Promise<Habit[]>;
  getAllHabitsByParent(parentId: string): Promise<Habit[]>;
  getHabit(id: string): Promise<Habit | undefined>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  updateHabit(id: string, updates: Partial<InsertHabit>): Promise<Habit>;
  deleteHabit(id: string): Promise<void>;
  
  // Habit completion operations
  getHabitCompletions(childId: string, startDate?: string, endDate?: string): Promise<HabitCompletion[]>;
  createHabitCompletion(completion: InsertHabitCompletion): Promise<HabitCompletion>;
  getHabitStreak(habitId: string, childId: string): Promise<number>;
  getTodaysCompletions(childId: string): Promise<HabitCompletion[]>;
  
  // Reward operations
  getRewardsByChild(childId: string): Promise<Reward[]>;
  createReward(reward: InsertReward): Promise<Reward>;
  updateReward(id: string, updates: Partial<InsertReward>): Promise<Reward>;
  deleteReward(id: string): Promise<void>;
  
  // Reward claim operations
  createRewardClaim(claim: InsertRewardClaim): Promise<RewardClaim>;
  getRewardClaims(childId: string): Promise<RewardClaim[]>;
  approveRewardClaim(claimId: string): Promise<RewardClaim>;
  
  // Mini-game operations
  getAllMiniGames(): Promise<MiniGame[]>;
  
  // Parental controls operations
  getParentalControls(childId: string): Promise<ParentalControls | undefined>;
  upsertParentalControls(controls: InsertParentalControls): Promise<ParentalControls>;
  activateEmergencyMode(childId: string): Promise<ParentalControls>;
  deactivateEmergencyMode(childId: string): Promise<ParentalControls>;
  
  // Avatar shop operations
  getAllAvatarShopItems(): Promise<AvatarShopItem[]>;
  createAvatarShopItem(item: InsertAvatarShopItem): Promise<AvatarShopItem>;
  purchaseAvatar(childId: string, avatarType: string, cost: number): Promise<Child>;
  
  // Weekend challenge operations
  getWeekendChallenges(childId: string): Promise<WeekendChallenge[]>;
  createWeekendChallenge(challenge: InsertWeekendChallenge): Promise<WeekendChallenge>;
  acceptWeekendChallenge(challengeId: string): Promise<WeekendChallenge>;
  completeWeekendChallenge(challengeId: string, pointsEarned: number): Promise<WeekendChallenge>;
  updateChildRewardPoints(childId: string, pointsGained: number): Promise<Child>;
  
  // Gear shop operations
  getAllGearShopItems(): Promise<GearShopItem[]>;
  createGearShopItem(item: InsertGearShopItem): Promise<GearShopItem>;
  purchaseGear(childId: string, gearId: string, cost: number): Promise<Child>;
  
  // Reward transaction operations
  getRewardTransactions(childId: string): Promise<RewardTransaction[]>;
  getPendingRewardTransactions(childId: string): Promise<RewardTransaction[]>;
  createRewardTransaction(transaction: InsertRewardTransaction): Promise<RewardTransaction>;
  approveRewardTransaction(transactionId: string, approvedBy: string): Promise<RewardTransaction>;
  
  // Subscription operations
  getUserById(userId: string): Promise<User | undefined>;
  updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User>;
  updateUserSubscription(userId: string, subscriptionData: {
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
    subscriptionPlan?: string;
    subscriptionEndDate?: Date;
  }): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByFamilyCode(familyCode: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.familyCode, familyCode));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values(userData)
      .returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserProfile(id: string, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async upsertUser(userData: Partial<UpsertUser>): Promise<User> {
    // For Replit auth, we only update existing users or create minimal profiles
    // We don't generate family codes for OAuth users unless they explicitly register
    if (!userData.email) {
      throw new Error("Email is required for user upsert");
    }

    const existingUser = await this.getUserByEmail(userData.email);
    
    if (existingUser) {
      // Update existing user with new data (excluding family code to preserve it)
      const { familyCode: _, ...updateData } = userData as any;
      return this.updateUser(existingUser.id, updateData);
    } else {
      // Create new user via OAuth - generate family code
      const generateFamilyCode = (): string => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      let familyCode = generateFamilyCode();
      let attempts = 0;
      
      // Ensure family code is unique
      while (attempts < 10) {
        const existingCode = await this.getUserByFamilyCode(familyCode);
        if (!existingCode) break;
        familyCode = generateFamilyCode();
        attempts++;
      }

      if (attempts >= 10) {
        throw new Error("Failed to generate unique family code");
      }

      return this.createUser({
        ...userData,
        familyCode,
      } as UpsertUser);
    }
  }

  // Child operations
  async getChildrenByParent(parentId: string): Promise<Child[]> {
    return await db.select().from(children).where(eq(children.parentId, parentId));
  }

  async getChild(id: string): Promise<Child | undefined> {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child;
  }

  async getChildByUsername(username: string): Promise<Child | undefined> {
    const [child] = await db.select().from(children).where(eq(children.username, username));
    return child;
  }

  async getChildByUsernameAndPin(username: string, pin: string, parentId?: string): Promise<Child | undefined> {
    const conditions = [
      eq(children.username, username),
      eq(children.pin, pin)
    ];
    
    if (parentId) {
      conditions.push(eq(children.parentId, parentId));
    }
    
    const [child] = await db.select().from(children).where(and(...conditions));
    return child;
  }

  async createChild(child: InsertChild): Promise<Child> {
    // Generate username and PIN if not provided
    const generatePin = (): string => {
      return Math.floor(1000 + Math.random() * 9000).toString();
    };

    const generateUsername = (name: string): string => {
      return name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 100);
    };

    const childWithCredentials = {
      ...child,
      username: child.username || generateUsername(child.name),
      pin: child.pin || generatePin()
    };

    const [newChild] = await db.insert(children).values(childWithCredentials).returning();
    
    // No default habits - let parents decide what habits to add

    // Create default parental controls
    await db.insert(parentalControls).values({
      childId: newChild.id,
    });

    // Create default rewards
    const defaultRewards = [
      { name: "Extra Screen Time (30 min)", description: "Bonus screen time for good habits", type: "screen_time", value: "30_minutes", cost: 3, costType: "habits" },
      { name: "Special Treat", description: "Choose a special snack", type: "treat", value: "special_snack", cost: 5, costType: "habits" },
      { name: "Choose Dinner Menu", description: "Pick what the family has for dinner", type: "privilege", value: "dinner_choice", cost: 5, costType: "streak" },
    ];

    for (const reward of defaultRewards) {
      await db.insert(rewards).values({
        childId: newChild.id,
        ...reward,
      });
    }

    return newChild;
  }

  async updateChild(id: string, updates: Partial<InsertChild>): Promise<Child> {
    const [updatedChild] = await db
      .update(children)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(children.id, id))
      .returning();
    return updatedChild;
  }

  async deleteChild(id: string): Promise<void> {
    // Delete related data first (cascade delete)
    await db.delete(habitCompletions).where(eq(habitCompletions.childId, id));
    await db.delete(rewardClaims).where(eq(rewardClaims.childId, id));
    await db.delete(habits).where(eq(habits.childId, id));
    await db.delete(rewards).where(eq(rewards.childId, id));
    await db.delete(parentalControls).where(eq(parentalControls.childId, id));
    
    // Delete the child record
    await db.delete(children).where(eq(children.id, id));
  }

  async updateChildXP(childId: string, xpGained: number): Promise<Child> {
    const [child] = await db.select().from(children).where(eq(children.id, childId));
    if (!child) throw new Error("Child not found");

    const newXP = child.xp + xpGained;
    const newTotalXP = child.totalXp + xpGained;
    const newLevel = Math.floor(newTotalXP / 1000) + 1;

    const [updatedChild] = await db
      .update(children)
      .set({
        xp: newXP >= 1000 ? newXP - 1000 : newXP,
        totalXp: newTotalXP,
        level: newLevel,
        updatedAt: new Date(),
      })
      .where(eq(children.id, childId))
      .returning();

    return updatedChild;
  }

  // Master habit operations 
  async getMasterHabitsByParent(parentId: string): Promise<MasterHabit[]> {
    return await db.select().from(masterHabits).where(eq(masterHabits.parentId, parentId)).orderBy(desc(masterHabits.createdAt));
  }

  async getMasterHabit(id: string): Promise<MasterHabit | undefined> {
    const [masterHabit] = await db.select().from(masterHabits).where(eq(masterHabits.id, id));
    return masterHabit;
  }

  async createMasterHabit(masterHabit: InsertMasterHabit): Promise<MasterHabit> {
    const [newMasterHabit] = await db.insert(masterHabits).values(masterHabit).returning();
    return newMasterHabit;
  }

  async updateMasterHabit(id: string, updates: Partial<InsertMasterHabit>): Promise<MasterHabit> {
    const [updatedMasterHabit] = await db
      .update(masterHabits)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(masterHabits.id, id))
      .returning();
    return updatedMasterHabit;
  }

  async deleteMasterHabit(id: string): Promise<void> {
    await db.delete(masterHabits).where(eq(masterHabits.id, id));
  }

  // Habit operations (child-specific assignments)
  async getHabitsByChild(childId: string): Promise<Habit[]> {
    return await db.select().from(habits).where(eq(habits.childId, childId));
  }

  async getAllHabitsByParent(parentId: string): Promise<Habit[]> {
    return await db.select()
    .from(habits)
    .leftJoin(children, eq(habits.childId, children.id))
    .where(eq(children.parentId, parentId))
    .orderBy(desc(habits.createdAt));
  }

  async getHabit(id: string): Promise<Habit | undefined> {
    const [habit] = await db.select().from(habits).where(eq(habits.id, id));
    return habit;
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    const [newHabit] = await db.insert(habits).values(habit).returning();
    return newHabit;
  }

  async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
    const [updatedHabit] = await db
      .update(habits)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(habits.id, id))
      .returning();
    return updatedHabit;
  }

  async deleteHabit(id: string): Promise<void> {
    await db.delete(habits).where(eq(habits.id, id));
  }

  // Habit completion operations
  async getHabitCompletions(childId: string, startDate?: string, endDate?: string): Promise<HabitCompletion[]> {
    if (startDate && endDate) {
      return await db
        .select()
        .from(habitCompletions)
        .where(
          and(
            eq(habitCompletions.childId, childId),
            gte(habitCompletions.date, startDate),
            sql`${habitCompletions.date} <= ${endDate}`
          )
        )
        .orderBy(desc(habitCompletions.completedAt));
    }

    return await db
      .select()
      .from(habitCompletions)
      .where(eq(habitCompletions.childId, childId))
      .orderBy(desc(habitCompletions.completedAt));
  }

  async createHabitCompletion(completion: InsertHabitCompletion): Promise<HabitCompletion> {
    // Calculate streak
    const streak = await this.getHabitStreak(completion.habitId, completion.childId);
    
    // Calculate potential reward points (1 point per 10 XP earned)
    const rewardPoints = Math.floor(completion.xpEarned / 10);
    
    const [newCompletion] = await db
      .insert(habitCompletions)
      .values({
        ...completion,
        streakCount: streak + 1,
        status: "pending",
        requiresApproval: true,
        rewardPointsEarned: rewardPoints,
      })
      .returning();

    // Note: XP and reward points are NOT awarded until parent approval

    return newCompletion;
  }

  async getHabitStreak(habitId: string, childId: string): Promise<number> {
    const completions = await db
      .select()
      .from(habitCompletions)
      .where(
        and(
          eq(habitCompletions.habitId, habitId),
          eq(habitCompletions.childId, childId),
          eq(habitCompletions.status, "approved") // Only count approved completions
        )
      )
      .orderBy(desc(habitCompletions.date))
      .limit(30);

    let streak = 0;
    const today = new Date();
    let currentDate = new Date(today);

    for (const completion of completions) {
      const completionDate = new Date(completion.date);
      const daysDiff = Math.floor((currentDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  async getTodaysCompletions(childId: string): Promise<HabitCompletion[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db
      .select()
      .from(habitCompletions)
      .where(
        and(
          eq(habitCompletions.childId, childId),
          eq(habitCompletions.date, today)
        )
      );
  }

  // Habit approval methods
  async getPendingHabitCompletions(childId: string): Promise<any[]> {
    return await db
      .select({
        completion: habitCompletions,
        habit: habits
      })
      .from(habitCompletions)
      .innerJoin(habits, eq(habitCompletions.habitId, habits.id))
      .where(
        and(
          eq(habitCompletions.childId, childId),
          eq(habitCompletions.status, "pending")
        )
      )
      .orderBy(desc(habitCompletions.completedAt));
  }

  async getAllPendingHabitCompletions(): Promise<any[]> {
    return await db
      .select({
        completion: habitCompletions,
        habit: habits,
        child: children
      })
      .from(habitCompletions)
      .innerJoin(habits, eq(habitCompletions.habitId, habits.id))
      .innerJoin(children, eq(habitCompletions.childId, children.id))
      .where(eq(habitCompletions.status, "pending"))
      .orderBy(desc(habitCompletions.completedAt));
  }

  async approveHabitCompletion(completionId: string, approvedBy: string, message?: string): Promise<HabitCompletion> {
    const [completion] = await db.select()
      .from(habitCompletions)
      .where(eq(habitCompletions.id, completionId));
    
    if (!completion) {
      throw new Error("Habit completion not found");
    }

    if (completion.status !== "pending") {
      throw new Error("Habit completion already reviewed");
    }

    // Update completion as approved
    const [approvedCompletion] = await db
      .update(habitCompletions)
      .set({
        status: "approved",
        reviewedBy: approvedBy,
        reviewedAt: new Date(),
        parentMessage: message,
      })
      .where(eq(habitCompletions.id, completionId))
      .returning();

    // Award XP and reward points to child
    await this.updateChildXP(completion.childId, completion.xpEarned);
    if (completion.rewardPointsEarned > 0) {
      await this.updateChildRewardPoints(completion.childId, completion.rewardPointsEarned);
    }

    return approvedCompletion;
  }

  async rejectHabitCompletion(completionId: string, rejectedBy: string, message: string): Promise<HabitCompletion> {
    const [completion] = await db.select()
      .from(habitCompletions)
      .where(eq(habitCompletions.id, completionId));
    
    if (!completion) {
      throw new Error("Habit completion not found");
    }

    if (completion.status !== "pending") {
      throw new Error("Habit completion already reviewed");
    }

    // Update completion as rejected
    const [rejectedCompletion] = await db
      .update(habitCompletions)
      .set({
        status: "rejected",
        reviewedBy: rejectedBy,
        reviewedAt: new Date(),
        parentMessage: message,
      })
      .where(eq(habitCompletions.id, completionId))
      .returning();

    // Note: When rejected, the habit can be completed again for the same day
    return rejectedCompletion;
  }

  async getChildPendingHabitsCount(childId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(habitCompletions)
      .where(
        and(
          eq(habitCompletions.childId, childId),
          eq(habitCompletions.status, "pending")
        )
      );
    
    return result.count;
  }

  // Reward operations
  async getRewardsByChild(childId: string): Promise<Reward[]> {
    return await db.select().from(rewards).where(eq(rewards.childId, childId));
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const [newReward] = await db.insert(rewards).values(reward).returning();
    return newReward;
  }

  async updateReward(id: string, updates: Partial<InsertReward>): Promise<Reward> {
    const [updatedReward] = await db
      .update(rewards)
      .set(updates)
      .where(eq(rewards.id, id))
      .returning();
    return updatedReward;
  }

  async deleteReward(id: string): Promise<void> {
    await db.delete(rewards).where(eq(rewards.id, id));
  }

  // Reward claim operations
  async createRewardClaim(claim: InsertRewardClaim): Promise<RewardClaim> {
    const [newClaim] = await db.insert(rewardClaims).values(claim).returning();
    return newClaim;
  }

  async getRewardClaims(childId: string): Promise<RewardClaim[]> {
    return await db.select().from(rewardClaims).where(eq(rewardClaims.childId, childId));
  }

  async approveRewardClaim(claimId: string): Promise<RewardClaim> {
    const [approvedClaim] = await db
      .update(rewardClaims)
      .set({
        isApproved: true,
        approvedAt: new Date(),
      })
      .where(eq(rewardClaims.id, claimId))
      .returning();
    return approvedClaim;
  }

  // Mini-game operations
  async getAllMiniGames(): Promise<MiniGame[]> {
    return await db.select().from(miniGames).where(eq(miniGames.isActive, true));
  }

  // Parental controls operations
  async getParentalControls(childId: string): Promise<ParentalControls | undefined> {
    const [controls] = await db.select().from(parentalControls).where(eq(parentalControls.childId, childId));
    return controls;
  }

  async upsertParentalControls(controls: InsertParentalControls): Promise<ParentalControls> {
    const existing = await this.getParentalControls(controls.childId);
    
    if (existing) {
      const [updated] = await db
        .update(parentalControls)
        .set({ ...controls, updatedAt: new Date() })
        .where(eq(parentalControls.childId, controls.childId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(parentalControls).values(controls).returning();
      return created;
    }
  }

  async activateEmergencyMode(childId: string): Promise<ParentalControls> {
    const existing = await this.getParentalControls(childId);
    
    if (existing) {
      const [updated] = await db
        .update(parentalControls)
        .set({ 
          emergencyMode: true, 
          blockAllApps: true,
          emergencyActivatedAt: new Date(),
          updatedAt: new Date() 
        })
        .where(eq(parentalControls.childId, childId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(parentalControls)
        .values({ 
          childId, 
          emergencyMode: true, 
          blockAllApps: true,
          emergencyActivatedAt: new Date()
        })
        .returning();
      return created;
    }
  }

  async deactivateEmergencyMode(childId: string): Promise<ParentalControls> {
    const [updated] = await db
      .update(parentalControls)
      .set({ 
        emergencyMode: false, 
        blockAllApps: false,
        emergencyActivatedAt: null,
        updatedAt: new Date() 
      })
      .where(eq(parentalControls.childId, childId))
      .returning();
    return updated;
  }

  // Avatar shop operations
  async getAllAvatarShopItems(): Promise<AvatarShopItem[]> {
    return await db.select().from(avatarShopItems).where(eq(avatarShopItems.isActive, true));
  }

  async createAvatarShopItem(item: InsertAvatarShopItem): Promise<AvatarShopItem> {
    const [newItem] = await db.insert(avatarShopItems).values(item).returning();
    return newItem;
  }

  async purchaseAvatar(childId: string, avatarType: string, cost: number): Promise<Child> {
    // First get the child to check they have enough points
    const child = await this.getChild(childId);
    if (!child) {
      throw new Error("Child not found");
    }
    
    if ((child.rewardPoints || 0) < cost) {
      throw new Error("Not enough reward points");
    }

    // Find the specific avatar shop item by avatar type to get its ID
    const [avatarItem] = await db
      .select()
      .from(avatarShopItems)
      .where(eq(avatarShopItems.avatarType, avatarType))
      .limit(1);

    if (!avatarItem) {
      throw new Error("Avatar not found in shop");
    }

    // Check if avatar is already unlocked using shop item ID
    const unlockedAvatars = child.unlockedAvatars as string[] || ["robot"];
    if (unlockedAvatars.includes(avatarItem.id)) {
      throw new Error("Avatar already unlocked");
    }

    // Update child with new avatar ID and deduct points
    const [updatedChild] = await db
      .update(children)
      .set({
        rewardPoints: (child.rewardPoints || 0) - cost,
        unlockedAvatars: [...unlockedAvatars, avatarItem.id],
        updatedAt: new Date(),
      })
      .where(eq(children.id, childId))
      .returning();

    return updatedChild;
  }

  // Weekend challenge operations
  async getWeekendChallenges(childId: string): Promise<WeekendChallenge[]> {
    return await db.select().from(weekendChallenges).where(eq(weekendChallenges.childId, childId));
  }

  async createWeekendChallenge(challenge: InsertWeekendChallenge): Promise<WeekendChallenge> {
    const [newChallenge] = await db.insert(weekendChallenges).values(challenge).returning();
    return newChallenge;
  }

  async acceptWeekendChallenge(challengeId: string): Promise<WeekendChallenge> {
    const [updatedChallenge] = await db
      .update(weekendChallenges)
      .set({ isAccepted: true })
      .where(eq(weekendChallenges.id, challengeId))
      .returning();
    return updatedChallenge;
  }

  async completeWeekendChallenge(challengeId: string, pointsEarned: number): Promise<WeekendChallenge> {
    const [updatedChallenge] = await db
      .update(weekendChallenges)
      .set({ 
        isCompleted: true, 
        completedAt: new Date(),
      })
      .where(eq(weekendChallenges.id, challengeId))
      .returning();

    // Award points to the child
    if (updatedChallenge) {
      await this.updateChildRewardPoints(updatedChallenge.childId, pointsEarned);
    }

    return updatedChallenge;
  }

  async updateChildRewardPoints(childId: string, pointsGained: number): Promise<Child> {
    const child = await this.getChild(childId);
    if (!child) {
      throw new Error("Child not found");
    }

    const [updatedChild] = await db
      .update(children)
      .set({
        rewardPoints: (child.rewardPoints || 0) + pointsGained,
        updatedAt: new Date(),
      })
      .where(eq(children.id, childId))
      .returning();

    return updatedChild;
  }

  // Gear shop operations
  async getAllGearShopItems(): Promise<GearShopItem[]> {
    return await db.select().from(gearShopItems).where(eq(gearShopItems.isActive, true));
  }

  async createGearShopItem(item: InsertGearShopItem): Promise<GearShopItem> {
    const [newItem] = await db.insert(gearShopItems).values(item).returning();
    return newItem;
  }

  async purchaseGear(childId: string, gearId: string, cost: number): Promise<Child> {
    const child = await this.getChild(childId);
    if (!child) {
      throw new Error("Child not found");
    }
    
    if ((child.rewardPoints || 0) < cost) {
      throw new Error("Not enough reward points");
    }

    // Check if gear is already unlocked
    const unlockedGear = child.unlockedGear as string[] || [];
    if (unlockedGear.includes(gearId)) {
      throw new Error("Gear already unlocked");
    }

    // Update child with new gear and reduced points
    const [updatedChild] = await db
      .update(children)
      .set({
        unlockedGear: [...unlockedGear, gearId],
        rewardPoints: (child.rewardPoints || 0) - cost,
        updatedAt: new Date(),
      })
      .where(eq(children.id, childId))
      .returning();

    // Create transaction record
    await this.createRewardTransaction({
      childId,
      type: 'spent',
      amount: -cost,
      source: 'gear_purchase',
      description: `Purchased gear item: ${gearId}`,
    });

    return updatedChild;
  }

  // Reward transaction operations
  async getRewardTransactions(childId: string): Promise<RewardTransaction[]> {
    return await db.select()
      .from(rewardTransactions)
      .where(eq(rewardTransactions.childId, childId))
      .orderBy(desc(rewardTransactions.createdAt));
  }

  async getPendingRewardTransactions(childId: string): Promise<RewardTransaction[]> {
    return await db.select()
      .from(rewardTransactions)
      .where(
        and(
          eq(rewardTransactions.childId, childId),
          eq(rewardTransactions.requiresApproval, true),
          eq(rewardTransactions.isApproved, false)
        )
      )
      .orderBy(desc(rewardTransactions.createdAt));
  }

  async createRewardTransaction(transaction: InsertRewardTransaction): Promise<RewardTransaction> {
    const [newTransaction] = await db.insert(rewardTransactions).values(transaction).returning();
    return newTransaction;
  }

  async approveRewardTransaction(transactionId: string, approvedBy: string): Promise<RewardTransaction> {
    const [transaction] = await db.select()
      .from(rewardTransactions)
      .where(eq(rewardTransactions.id, transactionId));
    
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.isApproved) {
      throw new Error("Transaction already approved");
    }

    // Update transaction as approved
    const [approvedTransaction] = await db
      .update(rewardTransactions)
      .set({
        isApproved: true,
        approvedBy,
        approvedAt: new Date(),
      })
      .where(eq(rewardTransactions.id, transactionId))
      .returning();

    // Add points to child's account
    await this.updateChildRewardPoints(transaction.childId, transaction.amount);

    return approvedTransaction;
  }

  // Daily habit reload functionality
  async reloadDailyHabits(childId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    // Remove pending and rejected completions for today to allow re-completion
    await db
      .delete(habitCompletions)
      .where(
        and(
          eq(habitCompletions.childId, childId),
          eq(habitCompletions.date, today),
          or(
            eq(habitCompletions.status, "pending"),
            eq(habitCompletions.status, "rejected")
          )
        )
      );
  }

  // Weekly progress tracking
  async getWeeklyProgress(childId: string): Promise<{
    totalHabits: number;
    completedHabits: number;
    pendingHabits: number;
    weekStart: string;
    weekEnd: string;
    status: 'red' | 'yellow' | 'green';
    dailyBreakdown: Array<{
      date: string;
      completed: number;
      total: number;
    }>;
  }> {
    // Get current week's date range (Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so 6 days back to Monday
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    
    // Get all active habits for this child
    const activeHabits = await db
      .select()
      .from(habits)
      .where(
        and(
          eq(habits.childId, childId),
          eq(habits.isActive, true)
        )
      );
    
    // Get all completions for this week
    const weeklyCompletions = await db
      .select()
      .from(habitCompletions)
      .where(
        and(
          eq(habitCompletions.childId, childId),
          gte(habitCompletions.date, weekStartStr),
          sql`${habitCompletions.date} <= ${weekEndStr}`,
          eq(habitCompletions.status, "approved")
        )
      );
    
    // Calculate daily breakdown
    const dailyBreakdown = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const dayCompletions = weeklyCompletions.filter(c => c.date === dateStr).length;
      dailyBreakdown.push({
        date: dateStr,
        completed: dayCompletions,
        total: activeHabits.length
      });
    }
    
    const totalPossibleHabits = activeHabits.length * 7; // 7 days per week
    const totalCompletedHabits = weeklyCompletions.length;
    
    // Get pending habits
    const pendingHabits = await db
      .select()
      .from(habitCompletions)
      .where(
        and(
          eq(habitCompletions.childId, childId),
          gte(habitCompletions.date, weekStartStr),
          sql`${habitCompletions.date} <= ${weekEndStr}`,
          eq(habitCompletions.status, "pending")
        )
      );
    
    // Determine status based on completion percentage
    let status: 'red' | 'yellow' | 'green';
    const completionPercentage = totalPossibleHabits > 0 ? (totalCompletedHabits / totalPossibleHabits) * 100 : 0;
    
    if (completionPercentage === 100) {
      status = 'green';
    } else if (completionPercentage >= 50) {
      status = 'yellow';
    } else {
      status = 'red';
    }
    
    return {
      totalHabits: totalPossibleHabits,
      completedHabits: totalCompletedHabits,
      pendingHabits: pendingHabits.length,
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      status,
      dailyBreakdown
    };
  }

  // Subscription operations
  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ stripeCustomerId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateUserSubscription(userId: string, subscriptionData: {
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
    subscriptionPlan?: string;
    subscriptionEndDate?: Date;
  }): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...subscriptionData, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
}

export const storage = new DatabaseStorage();
