# Supabase Setup Guide for TTRPSAO

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `ttrpsao` or similar
   - Database Password: (create a strong password)
   - Region: Choose closest to you

## Step 2: Get API Credentials

1. In your Supabase dashboard, go to **Settings > API**
2. Copy these values:
   - **Project URL** (looks like: `https://xyzcompany.supabase.co`)
   - **anon/public key** (long JWT token starting with `eyJ...`)

## Step 3: Create Environment File

Create a file called `.env.local` in your project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Create Database Tables

Run this SQL in your Supabase SQL Editor (Settings > SQL Editor):

```sql
-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Characters table
CREATE TABLE characters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    class VARCHAR(50) NOT NULL,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    experience_to_next INTEGER DEFAULT 1000,
    health_current INTEGER DEFAULT 100,
    health_max INTEGER DEFAULT 100,
    mana_current INTEGER DEFAULT 50,
    mana_max INTEGER DEFAULT 50,
    stamina_current INTEGER DEFAULT 100,
    stamina_max INTEGER DEFAULT 100,
    action_points_current INTEGER DEFAULT 5,
    action_points_max INTEGER DEFAULT 5,
    armor_current INTEGER DEFAULT 0,
    armor_max INTEGER DEFAULT 100,
    magic_resist_current INTEGER DEFAULT 0,
    magic_resist_max INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abilities table
CREATE TABLE abilities (
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

-- Skills table for tech tree
CREATE TABLE skills (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    tier INTEGER DEFAULT 1,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    skill_tree VARCHAR(50) NOT NULL,
    prerequisites TEXT[] DEFAULT '{}',
    cost_skill_points INTEGER DEFAULT 1,
    cost_level INTEGER DEFAULT 1,
    cost_gold INTEGER DEFAULT 0,
    max_rank INTEGER DEFAULT 1,
    category VARCHAR(20) DEFAULT 'passive',
    effects JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Character skills (progression tracking)
CREATE TABLE character_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    skill_id VARCHAR(100) REFERENCES skills(id) ON DELETE CASCADE,
    current_rank INTEGER DEFAULT 0,
    is_unlocked BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(character_id, skill_id)
);

-- Player progression tracking
CREATE TABLE player_progression (
    character_id UUID PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
    total_level INTEGER DEFAULT 1,
    skill_points INTEGER DEFAULT 0,
    unspent_skill_points INTEGER DEFAULT 0,
    talent_points INTEGER DEFAULT 0,
    unspent_talent_points INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE abilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_progression ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - you can restrict later)
CREATE POLICY "Allow all operations on characters" ON characters FOR ALL USING (true);
CREATE POLICY "Allow all operations on abilities" ON abilities FOR ALL USING (true);
CREATE POLICY "Allow all operations on skills" ON skills FOR ALL USING (true);
CREATE POLICY "Allow all operations on character_skills" ON character_skills FOR ALL USING (true);
CREATE POLICY "Allow all operations on player_progression" ON player_progression FOR ALL USING (true);
```

## Step 5: Insert Sample Data

