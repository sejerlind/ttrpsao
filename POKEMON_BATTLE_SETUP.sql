-- Pokemon-Style Battle System Setup
-- Run this SQL in your Supabase SQL Editor

-- 1. Create enemies/foes table
CREATE TABLE enemies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g., 'goblin', 'dragon', 'boss', 'minion'
    level INTEGER DEFAULT 1,
    health_current INTEGER DEFAULT 100,
    health_max INTEGER DEFAULT 100,
    mana_current INTEGER DEFAULT 50,
    mana_max INTEGER DEFAULT 50,
    attack_power INTEGER DEFAULT 10,
    defense INTEGER DEFAULT 5,
    speed INTEGER DEFAULT 10,
    experience_reward INTEGER DEFAULT 100,
    gold_reward INTEGER DEFAULT 50,
    description TEXT,
    sprite_url TEXT, -- URL to enemy image/sprite
    abilities TEXT[] DEFAULT '{}', -- Array of ability names
    resistances TEXT[] DEFAULT '{}', -- Array of damage types they resist
    weaknesses TEXT[] DEFAULT '{}', -- Array of damage types they're weak to
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create battle encounters table (links game sessions to enemies)
CREATE TABLE battle_encounters (
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

-- 3. Create enemy abilities table
CREATE TABLE enemy_abilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    damage_min INTEGER DEFAULT 0,
    damage_max INTEGER DEFAULT 0,
    mana_cost INTEGER DEFAULT 0,
    cooldown INTEGER DEFAULT 0,
    effect_type VARCHAR(50) DEFAULT 'damage', -- 'damage', 'heal', 'buff', 'debuff'
    target_type VARCHAR(50) DEFAULT 'single', -- 'single', 'all', 'self'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Link enemies to their abilities
CREATE TABLE enemy_ability_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    enemy_id UUID REFERENCES enemies(id) ON DELETE CASCADE,
    ability_id UUID REFERENCES enemy_abilities(id) ON DELETE CASCADE,
    usage_probability DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0, chance AI will use this ability
    UNIQUE(enemy_id, ability_id)
);

-- 5. Insert sample enemies
INSERT INTO enemies (name, type, level, health_max, health_current, mana_max, mana_current, attack_power, defense, speed, experience_reward, gold_reward, description) VALUES
('Forest Goblin', 'goblin', 1, 80, 80, 20, 20, 8, 3, 12, 50, 25, 'A small, sneaky goblin that lurks in the forest. Quick but fragile.'),
('Orc Warrior', 'orc', 3, 150, 150, 30, 30, 15, 8, 8, 120, 60, 'A brutish orc warrior with heavy armor and a massive club.'),
('Fire Elemental', 'elemental', 5, 200, 200, 100, 100, 20, 5, 15, 200, 100, 'A burning creature of pure flame. Weak to water but devastating with fire attacks.'),
('Shadow Assassin', 'undead', 4, 120, 120, 60, 60, 18, 4, 20, 180, 80, 'A stealthy undead assassin that strikes from the shadows.'),
('Ancient Dragon', 'dragon', 10, 500, 500, 200, 200, 35, 20, 12, 1000, 500, 'An ancient and powerful dragon. The ultimate challenge for any adventuring party.');

-- 6. Insert sample enemy abilities
INSERT INTO enemy_abilities (name, description, damage_min, damage_max, mana_cost, cooldown, effect_type, target_type) VALUES
('Claw Strike', 'A basic melee attack with claws', 8, 15, 0, 0, 'damage', 'single'),
('Fireball', 'Hurls a ball of fire at target', 15, 25, 10, 2, 'damage', 'single'),
('Heal', 'Restores health to self', 20, 30, 15, 3, 'heal', 'self'),
('Poison Spit', 'Spits poison that deals damage over time', 5, 10, 8, 1, 'debuff', 'single'),
('Battle Roar', 'Increases attack power temporarily', 0, 0, 20, 4, 'buff', 'self'),
('Lightning Bolt', 'Strikes with electricity', 12, 20, 12, 1, 'damage', 'single'),
('Ice Shard', 'Throws sharp ice that may slow target', 10, 18, 8, 1, 'damage', 'single'),
('Dragon Breath', 'Devastating fire breath attack', 25, 40, 25, 3, 'damage', 'all'),
('Shadow Strike', 'Attack from shadows with bonus damage', 20, 30, 15, 2, 'damage', 'single'),
('Regeneration', 'Slowly heals over time', 15, 25, 20, 5, 'heal', 'self');

-- 7. Link abilities to enemies
INSERT INTO enemy_ability_links (enemy_id, ability_id, usage_probability) VALUES
-- Forest Goblin abilities
((SELECT id FROM enemies WHERE name = 'Forest Goblin'), (SELECT id FROM enemy_abilities WHERE name = 'Claw Strike'), 0.7),
((SELECT id FROM enemies WHERE name = 'Forest Goblin'), (SELECT id FROM enemy_abilities WHERE name = 'Poison Spit'), 0.3),

