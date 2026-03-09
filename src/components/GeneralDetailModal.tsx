import React, { useState } from 'react';
import { General } from '../data/generals';
import { useGame } from '../context/GameContext';
import StatAllocationModal from './StatAllocationModal';
import { getAffixText } from '../utils/affixLogic';

interface GeneralDetailModalProps {
  general: General | null;
  onClose: () => void;
}

export default function GeneralDetailModal({ general: initialGeneral, onClose }: GeneralDetailModalProps) {
  const { generals, getGeneralStats, getExpForLevel, resetAffixes } = useGame();
  const [showAllocation, setShowAllocation] = useState(false);

  if (!initialGeneral) return null;

  // Find the latest version of the general from context
  const general = generals.find(g => g.id === initialGeneral.id) || initialGeneral;
  const stats = getGeneralStats(general.id);

  const currentLevelExp = getExpForLevel(general.level);
  const nextLevelExp = getExpForLevel(general.level + 1);
  const levelProgress = general.exp - currentLevelExp;
  const levelTotal = nextLevelExp - currentLevelExp;
  const progressPercent = Math.min(100, Math.max(0, (levelProgress / levelTotal) * 100));

  const getIcon = (type: string) => {
    switch (type) {
      case 'Infantry': return 'swords';
      case 'Cavalry': return 'shield';
      case 'Archer': return 'keyboard_double_arrow_up';
      case 'Strategy': return 'psychology';
      default: return 'help';
    }
  };

  const getChineseType = (type: string) => {
    switch (type) {
      case 'Infantry': return '步兵';
      case 'Cavalry': return '骑兵';
      case 'Archer': return '弓兵';
      case 'Strategy': return '谋略';
      default: return '?';
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 sm:p-8">
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
          onClick={onClose}
        ></div>
        
        <div className="relative w-full max-w-5xl bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-gold/30 flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95 duration-200">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-primary hover:text-white transition-colors border border-white/10"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          {/* Left: Portrait */}
          <div className="w-full md:w-5/12 lg:w-1/2 relative min-h-[300px] md:min-h-full bg-zinc-800">
             <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url("${general.imageUrl}")` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-zinc-900"></div>
            
            <div className="absolute bottom-4 left-4 z-10">
               <h2 className="text-4xl md:text-5xl font-bold text-white tracking-widest text-shadow-gold font-display">{general.name}</h2>
               <p className="text-slate-400 text-sm mt-1 max-w-[80%]">{general.description}</p>
            </div>
          </div>

          {/* Right: Info */}
          <div className="w-full md:w-7/12 lg:w-1/2 p-6 md:p-8 overflow-y-auto bg-zinc-900 text-slate-100 flex flex-col gap-6 scrollbar-hide">
            
            {/* Row 1: Name, Type, Cost */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-primary/20 px-3 py-1 rounded-lg border border-primary/30 text-primary">
                  <span className="material-symbols-outlined">{getIcon(general.type)}</span>
                  <span className="font-bold">{getChineseType(general.type)}</span>
                </div>
                <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/30 text-amber-500">
                  <span className="material-symbols-outlined">grid_view</span>
                  <span className="font-bold">Cost: {general.cost}</span>
                </div>
              </div>
              <div className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${general.status === 'Locked' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                {general.status === 'Locked' ? '未解锁' : '已获得'}
              </div>
            </div>

            {/* Row 2: Level & Exp */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">等级</span>
                <span className="text-2xl font-bold text-white font-mono">Lv.{general.level}</span>
              </div>
              <div className="h-4 bg-zinc-800 rounded-full overflow-hidden border border-white/5 relative">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-orange-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-white drop-shadow">
                  {levelProgress} / {levelTotal}
                </div>
              </div>
            </div>

            {/* Row 3: Stats */}
            <div className="relative bg-zinc-800/50 p-4 rounded-xl border border-white/5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">基础属性</h3>
                {(general.availablePoints || 0) > 0 && (
                  <button 
                    onClick={() => setShowAllocation(true)}
                    className="relative px-3 py-1 bg-gold text-black text-xs font-bold rounded hover:bg-yellow-400 flex items-center gap-1 animate-pulse"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    加点 ({general.availablePoints})
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border border-white z-10"></div>
                  </button>
                )}
                {(general.availablePoints || 0) === 0 && general.level >= 10 && (
                   <button 
                    onClick={() => setShowAllocation(true)}
                    className="px-3 py-1 bg-zinc-700 text-slate-400 text-xs font-bold rounded hover:bg-zinc-600 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    调整
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                <StatItem label="兵力" value={stats.maxHp} icon="health_and_safety" color="text-green-500" />
                <StatItem label="武力" value={stats.strength} icon="swords" color="text-red-400" />
                <StatItem label="谋略" value={stats.strategy} icon="psychology" color="text-blue-400" />
                <StatItem label="防御" value={stats.defense} icon="shield" color="text-zinc-400" />
                <StatItem label="攻速" value={stats.speed} icon="speed" color="text-yellow-400" />
              </div>
            </div>

            {/* Row 4+: Skills */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gold border-l-4 border-gold pl-3">武将技能</h3>
              
              <div className="bg-zinc-800 p-4 rounded-xl border border-primary/20 relative overflow-hidden group hover:border-primary/50 transition-colors">
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">{general.skill?.type || '未知'}</div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-zinc-700 flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      {general.skill?.type === '主动' ? 'swords' : general.skill?.type === '被动' ? 'shield' : general.skill?.type === '突击' ? 'bolt' : 'flag'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">{general.skill?.name || '未知技能'}</h4>
                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">{general.skill?.description || '暂无描述'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 5: Affixes */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-l-4 border-gold pl-3">
                <h3 className="text-lg font-bold text-gold">随机词条</h3>
                <button 
                  onClick={() => resetAffixes(general.id)}
                  className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold rounded flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  重置词条
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {general.affixes?.map((affix, idx) => (
                  <div key={idx} className="bg-zinc-800 p-3 rounded-lg border border-white/5 flex items-center gap-3">
                    <span className="material-symbols-outlined text-gold text-lg">auto_awesome</span>
                    <span className="text-sm text-slate-300">{getAffixText(affix)}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {showAllocation && (
        <StatAllocationModal 
          general={general} 
          onClose={() => setShowAllocation(false)} 
        />
      )}
    </>
  );
}

function StatItem({ label, value, icon, color }: { label: string, value: number, icon: string, color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`material-symbols-outlined ${color}`}>{icon}</span>
      <span className="text-slate-400 text-xs">{label}</span>
      <span className="text-white font-bold font-mono text-lg">{value}</span>
    </div>
  );
}
