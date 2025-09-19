import styled from 'styled-components';

interface Ability {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'skill' | 'ultimate';
  cooldownMax: number;
  currentCooldown: number;
  damage?: string;
  manaCost?: number;
  effects?: string[];
  level?: number; // Current skill level (1-5)
  maxLevel?: number; // Maximum possible level
  baseDamage?: string; // Base damage before scaling
  baseManaCost?: number; // Base mana cost before scaling
  baseCooldown?: number; // Base cooldown before scaling
  scaling?: {
    damage?: string; // How damage scales per level (e.g., "+1d6 per level")
    manaCost?: string; // How mana cost scales per level
    cooldown?: string; // How cooldown scales per level
    effects?: string[]; // Additional effects gained at higher levels
  };
}

interface AbilityCardProps {
  ability: Ability;
  isRecentlyUsed: boolean;
  onClick: () => void;
}

const CardContainer = styled.div<{ $cooldown?: boolean; $recentlyUsed?: boolean }>`
  background: ${props => props.theme.gradients.card};
  border: 2px solid ${props => props.$recentlyUsed 
    ? '#10b981' 
    : props.theme.colors.surface.border};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  opacity: ${props => props.$cooldown ? 0.6 : 1};
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => {
      if (props.$recentlyUsed) return 'linear-gradient(90deg, #10b981, #059669)';
      if (props.$cooldown) return 'linear-gradient(90deg, #ef4444, #dc2626)';
      return 'linear-gradient(90deg, #4a90e2, #5dd3e8)';
    }};
  }

  ${props => props.$recentlyUsed && `
    animation: pulseGlow 2s ease-in-out;
    transform: scale(1.02);
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
    
    .ability-name {
      color: #10b981;
      text-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
    }
  `}

  @keyframes pulseGlow {
    0%, 100% { 
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.3), 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    50% { 
      box-shadow: 0 0 30px rgba(16, 185, 129, 0.5), 0 6px 25px rgba(0, 0, 0, 0.4);
    }
  }

  &:hover {
    transform: translateY(-4px) ${props => props.$recentlyUsed ? 'scale(1.02)' : 'scale(1.03)'};
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    border-color: ${props => props.theme.colors.accent.cyan};

    .ability-name {
      color: ${props => props.theme.colors.accent.cyan};
    }

    .ability-icon {
      transform: scale(1.1) rotate(5deg);
    }
  }
`;

const AbilityHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
  gap: ${props => props.theme.spacing.sm};
`;

const AbilityIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.medium};
  background: linear-gradient(145deg, #4a90e2, #5dd3e8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.1);
`;

const AbilityName = styled.div`
  font-weight: bold;
  font-size: 1.1rem;
  color: ${props => props.theme.colors.text.primary};
  transition: all 0.3s ease;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LevelBadge = styled.div<{ $level: number; $maxLevel: number }>`
  background: ${props => {
    const level = props.$level;
    const maxLevel = props.$maxLevel;
    const progress = level / maxLevel;
    
    if (progress >= 0.8) return 'linear-gradient(135deg, #10b981, #059669)'; // Green for high levels
    if (progress >= 0.6) return 'linear-gradient(135deg, #3b82f6, #1d4ed8)'; // Blue for medium-high
    if (progress >= 0.4) return 'linear-gradient(135deg, #8b5cf6, #7c3aed)'; // Purple for medium
    if (progress >= 0.2) return 'linear-gradient(135deg, #f59e0b, #d97706)'; // Orange for low-medium
    return 'linear-gradient(135deg, #6b7280, #4b5563)'; // Gray for low levels
  }};
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: ${props => props.theme.borderRadius.pill};
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 20px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
`;

const AbilityCooldown = styled.div<{ $cooldown?: boolean }>`
  font-size: 0.85rem;
  color: ${props => props.$cooldown 
    ? props.theme.colors.status.error 
    : props.theme.colors.status.success};
  margin-bottom: ${props => props.theme.spacing.sm};
  font-weight: 600;
  padding: 2px 8px;
  border-radius: ${props => props.theme.borderRadius.pill};
  background: ${props => props.$cooldown 
    ? 'rgba(239, 68, 68, 0.1)' 
    : 'rgba(16, 185, 129, 0.1)'};
  border: 1px solid ${props => props.$cooldown 
    ? 'rgba(239, 68, 68, 0.2)' 
    : 'rgba(16, 185, 129, 0.2)'};
  text-align: center;
