-- Complete Database Setup for TTRPG System
-- Run this SQL in your Supabase SQL Editor
-- 
-- This script will:
-- 1. Drop existing functions if they exist (to avoid conflicts)
-- 2. Create all tables with proper structure
-- 3. Add missing columns to existing tables (if any)
-- 4. Set up enhanced damage system with armor/magic resist
-- 5. Insert sample data for testing (skips duplicates)
-- 6. Configure security policies
--
-- Safe to run multiple times - won't create duplicates or conflicts!
--
-- Fixed issues:
-- - Parameter name conflicts resolved
-- - Function return type conflicts handled
-- - CASCADE drops to handle dependencies
-- - Column creation order fixed (all missing columns added before sample data)
-- - Handles existing tables by adding missing columns safely
-- - Duplicate key conflicts resolved with WHERE NOT EXISTS (no constraint dependencies)
-- - UUID type casting fixed for character IDs
-- - Policy conflicts resolved with DROP POLICY IF EXISTS
-- - Function signature conflicts resolved (drops all versions before creating new one)
-- - Field name conflicts resolved (enemy_name alias added)
-- - Added specific player targeting for enemy attacks

-- ==============================================
-- 1. CORE TABLES
-- ==============================================

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    class VARCHAR(50) NOT NULL,
    level INTEGER DEFAULT 1,
    health_current INTEGER DEFAULT 100,
    health_max INTEGER DEFAULT 100,
    mana_current INTEGER DEFAULT 50,
    mana_max INTEGER DEFAULT 50,
    action_points_current INTEGER DEFAULT 3,
    action_points_max INTEGER DEFAULT 3,
    attack_power INTEGER DEFAULT 10,
    defense INTEGER DEFAULT 5,
    speed INTEGER DEFAULT 10,
    armor_current INTEGER DEFAULT 10,
    magic_resist_current INTEGER DEFAULT 5,
    mana_regen INTEGER DEFAULT 10,
    experience INTEGER DEFAULT 0,
    gold INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    gm_character_id UUID REFERENCES characters(id),
    current_turn INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game session players table
CREATE TABLE IF NOT EXISTS game_session_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_session_id, character_id)
);

-- Abilities table
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

-- Character abilities table
CREATE TABLE IF NOT EXISTS character_abilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    ability_id UUID REFERENCES abilities(id) ON DELETE CASCADE,
    current_cooldown INTEGER DEFAULT 0,
    UNIQUE(character_id, ability_id)
);

-- Ability usage log
CREATE TABLE IF NOT EXISTS ability_usage_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    ability_name VARCHAR(100) NOT NULL,
    game_session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    damage_dealt INTEGER DEFAULT 0,
    effect_description TEXT,
    target_description TEXT,
    turn_used INTEGER,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game events table
CREATE TABLE IF NOT EXISTS game_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_description TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    turn_occurred INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. BATTLE SYSTEM TABLES
-- ==============================================

-- Enemies table
CREATE TABLE IF NOT EXISTS enemies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    level INTEGER DEFAULT 1,
    health_current INTEGER DEFAULT 100,
    health_max INTEGER DEFAULT 100,
    mana_current INTEGER DEFAULT 50,
    mana_max INTEGER DEFAULT 50,
    attack_power INTEGER DEFAULT 10,
    defense INTEGER DEFAULT 5,
    speed INTEGER DEFAULT 10,
    armor_value INTEGER DEFAULT 0,
    magic_resist_value INTEGER DEFAULT 0,
    experience_reward INTEGER DEFAULT 100,
    gold_reward INTEGER DEFAULT 50,
    description TEXT,
    sprite_url TEXT,
    abilities TEXT[] DEFAULT '{}',
    resistances TEXT[] DEFAULT '{}',
    weaknesses TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Battle encounters table
