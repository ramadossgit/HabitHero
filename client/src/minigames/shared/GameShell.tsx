import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { GameConfig } from '../games/types/game';
import ProgressBar from './ProgressBar';
import Timer from './Timer';

interface GameShellProps {
    game: GameConfig;
    children: React.ReactNode;
    progress?: number;
    onExit: () => void;
    onTimeUp?: () => void;
    /** Changing this remounts the Timer, restarting the countdown.
     *  Engines with internal rounds pass their round number so the
     *  time limit applies PER ROUND — one shared countdown across a
     *  whole 15-round session ended every game at the first timeout. */
    timerKey?: string | number;
    /** Pause the countdown (e.g. during a level-complete celebration). */
    timerRunning?: boolean;
}

const GameShell = ({ game, children, progress = 0, onExit, onTimeUp, timerKey, timerRunning = true }: GameShellProps) => {
    const colors = game.themeColors || {
        primary: '#4A90E2',
        secondary: '#E3F2FD',
        background: '#F5FCFF',
        accent: '#4CAF50',
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <View style={styles.container}>
                <View style={[styles.header, { backgroundColor: colors.primary + '15' }]}>
                    <TouchableOpacity
                        onPress={onExit}
                        style={[styles.closeButton, { backgroundColor: colors.primary + '25' }]}
                    >
                        <Text style={[styles.closeText, { color: colors.primary }]}>✕</Text>
                    </TouchableOpacity>
                    <View style={styles.titleRow}>
                        <Text style={styles.icon}>{game.icon || '🎮'}</Text>
                        <Text style={[styles.title, { color: colors.primary }]} numberOfLines={1}>
                            {game.title}
                        </Text>
                    </View>
                    <Timer key={timerKey} limit={game.timeLimit} onTimeUp={onTimeUp} isRunning={timerRunning} />
                </View>

                <ProgressBar progress={progress} color={colors.accent} />

                <View style={styles.content}>
                    {children}
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        padding: 10,
        borderRadius: 16,
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        gap: 6,
    },
    icon: {
        fontSize: 22,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        marginTop: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default GameShell;
