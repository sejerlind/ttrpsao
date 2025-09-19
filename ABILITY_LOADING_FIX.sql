-- ==============================================
-- ABILITY LOADING FIX
-- ==============================================
-- This script fixes the ability loading system to work with the new
-- player_progression.unlocked_abilities array

-- ==============================================
-- 1. UPDATE EXISTING PLAYER PROGRESSION DATA
-- ==============================================

-- First, let's populate the unlocked_abilities array for existing players
-- based on their unlocked skills

-- Create a function to get abilities for a character based on their skills
CREATE OR REPLACE FUNCTION populate_abilities_from_skills()
RETURNS void AS $$
DECLARE
    char_record RECORD;
    skill_record RECORD;
    ability_ids TEXT[];
    skill_abilities TEXT[];
BEGIN
    -- Loop through all characters
    FOR char_record IN 
        SELECT DISTINCT character_id FROM character_skills WHERE is_unlocked = true
    LOOP
        ability_ids := ARRAY[]::TEXT[];
        
        -- Get all unlocked skills for this character
        FOR skill_record IN
            SELECT skill_id FROM character_skills 
            WHERE character_id = char_record.character_id AND is_unlocked = true
        LOOP
            -- Determine abilities based on skill names/IDs
            skill_abilities := CASE 
                WHEN skill_record.skill_id ILIKE '%power_strike%' OR skill_record.skill_id ILIKE '%power%strike%' THEN ARRAY['power_strike']
                WHEN skill_record.skill_id ILIKE '%whirlwind%' THEN ARRAY['whirlwind_attack']
                WHEN skill_record.skill_id ILIKE '%berserker%' THEN ARRAY['berserker_rage']
                WHEN skill_record.skill_id ILIKE '%shield%' THEN ARRAY['shield_bash']
                WHEN skill_record.skill_id ILIKE '%fireball%' THEN ARRAY['fireball']
                WHEN skill_record.skill_id ILIKE '%heal%' THEN ARRAY['heal']
                WHEN skill_record.skill_id ILIKE '%magic_missile%' OR skill_record.skill_id ILIKE '%magic%missile%' THEN ARRAY['magic_missile']
                WHEN skill_record.skill_id ILIKE '%teleport%' THEN ARRAY['teleport']
                WHEN skill_record.skill_id ILIKE '%repair%' THEN ARRAY['repair_equipment']
                WHEN skill_record.skill_id ILIKE '%identify%' THEN ARRAY['identify_item']
                WHEN skill_record.skill_id ILIKE '%enchant%' THEN ARRAY['enchant_weapon']
                WHEN skill_record.skill_id ILIKE '%meteor%' THEN ARRAY['meteor_strike']
                WHEN skill_record.skill_id ILIKE '%divine%' THEN ARRAY['divine_intervention']
                ELSE ARRAY[]::TEXT[]
            END;
            
            -- Add abilities to the array
            ability_ids := array_cat(ability_ids, skill_abilities);
        END LOOP;
        
        -- Remove duplicates and update player progression
        ability_ids := array(SELECT DISTINCT unnest(ability_ids));
        
        -- Update or insert player progression record
        INSERT INTO player_progression (character_id, unlocked_abilities)
        VALUES (char_record.character_id, ability_ids)
        ON CONFLICT (character_id) 
        DO UPDATE SET 
            unlocked_abilities = ability_ids,
            updated_at = NOW();
            
        RAISE NOTICE 'Updated abilities for character %: %', char_record.character_id, ability_ids;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the function to populate abilities
SELECT populate_abilities_from_skills();

-- Drop the temporary function
DROP FUNCTION populate_abilities_from_skills();

-- ==============================================
-- 2. CREATE HELPER VIEW FOR ABILITY LOADING
-- ==============================================

-- Create a view that combines player progression with ability details
CREATE OR REPLACE VIEW player_abilities_view AS
SELECT 
    pp.character_id,
    pp.unlocked_abilities,
    array_length(pp.unlocked_abilities, 1) as ability_count,
    c.name as character_name,
    c.class as character_class,
    c.level as character_level
FROM player_progression pp
INNER JOIN characters c ON pp.character_id = c.id;

-- ==============================================
-- 3. CREATE FUNCTION TO GET CHARACTER ABILITIES
-- ==============================================

-- Function to get detailed abilities for a character
CREATE OR REPLACE FUNCTION get_character_abilities_detailed(p_character_id UUID)
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

-- ==============================================
-- 4. VERIFICATION QUERIES
-- ==============================================

-- Check which characters have abilities
SELECT 
    character_id,
    character_name,
    character_class,
    character_level,
    ability_count,
    unlocked_abilities
FROM player_abilities_view
WHERE ability_count > 0
ORDER BY ability_count DESC;

-- Check specific character's abilities
-- Replace 'YOUR_CHARACTER_ID' with the actual character ID from your images
-- SELECT * FROM get_character_abilities_detailed('550e8400-e29b-41d4-a716-446655440002');

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE 'Ability loading fix completed!';
    RAISE NOTICE 'Populated unlocked_abilities for existing characters based on their skills';
    RAISE NOTICE 'Created helper functions and views for ability loading';
    RAISE NOTICE 'Run the verification queries to check the results';
END $$;

