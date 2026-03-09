import React, { createContext, useContext, useState, useEffect } from 'react';
import { generals as initialGenerals, General } from '../data/generals';
import { calculateMaxHp } from '../utils/battleLogic';

// --- Types ---

export type FormationType = 'straight' | 'conical' | 'square';

export interface Placement {
  generalId: string;
  startIndex: number;
}

export interface Squad {
  id: number;
  name: string;
  formation: FormationType;
  formationLevel: number;
  placements: Placement[];
}

export interface Level {
  id: number;
  name: string;
  type: 'watchtower' | 'post' | 'garrison' | 'fortress' | 'citadel' | 'palace';
  level: number;
  status: 'locked' | 'unlocked' | 'cleared';
  position: { top?: string; bottom?: string; left?: string; right?: string };
  icon: string;
}

import { generateRandomAffixes } from '../utils/affixLogic';

interface GameContextType {
  generals: General[];
  squads: Record<number, Squad>;
  levels: Level[];
  updateSquad: (squadId: number, squad: Squad) => void;
  addExpToGeneral: (generalId: string, amount: number) => { leveledUp: boolean, newLevel: number };
  allocateStats: (generalId: string, stats: { strength: number, strategy: number, defense: number, speed: number }) => void;
  resetAffixes: (generalId: string) => void;
  getGeneralStats: (generalId: string) => { strength: number, strategy: number, defense: number, speed: number, maxHp: number };
  getExpForLevel: (level: number) => number;
  completeLevel: (levelId: number) => void;
}

// --- Constants & Logic ---

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

// Leveling Formula
// L < 24: Exp = 100 * L^2
// 25 <= L < 40: Exp = 57600 + 1500 * (L-24)^2.2
// L >= 40: Exp = 637600 * 1.2^(L-39)
const getExpForLevel = (level: number): number => {
  if (level < 24) {
    return Math.floor(100 * Math.pow(level, 2));
  } else if (level < 40) {
    return Math.floor(57600 + 1500 * Math.pow(level - 24, 2.2));
  } else {
    return Math.floor(637600 * Math.pow(1.2, level - 39));
  }
};

const getLevelFromExp = (exp: number): number => {
  let level = 1;
  while (getExpForLevel(level + 1) <= exp) {
    level++;
  }
  return level;
};

