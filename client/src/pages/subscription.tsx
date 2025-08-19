import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { SUBSCRIPTION_PLANS } from '@shared/subscription-plans';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckIcon, XIcon, CrownIcon, UsersIcon, StarIcon } from 'lucide-react';

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscriptionForm = ({ planId, onSuccess }: { planId: string; onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;
    
    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/subscription?success=true',
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Welcome to Habit Heroes Premium!",
      });
      onSuccess();
    }
    
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600"
        data-testid="button-confirm-payment"
      >
        {isProcessing ? 'Processing...' : 'Confirm Payment'}
      </Button>
    </form>
  );
};

export default function SubscriptionPage() {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Fetch subscription status
  const { data: subscriptionStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/subscription/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/subscription/status');
      return response.json();
    }
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('POST', '/api/subscription/create', { planId });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    }
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/subscription/cancel');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will end at the current billing cycle.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    }
  });

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    createSubscriptionMutation.mutate(planId);
  };

  const handleCancelSubscription = () => {
    if (confirm('Are you sure you want to cancel your subscription?')) {
      cancelSubscriptionMutation.mutate();
    }
  };

  if (statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // If payment is in progress
  if (clientSecret && selectedPlan) {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-teal-50 to-coral-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Subscription</h1>
            <p className="text-gray-600">Subscribing to {plan?.name}</p>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-center">Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <SubscriptionForm 
                  planId={selectedPlan} 
                  onSuccess={() => {
                    setClientSecret(null);
                    setSelectedPlan(null);
                  }}
                />
              </Elements>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-teal-50 to-coral-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">Start with our free trial, then upgrade for the full experience</p>
          
          {subscriptionStatus && (
            <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border">
              <div className="flex items-center justify-center space-x-4">
                <Badge variant={subscriptionStatus.status === 'trial' ? 'secondary' : 'default'}>
                  {subscriptionStatus.status.charAt(0).toUpperCase() + subscriptionStatus.status.slice(1)}
                </Badge>
                <span className="text-sm text-gray-600">
                  Current Plan: {subscriptionStatus.plan}
                </span>
                {subscriptionStatus.isTrialActive && (
                  <span className="text-sm text-coral-600 font-medium">
                    {subscriptionStatus.trialDaysLeft} days left in trial
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Trial Features */}
        {subscriptionStatus?.status === 'trial' && (
          <Card className="mb-8 bg-gradient-to-r from-sky-100 to-teal-100 border-sky-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <StarIcon className="h-5 w-5 text-sky-600" />
                <span>Your Free Trial Includes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'Access to Avatar Builder',
                  'Balloon Pop mini-game',
                  'Basic habit tracking (up to 3 habits)',
                  'Limited reward points',
                  '7-day free trial period'
                ].map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <CheckIcon className="h-4 w-4 text-sky-600" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-3 gap-8">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative transform transition-all duration-200 hover:scale-105 shadow-lg border-2 ${
                plan.popular 
                  ? 'border-coral-500 shadow-coral-100' 
                  : 'border-gray-200 hover:border-sky-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-coral-500 text-white px-4 py-1">Most Popular</Badge>
                </div>
              )}
              
              {plan.badge && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="secondary">{plan.badge}</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-3">
                  {plan.id === 'family' ? (
                    <UsersIcon className="h-8 w-8 text-sky-600" />
                  ) : (
                    <CrownIcon className="h-8 w-8 text-coral-500" />
                  )}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-gray-600">
                    /{plan.interval === 'month' && plan.intervalCount === 3 ? '3 months' : plan.interval}
                  </span>
                </div>
                {plan.savings && (
                  <p className="text-sm text-coral-600 font-medium mt-1">{plan.savings}</p>
                )}
              </CardHeader>

              <CardContent className="px-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-6">
                <Button 
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={createSubscriptionMutation.isPending}
                  data-testid={`button-select-${plan.id}`}
                >
                  {createSubscriptionMutation.isPending ? 'Processing...' : 'Select Plan'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Current Subscription Actions */}
        {subscriptionStatus?.status === 'active' && (
          <div className="mt-12 text-center">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Manage Subscription</CardTitle>
                <CardDescription>
                  You're currently subscribed to {subscriptionStatus.plan}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button 
                  variant="destructive" 
                  onClick={handleCancelSubscription}
                  disabled={cancelSubscriptionMutation.isPending}
                  data-testid="button-cancel-subscription"
                >
                  {cancelSubscriptionMutation.isPending ? 'Processing...' : 'Cancel Subscription'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Upgrade Prompts for Trial Users */}
        {subscriptionStatus?.isTrialActive && subscriptionStatus?.trialDaysLeft <= 3 && (
          <div className="mt-12 text-center">
            <Card className="max-w-2xl mx-auto bg-gradient-to-r from-coral-50 to-sky-50 border-coral-200">
              <CardHeader>
                <CardTitle className="text-coral-700">Your Trial Expires Soon!</CardTitle>
                <CardDescription>
                  Only {subscriptionStatus.trialDaysLeft} days left. Unlock more levels & bigger rewards for your Hero!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Upgrade now to keep all your progress and unlock premium features.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}