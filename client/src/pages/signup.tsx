import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Signup() {
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
        {/* Back to landing button */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-fredoka text-5xl mb-4 hero-title bounce-in">
              Join the Adventure!
            </h1>
            <p className="text-white text-xl">Create your parent account</p>
          </div>

          <Card className="fun-card border-4 border-turquoise">
            <CardHeader>
              <CardTitle className="font-fredoka text-2xl text-center rainbow-text">
                👨‍👩‍👧‍👦 Parent Sign Up 👨‍👩‍👧‍👦
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="bg-turquoise/10 rounded-lg p-6 mb-6">
                  <h3 className="font-fredoka text-xl text-gray-800 mb-2">🎯 What you'll get:</h3>
                  <ul className="text-left text-gray-700 space-y-2">
                    <li>✅ Create hero profiles for your kids</li>
                    <li>✅ Set up daily habits and missions</li>
                    <li>✅ Track progress and rewards</li>
                    <li>✅ Manage screen time and controls</li>
                    <li>✅ Access to educational mini-games</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={() => window.location.href = "/api/login"}
                  className="w-full bg-turquoise hover:bg-turquoise/80 text-white font-bold py-4 text-lg"
                >
                  🚀 Sign Up with Replit 🚀
                </Button>
                
                <div className="mt-6 text-sm text-gray-600">
                  <p>Already have an account? <Link href="/login" className="text-turquoise font-bold hover:underline">Sign in here</Link></p>
                </div>
                
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                  <p className="text-yellow-800 text-sm font-semibold">
                    🛡️ Safe & Secure: Your family's data is protected with enterprise-grade security
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}