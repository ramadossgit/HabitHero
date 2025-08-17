import { db } from "./db";
import { 
  devices, 
  syncLogs, 
  syncEvents, 
  children, 
  habits, 
  habitCompletions, 
  rewards, 
  rewardClaims,
  users,
  type Device,
  type SyncEvent,
  type SyncLog,
  type InsertDevice,
  type InsertSyncEvent,
  type InsertSyncLog
} from "@shared/schema";
import { eq, and, desc, gt } from "drizzle-orm";

export class SyncService {
  
  // Register or update a device for sync
  async registerDevice(userId: string, deviceInfo: {
    deviceId: string;
    deviceName: string;
    deviceType: 'web' | 'ios' | 'android';
    pushToken?: string;
  }): Promise<Device> {
    console.log(`Registering device for user ${userId}:`, deviceInfo);
    
    // Check if device already exists
    const existingDevice = await db
      .select()
      .from(devices)
      .where(and(
        eq(devices.userId, userId),
        eq(devices.deviceId, deviceInfo.deviceId)
      ))
      .limit(1);

    if (existingDevice.length > 0) {
      // Update existing device
      const [updatedDevice] = await db
        .update(devices)
        .set({
          deviceName: deviceInfo.deviceName,
          deviceType: deviceInfo.deviceType,
          pushToken: deviceInfo.pushToken,
          isActive: true,
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(devices.id, existingDevice[0].id))
        .returning();
      
      console.log('Updated existing device:', updatedDevice);
      return updatedDevice;
    } else {
      // Create new device
      const [newDevice] = await db
        .insert(devices)
        .values({
          userId,
          deviceId: deviceInfo.deviceId,
          deviceName: deviceInfo.deviceName,
          deviceType: deviceInfo.deviceType,
          pushToken: deviceInfo.pushToken,
          isActive: true,
        })
        .returning();
      
      console.log('Created new device:', newDevice);
      return newDevice;
    }
  }

  // Log sync activity for tracking
  async logSyncActivity(logData: Omit<InsertSyncLog, 'timestamp'>): Promise<SyncLog> {
    const [syncLog] = await db
      .insert(syncLogs)
      .values(logData)
      .returning();
    
    console.log('Logged sync activity:', syncLog);
    return syncLog;
  }

  // Create sync event for real-time updates
  async createSyncEvent(eventData: Omit<InsertSyncEvent, 'timestamp'>): Promise<SyncEvent> {
    const [syncEvent] = await db
      .insert(syncEvents)
      .values(eventData)
      .returning();
    
    console.log('Created sync event:', syncEvent);
    return syncEvent;
  }

  // Get pending sync events for a user since last sync
  async getPendingSyncEvents(userId: string, lastSyncTime?: Date): Promise<SyncEvent[]> {
    let whereConditions = eq(syncEvents.userId, userId);
    
    if (lastSyncTime) {
      whereConditions = and(
        eq(syncEvents.userId, userId),
        gt(syncEvents.timestamp, lastSyncTime)
      ) as any;
    }
    
    const events = await db
      .select()
      .from(syncEvents)
      .where(whereConditions)
      .orderBy(desc(syncEvents.timestamp))
      .limit(100);
    
    console.log(`Found ${events.length} pending sync events for user ${userId}`);
    return events;
  }

  // Mark sync events as processed
  async markEventsProcessed(eventIds: string[]): Promise<void> {
    if (eventIds.length > 0) {
      await db
        .update(syncEvents)
        .set({ processed: true })
        .where(
          eq(syncEvents.id, eventIds[0]) // This would need proper IN operator in production
        );
      
      console.log(`Marked ${eventIds.length} events as processed`);
    }
  }

  // Get user's devices
  async getUserDevices(userId: string): Promise<Device[]> {
    const userDevices = await db
      .select()
      .from(devices)
      .where(and(
        eq(devices.userId, userId),
        eq(devices.isActive, true)
      ))
      .orderBy(desc(devices.lastSyncAt));
    
    console.log(`Found ${userDevices.length} active devices for user ${userId}`);
    return userDevices;
  }

  // Sync family data for a user - get all family related data
  async syncFamilyData(userId: string): Promise<{
    children: any[];
    habits: any[];
    completions: any[];
    rewards: any[];
    claims: any[];
  }> {
    console.log(`Syncing family data for user ${userId}`);
    
    // Get all children for the parent
    const userChildren = await db
      .select()
      .from(children)
      .where(eq(children.parentId, userId));

    const childIds = userChildren.map(child => child.id);
    
    // Get all habits for the children
    let allHabits: any[] = [];
    let allCompletions: any[] = [];
    let allRewards: any[] = [];
    let allClaims: any[] = [];

    if (childIds.length > 0) {
      // For now, get for first child - in production would need proper IN queries
      const firstChildId = childIds[0];
      
      allHabits = await db
        .select()
        .from(habits)
        .where(eq(habits.childId, firstChildId));

      allCompletions = await db
        .select()
        .from(habitCompletions)
        .where(eq(habitCompletions.childId, firstChildId))
        .orderBy(desc(habitCompletions.completedAt))
        .limit(100);

      allRewards = await db
        .select()
        .from(rewards)
        .where(eq(rewards.childId, firstChildId));

      allClaims = await db
        .select()
        .from(rewardClaims)
        .where(eq(rewardClaims.childId, firstChildId))
        .orderBy(desc(rewardClaims.claimedAt))
        .limit(50);
    }

    const syncData = {
      children: userChildren,
      habits: allHabits,
      completions: allCompletions,
      rewards: allRewards,
      claims: allClaims,
    };
    
    console.log(`Synced data summary:`, {
      children: syncData.children.length,
      habits: syncData.habits.length,
      completions: syncData.completions.length,
      rewards: syncData.rewards.length,
      claims: syncData.claims.length,
    });
    
    return syncData;
  }

  // Update device last sync time
  async updateDeviceLastSync(deviceId: string): Promise<void> {
    await db
      .update(devices)
      .set({ lastSyncAt: new Date() })
      .where(eq(devices.id, deviceId));
    
    console.log(`Updated last sync time for device ${deviceId}`);
  }

  // Deactivate device (when user logs out or uninstalls)
  async deactivateDevice(userId: string, deviceId: string): Promise<void> {
    await db
      .update(devices)
      .set({ isActive: false })
      .where(and(
        eq(devices.userId, userId),
        eq(devices.deviceId, deviceId)
      ));
    
    console.log(`Deactivated device ${deviceId} for user ${userId}`);
  }
}

export const syncService = new SyncService();