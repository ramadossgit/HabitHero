import React, { createContext, useContext, useState } from "react";
import { RewardState } from "../types";

type RewardsContextType = {
  score: number;
  level: number;
  streak: number;
  addPoints: (points: number) => void;
};

const RewardsContext = createContext<RewardsContextType | undefined>(undefined);

export const RewardsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<RewardState>({
    score: 0,
    level: 1,
    streak: 0,
  });

  const addPoints = (points: number) => {
    setState((prev) => {
      const newScore = prev.score + points;
      let newLevel = prev.level;
      if (newScore >= prev.level * 50) {
        newLevel += 1;
      }
      return { ...prev, score: newScore, level: newLevel };
    });
  };

  return (
    <RewardsContext.Provider value={{ ...state, addPoints }}>
      {children}
    </RewardsContext.Provider>
  );
};

export const useRewards = () => {
  const context = useContext(RewardsContext);
  if (!context) throw new Error("useRewards must be inside RewardsProvider");
  return context;
};
