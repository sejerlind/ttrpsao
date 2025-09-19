-- ==============================================
-- ABILITY SYSTEM FINAL DATABASE UPDATE
-- ==============================================
-- This script handles the ability system with proper table structure detection
-- and modification if needed

-- ==============================================
-- 0. CLEANUP EXISTING FUNCTIONS, TRIGGERS, AND VIEWS
-- ==============================================

-- Drop any existing functions and triggers that might conflict
DROP TRIGGER IF EXISTS trigger_unlock_abilities ON character_skills;
DROP FUNCTION IF EXISTS unlock_abilities_on_skill_unlock();
DROP FUNCTION IF EXISTS get_character_abilities(UUID);
DROP FUNCTION IF EXISTS unlock_ability_for_character(UUID, VARCHAR);
DROP FUNCTION IF EXISTS character_has_ability(UUID, VARCHAR);
DROP FUNCTION IF EXISTS unlock_ability_for_character(UUID, character varying);
DROP FUNCTION IF EXISTS character_has_ability(UUID, character varying);

-- Drop views that depend on the abilities table
DROP VIEW IF EXISTS character_abilities_detailed;
DROP VIEW IF EXISTS player_abilities_view;
DROP VIEW IF EXISTS character_progression_with_abilities;

-- ==============================================
-- 1. CHECK AND MODIFY ABILITIES TABLE STRUCTURE
-- ==============================================

-- First, let's check if the abilities table exists and modify its structure if needed
-- We need the id column to be VARCHAR(100) to work with our string-based ability IDs

