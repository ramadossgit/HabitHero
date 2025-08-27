import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isChildAuthenticated, isParentOrChildAuthenticated } from "./auth";
import { syncService } from "./sync-service";
import { RecurringRewardsService } from "./recurring-rewards-service";
import { SubscriptionService } from "./subscription-service";
import { SUBSCRIPTION_PLANS } from "@shared/subscription-plans";
import Stripe from 'stripe';
import { 
  insertChildSchema,
  insertMasterHabitSchema,
  insertHabitSchema, 
  insertHabitCompletionSchema,
  insertRewardSchema,
  insertRewardClaimSchema,
  insertParentalControlsSchema,
  insertAvatarShopItemSchema,
  insertWeekendChallengeSchema,
  insertGearShopItemSchema,
  insertRewardTransactionSchema,
  insertDeviceSchema
} from "@shared/schema";
import { z } from "zod";

// Extend session data interface
declare module 'express-session' {
  interface SessionData {
    childId: string;
    isChildUser: boolean;
    parentId: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Start the recurring rewards processor
  RecurringRewardsService.startProcessor();

  // Note: Auth routes are now handled in setupAuth function

  // Child login route
  app.post('/api/auth/child-login', async (req, res) => {
    try {
      const { familyCode, username, pin } = req.body;
      
      if (!familyCode || !username || !pin) {
        return res.status(400).json({ message: "Family code, username and PIN are required" });
      }

      // Find parent by family code first
      const parent = await storage.getUserByFamilyCode(familyCode);
      if (!parent) {
        return res.status(401).json({ message: "Invalid family code" });
      }

      // Get child by username/pin within this family
      const child = await storage.getChildByUsernameAndPin(username, pin, parent.id);
      
      if (!child) {
        return res.status(401).json({ message: "Invalid username or PIN for this family" });
      }

      // Check for emergency mode before allowing login
      const parentalControls = await storage.getParentalControls(child.id);
      if (parentalControls?.emergencyMode || parentalControls?.blockAllApps) {
        return res.status(403).json({ 
          message: "Emergency mode is active. Your parent has temporarily restricted access to the app. Please contact your parent for assistance.",
          emergencyMode: true
        });
      }

      // Check if daily habits feature is disabled
      if (parentalControls && !parentalControls.enableHabits) {
        return res.status(403).json({ 
          message: "Daily habits access has been disabled by your parent. Please contact your parent for assistance.",
          featureDisabled: 'habits'
        });
      }

      // Create a simple session for the child
      req.session.childId = child.id;
      req.session.isChildUser = true;
      req.session.parentId = parent.id;
      
      res.json({
        id: child.id,
        name: child.name,
        avatarType: child.avatarType,
        avatarUrl: child.avatarUrl,
        level: child.level,
        xp: child.xp,
        totalXp: child.totalXp,
        rewardPoints: child.rewardPoints,
        unlockedAvatars: child.unlockedAvatars,
        unlockedGear: child.unlockedGear,
        role: "child"
      });
    } catch (error) {
      console.error("Child login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current child user
  app.get('/api/auth/child', async (req: any, res) => {
    try {
      if (!req.session.childId || !req.session.isChildUser) {
        return res.status(401).json({ message: "Not logged in as child" });
      }

      const child = await storage.getChild(req.session.childId);
      if (!child) {
        return res.status(404).json({ message: "Child not found" });
      }

      res.json({
        id: child.id,
        name: child.name,
        avatarType: child.avatarType,
        avatarUrl: child.avatarUrl,
        level: child.level,
        xp: child.xp,
        totalXp: child.totalXp,
        rewardPoints: child.rewardPoints,
        unlockedAvatars: child.unlockedAvatars,
        unlockedGear: child.unlockedGear,
        role: "child"
      });
    } catch (error) {
      console.error("Error fetching child:", error);
      res.status(500).json({ message: "Failed to fetch child" });
    }
  });

  // Child logout
  app.post('/api/auth/child-logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Children routes
  app.get('/api/children', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const children = await storage.getChildrenByParent(userId);
      res.json(children);
    } catch (error) {
      console.error("Error fetching children:", error);
      res.status(500).json({ message: "Failed to fetch children" });
    }
  });

  app.get('/api/children/:id', isAuthenticated, async (req: any, res) => {
    try {
      const child = await storage.getChild(req.params.id);
      if (!child) {
        return res.status(404).json({ message: "Child not found" });
      }
      res.json(child);
    } catch (error) {
      console.error("Error fetching child:", error);
      res.status(500).json({ message: "Failed to fetch child" });
    }
  });

  app.post('/api/children', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const childData = insertChildSchema.parse({
        ...req.body,
        parentId: userId,
      });
      const child = await storage.createChild(childData);
      res.json(child);
    } catch (error) {
      console.error("Error creating child:", error);
      res.status(500).json({ message: "Failed to create child" });
    }
  });

  app.patch('/api/children/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertChildSchema.partial().parse(req.body);
      const child = await storage.updateChild(req.params.id, updates);
      res.json(child);
    } catch (error) {
      console.error("Error updating child:", error);
      res.status(500).json({ message: "Failed to update child" });
    }
  });