```sql
-- Insert sample characters
INSERT INTO characters (id, name, class, level, experience, experience_to_next, health_current, health_max, mana_current, mana_max, stamina_current, stamina_max, action_points_current, action_points_max, armor_current, armor_max, magic_resist_current, magic_resist_max) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Kirito', 'Swordsman', 78, 156000, 180000, 450, 500, 120, 150, 280, 300, 8, 10, 180, 200, 85, 100),
('550e8400-e29b-41d4-a716-446655440002', 'Asuna', 'Rapier Master', 75, 142000, 165000, 380, 420, 200, 250, 250, 280, 9, 10, 140, 160, 120, 140),
('550e8400-e29b-41d4-a716-446655440003', 'Klein', 'Berserker', 68, 98000, 125000, 520, 580, 80, 100, 320, 350, 7, 8, 200, 220, 60, 80),
('550e8400-e29b-41d4-a716-446655440004', 'Silica', 'Beast Tamer', 62, 78000, 95000, 280, 320, 180, 220, 200, 240, 6, 8, 100, 120, 95, 110),
('550e8400-e29b-41d4-a716-446655440005', 'Lisbeth', 'Blacksmith', 58, 65000, 82000, 350, 400, 150, 180, 220, 260, 5, 7, 160, 180, 75, 90);

-- Insert sample abilities
INSERT INTO abilities (name, description, category, cooldown_max, damage, mana_cost, effects, icon) VALUES
('Starburst Stream', 'A devastating 16-hit combo attack', 'ultimate', 300, '16x weapon damage', 80, ARRAY['stun', 'high_damage'], '⭐'),
('Vorpal Strike', 'A powerful single-target thrust attack', 'skill', 45, '3x weapon damage', 25, ARRAY['armor_pierce'], '🗡️'),
('Healing Potion', 'Restores health over time', 'basic', 30, '+150 HP', 0, ARRAY['heal_over_time'], '🧪'),
('Mana Potion', 'Restores mana instantly', 'basic', 15, '+100 MP', 0, ARRAY['mana_restore'], '💙'),
('Rage Burst', 'Increases attack speed and damage', 'skill', 120, '+50% damage', 40, ARRAY['damage_boost', 'speed_boost'], '😡');

-- Insert sample skills for tech tree
INSERT INTO skills (id, name, description, icon, tier, position_x, position_y, skill_tree, prerequisites, cost_skill_points, cost_level, max_rank, category, effects) VALUES
-- Combat Tree
('combat_basic_attack', 'Basic Combat', 'Foundation of all combat techniques', '⚔️', 1, 0, 0, 'COMBAT', '{}', 1, 1, 5, 'PASSIVE', '[{"type": "stat_bonus", "target": "attack", "value": 5, "description": "+5 Attack per rank"}]'),
('combat_sword_mastery', 'Sword Mastery', 'Advanced sword combat techniques', '🗡️', 2, 1, 0, 'COMBAT', '["combat_basic_attack"]', 2, 5, 3, 'PASSIVE', '[{"type": "stat_bonus", "target": "crit_chance", "value": 3, "description": "+3% Crit Chance per rank"}]'),
('combat_berserker_rage', 'Berserker Rage', 'Enter a rage state for massive damage', '😡', 3, 2, 0, 'COMBAT', '["combat_sword_mastery"]', 4, 15, 1, 'ACTIVE', '[{"type": "ability_unlock", "target": "berserker_rage", "value": 1, "description": "Unlocks Berserker Rage ability"}]'),

-- Magic Tree  
('magic_basic_spells', 'Basic Magic', 'Foundation of magical knowledge', '🔮', 1, 0, 2, 'MAGIC', '{}', 1, 1, 5, 'PASSIVE', '[{"type": "stat_bonus", "target": "mana", "value": 20, "description": "+20 Mana per rank"}]'),
('magic_fireball', 'Fireball', 'Launch a devastating fireball', '🔥', 2, 1, 2, 'MAGIC', '["magic_basic_spells"]', 3, 8, 1, 'ACTIVE', '[{"type": "ability_unlock", "target": "fireball", "value": 1, "description": "Unlocks Fireball ability"}]'),
('magic_meteor', 'Meteor', 'Call down a massive meteor', '☄️', 4, 2, 2, 'MAGIC', '["magic_fireball"]', 8, 25, 1, 'ULTIMATE', '[{"type": "ability_unlock", "target": "meteor", "value": 1, "description": "Unlocks Meteor ultimate"}]'),

-- Defensive Tree
('defense_basic_block', 'Basic Defense', 'Learn blocking fundamentals', '🛡️', 1, 0, 4, 'DEFENSIVE', '{}', 1, 1, 5, 'PASSIVE', '[{"type": "stat_bonus", "target": "block_chance", "value": 5, "description": "+5% Block Chance per rank"}]'),
('defense_iron_skin', 'Iron Skin', 'Harden your skin against damage', '🛡️', 2, 1, 4, 'DEFENSIVE', '["defense_basic_block"]', 2, 6, 3, 'PASSIVE', '[{"type": "stat_bonus", "target": "damage_reduction", "value": 5, "description": "+5% Damage Reduction per rank"}]');

-- Insert sample character skills and progression
INSERT INTO character_skills (character_id, skill_id, current_rank, is_unlocked, unlocked_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'combat_basic_attack', 5, true, NOW() - INTERVAL '30 days'),
('550e8400-e29b-41d4-a716-446655440001', 'combat_sword_mastery', 3, true, NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440001', 'combat_berserker_rage', 1, true, NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440002', 'magic_basic_spells', 4, true, NOW() - INTERVAL '25 days'),
('550e8400-e29b-41d4-a716-446655440002', 'magic_fireball', 1, true, NOW() - INTERVAL '15 days');

INSERT INTO player_progression (character_id, total_level, skill_points, unspent_skill_points, talent_points, unspent_talent_points) VALUES
('550e8400-e29b-41d4-a716-446655440001', 78, 156, 12, 39, 5),
('550e8400-e29b-41d4-a716-446655440002', 75, 150, 8, 37, 3),
('550e8400-e29b-41d4-a716-446655440003', 68, 136, 15, 34, 7),
('550e8400-e29b-41d4-a716-446655440004', 62, 124, 6, 31, 2),
('550e8400-e29b-41d4-a716-446655440005', 58, 116, 10, 29, 4);
```

## Step 6: Test the Connection

After setting up the environment file, restart your development server:

```bash
npm run dev
```

The application should now connect to your Supabase database and load real character data!

## Troubleshooting

- **Connection issues**: Double-check your URL and API key
- **CORS errors**: Make sure your domain is allowed in Supabase settings
- **RLS errors**: The policies above allow all operations - adjust as needed for production
- **Missing data**: Run the sample data inserts to populate your database

## Next Steps

- Customize the character classes and skills
- Add user authentication
- Implement real-time updates
- Add more complex skill interactions
- Create admin panels for content management 