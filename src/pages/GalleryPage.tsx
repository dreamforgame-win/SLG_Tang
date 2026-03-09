import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { General } from '../data/generals';
import Header from '../components/Header';
import GeneralDetailModal from '../components/GeneralDetailModal';

export default function GalleryPage() {
  const { generals } = useGame();
  const [filter, setFilter] = useState<'All' | 'Infantry' | 'Cavalry' | 'Archer' | 'Strategy'>('All');
  const [selectedGeneral, setSelectedGeneral] = useState<General | null>(null);

  const filteredGenerals = filter === 'All' 
    ? generals 
    : generals.filter(g => g.type === filter);

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
    <div className="relative flex flex-col min-h-screen w-full overflow-x-hidden bg-background-dark text-slate-100 font-display guofeng-pattern">
      <Header />
      
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-20 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">贞观名臣 · 凌烟之首</h2>
            <p className="text-slate-400">汇聚盛唐开国元勋与中兴名将，重现千古风华</p>
          </div>
          <div className="flex bg-primary/5 p-1 rounded-xl border border-primary/10">
            {['All', 'Infantry', 'Cavalry', 'Archer', 'Strategy'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f 
                    ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20' 
                    : 'hover:bg-primary/10 text-slate-400 hover:text-primary'
                }`}
              >
                {f === 'All' ? '全部' : f === 'Infantry' ? '步兵' : f === 'Cavalry' ? '骑兵' : f === 'Archer' ? '弓兵' : '谋士'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredGenerals.map(general => (
            <div 
              key={general.id}
              onClick={() => setSelectedGeneral(general)}
              className={`relative group aspect-[3/4] rounded-xl overflow-hidden border border-primary/20 bg-background-dark shadow-xl hover:border-primary/50 transition-all duration-300 cursor-pointer ${general.status === 'Locked' ? 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100' : ''}`}
            >
              {general.status === 'Locked' && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <span className="material-symbols-outlined text-white/50 text-4xl">lock</span>
                </div>
              )}
              
              <img 
                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${general.status === 'Locked' ? '' : 'opacity-80 group-hover:opacity-100'}`}
                src={general.imageUrl}
                alt={general.name}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none"></div>
              
              {general.status !== 'Locked' ? (
                <>
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary/90 text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase backdrop-blur-sm border border-white/20">
                    <span className="material-symbols-outlined text-[12px]">{getIcon(general.type)}</span> {getChineseType(general.type)}
                  </div>
                  <div className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-amber-500/20 rounded-full backdrop-blur-md border border-amber-500/50 shadow-inner">
                    <span className="text-amber-400 font-bold text-sm">{general.cost}</span>
                  </div>
                  
                  {/* Red Dot for Available Points */}
                  {(general.availablePoints || 0) > 0 && (
                    <div className="absolute top-1 right-1 w-3 h-3 bg-red-600 rounded-full border border-zinc-900 z-20 animate-pulse shadow-lg shadow-red-500/50"></div>
                  )}

                  <div className="absolute bottom-4 left-0 w-full text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className="text-[10px] bg-black/60 text-gold border border-gold/30 px-1 rounded font-mono">Lv.{general.level || 1}</span>
                      <span className="text-white text-xl font-bold tracking-widest drop-shadow-md">{general.name}</span>
                    </div>
                    <div className="w-8 h-0.5 bg-primary mx-auto mt-1"></div>
                  </div>
                </>
              ) : (
                <>
                   <div className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-slate-500/20 rounded-full backdrop-blur-md border border-slate-500/50">
                    <span className="text-slate-400 font-bold text-sm">?</span>
                  </div>
                  <div className="absolute bottom-4 left-0 w-full text-center">
                    <span className="text-white/40 text-lg font-bold tracking-widest">待解锁</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <footer className="mt-12 py-8 border-t border-primary/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-slate-500 text-sm">
            已收集名将: <span className="text-primary font-bold">{generals.filter(g => g.status !== 'Locked').length}</span> / 48
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-30" disabled>
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="px-4 py-1 text-sm font-bold text-white bg-primary rounded">1</button>
            <button className="px-4 py-1 text-sm font-bold text-slate-400 hover:text-white transition-colors">2</button>
            <button className="px-4 py-1 text-sm font-bold text-slate-400 hover:text-white transition-colors">3</button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-primary/10 text-primary hover:bg-primary/20">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </footer>
      </main>

      <GeneralDetailModal 
        general={selectedGeneral} 
        onClose={() => setSelectedGeneral(null)} 
      />
    </div>
  );
}
