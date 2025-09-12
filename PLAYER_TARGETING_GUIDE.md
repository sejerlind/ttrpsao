# 🎯 Player Targeting System Guide

## **New Feature: Choose Specific Players for Monster Attacks**

The GM can now choose exactly which player a monster attacks, giving you complete control over combat targeting!

## 🎮 **How to Use Player Targeting**

### **1. Attack Options Available**
- **⚔️ Attack Random** - Monster attacks a random player
- **🎯 Attack Weakest** - Monster attacks the player with lowest health
- **💪 Attack Strongest** - Monster attacks the player with highest health
- **🎯 Attack Selected Player** - **NEW!** Monster attacks a specific player you choose

### **2. Using Player Selection**
1. **Select a player** from the dropdown menu
2. **Click "🎯 Attack Selected Player"** button
3. **Monster attacks that specific player** with full damage calculation

### **3. Player Information Displayed**
The dropdown shows:
- **Player Name** and **Class**
- **Current Health** / **Max Health**
- **Real-time health updates** after attacks

## ⚔️ **Enhanced Attack System**

### **Damage Calculation**
- **Physical attacks** use player's **Armor** for damage reduction
- **Magical attacks** use player's **Magic Resist** for damage reduction
- **Detailed feedback** shows damage breakdown

### **Attack Feedback**
When a monster attacks, you'll see:
```
Ancient Dragon attacked Kirito for 25 damage (40 base - 15 blocked by 75 Armor)!
```

## 🎯 **Strategic Combat Options**

### **Tactical Targeting**
- **Focus fire** - Attack the same player multiple times
- **Spread damage** - Attack different players to weaken the party
- **Target healers** - Attack players with healing abilities first
- **Target weak players** - Finish off low-health characters

### **Combat Scenarios**
- **Boss fights** - Target specific players based on their role
- **Crowd control** - Attack players who are causing problems
- **Resource management** - Target players with high mana/abilities
- **Narrative combat** - Attack based on story reasons

## 🔧 **Technical Details**

### **Database Function**
The `enemy_attack_player` function now supports:
- `target_selection`: 'random', 'weakest', 'strongest', 'specific'
- `target_player_id`: UUID of specific player (when using 'specific')

### **UI Components**
- **Player dropdown** - Shows all active session players
- **Attack button** - Disabled until player is selected
- **Real-time updates** - Health bars update after attacks

## 🚀 **Getting Started**

1. **Run the updated SQL script** to get the new function
2. **Add monsters to battle** using the Monster Library
3. **Select a player** from the dropdown
4. **Click "Attack Selected Player"** to execute the attack
5. **Watch the damage calculation** with armor/magic resist

## 💡 **Pro Tips**

- **Check player health** before selecting targets
- **Use different targeting strategies** for different monster types
- **Coordinate with story** - attack players who are in character
- **Balance difficulty** - don't always target the same player
- **Use random attacks** to keep players guessing

The player targeting system gives you complete control over monster behavior, making combat more strategic and engaging for everyone!
