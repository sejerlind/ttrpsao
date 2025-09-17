-- ==============================================
-- SKILL TREE RESTRUCTURE
-- Combat and Magic Crafting Trees with Proper Branching
-- ==============================================

-- Clear existing skills to start fresh
DELETE FROM character_skills;
DELETE FROM skills;

-- ==============================================
-- COMBAT TREE (Left Tree - Mage Tree)
-- ==============================================

-- Tier 1 - Foundation
INSERT INTO skills (id, name, description, icon, tier, position_x, position_y, skill_tree, prerequisites, cost_skill_points, cost_level, cost_gold, max_rank, category, effects) VALUES
('combat_foundation', 'Combat Foundation', 'Basic combat techniques and weapon handling', '⚔️', 1, 0, 0, 'combat', '{}'::text[], 1, 1, 0, 1, 'passive', '[{"type": "stat_bonus", "target": "attack_damage", "value": 5, "description": "+5 Attack Damage"}]'::jsonb);

-- Tier 2 - Branching paths
INSERT INTO skills (id, name, description, icon, tier, position_x, position_y, skill_tree, prerequisites, cost_skill_points, cost_level, cost_gold, max_rank, category, effects) VALUES
('combat_sword_path', 'Sword Mastery', 'Master the art of sword combat', '🗡️', 2, -1, 1, 'combat', '{"combat_foundation"}'::text[], 2, 5, 0, 3, 'passive', '[{"type": "stat_bonus", "target": "sword_damage", "value": 10, "description": "+10 Sword Damage"}]'::jsonb),
('combat_magic_path', 'Combat Magic', 'Infuse combat with magical energy', '✨', 2, 0, 1, 'combat', '{"combat_foundation"}'::text[], 2, 5, 0, 3, 'passive', '[{"type": "stat_bonus", "target": "magic_damage", "value": 8, "description": "+8 Magic Damage"}]'::jsonb),
('combat_defense_path', 'Combat Defense', 'Defensive combat techniques', '🛡️', 2, 1, 1, 'combat', '{"combat_foundation"}'::text[], 2, 5, 0, 3, 'passive', '[{"type": "stat_bonus", "target": "defense", "value": 15, "description": "+15 Defense"}]'::jsonb);

-- Tier 3 - Further specialization
INSERT INTO skills (id, name, description, icon, tier, position_x, position_y, skill_tree, prerequisites, cost_skill_points, cost_level, cost_gold, max_rank, category, effects) VALUES
('combat_dual_swords', 'Dual Swords', 'Master dual sword techniques', '⚔️⚔️', 3, -2, 2, 'combat', '{"combat_sword_path"}'::text[], 3, 10, 0, 2, 'passive', '[{"type": "stat_bonus", "target": "attack_speed", "value": 20, "description": "+20% Attack Speed"}]'::jsonb),
('combat_sword_magic', 'Sword Magic', 'Enchant swords with magical properties', '🗡️✨', 3, -1, 2, 'combat', '{"combat_sword_path", "combat_magic_path"}'::text[], 4, 12, 0, 2, 'passive', '[{"type": "stat_bonus", "target": "elemental_damage", "value": 25, "description": "+25% Elemental Damage"}]'::jsonb),
('combat_magic_blast', 'Magic Blast', 'Powerful magical attack', '💥', 3, 0, 2, 'combat', '{"combat_magic_path"}'::text[], 3, 10, 0, 2, 'active', '[{"type": "ability_unlock", "target": "magic_blast", "value": 1, "description": "Unlocks Magic Blast ability"}]'::jsonb),
('combat_shield_bash', 'Shield Bash', 'Defensive attack with shield', '🛡️💥', 3, 1, 2, 'combat', '{"combat_defense_path"}'::text[], 3, 10, 0, 2, 'active', '[{"type": "ability_unlock", "target": "shield_bash", "value": 1, "description": "Unlocks Shield Bash ability"}]'::jsonb),
('combat_defensive_magic', 'Defensive Magic', 'Protective magical barriers', '🛡️✨', 3, 2, 2, 'combat', '{"combat_defense_path", "combat_magic_path"}'::text[], 4, 12, 0, 2, 'passive', '[{"type": "stat_bonus", "target": "magic_resistance", "value": 30, "description": "+30% Magic Resistance"}]'::jsonb);

