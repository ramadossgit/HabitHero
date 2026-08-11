export type HabitFrequency = "daily" | "weekly";

export interface Habit {
    id: string;
    title: string;
    frequency: HabitFrequency;
    isCompleted: boolean;
    linkedGameId?: string; // ID of the game this habit unlocks
    icon?: string;
}

export interface HabitState {
    habits: Habit[];
    completedHabitIds: string[];
}
