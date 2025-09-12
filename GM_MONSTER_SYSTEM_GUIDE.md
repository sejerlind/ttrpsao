# GM Monster System Guide

This guide explains the enhanced monster creation and management system for Game Masters.

## Setup

1. **Database Setup**: Run the following SQL scripts in your Supabase SQL Editor:
   - `POKEMON_BATTLE_SETUP.sql` (if not already done)
   - `GM_ATTACK_SYSTEM.sql` (new attack functionality)

2. **Access**: Navigate to the GM Dashboard (`/gm`) to access all monster management features.

## Features

### 🛠️ Monster Creator

**Location**: Always visible on the GM Dashboard

**Features**:
- **Quick Presets**: Click preset buttons for instant monster creation:
  - **Minion** (Lv.1): Weak creatures for low-level encounters
  - **Soldier** (Lv.3): Standard warriors with balanced stats
  - **Elite** (Lv.5): Powerful foes requiring strategy
  - **Boss** (Lv.8): Major threats for entire parties

- **Custom Creation**: Full control over monster stats:
  - Name, type, level, description
  - Combat stats (HP, Mana, Attack, Defense, Speed)
  - Reward values (Experience, Gold)
  - Special properties (Abilities, Resistances, Weaknesses)

- **Form Validation**: Ensures all required fields are filled correctly

### 📚 Monster Library

**Location**: Visible when an active game session exists

**Organization**:
- **Search**: Find monsters by name or description
- **Type Filter**: Filter by creature type (Goblin, Dragon, etc.)
- **Level Filter**: 
  - Level 1-3 (Basic): Good for new players
  - Level 4-6 (Intermediate): Moderate challenge
  - Level 7+ (Advanced): High-level threats

**Categories**:
- **Minion**: Weak fodder enemies
- **Goblin/Orc/etc**: Classic creature types
- **Elite**: Enhanced versions with better stats
- **Boss**: Major encounter enemies
- **Custom**: Your custom creations

### ⚔️ Battle Control System

**Active when**: Game session is active and enemies are in battle

**Enemy Management**:
- **Add to Battle**: Click any monster to add them to the current encounter
- **Health Tracking**: Visual health bars show current enemy status
- **Remove Enemies**: Remove defeated or unwanted enemies

**GM Attack Options**:
- **Attack Random**: Enemy attacks a random player
- **Attack Weakest**: Targets the player with lowest health
- **Attack Strongest**: Targets the player with highest health

## Monster Types & Uses

### Basic Monsters (Levels 1-3)
- **Forest Goblin**: Quick, weak melee attacker
- **Minion Types**: Generic weak enemies for large groups

### Intermediate Monsters (Levels 4-6)
- **Orc Warrior**: Balanced fighter with good defense
- **Shadow Assassin**: Fast, high-damage but fragile

### Advanced Monsters (Levels 7+)
- **Fire Elemental**: Magic-based with special resistances
- **Ancient Dragon**: Ultimate boss encounter

## Best Practices

### Monster Creation
1. **Balance**: Match monster level to party level
2. **Variety**: Mix different types for interesting encounters
3. **Theme**: Create monsters that fit your campaign setting
4. **Test**: Start with presets, then customize as needed

### Battle Management
1. **Start Small**: Begin encounters with 1-2 enemies
2. **Add Gradually**: Add more enemies if players are winning easily
3. **Use Targeting**: Strategic attacks make combat more engaging
4. **Track Health**: Remove enemies at 0 HP or keep them for dramatic effect

### Library Organization
1. **Use Filters**: Quickly find appropriate monsters for encounters
2. **Create Collections**: Build themed groups of monsters
3. **Reuse Favorites**: Save successful monster combinations
4. **Document**: Add clear descriptions for easy identification

## Troubleshooting

### Common Issues

**"No enemies available"**: 
- Run `POKEMON_BATTLE_SETUP.sql` in your database
- Check that the `enemies` table exists and has data

**"Attack failed"**: 
- Ensure `GM_ATTACK_SYSTEM.sql` has been run
- Verify the enemy has health > 0
- Check that players exist in the session

**Monster creation fails**: 
- Check all required fields are filled
- Ensure numeric values are positive
- Verify database connection

### Database Requirements

Required tables:
- `enemies` - Monster templates
- `battle_encounters` - Active battle state
- `enemy_battle_log` - Attack history
- `game_sessions` - Session management
- `characters` - Player characters

Required functions:
- `add_enemy_to_battle()` - Adds monsters to encounters
- `enemy_attack_player()` - Handles GM attacks

## Tips for New GMs

1. **Start Simple**: Use preset monsters for your first sessions
2. **Prepare Variety**: Have monsters of different levels ready
3. **Balance Encounters**: Mix weak and strong enemies
4. **Use the Library**: Filter and search to find perfect monsters quickly
5. **Attack Strategically**: Use different targeting to create tension
6. **Track Everything**: The system logs all actions for you

## Advanced Usage

### Custom Monster Abilities
Add ability names to the "Abilities" field (comma-separated):
- `Fireball, Lightning Bolt, Heal`
- These appear in monster descriptions
- Future updates will make these interactive

### Resistances & Weaknesses
- **Resistances**: `Fire, Ice, Poison` - reduced damage from these types
- **Weaknesses**: `Water, Lightning, Holy` - extra damage from these types
- Currently descriptive, future updates will apply mechanically

### Scaling Rewards
- **Experience**: Typically 10-50x monster level
- **Gold**: Usually 50-75% of experience value
- **Adjust**: Based on encounter difficulty and party needs

This system gives GMs complete control over monster encounters while maintaining balance and fun gameplay!
