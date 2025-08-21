import { storage } from "./storage";
import { syncService } from "./sync-service";
import type { Reward } from "@shared/schema";

export class RecurringRewardsService {
  // Generate new recurring reward instances based on schedule
  static async processRecurringRewards(): Promise<void> {
    try {
      const now = new Date();
      
      // Get all recurring rewards that are due for regeneration
      const dueRewards = await storage.getRecurringRewardsDue(now);
      
      for (const reward of dueRewards) {
        await this.generateNextRewardInstance(reward);
      }
    } catch (error) {
      console.error("Error processing recurring rewards:", error);
    }
  }

  // Generate the next instance of a recurring reward
  static async generateNextRewardInstance(parentReward: Reward): Promise<Reward | null> {
    try {
      const now = new Date();
      
      // Calculate next occurrence based on category
      let nextOccurrence: Date;
      switch (parentReward.category) {
        case 'daily':
          nextOccurrence = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          nextOccurrence = new Date(now);
          nextOccurrence.setDate(nextOccurrence.getDate() + 7);
          break;
        case 'monthly':
          nextOccurrence = new Date(now);
          nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
          break;
        case 'yearly':
          nextOccurrence = new Date(now);
          nextOccurrence.setFullYear(nextOccurrence.getFullYear() + 1);
          break;
        default:
          nextOccurrence = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      }

      // Create new reward instance
      const newRewardData = {
        childId: parentReward.childId,
        name: parentReward.name,
        description: parentReward.description,
        type: parentReward.type,
        value: parentReward.value,
        cost: parentReward.cost,
        costType: parentReward.costType,
        category: parentReward.category,
        isRecurring: false, // Generated instances are not recurring themselves
        parentRewardId: parentReward.id, // Link to parent reward
        nextOccurrence: null,
        lastGenerated: null,
        isActive: true,
      };

      const newReward = await storage.createReward(newRewardData);

      // Update parent reward's next occurrence and last generated time
      await storage.updateReward(parentReward.id, {
        nextOccurrence,
        lastGenerated: now,
      });

      // Sync the new reward to all devices
      const parent = await storage.getParentByChildId(parentReward.childId);
      if (parent) {
        await syncService.addEvent(
          parent.id,
          'recurring_reward_generated',
          'rewards',
          newReward.id,
          { 
            childId: parentReward.childId, 
            parentRewardId: parentReward.id,
            rewardName: newReward.name,
            category: newReward.category,
          }
        );
      }

      console.log(`Generated new recurring reward instance: ${newReward.name} for child ${parentReward.childId}`);
      return newReward;
    } catch (error) {
      console.error("Error generating next reward instance:", error);
      return null;
    }
  }

  // Start the recurring rewards processor (runs every hour)
  static startProcessor(): void {
    // Process immediately
    this.processRecurringRewards();
    
    // Process every hour
    setInterval(() => {
      this.processRecurringRewards();
    }, 60 * 60 * 1000); // 1 hour

    console.log("Recurring rewards processor started");
  }

  // Get all recurring rewards for a child
  static async getRecurringRewardsForChild(childId: string): Promise<Reward[]> {
    return await storage.getRecurringRewardsByChild(childId);
  }

  // Get all generated instances of a recurring reward
  static async getRewardInstances(parentRewardId: string): Promise<Reward[]> {
    return await storage.getRewardInstancesByParent(parentRewardId);
  }
}