import { createClient } from '@supabase/supabase-js'

// Environment variables with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('🚨 Supabase environment variables are missing!')
  console.error('Please create a .env.local file with:')
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key')
}

// Create client only if environment variables are present
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

// Database types
export interface DatabaseAbility {
  id: string
  name: string
  description: string
  category: 'basic' | 'skill' | 'ultimate'
  cooldown_max: number
  current_cooldown?: number
  damage?: string
  mana_cost?: number
  effects?: string[]
  icon?: string
  created_at?: string
  updated_at?: string
}

export interface DatabaseCharacter {
  id: string
  name: string
  class: string
  level: number
  experience: number
  experience_to_next: number
  health_current: number
  health_max: number
  mana_current: number
  mana_max: number
  stamina_current: number
  stamina_max: number
  action_points_current: number
  action_points_max: number
  armor_current: number
  magic_resist_current: number
  created_at?: string
  updated_at?: string
}

export interface GameSessionRow {
  id: string
  name: string
  description: string | null
  gm_name: string
  status: string
  created_at: string
  started_at: string | null
  ended_at: string | null
  updated_at: string
}

export interface AbilityUsageLogRow {
  id: string
  game_session_id: string
  character_id: string
  ability_id: string
  used_at: string
  effect_description: string | null
  damage_dealt: string | null
  mana_cost_paid: number
  action_points_used: number
  target_description: string | null
  notes: string | null
}

export interface Database {
  public: {
    Tables: {
      Abilities: {
        Row: DatabaseAbility
        Insert: Omit<DatabaseAbility, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DatabaseAbility, 'id' | 'created_at' | 'updated_at'>>
      }
      characters: {
        Row: DatabaseCharacter
        Insert: Omit<DatabaseCharacter, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DatabaseCharacter, 'id' | 'created_at' | 'updated_at'>>
      }
      game_sessions: {
        Row: GameSessionRow
        Insert: Omit<GameSessionRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<GameSessionRow, 'id' | 'created_at'>>
      }
      ability_usage_log: {
        Row: AbilityUsageLogRow
        Insert: Omit<AbilityUsageLogRow, 'id' | 'used_at'>
        Update: Partial<Omit<AbilityUsageLogRow, 'id' | 'used_at'>>
      }
    }
  }
} 