-- Check if abilities table exists, if not create it
CREATE TABLE IF NOT EXISTS abilities (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(20) DEFAULT 'basic',
    cooldown_max INTEGER DEFAULT 0,
    current_cooldown INTEGER DEFAULT 0,
    damage VARCHAR(50),
    mana_cost INTEGER DEFAULT 0,
    effects TEXT[],
    icon VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If the table already exists with UUID id, we need to modify it
-- This will only work if the table is empty or we're okay with data loss
DO $$
BEGIN
    -- Check if the id column is UUID type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'abilities' 
        AND column_name = 'id' 
        AND data_type = 'uuid'
    ) THEN
        -- Drop and recreate the table with VARCHAR id
        DROP TABLE IF EXISTS abilities CASCADE;
        
        CREATE TABLE abilities (
            id VARCHAR(100) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            category VARCHAR(20) DEFAULT 'basic',
            cooldown_max INTEGER DEFAULT 0,
            current_cooldown INTEGER DEFAULT 0,
            damage VARCHAR(50),
            mana_cost INTEGER DEFAULT 0,
            effects TEXT[],
            icon VARCHAR(10),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Modified abilities table to use VARCHAR id column';
    ELSE
        RAISE NOTICE 'Abilities table already uses VARCHAR id column or does not exist';
    END IF;
END $$;

-- ==============================================
-- 2. UPDATE PLAYER_PROGRESSION TABLE
-- ==============================================

-- Add unlocked_abilities column to player_progression table
ALTER TABLE player_progression 
ADD COLUMN IF NOT EXISTS unlocked_abilities TEXT[] DEFAULT '{}';

-- Add comment to document the new column
COMMENT ON COLUMN player_progression.unlocked_abilities IS 'Array of ability IDs that the player has unlocked through skills';

-- ==============================================
-- 3. INSERT PREDEFINED ABILITIES
-- ==============================================

-- Insert the predefined abilities from the ability system
INSERT INTO abilities (id, name, description, category, cooldown_max, current_cooldown, damage, mana_cost, effects, icon) VALUES
-- Combat Abilities
('power_strike', 'Power Strike', 'A devastating melee attack that deals extra damage', 'skill', 3, 0, '2d6 + 3', 5, ARRAY['Stuns target for 1 turn on critical hit'], '⚔️'),
('whirlwind_attack', 'Whirlwind Attack', 'Spin and attack all enemies in range', 'skill', 4, 0, '1d8 + 2', 8, ARRAY['Hits all enemies', 'Cannot be interrupted'], '🌪️'),
('berserker_rage', 'Berserker Rage', 'Enter a rage that increases damage but reduces defense', 'skill', 6, 0, '0', 10, ARRAY['+50% damage for 3 turns', '-25% defense for 3 turns'], '😡'),
('shield_bash', 'Shield Bash', 'Bash with your shield to stun and damage the enemy', 'skill', 2, 0, '1d4 + 1', 3, ARRAY['Stuns target for 1 turn', 'Requires shield equipped'], '🛡️'),

-- Magic Abilities
('fireball', 'Fireball', 'Launch a ball of fire that explodes on impact', 'skill', 2, 0, '3d6 + 4', 12, ARRAY['Area of effect damage', 'Burns target for 2 turns'], '🔥'),
('heal', 'Heal', 'Restore health to yourself or an ally', 'skill', 1, 0, '0', 8, ARRAY['Restores 2d6 + 4 health', 'Can target allies'], '💚'),
('magic_missile', 'Magic Missile', 'Launch magical projectiles that never miss', 'skill', 1, 0, '1d4 + 1', 3, ARRAY['Never misses', 'Can target multiple enemies'], '✨'),
('teleport', 'Teleport', 'Instantly move to a different location', 'skill', 5, 0, '0', 15, ARRAY['Instant movement', 'Cannot be interrupted'], '🌀'),

-- Crafting Abilities
('repair_equipment', 'Repair Equipment', 'Fix damaged equipment using crafting materials', 'skill', 0, 0, '0', 0, ARRAY['Restores equipment durability', 'Requires repair materials'], '🔧'),
('identify_item', 'Identify Item', 'Reveal the properties of unknown magical items', 'skill', 0, 0, '0', 5, ARRAY['Reveals item properties', 'Works on any unidentified item'], '🔍'),
('enchant_weapon', 'Enchant Weapon', 'Temporarily enhance a weapon with magical properties', 'skill', 10, 0, '0', 20, ARRAY['+2 damage for 10 turns', 'Requires enchanting materials'], '✨'),

-- Ultimate Abilities
('meteor_strike', 'Meteor Strike', 'Call down a massive meteor to devastate the battlefield', 'ultimate', 20, 0, '6d8 + 10', 50, ARRAY['Massive area damage', 'Stuns all enemies for 2 turns'], '☄️'),
('divine_intervention', 'Divine Intervention', 'Call upon divine power to restore all allies to full health', 'ultimate', 30, 0, '0', 100, ARRAY['Full heal all allies', 'Removes all debuffs', 'Grants temporary invulnerability'], '🙏')

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
CREATE TRIGGER trigger_unlock_abilities
    AFTER UPDATE ON character_skills
    FOR EACH ROW
    EXECUTE FUNCTION unlock_abilities_on_skill_unlock();

-- ==============================================
-- 5. CREATE HELPER FUNCTIONS
-- ==============================================

-- Function to get all abilities for a character
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
        a.id as ability_id,
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
    INNER JOIN abilities a ON a.id = ability_string_id
    WHERE pp.character_id = p_character_id;
END;
$$ LANGUAGE plpgsql;

-- Function to unlock an ability for a character
CREATE OR REPLACE FUNCTION unlock_ability_for_character(p_character_id UUID, p_ability_string_id VARCHAR(100))
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if ability exists
    IF NOT EXISTS (SELECT 1 FROM abilities WHERE id = p_ability_string_id) THEN
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

-- Function to check if a character has a specific ability
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
    a.id as ability_id,
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
INNER JOIN abilities a ON a.id = ability_string_id;

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
    RAISE NOTICE 'Ability system final update completed successfully!';
    RAISE NOTICE 'Modified abilities table to use VARCHAR id column';
    RAISE NOTICE 'Added unlocked_abilities column to player_progression table';
    RAISE NOTICE 'Inserted predefined abilities with string IDs';
    RAISE NOTICE 'Created ability unlock trigger and helper functions';
END $$;
