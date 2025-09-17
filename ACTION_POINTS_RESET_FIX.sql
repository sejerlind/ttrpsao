-- Fix for Action Points Reset and Mana Regeneration on Turn Advance
-- Run this SQL in your Supabase SQL Editor

-- 1. First, drop the existing function and create the updated version
DROP FUNCTION IF EXISTS advance_game_turn(UUID);

-- First, add mana_regen column to characters table if it doesn't exist
ALTER TABLE characters ADD COLUMN IF NOT EXISTS mana_regen INTEGER DEFAULT 10;

-- Update existing characters to have a default mana regen if they don't have one
UPDATE characters SET mana_regen = 10 WHERE mana_regen IS NULL;

-- Now create the updated advance_game_turn function to reset Action Points and regenerate mana
CREATE OR REPLACE FUNCTION advance_game_turn(session_id UUID)
RETURNS TABLE (new_turn INTEGER) AS $$
DECLARE
    current_turn_number INTEGER;
    players_reset INTEGER;
BEGIN
    -- Get current turn for the session
    SELECT current_turn INTO current_turn_number 
    FROM game_sessions 
    WHERE id = session_id;
    
    -- If no current turn, start at 1
    IF current_turn_number IS NULL THEN
        current_turn_number := 1;
    ELSE
        current_turn_number := current_turn_number + 1;
    END IF;
    
    -- Update the game session with new turn
    UPDATE game_sessions 
    SET 
        current_turn = current_turn_number,
        updated_at = NOW()
    WHERE id = session_id;
    
    -- Reset Action Points and regenerate mana for all players in this session
    UPDATE characters 
    SET 
        action_points_current = action_points_max,
        mana_current = LEAST(mana_max, mana_current + COALESCE(mana_regen, 10)),
        updated_at = NOW()
    WHERE id IN (
        SELECT character_id 
        FROM game_session_players 
        WHERE game_session_id = session_id AND is_active = true
    );
    
    GET DIAGNOSTICS players_reset = ROW_COUNT;
    
    -- Log the turn advance
    INSERT INTO game_events (
        game_session_id,
        event_type,
        event_description,
        event_data,
        turn_occurred,
        created_at
    ) VALUES (
        session_id,
        'turn_advance',
        'GM advanced turn to ' || current_turn_number || ' - Action Points reset and mana regenerated',
        jsonb_build_object(
            'new_turn', current_turn_number,
            'players_reset', players_reset
        ),
        current_turn_number,
        NOW()
    );
    
    -- Return the new turn number
    RETURN QUERY SELECT current_turn_number;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the game_events table if it doesn't exist (for logging)
CREATE TABLE IF NOT EXISTS game_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    event_description TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Set up RLS policy for game_events
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on game_events" ON game_events;
CREATE POLICY "Allow all operations on game_events" ON game_events FOR ALL USING (true);

-- 4. Create function to reset a single player's action points (for manual reset)
CREATE OR REPLACE FUNCTION reset_player_action_points(character_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE characters 
    SET 
        action_points_current = action_points_max,
        updated_at = NOW()
    WHERE id = character_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to get turn advancement summary
CREATE OR REPLACE FUNCTION get_turn_summary(session_id UUID)
RETURNS TABLE (
    current_turn INTEGER,
    total_players INTEGER,
    players_with_ap INTEGER,
    players_without_ap INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gs.current_turn,
        COUNT(c.id)::INTEGER as total_players,
        COUNT(CASE WHEN c.action_points_current > 0 THEN 1 END)::INTEGER as players_with_ap,
        COUNT(CASE WHEN c.action_points_current = 0 THEN 1 END)::INTEGER as players_without_ap
    FROM game_sessions gs
    LEFT JOIN game_session_players gsp ON gs.id = gsp.game_session_id AND gsp.is_active = true
    LEFT JOIN characters c ON gsp.character_id = c.id
    WHERE gs.id = session_id
    GROUP BY gs.current_turn;
END;
$$ LANGUAGE plpgsql;

-- Usage examples:
-- SELECT * FROM advance_game_turn('your-session-id');
-- SELECT * FROM reset_player_action_points('player-character-id');
-- SELECT * FROM get_turn_summary('your-session-id');
-- SELECT * FROM set_player_mana_regen('player-character-id', 25);
-- SELECT * FROM get_mana_regen_summary('your-session-id');

-- 6. Create function to set player's mana regeneration
CREATE OR REPLACE FUNCTION set_player_mana_regen(character_id UUID, regen_amount INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE characters 
    SET 
        mana_regen = GREATEST(0, regen_amount),
        updated_at = NOW()
    WHERE id = character_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to get all players' mana regeneration info
CREATE OR REPLACE FUNCTION get_mana_regen_summary(session_id UUID)
RETURNS TABLE (
    character_name TEXT,
    current_mana INTEGER,
    max_mana INTEGER,
    mana_regen INTEGER,
    mana_after_next_turn INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.name::TEXT,
        c.mana_current,
        c.mana_max,
        COALESCE(c.mana_regen, 10),
        LEAST(c.mana_max, c.mana_current + COALESCE(c.mana_regen, 10))
    FROM characters c
    JOIN game_session_players gsp ON c.id = gsp.character_id
    WHERE gsp.game_session_id = session_id AND gsp.is_active = true
    ORDER BY c.name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION advance_game_turn IS 'Advances turn, resets all player Action Points, and regenerates mana';
COMMENT ON FUNCTION reset_player_action_points IS 'Manually reset a specific players Action Points';
COMMENT ON FUNCTION get_turn_summary IS 'Get summary of current turn and player Action Point status';
COMMENT ON FUNCTION set_player_mana_regen IS 'Set a players mana regeneration per turn (minimum 0)';
COMMENT ON FUNCTION get_mana_regen_summary IS 'Get mana status and regeneration info for all players in session';
