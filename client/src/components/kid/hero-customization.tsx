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
    const avatarImages = {
      robot: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
      princess: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
      ninja: "https://images.unsplash.com/photo-1555952517-2e8e729e0b44?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
      animal: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    };
    return avatarImages[avatarType as keyof typeof avatarImages] || avatarImages.robot;
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
