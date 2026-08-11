import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { GameProps } from '../../types/game';
import GameShell from '../../../shared/GameShell';
import { SoundManager } from '../../../shared/SoundManager';

const { width } = Dimensions.get('window');

interface Card {
    id: number;
    content: string;
    isFlipped: boolean;
    isMatched: boolean;
}

const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];

const MemoryEngine = ({ game, onComplete, onExit }: GameProps) => {
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [matches, setMatches] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        initializeGame();
    }, []);

    const initializeGame = () => {
        // Generate pairs based on difficulty
        // Easy: 6 pairs (12 cards)
        const pairCount = game.difficulty === 'hard' ? 8 : 6;
        const selectedEmojis = emojis.slice(0, pairCount);
        const gameCards = [...selectedEmojis, ...selectedEmojis]
            .sort(() => Math.random() - 0.5)
            .map((emoji, index) => ({
                id: index,
                content: emoji,
                isFlipped: false,
                isMatched: false,
            }));
        setCards(gameCards);
        setMatches(0);
        setFlippedIndices([]);
    };

    const handleCardPress = (index: number) => {
        if (isProcessing || cards[index].isFlipped || cards[index].isMatched) return;

        const newFlipped = [...flippedIndices, index];
        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);
        setFlippedIndices(newFlipped);

        SoundManager.play('flip');

        if (newFlipped.length === 2) {
            setIsProcessing(true);
            checkMatch(newFlipped[0], newFlipped[1], newCards);
        }
    };

    const checkMatch = (idx1: number, idx2: number, currentCards: Card[]) => {
        if (currentCards[idx1].content === currentCards[idx2].content) {
            SoundManager.play('success');
            const updatedCards = [...currentCards];
            updatedCards[idx1].isMatched = true;
            updatedCards[idx2].isMatched = true;
            setCards(updatedCards);
            setFlippedIndices([]);
            setIsProcessing(false);
            setMatches(m => {
                const newMatches = m + 1;
                if (newMatches === currentCards.length / 2) {
                    setTimeout(() => onComplete(100), 500);
                }
                return newMatches;
            });
        } else {
            setTimeout(() => {
                const resetCards = [...currentCards];
                resetCards[idx1].isFlipped = false;
                resetCards[idx2].isFlipped = false;
                setCards(resetCards);
                setFlippedIndices([]);
                setIsProcessing(false);
            }, 1000);
        }
    };

    return (
        <GameShell
            game={game}
            progress={matches / (cards.length / 2 || 1)}
            onExit={onExit}
        >
            <View style={styles.grid}>
                {cards.map((card, index) => (
                    <TouchableOpacity
                        key={card.id}
                        style={[
                            styles.card,
                            card.isFlipped || card.isMatched ? styles.cardFlipped : styles.cardBack
                        ]}
                        onPress={() => handleCardPress(index)}
                    >
                        <Text style={styles.cardContent}>
                            {card.isFlipped || card.isMatched ? card.content : '?'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </GameShell>
    );
};

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        width: width - 40,
    },
    card: {
        width: (width - 80) / 3, // 3 columns
        height: 100,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
    },
    cardBack: {
        backgroundColor: '#FF6B6B',
    },
    cardFlipped: {
        backgroundColor: '#FFF',
        borderWidth: 2,
        borderColor: '#4ECDC4',
    },
    cardContent: {
        fontSize: 32,
        color: '#fff',
    },
});

export default MemoryEngine;
