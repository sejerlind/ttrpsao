-- ==============================================
-- LEVEL UP TEST FUNCTION
-- ==============================================
-- This function allows testing the level up system and skill point awarding

-- Function to manually level up a character (for testing)
CREATE OR REPLACE FUNCTION test_level_up_character(
    p_character_id UUID,
    p_new_level INTEGER
)
RETURNS JSON AS $$
DECLARE
    character_data RECORD;
    result JSON;
BEGIN
    -- Get current character data
    SELECT * INTO character_data
    FROM characters
    WHERE id = p_character_id;
    
    -- Check if character exists
    IF character_data IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Character not found');
    END IF;
    
    -- Check if new level is valid
    IF p_new_level <= character_data.level THEN
        RETURN json_build_object('success', false, 'message', 'New level must be higher than current level');
    END IF;
    
    -- Update character level (this will trigger the skill point update)
    UPDATE characters
    SET 
        level = p_new_level,
        updated_at = NOW()
    WHERE id = p_character_id;
    
    -- Get updated progression data
    SELECT 
        pp.total_level,
        pp.skill_points,
        pp.unspent_skill_points,
        pp.level_skill_points
    INTO character_data
    FROM player_progression pp
    WHERE pp.character_id = p_character_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Character leveled up successfully',
        'data', json_build_object(
            'old_level', character_data.level,
            'new_level', p_new_level,
            'total_skill_points', character_data.skill_points,
            'unspent_skill_points', character_data.unspent_skill_points,
            'level_skill_points', character_data.level_skill_points
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get character skill point summary
CREATE OR REPLACE FUNCTION get_character_skill_summary(p_character_id UUID)
RETURNS JSON AS $$
DECLARE
    character_data RECORD;
    progression_data RECORD;
    skill_count INTEGER;
    result JSON;
BEGIN
    -- Get character data
    SELECT c.name, c.level, c.experience
    INTO character_data
    FROM characters c
    WHERE c.id = p_character_id;
    
    -- Get progression data
    SELECT 
        pp.total_level,
        pp.skill_points,
        pp.unspent_skill_points,
        pp.level_skill_points
    INTO progression_data
    FROM player_progression pp
    WHERE pp.character_id = p_character_id;
    
    -- Get skill count
    SELECT COUNT(*)
    INTO skill_count
    FROM character_skills cs
    WHERE cs.character_id = p_character_id AND cs.is_unlocked = true;
    
    RETURN json_build_object(
        'character', json_build_object(
            'name', character_data.name,
            'level', character_data.level,
            'experience', character_data.experience
        ),
        'progression', json_build_object(
            'total_level', progression_data.total_level,
            'skill_points', progression_data.skill_points,
            'unspent_skill_points', progression_data.unspent_skill_points,
            'level_skill_points', progression_data.level_skill_points
        ),
        'skills', json_build_object(
            'unlocked_count', skill_count
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION test_level_up_character(UUID, INTEGER) TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_character_skill_summary(UUID) TO PUBLIC;

-- ==============================================
-- TEST QUERIES
-- ==============================================

-- Example usage:
-- SELECT test_level_up_character('your-character-id-here', 5);
-- SELECT get_character_skill_summary('your-character-id-here');

-- Query to see all characters and their skill points
-- SELECT 
--     c.name,
--     c.level,
--     pp.skill_points,
--     pp.unspent_skill_points,
--     pp.level_skill_points,
--     (SELECT COUNT(*) FROM character_skills cs WHERE cs.character_id = c.id AND cs.is_unlocked = true) as unlocked_skills
-- FROM characters c
-- LEFT JOIN player_progression pp ON c.id = pp.character_id
-- ORDER BY c.level DESC;
