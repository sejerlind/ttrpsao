import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { supabase } from '@/lib/supabase';
import { Enemy, BattleEncounter } from '@/components/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

const ManagerContainer = styled.div`
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.card};
`;

const ManagerHeader = styled.h3`
  color: ${props => props.theme.colors.text.accent};
  font-size: 1.2rem;
  margin-bottom: ${props => props.theme.spacing.lg};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  &::before {
    content: '👹';
    font-size: 1.1rem;
  }
`;

const EnemyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const EnemyCard = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.md};
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
    border-color: ${props => props.theme.colors.accent.cyan};
    transform: translateY(-2px);
  }

  .enemy-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${props => props.theme.spacing.sm};

    .enemy-name {
      font-weight: bold;
      color: ${props => props.theme.colors.text.primary};
      font-size: 0.9rem;
    }

    .enemy-level {
      background: ${props => props.theme.colors.accent.cyan};
      color: white;
      padding: 2px 6px;
      border-radius: ${props => props.theme.borderRadius.pill};
      font-size: 0.7rem;
      font-weight: bold;
    }
  }

  .enemy-type {
    color: ${props => props.theme.colors.text.secondary};
    font-size: 0.8rem;
    margin-bottom: ${props => props.theme.spacing.xs};
    text-transform: capitalize;
  }

  .enemy-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${props => props.theme.spacing.xs};
    font-size: 0.7rem;
    color: ${props => props.theme.colors.text.muted};

    .stat {
      display: flex;
      justify-content: space-between;
    }
  }

  .add-button {
    width: 100%;
    margin-top: ${props => props.theme.spacing.sm};
    padding: ${props => props.theme.spacing.xs};
    font-size: 0.8rem;
  }
`;

const AddEnemyButton = styled.button`
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.card};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FilterSelect = styled.select`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: ${props => props.theme.borderRadius.medium};
  color: white;
  padding: ${props => props.theme.spacing.sm};
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent.cyan};
  }

  option {
    background: #2a2a2a;
    color: white;
  }
`;

const SearchInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: ${props => props.theme.borderRadius.medium};
  color: white;
  padding: ${props => props.theme.spacing.sm};
  font-size: 0.9rem;
  flex: 1;
  min-width: 200px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent.cyan};
  }
`;

const CategoryBadge = styled.span<{ type: string }>`
  background: ${props => {
    const colors: Record<string, string> = {
      'minion': '#6c757d',
      'goblin': '#28a745',
      'orc': '#dc3545',
      'elemental': '#fd7e14',
      'undead': '#6f42c1',
      'dragon': '#e83e8c',
      'boss': '#dc3545',
      'elite': '#ffc107',
      'default': '#17a2b8'
    };
    return colors[props.type] || colors.default;
  }};
  color: white;
  padding: 2px 6px;
  border-radius: ${props => props.theme.borderRadius.pill};
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
`;

const BattleSection = styled.div`
  margin-top: ${props => props.theme.spacing.xl};
  padding-top: ${props => props.theme.spacing.xl};
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const BattleHeader = styled.h3`
  color: ${props => props.theme.colors.text.accent};
  font-size: 1.2rem;
  margin-bottom: ${props => props.theme.spacing.lg};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  &::before {
    content: '⚔️';
    font-size: 1.1rem;
  }
`;

const ActiveEnemyCard = styled.div`
  background: linear-gradient(145deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1));
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};

  .enemy-battle-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${props => props.theme.spacing.sm};

    .enemy-name {
      font-weight: bold;
      color: ${props => props.theme.colors.text.primary};
      font-size: 1rem;
    }

    .enemy-health {
      font-size: 0.9rem;
      color: ${props => props.theme.colors.status.error};
    }
  }

  .enemy-actions {
    display: flex;
    gap: ${props => props.theme.spacing.sm};
    margin-top: ${props => props.theme.spacing.sm};
  }
`;

const AttackButton = styled.button`
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const HealthBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin: ${props => props.theme.spacing.xs} 0;

  .health-fill {
    height: 100%;
    background: linear-gradient(90deg, #dc3545, #28a745);
    transition: width 0.3s ease;
  }
`;

interface EnemyManagerProps {
  gameSessionId: string;
  onEnemyAdded: () => void;
}

