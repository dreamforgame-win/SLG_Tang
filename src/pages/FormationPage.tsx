import React, { useState, useEffect } from 'react';
import { General } from '../data/generals';
import GeneralCard from '../components/GeneralCard';
import Header from '../components/Header';
import GeneralDetailModal from '../components/GeneralDetailModal';
import { useGame, FormationType, Squad } from '../context/GameContext';
import { FORMATIONS, FORMATION_NAMES } from '../utils/battleLogic';
import { calculateAffixBuffs, getAffixAttributeText } from '../utils/affixLogic';

export default function FormationPage() {
  const { generals, squads, updateSquad, levels } = useGame();
  const [currentSquadId, setCurrentSquadId] = useState<number>(1);
  
  const [draggedGeneral, setDraggedGeneral] = useState<General | null>(null);
  const [draggedFromSlot, setDraggedFromSlot] = useState<number | null>(null); // Track if dragging from a slot
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [isValidDrop, setIsValidDrop] = useState<boolean>(false);
  const [costFilter, setCostFilter] = useState<number | 'All'>('All');
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempSquadName, setTempSquadName] = useState('');
  const [suggestedSlot, setSuggestedSlot] = useState<number | null>(null); // To show where it will actually snap
  const [selectedGeneral, setSelectedGeneral] = useState<General | null>(null);

  const currentSquad = squads[currentSquadId];
  const currentFormationLevel = currentSquad.formationLevel || 1;
  const currentFormationRows = FORMATIONS[currentSquad.formation][currentFormationLevel];
  const totalSlots = currentFormationRows.reduce((a, b) => a + b, 0);

  // Check unlock conditions
  const isLevel2Unlocked = levels.find(l => l.id === 3)?.status === 'cleared';
  const isLevel3Unlocked = levels.find(l => l.id === 6)?.status === 'cleared';

  const affixBuffs = calculateAffixBuffs(currentSquad.placements, generals, currentFormationRows);

  // Helper to get row index for a slot index
  const getRowForSlot = (slotIndex: number, formation: FormationType, level: number): { rowIndex: number, rowStartIndex: number, rowEndIndex: number } => {
    const rows = FORMATIONS[formation][level];
    let currentStart = 0;
    for (let i = 0; i < rows.length; i++) {
      const rowLength = rows[i];
      if (slotIndex >= currentStart && slotIndex < currentStart + rowLength) {
        return { rowIndex: i, rowStartIndex: currentStart, rowEndIndex: currentStart + rowLength - 1 };
      }
      currentStart += rowLength;
    }
    return { rowIndex: -1, rowStartIndex: -1, rowEndIndex: -1 };
  };

  // Check if a general is already deployed in current squad
  const isGeneralDeployed = (generalId: string) => {
    return currentSquad.placements.some(p => p.generalId === generalId);
  };

  // Calculate occupied slots, optionally excluding a specific general (for moving)
  const getOccupiedSlots = (excludeGeneralId?: string) => {
    const occupied = new Set<number>();
    currentSquad.placements.forEach(p => {
      if (p.generalId === excludeGeneralId) return;
      const general = generals.find(g => g.id === p.generalId);
      if (general) {
        for (let i = 0; i < general.cost; i++) {
          occupied.add(p.startIndex + i);
        }
      }
    });
    return occupied;
  };

  // Find the best valid slot in the row for a given target slot
  const findValidSlotInRow = (targetSlot: number, general: General, excludeGeneralId?: string): number | null => {
    const { rowIndex, rowStartIndex, rowEndIndex } = getRowForSlot(targetSlot, currentSquad.formation, currentFormationLevel);
    if (rowIndex === -1) return null;

    const occupiedSlots = getOccupiedSlots(excludeGeneralId);

    // Helper to check validity at specific start index
    const check = (start: number) => {
      // Boundary check
      if (start < rowStartIndex || start + general.cost - 1 > rowEndIndex) return false;
      // Collision check
      for (let i = 0; i < general.cost; i++) {
        if (occupiedSlots.has(start + i)) return false;
      }
      return true;
    };

    // 1. Try exact
    if (check(targetSlot)) return targetSlot;

    // 2. Try shifting left/right to find closest valid slot
    let offset = 1;
    while (true) {
      const left = targetSlot - offset;
      const right = targetSlot + offset;
      let found = false;

      // Check left
      if (left >= rowStartIndex) {
        if (check(left)) return left;
        found = true; 
      }
      
      // Check right
      if (right <= rowEndIndex) { 
         if (check(right)) return right;
         found = true;
      }

      if (!found && (left < rowStartIndex && right > rowEndIndex)) break; // Exhausted row
      offset++;
      if (offset > 10) break; // Safety break
    }

    return null;
  };

  const handleDragStart = (e: React.DragEvent, general: General, fromSlot?: number) => {
    setDraggedGeneral(general);
    if (fromSlot !== undefined) {
      setDraggedFromSlot(fromSlot);
    } else {
      setDraggedFromSlot(null);
    }
    e.dataTransfer.setData('text/plain', general.id);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragOver = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    if (!draggedGeneral) return;

    // Optimization: Don't re-calc if slot hasn't changed
    if (hoveredSlot === slotIndex) return;
    setHoveredSlot(slotIndex);

    // Calculate validity and suggested slot
    const excludeId = draggedFromSlot !== null ? draggedGeneral.id : undefined;
    const validSlot = findValidSlotInRow(slotIndex, draggedGeneral, excludeId);

    // 3. Check if already deployed (if dragging from list)
    if (draggedFromSlot === null && isGeneralDeployed(draggedGeneral.id)) {
       setIsValidDrop(false); 
       setSuggestedSlot(null);
       return;
    }

    if (validSlot !== null) {
      setIsValidDrop(true);
      setSuggestedSlot(validSlot);
    } else {
      setIsValidDrop(false);
      setSuggestedSlot(null);
    }
  };

  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    setHoveredSlot(null);
    setSuggestedSlot(null);
    
    if (!draggedGeneral || !isValidDrop) {
      setDraggedGeneral(null);
      setDraggedFromSlot(null);
      return;
    }

    // Use the suggested slot (calculated during dragOver) or re-calculate to be safe
    const excludeId = draggedFromSlot !== null ? draggedGeneral.id : undefined;
    const finalSlot = findValidSlotInRow(slotIndex, draggedGeneral, excludeId);

    if (finalSlot === null) {
      setDraggedGeneral(null);
      setDraggedFromSlot(null);
      return;
    }

    // If moving, remove old placement first
    let newPlacements = [...currentSquad.placements];
    if (draggedFromSlot !== null) {
      newPlacements = newPlacements.filter(p => p.generalId !== draggedGeneral.id);
    }

    // Add new placement
    newPlacements.push({ generalId: draggedGeneral.id, startIndex: finalSlot });
    
    updateSquad(currentSquadId, { ...currentSquad, placements: newPlacements });

    setDraggedGeneral(null);
    setDraggedFromSlot(null);
  };

  const handleQuickDeploy = (general: General) => {
    if (isGeneralDeployed(general.id)) return;

    // Find first valid slot
    let foundSlot = -1;
    
    const occupiedSlots = getOccupiedSlots();
    
    let currentStart = 0;
    for (let r = 0; r < currentFormationRows.length; r++) {
      const rowLength = currentFormationRows[r];
      const rowEnd = currentStart + rowLength - 1;
      
      // Try to fit in this row
      for (let s = currentStart; s <= rowEnd - general.cost + 1; s++) {
        // Check if [s, s + cost - 1] is free
        let free = true;
        for (let k = 0; k < general.cost; k++) {
          if (occupiedSlots.has(s + k)) {
            free = false;
            break;
          }
        }
        if (free) {
          foundSlot = s;
          break;
        }
      }
      if (foundSlot !== -1) break;
      currentStart += rowLength;
    }

    if (foundSlot !== -1) {
      const newPlacements = [...currentSquad.placements, { generalId: general.id, startIndex: foundSlot }];
      updateSquad(currentSquadId, { ...currentSquad, placements: newPlacements });
    } else {
      // Show toast or alert
      const toast = document.createElement('div');
      toast.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 font-bold animate-bounce';
      toast.innerText = '阵型空间不足';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 2000);
    }
  };

  const handleRemoveGeneral = (generalId: string) => {
    const newPlacements = currentSquad.placements.filter(p => p.generalId !== generalId);
    updateSquad(currentSquadId, { ...currentSquad, placements: newPlacements });
  };

  const handleFormationChange = (type: FormationType) => {
    // changing formation clears placements because slots might be invalid
    // Only warn if there are placements
    if (currentSquad.placements.length > 0) {
      if (!window.confirm('切换阵型将清空当前布阵，是否继续？')) {
        return;
      }
    }
    
    updateSquad(currentSquadId, { ...currentSquad, formation: type, placements: [] });
  };

  const handleFormationLevelChange = (level: number) => {
    if (currentSquad.placements.length > 0) {
      if (!window.confirm('切换阵型等级将清空当前布阵，是否继续？')) {
        return;
      }
    }
    
    updateSquad(currentSquadId, { ...currentSquad, formationLevel: level, placements: [] });
  };

  const handleSave = () => {
    // In a real app, save to backend. Here just alert.
    alert(`${currentSquad.name} 保存成功！`);
  };

  const startRenaming = () => {
    setTempSquadName(currentSquad.name);
    setIsRenaming(true);
  };

  const saveSquadName = () => {
    if (tempSquadName.trim()) {
      updateSquad(currentSquadId, { ...currentSquad, name: tempSquadName.trim() });
    }
    setIsRenaming(false);
  };

  // Render Grid
  const renderGrid = () => {
    let slotCounter = 0;
    const occupiedSlots = getOccupiedSlots(); // Show all occupied for rendering

    return (
      <div className="flex flex-col gap-3 items-center justify-center py-4 min-h-[300px]">
        {currentFormationRows.map((cellCount, rowIndex) => {
          const rowSlots: number[] = [];
          for (let i = 0; i < cellCount; i++) {
            rowSlots.push(slotCounter++);
          }

          return (
            <div key={rowIndex} className="flex gap-1.5">
              {rowSlots.map((slotIndex) => {
                // Check if this slot is the START of a placement
                const placement = currentSquad.placements.find(p => p.startIndex === slotIndex);
                const general = placement ? generals.find(g => g.id === placement.generalId) : null;
                
                // Check if this slot is occupied by a general starting elsewhere
                const isOccupied = occupiedSlots.has(slotIndex);
                const isHidden = isOccupied && !placement; // Occupied but not start -> hidden (covered by the main card)

                // Drag over styling
                const isHovered = hoveredSlot === slotIndex;
                
                // If we are hovering, and this slot would be covered by the dragged general
                let isPreviewCovered = false;
                let isSuggested = false;

                if (draggedGeneral) {
                   // If valid drop, we show the SUGGESTED slot (snapped)
                   if (isValidDrop && suggestedSlot !== null) {
                      if (slotIndex >= suggestedSlot && slotIndex < suggestedSlot + draggedGeneral.cost) {
                        isPreviewCovered = true;
                        isSuggested = true;
                      }
                   } 
                   // If invalid drop, we show RED on the hovered slot (if it fits in row boundary at least)
                   else if (!isValidDrop && hoveredSlot !== null) {
                      const { rowEndIndex } = getRowForSlot(hoveredSlot, currentSquad.formation, currentFormationLevel);
                      // Show red on the footprint starting at hoveredSlot, clipped to row end
                      if (slotIndex >= hoveredSlot && slotIndex < hoveredSlot + draggedGeneral.cost && slotIndex <= rowEndIndex) {
                        isPreviewCovered = true;
                      }
                   }
                }

                return (
                  <div 
                    key={slotIndex}
                    onDragOver={(e) => handleDragOver(e, slotIndex)}
                    onDrop={(e) => handleDrop(e, slotIndex)}
                    onDragLeave={() => {
                      if (hoveredSlot === slotIndex) {
                        setHoveredSlot(null);
                        setSuggestedSlot(null);
                      }
                    }}
                    className={`
                      relative transition-all border-2 rounded-lg flex items-center justify-center
                      ${isHidden ? 'w-0 border-none m-0 p-0 overflow-hidden' : 'w-20 sm:w-24 h-20 sm:h-24'} 
                      ${general ? 'border-primary bg-primary/10 z-10 cursor-grab active:cursor-grabbing' : 'border-dashed border-zinc-700 bg-zinc-900/50'}
                      ${isPreviewCovered && isValidDrop ? 'bg-green-500/30 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : ''}
                      ${isPreviewCovered && !isValidDrop ? 'bg-red-500/30 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''}
                    `}
                    style={{
                      // If general exists, width spans multiple cells + gaps
                      // Gap is 0.375rem (6px). Width = (cellWidth * cost) + (gap * (cost - 1))
                      // We use style width override if general is present
                      width: general ? `calc(${general.cost} * var(--cell-size) + ${(general.cost - 1)} * 0.375rem)` : undefined,
                      '--cell-size': '5rem', // 20 * 0.25rem = 5rem (w-20)
                    } as React.CSSProperties}
                    draggable={!!general}
                    onDragStart={(e) => general && handleDragStart(e, general, slotIndex)}
                  >
                    {general ? (
                      <div className="relative w-full h-full group pointer-events-none"> {/* pointer-events-none so drag starts on parent div */}
                        <img 
                          src={general.imageUrl} 
                          alt={general.name} 
                          className="w-full h-full object-cover rounded opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-80"></div>
                        <div className="absolute bottom-1 left-2 text-white font-bold text-xs shadow-black drop-shadow-md z-10">
                          {general.name}
                        </div>
                        <div className="absolute top-1 left-1 bg-black/50 rounded-full px-1.5 text-[10px] text-gold border border-gold/30 z-10">
                          {general.cost}
                        </div>
                        
                        {/* Affix Buffs Icon */}
                        {(affixBuffs[general.id]?.length > 0) && (
                          <div className="absolute bottom-1 right-1 group/buff z-20 pointer-events-auto">
                            <span className="material-symbols-outlined text-gold text-sm drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] cursor-help">keyboard_double_arrow_up</span>
                            <div className="absolute hidden group-hover/buff:block bottom-full right-0 mb-1 w-48 bg-zinc-900 border border-gold/30 rounded p-2 shadow-xl pointer-events-none">
                              <div className="text-xs font-bold text-gold mb-1 border-b border-gold/20 pb-1">获得增益</div>
                              {affixBuffs[general.id].map((b, i) => (
                                <div key={i} className="text-[10px] text-slate-300 flex justify-between py-0.5">
                                  <span>来自 {b.sourceGeneralName}</span>
                                  <span className="text-green-400">
                                    {getAffixAttributeText(b.attribute)} {b.valueType === 'fixed' ? `+${b.value}` : `+${b.value}%`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent drag start
                            handleRemoveGeneral(general.id);
                          }}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 pointer-events-auto z-30"
                        >
                          <span className="material-symbols-outlined text-[10px] block">close</span>
                        </button>
                      </div>
                    ) : (
                      !isHidden && (
                        <span className="text-zinc-700 font-mono text-[10px] select-none">
                          {isPreviewCovered ? (isValidDrop ? '放置' : '不可用') : '空置'}
                        </span>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const totalCost = currentSquad.placements.reduce((sum, p) => {
    const g = generals.find(gen => gen.id === p.generalId);
    return sum + (g?.cost || 0);
  }, 0);

  const filteredGenerals = generals.filter(g => {
    if (costFilter === 'All') return true;
    return g.cost === costFilter;
  });

  return (
    <div className="relative flex h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-hidden cloud-pattern text-slate-900 dark:text-slate-100 font-display">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Squads & Formations */}
        <aside className="w-64 bg-zinc-900/90 border-r border-gold/20 flex flex-col z-20 backdrop-blur-md shrink-0">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-gold font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">flag</span> 军团编队
            </h2>
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map(id => (
                <div key={id} className="relative group">
                  <button
                    onClick={() => setCurrentSquadId(id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded transition-all ${
                      currentSquadId === id 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20 font-bold' 
                        : 'bg-zinc-800 text-slate-400 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    <span>{squads[id].name}</span>
                    {currentSquadId === id && (
                      <span 
                        className="material-symbols-outlined text-sm cursor-pointer hover:text-gold"
                        onClick={(e) => {
                          e.stopPropagation();
                          startRenaming();
                        }}
                      >
                        edit
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">阵型选择</h3>
            <div className="space-y-2">
              {(Object.keys(FORMATIONS) as FormationType[]).map(type => (
                <button
                  key={type}
                  onClick={() => currentSquad.formation !== type && handleFormationChange(type)}
                  className={`w-full text-left px-4 py-3 rounded border transition-all flex items-center justify-between ${
                    currentSquad.formation === type
                      ? 'border-gold text-gold bg-gold/5'
                      : 'border-zinc-700 text-slate-400 hover:border-zinc-500'
                  }`}
                >
                  <span>{FORMATION_NAMES[type]}</span>
                  {currentSquad.formation === type && <span className="material-symbols-outlined text-sm">check</span>}
                </button>
              ))}
            </div>

            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-6 mb-3">阵型等级</h3>
            <div className="space-y-2">
              {[1, 2, 3].map(level => {
                const isUnlocked = level === 1 || (level === 2 && isLevel2Unlocked) || (level === 3 && isLevel3Unlocked);
                return (
                  <button
                    key={level}
                    onClick={() => isUnlocked && currentFormationLevel !== level && handleFormationLevelChange(level)}
                    disabled={!isUnlocked}
                    className={`w-full text-left px-4 py-3 rounded border transition-all flex items-center justify-between ${
                      currentFormationLevel === level
                        ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                        : isUnlocked
                          ? 'border-zinc-700 text-slate-400 hover:border-zinc-500'
                          : 'border-zinc-800 text-zinc-600 bg-zinc-900/50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">
                        {isUnlocked ? 'star' : 'lock'}
                      </span>
                      {level}级阵型
                    </div>
                    {currentFormationLevel === level && <span className="material-symbols-outlined text-sm">check</span>}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-8 p-4 bg-zinc-800/50 rounded border border-zinc-700/50">
              <p className="text-xs text-slate-500 mb-2">阵型说明</p>
              <p className="text-sm text-slate-300 leading-relaxed">
                {currentSquad.formation === 'straight' && '一字长蛇阵，全军横向展开，适合正面快速突击。'}
                {currentSquad.formation === 'conical' && '锥形阵，前锋尖锐，两翼层层递进，突破力极强。'}
                {currentSquad.formation === 'square' && '方圆阵，中军厚重，首尾呼应，防御力最强。'}
              </p>
            </div>
          </div>
          
          <div className="p-4 border-t border-zinc-800">
             <button 
               onClick={handleSave}
               className="w-full py-2 bg-gold text-black font-bold rounded hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
             >
               <span className="material-symbols-outlined">save</span> 保存布阵
             </button>
          </div>
        </aside>

        {/* Main Content: Grid & General List */}
        <main className="flex-1 flex flex-col relative overflow-hidden h-full">
          {/* Tactical Grid Area - Flexible Height */}
          <div className="flex-1 bg-zinc-950 relative overflow-y-auto custom-scrollbar flex flex-col">
            <div 
              className="absolute inset-0 opacity-30 pointer-events-none" 
              style={{ 
                backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDkNQa8EA4dAw7TGFhsMgPCzIk2QH43fSv-mfw4bvbFfKhgBlt2rZKz8BCSpA95tswcFVzh3Ggsr0xTkCPlU_VIqjc9viso15DqL8_UKjbv05k_pq2J8RK8nI6TnQDRvi2Fpw3lSKBVhXscfTUXvh8eRuUcZ9E6HwAUZ05QaHaqMAn-mM6OQRahVU0iFU5h8j1lnFH2eOKcS1A-yzcemxffTao0MDUBggrlqU8-yTOXU6uHx-Yw4nd2pfchMZnbPILf5KsItYZBvA")',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            ></div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="p-4 flex justify-between items-start shrink-0">
                 <div>
                   <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                     {currentSquad.name} - {FORMATIONS[currentSquad.formation].name}
                   </h1>
                   <p className="text-slate-400 text-sm">拖拽下方武将至阵型网格中，已上阵武将可拖动调整位置</p>
                 </div>
                 <div className="bg-black/40 backdrop-blur px-4 py-2 rounded border border-white/10 flex gap-4">
                   <div className="text-center">
                     <span className="block text-xs text-slate-500 uppercase">总Cost</span>
                     <span className="text-xl font-bold text-gold">{totalCost}</span>
                   </div>
                   <div className="w-px bg-white/10"></div>
                   <div className="text-center">
                     <span className="block text-xs text-slate-500 uppercase">武将数</span>
                     <span className="text-xl font-bold text-white">{currentSquad.placements.length}</span>
                   </div>
                 </div>
              </div>

              {/* The Grid - Center it vertically in remaining space */}
              <div className="flex-1 flex items-center justify-center overflow-auto">
                {renderGrid()}
              </div>
            </div>
          </div>

          {/* Bottom General List - Fixed Height, ensure visibility */}
          <div className="h-[280px] bg-zinc-900 border-t border-gold/20 flex flex-col shrink-0 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
            <div className="px-4 py-2 bg-black/20 flex justify-between items-center border-b border-white/5 shrink-0">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-300">武将列表 (拖拽上阵)</span>
                <div className="flex bg-zinc-800 rounded p-0.5 border border-zinc-700">
                  <button 
                    onClick={() => setCostFilter('All')}
                    className={`px-3 py-0.5 text-xs rounded transition-colors ${costFilter === 'All' ? 'bg-primary text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    全部
                  </button>
                  {[1, 2, 3].map(cost => (
                    <button 
                      key={cost}
                      onClick={() => setCostFilter(cost)}
                      className={`px-3 py-0.5 text-xs rounded transition-colors ${costFilter === cost ? 'bg-primary text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                      Cost {cost}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-xs text-slate-500">
                共 {filteredGenerals.length} 名武将
              </div>
            </div>
            <div className="flex-1 overflow-x-auto p-4 flex gap-4 items-center scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {filteredGenerals.map(general => {
                const isDeployed = isGeneralDeployed(general.id);
                return (
                  <GeneralCard 
                    key={general.id} 
                    general={general} 
                    isDeployed={isDeployed}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, general)}
                    onDeploy={(g) => handleQuickDeploy(g)}
                    onClick={(g) => setSelectedGeneral(g)}
                  />
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* Rename Modal */}
      {isRenaming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-gold/30 p-6 rounded-lg shadow-2xl w-80">
            <h3 className="text-gold font-bold text-lg mb-4">修改阵容名称</h3>
            <input 
              type="text" 
              value={tempSquadName}
              onChange={(e) => setTempSquadName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white mb-4 focus:border-primary outline-none"
              placeholder="输入新名称"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsRenaming(false)}
                className="px-4 py-2 text-slate-400 hover:text-white text-sm"
              >
                取消
              </button>
              <button 
                onClick={saveSquadName}
                className="px-4 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-primary/90"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* General Detail Modal */}
      <GeneralDetailModal 
        general={selectedGeneral} 
        onClose={() => setSelectedGeneral(null)} 
      />
    </div>
  );
}
