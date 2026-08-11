import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserState {
    points: number;
    level: number;
}

interface UserContextType extends UserState {
    addPoints: (amount: number) => void;
    levelUp: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [points, setPoints] = useState(0);
    const [level, setLevel] = useState(1);

    const addPoints = (amount: number) => {
        setPoints((prev) => prev + amount);
    };

    const levelUp = () => {
        setLevel((prev) => prev + 1);
    };

    return (
        <UserContext.Provider value={{ points, level, addPoints, levelUp }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
