import React from 'react';
import styled from 'styled-components';
import { DatabaseCharacter } from '@/lib/supabase';

const PartyContainer = styled.div`
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadows.card};
`;

const PartyHeader = styled.h3`
  color: ${props => props.theme.colors.text.accent};
  font-size: 1.3rem;
  margin-bottom: ${props => props.theme.spacing.lg};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  &::before {
    content: '👥';
    font-size: 1.2rem;
  }
`;

const PartyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${props => props.theme.spacing.md};
`;

const CharacterCard = styled.div<{ $isDead?: boolean; $lowHealth?: boolean }>`
  background: ${props => {
    if (props.$isDead) return 'linear-gradient(145deg, rgba(107, 114, 128, 0.3), rgba(75, 85, 99, 0.3))';
    if (props.$lowHealth) return 'linear-gradient(145deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))';
    return 'linear-gradient(145deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))';
  }};
  border: 2px solid ${props => {
    if (props.$isDead) return 'rgba(107, 114, 128, 0.5)';
    if (props.$lowHealth) return 'rgba(239, 68, 68, 0.5)';
    return 'rgba(16, 185, 129, 0.4)';
  }};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.shadows.cardHover};
    border-color: ${props => props.theme.colors.accent.cyan};
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
      if (props.$lowHealth) return 'linear-gradient(90deg, #ef4444, #dc2626)';
      return 'linear-gradient(90deg, #10b981, #059669)';
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

  .character-info {
    .name {
      font-size: 1.2rem;
      font-weight: bold;
      color: ${props => props.theme.colors.text.primary};
      margin-bottom: 2px;
    }

    .class-level {
      font-size: 0.9rem;
      color: ${props => props.theme.colors.text.secondary};
      font-weight: 600;
    }
  }

  .experience-info {
    text-align: right;
    font-size: 0.8rem;
    color: ${props => props.theme.colors.text.muted};

    .exp-current {
      font-weight: bold;
      color: ${props => props.theme.colors.text.accent};
    }
  }
