import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TimerProps {
    limit?: number; // seconds
    onTimeUp?: () => void;
    isRunning?: boolean;
}

const Timer = ({ limit, onTimeUp, isRunning = true }: TimerProps) => {
    const [timeLeft, setTimeLeft] = useState(limit ?? 0);

    useEffect(() => {
        if (!limit || !isRunning || timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    if (onTimeUp) onTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [limit, isRunning, timeLeft, onTimeUp]);

    if (!limit) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.text, timeLeft < 10 && styles.warning]}>
                {formatTime(timeLeft)}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#333',
        minWidth: 80,
        alignItems: 'center',
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    warning: {
        color: '#e74c3c',
    },
});

export default Timer;