-- Tier 4 - Advanced techniques
INSERT INTO skills (id, name, description, icon, tier, position_x, position_y, skill_tree, prerequisites, cost_skill_points, cost_level, cost_gold, max_rank, category, effects) VALUES
('combat_whirlwind', 'Whirlwind Attack', 'Spin attack hitting all enemies', '🌪️', 4, -2, 3, 'combat', '{"combat_dual_swords"}'::text[], 5, 18, 0, 1, 'active', '[{"type": "ability_unlock", "target": "whirlwind", "value": 1, "description": "Unlocks Whirlwind Attack"}]'::jsonb),
('combat_elemental_storm', 'Elemental Storm', 'Devastating elemental attack', '⚡', 4, -1, 3, 'combat', '{"combat_sword_magic"}'::text[], 6, 20, 0, 1, 'active', '[{"type": "ability_unlock", "target": "elemental_storm", "value": 1, "description": "Unlocks Elemental Storm"}]'::jsonb),
('combat_arcane_explosion', 'Arcane Explosion', 'Massive magical explosion', '💫', 4, 0, 3, 'combat', '{"combat_magic_blast"}'::text[], 5, 18, 0, 1, 'active', '[{"type": "ability_unlock", "target": "arcane_explosion", "value": 1, "description": "Unlocks Arcane Explosion"}]'::jsonb),
('combat_guardian_aura', 'Guardian Aura', 'Protective aura for allies', '🌟', 4, 1, 3, 'combat', '{"combat_shield_bash"}'::text[], 5, 18, 0, 1, 'passive', '[{"type": "stat_bonus", "target": "party_defense", "value": 20, "description": "+20% Party Defense"}]'::jsonb),
('combat_magic_shield', 'Magic Shield', 'Absorb damage with magic', '🔮', 4, 2, 3, 'combat', '{"combat_defensive_magic"}'::text[], 6, 20, 0, 1, 'active', '[{"type": "ability_unlock", "target": "magic_shield", "value": 1, "description": "Unlocks Magic Shield"}]'::jsonb);

-- Tier 5 - Mastery
INSERT INTO skills (id, name, description, icon, tier, position_x, position_y, skill_tree, prerequisites, cost_skill_points, cost_level, cost_gold, max_rank, category, effects) VALUES
('combat_ultimate_warrior', 'Ultimate Warrior', 'Master of all combat arts', '👑', 5, 0, 4, 'combat', '{"combat_whirlwind", "combat_elemental_storm", "combat_arcane_explosion", "combat_guardian_aura", "combat_magic_shield"}'::text[], 10, 30, 0, 1, 'ultimate', '[{"type": "stat_bonus", "target": "all_stats", "value": 50, "description": "+50% All Stats"}]'::jsonb);

-- ==============================================
-- MAGIC CRAFTING TREE (Right Tree - Fire Tree)
-- ==============================================

-- Tier 1 - Foundation
INSERT INTO skills (id, name, description, icon, tier, position_x, position_y, skill_tree, prerequisites, cost_skill_points, cost_level, cost_gold, max_rank, category, effects) VALUES
('magic_foundation', 'Magic Foundation', 'Basic magical knowledge and energy manipulation', '🔮', 1, 0, 0, 'magic', '{}'::text[], 1, 1, 0, 1, 'passive', '[{"type": "stat_bonus", "target": "mana", "value": 20, "description": "+20 Mana"}]'::jsonb);

