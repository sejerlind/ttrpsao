// lib/abilityManager.ts
// Manages player abilities and their unlocking through skills

import { Ability, SkillNode, PlayerProgression } from '../components/types';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// No mapping needed - abilities table uses string IDs directly

// Predefined abilities that can be unlocked through skills
export const ABILITY_DEFINITIONS: Record<string, Ability> = {
  // Combat Abilities
  'power_strike': {
    id: 'power_strike',
    name: 'Power Strike',
    description: 'A devastating melee attack that deals extra damage',
    category: 'skill',
    cooldownMax: 3,
    currentCooldown: 0,
    damage: '2d6 + 3',
    manaCost: 5,
    effects: ['Stuns target for 1 turn on critical hit'],
    maxLevel: 5,
    baseDamage: '2d6 + 3',
    baseManaCost: 5,
    baseCooldown: 3,
    scaling: {
      damage: '+1d4 per level',
      effects: [
        'Level 2: +10% critical hit chance',
        'Level 3: +1 turn stun duration',
        'Level 4: Ignores armor',
        'Level 5: Can hit 2 targets'
      ]
    }
  },
  'whirlwind_attack': {
    id: 'whirlwind_attack',
    name: 'Whirlwind Attack',
    description: 'Spin and attack all enemies in range',
    category: 'skill',
    cooldownMax: 4,
    currentCooldown: 0,
    damage: '1d8 + 2',
    manaCost: 8,
    effects: ['Hits all enemies', 'Cannot be interrupted'],
    maxLevel: 5,
    baseDamage: '1d8 + 2',
    baseManaCost: 8,
    baseCooldown: 4,
    scaling: {
      damage: '+1d6 per level',
      effects: [
        'Level 2: +1 range',
        'Level 3: +25% damage to each enemy',
        'Level 4: Applies bleeding effect',
        'Level 5: Can be used while moving'
      ]
    }
  },
  'berserker_rage': {
    id: 'berserker_rage',
    name: 'Berserker Rage',
    description: 'Enter a rage that increases damage but reduces defense',
    category: 'skill',
    cooldownMax: 6,
    currentCooldown: 0,
    damage: '0',
    manaCost: 10,
    effects: ['+50% damage for 3 turns', '-25% defense for 3 turns'],
    maxLevel: 5,
    baseDamage: '0',
    baseManaCost: 10,
    baseCooldown: 6,
    scaling: {
      effects: [
        'Level 2: +10% damage bonus',
        'Level 3: +1 turn duration',
        'Level 4: Immune to fear effects',
        'Level 5: Can be used while stunned'
      ]
    }
  },
  'shield_bash': {
    id: 'shield_bash',
    name: 'Shield Bash',
    description: 'Bash with your shield to stun and damage the enemy',
    category: 'skill',
    cooldownMax: 2,
    currentCooldown: 0,
    damage: '1d4 + 1',
    manaCost: 3,
    effects: ['Stuns target for 1 turn', 'Requires shield equipped'],
    maxLevel: 5,
    baseDamage: '1d4 + 1',
    baseManaCost: 3,
    baseCooldown: 2,
    scaling: {
      damage: '+1d4 per level',
      effects: [
        'Level 2: +1 turn stun duration',
        'Level 3: Reflects 25% damage back',
        'Level 4: Can hit multiple enemies',
        'Level 5: Creates protective barrier'
      ]
    }
  },

  // Magic Abilities
  'fireball': {
    id: 'fireball',
    name: 'Fireball',
    description: 'Launch a ball of fire that explodes on impact',
    category: 'skill',
    cooldownMax: 2,
    currentCooldown: 0,
    damage: '3d6 + 4',
    manaCost: 12,
    effects: ['Area of effect damage', 'Burns target for 2 turns'],
    maxLevel: 5,
    baseDamage: '3d6 + 4',
    baseManaCost: 12,
    baseCooldown: 2,
    scaling: {
      damage: '+2d6 per level',
      effects: [
        'Level 2: +1 turn burn duration',
        'Level 3: Larger explosion radius',
        'Level 4: Ignores fire resistance',
        'Level 5: Can be charged for more damage'
      ]
    }
  },
  'heal': {
    id: 'heal',
    name: 'Heal',
    description: 'Restore health to yourself or an ally',
    category: 'skill',
    cooldownMax: 1,
    currentCooldown: 0,
    damage: '0',
    manaCost: 8,
    effects: ['Restores 2d6 + 4 health', 'Can target allies'],
    maxLevel: 5,
    baseDamage: '0',
    baseManaCost: 8,
    baseCooldown: 1,
    scaling: {
      effects: [
        'Level 2: +1d6 healing',
        'Level 3: Removes debuffs',
        'Level 4: Can heal multiple targets',
        'Level 5: Provides temporary health bonus'
      ]
    }
  },
  'magic_missile': {
    id: 'magic_missile',
    name: 'Magic Missile',
    description: 'Launch magical projectiles that never miss',
    category: 'skill',
    cooldownMax: 1,
    currentCooldown: 0,
    damage: '1d4 + 1',
    manaCost: 3,
    effects: ['Never misses', 'Can target multiple enemies'],
    maxLevel: 5,
    baseDamage: '1d4 + 1',
    baseManaCost: 3,
    baseCooldown: 1,
    scaling: {
      damage: '+1d4 per level',
      effects: [
        'Level 2: +1 missile per level',
        'Level 3: Pierces through enemies',
        'Level 4: Can target invisible enemies',
        'Level 5: Automatically targets weakest enemy'
      ]
    }
  },
  'teleport': {
    id: 'teleport',
    name: 'Teleport',
    description: 'Instantly move to a different location',
    category: 'skill',
    cooldownMax: 5,
    currentCooldown: 0,
    damage: '0',
    manaCost: 15,
    effects: ['Instant movement', 'Cannot be interrupted'],
    maxLevel: 5,
    baseDamage: '0',
    baseManaCost: 15,
    baseCooldown: 5,
    scaling: {
      effects: [
        'Level 2: -1 turn cooldown',
        'Level 3: Can bring allies',
        'Level 4: Can teleport through walls',
        'Level 5: Creates temporary portal'
      ]
    }
  },

  // Crafting Abilities
  'repair_equipment': {
    id: 'repair_equipment',
    name: 'Repair Equipment',
    description: 'Fix damaged equipment using crafting materials',
    category: 'skill',
    cooldownMax: 0,
    currentCooldown: 0,
    damage: '0',
    manaCost: 0,
    effects: ['Restores equipment durability', 'Requires repair materials'],
    maxLevel: 5,
    baseDamage: '0',
    baseManaCost: 0,
    baseCooldown: 0,
    scaling: {
      effects: [
        'Level 2: Repairs more durability',
        'Level 3: Requires fewer materials',
        'Level 4: Can repair magical items',
        'Level 5: Can enhance equipment while repairing'
      ]
    }
  },
  'identify_item': {
    id: 'identify_item',
    name: 'Identify Item',
    description: 'Reveal the properties of unknown magical items',
    category: 'skill',
    cooldownMax: 0,
    currentCooldown: 0,
    damage: '0',
    manaCost: 5,
    effects: ['Reveals item properties', 'Works on any unidentified item'],
    maxLevel: 5,
    baseDamage: '0',
    baseManaCost: 5,
    baseCooldown: 0,
    scaling: {
      effects: [
        'Level 2: -1 mana cost',
        'Level 3: Reveals hidden properties',
        'Level 4: Can identify cursed items safely',
        'Level 5: Can identify multiple items at once'
      ]
    }
  },
  'enchant_weapon': {
    id: 'enchant_weapon',
    name: 'Enchant Weapon',
    description: 'Temporarily enhance a weapon with magical properties',
    category: 'skill',
    cooldownMax: 10,
    currentCooldown: 0,
    damage: '0',
    manaCost: 20,
    effects: ['+2 damage for 10 turns', 'Requires enchanting materials'],
    maxLevel: 5,
    baseDamage: '0',
    baseManaCost: 20,
    baseCooldown: 10,
    scaling: {
      effects: [
        'Level 2: +1 damage bonus',
        'Level 3: +5 turn duration',
        'Level 4: Can enchant multiple weapons',
        'Level 5: Permanent enchantment possible'
      ]
    }
  },

  // Ultimate Abilities
  'meteor_strike': {
    id: 'meteor_strike',
    name: 'Meteor Strike',
    description: 'Call down a massive meteor to devastate the battlefield',
    category: 'ultimate',
    cooldownMax: 20,
    currentCooldown: 0,
    damage: '6d8 + 10',
    manaCost: 50,
    effects: ['Massive area damage', 'Stuns all enemies for 2 turns'],
    maxLevel: 5,
    baseDamage: '6d8 + 10',
    baseManaCost: 50,
    baseCooldown: 20,
    scaling: {
      damage: '+3d8 per level',
      effects: [
        'Level 2: +1 turn stun duration',
        'Level 3: Larger impact radius',
        'Level 4: Creates fire field on impact',
        'Level 5: Can be cast from anywhere'
      ]
    }
  },
  'divine_intervention': {
    id: 'divine_intervention',
    name: 'Divine Intervention',
    description: 'Call upon divine power to restore all allies to full health',
    category: 'ultimate',
    cooldownMax: 30,
    currentCooldown: 0,
    damage: '0',
    manaCost: 100,
    effects: ['Full heal all allies', 'Removes all debuffs', 'Grants temporary invulnerability'],
    maxLevel: 5,
    baseDamage: '0',
    baseManaCost: 100,
    baseCooldown: 30,
    scaling: {
      effects: [
        'Level 2: +5 turn invulnerability',
        'Level 3: Resurrects fallen allies',
        'Level 4: Grants temporary stat bonuses',
        'Level 5: Can be used once per battle'
      ]
    }
  }
};

