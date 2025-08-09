import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Users } from "lucide-react";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);

  const handleParentLogin = () => {
    setIsLoading(true);
    window.location.href = "/api/login";
  };

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
              Parent Login
            </h1>
            <p className="text-white text-xl">Access your family dashboard</p>
          </div>

          <Card className="fun-card border-4 border-turquoise">
            <CardHeader>
              <CardTitle className="font-fredoka text-2xl text-center rainbow-text">
                👨‍👩‍👧‍👦 Parent Dashboard Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center mb-4">
                <div className="mx-auto w-20 h-20 bg-turquoise rounded-full flex items-center justify-center mb-4 magic-glow">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <p className="text-gray-600 text-sm">Manage your children's habits, progress, and rewards</p>
              </div>
              
              <Button 
                onClick={handleParentLogin}
                disabled={isLoading}
                className="w-full bg-turquoise hover:bg-turquoise/80 text-white font-bold py-4 text-lg"
              >
                {isLoading ? "Signing in..." : "Sign in with Replit"}
              </Button>
              
              <div className="text-center text-sm text-gray-600">
                <p>New parent? <Link href="/parent/signup" className="text-turquoise font-bold hover:underline">Create an account</Link></p>
              </div>

              <div className="border-t pt-4 text-center">
                <p className="text-gray-500 text-sm mb-2">Looking for kids login?</p>
                <Link href="/kids-login">
                  <Button variant="outline" className="text-coral border-coral hover:bg-coral hover:text-white">
                    Kids Play Here
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}