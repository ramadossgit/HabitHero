import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crown, Calendar, CreditCard, Settings, AlertTriangle, Check, Star } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export default function SubscriptionManagementCard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/subscription/cancel");
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled. You can continue using Premium features until the end of your billing period.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  const isTrialActive = user.subscriptionStatus === 'trial';
  const isPremium = user.subscriptionStatus === 'active';
  const isCancelled = user.subscriptionStatus === 'cancelled';
  
  const trialEndDate = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const subscriptionEndDate = user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null;
  const now = new Date();
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getPlanDetails = () => {
    switch (user.subscriptionPlan) {
      case 'monthly':
        return { name: 'Premium Monthly', price: '$4.99/month', color: 'text-sky' };
      case 'quarterly':
        return { name: 'Premium Quarterly', price: '$12.99/quarter', color: 'text-coral' };
      case 'yearly':
        return { name: 'Premium Yearly', price: '$39.99/year', color: 'text-mint' };
      case 'family':
        return { name: 'Family Plan', price: '$59.99/year', color: 'text-purple' };
      default:
        return { name: 'Free Trial', price: 'Free for 7 days', color: 'text-mint' };
    }
  };

  const planDetails = getPlanDetails();

  return (
    <Card className="fun-card border-4 border-coral">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Crown className="w-6 h-6 text-coral mr-2" />
            <div>
              <CardTitle className="font-fredoka text-xl text-gray-800">
                💳 Subscription Management
              </CardTitle>
              <p className="text-gray-600 text-sm">Manage your plan and billing</p>
            </div>
          </div>
          <Button
            onClick={() => setLocation("/subscription")}
            className="bg-coral hover:bg-coral/80 text-white"
          >
            <Settings className="w-4 h-4 mr-1" />
            Manage
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Plan Status */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-gray-800">Current Plan</h4>
              {isPremium && <Badge className="bg-coral text-white">PREMIUM</Badge>}
              {isTrialActive && <Badge className="bg-mint text-white">TRIAL</Badge>}
              {isCancelled && <Badge className="bg-orange-500 text-white">CANCELLED</Badge>}
            </div>
            <span className={`font-bold ${planDetails.color}`}>
              {planDetails.name}
            </span>
          </div>
          <p className="text-gray-600 text-sm">{planDetails.price}</p>
          
          {isTrialActive && trialEndDate && (
            <div className="mt-3 flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-1" />
              Trial ends: {formatDate(trialEndDate)}
            </div>
          )}
          
          {isPremium && subscriptionEndDate && (
            <div className="mt-3 flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-1" />
              Next billing: {formatDate(subscriptionEndDate)}
            </div>
          )}
          
          {isCancelled && subscriptionEndDate && (
            <div className="mt-3 flex items-center text-sm text-orange-600">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Access ends: {formatDate(subscriptionEndDate)}
            </div>
          )}
        </div>

        {/* Plan Features */}
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-800">Current Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {isTrialActive ? (
              <>
                <div className="flex items-center text-sm text-gray-600">
                  <Check className="w-4 h-4 text-mint mr-2" />
                  1 Hero Character
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Check className="w-4 h-4 text-mint mr-2" />
                  5 Daily Habits
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Check className="w-4 h-4 text-mint mr-2" />
                  Basic Progress Tracking
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Check className="w-4 h-4 text-mint mr-2" />
                  Simple Rewards
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center text-sm text-gray-600">
                  <Check className="w-4 h-4 text-coral mr-2" />
                  Unlimited Characters
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Check className="w-4 h-4 text-coral mr-2" />
                  Unlimited Habits
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Check className="w-4 h-4 text-coral mr-2" />
                  Advanced Reports
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Check className="w-4 h-4 text-coral mr-2" />
                  Premium Rewards
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Check className="w-4 h-4 text-coral mr-2" />
                  Voice Reminders
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Check className="w-4 h-4 text-coral mr-2" />
                  Priority Support
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isTrialActive && (
            <Alert>
              <Star className="h-4 w-4" />
              <AlertDescription>
                Upgrade to Premium to unlock unlimited heroes, habits, and premium features!
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            {isTrialActive && (
              <Button 
                onClick={() => setLocation("/subscription")}
                className="flex-1 bg-coral hover:bg-coral/80 text-white"
              >
                Upgrade to Premium
              </Button>
            )}
            
            {isPremium && (
              <>
                <Button 
                  onClick={() => setLocation("/subscription")}
                  variant="outline"
                  className="flex-1 border-coral text-coral hover:bg-coral hover:text-white"
                >
                  <CreditCard className="w-4 h-4 mr-1" />
                  Change Plan
                </Button>
                
                {!isCancelled && (
                  <Button 
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    variant="outline"
                    className="flex-1 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                  >
                    {cancelMutation.isPending ? "Cancelling..." : "Cancel Plan"}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}