-- Tier 2 - Elemental paths
INSERT INTO skills (id, name, description, icon, tier, position_x, position_y, skill_tree, prerequisites, cost_skill_points, cost_level, cost_gold, max_rank, category, effects) VALUES
('magic_fire_path', 'Fire Magic', 'Master the element of fire', '🔥', 2, -1, 1, 'magic', '{"magic_foundation"}'::text[], 2, 5, 0, 3, 'passive', '[{"type": "stat_bonus", "target": "fire_damage", "value": 15, "description": "+15 Fire Damage"}]'::jsonb),
('magic_ice_path', 'Ice Magic', 'Master the element of ice', '❄️', 2, 0, 1, 'magic', '{"magic_foundation"}'::text[], 2, 5, 0, 3, 'passive', '[{"type": "stat_bonus", "target": "ice_damage", "value": 15, "description": "+15 Ice Damage"}]'::jsonb),
('magic_arcane_path', 'Arcane Magic', 'Master pure magical energy', '✨', 2, 1, 1, 'magic', '{"magic_foundation"}'::text[], 2, 5, 0, 3, 'passive', '[{"type": "stat_bonus", "target": "arcane_damage", "value": 15, "description": "+15 Arcane Damage"}]'::jsonb);

-- Tier 3 - Advanced elemental magic
INSERT INTO skills (id, name, description, icon, tier, position_x, position_y, skill_tree, prerequisites, cost_skill_points, cost_level, cost_gold, max_rank, category, effects) VALUES
('magic_fireball', 'Fireball', 'Launch a powerful fireball', '🔥💥', 3, -2, 2, 'magic', '{"magic_fire_path"}'::text[], 3, 10, 0, 2, 'active', '[{"type": "ability_unlock", "target": "fireball", "value": 1, "description": "Unlocks Fireball spell"}]'::jsonb),
('magic_fire_wall', 'Fire Wall', 'Create a wall of flames', '🔥🧱', 3, -1, 2, 'magic', '{"magic_fire_path"}'::text[], 3, 10, 0, 2, 'active', '[{"type": "ability_unlock", "target": "fire_wall", "value": 1, "description": "Unlocks Fire Wall spell"}]'::jsonb),
('magic_ice_shard', 'Ice Shard', 'Launch sharp ice projectiles', '❄️🗡️', 3, 0, 2, 'magic', '{"magic_ice_path"}'::text[], 3, 10, 0, 2, 'active', '[{"type": "ability_unlock", "target": "ice_shard", "value": 1, "description": "Unlocks Ice Shard spell"}]'::jsonb),
('magic_ice_armor', 'Ice Armor', 'Protective ice barrier', '❄️🛡️', 3, 1, 2, 'magic', '{"magic_ice_path"}'::text[], 3, 10, 0, 2, 'active', '[{"type": "ability_unlock", "target": "ice_armor", "value": 1, "description": "Unlocks Ice Armor spell"}]'::jsonb),
('magic_arcane_bolt', 'Arcane Bolt', 'Pure magical energy projectile', '✨⚡', 3, 2, 2, 'magic', '{"magic_arcane_path"}'::text[], 3, 10, 0, 2, 'active', '[{"type": "ability_unlock", "target": "arcane_bolt", "value": 1, "description": "Unlocks Arcane Bolt spell"}]'::jsonb);

-- Tier 4 - Master spells
INSERT INTO skills (id, name, description, icon, tier, position_x, position_y, skill_tree, prerequisites, cost_skill_points, cost_level, cost_gold, max_rank, category, effects) VALUES
('magic_meteor', 'Meteor', 'Summon a meteor from the sky', '☄️', 4, -2, 3, 'magic', '{"magic_fireball", "magic_fire_wall"}'::text[], 5, 18, 0, 1, 'active', '[{"type": "ability_unlock", "target": "meteor", "value": 1, "description": "Unlocks Meteor spell"}]'::jsonb),
('magic_blizzard', 'Blizzard', 'Create a devastating ice storm', '🌨️', 4, -1, 3, 'magic', '{"magic_ice_shard", "magic_ice_armor"}'::text[], 5, 18, 0, 1, 'active', '[{"type": "ability_unlock", "target": "blizzard", "value": 1, "description": "Unlocks Blizzard spell"}]'::jsonb),
('magic_arcane_storm', 'Arcane Storm', 'Unleash pure magical chaos', '⚡💫', 4, 0, 3, 'magic', '{"magic_arcane_bolt"}'::text[], 5, 18, 0, 1, 'active', '[{"type": "ability_unlock", "target": "arcane_storm", "value": 1, "description": "Unlocks Arcane Storm spell"}]'::jsonb),
('magic_elemental_fusion', 'Elemental Fusion', 'Combine fire and ice magic', '🔥❄️', 4, 1, 3, 'magic', '{"magic_fire_path", "magic_ice_path"}'::text[], 6, 20, 0, 1, 'passive', '[{"type": "stat_bonus", "target": "elemental_mastery", "value": 40, "description": "+40% Elemental Mastery"}]'::jsonb);

