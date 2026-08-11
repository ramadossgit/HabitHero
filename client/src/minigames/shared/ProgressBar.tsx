import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface ProgressBarProps {
    progress: number; // 0 to 1
    color?: string;
}

const ProgressBar = ({ progress, color = '#4CAF50' }: ProgressBarProps) => {
    const clampedProgress = Math.max(0, Math.min(1, progress));

    return (
        <View style={styles.container}>
            <View
                style={[
                    styles.fill,
                    {
                        width: `${clampedProgress * 100}%`,
                        backgroundColor: color
                    }
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 10,
        width: '100%',
        backgroundColor: '#e0e0e0',
        borderRadius: 5,
        overflow: 'hidden',
        marginVertical: 10,
    },
    fill: {
        height: '100%',
        borderRadius: 5,
    },
});

export default ProgressBar;
