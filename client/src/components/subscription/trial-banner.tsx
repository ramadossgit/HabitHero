import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CrownIcon, ClockIcon } from 'lucide-react';
import { Link } from 'wouter';

export function TrialBanner() {
  const { data: subscriptionStatus } = useQuery({
    queryKey: ['/api/subscription/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/subscription/status');
      return response.json();
    }
  });

  // Don't show banner if user has active subscription
  if (!subscriptionStatus?.isTrialActive || subscriptionStatus.status === 'active') {
    return null;
  }

  const isAlmostExpired = subscriptionStatus.trialDaysLeft <= 3;

  return (
    <Card className={`mb-6 ${
      isAlmostExpired 
        ? 'bg-gradient-to-r from-coral-50 to-orange-50 border-coral-200' 
        : 'bg-gradient-to-r from-sky-50 to-teal-50 border-sky-200'
    }`}>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${
            isAlmostExpired ? 'bg-coral-100' : 'bg-sky-100'
          }`}>
            {isAlmostExpired ? (
              <ClockIcon className="h-5 w-5 text-coral-600" />
            ) : (
              <CrownIcon className="h-5 w-5 text-sky-600" />
            )}
          </div>
          
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Badge variant={isAlmostExpired ? 'destructive' : 'secondary'}>
                Free Trial
              </Badge>
              <span className={`text-sm font-medium ${
                isAlmostExpired ? 'text-coral-700' : 'text-sky-700'
              }`}>
                {subscriptionStatus.trialDaysLeft} days left
              </span>
            </div>
            
            <p className="text-sm text-gray-600">
              {isAlmostExpired 
                ? 'Your trial expires soon! Unlock more levels & bigger rewards for your Hero!'
                : 'Enjoying your free trial? Upgrade to unlock all premium features!'
              }
            </p>
          </div>
        </div>

        <Link href="/subscription">
          <Button 
            className={`${
              isAlmostExpired 
                ? 'bg-coral-500 hover:bg-coral-600' 
                : 'bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600'
            } text-white`}
            data-testid="button-upgrade-trial"
          >
            Upgrade Now
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}