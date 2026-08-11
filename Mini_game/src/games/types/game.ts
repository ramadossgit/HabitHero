export type GameType =
  | "quiz"
  | "memory"
  | "puzzle"
  | "dragdrop"
  | "tappop"
  | "sequence"
  | "mathrunner"
  | "wordbuilder"
  | "logicgrid"
  | "citybuilder"
  | "codinglite"
  | "finance"
  | "jigsaw"
  | "pattern"
  | "maze"
  | "spotdiff"
  | "sudoku"
  | "watertracker"
  | "sleepguardian"
  | "breathing";

export type AgeGroup = "3-5" | "6-8" | "9-12";
export type Difficulty = "easy" | "medium" | "hard";
export type GameCategory = "preschool" | "elementary" | "preteen" | "puzzle" | "wellness";

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  accent: string;
}

export interface GameConfig {
  id: string;
  engine: GameType;
  title: string;
  ageGroup: AgeGroup;
  difficulty: Difficulty;
  category: GameCategory;
  icon: string;
  themeColors: ThemeColors;
  contentPath?: string;
  rewardPoints: number;
  timeLimit?: number;
  initialData?: any;
}

export interface GameProps {
  game: GameConfig;
  onComplete: (score: number) => void;
  onExit: () => void;
}
