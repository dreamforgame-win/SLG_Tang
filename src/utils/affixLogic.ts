import { General } from '../data/generals';

export type AffixTarget = 
  | 'self' 
  | 'left1' | 'right1' | 'left2' | 'right2'
  | 'front1_pos1' | 'front1_pos2'
  | 'back1_pos1' | 'back1_pos2'
  | 'row1_pos1' | 'row1_pos2'
  | 'row2_pos1' | 'row2_pos2'
  | 'row3_pos1' | 'row3_pos2';

export type AffixAttribute = 'hp' | 'strength' | 'strategy' | 'defense' | 'speed';
export type AffixValueType = 'fixed' | 'percent';

export interface Affix {
  target: AffixTarget;
  attribute: AffixAttribute;
  valueType: AffixValueType;
  value: number;
}

export const generateRandomAffix = (): Affix => {
  const targets: AffixTarget[] = [
    'self', 'left1', 'right1', 'left2', 'right2',
    'front1_pos1', 'front1_pos2', 'back1_pos1', 'back1_pos2',
    'row1_pos1', 'row1_pos2', 'row2_pos1', 'row2_pos2', 'row3_pos1', 'row3_pos2'
  ];
  const attributes: AffixAttribute[] = ['hp', 'strength', 'strategy', 'defense', 'speed'];
  const values = [5, 10, 15, 20];
  const valueTypes: AffixValueType[] = ['fixed', 'percent'];

  return {
    target: targets[Math.floor(Math.random() * targets.length)],
    attribute: attributes[Math.floor(Math.random() * attributes.length)],
    valueType: valueTypes[Math.floor(Math.random() * valueTypes.length)],
    value: values[Math.floor(Math.random() * values.length)]
  };
};

export const generateRandomAffixes = (): Affix[] => {
  return [generateRandomAffix(), generateRandomAffix(), generateRandomAffix()];
};

export const getAffixTargetText = (target: AffixTarget) => {
  const map: Record<AffixTarget, string> = {
    'self': '自身',
    'left1': '左边1位武将',
    'right1': '右边1位武将',
    'left2': '左边2位武将',
    'right2': '右边2位武将',
    'front1_pos1': '前1排第1位武将',
    'front1_pos2': '前1排第2位武将',
    'back1_pos1': '后1排第1位武将',
    'back1_pos2': '后1排第2位武将',
    'row1_pos1': '第1排第1位武将',
    'row1_pos2': '第1排第2位武将',
    'row2_pos1': '第2排第1位武将',
    'row2_pos2': '第2排第2位武将',
    'row3_pos1': '第3排第1位武将',
    'row3_pos2': '第3排第2位武将'
  };
  return map[target];
};

export const getAffixAttributeText = (attr: AffixAttribute) => {
  const map: Record<AffixAttribute, string> = {
    'hp': '血量',
    'strength': '武力',
    'strategy': '谋略',
    'defense': '防御',
    'speed': '攻速'
  };
  return map[attr];
};

export const getAffixText = (affix: Affix) => {
  const targetText = getAffixTargetText(affix.target);
  const attrText = getAffixAttributeText(affix.attribute);
  const valueText = affix.valueType === 'fixed' ? `+${affix.value}` : `+${affix.value}%`;
  return `${targetText} ${attrText} ${valueText}`;
};

export interface AffixBuff {
  sourceGeneralId: string;
  sourceGeneralName: string;
  attribute: AffixAttribute;
  valueType: AffixValueType;
  value: number;
}

export const calculateAffixBuffs = (
  placements: { generalId: string, startIndex: number }[],
  generals: General[],
  formationRows: number[]
): Record<string, AffixBuff[]> => {
  const buffs: Record<string, AffixBuff[]> = {};
  
  const getPos = (index: number) => {
    let r = 0;
    let c = index;
    for (let i = 0; i < formationRows.length; i++) {
      if (c < formationRows[i]) {
        r = i;
        break;
      }
      c -= formationRows[i];
    }
    return { row: r, col: c };
  };

  const getIndex = (row: number, col: number) => {
    if (row < 0 || row >= formationRows.length) return -1;
    if (col < 0 || col >= formationRows[row]) return -1;
    let index = 0;
    for (let i = 0; i < row; i++) {
      index += formationRows[i];
    }
    return index + col;
  };

  const grid: Record<number, General> = {};
  placements.forEach(p => {
    const g = generals.find(gen => gen.id === p.generalId);
    if (g) {
      for (let i = 0; i < g.cost; i++) {
        grid[p.startIndex + i] = g;
      }
    }
  });

  placements.forEach(p => {
    const sourceG = generals.find(gen => gen.id === p.generalId);
    if (!sourceG || !sourceG.affixes) return;

    const { row, col } = getPos(p.startIndex);

    sourceG.affixes.forEach(affix => {
      let targetIndices: number[] = [];

      switch (affix.target) {
        case 'self':
          targetIndices.push(p.startIndex);
          break;
        case 'left1':
          targetIndices.push(getIndex(row, col - 1));
          break;
        case 'right1':
          targetIndices.push(getIndex(row, col + sourceG.cost));
          break;
        case 'left2':
          targetIndices.push(getIndex(row, col - 2));
          break;
        case 'right2':
          targetIndices.push(getIndex(row, col + sourceG.cost + 1));
          break;
        case 'front1_pos1':
          targetIndices.push(getIndex(row - 1, 0));
          break;
        case 'front1_pos2':
          targetIndices.push(getIndex(row - 1, 1));
          break;
        case 'back1_pos1':
          targetIndices.push(getIndex(row + 1, 0));
          break;
        case 'back1_pos2':
          targetIndices.push(getIndex(row + 1, 1));
          break;
        case 'row1_pos1':
          targetIndices.push(getIndex(0, 0));
          break;
        case 'row1_pos2':
          targetIndices.push(getIndex(0, 1));
          break;
        case 'row2_pos1':
          targetIndices.push(getIndex(1, 0));
          break;
        case 'row2_pos2':
          targetIndices.push(getIndex(1, 1));
          break;
        case 'row3_pos1':
          targetIndices.push(getIndex(2, 0));
          break;
        case 'row3_pos2':
          targetIndices.push(getIndex(2, 1));
          break;
      }

      targetIndices.forEach(idx => {
        if (idx !== -1 && grid[idx]) {
          const targetG = grid[idx];
          if (!buffs[targetG.id]) buffs[targetG.id] = [];
          
          buffs[targetG.id].push({
            sourceGeneralId: sourceG.id,
            sourceGeneralName: sourceG.name,
            attribute: affix.attribute,
            valueType: affix.valueType,
            value: affix.value
          });
        }
      });
    });
  });

  return buffs;
};
