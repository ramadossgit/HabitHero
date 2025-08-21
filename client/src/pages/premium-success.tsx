import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Check, ArrowRight, Calendar, Trophy, Gamepad2, Star } from "lucide-react";
import { Link } from "wouter";

interface SubscriptionStatus {
  status: string;
  plan: string;
  nextBillingDate?: string;
}

export default function PremiumSuccess() {
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const { data: subscriptionStatus } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription/status"],
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint/10 via-sky/10 to-coral/10 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
              <Check className="w-16 h-16 text-green-600" />
            </div>
          </div>
          
          <div className="flex items-center justify-center mb-4">
            <Crown className="w-12 h-12 text-coral mr-3" />
            <h1 className="font-fredoka text-4xl text-gray-800">Welcome to Premium!</h1>
          </div>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Your subscription has been activated successfully. You now have access to all Premium features!
          </p>
        </div>

        {/* Premium Features */}
        <Card className="p-8 mb-8 shadow-lg">
          <h2 className="font-nunito font-bold text-2xl mb-6 text-center">Your Premium Features</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="bg-mint/20 p-3 rounded-lg">
                <Calendar className="w-8 h-8 text-mint" />
              </div>
              <div>
                <h3 className="font-nunito font-bold text-lg">Recurring Rewards</h3>
                <p className="text-gray-600">Create Daily, Weekly, Monthly, and Yearly rewards that automatically regenerate</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-sky/20 p-3 rounded-lg">
                <Trophy className="w-8 h-8 text-sky" />
              </div>
              <div>
                <h3 className="font-nunito font-bold text-lg">Weekend Challenges</h3>
                <p className="text-gray-600">Special weekend challenges with bonus rewards</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-coral/20 p-3 rounded-lg">
                <Gamepad2 className="w-8 h-8 text-coral" />
              </div>
              <div>
                <h3 className="font-nunito font-bold text-lg">Mini Games</h3>
                <p className="text-gray-600">Educational mini-games coming soon for enhanced engagement</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-turquoise/20 p-3 rounded-lg">
                <Star className="w-8 h-8 text-turquoise" />
              </div>
              <div>
                <h3 className="font-nunito font-bold text-lg">Priority Support</h3>
                <p className="text-gray-600">Get premium customer support and early access to new features</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Subscription Status */}
        {subscriptionStatus && (
          <Card className="p-6 mb-8 shadow-lg">
            <h3 className="font-nunito font-bold text-xl mb-4">Subscription Details</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg">
                  <span className="font-medium">Plan:</span> {subscriptionStatus.plan === 'monthly' ? 'Monthly Premium' : 
                                                              subscriptionStatus.plan === 'quarterly' ? 'Quarterly Premium' : 
                                                              'Yearly Premium'}
                </p>
                <p className="text-sm text-gray-600">
                  Status: <span className="capitalize font-medium text-green-600">{subscriptionStatus.status}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Next billing</p>
                <p className="font-medium">
                  {subscriptionStatus.nextBillingDate ? new Date(subscriptionStatus.nextBillingDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <Link href="/parent">
            <Button size="lg" className="bg-coral hover:bg-coral/90 text-white px-8">
              Start Using Premium Features
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          
          <div>
            <Link href="/parent/rewards" className="text-sky hover:text-sky/80 underline">
              Set up your first recurring reward →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}