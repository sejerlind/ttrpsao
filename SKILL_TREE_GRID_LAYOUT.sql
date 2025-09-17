-- ==============================================
-- SKILL TREE GRID LAYOUT UPDATE
-- ==============================================
-- This script updates the skill tree positions to use a proper grid layout
-- Each skill tree will have a clean, organized grid structure

-- ==============================================
-- UPDATE SKILL POSITIONS FOR BETTER GRID LAYOUT
-- ==============================================

-- Update Combat Tree positions (tier-based grid)
UPDATE skills SET position_x = 0, position_y = 0 WHERE id = 'combat_basic_attack';
UPDATE skills SET position_x = 1, position_y = 0 WHERE id = 'combat_sword_mastery';
UPDATE skills SET position_x = 2, position_y = 0 WHERE id = 'combat_berserker_rage';
UPDATE skills SET position_x = 3, position_y = 0 WHERE id = 'combat_bloodthirst';

UPDATE skills SET position_x = 0, position_y = 1 WHERE id = 'combat_dual_wield';
UPDATE skills SET position_x = 1, position_y = 1 WHERE id = 'combat_weapon_throw';
UPDATE skills SET position_x = 2, position_y = 1 WHERE id = 'combat_execute';
UPDATE skills SET position_x = 3, position_y = 1 WHERE id = 'combat_whirlwind';

UPDATE skills SET position_x = 1, position_y = 2 WHERE id = 'combat_weapon_mastery';

-- Update Magic Tree positions (tier-based grid)
UPDATE skills SET position_x = 0, position_y = 0 WHERE id = 'magic_basic_spells';
UPDATE skills SET position_x = 1, position_y = 0 WHERE id = 'magic_fireball';
UPDATE skills SET position_x = 2, position_y = 0 WHERE id = 'magic_lightning_bolt';
UPDATE skills SET position_x = 3, position_y = 0 WHERE id = 'magic_chain_lightning';

UPDATE skills SET position_x = 0, position_y = 1 WHERE id = 'magic_heal';
UPDATE skills SET position_x = 1, position_y = 1 WHERE id = 'magic_ice_shard';
UPDATE skills SET position_x = 2, position_y = 1 WHERE id = 'magic_mana_shield';

UPDATE skills SET position_x = 1, position_y = 2 WHERE id = 'magic_blizzard';
UPDATE skills SET position_x = 2, position_y = 2 WHERE id = 'magic_meteor';

UPDATE skills SET position_x = 2, position_y = 3 WHERE id = 'magic_arcane_mastery';

-- Update Defensive Tree positions (tier-based grid)
UPDATE skills SET position_x = 0, position_y = 0 WHERE id = 'defense_basic_block';
UPDATE skills SET position_x = 1, position_y = 0 WHERE id = 'defense_iron_skin';
UPDATE skills SET position_x = 2, position_y = 0 WHERE id = 'defense_reflect';

UPDATE skills SET position_x = 0, position_y = 1 WHERE id = 'defense_dodge';
UPDATE skills SET position_x = 1, position_y = 1 WHERE id = 'defense_taunt';
UPDATE skills SET position_x = 2, position_y = 1 WHERE id = 'defense_guardian';

UPDATE skills SET position_x = 1, position_y = 2 WHERE id = 'defense_immunity';

UPDATE skills SET position_x = 1, position_y = 3 WHERE id = 'defense_fortress';

-- Update Crafting Tree positions (tier-based grid)
UPDATE skills SET position_x = 0, position_y = 0 WHERE id = 'crafting_basic_smithing';
UPDATE skills SET position_x = 1, position_y = 0 WHERE id = 'crafting_enchanting';
UPDATE skills SET position_x = 2, position_y = 0 WHERE id = 'crafting_engineering';

UPDATE skills SET position_x = 0, position_y = 1 WHERE id = 'crafting_alchemy';
UPDATE skills SET position_x = 1, position_y = 1 WHERE id = 'crafting_jewelry';
UPDATE skills SET position_x = 2, position_y = 1 WHERE id = 'crafting_artifacts';

UPDATE skills SET position_x = 0, position_y = 2 WHERE id = 'crafting_runes';

UPDATE skills SET position_x = 1, position_y = 3 WHERE id = 'crafting_master';

-- Update Exploration Tree positions (tier-based grid)
UPDATE skills SET position_x = 0, position_y = 0 WHERE id = 'exploration_pathfinding';
UPDATE skills SET position_x = 1, position_y = 0 WHERE id = 'exploration_treasure_hunter';
UPDATE skills SET position_x = 2, position_y = 0 WHERE id = 'exploration_survival';

UPDATE skills SET position_x = 0, position_y = 1 WHERE id = 'exploration_stealth';
UPDATE skills SET position_x = 1, position_y = 1 WHERE id = 'exploration_tracking';
UPDATE skills SET position_x = 2, position_y = 1 WHERE id = 'exploration_detection';

UPDATE skills SET position_x = 2, position_y = 2 WHERE id = 'exploration_explorer';

UPDATE skills SET position_x = 1, position_y = 3 WHERE id = 'exploration_legend';

-- Update Social Tree positions (tier-based grid)
UPDATE skills SET position_x = 0, position_y = 0 WHERE id = 'social_charisma';
UPDATE skills SET position_x = 1, position_y = 0 WHERE id = 'social_leadership';
UPDATE skills SET position_x = 2, position_y = 0 WHERE id = 'social_diplomacy';

UPDATE skills SET position_x = 0, position_y = 1 WHERE id = 'social_persuasion';
UPDATE skills SET position_x = 1, position_y = 1 WHERE id = 'social_intimidation';
UPDATE skills SET position_x = 2, position_y = 1 WHERE id = 'social_networking';

UPDATE skills SET position_x = 2, position_y = 2 WHERE id = 'social_influence';

UPDATE skills SET position_x = 1, position_y = 3 WHERE id = 'social_legend';

-- ==============================================
-- VERIFY UPDATES
-- ==============================================

-- Show the updated positions grouped by skill tree
SELECT 
    skill_tree,
    id,
    name,
    tier,
    position_x,
    position_y,
    prerequisites
FROM skills 
ORDER BY skill_tree, position_y, position_x;

