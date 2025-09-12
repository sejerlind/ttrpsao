import React from 'react';
import styled from 'styled-components';
import { AbilityUsageLog } from '@/components/types';

const LogContainer = styled.div`
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadows.card};
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const LogHeader = styled.h3`
  color: ${props => props.theme.colors.text.accent};
  font-size: 1.2rem;
  margin-bottom: ${props => props.theme.spacing.md};
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .title {
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.sm};

    &::before {
      content: '📜';
      font-size: 1.1rem;
    }
  }

  .count {
    background: ${props => props.theme.colors.accent.cyan};
    color: white;
    padding: 2px 8px;
    border-radius: ${props => props.theme.borderRadius.pill};
    font-size: 0.8rem;
    font-weight: bold;
  }
`;

const LogContent = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 400px);
  padding-right: ${props => props.theme.spacing.sm};

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.accent.cyan};
    border-radius: 3px;
  }
`;

const LogEntry = styled.div<{ $type?: 'damage' | 'heal' | 'buff' | 'debuff' | 'action' }>`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 4px solid ${props => {
    switch (props.$type) {
      case 'damage': return '#ef4444';
      case 'heal': return '#10b981';
      case 'buff': return '#3b82f6';
      case 'debuff': return '#8b5cf6';
      default: return '#6b7280';
    }
  }};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.sm};
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
    transform: translateX(4px);
    border-color: ${props => props.theme.colors.accent.cyan};
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 0;
    background: ${props => props.theme.colors.accent.cyan};
    transition: width 0.3s ease;
    opacity: 0.1;
  }

  &:hover::before {
    width: 100%;
  }
`;

const LogHeader2 = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xs};
  position: relative;
  z-index: 1;

  .player-name {
    font-weight: bold;
    color: ${props => props.theme.colors.text.primary};
    font-size: 0.9rem;
  }

  .timestamp {
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.xs};
    font-size: 0.75rem;
    color: ${props => props.theme.colors.text.muted};
  }

  .turn-badge {
    background: ${props => props.theme.colors.accent.cyan};
    color: white;
    padding: 1px 6px;
    border-radius: ${props => props.theme.borderRadius.pill};
    font-size: 0.7rem;
    font-weight: bold;
  }
`;

const ActionDetails = styled.div`
  position: relative;
  z-index: 1;

  .ability-name {
    color: ${props => props.theme.colors.text.accent};
    font-weight: 600;
    font-size: 0.85rem;
    margin-bottom: 2px;
  }

  .effect-description {
    color: ${props => props.theme.colors.text.secondary};
    font-size: 0.8rem;
    line-height: 1.4;
  }

  .damage-numbers {
    display: flex;
    gap: ${props => props.theme.spacing.sm};
    margin-top: ${props => props.theme.spacing.xs};
    flex-wrap: wrap;
  }
`;

const DamageChip = styled.span<{ $type: 'damage' | 'heal' | 'mana' }>`
  background: ${props => {
    switch (props.$type) {
      case 'damage': return 'linear-gradient(135deg, #ef4444, #dc2626)';
      case 'heal': return 'linear-gradient(135deg, #10b981, #059669)';
      case 'mana': return 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
      default: return '#6b7280';
    }
  }};
  color: white;
  padding: 2px 8px;
  border-radius: ${props => props.theme.borderRadius.pill};
  font-size: 0.7rem;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: ${props => props.theme.colors.text.muted};
  text-align: center;

  .icon {
    font-size: 3rem;
    margin-bottom: ${props => props.theme.spacing.md};
    opacity: 0.5;
  }

  .message {
    font-size: 1.1rem;
    margin-bottom: ${props => props.theme.spacing.sm};
    font-weight: 600;
  }

  .submessage {
    font-size: 0.9rem;
    opacity: 0.7;
  }
`;

interface BattleLogProps {
  actions: AbilityUsageLog[];
  maxEntries?: number;
}

export default function BattleLog({ actions, maxEntries = 50 }: BattleLogProps) {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionType = (action: AbilityUsageLog): 'damage' | 'heal' | 'buff' | 'debuff' | 'action' => {
    if (action.damage_dealt) return 'damage';
    if (action.effect_description?.toLowerCase().includes('heal')) return 'heal';
    if (action.effect_description?.toLowerCase().includes('buff')) return 'buff';
    if (action.effect_description?.toLowerCase().includes('debuff') || 
        action.effect_description?.toLowerCase().includes('poison') ||
        action.effect_description?.toLowerCase().includes('curse')) return 'debuff';
    return 'action';
  };

  const recentActions = actions.slice(0, maxEntries);

  if (recentActions.length === 0) {
    return (
      <LogContainer>
        <LogHeader>
          <span className="title">Battle Log</span>
          <span className="count">0</span>
        </LogHeader>
        <EmptyState>
          <div className="icon">⚔️</div>
          <div className="message">No Combat Actions Yet</div>
          <div className="submessage">
            Actions taken by players will appear here in real-time
          </div>
        </EmptyState>
      </LogContainer>
    );
  }

  return (
    <LogContainer>
      <LogHeader>
        <span className="title">Battle Log</span>
        <span className="count">{recentActions.length}</span>
      </LogHeader>
      <LogContent>
        {recentActions.map((action) => (
          <LogEntry key={action.id} $type={getActionType(action)}>
            <LogHeader2>
              <span className="player-name">{action.character_name || 'Unknown Player'}</span>
              <div className="timestamp">
                <span className="turn-badge">T{action.turn_used || '?'}</span>
                <span>{formatTimestamp(action.used_at)}</span>
              </div>
            </LogHeader2>
            <ActionDetails>
              <div className="ability-name">{action.ability_name || 'Unknown Ability'}</div>
              {action.effect_description && (
                <div className="effect-description">{action.effect_description}</div>
              )}
              <div className="damage-numbers">
                {action.damage_dealt && (
                  <DamageChip $type="damage">
                    {action.damage_dealt} DMG
                  </DamageChip>
                )}
                {action.mana_cost_paid > 0 && (
                  <DamageChip $type="mana">
                    -{action.mana_cost_paid} MP
                  </DamageChip>
                )}
                {action.action_points_used > 0 && (
                  <DamageChip $type="damage">
                    -{action.action_points_used} AP
                  </DamageChip>
                )}
              </div>
            </ActionDetails>
          </LogEntry>
        ))}
      </LogContent>
    </LogContainer>
  );
}
