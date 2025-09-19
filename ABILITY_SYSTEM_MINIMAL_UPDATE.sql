-- ==============================================
-- ABILITY SYSTEM MINIMAL DATABASE UPDATE
-- ==============================================
-- This is a minimal update that just adds the necessary column
-- for the ability system to work

-- Add unlocked_abilities column to player_progression table
ALTER TABLE player_progression 
ADD COLUMN IF NOT EXISTS unlocked_abilities TEXT[] DEFAULT '{}';

-- Add comment to document the new column
COMMENT ON COLUMN player_progression.unlocked_abilities IS 'Array of ability IDs that the player has unlocked through skills';

-- Ensure all existing characters have empty unlocked_abilities array
UPDATE player_progression 
SET unlocked_abilities = '{}' 
WHERE unlocked_abilities IS NULL;

-- Success message
SELECT 'Ability system minimal update completed! Added unlocked_abilities column to player_progression table.' as message;

