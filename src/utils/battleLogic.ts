import { General, generals } from '../data/generals';
import { FormationType, Squad, Placement } from '../context/GameContext';
import { calculateAffixBuffs } from './affixLogic';

// --- Constants ---
export const BATTLE_TICK_RATE = 30; // Ticks per second
export const ATTACK_GAUGE_MAX = 100;

// --- Types ---
export const FORMATION_NAMES: Record<FormationType, string> = {
  'straight': '一字长蛇阵',
  'conical': '锥形冲阵',
  'square': '方圆固守阵'
};

export interface FloatingTextEvent {
  id: number;
  text: string;
  type: 'damage' | 'heal' | 'crit';
  timestamp: number; // To help with cleanup
  xOffset: number; // Random X offset from center
  yOffset: number; // Random Y offset from center
}

export interface Projectile {
  id: number;
  attackerId: string;
  targetId: string;
  damage: number;
  progress: number; // 0 to 1
  speed: number;
  type?: 'normal' | 'skill';
}

export interface Buff {
  id: string;
  type: 'immuneControl' | 'statsBoost' | 'defenseBoost' | 'damageReduction' | 'weakness' | 'defenseDown' | 'panic' | 'evasion' | 'taunt' | 'silence' | 'burn' | 'combo' | 'attackSpeedDown' | 'damageBoost' | 'shareDamage';
  value?: number;
  duration?: number; // in seconds
  timer?: number; // internal timer
  sourceId?: string;
}

export interface BattleUnit extends General {
  instanceId: string; // Unique ID for battle (since multiple same generals can exist)
  currentHp: number;
  maxHp: number;
  currentGauge: number;
  row: number; // 0 = Front, 1 = Mid, 2 = Back
  col: number; // Index in the row (visual start index)
  isDead: boolean;
  side: 'player' | 'enemy';
  targetId?: string; // For animation
  isAttacking?: boolean; // For animation
  floatingTexts: FloatingTextEvent[]; // For damage numbers
  
  // Skill related
  attackCount: number;
  skillTimer: number;
  hpThresholdTriggered: boolean;
  shield: number;
  buffs: Buff[];
  isSkillCasting?: boolean;
  skillText?: string;
  skillTextTimer?: number;
  attackAnimTimer?: number;
}

export interface BattleState {
  playerUnits: BattleUnit[];
  enemyUnits: BattleUnit[];
  projectiles: Projectile[];
  playerFormation: FormationType;
  playerFormationLevel: number;
  enemyFormation: FormationType;
  enemyFormationLevel: number;
  status: 'fighting' | 'victory' | 'defeat';
  logs: string[];
}

// --- Formulas ---

export const calculateMaxHp = (level: number): number => {
  return Math.floor(1000 + (level - 1) * 183.67);
};

export const calculateDamage = (attacker: BattleUnit, defender: BattleUnit, isStrategy: boolean = false, ignoreDefense: boolean = false): number => {
  // Calculate effective stats
  let effStrength = attacker.strength;
  let effStrategy = attacker.strategy;
  let effDefense = defender.defense;
  
  let damageBoost = 0;
  let damageReduction = 0;
  
  attacker.buffs.forEach(b => {
    if (b.type === 'statsBoost') {
      effStrength += b.value || 0;
      effStrategy += b.value || 0;
    }
    if (b.type === 'damageBoost') damageBoost += b.value || 0;
    if (b.type === 'weakness') damageReduction += 1; // 100% reduction
  });
  
  defender.buffs.forEach(b => {
    if (b.type === 'statsBoost') effDefense += b.value || 0;
    if (b.type === 'defenseBoost') effDefense += b.value || 0;
    if (b.type === 'defenseDown') effDefense -= b.value || 0;
    if (b.type === 'damageReduction') damageReduction += b.value || 0;
  });
  
  effDefense = Math.max(0, effDefense);
  
  let baseDamage = 0;
  if (isStrategy) {
    baseDamage = Math.max(10, effStrategy - (ignoreDefense ? 0 : effDefense * 0.2));
  } else {
    baseDamage = Math.max(10, effStrength - (ignoreDefense ? 0 : effDefense * 0.2));
  }
  
  let finalDamage = baseDamage * (1 + damageBoost) * Math.max(0, 1 - damageReduction);
  const randomFactor = 0.95 + Math.random() * 0.1;
  return Math.floor(finalDamage * randomFactor);
};

// --- Enemy Generation ---

const LEVEL_MAPPING: Record<number, number> = {
  1: 1, 2: 4, 3: 8, 4: 13, 5: 22, 
  6: 28, 7: 33, 8: 38, 9: 45, 10: 50
};

export const FORMATIONS: Record<FormationType, Record<number, number[]>> = {
  'straight': {
    1: [6],
    2: [9],
    3: [12]
  },
  'conical': {
    1: [1, 2, 3],
    2: [2, 3, 4],
    3: [3, 4, 5]
  },
  'square': {
    1: [2, 3, 2],
    2: [3, 4, 3],
    3: [4, 5, 4]
  }
};

const FORMATION_KEYS: FormationType[] = ['straight', 'conical', 'square'];

