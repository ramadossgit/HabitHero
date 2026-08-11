import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Habit } from '../habits/habitTypes';

interface RewardContextType {
    completedHabitIds: string[];
    completeHabit: (habitId: string) => void;
    resetHabits: () => void;
    isGameUnlocked: (gameId: string) => boolean;
}

const RewardContext = createContext<RewardContextType | undefined>(undefined);

export const RewardProvider = ({ children }: { children: ReactNode }) => {
    const [completedHabitIds, setCompletedHabitIds] = useState<string[]>([]);

    // habit ID -> game ID: completing a habit unlocks the linked game
    const habitToGameMap: Record<string, string> = {
        'brush-teeth':  'hygiene-hero',
        'drink-water':  'water-tracker',
        'sleep-time':   'sleep-guardian',
        'read-book':    'word-builder',
        'exercise':     'math-runner',
        // legacy IDs kept for backwards compatibility
        'morning-brush': 'hygiene-hero',
        'bed-time':      'sleep-guardian',
    };

    const completeHabit = (habitId: string) => {
        if (!completedHabitIds.includes(habitId)) {
            setCompletedHabitIds(prev => [...prev, habitId]);
        }
    };

    const resetHabits = () => {
        setCompletedHabitIds([]);
    };

    const isGameUnlocked = (gameId: string): boolean => {
        // If no habit maps to this game, it's open by default
        // Or we can say only specific games need unlocking
        // For this architecture logic:
        // Find habits that unlock this game
        const requiredHabit = Object.keys(habitToGameMap).find(hId => habitToGameMap[hId] === gameId);

        if (!requiredHabit) return true; // No requirement
        return completedHabitIds.includes(requiredHabit);
    };

    return (
        <RewardContext.Provider value={{ completedHabitIds, completeHabit, resetHabits, isGameUnlocked }}>
            {children}
        </RewardContext.Provider>
    );
};

export const useRewards = () => {
    const context = useContext(RewardContext);
    if (!context) {
        throw new Error('useRewards must be used within a RewardProvider');
    }
    return context;
};
