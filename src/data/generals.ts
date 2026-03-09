import { Affix } from '../utils/affixLogic';

export interface Skill {
  name: string;
  description: string;
  type: string;
}

export interface General {
  id: string;
  name: string;
  type: 'Infantry' | 'Cavalry' | 'Archer' | 'Strategy';
  cost: number;
  imageUrl: string;
  status: 'Available' | 'Locked' | 'Deployed';
  description?: string;
  level: number;
  exp: number;
  maxExp: number;
  strength: number;
  strategy: number;
  defense: number;
  speed: number;
  skill: Skill;
  allocatedPoints?: {
    strength: number;
    strategy: number;
    defense: number;
    speed: number;
  };
  availablePoints?: number;
  affixes?: Affix[];
}

export const generals: General[] = [
  {
    id: 'qin-shubao',
    name: '秦叔宝',
    type: 'Infantry',
    cost: 3,
    imageUrl: 'https://cdn.jsdelivr.net/gh/dreamforgame-win/images-bed@main/qinshubao.jpg',
    status: 'Available',
    description: 'Detailed ink portrait of General Qin Shubao in ceremonial armor',
    level: 1,
    exp: 0,
    maxExp: 100,
    strength: 96,
    strategy: 75,
    defense: 92,
    speed: 85,
    skill: { name: '撒手锏', type: '主动', description: '每普通攻击5次，发动一次攻击，对目标造成240%武力伤害，并清空其攻击进度。' }
  },
  {
    id: 'li-jing',
    name: '李靖',
    type: 'Strategy',
    cost: 3,
    imageUrl: 'https://cdn.jsdelivr.net/gh/dreamforgame-win/images-bed@main/lijing.jpg',
    status: 'Available',
    description: 'Ink wash portrait of Li Jing looking at a war map',
    level: 1,
    exp: 0,
    maxExp: 100,
    strength: 70,
    strategy: 99,
    defense: 80,
    speed: 88,
    skill: { name: '六军镜', type: '指挥', description: '战斗时我军全体受到的武力伤害和谋略伤害降低25%。' }
  },
  {
    id: 'wei-chigong',
    name: '尉迟恭',
    type: 'Infantry',
    cost: 3,
    imageUrl: 'https://cdn.jsdelivr.net/gh/dreamforgame-win/images-bed@main/yuchigong.jpg',
    status: 'Available',
    description: 'Wei Chigong wielding two iron maces in a dynamic pose',
    level: 1,
    exp: 0,
    maxExp: 100,
    strength: 95,
    strategy: 60,
    defense: 95,
    speed: 80,
    skill: { name: '门神庇佑', type: '被动', description: '战斗前10秒，嘲讽敌军全体攻击自己。每次受到普通攻击时，有60%概率对攻击者发动一次反击（伤害率100%）。' }
  },
  {
    id: 'cheng-yaojin',
    name: '程咬金',
    type: 'Infantry',
    cost: 2,
    imageUrl: 'https://cdn.jsdelivr.net/gh/dreamforgame-win/images-bed@main/chengyaojin.jpg',
    status: 'Available',
    description: 'Heroic depiction of Cheng Yaojin with a large battle axe',
    level: 1,
    exp: 0,
    maxExp: 100,
    strength: 54,
    strategy: 30,
    defense: 51,
    speed: 75,
    skill: { name: '三板斧', type: '主动', description: '每普通攻击6次，连续对敌方随机单体发动3次兵刃攻击（伤害率分别为200%、150%、100%），若3次打中同一目标，使其立刻陷入【虚弱】（无法造成伤害）3秒。' }
  },
  {
    id: 'li-shimin',
    name: '李世民',
    type: 'Cavalry',
    cost: 3,
    imageUrl: 'https://cdn.jsdelivr.net/gh/dreamforgame-win/images-bed@main/lishimin.jpg',
    status: 'Available',
    description: 'Regal illustration of Li Shimin drawing a bow',
    level: 1,
    exp: 0,
    maxExp: 100,
    strength: 92,
    strategy: 95,
    defense: 88,
    speed: 90,
    skill: { name: '天可汗', type: '指挥', description: '战斗前15秒，使我军全体免疫控制，且全属性提升20点；第16秒起，每5秒恢复我方血量最低武将的血量的5%。' }
  },
  {
    id: 'xue-rengui',
    name: '薛仁贵',
    type: 'Archer',
    cost: 3,
    imageUrl: 'https://cdn.jsdelivr.net/gh/dreamforgame-win/images-bed@main/xuerengui.jpg',
    status: 'Available',
    description: 'General Xue Rengui in white robes with a white horse',
    level: 1,
    exp: 0,
    maxExp: 100,
    strength: 94,
    strategy: 82,
    defense: 85,
    speed: 92,
    skill: { name: '三箭定天山', type: '主动', description: '每普通攻击4次，对敌方随机3个目标各造成一次兵刃伤害（伤害率120%），并使其统率（防御力）降低30点，持续10秒。' }
  },
  {
    id: 'su-dingfang',
    name: '苏定方',
    type: 'Cavalry',
    cost: 2,
    imageUrl: 'https://cdn.jsdelivr.net/gh/dreamforgame-win/images-bed@main/sudingfang.jpg',
    status: 'Available',
    description: 'Stoic ink painting of General Su Dingfang',
    level: 1,
    exp: 0,
    maxExp: 100,
    strength: 52,
    strategy: 51,
    defense: 49,
    speed: 85,
    skill: { name: '灭国之威', type: '主动', description: '每普通攻击4次，对敌军全体（3人）造成谋略伤害（伤害率100%），并有50%概率使其进入【恐慌】状态（每秒持续掉血），持续6秒。' }
  },
  {
    id: 'luo-cheng',
    name: '罗成',
    type: 'Cavalry',
    cost: 2,
    imageUrl: 'https://cdn.jsdelivr.net/gh/dreamforgame-win/images-bed@main/luocheng.jpg',
    status: 'Available',
    description: 'Young handsome Chinese general in silver armor',
    level: 1,
    exp: 0,
    maxExp: 100,
    strength: 55,
    strategy: 42,
    defense: 45,
    speed: 95,
    skill: { name: '回马枪', type: '被动', description: '自身兵力首次低于50%时触发，立即对敌军主将造成无视防御的兵刃伤害（伤害率300%），并自身获得1次【规避】。' }
  },
  {
    id: 'guo-ziyi',
    name: '郭子仪',
    type: 'Cavalry',
    cost: 3,
    imageUrl: 'https://cdn.jsdelivr.net/gh/dreamforgame-win/images-bed@main/guoziyi.jpg',
    status: 'Available',
    description: 'Epic cinematic portrait of a battle-hardened Chinese commander',
    level: 1,
    exp: 0,
    maxExp: 100,
    strength: 85,
    strategy: 92,
    defense: 90,
    speed: 80,
    skill: { name: '再造大唐', type: '指挥', description: '战斗第20秒开始，每5秒有70%概率驱散我军全体负面状态，并大幅恢复我军群体（2人）兵力（治疗率150%）。' }
  },
  {
    id: 'wang-xuance',
    name: '王玄策',
    type: 'Strategy',
    cost: 1,
    imageUrl: 'https://cdn.jsdelivr.net/gh/dreamforgame-win/images-bed@main/wangxuance.jpg',
    status: 'Available',
    description: 'Elegant Chinese diplomat in white and red traditional attire',
    level: 1,
    exp: 0,
    maxExp: 100,
    strength: 15,
    strategy: 28,
    defense: 18,
    speed: 70,
    skill: { name: '一人灭国', type: '主动', description: '每普通攻击7次，召唤异国雇佣军（临时增加自身2000兵力上限，战斗后消失），并对敌军随机2人造成与自身当前兵力相关的物理伤害。' }
  },
  {
    id: 'pingyang-princess',
    name: '平阳公主',
    type: 'Cavalry',
    cost: 2,
    imageUrl: 'https://cdn.jsdelivr.net/gh/dreamforgame-win/images-bed@main/pingyanggongzhu.jpg',
    status: 'Available',
    description: 'Female Chinese general with a red spear',
    level: 1,
    exp: 0,
    maxExp: 100,
    strength: 51,
    strategy: 52,
    defense: 48,
    speed: 85,
    skill: { name: '娘子军', type: '指挥', description: '我军全体男性武将造成的物理伤害提升15%。若我军主将受到攻击，自身有40%概率对其发动反击。' }
  },
  {
    id: 'gao-xianzhi',
    name: '高仙芝',
    type: 'Archer',
    cost: 2,
    imageUrl: 'https://cdn.jsdelivr.net/gh/dreamforgame-win/images-bed@main/gaoxianzhi.jpg',
    status: 'Available',
    description: 'Abstract red and gold brush stroke background',
    level: 1,
    exp: 0,
    maxExp: 100,
    strength: 51,
    strategy: 48,
    defense: 45,
    speed: 82,
    skill: { name: '雪岭奇袭', type: '主动', description: '每普通攻击5次，绕过前排，直接对敌军大营（主将）造成高额兵刃伤害（伤害率220%），并使其下一次主动战法发动进度减半。' }
  },
  {
    id: 'feng-changqing',
    name: '封常清',
    type: 'Strategy',
    cost: 1,
    imageUrl: 'https://cdn.jsdelivr.net/gh/dreamforgame-win/images-bed@main/fengchangqing.jpg',
    status: 'Available',
    description: 'Stylized painting of an ancient soldier',
    level: 1,
    exp: 0,
    maxExp: 100,
    strength: 18,
    strategy: 27,
    defense: 21,
    speed: 75,
    skill: { name: '坚壁清野', type: '被动', description: '战斗中，自身统率提升50点。每5秒有50%概率为我军兵力最低的武将分担40%的伤害，持续3秒。' }
  },
  {
    id: 'pei-xingjian',
    name: '裴行俭',
    type: 'Strategy',
    cost: 2,
    imageUrl: 'https://cdn.jsdelivr.net/gh/dreamforgame-win/images-bed@main/peixingjian.jpg',
    status: 'Available',
    description: 'Traditional chinese mountain wash painting style',
    level: 1,
    exp: 0,
    maxExp: 100,
    strength: 45,
    strategy: 56,
    defense: 48,
    speed: 78,
    skill: { name: '儒将风范', type: '主动', description: '每普通攻击4次，对敌军群体（2人）造成谋略伤害（伤害率140%），并有60%概率施加【计穷】（无法发动主动战法），持续5秒。' }
  },
  {
    id: 'liu-rengui',
    name: '刘仁轨',
    type: 'Archer',
    cost: 3,
    imageUrl: 'https://cdn.jsdelivr.net/gh/dreamforgame-win/images-bed@main/liurengui.jpg',
    status: 'Available',
    description: 'Ancient Chinese navy commander on deck',
    level: 1,
    exp: 0,
    maxExp: 100,
    strength: 80,
    strategy: 90,
    defense: 85,
    speed: 75,
    skill: { name: '白江火网', type: '主动', description: '每普通攻击4次，对敌方群体（2人）施加【灼烧】状态（每秒受到谋略伤害率80%），若目标已处于灼烧状态，则立即结算一次高额伤害。' }
  },
  {
    id: 'heichi-changzhi',
    name: '黑齿常之',
    type: 'Cavalry',
    cost: 2,
    imageUrl: 'https://cdn.jsdelivr.net/gh/dreamforgame-win/images-bed@main/heichichangzhi.jpg',
    status: 'Available',
    description: 'Warrior silhouette against a rising sun',
    level: 1,
    exp: 0,
    maxExp: 100,
    strength: 52,
    strategy: 45,
    defense: 48,
    speed: 85,
    skill: { name: '夜袭', type: '突击', description: '普通攻击之后，40%概率对目标再次发动一次兵刃攻击（伤害率150%），并使自身获得3秒【连击】状态（攻击频率翻倍）。' }
  },
  {
    id: 'geshu-han',
    name: '哥舒翰',
    type: 'Cavalry',
    cost: 2,
    imageUrl: 'https://cdn.jsdelivr.net/gh/dreamforgame-win/images-bed@main/geshuhan.jpg',
    status: 'Available',
    description: 'Strong man holding a spear',
    level: 1,
    exp: 0,
    maxExp: 100,
    strength: 54,
    strategy: 39,
    defense: 51,
    speed: 80,
    skill: { name: '星宿护关', type: '指挥', description: '战斗开始时，为我军全体提供一个吸收伤害的护盾（吸收率150%，受统率影响）。护盾存在期间，我军全体免疫【虚弱】。' }
  },
  {
    id: 'zhang-shougui',
    name: '张守珪',
    type: 'Strategy',
    cost: 1,
    imageUrl: 'https://cdn.jsdelivr.net/gh/dreamforgame-win/images-bed@main/zhangshougui.jpg',
    status: 'Available',
    description: 'Golden light on ancient city walls',
    level: 1,
    exp: 0,
    maxExp: 100,
    strength: 21,
    strategy: 26,
    defense: 25,
    speed: 70,
    skill: { name: '威镇边关', type: '指挥', description: '战斗中，敌军全体骑兵兵种造成的伤害降低20%。每5秒有40%概率使敌方武力最高的单体攻击频率降低30%。' }
  },
  {
    id: 'locked-1',
    name: '待解锁',
    type: 'Infantry',
    cost: 0,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOiSnPnvsBpoboraOOSXwTJw6kgrZbH_Fc96fhMGBKA2XTOIhm3g6XcoRSLJFdXAkTs_-Su0toUrp6unQvD09KiVjwOnhb11PRaClZHVZzKQF0uLvtsOzHMctKZr8QVxFgBQwS-B9TVWcwZ9HH7PKb9T9B1NmEdA2IOE4UddDY3UnEVzpRHC3KPh3lQjhhfu4K_dAeZ3htMUY21_LX1n65k9s1tVPL5nzx26AVYf2-KxU_QNI7PvhBNzeHtj00kcoCOnAO6ywvsQ',
    status: 'Locked',
    description: 'A silhouette of a chinese warrior in the mist',
    level: 1,
    exp: 0,
    maxExp: 100,
    strength: 0,
    strategy: 0,
    defense: 0,
    speed: 0,
    skill: { name: '未知', type: '未知', description: '???' }
  },
  {
    id: 'locked-2',
    name: '待解锁',
    type: 'Infantry',
    cost: 0,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtYc0TwCxSSjIJWWhDzlaN8i2-bQVzWnK4q7CPfJxAZgb2dNQNuy5LQVG55B6hveL6koFD8vv2aiubp7BKaH2Lh-CgkGGZbpAeCgckSCLk1Xo-KcTb2PUvxSC0QiH8NeFZY4W3sCjqtnQTgTwttvripkQ4lMpKSligiz4p0ZIUkzWKTF9R9qjLy1UGW9UYKLD7hS0_VPh_752MWYUh7pzSPqpYgkxtQjkxsBHJ37IjG3lpBBrtohHE6P45Bt-k4Q6kizgDd8RHyA',
    status: 'Locked',
    description: 'Dark landscape with ancient chinese tower',
    level: 1,
    exp: 0,
    maxExp: 100,
    strength: 0,
    strategy: 0,
    defense: 0,
    speed: 0,
    skill: { name: '未知', type: '未知', description: '???' }
  }
];