  app.delete('/api/children/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteChild(req.params.id);
      res.json({ message: "Child deleted successfully" });
    } catch (error) {
      console.error("Error deleting child:", error);
      res.status(500).json({ message: "Failed to delete child" });
    }
  });

  // Habits routes
  app.get('/api/children/:childId/habits', isParentOrChildAuthenticated, async (req, res) => {
    try {
      const habits = await storage.getHabitsByChild(req.params.childId);
      res.json(habits);
    } catch (error) {
      console.error("Error fetching habits:", error);
      res.status(500).json({ message: "Failed to fetch habits" });
    }
  });

  // Master habits routes (for habit assignment center)
  app.get('/api/habits/master', isAuthenticated, async (req, res) => {
    try {
      const masterHabits = await storage.getMasterHabitsByParent(req.user!.id);
      res.json(masterHabits);
    } catch (error) {
      console.error("Error fetching master habits:", error);
      res.status(500).json({ message: "Failed to fetch master habits" });
    }
  });

  app.post('/api/habits/master', isAuthenticated, async (req, res) => {
    try {
      const masterHabitData = insertMasterHabitSchema.parse({
        ...req.body,
        parentId: req.user!.id,
      });
      const masterHabit = await storage.createMasterHabit(masterHabitData);
      res.json(masterHabit);
    } catch (error) {
      console.error("Error creating master habit:", error);
      res.status(500).json({ message: "Failed to create master habit" });
    }
  });

  // Get all child-specific habit assignments (for parent habit assignment overview)
  app.get('/api/habits/all', isAuthenticated, async (req, res) => {
    try {
      const habits = await storage.getAllHabitsByParent(req.user!.id);
      res.json(habits);
    } catch (error) {
      console.error("Error fetching all habits:", error);
      res.status(500).json({ message: "Failed to fetch habits" });
    }
  });

  // Assign master habit to specific child
  app.post('/api/children/:childId/habits', isAuthenticated, async (req, res) => {
    try {
      const habitData = insertHabitSchema.parse({
        ...req.body,
        childId: req.params.childId,
      });
      const habit = await storage.createHabit(habitData);
      
      // Create sync event for real-time updates to child devices
      try {
        const child = await storage.getChild(req.params.childId);
        if (child && child.parentId) {
          await syncService.createSyncEvent({
            userId: child.parentId,
            eventType: 'habit_created',
            entityType: 'habits',
            entityId: habit.id,
            eventData: {
              habitId: habit.id,
              habitName: habit.name,
              childId: child.id,
              childName: child.name,
              description: habit.description,
              xpReward: habit.xpReward
            },
            processed: false,
            deviceOrigin: req.headers['x-device-id'] as string || 'unknown'
          });
          console.log(`Created sync event for new habit: ${habit.name} for child ${child.name}`);
        }
      } catch (syncError) {
        console.error('Failed to create sync event for habit creation:', syncError);
        // Don't fail the request if sync fails
      }
      
      res.json(habit);
    } catch (error) {
      console.error("Error creating habit:", error);
      res.status(500).json({ message: "Failed to create habit" });
    }
  });

  // Auto-assign all master habits to all children (quick fix)
  app.post('/api/habits/auto-assign-all', isAuthenticated, async (req, res) => {
    try {
      const parentId = req.user!.id;
      
      // Get all master habits for this parent
      const masterHabits = await storage.getMasterHabitsByParent(parentId);
      
      // Get all children for this parent
      const children = await storage.getChildrenByParent(parentId);
      
      let assignedCount = 0;
      const results = [];
      
      for (const child of children) {
        for (const masterHabit of masterHabits) {
          // Check if this child already has this habit assigned
          const existingHabits = await storage.getHabitsByChild(child.id);
          const alreadyAssigned = existingHabits.find(h => h.masterHabitId === masterHabit.id);
          
          if (!alreadyAssigned) {
            // Create child-specific habit from master habit
            const habitData = {
              childId: child.id,
              masterHabitId: masterHabit.id,
              name: masterHabit.name,
              description: masterHabit.description,
              icon: masterHabit.icon,
              xpReward: masterHabit.xpReward,
              color: masterHabit.color,
              frequency: masterHabit.frequency,
              isActive: masterHabit.isActive,
              reminderTime: masterHabit.reminderTime ? String(masterHabit.reminderTime).padStart(2, '0') + ':00' : null,
              reminderEnabled: masterHabit.reminderEnabled || false,
              voiceReminderEnabled: masterHabit.voiceReminderEnabled || false,
              customRingtone: masterHabit.customRingtone,
              reminderDuration: masterHabit.reminderDuration || 5,
              voiceRecording: masterHabit.voiceRecording,
              voiceRecordingName: masterHabit.voiceRecordingName,
              timeRangeStart: masterHabit.timeRangeStart,
              timeRangeEnd: masterHabit.timeRangeEnd,
            };
            
            const newHabit = await storage.createHabit(habitData);
            results.push({
              childName: child.name,
              habitName: masterHabit.name,
              habitId: newHabit.id
            });
            assignedCount++;
            
            // Create sync event
            try {
              await syncService.createSyncEvent({
                userId: parentId,
                eventType: 'habit_created',
                entityType: 'habits',
                entityId: newHabit.id,
                eventData: {
                  habitId: newHabit.id,
                  habitName: newHabit.name,
                  childId: child.id,
                  childName: child.name,
                  description: newHabit.description,
                  xpReward: newHabit.xpReward
                },
                processed: false,
                deviceOrigin: req.headers['x-device-id'] as string || 'auto-assign'
              });
            } catch (syncError) {
              console.error('Failed to create sync event for auto-assignment:', syncError);
            }
          }
        }
      }
      
      console.log(`Auto-assigned ${assignedCount} habits across ${children.length} children`);
      
      res.json({
        success: true,
        assignedCount,
        childrenCount: children.length,
        masterHabitsCount: masterHabits.length,
        results
      });
      
    } catch (error) {
      console.error("Error auto-assigning habits:", error);
      res.status(500).json({ message: "Failed to auto-assign habits" });
    }
  });

  app.patch('/api/habits/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertHabitSchema.partial().parse(req.body);
      const habit = await storage.updateHabit(req.params.id, updates);
      res.json(habit);
    } catch (error) {
      console.error("Error updating habit:", error);
      res.status(500).json({ message: "Failed to update habit" });
    }
  });

  app.delete('/api/habits/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteHabit(req.params.id);
      res.json({ message: "Habit deleted successfully" });
    } catch (error) {
      console.error("Error deleting habit:", error);
      res.status(500).json({ message: "Failed to delete habit" });
    }
  });

  // Habit completions routes
  app.get('/api/children/:childId/completions', isParentOrChildAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const completions = await storage.getHabitCompletions(
        req.params.childId,
        startDate as string,
        endDate as string
      );
      res.json(completions);
    } catch (error) {
      console.error("Error fetching completions:", error);
      res.status(500).json({ message: "Failed to fetch completions" });
    }
  });

  app.get('/api/children/:childId/completions/today', isParentOrChildAuthenticated, async (req, res) => {
    try {
      const completions = await storage.getTodaysCompletions(req.params.childId);
      res.json(completions);
    } catch (error) {
      console.error("Error fetching today's completions:", error);
      res.status(500).json({ message: "Failed to fetch today's completions" });
    }
  });

  app.post('/api/habits/:habitId/complete', isParentOrChildAuthenticated, async (req, res) => {
    try {
      const habit = await storage.getHabit(req.params.habitId);
      if (!habit) {
        return res.status(404).json({ message: "Habit not found" });
      }

      // Time validation removed - kids can complete habits 24/7

      const today = new Date().toISOString().split('T')[0];
      
      // Check if there's already an approved completion for today
      const existingApprovedCompletion = await storage.getTodaysCompletions(habit.childId);
      const approvedForToday = existingApprovedCompletion.find(c => 
        c.habitId === req.params.habitId && c.status === 'approved' && c.date === today
      );
      
      if (approvedForToday) {
        return res.status(400).json({ message: "Habit already completed today" });
      }

      // Calculate reward points (10 points per habit completion)
      const rewardPointsEarned = 10;

      const completionData = insertHabitCompletionSchema.parse({
        habitId: req.params.habitId,
        childId: habit.childId,
        date: today,
        xpEarned: habit.xpReward,
        rewardPointsEarned,
        status: 'approved', // Immediately approve to award points
        requiresApproval: false, // No parent approval needed for immediate rewards
      });

      const completion = await storage.createHabitCompletion(completionData);
      
      // Immediately award reward points to child
      await storage.updateChildRewardPoints(habit.childId, rewardPointsEarned);
      
      // Also create a reward transaction for tracking
      await storage.createRewardTransaction({
        childId: habit.childId,
        type: 'earned',
        amount: rewardPointsEarned,
        source: 'habit_completion',
        description: `Earned ${rewardPointsEarned} points for completing "${habit.name}"`,
        requiresApproval: false,
        isApproved: true,
      });
      
      // Create real-time sync event to notify parents immediately
      try {
        // Get the child record to find the parent ID
        const child = await storage.getChild(habit.childId);
        if (child && child.parentId) {
          await syncService.createSyncEvent({
            userId: child.parentId, // Use parent ID to trigger parent dashboard updates
            eventType: 'habit_completed',
            entityType: 'habit_completions',
            entityId: completion.id,
            eventData: {
              habitId: habit.id,
              habitName: habit.name,
              childId: habit.childId,
              childName: child.name,
              completionDate: completion.date,
              status: completion.status,
              xpEarned: completion.xpEarned,
              rewardPointsEarned
            },
            processed: false
          });
          console.log(`Created sync event for habit completion: ${habit.name} by child ${child.name} (${habit.childId}) for parent ${child.parentId}`);
        }
      } catch (syncError) {
        console.error('Failed to create sync event for habit completion:', syncError);
        // Don't fail the request if sync fails
      }
      
      res.json(completion);
    } catch (error) {
      console.error("Error completing habit:", error);
      res.status(500).json({ message: "Failed to complete habit" });
    }
  });

  app.get('/api/habits/:habitId/streak/:childId', isParentOrChildAuthenticated, async (req, res) => {
    try {
      const streak = await storage.getHabitStreak(req.params.habitId, req.params.childId);
      res.json({ streak });
    } catch (error) {
      console.error("Error fetching streak:", error);
      res.status(500).json({ message: "Failed to fetch streak" });
    }
  });

  // Daily habit reload - remove pending/rejected completions to allow re-completion
  app.post('/api/children/:childId/habits/reload', isParentOrChildAuthenticated, async (req, res) => {
    try {
      await storage.reloadDailyHabits(req.params.childId);
      res.json({ message: "Daily habits reloaded successfully" });
    } catch (error) {
      console.error("Error reloading daily habits:", error);
      res.status(500).json({ message: "Failed to reload daily habits" });
    }
  });

  // Weekly progress summary
  app.get('/api/children/:childId/progress/weekly', isParentOrChildAuthenticated, async (req, res) => {
    try {
      const weeklyProgress = await storage.getWeeklyProgress(req.params.childId);
      res.json(weeklyProgress);
    } catch (error) {
      console.error("Error fetching weekly progress:", error);
      res.status(500).json({ message: "Failed to fetch weekly progress" });
    }
  });

  // Rewards routes
  app.get('/api/children/:childId/rewards', isParentOrChildAuthenticated, async (req, res) => {
    try {
      const rewards = await storage.getRewardsByChild(req.params.childId);
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });

  app.post('/api/children/:childId/rewards', isAuthenticated, async (req, res) => {
    try {
      const rewardData = insertRewardSchema.parse({
        ...req.body,
        childId: req.params.childId,
      });
      
      // Set next occurrence based on category and recurrence
      if (rewardData.isRecurring) {
        const now = new Date();
        switch (rewardData.category) {
          case 'daily':
            rewardData.nextOccurrence = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
            break;
          case 'weekly':
            const nextWeek = new Date(now);
            nextWeek.setDate(nextWeek.getDate() + 7); // Next week
            rewardData.nextOccurrence = nextWeek;
            break;
          case 'monthly':
            const nextMonth = new Date(now);
            nextMonth.setMonth(nextMonth.getMonth() + 1); // Next month
            rewardData.nextOccurrence = nextMonth;
            break;
          case 'yearly':
            const nextYear = new Date(now);
            nextYear.setFullYear(nextYear.getFullYear() + 1); // Next year
            rewardData.nextOccurrence = nextYear;
            break;
        }
        rewardData.lastGenerated = now;
      }
      
      const reward = await storage.createReward(rewardData);
      
      // Sync the new reward to all devices
      await syncService.createSyncEvent({
        userId: req.user?.id || req.session.parentId || '',
        eventType: 'reward_created',
        entityType: 'rewards',
        entityId: reward.id,
        eventData: { 
          childId: req.params.childId, 
          rewardName: reward.name,
          category: reward.category,
          isRecurring: reward.isRecurring 
        }
      });
      
      res.json(reward);
    } catch (error) {
      console.error("Error creating reward:", error);
      res.status(500).json({ message: "Failed to create reward" });
    }
  });

  app.patch('/api/rewards/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertRewardSchema.partial().parse(req.body);
      const reward = await storage.updateReward(req.params.id, updates);
      res.json(reward);
    } catch (error) {
      console.error("Error updating reward:", error);
      res.status(500).json({ message: "Failed to update reward" });
    }
  });

  app.delete('/api/rewards/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteReward(req.params.id);
      res.json({ message: "Reward deleted successfully" });
    } catch (error) {
      console.error("Error deleting reward:", error);
      res.status(500).json({ message: "Failed to delete reward" });
    }
  });

  // Reward claims routes
  app.get('/api/children/:childId/reward-claims', isParentOrChildAuthenticated, async (req, res) => {
    try {
      const claims = await storage.getRewardClaims(req.params.childId);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching reward claims:", error);
      res.status(500).json({ message: "Failed to fetch reward claims" });
    }
  });

  app.post('/api/rewards/:rewardId/claim', isParentOrChildAuthenticated, async (req, res) => {
    try {
      const reward = await storage.getRewardsByChild(req.body.childId);
      const targetReward = reward.find(r => r.id === req.params.rewardId);
      
      if (!targetReward) {
        return res.status(404).json({ message: "Reward not found" });
      }

      // Create a reward claim with pending status
      const claimData = {
        rewardId: req.params.rewardId,
        childId: req.body.childId,
        status: 'pending',
        isApproved: false,
      };

      const claim = await storage.createRewardClaim(claimData);
      
      // Create sync event for reward claim
      const userId = req.user?.id || req.session.parentId;
      if (userId) {
        await syncService.createSyncEvent({
          userId,
          eventType: 'reward_claimed',
          entityType: 'reward_claims',
          entityId: claim.id,
          eventData: { childId: req.body.childId, rewardId: req.params.rewardId }
        });
      }
      
      res.json(claim);
    } catch (error) {
      console.error("Error claiming reward:", error);
      res.status(500).json({ message: "Failed to claim reward" });
    }
  });

  // Approve reward claim route
  app.post('/api/reward-claims/:claimId/approve', isAuthenticated, async (req, res) => {
    try {
      const claim = await storage.approveRewardClaim(req.params.claimId);
      
      // Create sync event for reward approval
      const userId = req.user?.id;
      if (userId) {
        await syncService.createSyncEvent({
          userId,
          eventType: 'reward_approved',
          entityType: 'reward_claims',
          entityId: claim.id,
          eventData: { childId: claim.childId, rewardId: claim.rewardId }
        });
      }
      
      res.json(claim);
    } catch (error) {
      console.error("Error approving reward claim:", error);
      res.status(500).json({ message: "Failed to approve reward claim" });
    }
  });

  // Mark reward as used route
  app.put('/api/reward-claims/:claimId/mark-used', isParentOrChildAuthenticated, async (req, res) => {
    try {
      // Update the claim status to 'used'
      const claim = await storage.markRewardClaimAsUsed(req.params.claimId);
      
      // Create sync event for reward marked as used
      const userId = req.user?.id || req.session.parentId;
      if (userId) {
        await syncService.createSyncEvent({
          userId,
          eventType: 'reward_used',
          entityType: 'reward_claims',
          entityId: claim.id,
          eventData: { childId: claim.childId, rewardId: claim.rewardId }
        });
      }
      
      res.json(claim);
    } catch (error) {
      console.error("Error marking reward as used:", error);
      res.status(500).json({ message: "Failed to mark reward as used" });
    }
  });

  // Create reward transaction route
  app.post('/api/children/:childId/reward-transactions', isAuthenticated, async (req, res) => {
    try {
      const transactionData = insertRewardTransactionSchema.parse({
        ...req.body,
        childId: req.params.childId,
      });

      const transaction = await storage.createRewardTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      console.error("Error creating reward transaction:", error);
      res.status(500).json({ message: "Failed to create reward transaction" });
    }
  });

  // Mini-games routes
  app.get('/api/mini-games', async (req, res) => {
    try {
      const games = await storage.getAllMiniGames();
      res.json(games);
    } catch (error) {
      console.error("Error fetching mini-games:", error);
      res.status(500).json({ message: "Failed to fetch mini-games" });
    }
  });

  // Parental controls routes
  app.get('/api/children/:childId/parental-controls', isAuthenticated, async (req, res) => {
    try {
      const controls = await storage.getParentalControls(req.params.childId);
      
      // Return default controls if none exist
      if (!controls) {
        return res.json({
          childId: req.params.childId,
          dailyScreenTime: 60,
          bonusTimePerHabit: 10,
          weekendBonus: 30,
          gameUnlockRequirement: 2,
          maxGameTimePerDay: 20,
          bedtimeMode: true,
          bedtimeStart: "20:00",
          bedtimeEnd: "07:00",
          enableHabits: true,
          enableGearShop: true,
          enableMiniGames: true,
          enableRewards: true,
          emergencyMode: false,
          blockAllApps: false,
          limitInternet: false,
          parentContactEnabled: true,
        });
      }
      
      res.json(controls);
    } catch (error) {
      console.error("Error fetching parental controls:", error);
      res.status(500).json({ message: "Failed to fetch parental controls" });
    }
  });

  app.put('/api/children/:childId/parental-controls', isAuthenticated, async (req, res) => {
    try {
      const controlsData = insertParentalControlsSchema.parse({
        ...req.body,
        childId: req.params.childId,
      });
      const controls = await storage.upsertParentalControls(controlsData);
      res.json(controls);
    } catch (error) {
      console.error("Error updating parental controls:", error);
      res.status(500).json({ message: "Failed to update parental controls" });
    }
  });

  // Emergency controls
  app.post('/api/children/:childId/emergency/activate', isAuthenticated, async (req, res) => {
    try {
      const controls = await storage.activateEmergencyMode(req.params.childId);
      res.json(controls);
    } catch (error) {
      console.error("Error activating emergency mode:", error);
      res.status(500).json({ message: "Failed to activate emergency mode" });
    }
  });

  app.post('/api/children/:childId/emergency/deactivate', isAuthenticated, async (req, res) => {
    try {
      const controls = await storage.deactivateEmergencyMode(req.params.childId);
      res.json(controls);
    } catch (error) {
      console.error("Error deactivating emergency mode:", error);
      res.status(500).json({ message: "Failed to deactivate emergency mode" });
    }
  });

  // Avatar shop routes
  app.get('/api/avatar-shop', async (req, res) => {
    try {
      const items = await storage.getAllAvatarShopItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching avatar shop items:", error);
      res.status(500).json({ message: "Failed to fetch avatar shop items" });
    }
  });

  app.post('/api/avatar-shop', isAuthenticated, async (req, res) => {
    try {
      const itemData = insertAvatarShopItemSchema.parse(req.body);
      const item = await storage.createAvatarShopItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating avatar shop item:", error);
      res.status(500).json({ message: "Failed to create avatar shop item" });
    }
  });

  // Purchase avatar route
  app.post('/api/children/:childId/purchase-avatar', async (req, res) => {
    try {
      const { avatarType, cost } = req.body;
      
      if (!avatarType || !cost) {
        return res.status(400).json({ message: "Avatar type and cost are required" });
      }

      const updatedChild = await storage.purchaseAvatar(req.params.childId, avatarType, cost);
      res.json(updatedChild);
    } catch (error) {
      console.error("Error purchasing avatar:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to purchase avatar" });
      }
    }
  });

  // Weekend challenge routes
  app.get('/api/children/:childId/weekend-challenges', async (req, res) => {
    try {
      const challenges = await storage.getWeekendChallenges(req.params.childId);
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching weekend challenges:", error);
      res.status(500).json({ message: "Failed to fetch weekend challenges" });
    }
  });

  app.post('/api/children/:childId/weekend-challenges', async (req, res) => {
    try {
      const challengeData = insertWeekendChallengeSchema.parse({
        ...req.body,
        childId: req.params.childId,
      });
      const challenge = await storage.createWeekendChallenge(challengeData);
      res.json(challenge);
    } catch (error) {
      console.error("Error creating weekend challenge:", error);
      res.status(500).json({ message: "Failed to create weekend challenge" });
    }
  });

  app.patch('/api/weekend-challenges/:challengeId/accept', async (req, res) => {
    try {
      const challenge = await storage.acceptWeekendChallenge(req.params.challengeId);
      res.json(challenge);
    } catch (error) {
      console.error("Error accepting weekend challenge:", error);
      res.status(500).json({ message: "Failed to accept weekend challenge" });
    }
  });

  app.patch('/api/weekend-challenges/:challengeId/complete', async (req, res) => {
    try {
      const { pointsEarned } = req.body;
      const challenge = await storage.completeWeekendChallenge(req.params.challengeId, pointsEarned || 20);
      res.json(challenge);
    } catch (error) {
      console.error("Error completing weekend challenge:", error);
      res.status(500).json({ message: "Failed to complete weekend challenge" });
    }
  });

  // Update child reward points route
  app.patch('/api/children/:childId/reward-points', async (req, res) => {
    try {
      const { pointsGained } = req.body;
      
      if (typeof pointsGained !== 'number') {
        return res.status(400).json({ message: "Points gained must be a number" });
      }

      const updatedChild = await storage.updateChildRewardPoints(req.params.childId, pointsGained);
      res.json(updatedChild);
    } catch (error) {
      console.error("Error updating child reward points:", error);
      res.status(500).json({ message: "Failed to update reward points" });
    }
  });

  // Gear shop routes
  app.get('/api/gear-shop', async (req, res) => {
    try {
      const items = await storage.getAllGearShopItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching gear shop items:", error);
      res.status(500).json({ message: "Failed to fetch gear shop items" });
    }
  });

  app.post('/api/gear-shop', isAuthenticated, async (req, res) => {
    try {
      const itemData = insertGearShopItemSchema.parse(req.body);
      const item = await storage.createGearShopItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating gear shop item:", error);
      res.status(500).json({ message: "Failed to create gear shop item" });
    }
  });

  // Purchase gear route
  app.post('/api/children/:childId/purchase-gear', async (req, res) => {
    try {
      const { gearId, cost } = req.body;
      
      if (!gearId || !cost) {
        return res.status(400).json({ message: "Gear ID and cost are required" });
      }

      const updatedChild = await storage.purchaseGear(req.params.childId, gearId, cost);
      res.json(updatedChild);
    } catch (error) {
      console.error("Error purchasing gear:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to purchase gear" });
      }
    }
  });

  // Reward transaction routes
  app.get('/api/children/:childId/reward-transactions', async (req, res) => {
    try {
      const transactions = await storage.getRewardTransactions(req.params.childId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching reward transactions:", error);
      res.status(500).json({ message: "Failed to fetch reward transactions" });
    }
  });

  app.get('/api/children/:childId/pending-rewards', async (req, res) => {
    try {
      const pendingTransactions = await storage.getPendingRewardTransactions(req.params.childId);
      res.json(pendingTransactions);
    } catch (error) {
      console.error("Error fetching pending rewards:", error);
      res.status(500).json({ message: "Failed to fetch pending rewards" });
    }
  });

  app.post('/api/children/:childId/reward-transactions', isAuthenticated, async (req, res) => {
    try {
      const transactionData = insertRewardTransactionSchema.parse({
        ...req.body,
        childId: req.params.childId,
      });
      const transaction = await storage.createRewardTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      console.error("Error creating reward transaction:", error);
      res.status(500).json({ message: "Failed to create reward transaction" });
    }
  });

  app.post('/api/reward-transactions/:transactionId/approve', isAuthenticated, async (req, res) => {
    try {
      const { approvedBy } = req.body;
      
      if (!approvedBy) {
        return res.status(400).json({ message: "Approved by user ID is required" });
      }

      const approvedTransaction = await storage.approveRewardTransaction(req.params.transactionId, approvedBy);
      res.json(approvedTransaction);
    } catch (error) {
      console.error("Error approving reward transaction:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to approve reward transaction" });
      }
    }
  });

  // Habit approval routes
  app.get('/api/children/:childId/pending-habits', async (req, res) => {
    try {
      const pendingHabits = await storage.getPendingHabitCompletions(req.params.childId);
      res.json(pendingHabits);
    } catch (error) {
      console.error("Error fetching pending habits:", error);
      res.status(500).json({ message: "Failed to fetch pending habits" });
    }
  });

  app.get('/api/children/:childId/pending-habits-count', async (req, res) => {
    try {
      const count = await storage.getChildPendingHabitsCount(req.params.childId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching pending habits count:", error);
      res.status(500).json({ message: "Failed to fetch pending habits count" });
    }
  });

  app.get('/api/pending-habits/all', isAuthenticated, async (req, res) => {
    try {
      const allPendingHabits = await storage.getAllPendingHabitCompletions();
      res.json(allPendingHabits);
    } catch (error) {
      console.error("Error fetching all pending habits:", error);
      res.status(500).json({ message: "Failed to fetch pending habits" });
    }
  });

  app.post('/api/habit-completions/:completionId/approve', isAuthenticated, async (req, res) => {
    try {
      const { approvedBy, message } = req.body;
      
      if (!approvedBy) {
        return res.status(400).json({ message: "Approved by user ID is required" });
      }

      const approvedCompletion = await storage.approveHabitCompletion(
        req.params.completionId, 
        approvedBy, 
        message
      );
      
      // Create sync event for habit approval
      try {
        const habit = await storage.getHabit(approvedCompletion.habitId);
        const child = await storage.getChild(approvedCompletion.childId);
        if (habit && child) {
          await syncService.createSyncEvent({
            userId: child.parentId,
            eventType: 'habit_approved',
            entityType: 'habit_completions',
            entityId: approvedCompletion.id,
            eventData: {
              habitId: habit.id,
              habitName: habit.name,
              childId: child.id,
              childName: child.name,
              completionDate: approvedCompletion.date,
              status: 'approved',
              xpEarned: approvedCompletion.xpEarned,
              message: message
            },
            processed: false
          });
          console.log(`Created sync event for habit approval: ${habit.name} by child ${child.name}`);
        }
      } catch (syncError) {
        console.error('Failed to create sync event for habit approval:', syncError);
      }
      
      res.json(approvedCompletion);
    } catch (error) {
      console.error("Error approving habit completion:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to approve habit completion" });
      }
    }
  });

  app.post('/api/habit-completions/:completionId/reject', isAuthenticated, async (req, res) => {
    try {
      const { rejectedBy, message } = req.body;
      
      if (!rejectedBy || !message) {
        return res.status(400).json({ message: "Rejected by user ID and message are required" });
      }

      const rejectedCompletion = await storage.rejectHabitCompletion(
        req.params.completionId, 
        rejectedBy, 
        message
      );
      
      // Create sync event for habit rejection
      try {
        const habit = await storage.getHabit(rejectedCompletion.habitId);
        const child = await storage.getChild(rejectedCompletion.childId);
        if (habit && child) {
          await syncService.createSyncEvent({
            userId: child.parentId,
            eventType: 'habit_rejected',
            entityType: 'habit_completions',
            entityId: rejectedCompletion.id,
            eventData: {
              habitId: habit.id,
              habitName: habit.name,
              childId: child.id,
              childName: child.name,
              completionDate: rejectedCompletion.date,
              status: 'rejected',
              message: message
            },
            processed: false
          });
          console.log(`Created sync event for habit rejection: ${habit.name} by child ${child.name}`);
        }
      } catch (syncError) {
        console.error('Failed to create sync event for habit rejection:', syncError);
      }
      
      res.json(rejectedCompletion);
    } catch (error) {
      console.error("Error rejecting habit completion:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to reject habit completion" });
      }
    }
  });

  // Update parent profile
  app.patch("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updates = req.body;
      await storage.updateUserProfile(userId, updates);
      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update habit with reminder settings
  app.patch("/api/habits/:habitId", isAuthenticated, async (req: any, res) => {
    try {
      const { habitId } = req.params;
      const updates = req.body;
      const updatedHabit = await storage.updateHabit(habitId, updates);
      res.json(updatedHabit);
    } catch (error: any) {
      console.error("Error updating habit:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update master habit status
  app.patch("/api/master-habits/:habitId", isAuthenticated, async (req: any, res) => {
    try {
      const { habitId } = req.params;
      const updates = req.body;
      const updatedHabit = await storage.updateMasterHabit(habitId, updates);
      res.json(updatedHabit);
    } catch (error: any) {
      console.error("Error updating master habit:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // =====================
  // SYNC API ENDPOINTS
  // =====================

  // Register device for sync
  app.post('/api/sync/register-device', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertDeviceSchema.parse(req.body);
      const device = await syncService.registerDevice(req.user!.id, {
        deviceId: validatedData.deviceId,
        deviceName: validatedData.deviceName,
        deviceType: validatedData.deviceType as 'web' | 'ios' | 'android',
        pushToken: validatedData.pushToken || undefined
      });
      
      // Create sync event for device registration
      await syncService.createSyncEvent({
        userId: req.user!.id,
        eventType: 'device_registered',
        entityType: 'devices',
        entityId: device.id,
        eventData: { deviceName: device.deviceName, deviceType: device.deviceType },
        deviceOrigin: validatedData.deviceId,
      });
      
      res.json(device);
    } catch (error: any) {
      console.error('Register device error:', error);
      res.status(400).json({ message: error.message || "Failed to register device" });
    }
  });

  // Get user's devices
  app.get('/api/sync/devices', isAuthenticated, async (req, res) => {
    try {
      const devices = await syncService.getUserDevices(req.user!.id);
      res.json({ devices });
    } catch (error: any) {
      console.error('Get devices error:', error);
      res.status(500).json({ message: "Failed to get devices" });
    }
  });

  // Sync family data
  app.get('/api/sync/family-data', isAuthenticated, async (req, res) => {
    try {
      const lastSyncTime = req.query.lastSyncTime 
        ? new Date(req.query.lastSyncTime as string) 
        : undefined;
      
      const familyData = await syncService.syncFamilyData(req.user!.id);
      const pendingEvents = await syncService.getPendingSyncEvents(req.user!.id, lastSyncTime);
      
      res.json({
        ...familyData,
        syncEvents: pendingEvents,
        lastSyncTime: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Sync family data error:', error);
      res.status(500).json({ message: "Failed to sync family data" });
    }
  });

  // Sync family data for children - get family updates from child perspective
  app.get('/api/sync/child-family-data', isParentOrChildAuthenticated, async (req, res) => {
    console.log('Child sync endpoint called - session:', {
      childId: req.session.childId,
      isChildUser: req.session.isChildUser,
      parentId: req.session.parentId
    });
    try {
      const lastSyncTime = req.query.lastSyncTime 
        ? new Date(req.query.lastSyncTime as string) 
        : undefined;
      
      let parentId: string;
      
      // Get parent ID based on user type
      if (req.user) {
        // Parent user
        parentId = req.user.id;
      } else if (req.session.childId && req.session.isChildUser && req.session.parentId) {
        // Child user - get their parent ID from session
        parentId = req.session.parentId;
      } else {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const familyData = await syncService.syncFamilyData(parentId);
      const pendingEvents = await syncService.getPendingSyncEvents(parentId, lastSyncTime);
      
      res.json({
        ...familyData,
        syncEvents: pendingEvents,
        lastSyncTime: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Sync child family data error:', error);
      res.status(500).json({ message: "Failed to sync child family data" });
    }
  });

  // Mark sync completed
  app.post('/api/sync/mark-completed', isAuthenticated, async (req, res) => {
    try {
      const { deviceId, eventIds } = req.body;
      
      if (deviceId) {
        await syncService.updateDeviceLastSync(deviceId);
      }
      
      if (eventIds && eventIds.length > 0) {
        await syncService.markEventsProcessed(eventIds);
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Mark sync completed error:', error);
      res.status(500).json({ message: "Failed to mark sync completed" });
    }
  });

  // Deactivate device
  app.post('/api/sync/deactivate-device', isAuthenticated, async (req, res) => {
    try {
      const { deviceId } = req.body;
      await syncService.deactivateDevice(req.user!.id, deviceId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Deactivate device error:', error);
      res.status(500).json({ message: "Failed to deactivate device" });
    }
  });

  // Subscription API routes
  app.get('/api/subscription/plans', (req, res) => {
    try {
      res.json({ plans: SUBSCRIPTION_PLANS });
    } catch (error: any) {
      console.error('Error fetching subscription plans:', error);
      res.status(500).json({ message: 'Failed to fetch subscription plans' });
    }
  });

  app.get('/api/subscription/status', isAuthenticated, async (req, res) => {
    try {
      const user = await SubscriptionService.syncSubscriptionStatus(req.user!.id);
      const subscriptionInfo = SubscriptionService.getSubscriptionInfo(user);
      res.json(subscriptionInfo);
    } catch (error: any) {
      console.error('Error fetching subscription status:', error);
      res.status(500).json({ message: 'Failed to fetch subscription status' });
    }
  });

  app.post('/api/subscription/create', isAuthenticated, async (req, res) => {
    try {
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: 'Plan ID is required' });
      }

      const result = await SubscriptionService.createSubscription(req.user!.id, planId);
      res.json(result);
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ message: error.message || 'Failed to create subscription' });
    }
  });

  app.post('/api/subscription/complete', isAuthenticated, async (req, res) => {
    try {
      const { paymentIntentId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: 'Payment Intent ID is required' });
      }

      const result = await SubscriptionService.completeSubscription(paymentIntentId);
      res.json({ success: true, subscription: result });
    } catch (error: any) {
      console.error('Error completing subscription:', error);
      res.status(500).json({ message: error.message || 'Failed to complete subscription' });
    }
  });

  app.post('/api/subscription/cancel', isAuthenticated, async (req, res) => {
    try {
      const result = await SubscriptionService.cancelSubscription(req.user!.id);
      res.json({ success: true, subscription: result });
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({ message: error.message || 'Failed to cancel subscription' });
    }
  });

  app.post('/api/subscription/check-feature-access', isParentOrChildAuthenticated, async (req, res) => {
    try {
      const { feature } = req.body;
      const userId = req.user?.id || req.session.parentId;
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      const user = await storage.getUserById(userId);
      
      const hasAccess = SubscriptionService.hasFeatureAccess(user, feature);
      res.json({ hasAccess, user: SubscriptionService.getSubscriptionInfo(user) });
    } catch (error: any) {
      console.error('Error checking feature access:', error);
      res.status(500).json({ message: 'Failed to check feature access' });
    }
  });



  // Object Storage routes for voice recordings
  app.post('/api/objects/upload', isAuthenticated, async (req, res) => {
    try {
      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getVoiceRecordingUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
