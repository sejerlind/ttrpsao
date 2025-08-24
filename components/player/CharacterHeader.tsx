import styled from 'styled-components';

interface Character {
  name: string;
  class: string;
  level: number;
  experience: number;
  experienceToNext: number;
}

interface Resources {
  actionPoints: { current: number; max: number };
}

interface CharacterHeaderProps {
  character: Character;
  resources: Resources;
}

const HeaderContainer = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.xl};
  align-items: center;

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
    text-align: center;
  }
`;

const PortraitContainer = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: ${props => props.theme.borderRadius.large};
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  box-shadow: ${props => props.theme.shadows.card};

  .level-badge {
    position: absolute;
    top: -10px;
    right: -10px;
    background: ${props => props.theme.gradients.accent};
    border: 2px solid ${props => props.theme.colors.accent.cyan};
    border-radius: ${props => props.theme.borderRadius.pill};
    padding: 4px 12px;
    font-size: 14px;
    font-weight: bold;
    color: ${props => props.theme.colors.text.primary};
  }
`;

const CharacterInfo = styled.div`
  h1 {
    margin: 0 0 ${props => props.theme.spacing.sm} 0;
    font-size: 2.5rem;
    background: ${props => props.theme.gradients.accent};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .class-level {
    font-size: 1.2rem;
    color: ${props => props.theme.colors.text.accent};
    margin-bottom: ${props => props.theme.spacing.sm};
  }

  .experience {
    font-size: 0.9rem;
    color: ${props => props.theme.colors.text.muted};
  }
`;

const ActionPointsDisplay = styled.div`
  text-align: center;
  
  .ap-label {
    font-size: 0.9rem;
    color: ${props => props.theme.colors.text.muted};
    margin-bottom: ${props => props.theme.spacing.xs};
  }

  .ap-value {
    font-size: 2rem;
    font-weight: bold;
    color: ${props => props.theme.colors.accent.cyan};
  }

  .ap-max {
    font-size: 1rem;
    color: ${props => props.theme.colors.text.muted};
  }
`;

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export default function CharacterHeader({ character, resources }: CharacterHeaderProps) {
  return (
    <HeaderContainer>
      <PortraitContainer>
        🗡️
        <div className="level-badge">Lv {character.level}</div>
      </PortraitContainer>

      <CharacterInfo>
        <h1>{character.name}</h1>
        <div className="class-level">{character.class}</div>
        <div className="experience">
          EXP: {formatNumber(character.experience)} / {formatNumber(character.experienceToNext)}
        </div>
      </CharacterInfo>

      <ActionPointsDisplay>
        <div className="ap-label">Action Points</div>
        <div className="ap-value">
          {resources.actionPoints.current}
          <span className="ap-max">/{resources.actionPoints.max}</span>
        </div>
      </ActionPointsDisplay>
    </HeaderContainer>
  );
} 