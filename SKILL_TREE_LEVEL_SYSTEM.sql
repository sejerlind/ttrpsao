-- ==============================================
-- SKILL TREE LEVEL SYSTEM UPDATE
-- ==============================================
-- This script updates the skill tree system to give players 2 skill points per level
-- and properly tracks skill progression based on character level

-- ==============================================
-- 0. ERROR HANDLING AND CLEANUP
-- ==============================================

-- Drop existing triggers and functions if they exist to avoid conflicts
DROP TRIGGER IF EXISTS trigger_update_skill_points ON characters;
DROP FUNCTION IF EXISTS calculate_skill_points(INTEGER);
DROP FUNCTION IF EXISTS calculate_unspent_skill_points(UUID);
DROP FUNCTION IF EXISTS upgrade_skill(UUID, VARCHAR);
DROP FUNCTION IF EXISTS update_skill_points_on_level_up();
DROP FUNCTION IF EXISTS test_level_up_character(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_character_skill_summary(UUID);

-- ==============================================
-- 1. CREATE PLAYER PROGRESSION TABLE
-- ==============================================

-- Create player_progression table if it doesn't exist
CREATE TABLE IF NOT EXISTS player_progression (
    character_id UUID PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
    total_level INTEGER DEFAULT 1,
    skill_points INTEGER DEFAULT 0,
    unspent_skill_points INTEGER DEFAULT 0,
    level_skill_points INTEGER DEFAULT 0,
    talent_points INTEGER DEFAULT 0,
    unspent_talent_points INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create skills table if it doesn't exist
CREATE TABLE IF NOT EXISTS skills (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    tier INTEGER DEFAULT 1,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    skill_tree VARCHAR(50) NOT NULL,
    prerequisites TEXT[] DEFAULT '{}',
    cost_skill_points INTEGER DEFAULT 1,
    cost_level INTEGER DEFAULT 1,
    cost_gold INTEGER DEFAULT 0,
    max_rank INTEGER DEFAULT 1,
    category VARCHAR(20) DEFAULT 'passive',
    effects JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create character_skills table if it doesn't exist
CREATE TABLE IF NOT EXISTS character_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    skill_id VARCHAR(100) REFERENCES skills(id) ON DELETE CASCADE,
    current_rank INTEGER DEFAULT 0,
    is_unlocked BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(character_id, skill_id)
);

-- ==============================================
-- 2. CREATE SKILL POINT FUNCTIONS
-- ==============================================

-- Add function to calculate skill points based on level
CREATE OR REPLACE FUNCTION calculate_skill_points(character_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Give 2 skill points per level
    RETURN character_level * 2;
END;
$$ LANGUAGE plpgsql;

-- Add function to calculate unspent skill points
CREATE OR REPLACE FUNCTION calculate_unspent_skill_points(p_character_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_skill_points INTEGER;
    spent_skill_points INTEGER;
BEGIN
    -- Get total skill points from character level
    SELECT calculate_skill_points(c.level) INTO total_skill_points
    FROM characters c
    WHERE c.id = p_character_id;
    
    -- Get spent skill points from character_skills
    SELECT COALESCE(SUM(cs.current_rank), 0) INTO spent_skill_points
    FROM character_skills cs
    WHERE cs.character_id = p_character_id;
    
    RETURN total_skill_points - spent_skill_points;
END;
$$ LANGUAGE plpgsql;

-- Update player_progression table to use calculated values
ALTER TABLE player_progression 
ADD COLUMN IF NOT EXISTS level_skill_points INTEGER DEFAULT 0;

-- Create trigger to automatically update skill points when character levels up
CREATE OR REPLACE FUNCTION update_skill_points_on_level_up()
RETURNS TRIGGER AS $$
DECLARE
    new_skill_points INTEGER;
    current_progression RECORD;
BEGIN
    -- Calculate new skill points based on new level
    new_skill_points := calculate_skill_points(NEW.level);
    
    -- Get current progression data
    SELECT * INTO current_progression
    FROM player_progression
    WHERE character_id = NEW.id;
    
    -- Update or insert progression data
    IF current_progression IS NOT NULL THEN
        UPDATE player_progression
        SET 
            total_level = NEW.level,
            skill_points = new_skill_points,
            level_skill_points = new_skill_points,
            unspent_skill_points = calculate_unspent_skill_points(NEW.id),
            updated_at = NOW()
        WHERE character_id = NEW.id;
    ELSE
        INSERT INTO player_progression (
            character_id,
            total_level,
            skill_points,
            level_skill_points,
            unspent_skill_points,
            talent_points,
            unspent_talent_points
        ) VALUES (
            NEW.id,
            NEW.level,
            new_skill_points,
            new_skill_points,
            new_skill_points, -- Start with all points unspent
            0,
            0
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on characters table
DROP TRIGGER IF EXISTS trigger_update_skill_points ON characters;
CREATE TRIGGER trigger_update_skill_points
    AFTER UPDATE OF level ON characters
    FOR EACH ROW
    WHEN (OLD.level IS DISTINCT FROM NEW.level)
    EXECUTE FUNCTION update_skill_points_on_level_up();

-- ==============================================
-- 3. UPDATE SKILL UPGRADE LOGIC
-- ==============================================

-- Function to upgrade a skill
CREATE OR REPLACE FUNCTION upgrade_skill(
    p_character_id UUID,
    p_skill_id VARCHAR(100)
)
RETURNS JSON AS $$
DECLARE
    character_level INTEGER;
    skill_data RECORD;
    character_skill RECORD;
    unspent_points INTEGER;
    new_rank INTEGER;
    result JSON;
BEGIN
    -- Get character level
    SELECT level INTO character_level
    FROM characters
    WHERE id = p_character_id;
    
    -- Check if character exists
    IF character_level IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Character not found');
    END IF;
    
    -- Get skill data
    SELECT * INTO skill_data
    FROM skills
    WHERE id = p_skill_id;
    
    -- Check if skill exists
    IF skill_data IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Skill not found');
    END IF;
    
    -- Get current character skill data
    SELECT * INTO character_skill
    FROM character_skills
    WHERE character_id = p_character_id AND skill_id = p_skill_id;
    
    -- Get unspent skill points
    unspent_points := calculate_unspent_skill_points(p_character_id);
    
    -- Check if character has enough skill points
    IF unspent_points < skill_data.cost_skill_points THEN
        RETURN json_build_object('success', false, 'message', 'Not enough skill points');
    END IF;
    
    -- Check level requirement
    IF character_level < skill_data.cost_level THEN
        RETURN json_build_object('success', false, 'message', 'Level requirement not met');
    END IF;
    
    -- Check if skill is already maxed
    IF character_skill IS NOT NULL AND character_skill.current_rank >= skill_data.max_rank THEN
        RETURN json_build_object('success', false, 'message', 'Skill is already maxed');
    END IF;
    
    -- Upgrade the skill
    IF character_skill IS NULL THEN
        -- Insert new character skill
        INSERT INTO character_skills (character_id, skill_id, current_rank, is_unlocked, unlocked_at)
        VALUES (p_character_id, p_skill_id, 1, true, NOW());
        new_rank := 1;
    ELSE
        -- Update existing character skill
        new_rank := character_skill.current_rank + 1;
        UPDATE character_skills
        SET 
            current_rank = new_rank,
            is_unlocked = true,
            unlocked_at = CASE WHEN unlocked_at IS NULL THEN NOW() ELSE unlocked_at END
        WHERE character_id = p_character_id AND skill_id = p_skill_id;
    END IF;
    
    -- Update unspent skill points
    UPDATE player_progression
    SET 
        unspent_skill_points = calculate_unspent_skill_points(p_character_id),
        updated_at = NOW()
    WHERE character_id = p_character_id;
    
    -- Return success with skill details
    RETURN json_build_object(
        'success', true, 
        'message', 'Skill upgraded successfully',
        'skill_id', p_skill_id,
        'new_rank', new_rank,
        'is_unlocked', true,
        'remaining_points', calculate_unspent_skill_points(p_character_id)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Database error: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 4. INITIALIZE EXISTING CHARACTERS
-- ==============================================

-- Ensure all characters have player_progression records
INSERT INTO player_progression (character_id, total_level, skill_points, level_skill_points, unspent_skill_points, talent_points, unspent_talent_points)
SELECT 
    c.id,
    c.level,
    calculate_skill_points(c.level),
    calculate_skill_points(c.level),
    calculate_skill_points(c.level),
    0,
    0
FROM characters c
WHERE NOT EXISTS (
    SELECT 1 FROM player_progression pp WHERE pp.character_id = c.id
);

-- Update existing characters to have proper skill points
UPDATE player_progression
SET 
    skill_points = calculate_skill_points(c.level),
    level_skill_points = calculate_skill_points(c.level),
    unspent_skill_points = calculate_unspent_skill_points(c.id)
FROM characters c
WHERE player_progression.character_id = c.id;

-- ==============================================
-- 5. SAMPLE SKILL DATA
-- ==============================================

-- Insert sample skills if they don't exist
INSERT INTO skills (id, name, description, icon, tier, position_x, position_y, skill_tree, prerequisites, cost_skill_points, cost_level, cost_gold, max_rank, category, effects) 
SELECT * FROM (VALUES
    -- Combat Tree
    ('combat_basic_attack', 'Basic Combat', 'Foundation of all combat techniques. Increases basic attack damage and accuracy.', '⚔️', 1, 0, 0, 'combat', '{}'::text[], 1, 1, 0, 5, 'passive', '[]'::jsonb),
    ('combat_sword_mastery', 'Sword Mastery', 'Advanced sword combat techniques for increased damage and critical strikes.', '🗡️', 2, 2, 0, 'combat', '{"combat_basic_attack"}'::text[], 2, 5, 0, 3, 'passive', '[]'::jsonb),
    ('combat_berserker_rage', 'Berserker Rage', 'Enter a rage state for massive damage at the cost of defense.', '😡', 3, 4, 0, 'combat', '{"combat_sword_mastery"}'::text[], 4, 15, 0, 1, 'active', '[]'::jsonb),
    ('combat_weapon_throw', 'Weapon Throw', 'Throw your weapon at enemies for ranged damage.', '🪃', 2, 2, 2, 'combat', '{"combat_basic_attack"}'::text[], 3, 8, 0, 1, 'active', '[]'::jsonb),
    ('combat_dual_wield', 'Dual Wielding', 'Master the art of fighting with two weapons simultaneously.', '⚔️⚔️', 2, 0, 2, 'combat', '{"combat_basic_attack"}'::text[], 3, 7, 0, 3, 'passive', '[]'::jsonb),
    ('combat_whirlwind', 'Whirlwind Attack', 'Spin in a circle, attacking all nearby enemies.', '🌪️', 3, 0, 4, 'combat', '{"combat_dual_wield"}'::text[], 5, 12, 0, 1, 'active', '[]'::jsonb),
    ('combat_execute', 'Execute', 'Deal massive damage to enemies below 25% health.', '💀', 3, 2, 4, 'combat', '{"combat_sword_mastery"}'::text[], 4, 18, 0, 1, 'active', '[]'::jsonb),
    ('combat_bloodthirst', 'Bloodthirst', 'Heal for a percentage of damage dealt.', '🩸', 4, 6, 0, 'combat', '{"combat_berserker_rage"}'::text[], 6, 25, 0, 3, 'passive', '[]'::jsonb),
    ('combat_weapon_mastery', 'Weapon Mastery', 'Master all weapon types for increased versatility.', '🏆', 5, 2, 6, 'combat', '{"combat_execute", "combat_whirlwind"}'::text[], 10, 35, 10000, 1, 'legendary', '[]'::jsonb),
    
    -- Magic Tree
    ('magic_basic_spells', 'Basic Magic', 'Foundation of magical knowledge and mana manipulation.', '🔮', 1, 0, 2, 'magic', '{}'::text[], 1, 1, 0, 5, 'passive', '[]'::jsonb),
    ('magic_fireball', 'Fireball', 'Launch a devastating fireball at your enemies.', '🔥', 2, 2, 2, 'magic', '{"magic_basic_spells"}'::text[], 3, 8, 0, 1, 'active', '[]'::jsonb),
    ('magic_ice_shard', 'Ice Shard', 'Freeze and damage enemies with ice magic.', '❄️', 2, 0, 4, 'magic', '{"magic_basic_spells"}'::text[], 3, 10, 0, 1, 'active', '[]'::jsonb),
    ('magic_lightning_bolt', 'Lightning Bolt', 'Strike enemies with powerful electrical energy.', '⚡', 2, 4, 2, 'magic', '{"magic_basic_spells"}'::text[], 3, 9, 0, 1, 'active', '[]'::jsonb),
    ('magic_heal', 'Healing Spell', 'Restore health to yourself or allies.', '💚', 2, 2, 4, 'magic', '{"magic_basic_spells"}'::text[], 3, 6, 0, 3, 'active', '[]'::jsonb),
    ('magic_meteor', 'Meteor', 'Call down a massive meteor for devastating area damage.', '☄️', 4, 4, 4, 'magic', '{"magic_fireball"}'::text[], 8, 25, 5000, 1, 'ultimate', '[]'::jsonb),
    ('magic_blizzard', 'Blizzard', 'Create a freezing storm that damages all enemies.', '🌨️', 4, 0, 6, 'magic', '{"magic_ice_shard"}'::text[], 8, 28, 0, 1, 'ultimate', '[]'::jsonb),
    ('magic_chain_lightning', 'Chain Lightning', 'Lightning that jumps between multiple enemies.', '⚡⚡', 3, 6, 2, 'magic', '{"magic_lightning_bolt"}'::text[], 5, 15, 0, 1, 'active', '[]'::jsonb),
    ('magic_mana_shield', 'Mana Shield', 'Convert mana into a protective barrier.', '🔵', 3, 2, 6, 'magic', '{"magic_heal"}'::text[], 4, 12, 0, 3, 'passive', '[]'::jsonb),
    ('magic_arcane_mastery', 'Arcane Mastery', 'Master all schools of magic for ultimate power.', '🌟', 5, 2, 8, 'magic', '{"magic_meteor", "magic_blizzard"}'::text[], 12, 40, 15000, 1, 'legendary', '[]'::jsonb),
    
    -- Defensive Tree
    ('defense_basic_block', 'Basic Defense', 'Learn the fundamentals of blocking and damage reduction.', '🛡️', 1, 0, 4, 'defensive', '{}'::text[], 1, 1, 0, 5, 'passive', '[]'::jsonb),
    ('defense_iron_skin', 'Iron Skin', 'Harden your skin to reduce incoming damage.', '🛡️', 2, 2, 4, 'defensive', '{"defense_basic_block"}'::text[], 2, 6, 0, 3, 'passive', '[]'::jsonb),
    ('defense_dodge', 'Dodge', 'Learn to avoid attacks through agility and reflexes.', '💨', 2, 0, 6, 'defensive', '{"defense_basic_block"}'::text[], 2, 8, 0, 3, 'passive', '[]'::jsonb),
    ('defense_taunt', 'Taunt', 'Force enemies to focus their attacks on you.', '😤', 2, 2, 6, 'defensive', '{"defense_iron_skin"}'::text[], 3, 10, 0, 1, 'active', '[]'::jsonb),
    ('defense_reflect', 'Damage Reflection', 'Reflect a portion of incoming damage back to attackers.', '↩️', 3, 4, 4, 'defensive', '{"defense_iron_skin"}'::text[], 4, 16, 0, 3, 'passive', '[]'::jsonb),
    ('defense_immunity', 'Elemental Immunity', 'Become immune to certain types of elemental damage.', '🛡️✨', 3, 0, 8, 'defensive', '{"defense_dodge"}'::text[], 5, 20, 0, 1, 'passive', '[]'::jsonb),
    ('defense_guardian', 'Guardian Angel', 'Protect allies by absorbing damage meant for them.', '👼', 4, 2, 8, 'defensive', '{"defense_taunt", "defense_reflect"}'::text[], 7, 30, 0, 1, 'ultimate', '[]'::jsonb),
    ('defense_fortress', 'Fortress Mastery', 'Become an impenetrable fortress of defense.', '🏰', 5, 2, 10, 'defensive', '{"defense_guardian", "defense_immunity"}'::text[], 10, 45, 20000, 1, 'legendary', '[]'::jsonb),
    
    -- Crafting Tree
    ('crafting_basic_smithing', 'Basic Smithing', 'Learn to forge basic weapons and armor.', '🔨', 1, 0, 6, 'crafting', '{}'::text[], 1, 1, 0, 5, 'passive', '[]'::jsonb),
    ('crafting_enchanting', 'Enchanting', 'Imbue weapons and armor with magical properties.', '✨', 2, 2, 6, 'crafting', '{"crafting_basic_smithing"}'::text[], 3, 12, 0, 3, 'passive', '[]'::jsonb),
    ('crafting_alchemy', 'Alchemy', 'Brew potions and create magical elixirs.', '🧪', 2, 0, 8, 'crafting', '{"crafting_basic_smithing"}'::text[], 3, 10, 0, 3, 'passive', '[]'::jsonb),
    ('crafting_jewelry', 'Jewelry Making', 'Craft rings, amulets, and other magical accessories.', '💍', 2, 2, 8, 'crafting', '{"crafting_enchanting"}'::text[], 4, 14, 0, 3, 'passive', '[]'::jsonb),
    ('crafting_engineering', 'Engineering', 'Build mechanical devices and contraptions.', '⚙️', 3, 4, 6, 'crafting', '{"crafting_enchanting"}'::text[], 5, 18, 0, 3, 'passive', '[]'::jsonb),
    ('crafting_runes', 'Rune Crafting', 'Carve powerful runes for magical effects.', '🔤', 3, 0, 10, 'crafting', '{"crafting_alchemy"}'::text[], 5, 22, 0, 3, 'passive', '[]'::jsonb),
    ('crafting_artifacts', 'Artifact Creation', 'Create legendary artifacts of immense power.', '🏺', 4, 2, 10, 'crafting', '{"crafting_engineering", "crafting_runes"}'::text[], 8, 35, 0, 1, 'ultimate', '[]'::jsonb),
    ('crafting_master', 'Master Craftsman', 'Become the ultimate master of all crafting disciplines.', '👨‍🔬', 5, 2, 12, 'crafting', '{"crafting_artifacts"}'::text[], 12, 50, 25000, 1, 'legendary', '[]'::jsonb),
    
    -- Exploration Tree
    ('exploration_pathfinding', 'Pathfinding', 'Navigate through difficult terrain with ease.', '🗺️', 1, 0, 8, 'exploration', '{}'::text[], 1, 1, 0, 3, 'passive', '[]'::jsonb),
    ('exploration_treasure_hunter', 'Treasure Hunter', 'Find hidden treasures and rare items.', '💎', 2, 2, 8, 'exploration', '{"exploration_pathfinding"}'::text[], 2, 8, 0, 5, 'passive', '[]'::jsonb),
    ('exploration_stealth', 'Stealth', 'Move silently and remain undetected by enemies.', '🥷', 2, 0, 10, 'exploration', '{"exploration_pathfinding"}'::text[], 2, 6, 0, 3, 'passive', '[]'::jsonb),
    ('exploration_tracking', 'Tracking', 'Follow trails and detect hidden passages.', '👁️', 2, 2, 10, 'exploration', '{"exploration_stealth"}'::text[], 3, 10, 0, 3, 'passive', '[]'::jsonb),
    ('exploration_survival', 'Wilderness Survival', 'Thrive in harsh environments and extreme conditions.', '🏕️', 3, 4, 8, 'exploration', '{"exploration_treasure_hunter"}'::text[], 4, 15, 0, 3, 'passive', '[]'::jsonb),
    ('exploration_detection', 'Danger Detection', 'Sense traps, ambushes, and hidden threats.', '⚠️', 3, 0, 12, 'exploration', '{"exploration_tracking"}'::text[], 4, 18, 0, 3, 'passive', '[]'::jsonb),
    ('exploration_explorer', 'Master Explorer', 'Discover the deepest secrets of the world.', '🗺️🌟', 4, 2, 12, 'exploration', '{"exploration_survival", "exploration_detection"}'::text[], 6, 30, 0, 1, 'ultimate', '[]'::jsonb),
    ('exploration_legend', 'Exploration Legend', 'Become a legendary figure known across all lands.', '🏆', 5, 2, 14, 'exploration', '{"exploration_explorer"}'::text[], 10, 45, 30000, 1, 'legendary', '[]'::jsonb),
    
    -- Social Tree
    ('social_charisma', 'Charisma', 'Improve your ability to influence others.', '💬', 1, 0, 10, 'social', '{}'::text[], 1, 1, 0, 5, 'passive', '[]'::jsonb),
    ('social_leadership', 'Leadership', 'Inspire allies and boost party performance.', '👑', 2, 2, 10, 'social', '{"social_charisma"}'::text[], 3, 10, 0, 3, 'passive', '[]'::jsonb),
    ('social_persuasion', 'Persuasion', 'Convince others to see things your way.', '🗣️', 2, 0, 12, 'social', '{"social_charisma"}'::text[], 3, 8, 0, 3, 'passive', '[]'::jsonb),
    ('social_intimidation', 'Intimidation', 'Use fear and presence to get what you want.', '😠', 2, 2, 12, 'social', '{"social_persuasion"}'::text[], 3, 12, 0, 3, 'passive', '[]'::jsonb),
    ('social_diplomacy', 'Diplomacy', 'Resolve conflicts through negotiation and compromise.', '🤝', 3, 4, 10, 'social', '{"social_leadership"}'::text[], 4, 16, 0, 3, 'passive', '[]'::jsonb),
    ('social_networking', 'Networking', 'Build connections and gather information from contacts.', '🕸️', 3, 0, 14, 'social', '{"social_persuasion"}'::text[], 4, 20, 0, 3, 'passive', '[]'::jsonb),
    ('social_influence', 'Master of Influence', 'Become the ultimate social manipulator.', '🎭', 4, 2, 14, 'social', '{"social_diplomacy", "social_networking"}'::text[], 6, 32, 0, 1, 'ultimate', '[]'::jsonb),
    ('social_legend', 'Social Legend', 'Your reputation precedes you wherever you go.', '🌟', 5, 2, 16, 'social', '{"social_influence"}'::text[], 10, 50, 35000, 1, 'legendary', '[]'::jsonb)
) AS new_skills(id, name, description, icon, tier, position_x, position_y, skill_tree, prerequisites, cost_skill_points, cost_level, cost_gold, max_rank, category, effects)
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE skills.id = new_skills.id);

-- ==============================================
-- 6. GRANT PERMISSIONS
-- ==============================================

-- Function to reset all skills for a character
CREATE OR REPLACE FUNCTION reset_character_skills(p_character_id UUID)
RETURNS JSON AS $$
DECLARE
    character_level INTEGER;
    total_skill_points INTEGER;
    result JSON;
BEGIN
    -- Get character level
    SELECT level INTO character_level
    FROM characters
    WHERE id = p_character_id;
    
    -- Check if character exists
    IF character_level IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Character not found');
    END IF;
    
    -- Calculate total skill points for this level
    total_skill_points := calculate_skill_points(character_level);
    
    -- Delete all character skills
    DELETE FROM character_skills WHERE character_id = p_character_id;
    
    -- Reset player progression
    UPDATE player_progression
    SET 
        unspent_skill_points = total_skill_points,
        updated_at = NOW()
    WHERE character_id = p_character_id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'All skills have been reset',
        'character_id', p_character_id,
        'level', character_level,
        'skill_points_restored', total_skill_points
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Database error: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION calculate_skill_points(INTEGER) TO PUBLIC;
GRANT EXECUTE ON FUNCTION calculate_unspent_skill_points(UUID) TO PUBLIC;
GRANT EXECUTE ON FUNCTION upgrade_skill(UUID, VARCHAR) TO PUBLIC;
GRANT EXECUTE ON FUNCTION update_skill_points_on_level_up() TO PUBLIC;
GRANT EXECUTE ON FUNCTION reset_character_skills(UUID) TO PUBLIC;

-- ==============================================
-- 7. HANDLE EXISTING POLICIES
-- ==============================================

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations on characters" ON characters;
DROP POLICY IF EXISTS "Enable read access for all users" ON characters;
DROP POLICY IF EXISTS "Enable insert for all users" ON characters;
DROP POLICY IF EXISTS "Enable update for all users" ON characters;
DROP POLICY IF EXISTS "Enable delete for all users" ON characters;

-- Recreate policies
CREATE POLICY "Allow all operations on characters" ON characters
    FOR ALL USING (true) WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 8. VERIFICATION QUERIES
-- ==============================================

-- Query to check skill points for all characters
-- SELECT 
--     c.name,
--     c.level,
--     pp.skill_points,
--     pp.unspent_skill_points,
--     pp.level_skill_points
-- FROM characters c
-- LEFT JOIN player_progression pp ON c.id = pp.character_id
-- ORDER BY c.level DESC;

-- Query to check character skills
-- SELECT 
--     c.name,
--     s.name as skill_name,
--     cs.current_rank,
--     cs.is_unlocked
-- FROM characters c
-- JOIN character_skills cs ON c.id = cs.character_id
-- JOIN skills s ON cs.skill_id = s.id
-- ORDER BY c.name, s.name;
