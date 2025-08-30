import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { DatabaseCharacter, supabase } from '@/lib/supabase';
import { BattleEncounter, Ability, FloatingTextItem } from '@/components/types';
import Button from '@/components/ui/Button';
import FloatingText from '@/components/common/FloatingText';

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

const CharacterCard = styled.div<{ $isPlayer?: boolean; $isActive?: boolean; $isDead?: boolean; $isCurrentPlayer?: boolean }>`
  background: ${props => {
    if (props.$isDead) return 'linear-gradient(145deg, rgba(107, 114, 128, 0.3), rgba(75, 85, 99, 0.3))';
    if (props.$isCurrentPlayer) return 'linear-gradient(145deg, rgba(78, 205, 196, 0.4), rgba(69, 183, 209, 0.3))';
    if (props.$isActive) return 'linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))';
    return 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))';
  }};
  border: 2px solid ${props => {
    if (props.$isDead) return 'rgba(107, 114, 128, 0.5)';
    if (props.$isCurrentPlayer) return '#4ecdc4';
    if (props.$isActive) return props.$isPlayer ? '#4ecdc4' : '#f59e0b';
    return 'rgba(255, 255, 255, 0.2)';
  }};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  ${props => props.$isCurrentPlayer && `
    box-shadow: 0 0 20px rgba(78, 205, 196, 0.5);
  `}

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.$isCurrentPlayer 
      ? '0 12px 40px rgba(78, 205, 196, 0.6)' 
      : '0 12px 40px rgba(0, 0, 0, 0.4)'};
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
      if (props.$isCurrentPlayer) return 'linear-gradient(90deg, #4ecdc4, #45b7d1)';
      if (props.$isActive) return props.$isPlayer 
        ? 'linear-gradient(90deg, #4ecdc4, #45b7d1)'
        : 'linear-gradient(90deg, #f59e0b, #d97706)';
      return 'transparent';
    }};
  }

  ${props => props.$isCurrentPlayer && `
    &::after {
      content: '👤 YOU';
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(78, 205, 196, 0.9);
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: bold;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
  `}

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

const ActionPanel = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  min-width: 400px;
  max-width: 90vw;
`;

const ActionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
  
  .character-info {
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.sm};
    
    .name {
      font-weight: bold;
      color: ${props => props.theme.colors.text.primary};
    }
    
    .ap {
      background: ${props => props.theme.colors.accent.cyan};
      color: white;
      padding: 2px 8px;
      border-radius: ${props => props.theme.borderRadius.pill};
      font-size: 0.8rem;
      font-weight: bold;
    }
  }
`;

const AbilitiesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const AbilityButton = styled.button<{ $disabled?: boolean; $onCooldown?: boolean }>`
  background: ${props => {
    if (props.$disabled) return 'rgba(107, 114, 128, 0.3)';
    if (props.$onCooldown) return 'rgba(239, 68, 68, 0.3)';
    return props.theme.gradients.accent;
  }};
  border: 2px solid ${props => {
    if (props.$disabled) return 'rgba(107, 114, 128, 0.5)';
    if (props.$onCooldown) return 'rgba(239, 68, 68, 0.5)';
    return props.theme.colors.accent.cyan;
  }};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.sm};
  color: ${props => props.$disabled ? '#9ca3af' : props.theme.colors.text.primary};
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(76, 217, 200, 0.4);
  }
  
  .ability-name {
    font-weight: bold;
    font-size: 0.8rem;
    margin-bottom: 2px;
  }
  
  .ability-cost {
    font-size: 0.7rem;
    opacity: 0.8;
  }
  
  .cooldown-overlay {
    position: absolute;
    top: 0;
    right: 0;
    background: rgba(239, 68, 68, 0.9);
    color: white;
    padding: 1px 4px;
    border-radius: 0 ${props => props.theme.borderRadius.medium} 0 4px;
    font-size: 0.6rem;
    font-weight: bold;
  }
`;

const TargetSelection = styled.div`
  margin-top: ${props => props.theme.spacing.md};
  
  .target-label {
    font-weight: bold;
    margin-bottom: ${props => props.theme.spacing.sm};
    color: ${props => props.theme.colors.text.primary};
  }
  
  .targets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: ${props => props.theme.spacing.sm};
  }
