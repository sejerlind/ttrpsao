-- GM Attack System Setup
-- Run this SQL in your Supabase SQL Editor after POKEMON_BATTLE_SETUP.sql

-- 1. Create function for enemy attacks against players
CREATE OR REPLACE FUNCTION enemy_attack_player(
    encounter_id UUID,
    session_id UUID,
    target_selection TEXT DEFAULT 'random' -- 'random', 'weakest', 'strongest'
) RETURNS TABLE (
    enemy_name TEXT,
    target_name TEXT,
    damage_dealt INTEGER,
    target_health_remaining INTEGER
) AS $$
DECLARE
    enemy_record record;
    target_record record;
    damage_amount INTEGER;
    base_damage INTEGER;
    target_query TEXT;
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
    
    -- Build query based on target selection
    IF target_selection = 'weakest' THEN
        target_query := '
            SELECT c.id, c.name, c.health_current, c.health_max
            FROM characters c 
            JOIN game_session_players gsp ON c.id = gsp.character_id
            WHERE gsp.game_session_id = $1 AND gsp.is_active = true AND c.health_current > 0
            ORDER BY c.health_current ASC
            LIMIT 1';
    ELSIF target_selection = 'strongest' THEN
        target_query := '
            SELECT c.id, c.name, c.health_current, c.health_max
            FROM characters c 
            JOIN game_session_players gsp ON c.id = gsp.character_id
            WHERE gsp.game_session_id = $1 AND gsp.is_active = true AND c.health_current > 0
            ORDER BY c.health_current DESC
            LIMIT 1';
    ELSE -- random
        target_query := '
            SELECT c.id, c.name, c.health_current, c.health_max
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
    
    -- Calculate damage (base attack power ± 25% random variance)
    base_damage := enemy_record.attack_power;
    damage_amount := base_damage + (RANDOM() * base_damage * 0.5)::INTEGER - (base_damage * 0.25)::INTEGER;
    damage_amount := GREATEST(1, damage_amount); -- Minimum 1 damage
    
    -- Apply damage to target
    UPDATE characters 
    SET 
        health_current = GREATEST(0, health_current - damage_amount),
        updated_at = NOW()
    WHERE id = target_record.id;
    
    -- Log the enemy attack
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
        'Basic Attack',
        target_record.id,
        damage_amount,
        'Enemy attacked player',
        (SELECT current_turn FROM game_sessions WHERE id = session_id),
        NOW()
    );
    
    -- Return attack results
    RETURN QUERY SELECT 
        enemy_record.enemy_name::TEXT,
        target_record.name::TEXT,
        damage_amount::INTEGER,
        GREATEST(0, target_record.health_current - damage_amount)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- 2. Create enemy battle log table if it doesn't exist
CREATE TABLE IF NOT EXISTS enemy_battle_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    enemy_id UUID REFERENCES enemies(id) ON DELETE CASCADE,
    ability_used VARCHAR(100) NOT NULL,
    target_character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
    damage_dealt INTEGER DEFAULT 0,
    effect_description TEXT,
    turn_used INTEGER,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Set up RLS policies for enemy battle log
ALTER TABLE enemy_battle_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Allow all operations on enemy_battle_log" ON enemy_battle_log;
CREATE POLICY "Allow all operations on enemy_battle_log" ON enemy_battle_log FOR ALL USING (true);

-- 4. Create view for recent enemy actions
CREATE OR REPLACE VIEW recent_enemy_actions AS
SELECT 
    ebl.id,
    ebl.game_session_id,
    ebl.ability_used,
    ebl.damage_dealt,
    ebl.effect_description,
    ebl.turn_used,
    ebl.used_at,
    e.name as enemy_name,
    e.type as enemy_type,
    c.name as target_name,
    c.class as target_class
FROM enemy_battle_log ebl
JOIN enemies e ON ebl.enemy_id = e.id
LEFT JOIN characters c ON ebl.target_character_id = c.id
ORDER BY ebl.used_at DESC;

-- 5. Create function to get battle summary
CREATE OR REPLACE FUNCTION get_battle_summary(session_id UUID)
RETURNS TABLE (
    total_enemies INTEGER,
    active_enemies INTEGER,
    total_enemy_attacks INTEGER,
    total_damage_to_players INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM battle_encounters WHERE game_session_id = session_id),
        (SELECT COUNT(*)::INTEGER FROM battle_encounters WHERE game_session_id = session_id AND is_active = true),
        (SELECT COUNT(*)::INTEGER FROM enemy_battle_log WHERE game_session_id = session_id),
        (SELECT COALESCE(SUM(damage_dealt), 0)::INTEGER FROM enemy_battle_log WHERE game_session_id = session_id);
END;
$$ LANGUAGE plpgsql;

-- Usage examples:
-- SELECT * FROM enemy_attack_player('encounter-uuid', 'session-uuid', 'random');
-- SELECT * FROM enemy_attack_player('encounter-uuid', 'session-uuid', 'weakest');
-- SELECT * FROM enemy_attack_player('encounter-uuid', 'session-uuid', 'strongest');
-- SELECT * FROM recent_enemy_actions WHERE game_session_id = 'session-uuid' LIMIT 10;
-- SELECT * FROM get_battle_summary('session-uuid');

COMMENT ON FUNCTION enemy_attack_player IS 'Allows GM to make enemies attack players with different targeting strategies';
COMMENT ON TABLE enemy_battle_log IS 'Logs all enemy attacks and actions during battle';
COMMENT ON VIEW recent_enemy_actions IS 'Shows recent enemy actions with full details for GM reference';
