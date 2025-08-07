import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { ArrowLeft, Users, User } from "lucide-react";

export default function Login() {
  const [parentEmail, setParentEmail] = useState("");
  const [parentPassword, setParentPassword] = useState("");
  const [childUsername, setChildUsername] = useState("");
  const [childPin, setChildPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleParentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Use Replit auth for parents
      window.location.href = "/api/login";
    } catch (error) {
      console.error("Parent login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChildLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/child-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: childUsername,
          pin: childPin,
        }),
      });

      if (response.ok) {
        // Redirect to kids page after successful login
        window.location.href = "/kids";
      } else {
        const error = await response.json();
        alert(error.message || "Login failed. Please check your username and PIN.");
      }
    } catch (error) {
      console.error("Child login error:", error);
      alert("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
              Welcome Back!
            </h1>
            <p className="text-white text-xl">Choose your login type</p>
          </div>

          <Card className="fun-card border-4 border-turquoise">
            <CardHeader>
              <CardTitle className="font-fredoka text-2xl text-center rainbow-text">
                🎮 Login to Habit Heroes 🎮
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="parent" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="parent" className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Parent</span>
                  </TabsTrigger>
                  <TabsTrigger value="child" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Kid</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="parent" className="space-y-4 mt-6">
                  <div className="text-center mb-4">
                    <h3 className="font-fredoka text-xl text-gray-800">👨‍👩‍👧‍👦 Parent Login</h3>
                    <p className="text-gray-600 text-sm">Manage your children's habits and progress</p>
                  </div>
                  
                  <Button 
                    onClick={() => window.location.href = "/api/login"}
                    disabled={isLoading}
                    className="w-full bg-turquoise hover:bg-turquoise/80 text-white font-bold py-3"
                  >
                    {isLoading ? "Signing in..." : "🔐 Sign in with Replit"}
                  </Button>
                  
                  <div className="text-center text-sm text-gray-600">
                    <p>New parent? <Link href="/signup" className="text-turquoise font-bold hover:underline">Create an account</Link></p>
                  </div>
                </TabsContent>
                
                <TabsContent value="child" className="space-y-4 mt-6">
                  <div className="text-center mb-4">
                    <h3 className="font-fredoka text-xl text-gray-800">🦸 Kid Login</h3>
                    <p className="text-gray-600 text-sm">Access your hero adventures and missions</p>
                  </div>
                  
                  <form onSubmit={handleChildLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="childUsername" className="text-gray-700 font-bold">Hero Name</Label>
                      <Input
                        id="childUsername"
                        type="text"
                        placeholder="Enter your hero name"
                        value={childUsername}
                        onChange={(e) => setChildUsername(e.target.value)}
                        className="border-2 border-turquoise/30 focus:border-turquoise"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="childPin" className="text-gray-700 font-bold">Secret PIN</Label>
                      <Input
                        id="childPin"
                        type="password"
                        placeholder="Enter your 4-digit PIN"
                        value={childPin}
                        onChange={(e) => setChildPin(e.target.value)}
                        className="border-2 border-turquoise/30 focus:border-turquoise"
                        maxLength={4}
                        pattern="[0-9]{4}"
                        required
                      />
                    </div>
                    <Button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-coral hover:bg-coral/80 text-white font-bold py-3"
                    >
                      {isLoading ? "Logging in..." : "🚀 Start Adventure!"}
                    </Button>
                  </form>
                  
                  <div className="text-center text-sm text-gray-600">
                    <p>Ask your parent to help set up your hero account!</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}