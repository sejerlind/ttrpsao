-- ==============================================
-- ABILITY SYSTEM DATABASE UPDATE (FIXED VERSION)
-- ==============================================
-- This script adds support for the new ability system by updating
-- the player_progression table to track unlocked abilities
-- This version works with the existing UUID-based abilities table

-- ==============================================
-- 1. UPDATE PLAYER_PROGRESSION TABLE
-- ==============================================

-- Add unlocked_abilities column to player_progression table
ALTER TABLE player_progression 
ADD COLUMN IF NOT EXISTS unlocked_abilities TEXT[] DEFAULT '{}';

-- Add comment to document the new column
COMMENT ON COLUMN player_progression.unlocked_abilities IS 'Array of ability IDs that the player has unlocked through skills';

-- ==============================================
-- 2. INSERT PREDEFINED ABILITIES (WITH UUIDs)
-- ==============================================

-- Insert the predefined abilities from the ability system
-- We'll use specific UUIDs that match our ability IDs for consistency
INSERT INTO abilities (id, name, description, category, cooldown_max, current_cooldown, damage, mana_cost, effects, icon) VALUES
-- Combat Abilities
('550e8400-e29b-41d4-a716-446655440001', 'Power Strike', 'A devastating melee attack that deals extra damage', 'skill', 3, 0, '2d6 + 3', 5, ARRAY['Stuns target for 1 turn on critical hit'], '⚔️'),
('550e8400-e29b-41d4-a716-446655440002', 'Whirlwind Attack', 'Spin and attack all enemies in range', 'skill', 4, 0, '1d8 + 2', 8, ARRAY['Hits all enemies', 'Cannot be interrupted'], '🌪️'),
('550e8400-e29b-41d4-a716-446655440003', 'Berserker Rage', 'Enter a rage that increases damage but reduces defense', 'skill', 6, 0, '0', 10, ARRAY['+50% damage for 3 turns', '-25% defense for 3 turns'], '😡'),
('550e8400-e29b-41d4-a716-446655440004', 'Shield Bash', 'Bash with your shield to stun and damage the enemy', 'skill', 2, 0, '1d4 + 1', 3, ARRAY['Stuns target for 1 turn', 'Requires shield equipped'], '🛡️'),

-- Magic Abilities
('550e8400-e29b-41d4-a716-446655440005', 'Fireball', 'Launch a ball of fire that explodes on impact', 'skill', 2, 0, '3d6 + 4', 12, ARRAY['Area of effect damage', 'Burns target for 2 turns'], '🔥'),
('550e8400-e29b-41d4-a716-446655440006', 'Heal', 'Restore health to yourself or an ally', 'skill', 1, 0, '0', 8, ARRAY['Restores 2d6 + 4 health', 'Can target allies'], '💚'),
('550e8400-e29b-41d4-a716-446655440007', 'Magic Missile', 'Launch magical projectiles that never miss', 'skill', 1, 0, '1d4 + 1', 3, ARRAY['Never misses', 'Can target multiple enemies'], '✨'),
('550e8400-e29b-41d4-a716-446655440008', 'Teleport', 'Instantly move to a different location', 'skill', 5, 0, '0', 15, ARRAY['Instant movement', 'Cannot be interrupted'], '🌀'),

-- Crafting Abilities
('550e8400-e29b-41d4-a716-446655440009', 'Repair Equipment', 'Fix damaged equipment using crafting materials', 'skill', 0, 0, '0', 0, ARRAY['Restores equipment durability', 'Requires repair materials'], '🔧'),
('550e8400-e29b-41d4-a716-446655440010', 'Identify Item', 'Reveal the properties of unknown magical items', 'skill', 0, 0, '0', 5, ARRAY['Reveals item properties', 'Works on any unidentified item'], '🔍'),
('550e8400-e29b-41d4-a716-446655440011', 'Enchant Weapon', 'Temporarily enhance a weapon with magical properties', 'skill', 10, 0, '0', 20, ARRAY['+2 damage for 10 turns', 'Requires enchanting materials'], '✨'),

-- Ultimate Abilities
('550e8400-e29b-41d4-a716-446655440012', 'Meteor Strike', 'Call down a massive meteor to devastate the battlefield', 'ultimate', 20, 0, '6d8 + 10', 50, ARRAY['Massive area damage', 'Stuns all enemies for 2 turns'], '☄️'),
('550e8400-e29b-41d4-a716-446655440013', 'Divine Intervention', 'Call upon divine power to restore all allies to full health', 'ultimate', 30, 0, '0', 100, ARRAY['Full heal all allies', 'Removes all debuffs', 'Grants temporary invulnerability'], '🙏')

