# Enhanced Damage System Guide

## 🛡️ **How Armor & Magic Resist Work**

The new damage system uses **diminishing returns** to create balanced combat where high armor/magic resist provides good protection but never makes you invulnerable.

### 📊 **Damage Reduction Formula**

```
Damage Reduction % = Resistance / (Resistance + 100)
Maximum Reduction = 90% (at 500+ resistance)
Final Damage = Base Damage - (Base Damage × Reduction %)
Minimum Damage = 1 (always deal at least 1 damage)
```

### 🎯 **Damage Type Detection**

**Physical Damage (uses Armor):**
- Basic attacks and weapon abilities
- Abilities with physical keywords

**Magical Damage (uses Magic Resist):**
- Abilities with magical keywords: fire, ice, lightning, magic, spell, arcane, etc.
- Skills and Ultimate category abilities
- Elemental attacks (fireball, ice shard, etc.)

### 📈 **Resistance Examples**

| Armor/Magic Resist | Damage Reduction | Example: 100 base damage becomes |
|-------------------|------------------|-----------------------------------|
| 0                 | 0%               | 100 damage                        |
| 25                | 20%              | 80 damage                         |
| 50                | 33%              | 67 damage                         |
| 100               | 50%              | 50 damage                         |
| 150               | 60%              | 40 damage                         |
| 200               | 67%              | 33 damage                         |
| 300               | 75%              | 25 damage                         |
| 500               | 83%              | 17 damage                         |
| 1000              | 90% (capped)     | 10 damage                         |

## ⚔️ **For Players**

### **Armor (Physical Defense)**
- Reduces damage from weapon attacks and physical abilities
- Built from equipment and character stats
- Most effective against fighters, rogues, basic attacks

### **Magic Resist (Magical Defense)**
- Reduces damage from spells and magical abilities  
- Built from equipment and character stats
- Most effective against mages, elemental attacks, special abilities

### **Damage Display**
When you attack enemies, you'll see enhanced feedback:
- `⚔️ 25 damage (40 base - 15 blocked by 75 Armor)` - Physical attack
- `🔮 18 damage (30 base - 12 blocked by 60 Magic Resist)` - Magical attack

## 👹 **For Enemies**

### **Enemy Resistances**
Enemies now have **Armor** and **Magic Resist** values based on their type and level:

**High Armor Types:**
- **Dragons**: 15×level + 50 armor
- **Orcs**: 10×level + 20 armor  
- **Bosses**: 12×level + 30 armor

**High Magic Resist Types:**
- **Elementals**: 20×level + 40 magic resist
- **Dragons**: 12×level + 30 magic resist
- **Undead**: 10×level + 25 magic resist

### **Enemy Attacks**
When enemies attack players:
- Uses player's **Armor** vs physical attacks
- Uses player's **Magic Resist** vs magical attacks (spells, elemental abilities)
- GM gets detailed feedback about damage reduction

## 🎮 **For Game Masters**

### **Creating Balanced Enemies**
When creating monsters, consider:

**Tank Enemies (High Armor):**
- Level 1: 20-30 armor, 5-10 magic resist
- Level 5: 50-75 armor, 15-25 magic resist  
- Level 10: 100-150 armor, 30-50 magic resist

**Mage Enemies (High Magic Resist):**
- Level 1: 5-10 armor, 25-35 magic resist
- Level 5: 15-25 armor, 60-85 magic resist
- Level 10: 30-50 armor, 120-170 magic resist

**Balanced Enemies:**
- Moderate values for both armor and magic resist
- Level × 7 + 10 for armor
- Level × 4 + 5 for magic resist

### **Enemy Attack Controls**
The GM can now:
- Make enemies attack with **enhanced damage calculation**
- See detailed damage breakdown in results
- Choose between physical and magical attacks
- Target players strategically based on their resistances

### **Enhanced Feedback**
Attack results now show:
```
Ancient Dragon attacked Wizard Bob for 15 damage!
(25 base - 10 blocked by 50 Magic Resist)
```

## 🔧 **Database Setup**

1. **Run the SQL scripts** in order:
   ```sql
   -- 1. Basic setup (if not done)
   POKEMON_BATTLE_SETUP.sql
   
   -- 2. Enhanced damage system
   DAMAGE_SYSTEM_UPDATE.sql
   ```

2. **The scripts automatically**:
   - Add armor_value and magic_resist_value to enemies table
   - Assign balanced resistances to existing enemies
   - Update attack functions to use new damage calculation
   - Create helper functions for damage reduction

## 🎯 **Strategic Implications**

### **For Players:**
- **Diversify damage types**: Use both physical and magical abilities
- **Check enemy resistances**: Some enemies are weak to magic, others to physical
- **Build balanced**: Having both armor and magic resist is important
- **Target weaknesses**: Attack enemy's weaker resistance

### **For GMs:**
- **Varied encounters**: Mix physical and magical enemies
- **Resistance themes**: Fire elementals resist magic, armored knights resist physical
- **Player adaptation**: Reward players who adapt to enemy resistances
- **Balanced progression**: Scale enemy resistances with player power

## 🚀 **Testing the System**

1. **Create a test enemy** with 50 armor and 25 magic resist
2. **Attack with physical ability** - should see armor reduction
3. **Attack with magical ability** - should see magic resist reduction
4. **Have enemy attack player** - should see player's resistances applied
5. **Check damage logs** - should show detailed breakdown

The system creates tactical depth where resistances matter but never make combat impossible!
