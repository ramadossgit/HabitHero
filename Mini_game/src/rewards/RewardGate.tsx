import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GameConfig } from '../games/types/game';
import { useRewards } from './RewardContext';

interface RewardGateProps {
    game: GameConfig;
    children: React.ReactNode;
    onLockedAction?: () => void;
}

const RewardGate = ({ game, children, onLockedAction }: RewardGateProps) => {
    const { isGameUnlocked } = useRewards();
    const unlocked = isGameUnlocked(game.id);

    if (!unlocked) {
        return (
            <View style={styles.lockedContainer}>
                <Text style={styles.lockedIcon}>🔒</Text>
                <Text style={styles.lockedTitle}>Locked!</Text>
                <Text style={styles.lockedMessage}>
                    Complete your daily habits to unlock {game.title}.
                </Text>
                <TouchableOpacity style={styles.button} onPress={onLockedAction}>
                    <Text style={styles.buttonText}>Go to Habits</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return <>{children}</>;
};

const styles = StyleSheet.create({
    lockedContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        backgroundColor: '#f8f9fa',
    },
    lockedIcon: {
        fontSize: 60,
        marginBottom: 20,
    },
    lockedTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    lockedMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    button: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        elevation: 2,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default RewardGate;
