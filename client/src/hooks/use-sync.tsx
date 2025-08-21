import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useAuth } from "./useAuth";
import { useChildAuth } from "./useChildAuth";
import { useToast } from "./use-toast";

type SyncContextType = {
  isOnline: boolean;
  lastSyncTime: Date | null;
  syncStatus: 'idle' | 'syncing' | 'error';
  currentDevice: any;
  allDevices: any[];
  triggerSync: () => void;
  registerDevice: (deviceInfo: any) => Promise<void>;
  syncInProgress: boolean;
};

const SyncContext = createContext<SyncContextType | null>(null);

// Generate unique device ID for this browser session
const generateDeviceId = () => {
  let deviceId = localStorage.getItem('habitHeroes_deviceId');
  if (!deviceId) {
    deviceId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('habitHeroes_deviceId', deviceId);
  }
  return deviceId;
};

// Get device info
const getDeviceInfo = () => {
  const deviceId = generateDeviceId();
  const userAgent = navigator.userAgent;
  let deviceType = 'web';
  let deviceName = 'Web Browser';
  
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    deviceType = 'ios';
    deviceName = 'iOS Device';
  } else if (/Android/.test(userAgent)) {
    deviceType = 'android';
    deviceName = 'Android Device';
  } else if (/Windows/.test(userAgent)) {
    deviceName = 'Windows Computer';
  } else if (/Mac/.test(userAgent)) {
    deviceName = 'Mac Computer';
  }
  
  return {
    deviceId,
    deviceName: `${deviceName} - ${new Date().toLocaleDateString()}`,
    deviceType: deviceType as 'web' | 'ios' | 'android',
  };
};

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { child, isChildAuthenticated: childIsAuthenticated } = useChildAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Determine if user is authenticated as either parent or child
  const isAnyAuthenticated = isAuthenticated || childIsAuthenticated;
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [currentDevice, setCurrentDevice] = useState<any>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get user's devices
  const { data: devicesData } = useQuery({
    queryKey: ["/api/sync/devices"],
    enabled: isAuthenticated && !!user, // Only parents can manage devices
    staleTime: 60000, // 1 minute
  });

  const allDevices = (devicesData as any)?.devices || [];

  // Register device mutation
  const registerDeviceMutation = useMutation({
    mutationFn: async (deviceInfo: any) => {
      const response = await apiRequest("POST", "/api/sync/register-device", deviceInfo);
      return await response.json();
    },
    onSuccess: (device) => {
      console.log('Device registered successfully:', device);
      setCurrentDevice(device);
      queryClient.invalidateQueries({ queryKey: ["/api/sync/devices"] });
      // Silently register device without showing toast to user
    },
    onError: (error: any) => {
      console.error('Device registration failed:', error);
      toast({
        title: "Sync Setup Failed",
        description: "Failed to register this device for sync",
        variant: "destructive",
      });
    },
  });

  // Sync family data mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      setSyncInProgress(true);
      setSyncStatus('syncing');
      
      const lastSync = lastSyncTime ? lastSyncTime.toISOString() : undefined;
      
      // Use different endpoint based on user type
      const endpoint = childIsAuthenticated 
        ? `/api/sync/child-family-data${lastSync ? `?lastSyncTime=${lastSync}` : ''}`
        : `/api/sync/family-data${lastSync ? `?lastSyncTime=${lastSync}` : ''}`;
      
      const response = await apiRequest("GET", endpoint);
      
      if (!response.ok) {
        throw new Error('Sync failed');
      }
      
      return await response.json();
    },
    onSuccess: (syncData) => {
      console.log('Sync completed:', syncData);
      setSyncStatus('idle');
      setSyncInProgress(false);
      
      // Update last sync time
      setLastSyncTime(new Date(syncData.lastSyncTime));
      localStorage.setItem('lastSyncTime', syncData.lastSyncTime);
      
      // Invalidate all queries to refresh UI with new data
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      
      // Invalidate reward claims for all children to ensure cross-device sync
      queryClient.invalidateQueries({ queryKey: ["/api/children"], predicate: (query) => 
        query.queryKey[0] === "/api/children" && query.queryKey[2] === "reward-claims"
      });
      
      // Invalidate child-specific queries if authenticated as child
      if (childIsAuthenticated && child) {
        const childId = (child as any).id;
        queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/habits`] });
        queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/completions`] });
        queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/completions/today`] });
        queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/pending-habits`] });
        queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/reward-claims`] });
        queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/rewards`] });
      }
      
      // Mark sync as completed on server
      if (currentDevice && syncData.syncEvents?.length > 0) {
        apiRequest("POST", "/api/sync/mark-completed", {
          deviceId: currentDevice.id,
          eventIds: syncData.syncEvents.map((event: any) => event.id),
        });
      }
      
      // Silently complete sync without showing toast to user
    },
    onError: (error: any) => {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      setSyncInProgress(false);
      toast({
        title: "Sync Failed",
        description: "Failed to sync with other devices. Will retry later.",
        variant: "destructive",
      });
    },
  });

  // Auto-register device when user logs in (only for parents)
  useEffect(() => {
    if (isAuthenticated && user && !currentDevice) {
      const deviceInfo = getDeviceInfo();
      registerDeviceMutation.mutate(deviceInfo);
    }
  }, [isAuthenticated, user, currentDevice]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && isAnyAuthenticated && (currentDevice || childIsAuthenticated)) {
      // Delay sync to avoid conflicts
      const timer = setTimeout(() => {
        syncMutation.mutate();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, isAnyAuthenticated, currentDevice, childIsAuthenticated]);

  // Periodic sync every 30 seconds when online and active for faster updates
  useEffect(() => {
    if (!isOnline || !isAnyAuthenticated || (!currentDevice && !childIsAuthenticated)) return;
    
    const interval = setInterval(() => {
      if (!syncInProgress) {
        syncMutation.mutate();
      }
    }, 30000); // 30 seconds for faster real-time updates
    
    return () => clearInterval(interval);
  }, [isOnline, isAnyAuthenticated, currentDevice, childIsAuthenticated, syncInProgress]);

  // Load last sync time from storage
  useEffect(() => {
    const stored = localStorage.getItem('lastSyncTime');
    if (stored) {
      setLastSyncTime(new Date(stored));
    }
  }, []);

  const triggerSync = () => {
    if (isAnyAuthenticated && (currentDevice || childIsAuthenticated) && !syncInProgress) {
      syncMutation.mutate();
    }
  };

  const registerDevice = async (deviceInfo: any) => {
    return registerDeviceMutation.mutateAsync(deviceInfo);
  };

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        lastSyncTime,
        syncStatus,
        currentDevice,
        allDevices,
        triggerSync,
        registerDevice,
        syncInProgress,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
}