`;

const TargetButton = styled.button<{ $selected?: boolean }>`
  background: ${props => props.$selected 
    ? props.theme.colors.accent.cyan 
    : 'rgba(255, 255, 255, 0.1)'};
  border: 2px solid ${props => props.$selected 
    ? 'transparent' 
    : 'rgba(255, 255, 255, 0.3)'};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.sm};
  color: ${props => props.$selected ? 'white' : props.theme.colors.text.secondary};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.accent.cyan};
    background: ${props => props.$selected 
      ? props.theme.colors.accent.cyan 
      : 'rgba(76, 217, 200, 0.2)'};
  }
  
  .target-name {
    font-weight: bold;
    font-size: 0.8rem;
  }
  
  .target-hp {
    font-size: 0.7rem;
    opacity: 0.8;
  }
`;

const PlayerStatsPanel = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 320px;
  background: ${props => props.theme.gradients.card};
  border: 2px solid ${props => props.theme.colors.accent.cyan};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  z-index: 999;
  backdrop-filter: blur(10px);
  max-height: 70vh;
  overflow-y: auto;

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    position: relative;
    width: 100%;
    margin-top: ${props => props.theme.spacing.lg};
    bottom: auto;
    right: auto;
    max-height: none;
  }
`;

const PlayerActionsPanel = styled.div`
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 400px;
  background: ${props => props.theme.gradients.card};
  border: 2px solid ${props => props.theme.colors.accent.purple};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  z-index: 999;
  backdrop-filter: blur(10px);
  max-height: 70vh;
  overflow-y: auto;

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    position: relative;
    width: 100%;
    margin-top: ${props => props.theme.spacing.lg};
    bottom: auto;
    left: auto;
    max-height: none;
  }
`;

const ActionsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.md};
  padding-bottom: ${props => props.theme.spacing.sm};
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);

  .title {
    font-weight: bold;
    color: ${props => props.theme.colors.text.primary};
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.sm};
  }

  .ap-info {
    background: rgba(255, 255, 255, 0.1);
    color: ${props => props.theme.colors.text.primary};
    padding: 4px 12px;
    border-radius: ${props => props.theme.borderRadius.pill};
    font-size: 0.8rem;
    font-weight: bold;
  }