export default function EnemyManager({ gameSessionId, onEnemyAdded }: EnemyManagerProps) {
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [battleEnemies, setBattleEnemies] = useState<BattleEncounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [selectedEnemy, setSelectedEnemy] = useState<Enemy | null>(null);
  const [attackingEnemy, setAttackingEnemy] = useState<string | null>(null);
  const [sessionPlayers, setSessionPlayers] = useState<{
    id: string;
    name: string;
    health_current: number;
    health_max: number;
    class: string;
  }[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');

  useEffect(() => {
    loadAvailableEnemies();
    loadBattleEnemies();
    loadSessionPlayers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameSessionId]);

  // Debug: Log when gameSessionId changes
  useEffect(() => {
    console.log('EnemyManager: gameSessionId changed to:', gameSessionId);
  }, [gameSessionId]);

  const loadAvailableEnemies = useCallback(async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('enemies')
        .select('*')
        .order('level', { ascending: true });

      if (error) {
        console.error('Error loading enemies:', error);
      } else {
        setEnemies(data || []);
      }
    } catch (error) {
      console.error('Failed to load enemies:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBattleEnemies = useCallback(async () => {
    if (!supabase || !gameSessionId) return;

    try {
      const { data, error } = await supabase
        .from('active_battle_encounters')
        .select('*')
        .eq('game_session_id', gameSessionId);

      if (error) {
        console.error('Error loading battle enemies:', error);
      } else {
        setBattleEnemies(data || []);
      }
    } catch (error) {
      console.error('Failed to load battle enemies:', error);
    }
  }, [gameSessionId]);

  const loadSessionPlayers = useCallback(async () => {
    if (!supabase || !gameSessionId) return;

    try {
      // Use a direct join query to get session players
      const { data, error } = await supabase
        .from('game_session_players')
        .select(`
          character_id,
          characters!inner(
            id,
            name,
            health_current,
            health_max,
            class
          )
        `)
        .eq('game_session_id', gameSessionId)
        .eq('is_active', true);

      if (error) {
        console.error('Error loading session players:', error);
        return;
      }

      if (data && data.length > 0) {
        // Extract character data from the joined result
        const players = data
          .map(row => row.characters)
          .filter(Boolean)
          .flat()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((char: any) => ({
            id: String(char.id),
            name: String(char.name),
            health_current: Number(char.health_current),
            health_max: Number(char.health_max),
            class: String(char.class)
          }));
        setSessionPlayers(players);
        console.log('Loaded session players:', players);
      } else {
        console.log('No session players found for game session:', gameSessionId);
        setSessionPlayers([]);
        
        // If no players found, try to add some sample players
        await addSamplePlayersToSession();
      }
    } catch (error) {
      console.error('Failed to load session players:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameSessionId]);

  const addSamplePlayersToSession = useCallback(async () => {
    if (!supabase || !gameSessionId) return;

    try {
      console.log('Attempting to add sample players to session...');
      
      // Get some sample characters
      const { data: characters, error: charError } = await supabase
        .from('characters')
        .select('id, name, class')
        .limit(3);

      if (charError) {
        console.error('Error loading characters:', charError);
        return;
      }

      if (characters && characters.length > 0) {
        // Add them to the current session
        const sessionPlayerInserts = characters.map(char => ({
          game_session_id: gameSessionId,
          character_id: char.id,
          is_active: true
        }));

        const { error: insertError } = await supabase
          .from('game_session_players')
          .insert(sessionPlayerInserts);

        if (insertError) {
          console.error('Error adding players to session:', insertError);
        } else {
          console.log('Added sample players to session');
          // Reload players
          loadSessionPlayers();
        }
      }
    } catch (error) {
      console.error('Failed to add sample players:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameSessionId]);

  const addEnemyToBattle = async (enemyName: string) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .rpc('add_enemy_to_battle', {
          session_id: gameSessionId,
          enemy_name: enemyName
        });

      if (error) {
        console.error('Error adding enemy to battle:', error);
        alert(`Failed to add enemy: ${error.message}`);
      } else {
        console.log('✅ Enemy added to battle:', data);
        onEnemyAdded();
        loadBattleEnemies(); // Refresh battle enemies
        alert(`${enemyName} has joined the battle!`);
      }
    } catch (error) {
      console.error('Failed to add enemy:', error);
      alert('Failed to add enemy to battle');
    }
  };

  const attackPlayer = async (encounterId: string, targetType: 'random' | 'weakest' | 'strongest' | 'specific' = 'random', targetPlayerId?: string) => {
    if (!supabase || !gameSessionId) return;

    setAttackingEnemy(encounterId);
    try {
      const attackParams: {
        encounter_id: string;
        session_id: string;
        target_selection: string;
        target_player_id?: string;
      } = {
        encounter_id: encounterId,
        session_id: gameSessionId,
        target_selection: targetType
      };

      // If targeting specific player, add the player ID
      if (targetType === 'specific' && targetPlayerId) {
        attackParams.target_player_id = targetPlayerId;
      }

      const { data, error } = await supabase
        .rpc('enemy_attack_player', attackParams);

      if (error) {
        console.error('Error executing enemy attack:', error);
        alert(`Attack failed: ${error.message}`);
      } else {
        console.log('✅ Enemy attack executed:', data);
        const result = data?.[0];
        if (result) {
          const damageInfo = result.damage_blocked > 0 
            ? `${result.damage_dealt} damage (${result.base_damage} base - ${result.damage_blocked} blocked by ${result.resistance_used} ${result.damage_type === 'Magical' ? 'Magic Resist' : 'Armor'})`
            : `${result.damage_dealt} damage`;
          alert(`${result.enemy_name} attacked ${result.target_name} for ${damageInfo}!`);
        }
        loadBattleEnemies(); // Refresh battle state
        loadSessionPlayers(); // Refresh player health
      }
    } catch (error) {
      console.error('Failed to execute attack:', error);
      alert('Failed to execute enemy attack');
    } finally {
      setAttackingEnemy(null);
    }
  };

  const removeEnemyFromBattle = async (encounterId: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('battle_encounters')
        .update({ is_active: false })
        .eq('id', encounterId);

      if (error) {
        console.error('Error removing enemy:', error);
        alert(`Failed to remove enemy: ${error.message}`);
      } else {
        console.log('✅ Enemy removed from battle');
        loadBattleEnemies(); // Refresh battle enemies
      }
    } catch (error) {
      console.error('Failed to remove enemy:', error);
      alert('Failed to remove enemy from battle');
    }
  };

  const getEnemySprite = (enemyType: string) => {
    const sprites: Record<string, string> = {
      'goblin': '👹',
      'orc': '🦍',
      'elemental': '🔥',
      'undead': '💀',
      'dragon': '🐉',
      'minion': '👾',
      'elite': '⭐',
      'boss': '👑',
      'humanoid': '🧙',
      'beast': '🐺',
      'custom': '🔧',
      'default': '👾'
    };
    return sprites[enemyType] || sprites.default;
  };

  const getFilteredEnemies = () => {
    return enemies.filter(enemy => {
      const matchesSearch = enemy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          enemy.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || enemy.type === typeFilter;
      const matchesLevel = levelFilter === 'all' || 
                          (levelFilter === '1-3' && enemy.level <= 3) ||
                          (levelFilter === '4-6' && enemy.level >= 4 && enemy.level <= 6) ||
                          (levelFilter === '7+' && enemy.level >= 7);
      
      return matchesSearch && matchesType && matchesLevel;
    });
  };

  const getUniqueTypes = () => {
    const types = [...new Set(enemies.map(enemy => enemy.type))];
    return types.sort();
  };

  if (loading) {
    return (
      <ManagerContainer>
        <ManagerHeader>Loading Enemies...</ManagerHeader>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <div>Loading available enemies...</div>
        </div>
      </ManagerContainer>
    );
  }

  const filteredEnemies = getFilteredEnemies();

  return (
    <ManagerContainer>
      <ManagerHeader>Monster Library & Battle Control</ManagerHeader>
      
      {/* Filters */}
      <FilterBar>
        <SearchInput
          type="text"
          placeholder="🔍 Search monsters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <FilterSelect
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          {getUniqueTypes().map(type => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </FilterSelect>
        
        <FilterSelect
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
        >
          <option value="all">All Levels</option>
          <option value="1-3">Level 1-3 (Basic)</option>
          <option value="4-6">Level 4-6 (Intermediate)</option>
          <option value="7+">Level 7+ (Advanced)</option>
        </FilterSelect>
      </FilterBar>

      {/* Available Monsters Library */}
      {enemies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
          <div style={{ color: '#95a5a6', fontStyle: 'italic' }}>
            No enemies available. Run the POKEMON_BATTLE_SETUP.sql script first!
          </div>
        </div>
      ) : (
        <>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h4 style={{ color: '#4ecdc4', margin: 0 }}>
              📚 Available Monsters ({filteredEnemies.length})
            </h4>
            {searchTerm && (
              <Button 
                onClick={() => setSearchTerm('')}
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
              >
                Clear Search
              </Button>
            )}
          </div>
          
          <EnemyGrid>
            {filteredEnemies.map(enemy => (
              <EnemyCard 
                key={enemy.id}
                onClick={() => {
                  setSelectedEnemy(enemy);
                  setShowInfo(true);
                }}
              >
                <div style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '0.5rem' }}>
                  {getEnemySprite(enemy.type)}
                </div>
                
                <div className="enemy-header">
                  <div className="enemy-name">{enemy.name}</div>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <CategoryBadge type={enemy.type}>{enemy.type}</CategoryBadge>
                    <div className="enemy-level">Lv.{enemy.level}</div>
                  </div>
                </div>
                
                <div className="enemy-stats">
                  <div className="stat">
                    <span>❤️ HP:</span>
                    <span>{enemy.health_max}</span>
                  </div>
                  <div className="stat">
                    <span>⚔️ ATK:</span>
                    <span>{enemy.attack_power}</span>
                  </div>
                  <div className="stat">
                    <span>🛡️ DEF:</span>
                    <span>{enemy.defense}</span>
                  </div>
                  <div className="stat">
                    <span>⚡ SPD:</span>
                    <span>{enemy.speed}</span>
                  </div>
                </div>

                <AddEnemyButton
                  className="add-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addEnemyToBattle(enemy.name);
                  }}
                >
                  ➕ Add to Battle
                </AddEnemyButton>
              </EnemyCard>
            ))}
          </EnemyGrid>
        </>
      )}

      {/* Active Battle Enemies */}
      {battleEnemies.length > 0 && (
        <BattleSection>
          <BattleHeader>Active Battle Enemies</BattleHeader>
          {battleEnemies.map(enemy => (
            <ActiveEnemyCard key={enemy.encounter_id}>
              <div className="enemy-battle-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>
                    {getEnemySprite(enemy.enemy_type || 'default')}
                  </span>
                  <div className="enemy-name">{enemy.enemy_name}</div>
                  <CategoryBadge type={enemy.enemy_type || 'default'}>
                    Lv.{enemy.enemy_level}
                  </CategoryBadge>
                </div>
                <div className="enemy-health">
                  {enemy.enemy_health_current}/{enemy.enemy_health_max} HP
                </div>
              </div>
              
              <HealthBar>
                <div 
                  className="health-fill"
                  style={{ 
                    width: `${(enemy.enemy_health_current / (enemy.enemy_health_max || 1)) * 100}%` 
                  }}
                />
              </HealthBar>

              <div className="enemy-actions">
                <AttackButton
                  onClick={() => attackPlayer(enemy.encounter_id, 'random')}
                  disabled={attackingEnemy === enemy.encounter_id}
                >
                  {attackingEnemy === enemy.encounter_id ? '⏳' : '⚔️'} Attack Random
                </AttackButton>
                
                <AttackButton
                  onClick={() => attackPlayer(enemy.encounter_id, 'weakest')}
                  disabled={attackingEnemy === enemy.encounter_id}
                >
                  🎯 Attack Weakest
                </AttackButton>
                
                <AttackButton
                  onClick={() => attackPlayer(enemy.encounter_id, 'strongest')}
                  disabled={attackingEnemy === enemy.encounter_id}
                >
                  💪 Attack Strongest
                </AttackButton>

                {/* Player Selection Dropdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <select
                      value={selectedPlayerId}
                      onChange={(e) => setSelectedPlayerId(e.target.value)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: '2px solid #dc3545',
                        fontSize: '0.9rem',
                        backgroundColor: '#ffffff',
                        color: '#333333',
                        cursor: 'pointer',
                        flex: 1,
                        minHeight: '40px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        (e.target as HTMLSelectElement).style.borderColor = '#28a745';
                        (e.target as HTMLSelectElement).style.boxShadow = '0 0 0 3px rgba(40, 167, 69, 0.25)';
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLSelectElement).style.borderColor = '#dc3545';
                        (e.target as HTMLSelectElement).style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                      }}
                    >
                      <option value="" style={{ color: '#666' }}>Select Player... ({sessionPlayers.length} available)</option>
                      {sessionPlayers.length > 0 ? (
                        sessionPlayers.map(player => (
                          <option 
                            key={player.id} 
                            value={player.id}
                            style={{ 
                              color: '#333',
                              backgroundColor: '#fff',
                              padding: '0.5rem'
                            }}
                          >
                            {player.name} ({player.class}) - {player.health_current}/{player.health_max} HP
                          </option>
                        ))
                      ) : (
                        <option value="" disabled style={{ color: '#999' }}>No players in session</option>
                      )}
                    </select>
                    
                    {sessionPlayers.length === 0 && (
                      <button
                        onClick={addSamplePlayersToSession}
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.8rem',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: '2px solid #28a745',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          transition: 'all 0.2s ease',
                          minHeight: '40px'
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLButtonElement).style.backgroundColor = '#218838';
                          (e.target as HTMLButtonElement).style.borderColor = '#218838';
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLButtonElement).style.backgroundColor = '#28a745';
                          (e.target as HTMLButtonElement).style.borderColor = '#28a745';
                        }}
                      >
                        Add Players
                      </button>
                    )}
                  </div>
                  
                  <AttackButton
                    onClick={() => attackPlayer(enemy.encounter_id, 'specific', selectedPlayerId)}
                    disabled={attackingEnemy === enemy.encounter_id || !selectedPlayerId}
                    style={{ 
                      opacity: !selectedPlayerId ? 0.5 : 1,
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.4rem'
                    }}
                  >
                    🎯 Attack Selected Player
                  </AttackButton>
                </div>
                
                <Button
                  onClick={() => removeEnemyFromBattle(enemy.encounter_id)}
                  style={{ 
                    background: '#6c757d',
                    fontSize: '0.8rem',
                    padding: '0.25rem 0.5rem'
                  }}
                >
                  🚮 Remove
                </Button>
              </div>
            </ActiveEnemyCard>
          ))}
        </BattleSection>
      )}

      {/* Enemy Info Modal */}
      <Modal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title={selectedEnemy?.name || 'Enemy Info'}
      >
        {selectedEnemy && (
          <div style={{ padding: '1rem' }}>
            <div style={{ textAlign: 'center', fontSize: '4rem', marginBottom: '1rem' }}>
              {getEnemySprite(selectedEnemy.type)}
            </div>
            
            <h3 style={{ color: '#4ecdc4', marginBottom: '1rem', textAlign: 'center' }}>
              {selectedEnemy.name}
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>Description:</strong>
              <p style={{ marginTop: '0.5rem', lineHeight: '1.6' }}>
                {selectedEnemy.description}
              </p>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div><strong>Type:</strong> {selectedEnemy.type}</div>
              <div><strong>Level:</strong> {selectedEnemy.level}</div>
              <div><strong>Health:</strong> {selectedEnemy.health_max}</div>
              <div><strong>Mana:</strong> {selectedEnemy.mana_max}</div>
              <div><strong>Attack:</strong> {selectedEnemy.attack_power}</div>
              <div><strong>Defense:</strong> {selectedEnemy.defense}</div>
              <div><strong>Speed:</strong> {selectedEnemy.speed}</div>
              <div><strong>EXP Reward:</strong> {selectedEnemy.experience_reward}</div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Button onClick={() => setShowInfo(false)} style={{ marginRight: '1rem' }}>
                Close
              </Button>
              <Button 
                onClick={() => {
                  addEnemyToBattle(selectedEnemy.name);
                  setShowInfo(false);
                }}
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
              >
                Add to Battle
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </ManagerContainer>
  );
}
