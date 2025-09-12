-- Enhanced Damage System with Armor and Magic Resist
-- Run this SQL in your Supabase SQL Editor

-- 1. Create abilities table if it doesn't exist
CREATE TABLE IF NOT EXISTS abilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- 2. Create function to calculate damage reduction
CREATE OR REPLACE FUNCTION calculate_damage_reduction(resistance INTEGER)
RETURNS DECIMAL AS $$
BEGIN
    -- Cap resistance at 500 (90% reduction max)
    resistance := LEAST(resistance, 500);
    
    -- Formula: Damage Reduction % = Resistance / (Resistance + 100)
    -- This creates diminishing returns
    RETURN LEAST(resistance::DECIMAL / (resistance + 100), 0.9);
END;
$$ LANGUAGE plpgsql;

-- 3. Create function to determine if an attack is magical
CREATE OR REPLACE FUNCTION is_magical_attack(ability_name TEXT DEFAULT 'Basic Attack')
RETURNS BOOLEAN AS $$
DECLARE
    magical_keywords TEXT[] := ARRAY[
        'fire', 'ice', 'lightning', 'frost', 'burn', 'freeze', 'shock',
        'magic', 'spell', 'arcane', 'divine', 'holy', 'dark', 'shadow',
        'energy', 'force', 'psychic', 'mental', 'spiritual', 'elemental',
        'bolt', 'blast', 'wave', 'beam', 'orb', 'missile', 'fireball'
    ];
    keyword TEXT;
BEGIN
    -- Convert to lowercase for comparison
    ability_name := LOWER(ability_name);
    
    -- Check if any magical keyword is in the ability name
    FOREACH keyword IN ARRAY magical_keywords
    LOOP
        IF ability_name LIKE '%' || keyword || '%' THEN
            RETURN TRUE;
        END IF;
    END LOOP;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 4. Update the enemy attack function to use armor/magic resist
CREATE OR REPLACE FUNCTION enemy_attack_player(
    encounter_id UUID,
    session_id UUID,
    target_selection TEXT DEFAULT 'random', -- 'random', 'weakest', 'strongest'
    ability_name TEXT DEFAULT 'Basic Attack'
) RETURNS TABLE (
    enemy_name TEXT,
    target_name TEXT,
    damage_dealt INTEGER,
    base_damage INTEGER,
    damage_blocked INTEGER,
    damage_type TEXT,
    resistance_used INTEGER,
    target_health_remaining INTEGER
) AS $$
DECLARE
    enemy_record record;
    target_record record;
    damage_amount INTEGER;
    base_damage_amount INTEGER;
    target_query TEXT;
    is_magical BOOLEAN;
    resistance INTEGER;
    reduction_percent DECIMAL;
    damage_blocked INTEGER;
BEGIN
    -- Get enemy info from the encounter
    SELECT 
        e.name as enemy_name,
        e.attack_power,
        be.enemy_health_current
    INTO enemy_record
    FROM battle_encounters be
    JOIN enemies e ON be.enemy_id = e.id
    WHERE be.id = encounter_id AND be.is_active = true;
    
    IF enemy_record IS NULL THEN
        RAISE EXCEPTION 'Enemy encounter not found or inactive';
    END IF;
    
    IF enemy_record.enemy_health_current <= 0 THEN
        RAISE EXCEPTION 'Enemy is defeated and cannot attack';
    END IF;
    
    -- Determine if this is a magical attack
    is_magical := is_magical_attack(ability_name);
    
    -- Build query based on target selection, including resistance values
    IF target_selection = 'weakest' THEN
        target_query := '
            SELECT c.id, c.name, c.health_current, c.health_max, 
                   c.armor_current, c.magic_resist_current
            FROM characters c 
            JOIN game_session_players gsp ON c.id = gsp.character_id
            WHERE gsp.game_session_id = $1 AND gsp.is_active = true AND c.health_current > 0
            ORDER BY c.health_current ASC
            LIMIT 1';
    ELSIF target_selection = 'strongest' THEN
        target_query := '
            SELECT c.id, c.name, c.health_current, c.health_max,
                   c.armor_current, c.magic_resist_current
            FROM characters c 
            JOIN game_session_players gsp ON c.id = gsp.character_id
            WHERE gsp.game_session_id = $1 AND gsp.is_active = true AND c.health_current > 0
            ORDER BY c.health_current DESC
            LIMIT 1';
    ELSE -- random
        target_query := '
            SELECT c.id, c.name, c.health_current, c.health_max,
                   c.armor_current, c.magic_resist_current
            FROM characters c 
            JOIN game_session_players gsp ON c.id = gsp.character_id
            WHERE gsp.game_session_id = $1 AND gsp.is_active = true AND c.health_current > 0
            ORDER BY RANDOM()
            LIMIT 1';
    END IF;
    
    -- Execute the query to get target
    EXECUTE target_query INTO target_record USING session_id;
    
    IF target_record IS NULL THEN
        RAISE EXCEPTION 'No valid targets found';
    END IF;
    
    -- Calculate base damage (with ±25% variance)
    base_damage_amount := enemy_record.attack_power;
    base_damage_amount := base_damage_amount + (RANDOM() * base_damage_amount * 0.5)::INTEGER - (base_damage_amount * 0.25)::INTEGER;
    base_damage_amount := GREATEST(1, base_damage_amount);
    
    -- Determine resistance based on attack type
    IF is_magical THEN
        resistance := COALESCE(target_record.magic_resist_current, 0);
    ELSE
        resistance := COALESCE(target_record.armor_current, 0);
    END IF;
    
    -- Calculate damage reduction
    reduction_percent := calculate_damage_reduction(resistance);
    damage_blocked := (base_damage_amount * reduction_percent)::INTEGER;
    damage_amount := GREATEST(1, base_damage_amount - damage_blocked);
    
    -- Apply damage to target
    UPDATE characters 
    SET 
        health_current = GREATEST(0, health_current - damage_amount),
        updated_at = NOW()
    WHERE id = target_record.id;
    
    -- Log the enemy attack with enhanced details
    INSERT INTO enemy_battle_log (
        game_session_id,
        enemy_id,
        ability_used,
        target_character_id,
        damage_dealt,
        effect_description,
        turn_used,
        used_at
    ) VALUES (
        session_id,
        (SELECT enemy_id FROM battle_encounters WHERE id = encounter_id),
        ability_name,
        target_record.id,
        damage_amount,
        CASE 
            WHEN is_magical THEN 
                'Magical attack: ' || base_damage_amount || ' base - ' || damage_blocked || ' blocked by ' || resistance || ' Magic Resist'
            ELSE 
                'Physical attack: ' || base_damage_amount || ' base - ' || damage_blocked || ' blocked by ' || resistance || ' Armor'
        END,
        (SELECT current_turn FROM game_sessions WHERE id = session_id),
        NOW()
    );
    
    -- Return enhanced attack results
    RETURN QUERY SELECT 
        enemy_record.enemy_name::TEXT,
        target_record.name::TEXT,
        damage_amount::INTEGER,
        base_damage_amount::INTEGER,
        damage_blocked::INTEGER,
        CASE WHEN is_magical THEN 'Magical' ELSE 'Physical' END::TEXT,
        resistance::INTEGER,
        GREATEST(0, target_record.health_current - damage_amount)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to add armor/magic resist values to existing enemies
