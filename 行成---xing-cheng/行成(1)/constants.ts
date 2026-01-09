import { Achievement, Item, ItemType, Rarity } from './types';

// ==========================================
// GAME CONFIGURATION AREA (游戏配置区)
// ==========================================

export const INITIAL_LAT = 39.9042; // Beijing Default
export const INITIAL_LNG = 116.4074;

// ITEM DATABASE (物品数据库)
export const ITEMS_DB: Record<string, Item> = {
  // Common (凡品)
  'clay_shard': {
    id: 'clay_shard',
    name: '古陶碎片',
    description: '一块普通的陶器碎片，依稀可见当年的纹路。',
    icon: '🏺',
    type: ItemType.ARTIFACT,
    rarity: 'common',
    price: 10
  },
  'iron_coin': {
    id: 'iron_coin',
    name: '生锈铁钱',
    description: '宋代的铁钱，已经锈迹斑斑。',
    icon: '🪙',
    type: ItemType.ARTIFACT,
    rarity: 'common',
    price: 15
  },
  
  // Rare (精品)
  'bronze_mirror': {
    id: 'bronze_mirror',
    name: '海兽葡萄镜',
    description: '唐代铜镜，背面铸有瑞兽与葡萄纹。',
    icon: '🪞',
    type: ItemType.ARTIFACT,
    rarity: 'rare',
    price: 200
  },
  'pixiu': {
    id: 'pixiu',
    name: '玉貔貅',
    description: '招财进宝的瑞兽，温润如脂。',
    icon: '🦁',
    type: ItemType.BEAST,
    rarity: 'rare',
    price: 500
  },

  // Epic (珍宝)
  'blue_white_bowl': {
    id: 'blue_white_bowl',
    name: '青花瓷碗',
    description: '色白花青，胎质细腻，明代民窑精品。',
    icon: '🥣',
    type: ItemType.ARTIFACT,
    rarity: 'epic',
    price: 2000
  },
  'spirit_fox': {
    id: 'spirit_fox',
    name: '九尾灵狐',
    description: '传说中的灵兽，不仅长寿，更能魅惑人心。',
    icon: '🦊',
    type: ItemType.BEAST,
    rarity: 'epic',
    price: 3500
  },

  // Legendary (传世)
  'gujian_sword': {
    id: 'gujian_sword',
    name: '越王勾践剑',
    description: '天下第一剑，历经千年不锈，锋利无比。',
    icon: '⚔️',
    type: ItemType.ARTIFACT,
    rarity: 'legendary',
    price: 50000
  },
  'jade_dragon': {
    id: 'jade_dragon',
    name: '红山玉龙',
    description: '中华第一龙，见证了文明的曙光。',
    icon: '🐉',
    type: ItemType.BEAST,
    rarity: 'legendary',
    price: 45000
  }
};

/**
 * ACHIEVEMENT DATABASE (成就数据库)
 * Levels: Common(凡), Rare(精), Epic(珍), Legendary(传)
 */
export const ACHIEVEMENTS_DB: Achievement[] = [
  {
    id: 'first_steps',
    title: '初入江湖',
    description: '第一次开启「行成」。',
    isUnlocked: false,
    rarity: 'common',
    rewardXp: 50,
  },
  {
    id: 'forbidden_city',
    title: '皇城根儿',
    description: '造访紫禁城坐标，感受帝王之气。',
    targetLat: 39.9163,
    targetLng: 116.3972,
    triggerRadius: 600,
    isUnlocked: false,
    rarity: 'epic',
    rewardItem: 'jade_dragon',
    rewardXp: 1000
  },
  {
    id: 'hometown',
    title: '故乡',
    description: '在一座城市定居超过 5 年 (模拟)。',
    isUnlocked: false,
    rarity: 'legendary',
    rewardXp: 5000
  },
  {
    id: 'olympic_walker',
    title: '奥林匹克',
    description: '造访奥林匹克公园。',
    targetLat: 40.00,
    targetLng: 116.39,
    triggerRadius: 1000,
    isUnlocked: false,
    rarity: 'rare',
    rewardItem: 'bronze_mirror',
    rewardXp: 300
  }
];

// Level = sqrt(XP / 100)
export const LEVEL_FORMULA = (xp: number) => Math.floor(Math.sqrt(xp / 100));
