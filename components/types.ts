// Character and Game State Types
export interface Character {
  id: string;
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
  armor: { current: number };
  magicResist: { current: number };
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

// Tech Tree / Progression System Types
export interface SkillNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: number; // 1-5 (tier 1 = basic, tier 5 = legendary)
  position: { x: number; y: number }; // Position on the skill tree grid
  skillTree: SkillTreeType;
  prerequisites: string[]; // Array of skill node IDs required
  cost: {
    skillPoints: number;
    level: number; // Minimum level required
    gold?: number;
    materials?: { name: string; quantity: number }[];
  };
  maxRank: number;
  currentRank: number;
  isUnlocked: boolean;
  isMaxed: boolean;
  effects: SkillEffect[];
  category: SkillCategory;
}

export interface SkillEffect {
  type: 'stat_bonus' | 'ability_unlock' | 'passive_ability' | 'modifier' | 'unlock_equipment';
  target: string; // What it affects (e.g., 'attack', 'defense', 'mana', etc.)
  value: number | string;
  description: string;
  scaling?: 'linear' | 'exponential' | 'logarithmic'; // How it scales per rank
}

export enum SkillTreeType {
  COMBAT = 'combat',
  MAGIC = 'magic',
  CRAFTING = 'crafting',
  EXPLORATION = 'exploration',
  SOCIAL = 'social',
  DEFENSIVE = 'defensive'
}

export enum SkillCategory {
  PASSIVE = 'passive',
  ACTIVE = 'active',
  ULTIMATE = 'ultimate',
  MASTERY = 'mastery',
  LEGENDARY = 'legendary'
}

export interface PlayerProgression {
  totalLevel: number;
  skillPoints: number;
  unspentSkillPoints: number;
  talentPoints: number;
  unspentTalentPoints: number;
  skillTrees: Record<SkillTreeType, SkillTreeProgress>;
  unlockedSkills: string[];
  masteryLevels: Record<string, number>;
}

export interface SkillTreeProgress {
  totalPointsSpent: number;
  highestTierUnlocked: number;
  specializations: string[]; // Unlocked specialization paths
  masteryBonus: number; // Bonus from mastering the tree
}

export interface LevelUpRewards {
  level: number;
  rewards: {
    skillPoints: number;
    talentPoints: number;
    statPoints: number;
    gold: number;
    abilities?: string[];
    equipment?: string[];
    titles?: string[];
  };
}

export interface TechTreeState {
  nodes: SkillNode[];
  playerProgression: PlayerProgression;
  selectedNode: SkillNode | null;
  hoveredNode: SkillNode | null;
  filter: {
    skillTree: SkillTreeType | 'all';
    category: SkillCategory | 'all';
    showUnlockedOnly: boolean;
  };
}

// GM System Types
export interface GameSession {
  id: string;
  name: string;
  description?: string;
  gm_name: string;
  status: 'preparing' | 'active' | 'paused' | 'completed';
  created_at: string;
  started_at?: string;
  ended_at?: string;
  updated_at: string;
  current_turn?: number;
  turn_order?: string[];
  player_count?: number;
  player_names?: string;
}

export interface GameSessionPlayer {
  id: string;
  game_session_id: string;
  character_id: string;
  joined_at: string;
  is_active: boolean;
}

export interface AbilityUsageLog {
  id: string;
  game_session_id: string;
  character_id: string;
  ability_id: string;
  used_at: string;
  effect_description?: string;
  damage_dealt?: string;
  mana_cost_paid: number;
  action_points_used: number;
  turn_used?: number;
  target_description?: string;
  notes?: string;
  character_name?: string;
  character_class?: string;
  ability_name?: string;
  ability_description?: string;
  ability_category?: string;
}

export interface GameEvent {
  id: string;
  game_session_id: string;
  character_id?: string;
  event_type: string;
  event_description: string;
  event_data?: Record<string, unknown>;
  created_at: string;
}

// Pokemon-style Battle System Types
export interface Enemy {
  id: string;
  name: string;
  type: string;
  level: number;
  health_current: number;
  health_max: number;
  mana_current: number;
  mana_max: number;
  attack_power: number;
  defense: number;
  speed: number;
  experience_reward: number;
  gold_reward: number;
  description: string;
  sprite_url?: string;
  abilities?: string[];
  resistances?: string[];
  weaknesses?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface BattleEncounter {
  encounter_id: string;  // This is what the view actually returns
  game_session_id: string;
  enemy_id: string;
  enemy_health_current: number;
  enemy_mana_current: number;
  turn_order_position: number;
  // Joined enemy data from the view
  enemy_name?: string;
  enemy_type?: string;
  enemy_level?: number;
  enemy_health_max?: number;
  enemy_mana_max?: number;
  attack_power?: number;
  defense?: number;
  speed?: number;
  enemy_description?: string;
  sprite_url?: string;
}

export interface EnemyAbility {
  id: string;
  name: string;
  description: string;
  damage_min: number;
  damage_max: number;
  mana_cost: number;
  cooldown: number;
  effect_type: 'damage' | 'heal' | 'buff' | 'debuff';
  target_type: 'single' | 'all' | 'self';
  created_at: string;
}

export interface EnemyBattleLog {
  id: string;
  game_session_id: string;
  enemy_id: string;
  ability_used: string;
  target_character_id?: string;
  damage_dealt: number;
  effect_description?: string;
  turn_used: number;
  used_at: string;
} 