-- Use ON CONFLICT to avoid duplicate insertions
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    cooldown_max = EXCLUDED.cooldown_max,
    current_cooldown = EXCLUDED.current_cooldown,
    damage = EXCLUDED.damage,
    mana_cost = EXCLUDED.mana_cost,
    effects = EXCLUDED.effects,
    icon = EXCLUDED.icon,
    updated_at = NOW();

-- ==============================================
-- 3. CREATE ABILITY ID MAPPING TABLE
-- ==============================================

-- Create a mapping table to link string IDs to UUIDs
CREATE TABLE IF NOT EXISTS ability_id_mapping (
    string_id VARCHAR(100) PRIMARY KEY,
    uuid_id UUID REFERENCES abilities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert mappings for all abilities
INSERT INTO ability_id_mapping (string_id, uuid_id) VALUES
('power_strike', '550e8400-e29b-41d4-a716-446655440001'),
('whirlwind_attack', '550e8400-e29b-41d4-a716-446655440002'),
('berserker_rage', '550e8400-e29b-41d4-a716-446655440003'),
('shield_bash', '550e8400-e29b-41d4-a716-446655440004'),
('fireball', '550e8400-e29b-41d4-a716-446655440005'),
('heal', '550e8400-e29b-41d4-a716-446655440006'),
('magic_missile', '550e8400-e29b-41d4-a716-446655440007'),
('teleport', '550e8400-e29b-41d4-a716-446655440008'),
('repair_equipment', '550e8400-e29b-41d4-a716-446655440009'),
('identify_item', '550e8400-e29b-41d4-a716-446655440010'),
('enchant_weapon', '550e8400-e29b-41d4-a716-446655440011'),
('meteor_strike', '550e8400-e29b-41d4-a716-446655440012'),
('divine_intervention', '550e8400-e29b-41d4-a716-446655440013')

ON CONFLICT (string_id) DO UPDATE SET
    uuid_id = EXCLUDED.uuid_id;

-- ==============================================
-- 4. CREATE ABILITY UNLOCK TRIGGER
-- ==============================================

-- Create a function to automatically unlock abilities when skills are unlocked
CREATE OR REPLACE FUNCTION unlock_abilities_on_skill_unlock()
RETURNS TRIGGER AS $$
DECLARE
    skill_abilities TEXT[];
    ability_id TEXT;
BEGIN
    -- Only process when a skill is unlocked (is_unlocked changes from false to true)
    IF OLD.is_unlocked = FALSE AND NEW.is_unlocked = TRUE THEN
        -- Get abilities that should be unlocked by this skill
        skill_abilities := CASE 
            WHEN NEW.skill_id ILIKE '%power_strike%' OR NEW.skill_id ILIKE '%power%strike%' THEN ARRAY['power_strike']
            WHEN NEW.skill_id ILIKE '%whirlwind%' THEN ARRAY['whirlwind_attack']
            WHEN NEW.skill_id ILIKE '%berserker%' THEN ARRAY['berserker_rage']
            WHEN NEW.skill_id ILIKE '%shield%' THEN ARRAY['shield_bash']
            WHEN NEW.skill_id ILIKE '%fireball%' THEN ARRAY['fireball']
            WHEN NEW.skill_id ILIKE '%heal%' THEN ARRAY['heal']
            WHEN NEW.skill_id ILIKE '%magic_missile%' OR NEW.skill_id ILIKE '%magic%missile%' THEN ARRAY['magic_missile']
            WHEN NEW.skill_id ILIKE '%teleport%' THEN ARRAY['teleport']
            WHEN NEW.skill_id ILIKE '%repair%' THEN ARRAY['repair_equipment']
            WHEN NEW.skill_id ILIKE '%identify%' THEN ARRAY['identify_item']
            WHEN NEW.skill_id ILIKE '%enchant%' THEN ARRAY['enchant_weapon']
            WHEN NEW.skill_id ILIKE '%meteor%' THEN ARRAY['meteor_strike']
            WHEN NEW.skill_id ILIKE '%divine%' THEN ARRAY['divine_intervention']
            ELSE ARRAY[]::TEXT[]
        END;
        
        -- Add new abilities to player's unlocked abilities
        IF array_length(skill_abilities, 1) > 0 THEN
            UPDATE player_progression 
            SET unlocked_abilities = array_cat(unlocked_abilities, skill_abilities)
            WHERE character_id = NEW.character_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on character_skills table
DROP TRIGGER IF EXISTS trigger_unlock_abilities ON character_skills;
CREATE TRIGGER trigger_unlock_abilities
    AFTER UPDATE ON character_skills
    FOR EACH ROW
    EXECUTE FUNCTION unlock_abilities_on_skill_unlock();

-- ==============================================
-- 5. CREATE HELPER FUNCTIONS
-- ==============================================

-- Function to get all abilities for a character (using string IDs)
CREATE OR REPLACE FUNCTION get_character_abilities(p_character_id UUID)
RETURNS TABLE (
    ability_id VARCHAR(100),
    name VARCHAR(100),
    description TEXT,
    category VARCHAR(20),
    cooldown_max INTEGER,
    current_cooldown INTEGER,
    damage VARCHAR(50),
    mana_cost INTEGER,
    effects TEXT[],
    icon VARCHAR(10)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aim.string_id as ability_id,
        a.name,
        a.description,
        a.category,
        a.cooldown_max,
        a.current_cooldown,
        a.damage,
        a.mana_cost,
        a.effects,
        a.icon
    FROM player_progression pp
    CROSS JOIN LATERAL unnest(pp.unlocked_abilities) as ability_string_id
    INNER JOIN ability_id_mapping aim ON aim.string_id = ability_string_id
    INNER JOIN abilities a ON a.id = aim.uuid_id
    WHERE pp.character_id = p_character_id;
END;
$$ LANGUAGE plpgsql;

-- Function to unlock an ability for a character (using string ID)
CREATE OR REPLACE FUNCTION unlock_ability_for_character(p_character_id UUID, p_ability_string_id VARCHAR(100))
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if ability exists in mapping
    IF NOT EXISTS (SELECT 1 FROM ability_id_mapping WHERE string_id = p_ability_string_id) THEN
        RETURN FALSE;
    END IF;
    
    -- Add ability to character's unlocked abilities if not already present
    UPDATE player_progression 
    SET unlocked_abilities = array_append(unlocked_abilities, p_ability_string_id)
    WHERE character_id = p_character_id 
    AND NOT (p_ability_string_id = ANY(unlocked_abilities));
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a character has a specific ability (using string ID)
CREATE OR REPLACE FUNCTION character_has_ability(p_character_id UUID, p_ability_string_id VARCHAR(100))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM player_progression 
        WHERE character_id = p_character_id 
        AND p_ability_string_id = ANY(unlocked_abilities)
    );
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 6. CREATE VIEWS FOR EASY QUERYING
-- ==============================================

-- View to get character progression with ability count
CREATE OR REPLACE VIEW character_progression_with_abilities AS
SELECT 
    pp.*,
    array_length(pp.unlocked_abilities, 1) as ability_count,
    c.name as character_name,
    c.class as character_class
FROM player_progression pp
INNER JOIN characters c ON pp.character_id = c.id;

-- View to get detailed character abilities
CREATE OR REPLACE VIEW character_abilities_detailed AS
SELECT 
    pp.character_id,
    c.name as character_name,
    c.class as character_class,
    aim.string_id as ability_id,
    a.name as ability_name,
    a.description as ability_description,
    a.category as ability_category,
    a.cooldown_max,
    a.current_cooldown,
    a.damage,
    a.mana_cost,
    a.effects,
    a.icon
FROM player_progression pp
INNER JOIN characters c ON pp.character_id = c.id
CROSS JOIN LATERAL unnest(pp.unlocked_abilities) as ability_string_id
INNER JOIN ability_id_mapping aim ON aim.string_id = ability_string_id
INNER JOIN abilities a ON a.id = aim.uuid_id;

-- ==============================================
-- 7. UPDATE EXISTING DATA
-- ==============================================

-- Ensure all existing characters have empty unlocked_abilities array
UPDATE player_progression 
SET unlocked_abilities = '{}' 
WHERE unlocked_abilities IS NULL;

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE 'Ability system database update completed successfully!';
    RAISE NOTICE 'Added unlocked_abilities column to player_progression table';
    RAISE NOTICE 'Created ability_id_mapping table to link string IDs to UUIDs';
    RAISE NOTICE 'Inserted predefined abilities with UUIDs into abilities table';
    RAISE NOTICE 'Created ability unlock trigger on character_skills table';
    RAISE NOTICE 'Created helper functions and views for ability management';
END $$;

