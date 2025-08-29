import React from 'react';
import styled from 'styled-components';
import { DatabaseCharacter } from '@/lib/supabase';
import { BattleEncounter } from '@/components/types';

const BattleContainer = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: ${props => props.theme.spacing.lg};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.1)"/></svg>') repeat;
    opacity: 0.3;
    animation: twinkle 4s ease-in-out infinite;
  }

  @keyframes twinkle {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
  }
`;

const BattleHeader = styled.div`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xl};
  position: relative;
  z-index: 1;

  h1 {
    color: white;
    font-size: 2.5rem;
    font-weight: 900;
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
    margin-bottom: ${props => props.theme.spacing.md};

    &::before {
      content: '⚔️';
      margin-right: ${props => props.theme.spacing.md};
    }

    &::after {
      content: '🛡️';
      margin-left: ${props => props.theme.spacing.md};
    }
  }

  .turn-info {
    background: rgba(255, 255, 255, 0.2);
    border-radius: ${props => props.theme.borderRadius.pill};
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
    display: inline-block;
    color: white;
    font-weight: bold;
    font-size: 1.1rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
`;

const BattleField = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.xl};
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;

  @media (max-width: ${props => props.theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
    gap: ${props => props.theme.spacing.lg};
  }
`;

const PartySection = styled.div<{ $isPlayerSide?: boolean }>`
  background: ${props => props.$isPlayerSide 
    ? 'linear-gradient(145deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))'
    : 'linear-gradient(145deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))'
  };
  border: 2px solid ${props => props.$isPlayerSide 
    ? 'rgba(16, 185, 129, 0.4)'
    : 'rgba(239, 68, 68, 0.4)'
  };
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.xl};
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

const SectionHeader = styled.h2<{ $isPlayerSide?: boolean }>`
  color: ${props => props.$isPlayerSide ? '#10b981' : '#ef4444'};
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.lg};
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.md};

  &::before {
    content: ${props => props.$isPlayerSide ? "'👥'" : "'👹'"};
    font-size: 1.5rem;
  }
`;

const CharacterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${props => props.theme.spacing.md};
`;

const CharacterCard = styled.div<{ $isPlayer?: boolean; $isActive?: boolean; $isDead?: boolean }>`
  background: ${props => {
    if (props.$isDead) return 'linear-gradient(145deg, rgba(107, 114, 128, 0.3), rgba(75, 85, 99, 0.3))';
    if (props.$isActive) return 'linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))';
    return 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))';
  }};
  border: 2px solid ${props => {
    if (props.$isDead) return 'rgba(107, 114, 128, 0.5)';
    if (props.$isActive) return props.$isPlayer ? '#4ecdc4' : '#f59e0b';
    return 'rgba(255, 255, 255, 0.2)';
  }};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
    border-color: ${props => props.$isPlayer ? '#4ecdc4' : '#f59e0b'};
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => {
      if (props.$isDead) return 'linear-gradient(90deg, #6b7280, #4b5563)';
      if (props.$isActive) return props.$isPlayer 
        ? 'linear-gradient(90deg, #4ecdc4, #45b7d1)'
        : 'linear-gradient(90deg, #f59e0b, #d97706)';
      return 'transparent';
    }};
  }

  ${props => props.$isDead && `
    filter: grayscale(70%);
    opacity: 0.6;
  `}
`;

const CharacterHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.md};

  .name {
    font-size: 1.1rem;
    font-weight: bold;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .level {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    padding: 2px 8px;
    border-radius: ${props => props.theme.borderRadius.pill};
    font-size: 0.8rem;
    font-weight: bold;
  }
`;

const HealthBar = styled.div<{ $percentage: number; $isEnemy?: boolean }>`
  margin-bottom: ${props => props.theme.spacing.sm};

  .health-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    font-size: 0.9rem;
    font-weight: 600;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .health-bar {
    height: 12px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .health-fill {
    height: 100%;
    background: ${props => {
      if (props.$percentage > 60) return 'linear-gradient(90deg, #10b981, #059669)';
      if (props.$percentage > 30) return 'linear-gradient(90deg, #f59e0b, #d97706)';
      return 'linear-gradient(90deg, #ef4444, #dc2626)';
    }};
    width: ${props => props.$percentage}%;
    transition: width 0.5s ease;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      animation: healthShimmer 2s infinite;
    }

    @keyframes healthShimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  }
`;

// Removed ActionButtons and ActionButton - party is view-only

const StatusEffects = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  margin-top: ${props => props.theme.spacing.sm};
  flex-wrap: wrap;
`;

const StatusEffect = styled.div<{ $type: 'buff' | 'debuff' }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${props => props.$type === 'buff' 
    ? 'linear-gradient(135deg, #10b981, #059669)'
    : 'linear-gradient(135deg, #ef4444, #dc2626)'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.2);
  }
