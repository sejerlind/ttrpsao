// Enhanced damage calculation system with armor and magic resist

export interface DamageInfo {
  baseDamage: number;
  finalDamage: number;
  damageReduced: number;
  damageType: 'physical' | 'magical';
  resistanceUsed: number;
}

export interface Combatant {
  armor_current?: number;
  magic_resist_current?: number;
  defense?: number; // For enemies
}

/**
 * Calculate damage reduction based on armor or magic resist
 * Uses a percentage-based reduction system
 */
export function calculateDamageReduction(resistance: number): number {
  // Cap resistance at 90% (so you can't become immune)
  const cappedResistance = Math.min(resistance, 500); // 500 = 90% reduction
  
  // Formula: Damage Reduction % = Resistance / (Resistance + 100)
  // This creates diminishing returns - more resistance needed for higher reduction
  const reductionPercent = cappedResistance / (cappedResistance + 100);
  
  return Math.min(reductionPercent, 0.9); // Cap at 90% reduction
}

/**
 * Parse damage string and roll dice if needed
 */
export function rollDamage(damageString: string): number {
  if (!damageString) return 0;
  
  // Handle simple number (e.g., "15")
  const simpleNumber = parseInt(damageString);
  if (!isNaN(simpleNumber)) {
    return simpleNumber;
  }
  
  // Handle dice notation (e.g., "2d6+3")
  const diceMatch = damageString.match(/(\d+)d(\d+)(?:\+(\d+))?/);
  if (diceMatch) {
    const [, numDice, diceSize, bonus] = diceMatch;
    let total = 0;
    
    // Roll dice
    for (let i = 0; i < parseInt(numDice); i++) {
      total += Math.floor(Math.random() * parseInt(diceSize)) + 1;
    }
    
    // Add bonus
    if (bonus) {
      total += parseInt(bonus);
    }
    
    return total;
  }
  
  // Fallback to 0 if can't parse
  return 0;
}

/**
 * Determine if an ability is magical based on its properties
 */
export function isMagicalDamage(ability: { category?: string; name?: string; description?: string }): boolean {
  // Check ability category
  if (ability.category === 'skill' || ability.category === 'ultimate') {
    return true;
  }
  
  // Check ability name/description for magical keywords
  const magicalKeywords = [
    'fire', 'ice', 'lightning', 'frost', 'burn', 'freeze', 'shock',
    'magic', 'spell', 'arcane', 'divine', 'holy', 'dark', 'shadow',
    'energy', 'force', 'psychic', 'mental', 'spiritual', 'elemental',
    'bolt', 'blast', 'wave', 'beam', 'orb', 'missile'
  ];
  
  const name = (ability.name || '').toLowerCase();
  const description = (ability.description || '').toLowerCase();
  
  return magicalKeywords.some(keyword => 
    name.includes(keyword) || description.includes(keyword)
  );
}

/**
 * Calculate final damage after applying appropriate resistance
 */
export function calculateDamageWithResistance(
  damageString: string,
  target: Combatant,
  ability?: { category?: string; name?: string; description?: string }
): DamageInfo {
  const baseDamage = rollDamage(damageString);
  const isMagical = ability ? isMagicalDamage(ability) : false;
  
  let resistance = 0;
  let damageType: 'physical' | 'magical' = 'physical';
  
  if (isMagical) {
    // Use magic resistance for magical damage
    resistance = target.magic_resist_current || 0;
    damageType = 'magical';
  } else {
    // Use armor for physical damage
    resistance = target.armor_current || target.defense || 0;
    damageType = 'physical';
  }
  
  const reductionPercent = calculateDamageReduction(resistance);
  const damageReduced = Math.floor(baseDamage * reductionPercent);
  const finalDamage = Math.max(1, baseDamage - damageReduced); // Minimum 1 damage
  
  return {
    baseDamage,
    finalDamage,
    damageReduced,
    damageType,
    resistanceUsed: resistance
  };
}

/**
 * Format damage info for display
 */
export function formatDamageInfo(damageInfo: DamageInfo): string {
  const { baseDamage, finalDamage, damageReduced, damageType, resistanceUsed } = damageInfo;
  
  if (damageReduced > 0) {
    const resistType = damageType === 'magical' ? 'Magic Resist' : 'Armor';
    return `${finalDamage} damage (${baseDamage} base - ${damageReduced} blocked by ${resistanceUsed} ${resistType})`;
  } else {
    return `${finalDamage} damage`;
  }
}

/**
 * Get damage type icon
 */
export function getDamageTypeIcon(damageType: 'physical' | 'magical'): string {
  return damageType === 'magical' ? '🔮' : '⚔️';
}

/**
 * Calculate enemy attack damage with variance
 */
export function calculateEnemyAttackDamage(
  baseAttackPower: number,
  target: Combatant,
  isMagicalAttack: boolean = false
): DamageInfo {
  // Add ±25% variance to enemy attacks
  const variance = 0.25;
  const minDamage = Math.floor(baseAttackPower * (1 - variance));
  const maxDamage = Math.floor(baseAttackPower * (1 + variance));
  const baseDamage = Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
  
  let resistance = 0;
  let damageType: 'physical' | 'magical' = 'physical';
  
  if (isMagicalAttack) {
    resistance = target.magic_resist_current || 0;
    damageType = 'magical';
  } else {
    resistance = target.armor_current || 0;
    damageType = 'physical';
  }
  
  const reductionPercent = calculateDamageReduction(resistance);
  const damageReduced = Math.floor(baseDamage * reductionPercent);
  const finalDamage = Math.max(1, baseDamage - damageReduced);
  
  return {
    baseDamage,
    finalDamage,
    damageReduced,
    damageType,
    resistanceUsed: resistance
  };
}