const INITIAL_LEVELS: Level[] = [
  { id: 1, name: '木制瞭望塔', type: 'watchtower', level: 1, status: 'unlocked', position: { bottom: '10%', left: '8%' }, icon: 'deck' },
  { id: 2, name: '边境哨所', type: 'post', level: 2, status: 'locked', position: { bottom: '20%', left: '18%' }, icon: 'fence' },
  { id: 3, name: '石砌戍堡', type: 'garrison', level: 3, status: 'locked', position: { bottom: '30%', left: '25%' }, icon: 'castle' },
  { id: 4, name: '前沿阵地', type: 'garrison', level: 4, status: 'locked', position: { bottom: '40%', left: '35%' }, icon: 'home_work' },
  { id: 5, name: '战略要塞', type: 'fortress', level: 5, status: 'locked', position: { bottom: '55%', left: '40%' }, icon: 'fort' },
  { id: 6, name: '重兵营地', type: 'fortress', level: 6, status: 'locked', position: { top: '35%', right: '40%' }, icon: 'security' },
  { id: 7, name: '山岳卫城', type: 'citadel', level: 7, status: 'locked', position: { top: '25%', right: '30%' }, icon: 'shield_with_heart' },
  { id: 8, name: '铁壁关隘', type: 'citadel', level: 8, status: 'locked', position: { top: '18%', right: '22%' }, icon: 'gavel' },
  { id: 9, name: '近畿重镇', type: 'citadel', level: 9, status: 'locked', position: { top: '12%', right: '15%' }, icon: 'church' },
  { id: 10, name: '长安皇城', type: 'palace', level: 10, status: 'locked', position: { top: '5%', right: '5%' }, icon: 'temple_buddhist' }
];

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize generals with extended properties if missing
  const [generals, setGenerals] = useState<General[]>(() => {
    const saved = localStorage.getItem('generals');
    if (saved) {
      try {
        const savedGenerals = JSON.parse(saved) as General[];
        // Merge saved data with initial data to update base stats
        return initialGenerals.map(initialG => {
          const savedG = savedGenerals.find(g => g.id === initialG.id);
          if (savedG) {
            return {
              ...savedG, // Keep saved progress (level, exp, etc.)
              // Overwrite base stats with new values from code
              strength: initialG.strength,
              strategy: initialG.strategy,
              defense: initialG.defense,
              speed: initialG.speed,
              cost: initialG.cost,
              skill: initialG.skill,
              imageUrl: initialG.imageUrl,
              // Ensure these exist
              allocatedPoints: savedG.allocatedPoints || { strength: 0, strategy: 0, defense: 0, speed: 0 },
              availablePoints: savedG.availablePoints || 0,
              affixes: savedG.affixes || generateRandomAffixes(),
            };
          }
          // New general not in saved data
          return {
            ...initialG,
            level: 1,
            exp: 0,
            allocatedPoints: { strength: 0, strategy: 0, defense: 0, speed: 0 },
            availablePoints: 0,
            affixes: generateRandomAffixes(),
          };
        });
      } catch (e) {
        console.error("Failed to parse saved generals", e);
        // Fallback to initial if parse fails
      }
    }
    return initialGenerals.map(g => ({
      ...g,
      level: g.level || 1,
      exp: g.exp || 0,
      allocatedPoints: g.allocatedPoints || { strength: 0, strategy: 0, defense: 0, speed: 0 },
      availablePoints: g.availablePoints || 0,
      affixes: generateRandomAffixes(),
    }));
  });

  const [squads, setSquads] = useState<Record<number, Squad>>(() => {
    const saved = localStorage.getItem('squads');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure formationLevel exists for backward compatibility
        Object.values(parsed).forEach((squad: any) => {
          if (!squad.formationLevel) squad.formationLevel = 1;
        });
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved squads", e);
      }
    }
    return {
      1: { id: 1, name: '阵容一', formation: 'straight', formationLevel: 1, placements: [] },
      2: { id: 2, name: '阵容二', formation: 'conical', formationLevel: 1, placements: [] },
      3: { id: 3, name: '阵容三', formation: 'square', formationLevel: 1, placements: [] },
    };
  });

  const [levels, setLevels] = useState<Level[]>(() => {
    const saved = localStorage.getItem('levels');
    if (saved) {
      return JSON.parse(saved);
    }
    return INITIAL_LEVELS;
  });

  // Persist state
  useEffect(() => {
    localStorage.setItem('generals', JSON.stringify(generals));
  }, [generals]);

  useEffect(() => {
    localStorage.setItem('squads', JSON.stringify(squads));
  }, [squads]);

  useEffect(() => {
    localStorage.setItem('levels', JSON.stringify(levels));
  }, [levels]);

  const updateSquad = (squadId: number, squad: Squad) => {
    setSquads(prev => ({ ...prev, [squadId]: squad }));
  };

  const completeLevel = (levelId: number) => {
    setLevels(prev => {
      const newLevels = [...prev];
      const levelIndex = newLevels.findIndex(l => l.id === levelId);
      if (levelIndex === -1) return prev;

      // Mark current as cleared
      newLevels[levelIndex] = { ...newLevels[levelIndex], status: 'cleared' };

      // Unlock next level if exists
      const nextLevelIndex = newLevels.findIndex(l => l.id === levelId + 1);
      if (nextLevelIndex !== -1 && newLevels[nextLevelIndex].status === 'locked') {
        newLevels[nextLevelIndex] = { ...newLevels[nextLevelIndex], status: 'unlocked' };
      }

      return newLevels;
    });
  };

  const addExpToGeneral = (generalId: string, amount: number) => {
    let leveledUp = false;
    let newLevel = 0;

    setGenerals(prev => prev.map(g => {
      if (g.id !== generalId) return g;

      const currentExp = g.exp || 0;
      const nextExp = currentExp + amount;
      const currentLevel = g.level || 1;
      const calculatedLevel = getLevelFromExp(nextExp);

      let availablePoints = g.availablePoints || 0;
      
      // Check for level up thresholds for points (10, 20, 30, 40, 50)
      for (let l = currentLevel + 1; l <= calculatedLevel; l++) {
        if (l % 10 === 0 && l <= 50) {
          availablePoints += 10;
        }
      }

      if (calculatedLevel > currentLevel) {
        leveledUp = true;
        newLevel = calculatedLevel;
      }

      return {
        ...g,
        exp: nextExp,
        level: calculatedLevel,
        availablePoints
      };
    }));

    return { leveledUp, newLevel };
  };

  const allocateStats = (generalId: string, stats: { strength: number, strategy: number, defense: number, speed: number }) => {
    setGenerals(prev => prev.map(g => {
      if (g.id !== generalId) return g;
      
      const totalAllocated = stats.strength + stats.strategy + stats.defense + stats.speed;
      const currentAllocated = (g.allocatedPoints?.strength || 0) + (g.allocatedPoints?.strategy || 0) + (g.allocatedPoints?.defense || 0) + (g.allocatedPoints?.speed || 0);
      const diff = totalAllocated - currentAllocated;

      if (g.availablePoints !== undefined && g.availablePoints - diff < 0) {
        return g; // Not enough points
      }

      return {
        ...g,
        allocatedPoints: stats,
        availablePoints: (g.availablePoints || 0) - diff
      };
    }));
  };

  const resetAffixes = (generalId: string) => {
    setGenerals(prev => prev.map(g => {
      if (g.id !== generalId) return g;
      return {
        ...g,
        affixes: generateRandomAffixes()
      };
    }));
  };

  const getGeneralStats = (generalId: string) => {
    const general = generals.find(g => g.id === generalId);
    if (!general) return { strength: 0, strategy: 0, defense: 0, speed: 0, maxHp: 0 };

    const level = general.level || 1;
    const allocated = general.allocatedPoints || { strength: 0, strategy: 0, defense: 0, speed: 0 };

    // Base stats
    const baseStats = [
      { name: 'strength', val: general.strength },
      { name: 'strategy', val: general.strategy },
      { name: 'defense', val: general.defense },
      { name: 'speed', val: general.speed }
    ];

    // Sort to find growth rates
    // Highest: +1.08, 2nd: +0.88, Others: +0.68
    const sortedStats = [...baseStats].sort((a, b) => {
      if (b.val !== a.val) return b.val - a.val;
      return a.name.localeCompare(b.name);
    });
    
    const growthMap: Record<string, number> = {};
    sortedStats.forEach((stat, index) => {
      if (index === 0) growthMap[stat.name] = 1.08;
      else if (index === 1) growthMap[stat.name] = 0.88;
      else growthMap[stat.name] = 0.68;
    });

    const calculateStat = (base: number, name: string, alloc: number) => {
      const growth = growthMap[name] || 0.68;
      return Math.floor(base + (level - 1) * growth + alloc);
    };

    return {
      strength: calculateStat(general.strength, 'strength', allocated.strength),
      strategy: calculateStat(general.strategy, 'strategy', allocated.strategy),
      defense: calculateStat(general.defense, 'defense', allocated.defense),
      speed: calculateStat(general.speed, 'speed', allocated.speed),
      maxHp: calculateMaxHp(level)
    };
  };

  return (
    <GameContext.Provider value={{ 
      generals, 
      squads, 
      levels,
      updateSquad, 
      addExpToGeneral, 
      allocateStats, 
      resetAffixes,
      getGeneralStats,
      getExpForLevel,
      completeLevel
    }}>
      {children}
    </GameContext.Provider>
  );
};
