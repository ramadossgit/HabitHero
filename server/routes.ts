import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertChildSchema, 
  insertHabitSchema, 
  insertHabitCompletionSchema,
  insertRewardSchema,
  insertRewardClaimSchema,
  insertParentalControlsSchema,
  insertAvatarShopItemSchema,
  insertWeekendChallengeSchema,
  insertGearShopItemSchema,
  insertRewardTransactionSchema
} from "@shared/schema";
import { z } from "zod";

// Extend session data interface
declare module 'express-session' {
  interface SessionData {
    childId: string;
    isChildUser: boolean;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Child login route
  app.post('/api/auth/child-login', async (req, res) => {
    try {
      const { username, pin } = req.body;
      
      if (!username || !pin) {
        return res.status(400).json({ message: "Username and PIN are required" });
      }

      const child = await storage.getChildByUsername(username);
      
      if (!child || child.pin !== pin) {
        return res.status(401).json({ message: "Invalid username or PIN" });
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
  app.get('/api/children/:childId/habits', isAuthenticated, async (req, res) => {
    try {
      const habits = await storage.getHabitsByChild(req.params.childId);
      res.json(habits);
    } catch (error) {
      console.error("Error fetching habits:", error);
      res.status(500).json({ message: "Failed to fetch habits" });
    }
  });

  app.post('/api/children/:childId/habits', isAuthenticated, async (req, res) => {
    try {
      const habitData = insertHabitSchema.parse({
        ...req.body,
        childId: req.params.childId,
      });
      const habit = await storage.createHabit(habitData);
      res.json(habit);
    } catch (error) {
      console.error("Error creating habit:", error);
      res.status(500).json({ message: "Failed to create habit" });
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
  app.get('/api/children/:childId/completions', isAuthenticated, async (req, res) => {
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

  app.get('/api/children/:childId/completions/today', isAuthenticated, async (req, res) => {
    try {
      const completions = await storage.getTodaysCompletions(req.params.childId);
      res.json(completions);
    } catch (error) {
      console.error("Error fetching today's completions:", error);
      res.status(500).json({ message: "Failed to fetch today's completions" });
    }
  });

  app.post('/api/habits/:habitId/complete', isAuthenticated, async (req, res) => {
    try {
      const habit = await storage.getHabit(req.params.habitId);
      if (!habit) {
        return res.status(404).json({ message: "Habit not found" });
      }

      const today = new Date().toISOString().split('T')[0];
      
      // Check if there's already an approved completion for today
      const existingApprovedCompletion = await storage.getTodaysCompletions(habit.childId);
      const approvedForToday = existingApprovedCompletion.find(c => 
        c.habitId === req.params.habitId && c.status === 'approved' && c.date === today
      );
      
      if (approvedForToday) {
        return res.status(400).json({ message: "Habit already completed today" });
      }

      const completionData = insertHabitCompletionSchema.parse({
        habitId: req.params.habitId,
        childId: habit.childId,
        date: today,
        xpEarned: habit.xpReward,
      });

      const completion = await storage.createHabitCompletion(completionData);
      res.json(completion);
    } catch (error) {
      console.error("Error completing habit:", error);
      res.status(500).json({ message: "Failed to complete habit" });
    }
  });

  app.get('/api/habits/:habitId/streak/:childId', isAuthenticated, async (req, res) => {
    try {
      const streak = await storage.getHabitStreak(req.params.habitId, req.params.childId);
      res.json({ streak });
    } catch (error) {
      console.error("Error fetching streak:", error);
      res.status(500).json({ message: "Failed to fetch streak" });
    }
  });

  // Daily habit reload - remove pending/rejected completions to allow re-completion
  app.post('/api/children/:childId/habits/reload', isAuthenticated, async (req, res) => {
    try {
      await storage.reloadDailyHabits(req.params.childId);
      res.json({ message: "Daily habits reloaded successfully" });
    } catch (error) {
      console.error("Error reloading daily habits:", error);
      res.status(500).json({ message: "Failed to reload daily habits" });
    }
  });

  // Weekly progress summary
  app.get('/api/children/:childId/progress/weekly', isAuthenticated, async (req, res) => {
    try {
      const weeklyProgress = await storage.getWeeklyProgress(req.params.childId);
      res.json(weeklyProgress);
    } catch (error) {
      console.error("Error fetching weekly progress:", error);
      res.status(500).json({ message: "Failed to fetch weekly progress" });
    }
  });

  // Rewards routes
  app.get('/api/children/:childId/rewards', isAuthenticated, async (req, res) => {
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
      const reward = await storage.createReward(rewardData);
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
  app.get('/api/children/:childId/reward-claims', isAuthenticated, async (req, res) => {
    try {
      const claims = await storage.getRewardClaims(req.params.childId);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching reward claims:", error);
      res.status(500).json({ message: "Failed to fetch reward claims" });
    }
  });

  app.post('/api/rewards/:rewardId/claim', isAuthenticated, async (req, res) => {
    try {
      const reward = await storage.getRewardsByChild(req.body.childId);
      const targetReward = reward.find(r => r.id === req.params.rewardId);
      
      if (!targetReward) {
        return res.status(404).json({ message: "Reward not found" });
      }

      const claimData = insertRewardClaimSchema.parse({
        rewardId: req.params.rewardId,
        childId: req.body.childId,
      });

      const claim = await storage.createRewardClaim(claimData);
      res.json(claim);
    } catch (error) {
      console.error("Error claiming reward:", error);
      res.status(500).json({ message: "Failed to claim reward" });
    }
  });

  app.patch('/api/reward-claims/:id/approve', isAuthenticated, async (req, res) => {
    try {
      const claim = await storage.approveRewardClaim(req.params.id);
      res.json(claim);
    } catch (error) {
      console.error("Error approving reward claim:", error);
      res.status(500).json({ message: "Failed to approve reward claim" });
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
      const userId = req.user.claims.sub;
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

  const httpServer = createServer(app);
  return httpServer;
}
