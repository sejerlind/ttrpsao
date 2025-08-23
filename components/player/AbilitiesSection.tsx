import styled from 'styled-components';
import Button from '../ui/Button';
import AbilityCard from './AbilityCard';

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
}

interface AbilitiesSectionProps {
  abilities: Ability[];
  activeCategory: 'all' | 'basic' | 'skill' | 'ultimate';
  isLoading: boolean;
  onCategoryChange: (category: 'all' | 'basic' | 'skill' | 'ultimate') => void;
  onAbilityClick: (ability: Ability) => void;
  isRecentlyUsed: (abilityId: string) => boolean;
}

const SectionContainer = styled.div`
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.card};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #4a90e2, #5dd3e8, #8b5fd6);
    border-radius: ${props => props.theme.borderRadius.large} ${props => props.theme.borderRadius.large} 0 0;
  }
`;

const SectionTitle = styled.h2`
  margin: 0 0 ${props => props.theme.spacing.xl} 0;
  font-size: 1.8rem;
  color: ${props => props.theme.colors.text.primary};
  text-align: center;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 2px;
    background: linear-gradient(90deg, #4a90e2, #5dd3e8);
    border-radius: 2px;
  }
`;

const CategoryTabs = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.xl};
  flex-wrap: wrap;
  justify-content: center;
  background: ${props => props.theme.colors.surface.dark};
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.large};
  border: 1px solid ${props => props.theme.colors.surface.border};
`;

const CategorySection = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const CategoryHeader = styled.h3`
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
  font-size: 1.3rem;
  color: ${props => props.theme.colors.text.accent};
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  background: linear-gradient(90deg, ${props => props.theme.colors.surface.card}, transparent);
  border-left: 4px solid ${props => props.theme.colors.accent.cyan};
  border-radius: 0 ${props => props.theme.borderRadius.medium} ${props => props.theme.borderRadius.medium} 0;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-left: 10px solid ${props => props.theme.colors.surface.card};
  }
`;

const AbilitiesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: ${props => props.theme.spacing.lg};
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: ${props => props.theme.colors.text.muted};
`;

export default function AbilitiesSection({
  abilities,
  activeCategory,
  isLoading,
  onCategoryChange,
  onAbilityClick,
  isRecentlyUsed
}: AbilitiesSectionProps) {
  const categories = ['all', 'basic', 'skill', 'ultimate'] as const;

  const filteredAbilities = activeCategory === 'all' 
    ? abilities 
    : abilities.filter(ability => ability.category === activeCategory);

  const groupedAbilities = activeCategory === 'all' 
    ? {
        basic: abilities.filter(a => a.category === 'basic'),
        skill: abilities.filter(a => a.category === 'skill'),
        ultimate: abilities.filter(a => a.category === 'ultimate'),
      }
    : {};

  return (
    <SectionContainer>
      <SectionTitle>Abilities</SectionTitle>
      
      <CategoryTabs>
        {categories.map(category => (
          <Button
            key={category}
            $active={activeCategory === category}
            onClick={() => onCategoryChange(category)}
          >
            {category === 'all' ? 'All Actions' : category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </CategoryTabs>

      {isLoading ? (
        <LoadingMessage>Loading abilities...</LoadingMessage>
      ) : activeCategory === 'all' ? (
        Object.entries(groupedAbilities).map(([category, categoryAbilities]) => (
          <CategorySection key={category}>
            <CategoryHeader>{category.charAt(0).toUpperCase() + category.slice(1)} Actions</CategoryHeader>
            <AbilitiesGrid>
              {categoryAbilities.map(ability => (
                <AbilityCard
                  key={ability.id}
                  ability={ability}
                  isRecentlyUsed={isRecentlyUsed(ability.id)}
                  onClick={() => onAbilityClick(ability)}
                />
              ))}
            </AbilitiesGrid>
          </CategorySection>
        ))
      ) : (
        <AbilitiesGrid>
          {filteredAbilities.map(ability => (
            <AbilityCard
              key={ability.id}
              ability={ability}
              isRecentlyUsed={isRecentlyUsed(ability.id)}
              onClick={() => onAbilityClick(ability)}
            />
          ))}
        </AbilitiesGrid>
      )}
    </SectionContainer>
  );
} 