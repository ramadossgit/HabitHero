import { useSync } from "@/hooks/use-sync";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Wifi, 
  WifiOff, 
  Smartphone, 
  Monitor, 
  Tablet,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SyncStatus() {
  const { 
    isOnline, 
    lastSyncTime, 
    syncStatus, 
    currentDevice, 
    allDevices,
    triggerSync,
    syncInProgress 
  } = useSync();

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'ios':
      case 'android':
        return <Smartphone className="h-4 w-4" />;
      case 'web':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Tablet className="h-4 w-4" />;
    }
  };

  const getSyncStatusColor = () => {
    if (!isOnline) return "bg-red-500";
    if (syncStatus === 'syncing' || syncInProgress) return "bg-blue-500 animate-pulse";
    if (syncStatus === 'error') return "bg-orange-500";
    return "bg-green-500";
  };

  const getSyncStatusText = () => {
    if (!isOnline) return "Offline";
    if (syncStatus === 'syncing' || syncInProgress) return "Syncing...";
    if (syncStatus === 'error') return "Sync Error";
    return "Synced";
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return "Never";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Online/Offline Status */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isOnline ? "Connected to internet" : "No internet connection"}
        </TooltipContent>
      </Tooltip>

      {/* Sync Status Badge */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              "flex items-center gap-1 text-white border-0 text-xs px-2",
              getSyncStatusColor()
            )}
          >
            <div className="w-2 h-2 rounded-full bg-white/80" />
            {getSyncStatusText()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">Sync Status</p>
            <p className="text-xs text-muted-foreground">
              Last sync: {formatLastSync(lastSyncTime)}
            </p>
            {allDevices.length > 1 && (
              <p className="text-xs text-muted-foreground">
                {allDevices.length} devices connected
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      {/* Manual Sync Button */}
      {isOnline && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={triggerSync}
              disabled={syncInProgress}
              className="h-6 w-6 p-0 hover:bg-white/10"
            >
              <RefreshCw className={cn(
                "h-3 w-3 text-white/70",
                syncInProgress && "animate-spin"
              )} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {syncInProgress ? "Syncing..." : "Manual sync"}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Current Device */}
      {currentDevice && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-white/70">
              {getDeviceIcon(currentDevice.deviceType)}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">{currentDevice.deviceName}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {currentDevice.deviceType} device
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Connected Devices Count */}
      {allDevices.length > 1 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="text-xs">
              {allDevices.length}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div>
              <p className="font-medium mb-2">{allDevices.length} Connected Devices</p>
              <div className="space-y-1">
                {allDevices.map((device) => (
                  <div key={device.id} className="flex items-center gap-2 text-xs">
                    {getDeviceIcon(device.deviceType)}
                    <span className={cn(
                      device.id === currentDevice?.id && "font-medium text-primary"
                    )}>
                      {device.deviceName}
                      {device.id === currentDevice?.id && " (current)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export function SyncStatusIndicator() {
  const { syncStatus, syncInProgress, isOnline } = useSync();
  
  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 text-orange-500 text-sm">
        <AlertCircle className="h-4 w-4" />
        <span>Offline - Changes will sync when online</span>
      </div>
    );
  }
  
  if (syncInProgress) {
    return (
      <div className="flex items-center gap-2 text-blue-500 text-sm">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Syncing across devices...</span>
      </div>
    );
  }
  
  if (syncStatus === 'error') {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm">
        <AlertCircle className="h-4 w-4" />
        <span>Sync error - Will retry automatically</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2 text-green-500 text-sm">
      <CheckCircle className="h-4 w-4" />
      <span>All devices synced</span>
    </div>
  );
}