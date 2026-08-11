// Wellness & healthy-habit games.
// To add a game to this category, add one defineGame() entry here.

import { defineGame } from "../levels";
import type { GameDefinition } from "../types";

export const wellnessGames: GameDefinition[] = [
  defineGame({
    id: "water-tracker",
    engine: "watertracker",
    title: "Water Tracker Quest",
    description: "Help your buddy drink enough water every day!",
    ageGroup: "6-8",
    difficulty: "easy",
    category: "wellness",
    icon: "💧",
    rewardPoints: 80,
    purchaseCost: 50,
    themeColors: { primary: "#0277BD", secondary: "#B3E5FC", background: "#E1F5FE", accent: "#039BE5" },
  }),
  defineGame({
    id: "sleep-guardian",
    engine: "sleepguardian",
    title: "Sleep Guardian",
    description: "Build the perfect bedtime routine for sweet dreams!",
    ageGroup: "6-8",
    difficulty: "easy",
    category: "wellness",
    icon: "🌙",
    rewardPoints: 80,
    purchaseCost: 50,
    themeColors: { primary: "#283593", secondary: "#C5CAE9", background: "#E8EAF6", accent: "#5C6BC0" },
  }),
  defineGame({
    id: "breathing",
    engine: "breathing",
    title: "Breathing Balloon",
    description: "Breathe with the balloon and feel calm and happy!",
    ageGroup: "3-5",
    difficulty: "easy",
    category: "wellness",
    icon: "🫧",
    rewardPoints: 60,
    purchaseCost: 45,
    themeColors: { primary: "#00796B", secondary: "#B2DFDB", background: "#E0F2F1", accent: "#26A69A" },
  }),
];