`;

const AbilityDescription = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.text.secondary};
  line-height: 1.4;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const ScalingEffects = styled.div`
  margin-top: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm};
  background: rgba(74, 144, 226, 0.1);
  border-radius: ${props => props.theme.borderRadius.medium};
  border-left: 3px solid #4a90e2;
  
  .scaling-title {
    font-size: 0.8rem;
    font-weight: bold;
    color: #4a90e2;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .scaling-effect {
    font-size: 0.75rem;
    color: ${props => props.theme.colors.text.secondary};
    margin-bottom: 2px;
    padding-left: 8px;
    position: relative;
    
    &::before {
      content: '•';
      position: absolute;
      left: 0;
      color: #4a90e2;
    }
  }
`;

const AbilityStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${props => props.theme.spacing.md};
  padding-top: ${props => props.theme.spacing.sm};
  border-top: 1px solid ${props => props.theme.colors.surface.border};
  
  .stat {
    text-align: center;
    
    .stat-label {
      font-size: 0.7rem;
      color: ${props => props.theme.colors.text.muted};
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .stat-value {
      font-size: 0.85rem;
      font-weight: bold;
      color: ${props => props.theme.colors.text.accent};
    }
  }
`;

const UsedIndicator = styled.div`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
  border: 2px solid white;
  animation: scaleIn 0.3s ease-out;

  @keyframes scaleIn {
    from { transform: scale(0); }
    to { transform: scale(1); }
  }

  &::before {
    content: '✓';
  }
`;

const getAbilityIcon = (ability: Ability): string => {
  switch (ability.category) {
    case 'basic':
      if (ability.name.includes('Light')) return '⚡';
      if (ability.name.includes('Heavy')) return '💥';
      if (ability.name.includes('Auto')) return '🔄';
      return '⚔️';
    case 'skill':
      if (ability.name.includes('Shadow')) return '🌙';
      if (ability.name.includes('Stealth')) return '👤';
      if (ability.name.includes('Poison')) return '☠️';
      return '🎯';
    case 'ultimate':
      return '💀';
    default:
      return '⚔️';
  }
};

const formatCooldown = (turns: number): string => {
  if (turns === 0) return 'Ready';
  if (turns === 1) return '1 turn';
  return `${turns} turns`;
};

export default function AbilityCard({ ability, isRecentlyUsed, onClick }: AbilityCardProps) {
  return (
    <CardContainer
      $cooldown={ability.currentCooldown > 0}
      $recentlyUsed={isRecentlyUsed}
      onClick={onClick}
    >
      <AbilityHeader>
        <AbilityIcon className="ability-icon">{getAbilityIcon(ability)}</AbilityIcon>
        <AbilityName className="ability-name">
          {ability.name}
          {ability.level && ability.maxLevel && (
            <LevelBadge $level={ability.level} $maxLevel={ability.maxLevel}>
              {ability.level}
            </LevelBadge>
          )}
        </AbilityName>
      </AbilityHeader>
      
      <AbilityCooldown $cooldown={ability.currentCooldown > 0}>
        CD: {formatCooldown(ability.currentCooldown)}
      </AbilityCooldown>
      
      <AbilityDescription>{ability.description}</AbilityDescription>
      
      {ability.scaling?.effects && ability.level && ability.level > 1 && (
        <ScalingEffects>
          <div className="scaling-title">Level {ability.level} Effects</div>
          {ability.scaling.effects
            .filter(effect => {
              const levelMatch = effect.match(/Level (\d+):/);
              return levelMatch && parseInt(levelMatch[1]) <= ability.level!;
            })
            .map(effect => effect.replace(/Level \d+: /, ''))
            .map((effect, index) => (
              <div key={index} className="scaling-effect">{effect}</div>
            ))
          }
        </ScalingEffects>
      )}
      
      {isRecentlyUsed && <UsedIndicator />}
      
      <AbilityStats>
        {ability.damage && (
          <div className="stat">
            <div className="stat-label">Damage</div>
            <div className="stat-value">{ability.damage}</div>
          </div>
        )}
        {ability.manaCost !== undefined && ability.manaCost > 0 && (
          <div className="stat">
            <div className="stat-label">Mana</div>
            <div className="stat-value">{ability.manaCost}</div>
          </div>
        )}
        <div className="stat">
          <div className="stat-label">CD</div>
          <div className="stat-value">{ability.cooldownMax} {ability.cooldownMax === 1 ? 'turn' : 'turns'}</div>
        </div>
      </AbilityStats>
    </CardContainer>
  );
} 