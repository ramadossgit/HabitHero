import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Coins, Crown, Zap, Heart, Shield, Lock, Star, Sparkles } from "lucide-react";
import type { Child, AvatarShopItem } from "@shared/schema";

interface AvatarShopProps {
  child: Child;
}

export default function AvatarShop({ child }: AvatarShopProps) {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: shopItems = [], isLoading } = useQuery<AvatarShopItem[]>({
    queryKey: ["/api/avatar-shop"],
  });

  const purchaseAvatarMutation = useMutation({
    mutationFn: async ({ avatarType, cost }: { avatarType: string; cost: number }) => {
      return await apiRequest("POST", `/api/children/${child.id}/purchase-avatar`, {
        avatarType,
        cost,
      });
    },
    onSuccess: (updatedChild) => {
      toast({
        title: "Avatar Purchased! 🎉",
        description: "Your new avatar has been unlocked!",
      });
      // Invalidate all relevant queries to refresh data across the app
      queryClient.invalidateQueries({ queryKey: ["/api/auth/child"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      queryClient.invalidateQueries({ queryKey: ["/api/avatar-shop"] });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Not enough reward points!",
        variant: "destructive",
      });
    },
  });

  const getAvatarImage = (avatarType: string) => {
    const avatarImages = {
      robot: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
      princess: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
      ninja: "https://images.unsplash.com/photo-1555952517-2e8e729e0b44?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
      animal: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
      wizard: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
      superhero: "https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
      dragon: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    };
    return avatarImages[avatarType as keyof typeof avatarImages] || avatarImages.robot;
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: "bg-gray-500",
      rare: "bg-blue-500",
      epic: "bg-purple-500",
      legendary: "bg-yellow-500",
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const getRarityIcon = (rarity: string) => {
    const icons = {
      common: Shield,
      rare: Star,
      epic: Crown,
      legendary: Sparkles,
    };
    return icons[rarity as keyof typeof icons] || Shield;
  };

  const unlockedAvatars = child.unlockedAvatars as string[] || ["robot"];
  const rewardPoints = child.rewardPoints || 0;

  const filteredItems = shopItems.filter(item => {
    if (selectedCategory === "all") return true;
    return item.rarity === selectedCategory;
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-coral border-t-transparent mx-auto mb-4"></div>
          <p>Loading avatar shop...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reward Points Display */}
      <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Coins className="w-8 h-8" />
              <div>
                <h3 className="font-fredoka text-xl">Your Reward Points</h3>
                <p className="text-white/90">Earn points by completing habits!</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{rewardPoints}</div>
              <div className="text-sm text-white/80">Points</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="font-fredoka text-2xl">Avatar Shop</CardTitle>
          <div className="flex space-x-2 flex-wrap">
            {["all", "common", "rare", "epic", "legendary"].map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              // Check if this specific avatar is purchased by ID, not just avatar type
              const isUnlocked = unlockedAvatars.includes(item.id);
              const canAfford = rewardPoints >= item.cost;
              const RarityIcon = getRarityIcon(item.rarity);

              return (
                <Card key={item.id} className={`relative overflow-hidden transition-transform hover:scale-105 ${
                  isUnlocked ? "bg-green-50 border-green-200" : ""
                }`}>
                  <CardContent className="p-4">
                    {/* Rarity Badge */}
                    <Badge 
                      className={`absolute top-2 right-2 ${getRarityColor(item.rarity)} text-white`}
                    >
                      <RarityIcon className="w-3 h-3 mr-1" />
                      {item.rarity}
                    </Badge>

                    {/* Avatar Image */}
                    <div className="relative mb-4">
                      <img
                        src={getAvatarImage(item.avatarType)}
                        alt={item.name}
                        className={`w-24 h-24 mx-auto rounded-full border-4 object-cover ${
                          isUnlocked ? "border-green-400" : "border-gray-300"
                        }`}
                      />
                      {isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-green-500 text-white rounded-full p-2">
                            <Crown className="w-4 h-4" />
                          </div>
                        </div>
                      )}
                      {!isUnlocked && !canAfford && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                          <Lock className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Avatar Info */}
                    <div className="text-center">
                      <h4 className="font-fredoka text-lg font-bold mb-1">{item.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                      
                      <div className="flex items-center justify-center space-x-2 mb-3">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className="font-bold">{item.cost} points</span>
                      </div>

                      {isUnlocked ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Unlocked!
                        </Badge>
                      ) : (
                        <Button
                          onClick={() => purchaseAvatarMutation.mutate({ 
                            avatarType: item.avatarType, 
                            cost: item.cost 
                          })}
                          disabled={!canAfford || purchaseAvatarMutation.isPending}
                          className={`w-full ${
                            canAfford 
                              ? "bg-coral hover:bg-coral/90" 
                              : "bg-gray-300 cursor-not-allowed"
                          }`}
                        >
                          {purchaseAvatarMutation.isPending 
                            ? "Purchasing..." 
                            : canAfford 
                              ? "Purchase" 
                              : "Not Enough Points"
                          }
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No avatars found in this category.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}