`;

const ResourceGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const ResourceBar = styled.div<{ $percentage: number; $type: 'health' | 'mana' | 'stamina' | 'ap' }>`
  .resource-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    color: ${props => props.theme.colors.text.primary};
  }

  .resource-bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .resource-fill {
    height: 100%;
    background: ${props => {
      switch (props.$type) {
        case 'health': 
          if (props.$percentage > 60) return 'linear-gradient(90deg, #10b981, #059669)';
          if (props.$percentage > 30) return 'linear-gradient(90deg, #f59e0b, #d97706)';
          return 'linear-gradient(90deg, #ef4444, #dc2626)';
        case 'mana': return 'linear-gradient(90deg, #3b82f6, #1d4ed8)';
        case 'stamina': return 'linear-gradient(90deg, #10b981, #059669)';
        case 'ap': return 'linear-gradient(90deg, #f59e0b, #d97706)';
        default: return '#6b7280';
      }
    }};
    width: ${props => props.$percentage}%;
    transition: width 0.5s ease;
    border-radius: 4px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.md};

  .stat-item {
    text-align: center;
    padding: ${props => props.theme.spacing.sm};
    background: rgba(255, 255, 255, 0.1);
    border-radius: ${props => props.theme.borderRadius.medium};
    border: 1px solid rgba(255, 255, 255, 0.2);

    .stat-icon {
      font-size: 1.2rem;
      margin-bottom: 2px;
    }

    .stat-value {
      font-weight: bold;
      color: ${props => props.theme.colors.text.primary};
      font-size: 0.9rem;
    }

    .stat-label {
      font-size: 0.7rem;
      color: ${props => props.theme.colors.text.muted};
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
`;

const StatusIndicators = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  margin-top: ${props => props.theme.spacing.sm};
  flex-wrap: wrap;
`;

const StatusBadge = styled.div<{ $type: 'warning' | 'danger' | 'info' }>`
  padding: 2px 6px;
  border-radius: ${props => props.theme.borderRadius.pill};
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => {
    switch (props.$type) {
      case 'warning': return 'linear-gradient(135deg, #f59e0b, #d97706)';
      case 'danger': return 'linear-gradient(135deg, #ef4444, #dc2626)';
      case 'info': return 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
      default: return '#6b7280';
    }
  }};
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

interface PartyViewerProps {
  players: DatabaseCharacter[];
}

export default function PartyViewer({ players }: PartyViewerProps) {
  const getHealthPercentage = (current: number, max: number) => 
    max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;

  return (
    <PartyContainer>
      <PartyHeader>Your Adventure Party</PartyHeader>
      
      {players.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#95a5a6',
          fontStyle: 'italic'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <div>No players in your party</div>
          <div style={{ fontSize: '0.9rem', opacity: '0.7', marginTop: '0.5rem' }}>
            Add players to the game session to see them here
          </div>
        </div>
      ) : (
        <PartyGrid>
          {players.map(player => {
            const healthPercentage = getHealthPercentage(player.health_current, player.health_max);
            const manaPercentage = getHealthPercentage(player.mana_current, player.mana_max);
            const staminaPercentage = getHealthPercentage(player.stamina_current, player.stamina_max);
            const apPercentage = getHealthPercentage(player.action_points_current, player.action_points_max);
            
            const isDead = player.health_current <= 0;
            const isLowHealth = healthPercentage < 25;
            
            return (
              <CharacterCard 
                key={player.id}
                $isDead={isDead}
                $lowHealth={isLowHealth}
              >
                <CharacterHeader>
                  <div className="character-info">
                    <div className="name">{player.name}</div>
                    <div className="class-level">{player.class} • Level {player.level}</div>
                  </div>
                  <div className="experience-info">
                    <div className="exp-current">{player.experience} EXP</div>
                    <div>Next: {player.experience_to_next}</div>
                  </div>
                </CharacterHeader>

                <ResourceGrid>
                  <ResourceBar $percentage={healthPercentage} $type="health">
                    <div className="resource-label">
                      <span>❤️ Health</span>
                      <span>{player.health_current}/{player.health_max}</span>
                    </div>
                    <div className="resource-bar">
                      <div className="resource-fill" />
                    </div>
                  </ResourceBar>

                  <ResourceBar $percentage={manaPercentage} $type="mana">
                    <div className="resource-label">
                      <span>💙 Mana</span>
                      <span>{player.mana_current}/{player.mana_max}</span>
                    </div>
                    <div className="resource-bar">
                      <div className="resource-fill" />
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'rgba(255, 255, 255, 0.6)', 
                      textAlign: 'center', 
                      marginTop: '2px',
                      fontStyle: 'italic'
                    }}>
                      +{player.mana_regen || 10}/turn
                    </div>
                  </ResourceBar>

                  <ResourceBar $percentage={staminaPercentage} $type="stamina">
                    <div className="resource-label">
                      <span>💚 Stamina</span>
                      <span>{player.stamina_current}/{player.stamina_max}</span>
                    </div>
                    <div className="resource-bar">
                      <div className="resource-fill" />
                    </div>
                  </ResourceBar>

                  <ResourceBar $percentage={apPercentage} $type="ap">
                    <div className="resource-label">
                      <span>⚡ Action Points</span>
                      <span>{player.action_points_current}/{player.action_points_max}</span>
                    </div>
                    <div className="resource-bar">
                      <div className="resource-fill" />
                    </div>
                  </ResourceBar>
                </ResourceGrid>

                <StatsGrid>
                  <div className="stat-item">
                    <div className="stat-icon">🛡️</div>
                    <div className="stat-value">{player.armor_current}</div>
                    <div className="stat-label">Armor</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">🔮</div>
                    <div className="stat-value">{player.magic_resist_current}</div>
                    <div className="stat-label">Magic Resist</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">📈</div>
                    <div className="stat-value">{player.level}</div>
                    <div className="stat-label">Level</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-value">{Math.floor(player.experience / 100)}</div>
                    <div className="stat-label">Progress</div>
                  </div>
                </StatsGrid>

                <StatusIndicators>
                  {isDead && (
                    <StatusBadge $type="danger">💀 Dead</StatusBadge>
                  )}
                  {isLowHealth && !isDead && (
                    <StatusBadge $type="warning">⚠️ Low Health</StatusBadge>
                  )}
                  {player.action_points_current === 0 && !isDead && (
                    <StatusBadge $type="info">😴 No AP</StatusBadge>
                  )}
                  {player.mana_current === 0 && !isDead && (
                    <StatusBadge $type="info">🔵 No Mana</StatusBadge>
                  )}
                </StatusIndicators>
              </CharacterCard>
            );
          })}
        </PartyGrid>
      )}
    </PartyContainer>
  );
}