/**
 * Get skill levels for a character from the database
 */
export async function getSkillLevels(characterId: string): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('character_skills')
      .select('skill_id, current_rank')
      .eq('character_id', characterId)
      .eq('is_unlocked', true);
    
    if (error) {
      console.error('Error fetching skill levels:', error);
      return {};
    }
    
    const skillLevels: Record<string, number> = {};
    data?.forEach(skill => {
      skillLevels[skill.skill_id] = skill.current_rank;
    });
    
    return skillLevels;
  } catch (error) {
    console.error('Failed to fetch skill levels:', error);
    return {};
  }
}

/**
 * Apply skill level scaling to an ability
 */
export function applySkillScaling(ability: Ability, skillLevel: number): Ability {
  if (!ability.scaling || skillLevel <= 1) {
    return { ...ability, level: skillLevel };
  }
  
  const scaledAbility = { ...ability, level: skillLevel };
  
  // Apply damage scaling
  if (ability.scaling.damage && ability.baseDamage) {
    // Simple scaling logic - in a real game you'd want more sophisticated dice parsing
    const baseDamage = ability.baseDamage;
    const scalingPerLevel = ability.scaling.damage;
    
    // For now, just add a simple multiplier based on level
    if (scalingPerLevel.includes('+1d4')) {
      scaledAbility.damage = `${baseDamage} + ${skillLevel - 1}d4`;
    } else if (scalingPerLevel.includes('+1d6')) {
      scaledAbility.damage = `${baseDamage} + ${skillLevel - 1}d6`;
    } else if (scalingPerLevel.includes('+2d6')) {
      scaledAbility.damage = `${baseDamage} + ${(skillLevel - 1) * 2}d6`;
    } else if (scalingPerLevel.includes('+3d8')) {
      scaledAbility.damage = `${baseDamage} + ${(skillLevel - 1) * 3}d8`;
    }
  }
  
  // Apply mana cost scaling
  if (ability.scaling.manaCost && ability.baseManaCost !== undefined) {
    // Simple scaling - reduce mana cost by 1 per level for some abilities
    if (ability.scaling.manaCost.includes('-1')) {
      scaledAbility.manaCost = Math.max(0, ability.baseManaCost - (skillLevel - 1));
    }
  }
  
  // Apply cooldown scaling
  if (ability.scaling.cooldown && ability.baseCooldown !== undefined) {
    // Simple scaling - reduce cooldown by 1 per level for some abilities
    if (ability.scaling.cooldown.includes('-1')) {
      scaledAbility.cooldownMax = Math.max(1, ability.baseCooldown - (skillLevel - 1));
    }
  }
  
  // Add level-specific effects
  if (ability.scaling.effects) {
    const levelEffects = ability.scaling.effects
      .filter(effect => {
        const levelMatch = effect.match(/Level (\d+):/);
        return levelMatch && parseInt(levelMatch[1]) <= skillLevel;
      })
      .map(effect => effect.replace(/Level \d+: /, ''));
    
    scaledAbility.effects = [
      ...(ability.effects || []),
      ...levelEffects
    ];
  }
  
  return scaledAbility;
}