CREATE TABLE IF NOT EXISTS battle_encounters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    enemy_id UUID REFERENCES enemies(id) ON DELETE CASCADE,
    enemy_health_current INTEGER NOT NULL,
    enemy_mana_current INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    turn_order_position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enemy abilities table
CREATE TABLE IF NOT EXISTS enemy_abilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    damage_min INTEGER DEFAULT 0,
    damage_max INTEGER DEFAULT 0,
    mana_cost INTEGER DEFAULT 0,
    cooldown INTEGER DEFAULT 0,
    effect_type VARCHAR(50) DEFAULT 'damage',
    target_type VARCHAR(50) DEFAULT 'single',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enemy ability links table
CREATE TABLE IF NOT EXISTS enemy_ability_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    enemy_id UUID REFERENCES enemies(id) ON DELETE CASCADE,
    ability_id UUID REFERENCES enemy_abilities(id) ON DELETE CASCADE,
    usage_probability DECIMAL(3,2) DEFAULT 0.5,
    UNIQUE(enemy_id, ability_id)
);

-- Enemy battle log table
CREATE TABLE IF NOT EXISTS enemy_battle_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    enemy_id UUID REFERENCES enemies(id) ON DELETE CASCADE,
    ability_used VARCHAR(100),
    target_character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    damage_dealt INTEGER DEFAULT 0,
    effect_description TEXT,
    turn_used INTEGER,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 3. FUNCTIONS
-- ==============================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS calculate_damage_reduction(INTEGER);
DROP FUNCTION IF EXISTS is_magical_attack(TEXT);

-- Function to calculate damage reduction
CREATE OR REPLACE FUNCTION calculate_damage_reduction(resistance INTEGER)
RETURNS DECIMAL AS $$
BEGIN
    resistance := LEAST(resistance, 500);
    RETURN LEAST(resistance::DECIMAL / (resistance + 100), 0.9);
END;
$$ LANGUAGE plpgsql;

-- Function to determine if an attack is magical
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
    ability_name := LOWER(ability_name);
    FOREACH keyword IN ARRAY magical_keywords
    LOOP
        IF ability_name LIKE '%' || keyword || '%' THEN
            RETURN TRUE;
        END IF;
    END LOOP;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS advance_game_turn(UUID);

-- Function to advance game turn
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
    
    -- Increment turn
    UPDATE game_sessions 
    SET current_turn = current_turn + 1, updated_at = NOW()
    WHERE id = session_id;
    
    -- Reset action points and regenerate mana for all active players
    UPDATE characters 
    SET 
        action_points_current = action_points_max,
        mana_current = LEAST(mana_max, mana_current + mana_regen),
        updated_at = NOW()
    WHERE id IN (
        SELECT c.id FROM characters c
        JOIN game_session_players gsp ON c.id = gsp.character_id
        WHERE gsp.game_session_id = session_id AND gsp.is_active = true
    );
    
    GET DIAGNOSTICS players_updated = ROW_COUNT;
    
    -- Calculate total mana regenerated
    SELECT COALESCE(SUM(LEAST(mana_max - mana_current + mana_regen, mana_regen)), 0)
    INTO mana_regenerated
    FROM characters c
    JOIN game_session_players gsp ON c.id = gsp.character_id
    WHERE gsp.game_session_id = session_id AND gsp.is_active = true;
    
    -- Log the turn advance event
    INSERT INTO game_events (game_session_id, event_type, event_description, turn_occurred, created_at)
    VALUES (session_id, 'turn_advance', 'Turn advanced - Action Points reset and mana regenerated', current_turn_num + 1, NOW());
    
    -- Return results
    RETURN QUERY SELECT 
        current_turn_num + 1 as new_turn,
        players_updated as action_points_reset,
        mana_regenerated as mana_regenerated;
END;
$$ LANGUAGE plpgsql;

