import React, { useState } from 'react';
import Header from '../components/Header';
import { useGame, Level } from '../context/GameContext';
import DeploymentModal from '../components/DeploymentModal';
import BattleScene from '../components/BattleScene';

const EXP_REWARDS: Record<number, number> = {
  1: 150,
  2: 300,
  3: 800,
  4: 2500,
  5: 8000,
  6: 25000,
  7: 60000,
  8: 120000,
  9: 200000,
  10: 350000
};

export default function ConquestPage() {
  const { squads, generals, addExpToGeneral, levels, completeLevel } = useGame();
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [showDeployment, setShowDeployment] = useState(false);
  const [showBattle, setShowBattle] = useState(false);
  const [battleSquadId, setBattleSquadId] = useState<number | null>(null);

  const handleLevelClick = (level: Level) => {
    if (level.status === 'locked') return;
    setSelectedLevel(level);
  };

  const handleDeployClick = () => {
    setShowDeployment(true);
  };

  const handleConfirmDeploy = (squadId: number) => {
    setShowDeployment(false);
    setBattleSquadId(squadId);
    setShowBattle(true);
  };

  const handleBattleVictory = () => {
    if (!selectedLevel || !battleSquadId) return;

    const squad = squads[battleSquadId];
    const expGain = EXP_REWARDS[selectedLevel.level] || 100;
    const leveledUpGenerals: string[] = [];

    // Apply exp to all generals in squad
    squad.placements.forEach(placement => {
      const general = generals.find(g => g.id === placement.generalId);
      if (general) {
        // Check for potential level up
        if (general.exp + expGain >= general.maxExp) {
          leveledUpGenerals.push(general.name);
        }
        addExpToGeneral(general.id, expGain);
      }
    });

    // Complete the level (unlock next)
    completeLevel(selectedLevel.id);

    // Show toast
    const toast = document.createElement('div');
    toast.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-zinc-900/95 text-white px-8 py-6 rounded-xl shadow-2xl z-[100] border border-gold/50 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300';
    
    let levelUpHtml = '';
    if (leveledUpGenerals.length > 0) {
      levelUpHtml = `
        <div class="w-full h-px bg-white/10 my-1"></div>
        <div class="text-gold font-bold animate-pulse">
          ${leveledUpGenerals.join(', ')} 升级了！
        </div>
      `;
    }

    toast.innerHTML = `
      <div class="flex items-center gap-3 text-xl font-bold text-primary">
        <span class="material-symbols-outlined text-3xl">swords</span> 
        <span>出征胜利！</span>
      </div>
      <div class="text-slate-300">
        获得经验 <span class="text-white font-mono font-bold text-lg">+${expGain}</span>
      </div>
      ${levelUpHtml}
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity');
      setTimeout(() => document.body.removeChild(toast), 500);
    }, 3000);

    setShowBattle(false);
    setSelectedLevel(null);
    setBattleSquadId(null);
  };

  const handleBattleDefeat = () => {
    // Show defeat toast
    const toast = document.createElement('div');
    toast.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-zinc-900/95 text-white px-8 py-6 rounded-xl shadow-2xl z-[100] border border-red-500/50 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300';
    
    toast.innerHTML = `
      <div class="flex items-center gap-3 text-xl font-bold text-red-500">
        <span class="material-symbols-outlined text-3xl">sentiment_very_dissatisfied</span> 
        <span>出征失败</span>
      </div>
      <div class="text-slate-300">
        胜败乃兵家常事，请整顿兵马再战！
      </div>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity');
      setTimeout(() => document.body.removeChild(toast), 500);
    }, 3000);

    setShowBattle(false);
    // Do not clear selected level so user can try again easily
    setBattleSquadId(null);
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <Header />
      
      <main className="relative flex-1 bg-tang-black overflow-hidden">
        {/* Background Map */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-overlay" 
          style={{ 
            backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAKIFUEl0iKziOG2yQ9CEeaJqmB1umqAoLR_Cjt8-x5a1rt4qrpWxjij5rb9iaC4IT0JFAH9SVDJ6ZBi3ejMib-D6sHT9iD7_sYnvVLuU32K6DELni58nxSWK6yLAsqQPo4lrRYvpnQRXnbUW1zoVcUgZp5dCFi_UpAPfmOO9ygKVUElBxRvP8jGDAg9rK1J-m4UnCpsXHFn9NT-ULnP613M-UzSiPJsxitTnj99Cy2_whdwiDEVTALnwafe7j1N-U5nnLHMFoi1w")' 
          }}
        ></div>
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-background-dark/80"></div>
        
        {/* Path SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 drop-shadow-[0_0_8px_rgba(238,59,43,0.4)]" preserveAspectRatio="none" viewBox="0 0 1000 1000">
          <path d="M100,850 C250,800 300,600 500,550 S750,400 900,150" fill="none" stroke="#ee3b2b" strokeDasharray="10 5" strokeWidth="3"></path>
        </svg>

        {/* Levels */}
        <div className="absolute inset-0">
          {levels.map((level) => {
            const isLocked = level.status === 'locked';
            const isCleared = level.status === 'cleared';
            const isCurrent = level.status === 'unlocked';
            
            return (
              <div 
                key={level.id}
                className={`absolute flex flex-col items-center gap-2 group cursor-pointer transition-all duration-300 ${isLocked ? 'opacity-50 grayscale' : 'opacity-100'} ${isCurrent ? 'scale-110' : ''}`}
                style={level.position}
                onClick={() => handleLevelClick(level)}
              >
                <div className="relative flex items-center justify-center">
                  {isCurrent && <div className="absolute -inset-4 bg-primary/10 rounded-full blur-xl animate-pulse"></div>}
                  {level.type === 'palace' && <div className="absolute -inset-8 bg-gold/10 rounded-full blur-2xl animate-pulse"></div>}
                  
                  <div className={`
                    rounded-full border-2 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105
                    ${level.type === 'palace' ? 'size-28 border-4 border-gold bg-tang-black/90' : 'size-16 sm:size-20 bg-tang-black/80'}
                    ${isCurrent ? 'border-primary shadow-[0_0_20px_rgba(238,59,43,0.4)]' : ''}
                    ${isCleared ? 'border-gold/50' : ''}
                    ${isLocked ? 'border-slate-600' : ''}
                  `}>
                    <span className={`material-symbols-outlined ${level.type === 'palace' ? 'text-6xl text-gold' : 'text-3xl'} ${isCurrent ? 'text-primary' : (isCleared ? 'text-gold' : 'text-slate-500')}`}>
                      {level.icon}
                    </span>
                  </div>
                  
                  {isCleared && (
                    <div className="absolute -top-1 -right-1 bg-gold text-black rounded-full p-0.5 border border-white shadow-sm">
                      <span className="material-symbols-outlined text-xs font-bold block">check</span>
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <p className={`text-[10px] font-bold uppercase tracking-tighter ${isCurrent ? 'text-primary' : (isCleared ? 'text-gold' : 'text-slate-500')}`}>
                    Lv.{level.level}
                  </p>
                  <h3 className={`font-display font-bold tracking-widest text-shadow-sm ${level.type === 'palace' ? 'text-xl text-gold' : 'text-sm text-slate-200'}`}>
                    {level.name}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Objective Panel */}
        <div className="absolute top-8 left-8 flex flex-col gap-4 z-20">
          <div className="bg-background-dark/90 p-4 border-l-4 border-primary rounded-r-lg backdrop-blur-sm shadow-2xl min-w-[280px]">
            <h4 className="text-primary text-xs font-bold tracking-widest uppercase mb-1">当前目标</h4>
            <p className="text-slate-100 font-bold text-lg">攻占洛阳关隘</p>
            <div className="w-full bg-slate-800 h-1.5 mt-3 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[65%] relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 uppercase flex justify-between">
              <span>进度</span>
              <span className="text-primary font-mono">65%</span>
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <button className="flex size-10 items-center justify-center rounded-lg bg-background-dark/80 border border-slate-700 text-slate-300 hover:text-primary hover:border-primary transition-all shadow-lg">
              <span className="material-symbols-outlined">zoom_in</span>
            </button>
            <button className="flex size-10 items-center justify-center rounded-lg bg-background-dark/80 border border-slate-700 text-slate-300 hover:text-primary hover:border-primary transition-all shadow-lg">
              <span className="material-symbols-outlined">zoom_out</span>
            </button>
            <button className="flex size-10 items-center justify-center rounded-lg bg-background-dark/80 border border-slate-700 text-slate-300 hover:text-primary hover:border-primary transition-all shadow-lg">
              <span className="material-symbols-outlined">explore</span>
            </button>
          </div>
        </div>
        
        {/* Level Detail Modal (Simplified) */}
        {selectedLevel && !showDeployment && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-zinc-900/95 border border-gold/30 p-6 rounded-xl shadow-2xl z-50 w-80 backdrop-blur-md">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-gold uppercase tracking-widest mb-1">Lv.{selectedLevel.level} 据点</p>
                <h3 className="text-xl font-bold text-white">{selectedLevel.name}</h3>
              </div>
              <button onClick={() => setSelectedLevel(null)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">推荐战力</span>
                <span className="text-primary font-mono font-bold">12,500</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">敌军数量</span>
                <span className="text-white font-mono">3,000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">掉落奖励</span>
                <div className="flex gap-1">
                  <span className="material-symbols-outlined text-gold text-sm">database</span>
                  <span className="material-symbols-outlined text-purple-400 text-sm">diamond</span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleDeployClick}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined">swords</span>
              立即出征
            </button>
          </div>
        )}

      </main>

      {showDeployment && selectedLevel && (
        <DeploymentModal 
          level={selectedLevel} 
          onClose={() => setShowDeployment(false)} 
          onDeploy={handleConfirmDeploy} 
        />
      )}

      {showBattle && selectedLevel && battleSquadId && (
        <BattleScene 
          playerSquadId={battleSquadId}
          landLevel={selectedLevel.level}
          onVictory={handleBattleVictory}
          onDefeat={handleBattleDefeat}
          onClose={() => setShowBattle(false)}
        />
      )}
    </div>
  );
}