/**
 * Get abilities that should be unlocked when a skill is unlocked
 */
export function getAbilitiesFromSkill(skill: SkillNode): Ability[] {
  const abilities: Ability[] = [];
  
  // Check if skill has ability unlock effects
  skill.effects.forEach(effect => {
    if (effect.type === 'ability_unlock' && effect.abilityId) {
      const ability = ABILITY_DEFINITIONS[effect.abilityId];
      if (ability) {
        abilities.push(ability);
      }
    }
  });
  
  // Some skills might grant abilities based on their category or name
  if (skill.category === 'active' || skill.category === 'ultimate') {
    // Check if there's a matching ability by name or skill ID
    const matchingAbility = Object.values(ABILITY_DEFINITIONS).find(ability => 
      ability.name.toLowerCase().includes(skill.name.toLowerCase()) ||
      ability.id === skill.id
    );
    
    if (matchingAbility && !abilities.find(a => a.id === matchingAbility.id)) {
      abilities.push(matchingAbility);
    }
  }
  
  return abilities;
}

/**
 * Update player progression with newly unlocked abilities
 */
export function updatePlayerAbilities(
  playerProgression: PlayerProgression,
  newlyUnlockedSkills: SkillNode[]
): PlayerProgression {
  const newAbilities: string[] = [];
  
  newlyUnlockedSkills.forEach(skill => {
    const abilities = getAbilitiesFromSkill(skill);
    abilities.forEach(ability => {
      if (!playerProgression.unlockedAbilities.includes(ability.id)) {
        newAbilities.push(ability.id);
      }
    });
  });
  
  return {
    ...playerProgression,
    unlockedAbilities: [...playerProgression.unlockedAbilities, ...newAbilities]
  };
}

