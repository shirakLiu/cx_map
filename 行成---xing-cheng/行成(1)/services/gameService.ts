import { UserProfile, Item } from '../types';
import { ITEMS_DB, LEVEL_FORMULA } from '../constants';

const STORAGE_KEY = 'xingcheng_data_v2';

export const saveGame = (profile: UserProfile) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error("Save failed", e);
  }
};

export const loadGame = (): UserProfile | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

export const getInitialProfile = (): UserProfile => ({
  level: 1,
  xp: 0,
  name: '行者', // Traveler
  currency: 100,
  residenceDays: 0,
  inventory: [],
  unlockedAchievements: []
});

export const calculateLevel = (currentXp: number): number => {
  return Math.max(1, LEVEL_FORMULA(currentXp));
};

export const getUserItems = (inventoryIds: string[]): Item[] => {
  return inventoryIds.map(id => ITEMS_DB[id]).filter(Boolean);
};