-- Drop existing functions if they exist (all possible signatures)
DROP FUNCTION IF EXISTS add_enemy_to_battle(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS enemy_attack_player(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS enemy_attack_player(UUID, UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS enemy_attack_player(UUID, UUID, TEXT, TEXT, UUID) CASCADE;

-- Function to add enemy to battle
CREATE OR REPLACE FUNCTION add_enemy_to_battle(
    session_id UUID,
    enemy_name_param TEXT
) RETURNS TABLE (
    encounter_id UUID,
    enemy_name TEXT,
    message TEXT
) AS $$
DECLARE
    enemy_record record;
    new_encounter_id UUID;
BEGIN
    -- Find the enemy by name
    SELECT * INTO enemy_record FROM enemies WHERE name = enemy_name_param;
    
    IF enemy_record IS NULL THEN
        RAISE EXCEPTION 'Enemy "%" not found', enemy_name_param;
    END IF;
    
    -- Create battle encounter
    INSERT INTO battle_encounters (
        game_session_id, enemy_id, enemy_health_current, enemy_mana_current
    ) VALUES (
        session_id, enemy_record.id, enemy_record.health_max, enemy_record.mana_max
    ) RETURNING id INTO new_encounter_id;
    
    -- Log the event
    INSERT INTO game_events (game_session_id, event_type, event_description)
    VALUES (session_id, 'enemy_added', enemy_name_param || ' has joined the battle!');
    
    RETURN QUERY SELECT 
        new_encounter_id as encounter_id,
        enemy_record.name as enemy_name,
        (enemy_record.name || ' has joined the battle!') as message;
END;
$$ LANGUAGE plpgsql;

-- Enhanced enemy attack function
CREATE OR REPLACE FUNCTION enemy_attack_player(
    encounter_id UUID,
    session_id UUID,
    target_selection TEXT DEFAULT 'random',
    ability_name TEXT DEFAULT 'Basic Attack',
    target_player_id UUID DEFAULT NULL
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
    -- Get enemy info
    SELECT e.name as enemy_name, e.attack_power, be.enemy_health_current
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
    
    -- Determine if magical attack
    is_magical := is_magical_attack(ability_name);
    
    -- Build target query based on selection type
    IF target_player_id IS NOT NULL THEN
        -- Target specific player
        target_query := 'SELECT c.id, c.name, c.health_current, c.health_max, c.armor_current, c.magic_resist_current FROM characters c JOIN game_session_players gsp ON c.id = gsp.character_id WHERE gsp.game_session_id = $1 AND gsp.is_active = true AND c.id = $2 AND c.health_current > 0';
        EXECUTE target_query INTO target_record USING session_id, target_player_id;
    ELSIF target_selection = 'weakest' THEN
        target_query := 'SELECT c.id, c.name, c.health_current, c.health_max, c.armor_current, c.magic_resist_current FROM characters c JOIN game_session_players gsp ON c.id = gsp.character_id WHERE gsp.game_session_id = $1 AND gsp.is_active = true AND c.health_current > 0 ORDER BY c.health_current ASC LIMIT 1';
        EXECUTE target_query INTO target_record USING session_id;
    ELSIF target_selection = 'strongest' THEN
        target_query := 'SELECT c.id, c.name, c.health_current, c.health_max, c.armor_current, c.magic_resist_current FROM characters c JOIN game_session_players gsp ON c.id = gsp.character_id WHERE gsp.game_session_id = $1 AND gsp.is_active = true AND c.health_current > 0 ORDER BY c.health_current DESC LIMIT 1';
        EXECUTE target_query INTO target_record USING session_id;
    ELSE
        target_query := 'SELECT c.id, c.name, c.health_current, c.health_max, c.armor_current, c.magic_resist_current FROM characters c JOIN game_session_players gsp ON c.id = gsp.character_id WHERE gsp.game_session_id = $1 AND gsp.is_active = true AND c.health_current > 0 ORDER BY RANDOM() LIMIT 1';
        EXECUTE target_query INTO target_record USING session_id;
    END IF;
    
    IF target_record IS NULL THEN
        RAISE EXCEPTION 'No valid targets found';
    END IF;
    
    -- Calculate damage
    base_damage_amount := enemy_record.attack_power;
    base_damage_amount := base_damage_amount + (RANDOM() * base_damage_amount * 0.5)::INTEGER - (base_damage_amount * 0.25)::INTEGER;
    base_damage_amount := GREATEST(1, base_damage_amount);
    
    -- Determine resistance
    IF is_magical THEN
        resistance := COALESCE(target_record.magic_resist_current, 0);
    ELSE
        resistance := COALESCE(target_record.armor_current, 0);
    END IF;
    
    -- Calculate damage reduction
    reduction_percent := calculate_damage_reduction(resistance);
    damage_blocked := (base_damage_amount * reduction_percent)::INTEGER;
    damage_amount := GREATEST(1, base_damage_amount - damage_blocked);
    
    -- Apply damage
    UPDATE characters 
    SET health_current = GREATEST(0, health_current - damage_amount), updated_at = NOW()
    WHERE id = target_record.id;
    
    -- Log attack
    INSERT INTO enemy_battle_log (game_session_id, enemy_id, ability_used, target_character_id, damage_dealt, effect_description, turn_used)
    VALUES (session_id, (SELECT enemy_id FROM battle_encounters WHERE id = encounter_id), ability_name, target_record.id, damage_amount, 
            CASE WHEN is_magical THEN 'Magical attack: ' || base_damage_amount || ' base - ' || damage_blocked || ' blocked by ' || resistance || ' Magic Resist'
                 ELSE 'Physical attack: ' || base_damage_amount || ' base - ' || damage_blocked || ' blocked by ' || resistance || ' Armor' END,
            (SELECT current_turn FROM game_sessions WHERE id = session_id));
    
    -- Return results
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

-- ==============================================
-- 4. ADD MISSING COLUMNS TO EXISTING TABLES
-- ==============================================

-- Add missing columns to existing tables if they don't exist
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS armor_value INTEGER DEFAULT 0;
ALTER TABLE enemies ADD COLUMN IF NOT EXISTS magic_resist_value INTEGER DEFAULT 0;

-- Add missing columns to characters table if they don't exist
ALTER TABLE characters ADD COLUMN IF NOT EXISTS attack_power INTEGER DEFAULT 10;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS defense INTEGER DEFAULT 5;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS speed INTEGER DEFAULT 10;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS armor_current INTEGER DEFAULT 10;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS magic_resist_current INTEGER DEFAULT 5;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS mana_regen INTEGER DEFAULT 10;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS experience INTEGER DEFAULT 0;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS gold INTEGER DEFAULT 100;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS action_points_current INTEGER DEFAULT 3;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS action_points_max INTEGER DEFAULT 3;

-- ==============================================
-- 5. SAMPLE DATA
-- ==============================================

-- Insert sample abilities (only if they don't exist)
INSERT INTO abilities (name, description, category, cooldown_max, damage, mana_cost, effects, icon) 
SELECT * FROM (VALUES
('Starburst Stream', 'A devastating 16-hit combo attack', 'ultimate', 300, '16x weapon damage', 80, ARRAY['stun', 'high_damage'], '⭐'),
('Vorpal Strike', 'A powerful single-target thrust attack', 'skill', 45, '3x weapon damage', 25, ARRAY['armor_pierce'], '🗡️'),
('Healing Potion', 'Restores health over time', 'basic', 30, '+150 HP', 0, ARRAY['heal_over_time'], '🧪'),
('Mana Potion', 'Restores mana instantly', 'basic', 15, '+100 MP', 0, ARRAY['mana_restore'], '💙'),
('Rage Burst', 'Increases attack speed and damage', 'skill', 120, '+50% damage', 40, ARRAY['damage_boost', 'speed_boost'], '😡'),
('Fireball', 'A magical fire projectile', 'skill', 60, '2d8+5', 30, ARRAY['burn'], '🔥'),
('Ice Shard', 'A sharp ice projectile', 'skill', 45, '1d6+3', 20, ARRAY['freeze'], '❄️'),
('Lightning Bolt', 'A powerful electric attack', 'skill', 90, '3d6+8', 50, ARRAY['shock'], '⚡'),
('Basic Attack', 'A simple weapon strike', 'basic', 0, '1d4+2', 0, ARRAY['damage'], '⚔️')
) AS new_abilities(name, description, category, cooldown_max, damage, mana_cost, effects, icon)
WHERE NOT EXISTS (SELECT 1 FROM abilities WHERE abilities.name = new_abilities.name);

-- Insert sample enemies (only if they don't exist)
INSERT INTO enemies (name, type, level, health_max, health_current, mana_max, mana_current, attack_power, defense, speed, armor_value, magic_resist_value, experience_reward, gold_reward, description)
SELECT * FROM (VALUES
('Forest Goblin', 'goblin', 1, 80, 80, 20, 20, 8, 3, 12, 5, 2, 50, 25, 'A small, sneaky goblin that lurks in the forest. Quick but fragile.'),
('Orc Warrior', 'orc', 3, 150, 150, 30, 30, 15, 8, 8, 20, 8, 120, 60, 'A brutish orc warrior with heavy armor and a massive club.'),
('Fire Elemental', 'elemental', 5, 200, 200, 100, 100, 20, 5, 15, 10, 40, 200, 100, 'A burning creature of pure flame. Weak to water but devastating with fire attacks.'),
('Shadow Assassin', 'undead', 4, 120, 120, 60, 60, 18, 4, 20, 15, 25, 180, 80, 'A stealthy undead assassin that strikes from the shadows.'),
('Ancient Dragon', 'dragon', 10, 500, 500, 200, 200, 35, 20, 12, 100, 50, 1000, 500, 'An ancient and powerful dragon. The ultimate challenge for any adventuring party.')
) AS new_enemies(name, type, level, health_max, health_current, mana_max, mana_current, attack_power, defense, speed, armor_value, magic_resist_value, experience_reward, gold_reward, description)
WHERE NOT EXISTS (SELECT 1 FROM enemies WHERE enemies.name = new_enemies.name);

-- Insert sample characters (only if they don't exist)
INSERT INTO characters (id, name, class, level, health_max, health_current, mana_max, mana_current, action_points_max, action_points_current, attack_power, defense, speed, armor_current, magic_resist_current, mana_regen, experience, gold)
SELECT * FROM (VALUES
('550e8400-e29b-41d4-a716-446655440001'::UUID, 'Kirito', 'Swordsman', 75, 125000, 125000, 580, 580, 8, 8, 100, 80, 350, 120, 60, 15, 0, 50000),
('550e8400-e29b-41d4-a716-446655440002'::UUID, 'Asuna', 'Rapier User', 72, 98000, 98000, 520, 520, 7, 7, 95, 70, 380, 100, 80, 12, 0, 45000),
('550e8400-e29b-41d4-a716-446655440003'::UUID, 'Klein', 'Berserker', 68, 98000, 98000, 520, 520, 8, 8, 100, 80, 320, 150, 40, 10, 0, 40000),
('550e8400-e29b-41d4-a716-446655440004'::UUID, 'Silica', 'Beast Tamer', 62, 78000, 78000, 280, 280, 6, 6, 80, 60, 240, 80, 100, 8, 0, 35000),
('550e8400-e29b-41d4-a716-446655440005'::UUID, 'Lisbeth', 'Blacksmith', 58, 65000, 65000, 350, 350, 5, 5, 70, 90, 180, 200, 50, 6, 0, 30000)
) AS new_characters(id, name, class, level, health_max, health_current, mana_max, mana_current, action_points_max, action_points_current, attack_power, defense, speed, armor_current, magic_resist_current, mana_regen, experience, gold)
WHERE NOT EXISTS (SELECT 1 FROM characters WHERE characters.id = new_characters.id);

-- ==============================================
-- 6. VIEWS
-- ==============================================

-- Battle encounters view
CREATE OR REPLACE VIEW battle_encounters_view AS
SELECT 
    be.id as encounter_id,
    be.game_session_id,
    be.enemy_id,
    be.enemy_health_current,
    be.enemy_mana_current,
    be.turn_order_position,
    e.name as enemy_name,
    e.type as enemy_type,
    e.level as enemy_level,
    e.health_max as enemy_health_max,
    e.mana_max as enemy_mana_max,
    e.attack_power,
    e.defense,
    e.speed,
    e.armor_value,
    e.magic_resist_value,
    e.description as enemy_description,
    e.sprite_url
FROM battle_encounters be
JOIN enemies e ON be.enemy_id = e.id
WHERE be.is_active = true;

-- Enemy combat stats view
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

-- ==============================================
-- 7. ROW LEVEL SECURITY
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_session_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE abilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_abilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ability_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE enemies ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE enemy_abilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE enemy_ability_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE enemy_battle_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on characters" ON characters;
DROP POLICY IF EXISTS "Allow all operations on game_sessions" ON game_sessions;
DROP POLICY IF EXISTS "Allow all operations on game_session_players" ON game_session_players;
DROP POLICY IF EXISTS "Allow all operations on abilities" ON abilities;
DROP POLICY IF EXISTS "Allow all operations on character_abilities" ON character_abilities;
DROP POLICY IF EXISTS "Allow all operations on ability_usage_log" ON ability_usage_log;
DROP POLICY IF EXISTS "Allow all operations on game_events" ON game_events;
DROP POLICY IF EXISTS "Allow all operations on enemies" ON enemies;
DROP POLICY IF EXISTS "Allow all operations on battle_encounters" ON battle_encounters;
DROP POLICY IF EXISTS "Allow all operations on enemy_abilities" ON enemy_abilities;
DROP POLICY IF EXISTS "Allow all operations on enemy_ability_links" ON enemy_ability_links;
DROP POLICY IF EXISTS "Allow all operations on enemy_battle_log" ON enemy_battle_log;

-- Create policies (allow all for now - adjust as needed)
CREATE POLICY "Allow all operations on characters" ON characters FOR ALL USING (true);
CREATE POLICY "Allow all operations on game_sessions" ON game_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on game_session_players" ON game_session_players FOR ALL USING (true);
CREATE POLICY "Allow all operations on abilities" ON abilities FOR ALL USING (true);
CREATE POLICY "Allow all operations on character_abilities" ON character_abilities FOR ALL USING (true);
CREATE POLICY "Allow all operations on ability_usage_log" ON ability_usage_log FOR ALL USING (true);
CREATE POLICY "Allow all operations on game_events" ON game_events FOR ALL USING (true);
CREATE POLICY "Allow all operations on enemies" ON enemies FOR ALL USING (true);
CREATE POLICY "Allow all operations on battle_encounters" ON battle_encounters FOR ALL USING (true);
CREATE POLICY "Allow all operations on enemy_abilities" ON enemy_abilities FOR ALL USING (true);
CREATE POLICY "Allow all operations on enemy_ability_links" ON enemy_ability_links FOR ALL USING (true);
CREATE POLICY "Allow all operations on enemy_battle_log" ON enemy_battle_log FOR ALL USING (true);

-- ==============================================
-- 8. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Tables created: characters, game_sessions, abilities, enemies, battle_encounters, and more';
    RAISE NOTICE 'Functions created: advance_game_turn, add_enemy_to_battle, enemy_attack_player, and more';
    RAISE NOTICE 'Sample data inserted: 5 characters, 9 abilities, 5 enemies';
    RAISE NOTICE 'Enhanced damage system with armor and magic resist is ready!';
END $$;
