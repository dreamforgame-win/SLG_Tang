import React, { useState } from 'react';
import { useGame, FormationType } from '../context/GameContext';
import { FORMATIONS, FORMATION_NAMES } from '../utils/battleLogic';
import { calculateAffixBuffs, getAffixAttributeText } from '../utils/affixLogic';

interface Level {
  id: number;
  name: string;
  level: number;
}

interface DeploymentModalProps {
  level: Level;
  onClose: () => void;
  onDeploy: (squadId: number) => void;
}

export default function DeploymentModal({ level, onClose, onDeploy }: DeploymentModalProps) {
  const { squads, generals: currentGenerals } = useGame();
  const [selectedSquadId, setSelectedSquadId] = useState<number>(1);

  const selectedSquad = squads[selectedSquadId];
  const formationLevel = selectedSquad.formationLevel || 1;
  const formationRows = FORMATIONS[selectedSquad.formation][formationLevel];

  const affixBuffs = calculateAffixBuffs(selectedSquad.placements, currentGenerals, formationRows);

  // Helper to render mini grid
  const renderMiniGrid = () => {
    let slotCounter = 0;
    return (
      <div className="flex flex-col gap-1 items-center justify-center scale-75 origin-top">
        {formationRows.map((cellCount, rowIndex) => {
          const rowElements = [];
          let currentSlotInRow = 0;
          
          while (currentSlotInRow < cellCount) {
            const globalSlotIndex = slotCounter + currentSlotInRow;
            const placement = selectedSquad.placements.find(p => p.startIndex === globalSlotIndex);
            
            if (placement) {
              const general = currentGenerals.find(g => g.id === placement.generalId);
              const cost = general ? general.cost : 1;
              
              // Calculate width: cost * 3rem (w-12) + (cost - 1) * 0.25rem (gap-1)
              const widthStyle = { width: `calc(${cost} * 3rem + ${cost - 1} * 0.25rem)` };

              rowElements.push(
                <div 
                  key={globalSlotIndex}
                  style={widthStyle}
                  className={`relative h-12 rounded border flex items-center justify-center overflow-hidden group/buff ${
                    general 
                      ? 'border-primary bg-primary/20' 
                      : 'border-zinc-700 bg-zinc-800/50'
                  }`}
                >
                  {general && (
                    <>
                      <img src={general.imageUrl} alt="" className="w-full h-full object-cover opacity-80" />
                      
                      {/* Affix Buffs Icon */}
                      {(affixBuffs[general.id]?.length > 0) && (
                        <div className="absolute bottom-0.5 right-0.5 z-20 pointer-events-auto">
                          <span className="material-symbols-outlined text-gold text-[10px] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] cursor-help">keyboard_double_arrow_up</span>
                          <div className="absolute hidden group-hover/buff:block bottom-full right-0 mb-1 w-40 bg-zinc-900 border border-gold/30 rounded p-1.5 shadow-xl pointer-events-none z-50">
                            <div className="text-[10px] font-bold text-gold mb-1 border-b border-gold/20 pb-0.5">获得增益</div>
                            {affixBuffs[general.id].map((b, i) => (
                              <div key={i} className="text-[9px] text-slate-300 flex justify-between py-0.5">
                                <span className="truncate max-w-[60px]">来自 {b.sourceGeneralName}</span>
                                <span className="text-green-400 whitespace-nowrap">
                                  {getAffixAttributeText(b.attribute)} {b.valueType === 'fixed' ? `+${b.value}` : `+${b.value}%`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
              currentSlotInRow += cost;
            } else {
              // Empty slot
              rowElements.push(
                <div 
                  key={globalSlotIndex}
                  className="w-12 h-12 rounded border border-zinc-700 bg-zinc-800/50 flex items-center justify-center overflow-hidden"
                >
                </div>
              );
              currentSlotInRow += 1;
            }
          }
          
          slotCounter += cellCount;

          return (
            <div key={rowIndex} className="flex gap-1">
              {rowElements}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div 
        className="relative w-full max-w-4xl bg-zinc-900 border-t sm:border border-gold/30 sm:rounded-xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">swords</span>
              出征准备
            </h2>
            <p className="text-slate-400 text-sm mt-1">目标: {level.name} (Lv.{level.level})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Formation Preview */}
          <div className="w-full md:w-1/3 bg-black/20 rounded-lg p-4 border border-white/5 flex flex-col items-center">
            <h3 className="text-gold font-bold mb-4">{selectedSquad.name} - {FORMATION_NAMES[selectedSquad.formation]} Lv.{formationLevel}</h3>
            <div className="flex-1 flex items-center justify-center min-h-[200px]">
              {renderMiniGrid()}
            </div>
          </div>

          {/* Center: Squad Selection */}
          <div className="flex-1 space-y-3">
            <h3 className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-2">选择出战编队</h3>
            {[1, 2, 3].map(id => {
              const squad = squads[id];
              const leaderPlacement = squad.placements[0]; // Assume first placement is leader for display
              const leader = leaderPlacement ? currentGenerals.find(g => g.id === leaderPlacement.generalId) : null;
              const count = squad.placements.length;
              
              return (
                <button
                  key={id}
                  onClick={() => setSelectedSquadId(id)}
                  className={`w-full flex items-center gap-4 p-3 rounded-lg border transition-all ${
                    selectedSquadId === id 
                      ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(238,59,43,0.2)]' 
                      : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
                  }`}
                >
                  <div className="w-12 h-12 rounded bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {leader ? (
                      <img src={leader.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-slate-600">person</span>
                    )}
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${selectedSquadId === id ? 'text-white' : 'text-slate-300'}`}>
                        {squad.name}
                      </span>
                      {leader && (
                        <span className="text-[10px] bg-gold text-black px-1.5 rounded font-bold">Lv.{leader.level}</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {count > 0 ? `${count} 名武将` : '空闲'}
                    </div>
                  </div>

                  {selectedSquadId === id && (
                    <span className="material-symbols-outlined text-primary">check_circle</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={() => onDeploy(selectedSquadId)}
            className="px-8 py-3 bg-primary text-white font-bold text-lg rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center gap-2 transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined">swords</span>
            立即出征
          </button>
        </div>
      </div>
    </div>
  );
}