export const generateEnemySquad = (landLevel: number): { units: BattleUnit[], formation: FormationType, formationLevel: number } => {
  const enemyLevel = LEVEL_MAPPING[landLevel] || 1;
  const formationType = FORMATION_KEYS[Math.floor(Math.random() * FORMATION_KEYS.length)];
  
  let formationLevel = 1;
  if (landLevel >= 3 && landLevel <= 6) formationLevel = 2;
  else if (landLevel >= 7) formationLevel = 3;

  const rows = FORMATIONS[formationType][formationLevel];
  
  const units: BattleUnit[] = [];
  
  rows.forEach((capacity, rowIndex) => {
    let currentUsage = 0;
    
    // Try to fill the row
    while (currentUsage < capacity) {
      const remaining = capacity - currentUsage;
      
      // Filter generals that fit in remaining space
      const availableGenerals = generals.filter(g => g.cost <= remaining && g.status !== 'Locked');
      
      if (availableGenerals.length === 0) {
        // No general fits (shouldn't happen if we have cost 1 generals, but safety break)
        break;
      }

      // Pick random general
      const template = availableGenerals[Math.floor(Math.random() * availableGenerals.length)];
      
      // Calculate stats based on level
      const baseStats = [
        { name: 'strength', val: template.strength },
        { name: 'strategy', val: template.strategy },
        { name: 'defense', val: template.defense },
        { name: 'speed', val: template.speed }
      ].sort((a, b) => {
        if (b.val !== a.val) return b.val - a.val;
        return a.name.localeCompare(b.name);
      });

      const growthMap: Record<string, number> = {};
      baseStats.forEach((stat, index) => {
        if (index === 0) growthMap[stat.name] = 1.08;
        else if (index === 1) growthMap[stat.name] = 0.88;
        else growthMap[stat.name] = 0.68;
      });

      const calcStat = (base: number, name: string) => Math.floor(base + (enemyLevel - 1) * (growthMap[name] || 0.68));

      const maxHp = calculateMaxHp(enemyLevel);

      units.push({
        ...template,
        id: `enemy-${rowIndex}-${currentUsage}`, // Override ID
        instanceId: `enemy-${rowIndex}-${currentUsage}-${Math.random()}`,
        level: enemyLevel,
        exp: 0,
        maxExp: 0,
        strength: calcStat(template.strength, 'strength'),
        strategy: calcStat(template.strategy, 'strategy'),
        defense: calcStat(template.defense, 'defense'),
        speed: calcStat(template.speed, 'speed'),
        currentHp: maxHp,
        maxHp: maxHp,
        currentGauge: 0,
        row: rowIndex,
        col: currentUsage, // Visual start index
        isDead: false,
        side: 'enemy',
        skill: template.skill,
        floatingTexts: [], // Initialize floatingTexts
        attackCount: 0,
        skillTimer: 0,
        hpThresholdTriggered: false,
        shield: 0,
        buffs: []
      });

      currentUsage += template.cost;
    }
  });

  return { units, formation: formationType, formationLevel };
};

export const convertPlayerSquadToBattleUnits = (
  squad: Squad, 
  allGenerals: General[], 
  getStats: (id: string) => { strength: number, strategy: number, defense: number, speed: number, maxHp?: number }
): BattleUnit[] => {
  const units: BattleUnit[] = [];
  const rows = FORMATIONS[squad.formation][squad.formationLevel || 1];
  
  const affixBuffs = calculateAffixBuffs(squad.placements, allGenerals, rows);

  // We need to map linear placement index to row/col
  // Placements store 'startIndex'. 
  // We need to reconstruct the grid.
  
  let slotCounter = 0;
  rows.forEach((count, rowIndex) => {
    // Iterate through slots in this row
    for (let i = 0; i < count; i++) {
      const currentSlot = slotCounter + i;
      const placement = squad.placements.find(p => p.startIndex === currentSlot);
      
      if (placement) {
        const general = allGenerals.find(g => g.id === placement.generalId);
        if (general) {
          const stats = getStats(general.id);
          const maxHp = stats.maxHp || calculateMaxHp(general.level || 1);
          
          let strength = stats.strength;
          let strategy = stats.strategy;
          let defense = stats.defense;
          let speed = stats.speed;

          // Apply affix buffs
          const buffs = affixBuffs[general.id] || [];
          buffs.forEach(buff => {
            const applyBuff = (base: number) => {
              if (buff.valueType === 'fixed') return base + buff.value;
              return base * (1 + buff.value / 100);
            };

            switch (buff.attribute) {
              case 'strength': strength = applyBuff(strength); break;
              case 'strategy': strategy = applyBuff(strategy); break;
              case 'defense': defense = applyBuff(defense); break;
              case 'speed': speed = applyBuff(speed); break;
            }
          });
          
          units.push({
            ...general,
            instanceId: `player-${general.id}-${Math.random()}`,
            strength: Math.floor(strength),
            strategy: Math.floor(strategy),
            defense: Math.floor(defense),
            speed: Math.floor(speed),
            currentHp: maxHp,
            maxHp: maxHp,
            currentGauge: 0,
            row: rowIndex,
            col: i, // Relative column in row
            isDead: false,
            side: 'player',
            floatingTexts: [], // Initialize floatingTexts
            attackCount: 0,
            skillTimer: 0,
            hpThresholdTriggered: false,
            shield: 0,
            buffs: []
          });
        }
      }
    }
    slotCounter += count;
  });

  return units;
};
