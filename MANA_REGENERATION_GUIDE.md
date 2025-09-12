# Mana Regeneration System Guide

## 🔮 **How It Works**

The mana regeneration system automatically restores mana to players when the GM advances turns.

### **Key Features:**
- ✅ **Automatic Regeneration**: Mana is restored every turn advance
- ✅ **Customizable Per Player**: Each player can have different mana regen rates
- ✅ **100% Cap**: Players cannot exceed their maximum mana
- ✅ **Default Value**: New/existing players get 10 mana regen per turn

## 🎯 **Examples**

### Example 1: Normal Regeneration
- **Current Mana**: 100/150
- **Mana Regen**: 25 per turn
- **After Turn Advance**: 125/150 ✅

### Example 2: Cap at Maximum
- **Current Mana**: 140/150  
- **Mana Regen**: 25 per turn
- **After Turn Advance**: 150/150 (capped) ✅

### Example 3: Already at Maximum
- **Current Mana**: 150/150
- **Mana Regen**: 25 per turn  
- **After Turn Advance**: 150/150 (no change) ✅

## 🛠️ **Setup Instructions**

1. **Run the SQL Script**: Execute `ACTION_POINTS_RESET_FIX.sql` in Supabase
2. **Database Changes**:
   - Adds `mana_regen` column to characters table
   - Sets default mana regen to 10 for all existing characters
   - Updates `advance_game_turn()` function to include mana regeneration

## ⚙️ **Management Functions**

### **Set Player Mana Regen**
```sql
-- Set a player's mana regen to 25 per turn
SELECT set_player_mana_regen('player-character-id', 25);

-- Set mana regen to 0 (no regeneration)
SELECT set_player_mana_regen('player-character-id', 0);
```

### **Check Mana Status**
```sql
-- See all players' mana status and regen rates
SELECT * FROM get_mana_regen_summary('session-id');
```

### **Manual Turn Advance**
```sql
-- Advance turn (resets AP + regenerates mana)
SELECT * FROM advance_game_turn('session-id');
```

## 🎮 **For Game Masters**

### **Default Settings**
- **New Characters**: 10 mana regen per turn
- **Existing Characters**: Automatically set to 10 mana regen

### **Customization Options**
- **Powerful Casters**: 20-30 mana regen per turn
- **Martial Classes**: 5-10 mana regen per turn
- **Special Builds**: 0 mana regen (mana is precious resource)
- **High-Magic Campaigns**: 40-50 mana regen per turn

### **Balancing Tips**
1. **Consider Class Types**: Mages need more mana than fighters
2. **Match Campaign Style**: High-magic vs. low-magic settings
3. **Level Scaling**: Higher level characters can have higher regen
4. **Equipment Effects**: Magical items could boost mana regen

## 🔧 **Technical Details**

### **Database Formula**
```sql
-- New mana = MIN(max_mana, current_mana + mana_regen)
mana_current = LEAST(mana_max, mana_current + COALESCE(mana_regen, 10))
```

### **Turn Advance Process**
1. **GM clicks "Next Turn"**
2. **Database automatically**:
   - Increments turn counter
   - Resets all Action Points to maximum
   - Adds mana_regen to current mana (capped at maximum)
   - Updates all session players
3. **Players see updated values** via real-time sync

### **Error Handling**
- **Negative Values**: Mana regen cannot be set below 0
- **NULL Values**: Defaults to 10 if mana_regen is somehow NULL
- **Maximum Cap**: Always respects player's maximum mana

## 📊 **Monitoring**

### **Check Turn Effects**
```sql
-- Before turn advance
SELECT name, mana_current, mana_max, mana_regen FROM characters 
WHERE id IN (SELECT character_id FROM game_session_players WHERE game_session_id = 'session-id');

-- Advance turn
SELECT * FROM advance_game_turn('session-id');

-- After turn advance (verify changes)
SELECT name, mana_current, mana_max, mana_regen FROM characters 
WHERE id IN (SELECT character_id FROM game_session_players WHERE game_session_id = 'session-id');
```

### **GM Dashboard**
When you advance turns, you'll see:
- **Confirmation**: "Turn advanced to X! All player cooldowns reduced, Action Points reset, and mana regenerated."
- **Real-time Updates**: Player mana bars update automatically
- **Console Logs**: Detailed turn advancement logging for debugging

## 🎯 **Best Practices**

1. **Set Mana Regen Early**: Configure each player's regen rate during character creation
2. **Document Rates**: Keep track of who has what regen rate for consistency
3. **Test Regularly**: Verify the system works as expected in your sessions
4. **Balance Gradually**: Start with default rates and adjust based on gameplay
5. **Communicate**: Let players know their mana regen rates so they can plan accordingly

The system now provides balanced, automatic mana regeneration that enhances gameplay without requiring micromanagement!
