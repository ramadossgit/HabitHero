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
  insertParentalControlsSchema 
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

  const httpServer = createServer(app);
  return httpServer;
}