/**
 * Get all abilities currently available to the player
 */
export function getPlayerAbilities(playerProgression: PlayerProgression): Ability[] {
  // Get abilities from the unlocked_abilities array
  const directAbilities = playerProgression.unlockedAbilities
    .map(abilityId => ABILITY_DEFINITIONS[abilityId])
    .filter(Boolean);
    
  return directAbilities;
}

/**
 * Get abilities based on unlocked skills with level scaling
 */
export async function getAbilitiesFromUnlockedSkillsWithLevels(
  characterId: string, 
  unlockedSkills: string[]
): Promise<Ability[]> {
  const abilities: Ability[] = [];
  
  // Get skill levels from database
  const skillLevels = await getSkillLevels(characterId);
  
  // Map skill IDs to abilities based on skill names/patterns
  unlockedSkills.forEach(skillId => {
    const skillName = skillId.toLowerCase();
    const skillLevel = skillLevels[skillId] || 1;
    
    console.log(`🔍 Processing skill: ${skillId} (${skillName}) - Level: ${skillLevel}`);
    
    // Map skills to abilities based on patterns
    
    // === MAGIC ABILITIES ===
    // Map specific magic skill IDs to abilities
    if (skillId === 'magic_fire_path' || skillId === 'magic_fireball' || skillId === 'magic_fire_wall') {
      const ability = ABILITY_DEFINITIONS['fireball'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
        console.log(`✅ Added Fireball (Level ${skillLevel}) from skill: ${skillId}`);
      }
    }
    
    if (skillId === 'magic_arcane_path' || skillId === 'magic_arcane_bolt') {
      const ability = ABILITY_DEFINITIONS['heal'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
        console.log(`✅ Added Heal (Level ${skillLevel}) from skill: ${skillId}`);
      }
    }
    
    if (skillId === 'magic_ice_path' || skillId === 'magic_ice_shard' || skillId === 'magic_ice_armor') {
      const ability = ABILITY_DEFINITIONS['magic_missile'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
        console.log(`✅ Added Magic Missile (Level ${skillLevel}) from skill: ${skillId}`);
      }
    }
    
    if (skillId === 'magic_foundation') {
      const ability = ABILITY_DEFINITIONS['teleport'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
        console.log(`✅ Added Teleport (Level ${skillLevel}) from skill: ${skillId}`);
      }
    }
    
    // Fallback pattern matching for magic abilities
    if (skillName.includes('fireball') || skillName.includes('fire_ball')) {
      const ability = ABILITY_DEFINITIONS['fireball'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
      }
    }
    
    if (skillName.includes('heal') || skillName.includes('healing')) {
      const ability = ABILITY_DEFINITIONS['heal'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
      }
    }
    
    if (skillName.includes('magic_missile') || skillName.includes('magic') && skillName.includes('missile')) {
      const ability = ABILITY_DEFINITIONS['magic_missile'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
      }
    }
    
    if (skillName.includes('teleport') || skillName.includes('blink')) {
      const ability = ABILITY_DEFINITIONS['teleport'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
      }
    }
    
    // === COMBAT ABILITIES ===
    // Map specific skill IDs to abilities
    if (skillId === 'combat_sword_path' || skillId === 'combat_dual_swords' || skillId === 'combat_sword_magic') {
      const ability = ABILITY_DEFINITIONS['power_strike'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
        console.log(`✅ Added Power Strike (Level ${skillLevel}) from skill: ${skillId}`);
      }
    }
    
    if (skillId === 'combat_magic_path' || skillId === 'combat_magic_blast' || skillId === 'combat_defensive_magic') {
      const ability = ABILITY_DEFINITIONS['whirlwind_attack'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
        console.log(`✅ Added Whirlwind Attack (Level ${skillLevel}) from skill: ${skillId}`);
      }
    }
    
    if (skillId === 'combat_foundation' || skillId === 'combat_advanced_techniques') {
      const ability = ABILITY_DEFINITIONS['berserker_rage'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
        console.log(`✅ Added Berserker Rage (Level ${skillLevel}) from skill: ${skillId}`);
      }
    }
    
    if (skillId === 'combat_defense_path' || skillId === 'combat_shield_bash') {
      const ability = ABILITY_DEFINITIONS['shield_bash'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
        console.log(`✅ Added Shield Bash (Level ${skillLevel}) from skill: ${skillId}`);
      }
    }
    
    // Fallback pattern matching for other skills
    if (skillName.includes('power_strike') || skillName.includes('power') && skillName.includes('strike')) {
      const ability = ABILITY_DEFINITIONS['power_strike'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
      }
    }
    
    if (skillName.includes('whirlwind') || skillName.includes('whirl')) {
      const ability = ABILITY_DEFINITIONS['whirlwind_attack'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
      }
    }
    
    if (skillName.includes('berserker') || skillName.includes('rage')) {
      const ability = ABILITY_DEFINITIONS['berserker_rage'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
      }
    }
    
    if (skillName.includes('shield') && skillName.includes('bash')) {
      const ability = ABILITY_DEFINITIONS['shield_bash'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
      }
    }
    
    // Additional combat skill patterns
    if (skillName.includes('sword') || skillName.includes('blade') || skillName.includes('weapon')) {
      const ability = ABILITY_DEFINITIONS['power_strike'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
      }
    }
    
    if (skillName.includes('combo') || skillName.includes('chain') || skillName.includes('strike')) {
      const ability = ABILITY_DEFINITIONS['power_strike'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
      }
    }
    
    if (skillName.includes('spin') || skillName.includes('sweep') || skillName.includes('cleave')) {
      const ability = ABILITY_DEFINITIONS['whirlwind_attack'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
      }
    }
    
    if (skillName.includes('fury') || skillName.includes('wrath') || skillName.includes('battle')) {
      const ability = ABILITY_DEFINITIONS['berserker_rage'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
      }
    }
    
    if (skillName.includes('defense') || skillName.includes('guard') || skillName.includes('block')) {
      const ability = ABILITY_DEFINITIONS['shield_bash'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
      }
    }
    
    // Combat tree specific patterns (based on your skill tree)
    if (skillName.includes('combat') || skillName.includes('warrior') || skillName.includes('fighter')) {
      // Grant basic combat abilities
      const abilitiesToAdd = ['power_strike', 'whirlwind_attack', 'berserker_rage'];
      abilitiesToAdd.forEach(abilityId => {
        const ability = ABILITY_DEFINITIONS[abilityId];
        if (ability && !abilities.find(a => a.id === ability.id)) {
          const scaledAbility = applySkillScaling(ability, skillLevel);
          abilities.push(scaledAbility);
        }
      });
    }
    
    // Specific skill ID patterns from your skill tree
    if (skillId === 'magic_fireball' || skillId === 'magic_fire_path') {
      const ability = ABILITY_DEFINITIONS['fireball'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
      }
    }
    
    if (skillId === 'magic_ice_shard' || skillId === 'magic_ice_path') {
      // Create a new ice ability or use existing magic missile
      const ability = ABILITY_DEFINITIONS['magic_missile'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
      }
    }
    
    if (skillId === 'magic_arcane_path' || skillId === 'magic_foundation') {
      // Grant basic magic abilities
      const abilitiesToAdd = ['magic_missile', 'heal'];
      abilitiesToAdd.forEach(abilityId => {
        const ability = ABILITY_DEFINITIONS[abilityId];
        if (ability && !abilities.find(a => a.id === ability.id)) {
          const scaledAbility = applySkillScaling(ability, skillLevel);
          abilities.push(scaledAbility);
        }
      });
    }
    
    // Generic patterns for any skill that might grant abilities
    if (skillName.includes('tier') || skillName.includes('level') || skillName.includes('rank')) {
      // These are likely progression skills that should grant basic abilities
      const basicAbilities = ['power_strike', 'heal'];
      basicAbilities.forEach(abilityId => {
        const ability = ABILITY_DEFINITIONS[abilityId];
        if (ability && !abilities.find(a => a.id === ability.id)) {
          const scaledAbility = applySkillScaling(ability, skillLevel);
          abilities.push(scaledAbility);
        }
      });
    }
    
    // === CRAFTING ABILITIES ===
    if (skillName.includes('repair') || skillName.includes('craft')) {
      const ability = ABILITY_DEFINITIONS['repair_equipment'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
      }
    }
    
    if (skillName.includes('identify') || skillName.includes('detect')) {
      const ability = ABILITY_DEFINITIONS['identify_item'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
      }
    }
    
    if (skillName.includes('enchant') || skillName.includes('imbue')) {
      const ability = ABILITY_DEFINITIONS['enchant_weapon'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
      }
    }
    
    // === ULTIMATE ABILITIES ===
    if (skillName.includes('meteor') || skillName.includes('comet')) {
      const ability = ABILITY_DEFINITIONS['meteor_strike'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
      }
    }
    
    if (skillName.includes('divine') || skillName.includes('intervention')) {
      const ability = ABILITY_DEFINITIONS['divine_intervention'];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, skillLevel);
        abilities.push(scaledAbility);
      }
    }
  });
  
  // Bonus abilities based on total skill count (progression rewards)
  const totalSkills = unlockedSkills.length;
  
  if (totalSkills >= 5) {
    // Grant additional abilities for having many skills
    const bonusAbilities = ['power_strike', 'heal', 'magic_missile'];
    bonusAbilities.forEach(abilityId => {
      const ability = ABILITY_DEFINITIONS[abilityId];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, 1); // Level 1 for bonus abilities
        abilities.push(scaledAbility);
      }
    });
  }
  
  if (totalSkills >= 10) {
    // Grant more advanced abilities
    const advancedAbilities = ['whirlwind_attack', 'berserker_rage', 'fireball'];
    advancedAbilities.forEach(abilityId => {
      const ability = ABILITY_DEFINITIONS[abilityId];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, 2); // Level 2 for advanced abilities
        abilities.push(scaledAbility);
      }
    });
  }
  
  if (totalSkills >= 15) {
    // Grant ultimate abilities
    const ultimateAbilities = ['meteor_strike', 'divine_intervention'];
    ultimateAbilities.forEach(abilityId => {
      const ability = ABILITY_DEFINITIONS[abilityId];
      if (ability && !abilities.find(a => a.id === ability.id)) {
        const scaledAbility = applySkillScaling(ability, 3); // Level 3 for ultimate abilities
        abilities.push(scaledAbility);
      }
    });
  }
  
  return abilities;
}

