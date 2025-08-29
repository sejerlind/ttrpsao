# Turn-Based System Setup Guide

## 🔧 Setup Steps

### 1. Run Database Updates
Execute these scripts in your Supabase SQL Editor in order:

1. **First**: `turn_based_system_update.sql` - Adds turn tracking to database
2. **Test**: `test_turn_system.sql` - Verifies everything is working

### 2. How the System Works

#### **For Players:**
- ✅ **Real-time turn updates** - both via websockets and polling backup
- ✅ **Visual turn indicator** - shows current turn in the status bar
- ✅ **Automatic cooldown reduction** - when GM advances turn
- ✅ **Turn-based ability logging** - tracks which turn abilities were used

#### **For GMs:**
- ✅ **Turn control panel** - prominently displayed for active sessions
- ✅ **One-click turn advance** - reduces all player cooldowns
- ✅ **Real-time feedback** - immediate confirmation of turn changes
- ✅ **Turn tracking in logs** - see which turn each ability was used

## 🎯 Testing the System

### Step 1: Database Setup
```sql
-- Run turn_based_system_update.sql first
-- Then run test_turn_system.sql to verify
```

### Step 2: Create Game Session
1. Go to GM Dashboard: `http://localhost:3000/gm`
2. Create new session with players
3. **Start the session** (status = "active")

### Step 3: Test Player Experience
1. Go to player page: `http://localhost:3000/player/[player-id]`
2. Should see: `🎮 IN ACTIVE GAME SESSION - Turn 1`
3. Use an ability (sets cooldown)
4. Open browser console to see logs

### Step 4: Test GM Turn Advance
1. Go back to GM Dashboard
2. Click "⏭️ Next Turn" button
3. Check player page - should see "Turn 2"
4. Ability cooldowns should reduce by 1

## 🔍 Debugging

### Console Logs to Watch For:

**Player Side:**
```
🔍 Checking for active game sessions for character: [Name]
✅ Found active game session: { currentTurn: 1 }
🔔 Setting up turn monitoring for session: [ID]
🔄 Realtime turn update received: { new: { current_turn: 2 } }
🎯 Turn advanced from 1 to 2, reducing cooldowns
```

**GM Side:**
```
🔄 Advancing turn for session: [ID]
✅ Turn advanced successfully: [{ new_turn: 2 }]
```

### If Turn Updates Don't Work:

1. **Check Database**: Run `test_turn_system.sql` to verify setup
2. **Check Console**: Look for error messages in browser console
3. **Check Realtime**: Supabase realtime might need time to propagate
4. **Polling Backup**: System polls every 3 seconds as backup

### Common Issues:

❌ **"Turn not advancing"**
- Make sure session status is "active"
- Check that `advance_game_turn` function exists
- Verify player is actually in the session

❌ **"Cooldowns not reducing"**
- Check console for turn update logs
- Polling should work even if realtime fails
- Make sure player page is open during turn advance

## 🎮 Features

### Player Features:
- **Turn Display**: Shows current turn in status bar
- **Real-time Updates**: Both websockets + polling backup
- **Cooldown Sync**: Automatic reduction when turn advances
- **Turn Logging**: Tracks which turn abilities were used

### GM Features:
- **Turn Control**: Big, prominent "Next Turn" button
- **Turn Display**: Shows current turn number
- **Instant Feedback**: Immediate confirmation of turn changes
- **Enhanced Logs**: See turn info in ability usage logs

## 🚀 Ready to Play!

The system now provides:
- ✅ True turn-based gameplay
- ✅ Real-time synchronization
- ✅ Robust error handling
- ✅ Visual feedback for all users
- ✅ Detailed logging for GMs
