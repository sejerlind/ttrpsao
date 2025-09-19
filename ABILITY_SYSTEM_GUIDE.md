# Ability System Guide

This guide explains how the new ability system works in the TTRPG application, where unlocking skills grants players new abilities they can use.

## Overview

The ability system allows players to unlock new abilities by investing skill points in the skill trees. When certain skills are unlocked, players gain access to new abilities that can be used during gameplay.

## Key Components

### 1. Ability Management (`lib/abilityManager.ts`)

This module contains:
- **Ability Definitions**: Predefined abilities with stats, cooldowns, and effects
- **Ability Unlocking Logic**: Functions to determine which abilities are unlocked by skills
- **Player Progression Updates**: Functions to update player progression with new abilities

### 2. Ability Display (`components/player/AbilitiesDisplay.tsx`)

A React component that displays:
- All unlocked abilities organized by category (Basic, Skills, Ultimate)
- Ability stats (damage, mana cost, cooldown)
- Ability effects and descriptions
- Ability usage interface

### 3. Skill Integration (`components/player/TechTree.tsx`)

The skill tree component now:
- Checks for ability unlocks when skills are upgraded
- Calls back to parent components when abilities are unlocked
- Shows ability unlock effects in skill tooltips

### 4. Skill Mappers (`app/utils/skillMappers.ts`)

Enhanced to automatically add ability unlock effects to skills based on their names or IDs.

## How It Works

### 1. Skill Unlocking Process

When a player unlocks a skill:

1. The skill is marked as unlocked in the player progression
2. The system checks if the skill grants any abilities
3. If abilities are found, they're added to the player's unlocked abilities list
4. A notification is shown to the player about new abilities

### 2. Ability Categories

Abilities are organized into three categories:

- **Basic**: Simple abilities available early in the game
- **Skills**: More powerful abilities unlocked through skill trees
- **Ultimate**: Powerful abilities with long cooldowns

### 3. Ability Matching

The system automatically matches skills to abilities based on:

- **Skill Name**: Contains keywords like "fireball", "heal", "power strike"
- **Skill ID**: Matches specific ability IDs
- **Skill Effects**: Explicit ability unlock effects in the skill data

## Available Abilities

### Combat Abilities
- **Power Strike**: Devastating melee attack with stun chance
- **Whirlwind Attack**: Area attack hitting all enemies
- **Berserker Rage**: Damage boost with defense penalty
- **Shield Bash**: Stunning shield attack

### Magic Abilities
- **Fireball**: Explosive fire spell with burn effect
- **Heal**: Restore health to self or allies
- **Magic Missile**: Guaranteed hit magical projectiles
- **Teleport**: Instant movement ability

### Crafting Abilities
- **Repair Equipment**: Fix damaged gear
- **Identify Item**: Reveal magical item properties
- **Enchant Weapon**: Temporary weapon enhancement

### Ultimate Abilities
- **Meteor Strike**: Massive area damage with stun
- **Divine Intervention**: Full heal and buff all allies

## Integration Example

```tsx
import { PlayerAbilitiesPage } from './components/player/PlayerAbilitiesPage';

function GamePage() {
  const [playerProgression, setPlayerProgression] = useState(initialProgression);
  const [skills, setSkills] = useState(initialSkills);

  const handleSkillUpgrade = (skillId: string) => {
    // Update skill in your data store
    updateSkillInDatabase(skillId);
  };

  const handleProgressionUpdate = (newProgression: PlayerProgression) => {
    setPlayerProgression(newProgression);
    // Update progression in your data store
    updateProgressionInDatabase(newProgression);
  };

  return (
    <PlayerAbilitiesPage
      playerProgression={playerProgression}
      skills={skills}
      onSkillUpgrade={handleSkillUpgrade}
      onPlayerProgressionUpdate={handleProgressionUpdate}
    />
  );
}
```

## Customization

### Adding New Abilities

1. Add the ability definition to `ABILITY_DEFINITIONS` in `abilityManager.ts`
2. Add skill matching logic in `getAbilityUnlockEffects()` in `skillMappers.ts`
3. The system will automatically handle the rest

### Modifying Ability Effects

Edit the ability definitions in `abilityManager.ts` to change:
- Damage values
- Mana costs
- Cooldown times
- Special effects

### Styling

The ability display uses styled-components and follows the existing theme system. Modify the styled components in `AbilitiesDisplay.tsx` to change the appearance.

## Database Integration

The system expects the following in your player progression data:

```typescript
interface PlayerProgression {
  // ... existing fields
  unlockedAbilities: string[]; // Array of ability IDs
}
```

Make sure to update your database schema and data loading/saving logic to include the `unlockedAbilities` field.

## Future Enhancements

Potential improvements to the system:

1. **Ability Cooldown Management**: Track and update ability cooldowns
2. **Ability Upgrades**: Allow abilities to be upgraded through additional skill points
3. **Ability Combinations**: Special effects when using multiple abilities together
4. **Conditional Abilities**: Abilities that only work under certain conditions
5. **Ability Trees**: Separate progression trees for abilities themselves