/**
 * Get abilities by category
 */
export function getAbilitiesByCategory(
  playerProgression: PlayerProgression,
  category: 'basic' | 'skill' | 'ultimate'
): Ability[] {
  return getPlayerAbilities(playerProgression).filter(ability => ability.category === category);
}

/**
 * Check if a specific ability is unlocked
 */
export function isAbilityUnlocked(playerProgression: PlayerProgression, abilityId: string): boolean {
  return playerProgression.unlockedAbilities.includes(abilityId);
}

/**
 * Calculate stat bonuses from unlocked skills
 */
export async function getStatBonusesFromSkills(characterId: string): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('character_skills')
      .select(`
        skill_id,
        current_rank,
        skills!inner(
          effects
        )
      `)
      .eq('character_id', characterId)
      .eq('is_unlocked', true);
    
    if (error) {
      console.error('Error fetching skill bonuses:', error);
      return {};
    }
    
    const statBonuses: Record<string, number> = {
      attack_damage: 0,
      health: 0,
      mana: 0,
      armor: 0,
      magic_resist: 0,
      mana_regen: 0,
      crit_chance: 0,
      crit_damage: 0,
      attack_speed: 0,
      movement_speed: 0
    };
    
    data?.forEach(skill => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const effects = (skill.skills as any).effects || [];
      const currentRank = skill.current_rank || 1;
      
      effects.forEach((effect: { type: string; target: string; value: number | string }) => {
        if (effect.type === 'stat_bonus') {
          const target = effect.target;
          const value = typeof effect.value === 'number' ? effect.value : parseInt(effect.value) || 0;
          const bonus = value * currentRank; // Scale by skill rank
          
          // Map skill effect targets to our stat system
          switch (target) {
            case 'attack':
            case 'attack_damage':
            case 'damage':
              statBonuses.attack_damage += bonus;
              break;
            case 'health':
            case 'hp':
            case 'max_health':
              statBonuses.health += bonus;
              break;
            case 'mana':
            case 'mp':
            case 'max_mana':
              statBonuses.mana += bonus;
              break;
            case 'armor':
            case 'defense':
              statBonuses.armor += bonus;
              break;
            case 'magic_resist':
            case 'magic_resistance':
            case 'magic_defense':
              statBonuses.magic_resist += bonus;
              break;
            case 'mana_regen':
            case 'mana_regeneration':
              statBonuses.mana_regen += bonus;
              break;
            case 'crit_chance':
            case 'critical_chance':
              statBonuses.crit_chance += bonus;
              break;
            case 'crit_damage':
            case 'critical_damage':
              statBonuses.crit_damage += bonus;
              break;
            case 'attack_speed':
              statBonuses.attack_speed += bonus;
              break;
            case 'movement_speed':
            case 'speed':
              statBonuses.movement_speed += bonus;
              break;
          }
        }
      });
    });
    
    console.log('📊 Stat bonuses from skills:', statBonuses);
    return statBonuses;
    
  } catch (error) {
    console.error('Failed to calculate stat bonuses:', error);
    return {};
  }
}

// No UUID conversion functions needed - abilities table uses string IDs directly
