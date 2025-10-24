import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crown, Lock, Star, ArrowRight, CheckCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import SubscriptionManagementCard from "./subscription-management-card";
import type { User } from "@shared/schema";

interface SubscriptionRequiredLayoutProps {
  user: User;
}

export default function SubscriptionRequiredLayout({
  user,
}: SubscriptionRequiredLayoutProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint-100 via-sky-100 to-coral-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-coral-400 to-sky-400">
              <Crown className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="font-fredoka text-4xl text-gray-800 mb-2">
            🎭 Habit Heroes Premium
          </h1>
          <p className="text-lg text-gray-600">
            Your trial has ended. Upgrade to continue your family's
            habit-building journey!
          </p>
        </div>

        {/* Trial Expired Notice */}
        <Alert className="mb-6 border-coral-200 bg-gradient-to-r from-coral-50 to-orange-50">
          <Lock className="h-5 w-5 text-coral-600" />
          <AlertDescription className="text-gray-700">
            <strong>Trial Period Ended:</strong> To continue managing your
            family's habits, rewards, and progress tracking, please upgrade to a
            Premium subscription.
          </AlertDescription>
        </Alert>

        {/* Subscription Management Card */}
        <div className="mb-8">
          <SubscriptionManagementCard />
        </div>

        {/* What You're Missing */}
        <Card className="fun-card border-4 border-sky-400 mb-8">
          <CardHeader>
            <CardTitle className="font-fredoka text-2xl text-gray-800 flex items-center">
              <Star className="w-6 h-6 text-sky-500 mr-2" />
              🚀 What You're Missing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <CheckCircle className="w-5 h-5 text-mint-500 mr-3" />
                  <span>Create and manage unlimited heroes</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <CheckCircle className="w-5 h-5 text-mint-500 mr-3" />
                  <span>Set up unlimited daily habits</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <CheckCircle className="w-5 h-5 text-mint-500 mr-3" />
                  <span>Advanced progress tracking & reports</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <CheckCircle className="w-5 h-5 text-mint-500 mr-3" />
                  <span>Custom rewards and incentives</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <CheckCircle className="w-5 h-5 text-coral-500 mr-3" />
                  <span>Voice reminders and recordings</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <CheckCircle className="w-5 h-5 text-coral-500 mr-3" />
                  <span>Parental controls & screen time</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <CheckCircle className="w-5 h-5 text-coral-500 mr-3" />
                  <span>Cross-device family sync</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <CheckCircle className="w-5 h-5 text-coral-500 mr-3" />
                  <span>Premium support & updates</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Call-to-Action */}
        <Card className="fun-card border-4 border-mint-400 text-center">
          <CardContent className="p-8">
            <h3 className="font-fredoka text-2xl text-gray-800 mb-4">
              🎯 Ready to Continue Your Journey?
            </h3>
            <p className="text-gray-600 mb-6">
              Join thousands of families building better habits together with
              Habit Heroes Premium.
            </p>
            <Link href="/subscription">
              <Button
                className="super-button text-xl px-8 py-4 font-fredoka"
                data-testid="button-upgrade-to-premium"
              >
                <Crown className="w-5 h-5 mr-2" />
                Upgrade to Premium
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              Starting at $4.99/month • Cancel anytime • 30-day money-back
              guarantee
            </p>
          </CardContent>
        </Card>

        {/* Navigation Links */}
        <div className="text-center mt-8">
          <div className="space-x-4">
            <Link href="/parent/auth?mode=login">
              <Button
                variant="ghost"
                className="text-gray-600 hover:text-gray-800"
                data-testid="link-back-to-login"
              >
                Back to Login
              </Button>
            </Link>
            <Link href="/subscription">
              <Button
                variant="ghost"
                className="text-coral-600 hover:text-coral-800"
                data-testid="link-view-plans"
              >
                View All Plans
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