`;

const QuickActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const QuickActionButton = styled.button<{ $disabled?: boolean; $onCooldown?: boolean }>`
  background: ${props => {
    if (props.$disabled) return 'rgba(107, 114, 128, 0.3)';
    if (props.$onCooldown) return 'rgba(239, 68, 68, 0.3)';
    return 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
  }};
  border: 2px solid ${props => {
    if (props.$disabled) return 'rgba(107, 114, 128, 0.5)';
    if (props.$onCooldown) return 'rgba(239, 68, 68, 0.5)';
    return '#8b5cf6';
  }};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.sm};
  color: ${props => props.$disabled ? '#9ca3af' : 'white'};
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  }
  
  .ability-name {
    font-weight: bold;
    font-size: 0.8rem;
    margin-bottom: 2px;
  }
  
  .ability-info {
    font-size: 0.7rem;
    opacity: 0.8;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .cooldown-overlay {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(239, 68, 68, 0.9);
    color: white;
    padding: 1px 6px;
    border-radius: ${props => props.theme.borderRadius.small};
    font-size: 0.6rem;
    font-weight: bold;
  }
`;

const PlayerStatsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.md};
  padding-bottom: ${props => props.theme.spacing.sm};
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);

  .player-info {
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.sm};

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: ${props => props.theme.colors.accent.cyan};
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
    }

    .details {
      .name {
        font-weight: bold;
        color: ${props => props.theme.colors.text.primary};
        font-size: 0.9rem;
      }
      .class {
        color: ${props => props.theme.colors.text.secondary};
        font-size: 0.8rem;
      }
    }
  }

  .toggle {
    background: none;
    border: none;
    color: ${props => props.theme.colors.text.secondary};
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: ${props => props.theme.colors.text.primary};
    }
  }
`;

const DetailedStats = styled.div`
  display: grid;
  gap: ${props => props.theme.spacing.sm};

  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${props => props.theme.spacing.xs} 0;

    .stat-label {
      color: ${props => props.theme.colors.text.secondary};
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .stat-value {
      color: ${props => props.theme.colors.text.primary};
      font-weight: bold;
      font-size: 0.8rem;
    }
  }

  .combat-stats {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: ${props => props.theme.spacing.sm};
    margin-top: ${props => props.theme.spacing.sm};
  }
`;

interface PokemonBattleProps {
  players: DatabaseCharacter[];
  enemies: BattleEncounter[];
  currentTurn: number;
  gameSessionId?: string;
  currentPlayerId?: string; // ID of the player viewing this battle
  onPlayerAction?: (action: {
    type: string;
    characterId: string;
    abilityId: string;
    target: string | null;
    turn: number;
  }) => void;
}

export default function PokemonBattle({ 
  players, 
  enemies, 
  currentTurn,
  gameSessionId,
  currentPlayerId,
  onPlayerAction
}: PokemonBattleProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<DatabaseCharacter | null>(null);
  const [characterAbilities, setCharacterAbilities] = useState<Ability[]>([]);
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [showPlayerStats, setShowPlayerStats] = useState(currentPlayerId ? true : false);
  const [showPlayerActions, setShowPlayerActions] = useState(currentPlayerId ? true : false);

  // Get current player data
  const currentPlayer = currentPlayerId ? players.find(p => p.id === currentPlayerId) : null;

  // Debug logging
  useEffect(() => {
    console.log('🎯 PokemonBattle - Players received:', players.length, players.map(p => p.name));
    console.log('🎯 PokemonBattle - Current player ID:', currentPlayerId);
    console.log('🎯 PokemonBattle - Current player found:', currentPlayer?.name);
  }, [players, currentPlayerId, currentPlayer]);

  // Auto-remove floating texts after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setFloatingTexts([]);
    }, 2500); // Clear after animation completes

    return () => clearTimeout(timer);
  }, [floatingTexts]);

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

  // Get meaningful status effects for enemies based on their actual condition
  const getEnemyStatusEffects = (enemy: BattleEncounter, healthPercentage: number, isDead: boolean) => {
    const effects: Array<{ icon: string; type: 'buff' | 'debuff'; title: string }> = [];

    if (isDead) {
      effects.push({ icon: '💀', type: 'debuff', title: 'Defeated' });
      return effects;
    }

    // Health-based status effects
    if (healthPercentage <= 25) {
      effects.push({ icon: '💔', type: 'debuff', title: 'Critical Health' });
    } else if (healthPercentage <= 50) {
      effects.push({ icon: '🩸', type: 'debuff', title: 'Wounded' });
    }

    // Enemy type/rank status effects
    if (enemy.enemy_type === 'boss') {
      effects.push({ icon: '👑', type: 'buff', title: 'Boss' });
    } else if (enemy.enemy_type === 'dragon') {
      effects.push({ icon: '🐲', type: 'buff', title: 'Dragon' });
    } else if (enemy.enemy_level && enemy.enemy_level >= 10) {
      effects.push({ icon: '⭐', type: 'buff', title: 'Elite Enemy' });
    }

    // Combat stats status effects
    if (enemy.attack_power && enemy.attack_power >= 20) {
      effects.push({ icon: '⚔️', type: 'buff', title: 'High Attack' });
    }

    if (enemy.defense && enemy.defense >= 15) {
      effects.push({ icon: '🛡️', type: 'buff', title: 'Heavily Armored' });
    }

    if (enemy.speed && enemy.speed >= 15) {
      effects.push({ icon: '💨', type: 'buff', title: 'Fast' });
    }

    return effects;
  };

  // Load character abilities when a character is selected
  const loadCharacterAbilities = async () => {
    if (!supabase) return;

    try {
      const { data: abilities, error } = await supabase
        .from('Abilities')
        .select('*')
        .order('category', { ascending: true });

      if (!error && abilities) {
        // Convert database abilities to frontend format
        const convertedAbilities: Ability[] = abilities.map(ability => ({
          id: ability.id,
          name: ability.name,
          description: ability.description,
          category: ability.category as 'basic' | 'skill' | 'ultimate',
          cooldownMax: ability.cooldown_max,
          currentCooldown: ability.current_cooldown || 0,
          damage: ability.damage,
          manaCost: ability.mana_cost,
          effects: ability.effects
        }));
        setCharacterAbilities(convertedAbilities);
      }
    } catch (error) {
      console.error('Error loading abilities:', error);
    }
  };

  // Load abilities for current player when they are available
  useEffect(() => {
    if (currentPlayer && currentPlayerId && characterAbilities.length === 0) {
      loadCharacterAbilities();
    }
  }, [currentPlayer, currentPlayerId, characterAbilities.length]);

  // Handle quick ability use
  const handleQuickAbilityUse = async (ability: Ability) => {
    if (!currentPlayer || !canUseAbility(ability, currentPlayer)) return;
    
    setSelectedCharacter(currentPlayer);
    setSelectedAbility(ability);
    
    // Auto-select first available target based on ability type
    const targets = getAvailableTargets();
    if (targets.length > 0) {
      // For damage abilities, prefer enemies; for heal abilities, prefer players
      const isHealingAbility = ability.effects?.some(e => e.toLowerCase().includes('heal'));
      const preferredTargets = targets.filter(t => 
        isHealingAbility ? t.type === 'player' : t.type === 'enemy'
      );
      const targetToSelect = preferredTargets.length > 0 ? preferredTargets[0] : targets[0];
      setSelectedTarget(targetToSelect.id);
      
      // Auto-execute if we have a clear target
      setTimeout(() => {
        executeAction();
      }, 100);
    }
  };

  // Handle character selection for actions
  const handleCharacterSelect = (character: DatabaseCharacter) => {
    if (character.action_points_current <= 0) {
      // Show floating text for no action points
      const floatingText: FloatingTextItem = {
        id: Date.now().toString(),
        text: 'No Action Points!',
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        type: 'error'
      };
      setFloatingTexts(prev => [...prev, floatingText]);
      return;
    }

    setSelectedCharacter(character);
    setShowActionPanel(true);
    loadCharacterAbilities();
    setSelectedAbility(null);
    setSelectedTarget(null);
  };

  // Check if ability can be used
  const canUseAbility = (ability: Ability, character: DatabaseCharacter) => {
    return ability.currentCooldown === 0 &&
           character.action_points_current > 0 &&
           character.mana_current >= (ability.manaCost || 0);
  };

  // Handle ability selection
  const handleAbilitySelect = (ability: Ability) => {
    if (!selectedCharacter || !canUseAbility(ability, selectedCharacter)) return;
    
    setSelectedAbility(ability);
    setSelectedTarget(null);
  };

  // Calculate damage from ability string (e.g., "2d6+3" or "15")
  const calculateDamage = (damageString: string): number => {
    if (!damageString) return 0;
    
    // Handle simple number (e.g., "15")
    const simpleNumber = parseInt(damageString);
    if (!isNaN(simpleNumber)) {
      return simpleNumber;
    }
    
    // Handle dice notation (e.g., "2d6+3")
    const diceMatch = damageString.match(/(\d+)d(\d+)(?:\+(\d+))?/);
    if (diceMatch) {
      const [, numDice, diceSize, bonus] = diceMatch;
      let total = 0;
      
      // Roll dice
      for (let i = 0; i < parseInt(numDice); i++) {
        total += Math.floor(Math.random() * parseInt(diceSize)) + 1;
      }
      
      // Add bonus
      if (bonus) {
        total += parseInt(bonus);
      }
      
      return total;
    }
    
    // Fallback to 0 if can't parse
    return 0;
  };

  // Execute combat action
  const executeAction = async () => {
    if (!selectedCharacter || !selectedAbility || !selectedTarget || !gameSessionId || !supabase) return;

    setIsExecutingAction(true);

    try {
      // Calculate actual damage
      const actualDamage = selectedAbility.damage ? calculateDamage(selectedAbility.damage) : 0;
      
      // Determine target type and apply damage
      let targetDescription = '';
      let effectDescription = '';
      
      if (selectedTarget.startsWith('enemy_')) {
        const encounterId = selectedTarget.replace('enemy_', '');
        const targetEnemy = enemies.find(e => e.encounter_id === encounterId);
        
        if (targetEnemy && actualDamage > 0) {
          // Apply damage to enemy
          const newHealth = Math.max(0, targetEnemy.enemy_health_current - actualDamage);
          
          const { error: enemyUpdateError } = await supabase
            .from('battle_encounters')
            .update({
              enemy_health_current: newHealth,
              updated_at: new Date().toISOString()
            })
            .eq('id', encounterId);

          if (enemyUpdateError) {
            console.error('Error updating enemy health:', enemyUpdateError);
          } else {
            console.log(`✅ Dealt ${actualDamage} damage to ${targetEnemy.enemy_name}. HP: ${newHealth}/${targetEnemy.enemy_health_max}`);
          }
          
          targetDescription = `${targetEnemy.enemy_name || 'Enemy'}`;
          effectDescription = `Dealt ${actualDamage} damage to ${targetEnemy.enemy_name}`;
          
          // Check if enemy died
          if (newHealth <= 0) {
            effectDescription += ' (DEFEATED!)';
            
            // Mark enemy as inactive
            await supabase
              .from('battle_encounters')
              .update({ is_active: false })
              .eq('id', encounterId);
          }
        } else {
          targetDescription = targetEnemy?.enemy_name || 'Enemy';
          effectDescription = selectedAbility.effects?.[0] || 'Effect applied';
        }
      } else if (selectedTarget.startsWith('player_')) {
        const playerId = selectedTarget.replace('player_', '');
        const targetPlayer = players.find(p => p.id === playerId);
        
        if (targetPlayer) {
          targetDescription = targetPlayer.name;
          
          // For healing abilities, apply healing
          if (selectedAbility.effects?.some(e => e.toLowerCase().includes('heal')) && actualDamage > 0) {
            const newHealth = Math.min(targetPlayer.health_max, targetPlayer.health_current + actualDamage);
            
            const { error: healError } = await supabase
              .from('characters')
              .update({
                health_current: newHealth,
                updated_at: new Date().toISOString()
              })
              .eq('id', playerId);

            if (!healError) {
              effectDescription = `Healed ${targetPlayer.name} for ${actualDamage} HP`;
            }
          } else {
            effectDescription = selectedAbility.effects?.[0] || 'Effect applied';
          }
        }
      }

      // Log the ability usage
      const { error: logError } = await supabase
        .from('ability_usage_log')
        .insert({
          game_session_id: gameSessionId,
          character_id: selectedCharacter.id,
          ability_id: selectedAbility.id,
          effect_description: effectDescription,
          damage_dealt: actualDamage > 0 ? actualDamage.toString() : null,
          mana_cost_paid: selectedAbility.manaCost || 0,
          action_points_used: 1,
          turn_used: currentTurn,
          target_description: targetDescription,
          notes: null
        });

      if (logError) {
        console.error('Error logging ability usage:', logError);
      }

      // Update character resources
      const { error: updateError } = await supabase
        .from('characters')
        .update({
          action_points_current: Math.max(0, selectedCharacter.action_points_current - 1),
          mana_current: Math.max(0, selectedCharacter.mana_current - (selectedAbility.manaCost || 0))
        })
        .eq('id', selectedCharacter.id);

      if (updateError) {
        console.error('Error updating character:', updateError);
      }

      // Show success floating text
      const floatingText: FloatingTextItem = {
        id: Date.now().toString(),
        text: actualDamage > 0 ? `${actualDamage} DMG` : effectDescription || 'Used!',
        x: window.innerWidth / 2,
        y: window.innerHeight / 2 - 50,
        type: actualDamage > 0 ? 'damage' : 'effect'
      };
      setFloatingTexts(prev => [...prev, floatingText]);

      // Notify parent component
      if (onPlayerAction) {
        onPlayerAction({
          type: 'ability_used',
          characterId: selectedCharacter.id,
          abilityId: selectedAbility.id,
          target: selectedTarget,
          turn: currentTurn
        });
      }

      // Close action panel
      setShowActionPanel(false);
      setSelectedCharacter(null);
      setSelectedAbility(null);
      setSelectedTarget(null);

    } catch (error) {
      console.error('Error executing action:', error);
      // Show error floating text
      const floatingText: FloatingTextItem = {
        id: Date.now().toString(),
        text: 'Action Failed!',
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        type: 'error'
      };
      setFloatingTexts(prev => [...prev, floatingText]);
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Get available targets for ability
  const getAvailableTargets = (): Array<{
    id: string;
    name: string;
    type: string;
    health: string;
  }> => {
    const targets: Array<{
      id: string;
      name: string;
      type: string;
      health: string;
    }> = [];
    
    // Add enemies as targets
    enemies.forEach(enemy => {
      if (enemy.enemy_health_current > 0) {
        targets.push({
          id: `enemy_${enemy.encounter_id}`,
          name: enemy.enemy_name || 'Unknown Enemy',
          type: 'enemy',
          health: `${enemy.enemy_health_current}/${enemy.enemy_health_max || 100}`
        });
      }
    });

    // Add players as targets (for healing abilities)
    players.forEach(player => {
      targets.push({
        id: `player_${player.id}`,
        name: player.name,
        type: 'player',
        health: `${player.health_current}/${player.health_max}`
      });
    });

    return targets;
  };

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
              const isCurrentPlayer = currentPlayerId === player.id;
              
              return (
                <CharacterCard 
                  key={player.id} 
                  $isPlayer 
                  $isDead={isDead}
                  $isCurrentPlayer={isCurrentPlayer}
                  onClick={() => !isDead && handleCharacterSelect(player)}
                  style={{ cursor: !isDead ? 'pointer' : 'default' }}
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
                      {/* Enemy status effects based on actual conditions */}
                      {getEnemyStatusEffects(enemy, healthPercentage, isDead).map((effect, index) => (
                        <StatusEffect 
                          key={`${enemy.encounter_id}-${effect.title}-${index}`}
                          $type={effect.type} 
                          title={effect.title}
                        >
                          {effect.icon}
                        </StatusEffect>
                      ))}
                    </StatusEffects>
                  </CharacterCard>
                );
              })
            )}
          </CharacterGrid>
        </PartySection>
      </BattleField>

      {/* Action Panel */}
      {showActionPanel && selectedCharacter && (
        <ActionPanel>
          <ActionHeader>
            <div className="character-info">
              <span className="name">{selectedCharacter.name}</span>
              <span className="ap">{selectedCharacter.action_points_current} AP</span>
            </div>
            <Button onClick={() => setShowActionPanel(false)}>Close</Button>
          </ActionHeader>

          <AbilitiesGrid>
            {characterAbilities.map(ability => {
              const disabled = !canUseAbility(ability, selectedCharacter);
              const onCooldown = ability.currentCooldown > 0;
              
              return (
                <AbilityButton
                  key={ability.id}
                  $disabled={disabled}
                  $onCooldown={onCooldown}
                  onClick={() => handleAbilitySelect(ability)}
                  disabled={disabled}
                >
                  <div className="ability-name">{ability.name}</div>
                  <div className="ability-cost">
                    {ability.manaCost ? `${ability.manaCost} MP` : 'No Cost'}
                  </div>
                  {onCooldown && (
                    <div className="cooldown-overlay">{ability.currentCooldown}</div>
                  )}
                </AbilityButton>
              );
            })}
          </AbilitiesGrid>

          {selectedAbility && (
            <TargetSelection>
              <div className="target-label">Select Target:</div>
              <div className="targets-grid">
                {getAvailableTargets().map(target => (
                  <TargetButton
                    key={target.id}
                    $selected={selectedTarget === target.id}
                    onClick={() => setSelectedTarget(target.id)}
                  >
                    <div className="target-name">{target.name}</div>
                    <div className="target-hp">{target.health}</div>
                  </TargetButton>
                ))}
              </div>
              
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <Button 
                  $primary 
                  onClick={executeAction}
                  disabled={!selectedTarget || isExecutingAction}
                >
                  {isExecutingAction ? 'Executing...' : `Use ${selectedAbility.name}`}
                </Button>
              </div>
            </TargetSelection>
          )}
        </ActionPanel>
      )}

      {/* Player Actions Panel - only show if currentPlayerId is provided */}
      {currentPlayer && (
        <PlayerActionsPanel>
          <ActionsHeader>
            <div className="title">
              ⚔️ Available Actions
            </div>
            <div className="ap-info">
              {currentPlayer.action_points_current}/{currentPlayer.action_points_max} AP
            </div>
          </ActionsHeader>
          
          {showPlayerActions && (
            <>
              <QuickActionsGrid>
                {characterAbilities.slice(0, 6).map(ability => {
                  const disabled = !canUseAbility(ability, currentPlayer);
                  const onCooldown = ability.currentCooldown > 0;
                  
                  return (
                    <QuickActionButton
                      key={ability.id}
                      $disabled={disabled}
                      $onCooldown={onCooldown}
                      onClick={() => handleQuickAbilityUse(ability)}
                      disabled={disabled}
                      title={ability.description}
                    >
                      <div className="ability-name">{ability.name}</div>
                      <div className="ability-info">
                        <span>{ability.manaCost ? `${ability.manaCost} MP` : 'Free'}</span>
                        {ability.damage && <span>{ability.damage} DMG</span>}
                      </div>
                      {onCooldown && (
                        <div className="cooldown-overlay">{ability.currentCooldown}</div>
                      )}
                    </QuickActionButton>
                  );
                })}
              </QuickActionsGrid>
              
              <div style={{ 
                textAlign: 'center',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                paddingTop: '12px'
              }}>
                <button
                  onClick={() => currentPlayer && handleCharacterSelect(currentPlayer)}
                  style={{
                    background: 'linear-gradient(135deg, #4ecdc4, #45b7d1)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}
                >
                  📋 View All Abilities
                </button>
              </div>
            </>
          )}
        </PlayerActionsPanel>
      )}

      {/* Player Stats Panel - only show if currentPlayerId is provided */}
      {currentPlayer && (
        <PlayerStatsPanel>
          <PlayerStatsHeader>
            <div className="player-info">
              <div className="avatar">
                {currentPlayer.name.charAt(0).toUpperCase()}
              </div>
              <div className="details">
                <div className="name">{currentPlayer.name}</div>
                <div className="class">{currentPlayer.class} • Lv.{currentPlayer.level}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="toggle"
                onClick={() => setShowPlayerActions(!showPlayerActions)}
                title={showPlayerActions ? "Hide Actions" : "Show Actions"}
              >
                {showPlayerActions ? "⚔️" : "💤"}
              </button>
              <button 
                className="toggle"
                onClick={() => setShowPlayerStats(!showPlayerStats)}
                title={showPlayerStats ? "Hide Details" : "Show Details"}
              >
                {showPlayerStats ? "📊" : "👁️"}
              </button>
            </div>
          </PlayerStatsHeader>
          
          {showPlayerStats && (
            <DetailedStats>
              <div className="stat-row">
                <span className="stat-label">❤️ Health</span>
                <span className="stat-value">{currentPlayer.health_current}/{currentPlayer.health_max}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">💙 Mana</span>
                <span className="stat-value">{currentPlayer.mana_current}/{currentPlayer.mana_max}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">💚 Stamina</span>
                <span className="stat-value">{currentPlayer.stamina_current}/{currentPlayer.stamina_max}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">⚡ Action Points</span>
                <span className="stat-value">{currentPlayer.action_points_current}/{currentPlayer.action_points_max}</span>
              </div>
              
              <div className="combat-stats">
                <div className="stat-row">
                  <span className="stat-label">🛡️ Armor</span>
                  <span className="stat-value">{currentPlayer.armor_current}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">🔮 Magic Resist</span>
                  <span className="stat-value">{currentPlayer.magic_resist_current}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">✨ Experience</span>
                  <span className="stat-value">{currentPlayer.experience}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">📈 To Next Level</span>
                  <span className="stat-value">{currentPlayer.experience_to_next}</span>
                </div>
              </div>
            </DetailedStats>
          )}
        </PlayerStatsPanel>
      )}

      {/* Floating Text */}
      <FloatingText 
        texts={floatingTexts} 
      />
    </BattleContainer>
  );
}
