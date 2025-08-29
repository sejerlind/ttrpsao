import styled from 'styled-components';
import ResourceBar from './ResourceBar';

interface Resources {
  health: { current: number; max: number };
  mana: { current: number; max: number };
  stamina: { current: number; max: number };
  armor: { current: number };
  magicResist: { current: number };
}

interface ResourcesGridProps {
  resources: Resources;
}

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

export default function ResourcesGrid({ resources }: ResourcesGridProps) {
  return (
    <GridContainer>
      <ResourceBar
        name="Health"
        current={resources.health.current}
        max={resources.health.max}
        type="health"
      />
      <ResourceBar
        name="Mana"
        current={resources.mana.current}
        max={resources.mana.max}
        type="mana"
      />
      <ResourceBar
        name="Stamina"
        current={resources.stamina.current}
        max={resources.stamina.max}
        type="stamina"
      />
      <ResourceBar
        name="Armor"
        current={resources.armor.current}
        type="armor"
      />
      <ResourceBar
        name="Magic Resist"
        current={resources.magicResist.current}
        type="magic-resist"
      />
    </GridContainer>
  );
} 