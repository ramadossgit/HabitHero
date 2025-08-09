import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  Star, 
  Trophy, 
  Heart, 
  Gamepad2, 
  Users, 
  Shield 
} from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();
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
        {/* Header with amazing title */}
        <div className="text-center mb-16">
          <div className="bounce-in">
            <h1 className="font-fredoka text-8xl mb-6 hero-title">
              Habit Heroes
            </h1>
            <div className="inline-block p-4 magic-gradient rounded-full mb-8">
              <p className="text-2xl text-white font-bold px-4">
                🚀 Transform daily habits into EPIC adventures! 🌟
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="super-button text-2xl px-12 py-6 wiggle text-white font-bold"
                style={{ color: 'white' }}
                onClick={() => setLocation("/kids-login")}
              >
                🎮 Kids Play Here! ⚡
              </Button>
              <Button 
                className="super-button text-2xl px-12 py-6 wiggle text-white font-bold"
                style={{ color: 'white' }}
                onClick={() => setLocation("/parent")}
              >
                👨‍👩‍👧‍👦 Parents Manage Here! 
              </Button>
            </div>
            <div className="text-white text-lg text-center">
              <span>New family? </span>
              <Button 
                variant="outline" 
                className="text-white border-white hover:bg-white hover:text-gray-800 font-bold"
                onClick={() => setLocation("/parent/signup")}
              >
                Sign Up Here
              </Button>
            </div>
          </div>
        </div>

        {/* Amazing Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="fun-card bounce-in">
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-coral rounded-full flex items-center justify-center mb-4 magic-glow float">
                <Star className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="font-fredoka text-3xl rainbow-text">
                🦸 Hero Avatars
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-center text-lg font-semibold">
                Create AMAZING hero characters - robots, princesses, ninjas, and magical animals! 🤖👸🥷🦄
              </p>
            </CardContent>
          </div>

          <div className="fun-card bounce-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-turquoise rounded-full flex items-center justify-center mb-4 magic-glow float" style={{ animationDelay: '1s' }}>
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="font-fredoka text-3xl rainbow-text">
                🏆 XP & Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-center text-lg font-semibold">
                Earn XP, level up, and unlock AMAZING rewards! Level 100 heroes get the coolest gear! ⚡💎
              </p>
            </CardContent>
          </div>

          <div className="fun-card bounce-in" style={{ animationDelay: '0.4s' }}>
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-sky rounded-full flex items-center justify-center mb-4 magic-glow float" style={{ animationDelay: '2s' }}>
                <Heart className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="font-fredoka text-3xl rainbow-text">
                🎯 Daily Missions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-center text-lg font-semibold">
                Turn boring tasks into EPIC hero missions! Brush teeth = Defeat Cavity Dragon! 🐉✨
              </p>
            </CardContent>
          </div>

          <div className="fun-card bounce-in" style={{ animationDelay: '0.6s' }}>
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-mint rounded-full flex items-center justify-center mb-4 magic-glow float">
                <Gamepad2 className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="font-fredoka text-3xl rainbow-text">
                🎮 Mini-Games
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-center text-lg font-semibold">
                Unlock super fun games as rewards! Racing, puzzles, adventures - all yours to play! 🚀🎨
              </p>
            </CardContent>
          </div>

          <div className="fun-card bounce-in" style={{ animationDelay: '0.8s' }}>
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-orange rounded-full flex items-center justify-center mb-4 magic-glow float" style={{ animationDelay: '0.5s' }}>
                <Users className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="font-fredoka text-3xl rainbow-text">
                👨‍👩‍👧‍👦 Parent Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-center text-lg font-semibold">
                Parents can track progress, set rewards, and celebrate victories together! 📊🎉
              </p>
            </CardContent>
          </div>

          <div className="fun-card bounce-in" style={{ animationDelay: '1s' }}>
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-purple rounded-full flex items-center justify-center mb-4 magic-glow float" style={{ animationDelay: '1.5s' }}>
                <Shield className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="font-fredoka text-3xl rainbow-text">
                🛡️ Safe & Secure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-center text-lg font-semibold">
                Super safe for kids with parental controls and secure data protection! 🔒👨‍👩‍👧‍👦
              </p>
            </CardContent>
          </div>
        </div>

        {/* Epic Call to Action */}
        <div className="text-center">
          <div className="fun-card max-w-4xl mx-auto bounce-in" style={{ animationDelay: '1.2s' }}>
            <CardContent className="p-12">
              <h2 className="font-fredoka text-5xl rainbow-text mb-6">
                🎉 Ready for the ULTIMATE Adventure? 🎉
              </h2>
              <p className="text-gray-700 mb-8 text-xl font-bold">
                Join thousands of young heroes making habits FUN! 🌟 
                <br />
                Your epic journey starts NOW! 💫
              </p>
              <Button 
                className="super-button text-3xl px-16 py-8 mb-4 wiggle"
                onClick={() => window.location.href = "/api/login"}
              >
                🚀 CREATE YOUR HERO! 🦸‍♀️
              </Button>
              <div className="mt-6 flex justify-center space-x-4 text-4xl">
                <span className="float">🤖</span>
                <span className="float" style={{ animationDelay: '0.5s' }}>👸</span>
                <span className="float" style={{ animationDelay: '1s' }}>🥷</span>
                <span className="float" style={{ animationDelay: '1.5s' }}>🦄</span>
                <span className="float" style={{ animationDelay: '2s' }}>🐉</span>
              </div>
            </CardContent>
          </div>
        </div>
      </div>
    </div>
  );
}
