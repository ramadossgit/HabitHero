import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Star, LogOut, Coins } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Child } from "@shared/schema";

interface HeroHeaderProps {
  child: Child;
}

export default function HeroHeader({ child }: HeroHeaderProps) {
  const { toast } = useToast();
  const xpForCurrentLevel = child.xp || 0;
  const xpNeededForNextLevel = 1000;
  const progressPercentage = (xpForCurrentLevel / xpNeededForNextLevel) * 100;

  const handleLogout = () => {
    toast({
      title: "Logging out...",
      description: "See you next time, hero!",
    });
    window.location.href = "/api/logout";
  };

  const getAvatarImage = (avatarType: string) => {
    const avatarImages = {
      robot: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      princess: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      ninja: "https://images.unsplash.com/photo-1555952517-2e8e729e0b44?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
      animal: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
    };
    return avatarImages[avatarType as keyof typeof avatarImages] || avatarImages.robot;
  };

  return (
    <header className="hero-gradient text-white p-6 rounded-b-3xl">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <img 
              src={child.avatarUrl || getAvatarImage(child.avatarType)} 
              alt={`${child.name}'s Hero Avatar`} 
              className="w-16 h-16 rounded-full border-4 border-white avatar-glow object-cover" 
            />
            <div>
              <h1 className="font-fredoka text-2xl">{child.name || 'Hero'}</h1>
              <p className="text-white/90 font-nunito font-semibold">
                Level {child.level || 1} {(child.avatarType || 'robot').charAt(0).toUpperCase() + (child.avatarType || 'robot').slice(1)} Hero
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:text-white"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>


      </div>
    </header>
  );
}