CREATE OR REPLACE FUNCTION add_enemy_resistances()
RETURNS TEXT AS $$
DECLARE
    enemy_count INTEGER;
BEGIN
    -- Add armor_value and magic_resist_value columns if they don't exist
    ALTER TABLE enemies ADD COLUMN IF NOT EXISTS armor_value INTEGER DEFAULT 0;
    ALTER TABLE enemies ADD COLUMN IF NOT EXISTS magic_resist_value INTEGER DEFAULT 0;
    
    -- Set default values based on enemy type and level
    UPDATE enemies SET 
        armor_value = CASE 
            WHEN type = 'dragon' THEN level * 15 + 50
            WHEN type = 'orc' THEN level * 10 + 20
            WHEN type = 'boss' THEN level * 12 + 30
            WHEN type = 'elite' THEN level * 8 + 15
            WHEN type = 'goblin' THEN level * 5 + 5
            WHEN type = 'undead' THEN level * 6 + 10
            ELSE level * 7 + 10
        END,
        magic_resist_value = CASE 
            WHEN type = 'elemental' THEN level * 20 + 40
            WHEN type = 'dragon' THEN level * 12 + 30
            WHEN type = 'undead' THEN level * 10 + 25
            WHEN type = 'boss' THEN level * 8 + 20
            WHEN type = 'elite' THEN level * 6 + 12
            ELSE level * 4 + 5
        END
    WHERE armor_value IS NULL OR magic_resist_value IS NULL;
    
    GET DIAGNOSTICS enemy_count = ROW_COUNT;
    
    RETURN 'Updated ' || enemy_count || ' enemies with armor and magic resist values';
END;
$$ LANGUAGE plpgsql;

-- 6. Run the function to add resistances to existing enemies
SELECT add_enemy_resistances();

-- 7. Create view for enemy stats with resistances
CREATE OR REPLACE VIEW enemy_combat_stats AS
SELECT 
    e.id,
    e.name,
    e.type,
    e.level,
    e.health_max,
    e.attack_power,
    e.defense,
    e.speed,
    COALESCE(e.armor_value, e.defense) as armor,
    COALESCE(e.magic_resist_value, 0) as magic_resist,
    e.description
FROM enemies e;

-- Usage examples:
-- SELECT * FROM enemy_attack_player('encounter-id', 'session-id', 'random', 'Fireball');
-- SELECT * FROM enemy_attack_player('encounter-id', 'session-id', 'weakest', 'Claw Strike');
-- SELECT * FROM enemy_combat_stats WHERE type = 'dragon';
-- SELECT * FROM calculate_damage_reduction(150); -- Returns damage reduction %

COMMENT ON FUNCTION calculate_damage_reduction IS 'Calculate damage reduction percentage from armor/magic resist value';
COMMENT ON FUNCTION is_magical_attack IS 'Determine if an attack is magical based on ability name keywords';
COMMENT ON FUNCTION enemy_attack_player IS 'Enhanced enemy attack with armor/magic resist calculation';
COMMENT ON FUNCTION add_enemy_resistances IS 'Add armor and magic resist values to existing enemies';
COMMENT ON VIEW enemy_combat_stats IS 'View showing all enemy combat statistics including resistances';
