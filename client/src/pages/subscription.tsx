import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Crown, 
  Check, 
  ArrowLeft, 
  Star, 
  Sparkles, 
  Trophy,
  CreditCard,
  Clock,
  Calendar,
  Shield
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export default function SubscriptionPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: subscriptionStatus } = useQuery({
    queryKey: ["/api/subscription/status"],
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (planId: string) => {
      return await apiRequest("POST", "/api/subscription/create", { planId });
    },
    onSuccess: (data: any) => {
      if (data.clientSecret) {
        // Redirect to Stripe checkout
        toast({
          title: "Redirecting to Payment",
          description: "You'll be redirected to complete your subscription setup.",
        });
        // In a real app, you'd integrate Stripe checkout here
      }
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/subscription/cancel");
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled. You can continue using Premium features until the end of your billing period.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
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

  const currentUser = user as User;
  const isTrialActive = currentUser?.subscriptionStatus === 'trial';
  const isPremium = currentUser?.subscriptionStatus === 'active';
  const isCancelled = currentUser?.subscriptionStatus === 'cancelled';

  const trialEndDate = currentUser?.trialEndsAt ? new Date(currentUser.trialEndsAt) : null;
  const subscriptionEndDate = currentUser?.subscriptionEndDate ? new Date(currentUser.subscriptionEndDate) : null;
  const now = new Date();
  const daysRemaining = trialEndDate ? Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

  const plans = [
    {
      id: 'monthly',
      name: 'Premium Monthly',
      price: '$4.99',
      period: '/month',
      description: 'Perfect for trying out Premium features',
      color: 'sky',
      features: [
        'Unlimited Hero Characters',
        'Unlimited Daily Habits',
        'Advanced Progress Reports',
        'Premium Rewards & Avatars',
        'Voice Reminders',
        'Priority Support'
      ]
    },
    {
      id: 'quarterly',
      name: 'Premium Quarterly',
      price: '$12.99',
      period: '/quarter',
      description: 'Most popular - Save 35%!',
      color: 'coral',
      popular: true,
      features: [
        'Everything in Premium',
        'Save 35% vs Monthly',
        'Quarterly Family Reports',
        'Early Access to New Features',
        'Enhanced Analytics',
        'Family Challenge Mode'
      ]
    },
    {
      id: 'yearly',
      name: 'Premium Yearly',
      price: '$39.99',
      period: '/year',
      description: 'Best value - Save 60%!',
      color: 'mint',
      features: [
        'Everything in Premium',
        'Save 60% vs Monthly',
        'Exclusive Hero Avatars',
        'Family Sharing Features',
        'Custom Habit Templates',
        'Premium Support Priority'
      ]
    }
  ];

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-sunshine rounded-full float"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-purple rounded-full float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-32 w-20 h-20 bg-mint rounded-full float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-orange rounded-full float" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/parent/dashboard">
            <Button variant="ghost" className="text-white hover:bg-white/20 font-bold">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="font-fredoka text-3xl md:text-4xl text-white mb-2">
              💎 Subscription Plans
            </h1>
            <p className="text-white/80">Choose the perfect plan for your family's hero journey</p>
          </div>
          <div className="w-32"></div> {/* Spacer for alignment */}
        </div>

        {/* Current Subscription Status */}
        {currentUser && (
          <Card className="fun-card border-4 border-coral bg-white/95 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="flex items-center font-fredoka text-xl">
                <Crown className="w-6 h-6 text-coral mr-2" />
                Current Subscription Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  {isTrialActive && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className="bg-mint text-white">FREE TRIAL</Badge>
                        <span className="text-gray-800 font-bold">{daysRemaining} days remaining</span>
                      </div>
                      <p className="text-gray-600">
                        Trial ends: {trialEndDate?.toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  {isPremium && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className="bg-coral text-white">PREMIUM ACTIVE</Badge>
                        <span className="text-gray-800 font-bold">
                          {currentUser.subscriptionPlan === 'monthly' ? 'Monthly Plan' :
                           currentUser.subscriptionPlan === 'quarterly' ? 'Quarterly Plan' :
                           currentUser.subscriptionPlan === 'yearly' ? 'Yearly Plan' : 'Premium Plan'}
                        </span>
                      </div>
                      <p className="text-gray-600">
                        Next billing: {subscriptionEndDate?.toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  {isCancelled && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className="bg-orange-500 text-white">CANCELLED</Badge>
                        <span className="text-gray-800 font-bold">Access until {subscriptionEndDate?.toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-600">
                        Your premium features will remain active until the end of your billing period.
                      </p>
                    </div>
                  )}
                </div>
                
                {isPremium && !isCancelled && (
                  <Button 
                    onClick={() => cancelSubscriptionMutation.mutate()}
                    disabled={cancelSubscriptionMutation.isPending}
                    variant="outline"
                    className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                  >
                    {cancelSubscriptionMutation.isPending ? "Cancelling..." : "Cancel Plan"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={plan.id} 
              className={`fun-card border-4 ${
                plan.color === 'sky' ? 'border-sky' :
                plan.color === 'coral' ? 'border-coral' :
                plan.color === 'mint' ? 'border-mint' : 'border-sky'
              } bg-white/95 backdrop-blur-sm bounce-in relative ${plan.popular ? 'scale-105' : ''}`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-coral text-white px-4 py-1 rounded-full text-sm font-bold">
                    🌟 MOST POPULAR
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className={`mx-auto w-16 h-16 ${
                  plan.color === 'sky' ? 'bg-sky' :
                  plan.color === 'coral' ? 'bg-coral' :
                  plan.color === 'mint' ? 'bg-mint' : 'bg-sky'
                } rounded-full flex items-center justify-center mb-4`}>
                  {plan.id === 'monthly' && <Star className="w-8 h-8 text-white" />}
                  {plan.id === 'quarterly' && <Crown className="w-8 h-8 text-white" />}
                  {plan.id === 'yearly' && <Trophy className="w-8 h-8 text-white" />}
                </div>
                <CardTitle className={`font-fredoka text-2xl ${
                  plan.color === 'sky' ? 'text-sky' :
                  plan.color === 'coral' ? 'text-coral' :
                  plan.color === 'mint' ? 'text-mint' : 'text-sky'
                }`}>
                  {plan.name}
                </CardTitle>
                <div className="text-3xl font-bold text-gray-800">{plan.price}</div>
                <div className="text-sm text-gray-600">{plan.period}</div>
                <div className="text-xs text-mint font-semibold">{plan.description}</div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-700">
                      <Check className={`w-4 h-4 ${
                        plan.color === 'sky' ? 'text-sky' :
                        plan.color === 'coral' ? 'text-coral' :
                        plan.color === 'mint' ? 'text-mint' : 'text-sky'
                      } mr-2`} />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  onClick={() => createSubscriptionMutation.mutate(plan.id)}
                  disabled={createSubscriptionMutation.isPending || (isPremium && currentUser.subscriptionPlan === plan.id)}
                  className={`w-full ${
                    plan.color === 'sky' ? 'bg-sky hover:bg-sky/80' :
                    plan.color === 'coral' ? 'bg-coral hover:bg-coral/80' :
                    plan.color === 'mint' ? 'bg-mint hover:bg-mint/80' : 'bg-sky hover:bg-sky/80'
                  } text-white`}
                >
                  {createSubscriptionMutation.isPending ? "Processing..." : 
                   isPremium && currentUser.subscriptionPlan === plan.id ? "Current Plan" :
                   isTrialActive ? "Upgrade Now" : "Subscribe"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <Card className="fun-card border-4 border-sky bg-white/95 backdrop-blur-sm mt-12 max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="font-fredoka text-2xl text-center text-gray-800">
              ❓ Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-bold text-gray-800 mb-2">Can I cancel anytime?</h4>
              <p className="text-gray-600">Yes! You can cancel your subscription at any time. You'll continue to have access to Premium features until the end of your billing period.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-2">What happens after my trial ends?</h4>
              <p className="text-gray-600">Your 7-day trial includes full access to Premium features. After the trial, you can choose to upgrade to a paid plan or continue with limited free features.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-2">Do you offer family discounts?</h4>
              <p className="text-gray-600">Yes! Our yearly plan includes family sharing features that allow multiple children to use the app under one subscription.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-2">Is my payment information secure?</h4>
              <p className="text-gray-600 flex items-center">
                <Shield className="w-4 h-4 text-mint mr-2" />
                Absolutely! We use industry-standard encryption and secure payment processing to protect your information.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}