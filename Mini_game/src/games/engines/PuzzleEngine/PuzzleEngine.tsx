import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GameProps } from '../../types/game';
import GameShell from '../../../shared/GameShell';

const PuzzleEngine = ({ game, onComplete, onExit }: GameProps) => {
    const [isSolved, setIsSolved] = useState(false);

    return (
        <GameShell game={game} progress={isSolved ? 1 : 0} onExit={onExit}>
            <View style={styles.container}>
                <Text style={styles.title}>Puzzle Engine</Text>
                <Text style={styles.subtitle}>Coming Soon!</Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                        setIsSolved(true);
                        onComplete(50);
                    }}
                >
                    <Text style={styles.buttonText}>Simulate Win</Text>
                </TouchableOpacity>
            </View>
        </GameShell>
    );
};

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold' },
    subtitle: { fontSize: 16, color: '#666', marginTop: 10 },
    button: { marginTop: 20, backgroundColor: '#333', padding: 10, borderRadius: 5 },
    buttonText: { color: 'white' },
});

export default PuzzleEngine;
