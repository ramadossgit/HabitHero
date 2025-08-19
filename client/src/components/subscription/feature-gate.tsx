import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LockIcon, CrownIcon } from 'lucide-react';
import { Link } from 'wouter';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  title?: string;
  description?: string;
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback,
  title = 'Premium Feature',
  description = 'This feature is available to premium subscribers only.'
}: FeatureGateProps) {
  const [checkingAccess, setCheckingAccess] = useState(false);

  const checkAccessMutation = useMutation({
    mutationFn: async (featureName: string) => {
      const response = await apiRequest('POST', '/api/subscription/check-feature-access', { 
        feature: featureName 
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCheckingAccess(false);
    }
  });

  // Check access when component mounts
  React.useEffect(() => {
    setCheckingAccess(true);
    checkAccessMutation.mutate(feature);
  }, [feature]);

  if (checkingAccess || checkAccessMutation.isPending) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const hasAccess = checkAccessMutation.data?.hasAccess;
  const userInfo = checkAccessMutation.data?.user;

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default premium gate UI
  return (
    <Card className="border-2 border-dashed border-coral-200 bg-gradient-to-br from-coral-50 to-sky-50">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-coral-100">
            <LockIcon className="h-6 w-6 text-coral-600" />
          </div>
        </div>
        <CardTitle className="flex items-center justify-center space-x-2">
          <CrownIcon className="h-5 w-5 text-coral-500" />
          <span>{title}</span>
        </CardTitle>
        <CardDescription className="text-gray-600">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="text-center">
        {userInfo?.status === 'trial' && (
          <div className="mb-4">
            <Badge variant="secondary" className="mb-2">
              Free Trial - {userInfo.trialDaysLeft || 0} days left
            </Badge>
            <p className="text-sm text-gray-600">
              Upgrade to unlock this feature and many more!
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link href="/subscription">
            <Button 
              className="w-full bg-gradient-to-r from-coral-500 to-sky-500 hover:from-coral-600 hover:to-sky-600 text-white"
              data-testid={`button-upgrade-${feature}`}
            >
              <CrownIcon className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          </Link>
          
          <p className="text-xs text-gray-500">
            Starting at $4.99/month • 7-day free trial
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Convenience component for habit limits
export function HabitLimitGate({ currentCount, limit, children }: { 
  currentCount: number; 
  limit: number; 
  children: React.ReactNode;
}) {
  if (currentCount < limit) {
    return <>{children}</>;
  }

  return (
    <FeatureGate
      feature="unlimited_habits"
      title="Habit Limit Reached"
      description={`Free trial users can create up to ${limit} habits. Upgrade to create unlimited habits!`}
    >
      <div></div>
    </FeatureGate>
  );
}

// Convenience component for mini-games
export function MiniGameGate({ gameId, children }: { 
  gameId: string; 
  children: React.ReactNode;
}) {
  return (
    <FeatureGate
      feature={`minigame_${gameId}`}
      title="Premium Mini-Game"
      description="This mini-game is available to premium subscribers only."
      children={children}
    />
  );
}