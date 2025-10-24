import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Crown,
  Zap,
  Star,
  Coins,
  Lock,
  ShoppingBag,
  Sword,
  Gem,
  Eye,
} from "lucide-react";
import type { Child, GearShopItem } from "@shared/schema";

interface GearShopProps {
  child: Child;
}

export default function GearShop({ child }: GearShopProps) {
  const { toast } = useToast();
  const [selectedGearType, setSelectedGearType] = useState<string>("all");

  const { data: gearItems, isLoading } = useQuery({
    queryKey: ["/api/gear-shop"],
  });

  const purchaseGearMutation = useMutation({
    mutationFn: async ({ gearId, cost }: { gearId: string; cost: number }) => {
      await apiRequest("POST", `/api/children/${child.id}/purchase-gear`, {
        gearId,
        cost,
      });
    },
    onSuccess: () => {
      toast({
        title: "Gear Purchased! ⚔️",
        description: "Your new gear has been equipped!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/children", child.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/child"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gear-shop"] });
    },
    onError: (error) => {
      toast({
        title: "Purchase failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Default gear items if none exist in database
  const defaultGearItems: GearShopItem[] = [
    {
      id: "knight-helmet",
      name: "Knight's Helmet",
      gearType: "helmet",
      description: "A shining helmet that boosts courage",
      cost: 25,
      rarity: "common",
      effect: "+5 Courage",
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: "magic-armor",
      name: "Magic Armor",
      gearType: "armor",
      description: "Enchanted armor that protects from harm",
      cost: 40,
      rarity: "rare",
      effect: "+10 Defense",
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: "hero-sword",
      name: "Hero's Sword",
      gearType: "weapon",
      description: "A legendary blade for true heroes",
      cost: 60,
      rarity: "epic",
      effect: "+15 Strength",
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: "wisdom-ring",
      name: "Ring of Wisdom",
      gearType: "accessory",
      description: "A mystical ring that enhances learning",
      cost: 30,
      rarity: "rare",
      effect: "+8 Wisdom",
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: "dragon-scale-armor",
      name: "Dragon Scale Armor",
      gearType: "armor",
      description: "Ultra-rare armor made from dragon scales",
      cost: 100,
      rarity: "legendary",
      effect: "+25 Defense",
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: "crystal-crown",
      name: "Crystal Crown",
      gearType: "helmet",
      description: "A magnificent crown fit for a hero king",
      cost: 80,
      rarity: "epic",
      effect: "+20 Leadership",
      isActive: true,
      createdAt: new Date(),
    },
  ];

  const gearItemsArray =
    Array.isArray(gearItems) && gearItems.length > 0
      ? gearItems
      : defaultGearItems;
  const unlockedGear = (child.unlockedGear as string[]) || [];

  const filteredGear =
    selectedGearType === "all"
      ? gearItemsArray
      : gearItemsArray.filter((item) => item.gearType === selectedGearType);

  const getGearTypeIcon = (gearType: string) => {
    const icons = {
      helmet: Crown,
      armor: Shield,
      weapon: Sword,
      accessory: Gem,
    };
    return icons[gearType as keyof typeof icons] || Star;
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: "text-gray-600 bg-gray-100 border-gray-200",
      rare: "text-blue-600 bg-blue-100 border-blue-200",
      epic: "text-purple-600 bg-purple-100 border-purple-200",
      legendary: "text-yellow-600 bg-yellow-100 border-yellow-200",
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const getRarityBadgeColor = (rarity: string) => {
    const colors = {
      common: "bg-gray-500",
      rare: "bg-blue-500",
      epic: "bg-purple-500",
      legendary: "bg-yellow-500",
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const handlePurchase = (item: GearShopItem) => {
    purchaseGearMutation.mutate({ gearId: item.id, cost: item.cost });
  };

  const gearTypes = [
    { id: "all", name: "All Gear", icon: Eye },
    { id: "helmet", name: "Helmets", icon: Crown },
    { id: "armor", name: "Armor", icon: Shield },
    { id: "weapon", name: "Weapons", icon: Sword },
    { id: "accessory", name: "Accessories", icon: Gem },
  ];

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ShoppingBag className="w-6 h-6 text-orange-500" />
          <h3 className="font-fredoka text-xl text-gray-800">Gear Shop</h3>
        </div>
        <div className="flex items-center space-x-2 bg-yellow-100 rounded-full px-3 py-1">
          <Coins className="w-4 h-4 text-yellow-600" />
          <span className="font-nunito font-bold text-yellow-700">
            {child.rewardPoints || 0} points
          </span>
        </div>
      </div>

      {/* Gear Type Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {gearTypes.map((type) => {
          const IconComponent = type.icon;
          return (
            <Button
              key={type.id}
              variant={selectedGearType === type.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedGearType(type.id)}
              className={
                selectedGearType === type.id
                  ? "bg-orange hover:bg-orange-600"
                  : ""
              }
              data-testid={`filter-${type.id}`}
            >
              <IconComponent className="w-4 h-4 mr-2" />
              {type.name}
            </Button>
          );
        })}
      </div>

      {/* Gear Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGear.map((item) => {
          const IconComponent = getGearTypeIcon(item.gearType);
          const isOwned = unlockedGear.includes(item.id);
          const canAfford = (child.rewardPoints || 0) >= item.cost;

          return (
            <Card
              key={item.id}
              className={`border-2 ${getRarityColor(item.rarity)} ${isOwned ? "opacity-75" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${getRarityColor(item.rarity)}`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-nunito font-bold text-gray-800">
                        {item.name}
                      </h4>
                      <span
                        className={`text-xs px-2 py-1 rounded-full text-white ${getRarityBadgeColor(item.rarity)}`}
                      >
                        {item.rarity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {isOwned && (
                    <div className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                      OWNED
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-2">{item.description}</p>

                {item.effect && (
                  <div className="flex items-center space-x-1 mb-3">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs font-medium text-yellow-700">
                      {item.effect}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    <span className="font-nunito font-bold text-gray-800">
                      {item.cost}
                    </span>
                  </div>

                  {isOwned ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="text-green-600 border-green-200"
                      data-testid={`button-owned-${item.id}`}
                    >
                      Equipped
                    </Button>
                  ) : canAfford ? (
                    <Button
                      onClick={() => handlePurchase(item)}
                      disabled={purchaseGearMutation.isPending}
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600"
                      data-testid={`button-purchase-${item.id}`}
                    >
                      {purchaseGearMutation.isPending ? "Buying..." : "Buy"}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="text-gray-400"
                      data-testid={`button-locked-${item.id}`}
                    >
                      <Lock className="w-3 h-3 mr-1" />
                      {item.cost - (child.rewardPoints || 0)} more
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredGear.length === 0 && (
        <div className="text-center py-8">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No gear items found</p>
          <p className="text-sm text-gray-400">
            Check back later for new gear!
          </p>
        </div>
      )}
    </Card>
  );
}
