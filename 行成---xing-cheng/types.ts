export enum ItemType {
  ARTIFACT = 'ARTIFACT', // 文物
  BEAST = 'BEAST',       // 瑞兽
  RESOURCE = 'RESOURCE'  // 资源
}

export enum TabView {
  MAP = 'MAP',
  TASKS = 'TASKS',
  MUSEUM = 'MUSEUM',
  TRADE = 'TRADE', // Replaces SOCIAL
  PROFILE = 'PROFILE'
}

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji
  type: ItemType;
  rarity: Rarity;
  price: number; // For Trading
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  targetLat?: number;
  targetLng?: number;
  triggerRadius?: number; // in meters
  isUnlocked: boolean;
  rarity: Rarity;
  rewardItem?: string; // ID of item to reward
  rewardXp: number;
}

export interface UserProfile {
  level: number;
  xp: number;
  name: string;
  currency: number; // 通宝
  residenceDays: number; // Days in current city
  inventory: string[]; // Array of Item IDs
  unlockedAchievements: string[]; // Array of Achievement IDs
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  type: 'world' | 'system';
  rarity?: Rarity; // For item links in chat
}

export interface GameState {
  user: UserProfile;
  currentLat: number;
  currentLng: number;
  isDebugging: boolean;
}