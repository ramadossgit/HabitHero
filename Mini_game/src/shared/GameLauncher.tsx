import React from 'react';
import { View, Text } from 'react-native';
import { GameConfig } from '../games/types/game';
import { gameRegistry } from '../games/registry/gameRegistry';
import RewardGate from '../rewards/RewardGate';

interface GameLauncherProps {
    gameConfig: GameConfig;
    onComplete: (score: number) => void;
    onExit: () => void;
}

const GameLauncher = ({ gameConfig, onComplete, onExit }: GameLauncherProps) => {
    const Engine = gameRegistry[gameConfig.engine];

    if (!Engine) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text>Error: Engine "{gameConfig.engine}" not found.</Text>
            </View>
        );
    }

    return (
        <RewardGate
            game={gameConfig}
            onLockedAction={onExit} // Go back/exit if locked and user wants to switch context
        >
            <Engine
                game={gameConfig}
                onComplete={onComplete}
                onExit={onExit}
            />
        </RewardGate>
    );
};

export default GameLauncher;
