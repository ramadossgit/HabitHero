import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { UserRound, Crown, Zap, Heart, Shield, Lock, ShoppingBag } from "lucide-react";
import AvatarShop from "./avatar-shop";
import GearShop from "./gear-shop";
import type { Child } from "@shared/schema";

interface HeroCustomizationProps {
  child: Child;
}

export default function HeroCustomization({ child }: HeroCustomizationProps) {
  const { toast } = useToast();
  const [selectedAvatarType, setSelectedAvatarType] = useState(child.avatarType);

  const updateChildMutation = useMutation({
    mutationFn: async (updates: Partial<Child>) => {
      await apiRequest("PATCH", `/api/children/${child.id}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Hero Updated! ✨",
        description: "Your hero looks amazing!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAvatarTypeChange = (avatarType: string) => {
    setSelectedAvatarType(avatarType);
    updateChildMutation.mutate({ avatarType });
  };

  const getAvatarImage = (avatarType: string) => {
    // Generate cartoon-style SVG avatars instead of human photos
    const avatarSvgs = {
      robot: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#4ECDC4" rx="20"/><rect x="40" y="60" width="120" height="80" fill="#2C3E50" rx="10"/><circle cx="70" cy="90" r="8" fill="#E74C3C"/><circle cx="130" cy="90" r="8" fill="#E74C3C"/><rect x="85" y="110" width="30" height="15" fill="#F39C12" rx="5"/><rect x="60" y="150" width="80" height="30" fill="#34495E" rx="5"/></svg>`)}`,
      princess: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#FFB6C1" rx="20"/><circle cx="100" cy="90" r="40" fill="#FDD5BA"/><circle cx="85" cy="80" r="3" fill="#333"/><circle cx="115" cy="80" r="3" fill="#333"/><path d="M90 95 Q100 105 110 95" stroke="#E91E63" stroke-width="2" fill="none"/><polygon points="70,50 100,30 130,50 120,70 80,70" fill="#FFD700"/><circle cx="100" cy="45" r="5" fill="#FF69B4"/></svg>`)}`,
      ninja: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#2C3E50" rx="20"/><circle cx="100" cy="100" r="50" fill="#34495E"/><rect x="60" y="70" width="80" height="30" fill="#1A252F"/><circle cx="85" cy="85" r="4" fill="#E74C3C"/><circle cx="115" cy="85" r="4" fill="#E74C3C"/><rect x="75" y="120" width="50" height="20" fill="#E67E22" rx="10"/></svg>`)}`,
      animal: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#F39C12" rx="20"/><circle cx="100" cy="110" r="45" fill="#E67E22"/><circle cx="75" cy="85" r="15" fill="#D35400"/><circle cx="125" cy="85" r="15" fill="#D35400"/><circle cx="85" cy="95" r="3" fill="#000"/><circle cx="115" cy="95" r="3" fill="#000"/><ellipse cx="100" cy="110" rx="8" ry="6" fill="#000"/><path d="M100 116 Q90 125 80 120 M100 116 Q110 125 120 120" stroke="#000" stroke-width="2" fill="none"/></svg>`)}`
    };
    return avatarSvgs[avatarType as keyof typeof avatarSvgs] || avatarSvgs.robot;
  };

  const unlockedAvatars = child.unlockedAvatars as string[] || ["robot"];
  const unlockedGear = child.unlockedGear as string[] || [];

  const availableAvatarTypes = [
    { id: "robot", name: "Robot", icon: UserRound, color: "text-coral" },
    { id: "princess", name: "Princess", icon: Crown, color: "text-purple-500" },
    { id: "ninja", name: "Ninja", icon: Zap, color: "text-gray-700" },
    { id: "animal", name: "Animal", icon: Heart, color: "text-orange-500" },
    { id: "wizard", name: "Wizard", icon: Crown, color: "text-blue-500" },
    { id: "superhero", name: "Superhero", icon: Shield, color: "text-red-500" },
  ].filter(type => unlockedAvatars.includes(type.id));

  return (
    <div className="space-y-6">
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current" className="flex items-center gap-2">
            <UserRound className="w-4 h-4" />
            Current Hero
          </TabsTrigger>
          <TabsTrigger value="shop" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Avatar Shop
          </TabsTrigger>
          <TabsTrigger value="gear" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Gear Shop
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          <Card className="p-6 shadow-lg">
            <h3 className="font-fredoka text-2xl text-gray-800 mb-6 flex items-center">
              <UserRound className="text-coral mr-3" />
              Current Hero Setup
            </h3>

            <div className="text-center mb-6">
              <img 
                src={child.avatarUrl || getAvatarImage(selectedAvatarType)} 
                alt={`${child.name}'s Hero Character`} 
                className="w-32 h-32 mx-auto rounded-full border-4 border-coral avatar-glow object-cover mb-4"
              />
              <h4 className="font-nunito font-extrabold text-lg">
                {child.name.split(' ')[0]}-{selectedAvatarType.charAt(0).toUpperCase() + selectedAvatarType.slice(1)}
              </h4>
              <p className="text-gray-600">
                {selectedAvatarType === "robot" && "Tech Specialist"}
                {selectedAvatarType === "princess" && "Royal Guardian"}
                {selectedAvatarType === "ninja" && "Shadow Warrior"}
                {selectedAvatarType === "animal" && "Nature Friend"}
                {selectedAvatarType === "wizard" && "Magic Master"}
                {selectedAvatarType === "superhero" && "Super Champion"}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h5 className="font-nunito font-bold mb-2">Choose Active Hero ({unlockedAvatars.length} purchased):</h5>
                <div className="grid grid-cols-3 gap-2">
                  {availableAvatarTypes.map((type) => {
                    const IconComponent = type.icon;
                    const isSelected = selectedAvatarType === type.id;
                    
                    return (
                      <Button
                        key={type.id}
                        variant="outline"
                        className={`p-3 h-auto flex-col space-y-1 border-2 transition-colors ${
                          isSelected 
                            ? 'border-coral bg-coral/10' 
                            : 'border-gray-200 hover:border-coral hover:bg-coral/10'
                        }`}
                        onClick={() => handleAvatarTypeChange(type.id)}
                        disabled={updateChildMutation.isPending}
                      >
                        <IconComponent className={`${type.color} w-6 h-6`} />
                        <div className="text-xs">{type.name}</div>
                      </Button>
                    );
                  })}
                </div>
                {availableAvatarTypes.length <= 1 && (
                  <p className="text-sm text-gray-500 mt-2">
                    💡 Visit the Avatar Shop to purchase more heroes!
                  </p>
                )}
              </div>

              <div>
                <h5 className="font-nunito font-bold mb-2">Purchased Gear:</h5>
                {unlockedGear.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {unlockedGear.map((gear, index) => (
                      <div key={index} className="p-3 bg-mint/10 border border-mint rounded-lg text-center">
                        <Shield className="w-6 h-6 text-mint mx-auto mb-1" />
                        <div className="text-xs">{gear}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <ShoppingBag className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No gear purchased yet</p>
                    <p className="text-xs text-gray-400 mt-1">Visit the Gear Shop to buy equipment!</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="shop">
          <AvatarShop child={child} />
        </TabsContent>

        <TabsContent value="gear">
          <GearShop child={child} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
