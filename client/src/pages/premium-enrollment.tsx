import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Check, ArrowLeft, Calendar, Trophy, Gamepad2, Star, Zap, type LucideIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const plans = [
  {
    id: "monthly",
    name: "Monthly Premium",
    price: 4.99,
    period: "month",
    popular: false,
    priceId: "price_monthly"
  },
  {
    id: "quarterly",
    name: "Quarterly Premium", 
    price: 12.99,
    period: "3 months",
    popular: true,
    savings: "Save 13%",
    priceId: "price_quarterly"
  },
  {
    id: "yearly",
    name: "Yearly Premium",
    price: 39.99,
    period: "year",
    popular: false,
    savings: "Save 33%",
    priceId: "price_yearly"
  }
];

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

interface SubscriptionStatus {
  status: string;
  plan: string;
  nextBillingDate?: string;
}

const features: Feature[] = [
  {
    icon: Calendar,
    title: "Recurring Reward Creation",
    description: "Automatically generate Daily, Weekly, Monthly, and Yearly rewards for consistent motivation",
    color: "text-mint"
  },
  {
    icon: Trophy,
    title: "Weekend Challenge Rewards",
    description: "Special weekend challenges with bonus rewards to keep kids engaged",
    color: "text-sky"
  },
  {
    icon: Gamepad2,
    title: "Mini Games (Coming Soon)",
    description: "Educational mini-games to make habit building even more fun and interactive",
    color: "text-coral"
  },
  {
    icon: Star,
    title: "Priority Support",
    description: "Get premium customer support and early access to new features",
    color: "text-turquoise"
  }
];

export default function PremiumEnrollment() {
  const [selectedPlan, setSelectedPlan] = useState("quarterly");
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const { data: subscriptionStatus } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription/status"],
    enabled: !!user,
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest("POST", "/api/subscription/create", { planId });
      return response.json();
    },
    onSuccess: async (data) => {
      console.log('Subscription created:', data);
      if (data.clientSecret) {
        const stripe = await stripePromise;
        if (!stripe) {
          throw new Error('Stripe failed to load');
        }

        // Redirect to Stripe Checkout with the paymentIntentId in the URL
        const result = await stripe.confirmPayment({
          clientSecret: data.clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/premium-success?payment_intent_id=${data.paymentIntentId}`,
          },
        });

        if (result.error) {
          toast({
            title: "Payment Failed",
            description: result.error.message,
            variant: "destructive",
          });
        }
      } else {
        console.error('No client secret received:', data);
        toast({
          title: "Subscription Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
      }
      setProcessingPlan(null);
    },
    onError: (error: any) => {
      console.error("Subscription creation failed:", error);
      toast({
        title: "Subscription Failed",
        description: error.message || "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
      setProcessingPlan(null);
    },
  });

  const handleEnroll = async (planId: string) => {
    // Prevent multiple enrollments or enrolling in current plan
    if (processingPlan || (subscriptionStatus?.status === 'active' && subscriptionStatus?.plan === planId)) {
      if (subscriptionStatus?.status === 'active' && subscriptionStatus?.plan === planId) {
        toast({
          title: "Already Subscribed",
          description: `You already have an active ${planId} subscription.`,
          variant: "destructive",
        });
      }
      return;
    }

    setProcessingPlan(planId);
    try {
      await createSubscriptionMutation.mutateAsync(planId);
    } catch (error) {
      console.error("Enrollment failed:", error);
      setProcessingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint/10 via-sky/10 to-coral/10 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/parent" className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-center mb-4">
            <Crown className="w-12 h-12 text-coral mr-3" />
            <h1 className="font-fredoka text-4xl text-gray-800">Upgrade to Premium</h1>
          </div>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock powerful features to make habit building even more engaging and rewarding for your family
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="p-6 text-center shadow-lg hover:shadow-xl transition-shadow">
                <IconComponent className={`w-12 h-12 mx-auto mb-4 ${feature.color}`} />
                <h3 className="font-nunito font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </Card>
            );
          })}
        </div>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer relative ${
                selectedPlan === plan.id 
                  ? 'ring-4 ring-coral/50 shadow-2xl' 
                  : plan.popular 
                    ? 'ring-2 ring-sky/30' 
                    : ''
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-sky text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}
              
              {plan.savings && (
                <div className="absolute -top-2 -right-2">
                  <div className="bg-coral text-white px-3 py-1 rounded-full text-xs font-bold">
                    {plan.savings}
                  </div>
                </div>
              )}

              <div className="text-center">
                <h3 className="font-fredoka text-2xl text-gray-800 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600">/{plan.period}</span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Recurring reward creation
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Weekend challenge rewards
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Mini games (upcoming)
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    Priority support
                  </div>
                </div>

                <Button
                  className={`w-full ${
                    selectedPlan === plan.id
                      ? 'bg-coral text-white hover:bg-coral/80'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEnroll(plan.id);
                  }}
                  disabled={processingPlan === plan.id}
                >
                  {processingPlan === plan.id ? (
                    <div className="flex items-center">
                      <Zap className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    `Choose ${plan.name}`
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Current Status */}
        {user && (
          <Card className="p-6 bg-gray-50">
            <div className="text-center">
              <h3 className="font-nunito font-bold text-lg mb-2">Current Plan Status</h3>
              <div className="flex items-center justify-center space-x-4">
                <div>
                  <span className="text-gray-600">Current Plan: </span>
                  <span className="font-semibold capitalize">{(user as User)?.subscriptionStatus || 'Free Trial'}</span>
                </div>
                {(user as User)?.trialEndsAt && (
                  <div>
                    <span className="text-gray-600">Trial Ends: </span>
                    <span className="font-semibold">
                      {new Date((user as User).trialEndsAt!).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}