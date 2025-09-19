-- ==============================================
-- TEST ABILITY SYSTEM
-- ==============================================
-- This script tests the ability system to ensure it's working correctly

-- 1. Check if the unlocked_abilities column exists
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'player_progression' 
AND column_name = 'unlocked_abilities';

-- 2. Check if abilities were inserted
SELECT 
    id, 
    name, 
    category, 
    cooldown_max, 
    mana_cost
FROM abilities 
ORDER BY category, name;

-- 3. Check if any characters have unlocked abilities
SELECT 
    pp.character_id,
    c.name as character_name,
    array_length(pp.unlocked_abilities, 1) as ability_count,
    pp.unlocked_abilities
FROM player_progression pp
LEFT JOIN characters c ON pp.character_id = c.id
WHERE array_length(pp.unlocked_abilities, 1) > 0
ORDER BY ability_count DESC;

-- 4. Test the helper functions
SELECT 'Testing get_character_abilities function...' as test_step;

-- Test with a character that has abilities (if any exist)
DO $$
DECLARE
    test_character_id UUID;
    ability_count INTEGER;
BEGIN
    -- Get the first character that has abilities
    SELECT character_id INTO test_character_id
    FROM player_progression 
    WHERE array_length(unlocked_abilities, 1) > 0 
    LIMIT 1;
    
    IF test_character_id IS NOT NULL THEN
        -- Test the function
        SELECT COUNT(*) INTO ability_count
        FROM get_character_abilities(test_character_id);
        
        RAISE NOTICE 'Character % has % abilities', test_character_id, ability_count;
    ELSE
        RAISE NOTICE 'No characters with abilities found for testing';
    END IF;
END $$;

-- 5. Show the trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_unlock_abilities';

-- 6. Show the views exist
SELECT 
    table_name, 
    table_type
FROM information_schema.tables 
WHERE table_name IN ('character_progression_with_abilities', 'character_abilities_detailed')
AND table_schema = 'public';

-- Success message
SELECT 'Ability system test completed! Check the results above.' as message;