-- Orc Warrior abilities  
((SELECT id FROM enemies WHERE name = 'Orc Warrior'), (SELECT id FROM enemy_abilities WHERE name = 'Claw Strike'), 0.6),
((SELECT id FROM enemies WHERE name = 'Orc Warrior'), (SELECT id FROM enemy_abilities WHERE name = 'Battle Roar'), 0.4),

-- Fire Elemental abilities
((SELECT id FROM enemies WHERE name = 'Fire Elemental'), (SELECT id FROM enemy_abilities WHERE name = 'Fireball'), 0.8),
((SELECT id FROM enemies WHERE name = 'Fire Elemental'), (SELECT id FROM enemy_abilities WHERE name = 'Lightning Bolt'), 0.2),

-- Shadow Assassin abilities
((SELECT id FROM enemies WHERE name = 'Shadow Assassin'), (SELECT id FROM enemy_abilities WHERE name = 'Shadow Strike'), 0.7),
((SELECT id FROM enemies WHERE name = 'Shadow Assassin'), (SELECT id FROM enemy_abilities WHERE name = 'Poison Spit'), 0.3),

-- Ancient Dragon abilities
((SELECT id FROM enemies WHERE name = 'Ancient Dragon'), (SELECT id FROM enemy_abilities WHERE name = 'Dragon Breath'), 0.4),
((SELECT id FROM enemies WHERE name = 'Ancient Dragon'), (SELECT id FROM enemy_abilities WHERE name = 'Claw Strike'), 0.3),
((SELECT id FROM enemies WHERE name = 'Ancient Dragon'), (SELECT id FROM enemy_abilities WHERE name = 'Regeneration'), 0.3);

-- 8. Create battle log for enemy actions
CREATE TABLE enemy_battle_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    enemy_id UUID REFERENCES enemies(id) ON DELETE CASCADE,
    ability_used VARCHAR(100),
    target_character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
    damage_dealt INTEGER DEFAULT 0,
    effect_description TEXT,
    turn_used INTEGER,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Add indexes for performance
CREATE INDEX idx_battle_encounters_session ON battle_encounters(game_session_id);
CREATE INDEX idx_battle_encounters_active ON battle_encounters(is_active);
CREATE INDEX idx_enemy_battle_log_session ON enemy_battle_log(game_session_id);
CREATE INDEX idx_enemy_battle_log_turn ON enemy_battle_log(turn_used);

-- 10. Enable RLS (Row Level Security)
ALTER TABLE enemies ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE enemy_abilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE enemy_ability_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE enemy_battle_log ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies (allowing all operations for now - adjust as needed)
CREATE POLICY "Allow all operations on enemies" ON enemies FOR ALL USING (true);
CREATE POLICY "Allow all operations on battle_encounters" ON battle_encounters FOR ALL USING (true);
CREATE POLICY "Allow all operations on enemy_abilities" ON enemy_abilities FOR ALL USING (true);
CREATE POLICY "Allow all operations on enemy_ability_links" ON enemy_ability_links FOR ALL USING (true);
CREATE POLICY "Allow all operations on enemy_battle_log" ON enemy_battle_log FOR ALL USING (true);

-- 12. Create a view for active battle encounters with enemy details
CREATE VIEW active_battle_encounters AS
SELECT 
    be.id as encounter_id,
    be.game_session_id,
    be.enemy_health_current,
    be.enemy_mana_current,
    be.turn_order_position,
    e.id as enemy_id,
    e.name as enemy_name,
    e.type as enemy_type,
    e.level as enemy_level,
    e.health_max as enemy_health_max,
    e.mana_max as enemy_mana_max,
    e.attack_power,
    e.defense,
    e.speed,
    e.description as enemy_description,
    e.sprite_url
FROM battle_encounters be
JOIN enemies e ON be.enemy_id = e.id
WHERE be.is_active = true;

-- 13. Create function to add enemy to battle
CREATE OR REPLACE FUNCTION add_enemy_to_battle(
    session_id UUID,
    enemy_name TEXT
) RETURNS UUID AS $$
DECLARE
    enemy_record enemies%ROWTYPE;
    encounter_id UUID;
BEGIN
    -- Get the enemy
    SELECT * INTO enemy_record FROM enemies WHERE name = enemy_name LIMIT 1;
    
    IF enemy_record IS NULL THEN
        RAISE EXCEPTION 'Enemy % not found', enemy_name;
    END IF;
    
    -- Add to battle
    INSERT INTO battle_encounters (
        game_session_id,
        enemy_id,
        enemy_health_current,
        enemy_mana_current,
        turn_order_position
    ) VALUES (
        session_id,
        enemy_record.id,
        enemy_record.health_max,
        enemy_record.mana_max,
        0
    ) RETURNING id INTO encounter_id;
    
    RETURN encounter_id;
END;
$$ LANGUAGE plpgsql;

-- Usage example:
-- SELECT add_enemy_to_battle('your-session-id', 'Forest Goblin');

COMMENT ON TABLE enemies IS 'Pokemon-style enemies/foes that can be encountered in battle';
COMMENT ON TABLE battle_encounters IS 'Active enemies in current battle encounters';
COMMENT ON TABLE enemy_abilities IS 'Abilities that enemies can use in battle';
COMMENT ON FUNCTION add_enemy_to_battle IS 'Function to add an enemy to an active battle session';
