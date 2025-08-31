import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  Star, 
  Trophy, 
  Heart, 
  Gamepad2, 
  Users, 
  Shield,
} from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden flex flex-col">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-sunshine rounded-full float"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-purple rounded-full float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-32 w-20 h-20 bg-mint rounded-full float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-orange rounded-full float" style={{ animationDelay: '0.5s' }}></div>
      </div>
      
      <div className="container mx-auto px-4 py-6 relative z-10 flex-1 flex flex-col justify-center">
        {/* Header with amazing title - More compact */}
        <div className="text-center mb-8">
          <div className="bounce-in">
            <h1 className="font-fredoka text-3xl sm:text-5xl md:text-7xl mb-4 hero-title">
              Habit Heroes
            </h1>
            <div className="inline-block p-2 sm:p-3 magic-gradient rounded-full mb-4 sm:mb-6">
              <p className="text-base sm:text-lg md:text-xl text-white font-bold px-2 sm:px-3">
                🚀 Transform habits into epic adventures! 🌟
              </p>
            </div>
          </div>
        </div>

        {/* Key Features - Compact Icons */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-8 max-w-4xl mx-auto">
          <div className="text-center bounce-in">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-coral rounded-full flex items-center justify-center mb-2 mx-auto magic-glow float">
              <Star className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <p className="text-white font-bold text-xs sm:text-sm">Hero Avatars</p>
          </div>
          
          <div className="text-center bounce-in" style={{ animationDelay: '0.1s' }}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-turquoise rounded-full flex items-center justify-center mb-2 mx-auto magic-glow float" style={{ animationDelay: '0.5s' }}>
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <p className="text-white font-bold text-xs sm:text-sm">XP & Rewards</p>
          </div>
          
          <div className="text-center bounce-in" style={{ animationDelay: '0.2s' }}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-sky rounded-full flex items-center justify-center mb-2 mx-auto magic-glow float" style={{ animationDelay: '1s' }}>
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <p className="text-white font-bold text-xs sm:text-sm">Daily Missions</p>
          </div>
          
          <div className="text-center bounce-in" style={{ animationDelay: '0.3s' }}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-mint rounded-full flex items-center justify-center mb-2 mx-auto magic-glow float" style={{ animationDelay: '1.5s' }}>
              <Gamepad2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <p className="text-white font-bold text-xs sm:text-sm">Mini-Games</p>
          </div>
          
          <div className="text-center bounce-in" style={{ animationDelay: '0.4s' }}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange rounded-full flex items-center justify-center mb-2 mx-auto magic-glow float" style={{ animationDelay: '2s' }}>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <p className="text-white font-bold text-xs sm:text-sm">Parent Control</p>
          </div>
          
          <div className="text-center bounce-in" style={{ animationDelay: '0.5s' }}>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple rounded-full flex items-center justify-center mb-2 mx-auto magic-glow float" style={{ animationDelay: '2.5s' }}>
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <p className="text-white font-bold text-xs sm:text-sm">Safe & Secure</p>
          </div>
        </div>

        {/* Main Action Buttons */}
        <div className="text-center mb-6">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-2xl mx-auto">
              <Button 
                className="super-button text-lg sm:text-xl px-6 sm:px-8 py-4 sm:py-5 wiggle text-white font-bold flex-1 sm:flex-none"
                style={{ color: 'white' }}
                onClick={() => setLocation("/kids-login")}
                data-testid="kids-play-button"
              >
                🎮 Kids Play Here! ⚡
              </Button>
              <Button 
                className="super-button text-lg sm:text-xl px-6 sm:px-8 py-4 sm:py-5 wiggle text-white font-bold flex-1 sm:flex-none"
                style={{ color: 'white' }}
                onClick={() => setLocation("/parent/auth?mode=login")}
                data-testid="parents-manage-button"
              >
                👨‍👩‍👧‍👦 Parents Manage Here! 
              </Button>
            </div>
            <div className="text-white text-base sm:text-lg">
              <span>New family? </span>
              <Button 
                className="super-button font-bold ml-2 text-base sm:text-lg px-4 py-2"
                onClick={() => setLocation("/parent/auth?mode=register")}
                data-testid="sign-up-button"
              >
                🚀 Start Free Trial
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Value Proposition */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="fun-card bg-white/90 backdrop-blur-sm p-4 sm:p-6 bounce-in" style={{ animationDelay: '0.6s' }}>
            <h2 className="font-fredoka text-xl sm:text-2xl md:text-3xl rainbow-text mb-3">
              🎉 Join 10,000+ Families Making Habits Fun! 🎉
            </h2>
            <p className="text-gray-700 text-sm sm:text-base font-semibold mb-4">
              Transform boring chores into epic quests! 🦸‍♀️ Create heroes, earn XP, unlock rewards, and level up together! 
              <br className="hidden sm:block" />
              <span className="inline-block mt-1">
                <strong className="text-coral">Free 7-day trial</strong> • No credit card required • Cancel anytime
              </span>
            </p>
            <div className="flex justify-center space-x-2 text-2xl sm:text-3xl">
              <span className="float">🤖</span>
              <span className="float" style={{ animationDelay: '0.5s' }}>👸</span>
              <span className="float" style={{ animationDelay: '1s' }}>🥷</span>
              <span className="float" style={{ animationDelay: '1.5s' }}>🦄</span>
              <span className="float" style={{ animationDelay: '2s' }}>🐉</span>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-6 text-center">
          <div className="flex justify-center items-center space-x-4 text-white/80 text-sm">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              <span>COPPA Compliant</span>
            </div>
            <div className="hidden sm:block">•</div>
            <div className="flex items-center">
              <Star className="w-4 h-4 mr-1" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="hidden sm:block">•</div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <span>10K+ Families</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}