-- Tier 5 - Ultimate magic
INSERT INTO skills (id, name, description, icon, tier, position_x, position_y, skill_tree, prerequisites, cost_skill_points, cost_level, cost_gold, max_rank, category, effects) VALUES
('magic_ultimate_mage', 'Ultimate Mage', 'Master of all magical arts', '🧙‍♂️', 5, 0, 4, 'magic', '{"magic_meteor", "magic_blizzard", "magic_arcane_storm", "magic_elemental_fusion"}'::text[], 10, 30, 0, 1, 'ultimate', '[{"type": "stat_bonus", "target": "magic_power", "value": 100, "description": "+100% Magic Power"}]'::jsonb);

-- ==============================================
-- CRAFTING TREE (Middle Tree - Specialization)
-- ==============================================

-- Tier 1 - Foundation
INSERT INTO skills (id, name, description, icon, tier, position_x, position_y, skill_tree, prerequisites, cost_skill_points, cost_level, cost_gold, max_rank, category, effects) VALUES
('crafting_foundation', 'Crafting Foundation', 'Basic crafting knowledge and techniques', '🔨', 1, 0, 0, 'crafting', '{}'::text[], 1, 1, 0, 1, 'passive', '[{"type": "stat_bonus", "target": "crafting_speed", "value": 10, "description": "+10% Crafting Speed"}]'::jsonb);

-- Tier 2 - Specialization paths
INSERT INTO skills (id, name, description, icon, tier, position_x, position_y, skill_tree, prerequisites, cost_skill_points, cost_level, cost_gold, max_rank, category, effects) VALUES
('crafting_weapon_smith', 'Weapon Smithing', 'Master the art of weapon crafting', '⚔️🔨', 2, -1, 1, 'crafting', '{"crafting_foundation"}'::text[], 2, 5, 0, 3, 'passive', '[{"type": "stat_bonus", "target": "weapon_quality", "value": 20, "description": "+20% Weapon Quality"}]'::jsonb),
('crafting_armor_smith', 'Armor Smithing', 'Master the art of armor crafting', '🛡️🔨', 2, 0, 1, 'crafting', '{"crafting_foundation"}'::text[], 2, 5, 0, 3, 'passive', '[{"type": "stat_bonus", "target": "armor_quality", "value": 20, "description": "+20% Armor Quality"}]'::jsonb),
('crafting_enchanting', 'Enchanting', 'Master the art of magical enhancement', '✨🔨', 2, 1, 1, 'crafting', '{"crafting_foundation"}'::text[], 2, 5, 0, 3, 'passive', '[{"type": "stat_bonus", "target": "enchant_power", "value": 25, "description": "+25% Enchant Power"}]'::jsonb);

-- Tier 3 - Advanced crafting
INSERT INTO skills (id, name, description, icon, tier, position_x, position_y, skill_tree, prerequisites, cost_skill_points, cost_level, cost_gold, max_rank, category, effects) VALUES
('crafting_master_weapons', 'Master Weapons', 'Craft legendary weapons', '⚔️👑', 3, -1, 2, 'crafting', '{"crafting_weapon_smith"}'::text[], 3, 10, 0, 2, 'passive', '[{"type": "stat_bonus", "target": "legendary_weapon_chance", "value": 15, "description": "+15% Legendary Weapon Chance"}]'::jsonb),
('crafting_master_armor', 'Master Armor', 'Craft legendary armor', '🛡️👑', 3, 0, 2, 'crafting', '{"crafting_armor_smith"}'::text[], 3, 10, 0, 2, 'passive', '[{"type": "stat_bonus", "target": "legendary_armor_chance", "value": 15, "description": "+15% Legendary Armor Chance"}]'::jsonb),
('crafting_master_enchanting', 'Master Enchanting', 'Create powerful magical enhancements', '✨👑', 3, 1, 2, 'crafting', '{"crafting_enchanting"}'::text[], 3, 10, 0, 2, 'passive', '[{"type": "stat_bonus", "target": "legendary_enchant_chance", "value": 15, "description": "+15% Legendary Enchant Chance"}]'::jsonb);

