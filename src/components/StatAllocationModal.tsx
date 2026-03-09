import React, { useState, useEffect } from 'react';
import { General } from '../data/generals';
import { useGame } from '../context/GameContext';

interface StatAllocationModalProps {
  general: General;
  onClose: () => void;
}

export default function StatAllocationModal({ general, onClose }: StatAllocationModalProps) {
  const { allocateStats, getGeneralStats } = useGame();
  
  // Local state for temporary allocation
  const [tempAllocated, setTempAllocated] = useState({
    strength: general.allocatedPoints?.strength || 0,
    strategy: general.allocatedPoints?.strategy || 0,
    defense: general.allocatedPoints?.defense || 0,
    speed: general.allocatedPoints?.speed || 0,
  });

  const [tempAvailable, setTempAvailable] = useState(general.availablePoints || 0);

  // Calculate current stats based on temp allocation
  // We need to simulate what the stats WOULD be.
  // getGeneralStats uses the general object from context.
  // We can create a "mock" general to pass to a helper, or just duplicate logic slightly for display.
  // Or better, we can just calculate the "base + growth" part and add tempAllocated.
  
  const baseStats = {
    strength: general.strength,
    strategy: general.strategy,
    defense: general.defense,
    speed: general.speed
  };

  // Sort to find growth rates (same logic as context)
  const sortedStats = [
    { name: 'strength', val: general.strength },
    { name: 'strategy', val: general.strategy },
    { name: 'defense', val: general.defense },
    { name: 'speed', val: general.speed }
  ].sort((a, b) => {
    if (b.val !== a.val) return b.val - a.val;
    return a.name.localeCompare(b.name);
  });

  const growthMap: Record<string, number> = {};
  sortedStats.forEach((stat, index) => {
    if (index === 0) growthMap[stat.name] = 1.08;
    else if (index === 1) growthMap[stat.name] = 0.88;
    else growthMap[stat.name] = 0.68;
  });

  const calculateStat = (name: 'strength' | 'strategy' | 'defense' | 'speed') => {
    const base = baseStats[name];
    const growth = growthMap[name] || 0.68;
    const level = general.level || 1;
    const alloc = tempAllocated[name];
    return Math.floor(base + (level - 1) * growth + alloc);
  };

  const handleIncrement = (stat: 'strength' | 'strategy' | 'defense' | 'speed') => {
    if (tempAvailable > 0) {
      setTempAllocated(prev => ({ ...prev, [stat]: prev[stat] + 1 }));
      setTempAvailable(prev => prev - 1);
    }
  };

  const handleDecrement = (stat: 'strength' | 'strategy' | 'defense' | 'speed') => {
    // Can only decrement if we added points in this session OR if we are reclaiming previously allocated points?
    // User requirement: "click minus to reclaim". 
    // Assuming we can reclaim ANY allocated points, not just this session's.
    // But we shouldn't go below 0 allocated.
    if (tempAllocated[stat] > 0) {
      setTempAllocated(prev => ({ ...prev, [stat]: prev[stat] - 1 }));
      setTempAvailable(prev => prev + 1);
    }
  };

  const handleSave = () => {
    allocateStats(general.id, tempAllocated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-900 border border-gold/30 p-6 rounded-xl shadow-2xl w-96 relative" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h3 className="text-xl font-bold text-gold mb-6 text-center">属性加点</h3>
        
        <div className="flex justify-between items-center mb-6 bg-zinc-800/50 p-3 rounded-lg border border-white/5">
          <span className="text-slate-300">剩余点数</span>
          <span className="text-2xl font-bold text-primary">{tempAvailable}</span>
        </div>

        <div className="space-y-4">
          {(['strength', 'strategy', 'defense', 'speed'] as const).map(stat => {
            const label = {
              strength: '武力',
              strategy: '谋略',
              defense: '防御',
              speed: '攻速'
            }[stat];
            
            const icon = {
              strength: 'swords',
              strategy: 'psychology',
              defense: 'shield',
              speed: 'bolt'
            }[stat];

            const currentVal = calculateStat(stat);

            return (
              <div key={stat} className="flex items-center justify-between">
                <div className="flex items-center gap-2 w-24">
                  <span className="material-symbols-outlined text-slate-500 text-sm">{icon}</span>
                  <span className="text-slate-300">{label}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-white font-mono w-12 text-right">{currentVal}</span>
                  
                  <div className="flex items-center gap-1 bg-zinc-800 rounded p-0.5 border border-zinc-700">
                    <button 
                      onClick={() => handleDecrement(stat)}
                      disabled={tempAllocated[stat] <= 0}
                      className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-zinc-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs text-gold font-bold">{tempAllocated[stat]}</span>
                    <button 
                      onClick={() => handleIncrement(stat)}
                      disabled={tempAvailable <= 0}
                      className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-zinc-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2 border border-zinc-700 text-slate-400 rounded hover:text-white hover:border-zinc-500 transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 py-2 bg-gold text-black font-bold rounded hover:bg-yellow-400 transition-colors shadow-lg shadow-gold/20"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
