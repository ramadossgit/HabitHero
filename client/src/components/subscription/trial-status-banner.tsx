import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Crown, Sparkles, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";

export default function TrialStatusBanner() {
  const [, setLocation] = useLocation();
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  if (!user) return null;

  const trialEndDate = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const now = new Date();
  const isTrialActive = user.subscriptionStatus === 'trial';
  const isPremium = user.subscriptionStatus === 'active';
  
  // Calculate days remaining in trial
  const daysRemaining = trialEndDate ? Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

  if (isPremium) {
    return (
      <Card className="fun-card border-4 border-coral bg-gradient-to-r from-coral/10 to-sky/10 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-coral rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-fredoka text-lg text-gray-800">Premium Member</h3>
                  <Badge className="bg-coral text-white">ACTIVE</Badge>
                </div>
                <p className="text-gray-600 text-sm">
                  Plan: {user.subscriptionPlan === 'monthly' ? 'Monthly ($4.99/mo)' : 
                         user.subscriptionPlan === 'quarterly' ? 'Quarterly ($12.99/quarter)' : 
                         user.subscriptionPlan === 'yearly' ? 'Yearly ($39.99/year)' : 'Premium'}
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setLocation("/subscription")}
              className="bg-coral hover:bg-coral/80 text-white"
            >
              Manage Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isTrialActive && daysRemaining > 0) {
    return (
      <Card className="fun-card border-4 border-mint bg-gradient-to-r from-mint/10 to-sky/10 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-mint rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-fredoka text-lg text-gray-800">Free Trial Active</h3>
                  <Badge className="bg-mint text-white">{daysRemaining} DAYS LEFT</Badge>
                </div>
                <p className="text-gray-600 text-sm">
                  Enjoying the adventure? Upgrade to Premium for unlimited features!
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline"
                onClick={() => setLocation("/subscription")}
                className="border-mint text-mint hover:bg-mint hover:text-white"
              >
                View Plans
              </Button>
              <Button 
                onClick={() => setLocation("/subscription")}
                className="bg-coral hover:bg-coral/80 text-white"
              >
                Upgrade Now <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isTrialActive && daysRemaining === 0) {
    return (
      <Card className="fun-card border-4 border-orange-500 bg-gradient-to-r from-orange-500/10 to-coral/10 mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-fredoka text-lg text-gray-800">Trial Expired</h3>
                  <Badge className="bg-orange-500 text-white">UPGRADE REQUIRED</Badge>
                </div>
                <p className="text-gray-600 text-sm">
                  Your free trial has ended. Upgrade to Premium to continue your hero journey!
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setLocation("/subscription")}
              className="bg-coral hover:bg-coral/80 text-white"
            >
              Upgrade Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}