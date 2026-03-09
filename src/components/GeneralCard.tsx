import React from 'react';
import { General } from '../data/generals';

interface GeneralCardProps {
  general: General;
  onDeploy?: (general: General) => void;
  isDeployed?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, general: General) => void;
  onClick?: (general: General) => void;
}

const GeneralCard: React.FC<GeneralCardProps> = ({ general, onDeploy, isDeployed, draggable, onDragStart, onClick }) => {
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
      case 'Infantry': return '步';
      case 'Cavalry': return '骑';
      case 'Archer': return '弓';
      case 'Strategy': return '谋';
      default: return '?';
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, general);
    }
    // Set drag image or data if needed specifically here, but usually parent handles dataTransfer setup via callback
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  return (
    <div 
      onClick={() => onClick && onClick(general)}
      className={`min-w-[140px] w-[140px] flex-shrink-0 snap-start group relative bg-zinc-900 border rounded-lg overflow-hidden transition-all 
        ${isDeployed 
          ? 'border-zinc-700 opacity-50 grayscale cursor-not-allowed' 
          : 'border-gold/20 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 cursor-grab active:cursor-grabbing'
        }
      `}
      draggable={draggable && !isDeployed}
      onDragStart={handleDragStart}
    >
      {/* Header Info */}
      <div className="absolute top-1 left-1 z-10 bg-primary/80 backdrop-blur-sm text-white px-1.5 py-0.5 text-[10px] font-bold rounded flex items-center gap-1 border border-primary">
        <span className="material-symbols-outlined text-[12px]">{getIcon(general.type)}</span> {getChineseType(general.type)}
      </div>
      <div className="absolute top-1 right-1 z-10 bg-jade/90 text-white px-1.5 py-0.5 text-[10px] font-bold rounded-full border border-gold/30 flex items-center gap-1">
        <span className="material-symbols-outlined text-[12px]">grid_view</span> {general.cost}
      </div>

      {/* Red Dot for Available Points */}
      {(general.availablePoints || 0) > 0 && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-zinc-900 z-20 animate-pulse shadow-lg shadow-red-500/50"></div>
      )}
      
      {/* Portrait */}
      <div 
        className="aspect-[3/4] w-full bg-cover bg-center transition-transform group-hover:scale-105" 
        style={{ backgroundImage: `url("${general.imageUrl}")` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
      </div>
      
      {/* Card Content */}
      <div className="absolute bottom-0 inset-x-0 p-2 text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <span className="text-[10px] bg-black/60 text-gold border border-gold/30 px-1 rounded font-mono">Lv.{general.level || 1}</span>
          <span className="text-white text-sm font-bold text-shadow-gold tracking-widest">{general.name}</span>
        </div>
        {onDeploy && (
          <button 
            onClick={() => !isDeployed && onDeploy(general)}
            disabled={isDeployed}
            className={`w-full border text-[10px] font-bold py-1 rounded transition-all backdrop-blur-md ${
              isDeployed 
                ? 'bg-zinc-800/50 border-zinc-700 text-zinc-500'
                : 'bg-zinc-100/10 hover:bg-primary border-white/20 hover:border-primary text-white'
            }`}
          >
            {isDeployed ? '已上阵' : '上阵'}
          </button>
        )}
      </div>
    </div>
  );
};

export default GeneralCard;
