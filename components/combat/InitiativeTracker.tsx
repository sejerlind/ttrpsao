import React from 'react';
import styled from 'styled-components';
import { DatabaseCharacter } from '@/lib/supabase';

const TrackerContainer = styled.div`
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadows.card};
`;

const TrackerHeader = styled.h3`
  color: ${props => props.theme.colors.text.accent};
  font-size: 1.2rem;
  margin-bottom: ${props => props.theme.spacing.md};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  &::before {
    content: '⚡';
    font-size: 1.1rem;
  }
`;

const InitiativeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  max-height: 300px;
  overflow-y: auto;
`;

const InitiativeItem = styled.div<{ $isActive?: boolean; $hasTaken?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.md};
  background: ${props => {
    if (props.$isActive) return 'linear-gradient(135deg, rgba(78, 205, 196, 0.2), rgba(69, 183, 209, 0.2))';
    if (props.$hasTaken) return 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))';
    return 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))';
  }};
  border: 2px solid ${props => {
    if (props.$isActive) return props.theme.colors.accent.cyan;
    if (props.$hasTaken) return 'rgba(255, 255, 255, 0.1)';
    return 'rgba(255, 255, 255, 0.15)';
  }};
  border-radius: ${props => props.theme.borderRadius.medium};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${props => {
      if (props.$isActive) return 'linear-gradient(135deg, #4ecdc4, #45b7d1)';
      if (props.$hasTaken) return '#6b7280';
      return '#10b981';
    }};
  }

  &:hover {
    transform: translateX(4px);
    box-shadow: ${props => props.theme.shadows.card};
  }
`;

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 1.2rem;
  }

  .details {
    .name {
      font-weight: bold;
      color: ${props => props.theme.colors.text.primary};
      font-size: 0.95rem;
    }

    .class-level {
      font-size: 0.8rem;
      color: ${props => props.theme.colors.text.secondary};
      opacity: 0.8;
    }
  }
`;

const InitiativeValue = styled.div<{ $isActive?: boolean }>`
  background: ${props => props.$isActive 
    ? 'linear-gradient(135deg, #4ecdc4, #45b7d1)'
    : 'rgba(255, 255, 255, 0.1)'
  };
  color: ${props => props.$isActive ? 'white' : props.theme.colors.text.primary};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.pill};
  font-weight: bold;
  font-size: 0.9rem;
  min-width: 60px;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const StatusIndicators = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  margin-left: ${props => props.theme.spacing.sm};
`;

const StatusDot = styled.div<{ $type: 'ready' | 'acting' | 'done' | 'delayed' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    switch (props.$type) {
      case 'ready': return '#10b981';
      case 'acting': return '#f59e0b';
      case 'done': return '#6b7280';
      case 'delayed': return '#ef4444';
      default: return '#6b7280';
    }
  }};
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.5);
  }
`;

interface InitiativeEntry {
  character: DatabaseCharacter;
  isActive: boolean;
  canAct: boolean; // Based on action points
}

interface InitiativeTrackerProps {
  players: DatabaseCharacter[];
  currentTurn: number;
  onPlayerClick?: (player: DatabaseCharacter) => void;
}

export default function InitiativeTracker({ players, currentTurn, onPlayerClick }: InitiativeTrackerProps) {
  // Create initiative order based on real player data
  const generateInitiativeOrder = (): InitiativeEntry[] => {
    return players.map((player, index) => ({
      character: player,
      isActive: index === 0, // First player is active (could be enhanced with real turn tracking)
      canAct: player.action_points_current > 0 // Can act if they have action points
    })).sort((a, b) => {
      // Sort by: action points descending, then by level descending, then by name
      if (a.canAct !== b.canAct) return a.canAct ? -1 : 1;
      if (a.character.action_points_current !== b.character.action_points_current) {
        return b.character.action_points_current - a.character.action_points_current;
      }
      if (a.character.level !== b.character.level) {
        return b.character.level - a.character.level;
      }
      return a.character.name.localeCompare(b.character.name);
    });
  };

  const initiativeOrder = generateInitiativeOrder();

  const getPlayerInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <TrackerContainer>
      <TrackerHeader>Action Points - Turn {currentTurn}</TrackerHeader>
      <InitiativeList>
        {initiativeOrder.map((entry) => {
          const statusType = entry.canAct ? 'ready' : 'done';
          
          return (
            <InitiativeItem
              key={entry.character.id}
              $isActive={entry.isActive}
              $hasTaken={!entry.canAct}
              onClick={() => onPlayerClick?.(entry.character)}
              style={{ cursor: onPlayerClick ? 'pointer' : 'default' }}
            >
              <PlayerInfo>
                <div className="avatar">
                  {getPlayerInitials(entry.character.name)}
                </div>
                <div className="details">
                  <div className="name">{entry.character.name}</div>
                  <div className="class-level">
                    {entry.character.class} • Level {entry.character.level}
                  </div>
                </div>
                <StatusIndicators>
                  <StatusDot $type={statusType} title={entry.canAct ? 'Can Act' : 'No Action Points'} />
                </StatusIndicators>
              </PlayerInfo>
              <InitiativeValue $isActive={entry.isActive}>
                {entry.character.action_points_current}/{entry.character.action_points_max}
              </InitiativeValue>
            </InitiativeItem>
          );
        })}
      </InitiativeList>
    </TrackerContainer>
  );
}