`;

const EnemySprite = styled.div`
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto ${props => props.theme.spacing.md} auto;
  border: 2px solid rgba(255, 255, 255, 0.3);
  animation: float 3s ease-in-out infinite;

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
`;

interface PokemonBattleProps {
  players: DatabaseCharacter[];
  enemies: BattleEncounter[];
  currentTurn: number;
  // Removed activeCharacterId and onPlayerAction - party is view-only
}

export default function PokemonBattle({ 
  players, 
  enemies, 
  currentTurn
}: PokemonBattleProps) {
  // Removed selectedAction state - no actions needed for party view

  const getHealthPercentage = (current: number, max: number) => 
    max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;

  const getEnemySprite = (enemyType: string) => {
    const sprites: Record<string, string> = {
      'goblin': '👹',
      'orc': '🦍',
      'elemental': '🔥',
      'undead': '💀',
      'dragon': '🐉',
      'default': '👾'
    };
    return sprites[enemyType] || sprites.default;
  };

  // Removed handlePlayerAction - party is view-only

  return (
    <BattleContainer>
      <BattleHeader>
        <h1>Current Battle</h1>
        <div className="turn-info">Turn {currentTurn}</div>
      </BattleHeader>

      <BattleField>
        {/* Player Party */}
        <PartySection $isPlayerSide>
          <SectionHeader $isPlayerSide>Your Party</SectionHeader>
          <CharacterGrid>
            {players.map(player => {
              const healthPercentage = getHealthPercentage(player.health_current, player.health_max);
              const manaPercentage = getHealthPercentage(player.mana_current, player.mana_max);
              const staminaPercentage = getHealthPercentage(player.stamina_current, player.stamina_max);
              const isDead = player.health_current <= 0;
              
              return (
                <CharacterCard 
                  key={player.id} 
                  $isPlayer 
                  $isDead={isDead}
                >
                  <CharacterHeader>
                    <div className="name">{player.name}</div>
                    <div className="level">Lv.{player.level}</div>
                  </CharacterHeader>

                  <HealthBar $percentage={healthPercentage}>
                    <div className="health-label">
                      <span>❤️ Health</span>
                      <span>{player.health_current}/{player.health_max}</span>
                    </div>
                    <div className="health-bar">
                      <div className="health-fill" />
                    </div>
                  </HealthBar>

                  <HealthBar $percentage={manaPercentage}>
                    <div className="health-label">
                      <span>💙 Mana</span>
                      <span>{player.mana_current}/{player.mana_max}</span>
                    </div>
                    <div className="health-bar">
                      <div className="health-fill" style={{
                        background: manaPercentage > 60 
                          ? 'linear-gradient(90deg, #3b82f6, #1d4ed8)'
                          : manaPercentage > 30 
                          ? 'linear-gradient(90deg, #6366f1, #4338ca)'
                          : 'linear-gradient(90deg, #8b5cf6, #7c3aed)'
                      }} />
                    </div>
                  </HealthBar>

                  <HealthBar $percentage={staminaPercentage}>
                    <div className="health-label">
                      <span>💚 Stamina</span>
                      <span>{player.stamina_current}/{player.stamina_max}</span>
                    </div>
                    <div className="health-bar">
                      <div className="health-fill" style={{
                        background: staminaPercentage > 60 
                          ? 'linear-gradient(90deg, #10b981, #059669)'
                          : staminaPercentage > 30 
                          ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                          : 'linear-gradient(90deg, #ef4444, #dc2626)'
                      }} />
                    </div>
                  </HealthBar>

                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginTop: '12px',
                    textAlign: 'center',
                    padding: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>{player.class}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span>⚡ AP: {player.action_points_current}/{player.action_points_max}</span>
                      <span>🛡️ Armor: {player.armor_current}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '2px' }}>
                      <span>✨ EXP: {player.experience}</span>
                      <span>🔮 MR: {player.magic_resist_current}</span>
                    </div>
                  </div>

                  <StatusEffects>
                    {/* Status effects can be added when we implement buff/debuff system */}
                    {player.action_points_current === 0 && (
                      <StatusEffect $type="debuff" title="No Action Points">😴</StatusEffect>
                    )}
                    {healthPercentage < 25 && (
                      <StatusEffect $type="debuff" title="Low Health">💔</StatusEffect>
                    )}
                    {player.mana_current === 0 && (
                      <StatusEffect $type="debuff" title="No Mana">🔵</StatusEffect>
                    )}
                  </StatusEffects>
                </CharacterCard>
              );
            })}
          </CharacterGrid>
        </PartySection>

        {/* Enemy Forces */}
        <PartySection>
          <SectionHeader>Enemy Forces</SectionHeader>
          <CharacterGrid>
            {enemies.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontStyle: 'italic'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😴</div>
                <div>No enemies in battle</div>
                <div style={{ fontSize: '0.9rem', opacity: '0.7', marginTop: '0.5rem' }}>
                  The battle arena is peaceful... for now
                </div>
              </div>
            ) : (
              enemies.map(enemy => {
                const healthPercentage = getHealthPercentage(
                  enemy.enemy_health_current, 
                  enemy.enemy_health_max || 100
                );
                const isDead = enemy.enemy_health_current <= 0;
                
                return (
                  <CharacterCard 
                    key={`encounter-${enemy.encounter_id}`} 
                    $isDead={isDead}
                  >
                    <EnemySprite>
                      {getEnemySprite(enemy.enemy_type || 'default')}
                    </EnemySprite>

                    <CharacterHeader>
                      <div className="name">{enemy.enemy_name}</div>
                      <div className="level">Lv.{enemy.enemy_level}</div>
                    </CharacterHeader>

                    <HealthBar $percentage={healthPercentage} $isEnemy>
                      <div className="health-label">
                        <span>💀 HP</span>
                        <span>{enemy.enemy_health_current}/{enemy.enemy_health_max}</span>
                      </div>
                      <div className="health-bar">
                        <div className="health-fill" />
                      </div>
                    </HealthBar>

                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: 'rgba(255, 255, 255, 0.8)',
                      textAlign: 'center',
                      marginTop: '8px'
                    }}>
                      {enemy.enemy_type} • ⚔️ {enemy.attack_power} ATK
                    </div>

                    <StatusEffects>
                      {/* Enemy status effects */}
                      {Math.random() > 0.6 && <StatusEffect $type="debuff">🔥</StatusEffect>}
                      {Math.random() > 0.8 && <StatusEffect $type="buff">💪</StatusEffect>}
                    </StatusEffects>
                  </CharacterCard>
                );
              })
            )}
          </CharacterGrid>
        </PartySection>
      </BattleField>
    </BattleContainer>
  );
}