-- Tier 4 - Legendary crafting
INSERT INTO skills (id, name, description, icon, tier, position_x, position_y, skill_tree, prerequisites, cost_skill_points, cost_level, cost_gold, max_rank, category, effects) VALUES
('crafting_legendary_artisan', 'Legendary Artisan', 'Craft the most powerful items', '👑🔨', 4, 0, 3, 'crafting', '{"crafting_master_weapons", "crafting_master_armor", "crafting_master_enchanting"}'::text[], 5, 18, 0, 1, 'passive', '[{"type": "stat_bonus", "target": "legendary_crafting", "value": 50, "description": "+50% Legendary Crafting Power"}]'::jsonb);

-- ==============================================
-- UPDATE POSITIONING FOR THREE TREE LAYOUT
-- ==============================================

-- Combat tree (left) - adjust X positions to be on the left
UPDATE skills SET position_x = position_x - 4 WHERE skill_tree = 'combat';

-- Magic tree (right) - adjust X positions to be on the right  
UPDATE skills SET position_x = position_x + 4 WHERE skill_tree = 'magic';

-- Crafting tree (middle) - keep centered
-- No adjustment needed as it's already centered

-- ==============================================
-- ADD VISUAL CONNECTION DATA
-- ==============================================

-- Add a new column to track visual connections between skills
ALTER TABLE skills ADD COLUMN IF NOT EXISTS visual_connections TEXT[] DEFAULT '{}';

-- Update skills with their visual connections
UPDATE skills SET visual_connections = '{"combat_sword_path", "combat_magic_path", "combat_defense_path"}'::text[] WHERE id = 'combat_foundation';
UPDATE skills SET visual_connections = '{"combat_dual_swords", "combat_sword_magic"}'::text[] WHERE id = 'combat_sword_path';
UPDATE skills SET visual_connections = '{"combat_sword_magic", "combat_magic_blast", "combat_defensive_magic"}'::text[] WHERE id = 'combat_magic_path';
UPDATE skills SET visual_connections = '{"combat_shield_bash", "combat_defensive_magic"}'::text[] WHERE id = 'combat_defense_path';

-- Magic tree connections
UPDATE skills SET visual_connections = '{"magic_fire_path", "magic_ice_path", "magic_arcane_path"}'::text[] WHERE id = 'magic_foundation';
UPDATE skills SET visual_connections = '{"magic_fireball", "magic_fire_wall"}'::text[] WHERE id = 'magic_fire_path';
UPDATE skills SET visual_connections = '{"magic_ice_shard", "magic_ice_armor"}'::text[] WHERE id = 'magic_ice_path';
UPDATE skills SET visual_connections = '{"magic_arcane_bolt"}'::text[] WHERE id = 'magic_arcane_path';

-- Crafting tree connections
UPDATE skills SET visual_connections = '{"crafting_weapon_smith", "crafting_armor_smith", "crafting_enchanting"}'::text[] WHERE id = 'crafting_foundation';
UPDATE skills SET visual_connections = '{"crafting_master_weapons"}'::text[] WHERE id = 'crafting_weapon_smith';
UPDATE skills SET visual_connections = '{"crafting_master_armor"}'::text[] WHERE id = 'crafting_armor_smith';
UPDATE skills SET visual_connections = '{"crafting_master_enchanting"}'::text[] WHERE id = 'crafting_enchanting';

-- ==============================================
-- UPDATE PLAYER PROGRESSION
-- ==============================================

-- Reset all character skills
UPDATE character_skills SET current_rank = 0, is_unlocked = false;

-- Update player progression to reflect new skill system
UPDATE player_progression
SET 
    skill_points = calculate_skill_points(c.level),
    level_skill_points = calculate_skill_points(c.level),
    unspent_skill_points = calculate_unspent_skill_points(c.id)
FROM characters c
WHERE player_progression.character_id = c.id;
