import styled from 'styled-components';

interface ResourceBarProps {
  name: string;
  current: number;
  max?: number;
  type: 'health' | 'mana' | 'stamina' | 'armor' | 'magic-resist';
}

const BarContainer = styled.div`
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadows.card};

  .resource-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${props => props.theme.spacing.md};

    .resource-name {
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 0.9rem;
    }

    .resource-values {
      font-weight: bold;
      color: ${props => props.theme.colors.text.accent};
    }
  }
`;

const ProgressBar = styled.div<{ $type: ResourceBarProps['type'] }>`
  height: 20px;
  background: ${props => props.theme.colors.surface.dark};
  border-radius: ${props => props.theme.borderRadius.pill};
  overflow: hidden;
  position: relative;

  .resource-fill {
    height: 100%;
    transition: width 0.3s ease;
    border-radius: ${props => props.theme.borderRadius.pill};
    background: ${props => {
      switch(props.$type) {
        case 'health': return 'linear-gradient(90deg, #ef4444, #dc2626)';
        case 'mana': return 'linear-gradient(90deg, #3b82f6, #1d4ed8)';
        case 'stamina': return 'linear-gradient(90deg, #10b981, #059669)';
        case 'armor': return 'linear-gradient(90deg, #f59e0b, #d97706)';
        case 'magic-resist': return 'linear-gradient(90deg, #8b5fd6, #7c3aed)';
        default: return 'linear-gradient(90deg, #6b7280, #4b5563)';
      }
    }};
  }
`;

const getResourcePercentage = (current: number, max: number): number => {
  return Math.min((current / max) * 100, 100);
};

export default function ResourceBar({ name, current, max, type }: ResourceBarProps) {
  const isProgressBar = max !== undefined;
  
  return (
    <BarContainer>
      <div className="resource-header">
        <span className="resource-name">{name}</span>
        <span className="resource-values">
          {isProgressBar ? `${current} / ${max}` : current}
        </span>
      </div>
      {isProgressBar ? (
        <ProgressBar $type={type}>
          <div 
            className="resource-fill"
            style={{ width: `${getResourcePercentage(current, max)}%` }}
          />
        </ProgressBar>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '10px', 
          fontSize: '1.1rem', 
          fontWeight: 'bold',
          color: type === 'armor' ? '#f59e0b' : '#8b5fd6'
        }}>
          {current}
        </div>
      )}
    </BarContainer>
  );
} 