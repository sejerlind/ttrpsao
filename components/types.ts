// Character and Game State Types
export interface Character {
  name: string;
  class: string;
  level: number;
  experience: number;
  experienceToNext: number;
}

export interface Resources {
  health: { current: number; max: number };
  mana: { current: number; max: number };
  stamina: { current: number; max: number };
  actionPoints: { current: number; max: number };
  armor: { current: number; max: number };
  magicResist: { current: number; max: number };
}

export interface Ability {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'skill' | 'ultimate';
  cooldownMax: number;
  currentCooldown: number;
  damage?: string;
  manaCost?: number;
  effects?: string[];
}

export interface Buff {
  id: string;
  name: string;
  type: 'buff' | 'debuff';
  duration: number;
  icon: string;
}

export interface UsedAbility {
  abilityName: string;
  timestamp: Date;
  effect: string;
}

export interface FloatingTextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  type: 'damage' | 'heal' | 'effect' | 'error';
} 