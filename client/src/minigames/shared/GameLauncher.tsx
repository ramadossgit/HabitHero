import React from "react";
import { View, Text } from "react-native";
import { GameConfig } from "../games/types/game";
import { gameRegistry } from "../games/registry/gameRegistry";

interface GameLauncherProps {
  gameConfig: GameConfig;
  onComplete: (score: number) => void;
  onExit: () => void;
}

// Purchase/level gating happens before this component is rendered
// (see components/kid/game-zone.tsx), so the launcher only has to
// resolve the right engine and hand over control.
const GameLauncher = ({ gameConfig, onComplete, onExit }: GameLauncherProps) => {
  const Engine = gameRegistry[gameConfig.engine];

  if (!Engine) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Error: Engine "{gameConfig.engine}" not found.</Text>
      </View>
    );
  }

  return <Engine game={gameConfig} onComplete={onComplete} onExit={onExit} />;
};

export default GameLauncher;
