import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  Trophy, 
  Heart, 
  Gamepad2, 
  Users, 
  Shield 
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-coral via-turquoise to-sky">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-fredoka text-6xl text-white mb-4 hero-title">
            Habit Heroes
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Transform daily habits into epic adventures for kids!
          </p>
          <Button 
            size="lg" 
            className="bg-white text-coral hover:bg-white/90 text-xl px-8 py-4 rounded-full shadow-lg"
            onClick={() => window.location.href = "/api/login"}
          >
            Start Your Hero Journey
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-coral/20 rounded-full flex items-center justify-center mb-4">
                <Star className="w-8 h-8 text-coral" />
              </div>
              <CardTitle className="font-fredoka text-2xl text-gray-800">
                Hero Avatars
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Create and customize amazing hero characters - robots, princesses, ninjas, and magical animals!
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-turquoise/20 rounded-full flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-turquoise" />
              </div>
              <CardTitle className="font-fredoka text-2xl text-gray-800">
                XP & Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Earn experience points, level up, and unlock amazing rewards for completing daily habits!
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-sky/20 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-sky" />
              </div>
              <CardTitle className="font-fredoka text-2xl text-gray-800">
                Daily Missions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Turn everyday tasks like brushing teeth and reading into exciting hero missions!
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-mint/20 rounded-full flex items-center justify-center mb-4">
                <Gamepad2 className="w-8 h-8 text-mint" />
              </div>
              <CardTitle className="font-fredoka text-2xl text-gray-800">
                Mini-Games
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Unlock fun educational games as rewards for completing habits and maintaining streaks!
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-sunshine/20 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-orange-500" />
              </div>
              <CardTitle className="font-fredoka text-2xl text-gray-800">
                Parent Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Track progress, set custom habits, manage rewards, and celebrate your child's achievements!
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="font-fredoka text-2xl text-gray-800">
                Safe & Secure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Child-safe design with parental controls, screen time management, and secure data protection.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="font-fredoka text-3xl text-gray-800 mb-4">
                Ready to Start the Adventure?
              </h2>
              <p className="text-gray-600 mb-6">
                Join thousands of families who are making daily habits fun and rewarding!
              </p>
              <Button 
                size="lg"
                className="bg-coral hover:bg-coral/80 text-white text-xl px-8 py-4 rounded-full shadow-lg"
                onClick={() => window.location.href = "/api/login"}
              >
                Create Your Hero Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
