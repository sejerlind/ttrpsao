-- Fix for "turn_occurred" column issue in game_events table
-- This script ensures the game_events table has the correct schema and functions

-- 1. First, ensure the game_events table has the turn_occurred column
DO $$ 
BEGIN
    -- Check if turn_occurred column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'game_events' 
        AND column_name = 'turn_occurred'
    ) THEN
        ALTER TABLE game_events ADD COLUMN turn_occurred INTEGER;
        RAISE NOTICE 'Added turn_occurred column to game_events table';
    ELSE
        RAISE NOTICE 'turn_occurred column already exists in game_events table';
    END IF;
END $$;

-- 2. Drop and recreate the advance_game_turn function with proper error handling
DROP FUNCTION IF EXISTS advance_game_turn(UUID);

CREATE OR REPLACE FUNCTION advance_game_turn(session_id UUID)
RETURNS TABLE (
    new_turn INTEGER,
    action_points_reset INTEGER,
    mana_regenerated INTEGER
) AS $$
DECLARE
    current_turn_num INTEGER;
    players_updated INTEGER;
    mana_regenerated INTEGER;
BEGIN
    -- Get current turn
    SELECT current_turn INTO current_turn_num FROM game_sessions WHERE id = session_id;
    
    -- If no current turn, start at 0
    IF current_turn_num IS NULL THEN
        current_turn_num := 0;
    END IF;
    
    -- Increment turn
    UPDATE game_sessions 
    SET current_turn = current_turn_num + 1, updated_at = NOW()
    WHERE id = session_id;
    
    -- Reset action points and regenerate mana for all active players
    UPDATE characters 
    SET 
        action_points_current = action_points_max,
        mana_current = LEAST(mana_max, mana_current + COALESCE(mana_regen, 10)),
        updated_at = NOW()
    WHERE id IN (
        SELECT c.id FROM characters c
        JOIN game_session_players gsp ON c.id = gsp.character_id
        WHERE gsp.game_session_id = session_id AND gsp.is_active = true
    );
    
    GET DIAGNOSTICS players_updated = ROW_COUNT;
    
    -- Calculate total mana regenerated
    SELECT COALESCE(SUM(LEAST(mana_max - mana_current + COALESCE(mana_regen, 10), COALESCE(mana_regen, 10))), 0)
    INTO mana_regenerated
    FROM characters c
    JOIN game_session_players gsp ON c.id = gsp.character_id
    WHERE gsp.game_session_id = session_id AND gsp.is_active = true;
    
    -- Log the turn advance event with all required columns
    INSERT INTO game_events (
        game_session_id, 
        event_type, 
        event_description, 
        turn_occurred, 
        created_at
    ) VALUES (
        session_id, 
        'turn_advance', 
        'Turn advanced to ' || (current_turn_num + 1) || ' - Action Points reset and mana regenerated', 
        current_turn_num + 1, 
        NOW()
    );
    
    -- Return results
    RETURN QUERY SELECT 
        current_turn_num + 1 as new_turn,
        players_updated as action_points_reset,
        mana_regenerated;
END;
$$ LANGUAGE plpgsql;

-- 3. Test the function (optional - comment out if not needed)
-- SELECT * FROM advance_game_turn('your-session-id-here');

-- 4. Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'game_events' 
ORDER BY ordinal_position;

