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

interface AbilitiesSectionProps {
  abilities: Ability[];
  activeCategory: 'all' | 'basic' | 'skill' | 'ultimate' | 'bonuses';
  isLoading: boolean;
  onCategoryChange: (category: 'all' | 'basic' | 'skill' | 'ultimate' | 'bonuses') => void;
  onAbilityClick: (ability: Ability) => void;
  isRecentlyUsed: (abilityId: string) => boolean;
  statBonuses?: Record<string, number>;
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

const StatBonusesContainer = styled.div`
  background: ${props => props.theme.colors.surface.dark};
  border: 1px solid ${props => props.theme.colors.surface.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.lg};
  margin-top: ${props => props.theme.spacing.lg};
`;

const StatBonusesTitle = styled.h4`
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  font-size: 1.1rem;
  color: ${props => props.theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  
  &::before {
    content: '📈';
    font-size: 1.2rem;
  }
`;

const StatBonusesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: ${props => props.theme.spacing.sm};
`;

const StatBonusItem = styled.div<{ $value: number }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.sm};
  background: ${props => props.$value > 0 
    ? 'rgba(16, 185, 129, 0.1)' 
    : 'rgba(107, 114, 128, 0.1)'};
  border: 1px solid ${props => props.$value > 0 
    ? 'rgba(16, 185, 129, 0.2)' 
    : 'rgba(107, 114, 128, 0.2)'};
  border-radius: ${props => props.theme.borderRadius.medium};
  
  .stat-name {
    font-weight: 600;
    color: ${props => props.theme.colors.text.primary};
    text-transform: capitalize;
    font-size: 0.9rem;
  }
  
  .stat-value {
    font-weight: bold;
    color: ${props => props.$value > 0 
      ? props.theme.colors.status.success 
      : props.theme.colors.text.muted};
    font-size: 0.9rem;
    
    &::before {
      content: '+';
      color: ${props => props.$value > 0 
        ? props.theme.colors.status.success 
        : 'transparent'};
    }
  }
`;

export default function AbilitiesSection({
  abilities,
  activeCategory,
  isLoading,
  onCategoryChange,
  onAbilityClick,
  isRecentlyUsed,
  statBonuses = {}
}: AbilitiesSectionProps) {
  const categories = ['all', 'basic', 'skill', 'ultimate', 'bonuses'] as const;

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

  const statLabels: Record<string, string> = {
    attack_damage: 'Attack Damage',
    health: 'Max Health',
    mana: 'Max Mana',
    armor: 'Armor',
    magic_resist: 'Magic Resist',
    mana_regen: 'Mana Regen',
    crit_chance: 'Crit Chance',
    crit_damage: 'Crit Damage',
    attack_speed: 'Attack Speed',
    movement_speed: 'Movement Speed'
  };

  const activeBonuses = Object.entries(statBonuses).filter(([, value]) => value > 0);

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
      ) : activeCategory === 'bonuses' ? (
        <CategorySection>
          <CategoryHeader>Skill Bonuses</CategoryHeader>
          {activeBonuses.length > 0 ? (
            <StatBonusesContainer>
              <StatBonusesTitle>Active Bonuses from Skills</StatBonusesTitle>
              <StatBonusesGrid>
                {activeBonuses.map(([stat, value]) => (
                  <StatBonusItem key={stat} $value={value}>
                    <span className="stat-name">{statLabels[stat] || stat}</span>
                    <span className="stat-value">{value}</span>
                  </StatBonusItem>
                ))}
              </StatBonusesGrid>
            </StatBonusesContainer>
          ) : (
            <LoadingMessage>No skill bonuses active</LoadingMessage>
          )}
        </CategorySection>
      ) : activeCategory === 'all' ? (
        <>
          {Object.entries(groupedAbilities).map(([category, categoryAbilities]) => (
            <CategorySection key={category}>
              <CategoryHeader>{category.charAt(0).toUpperCase() + category.slice(1)} Actions</CategoryHeader>
              <AbilitiesGrid>
                {categoryAbilities.map((ability: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <AbilityCard
                    key={ability.id}
                    ability={ability}
                    isRecentlyUsed={isRecentlyUsed(ability.id)}
                    onClick={() => onAbilityClick(ability)}
                  />
                ))}
              </AbilitiesGrid>
            </CategorySection>
          ))}
          {activeBonuses.length > 0 && (
            <CategorySection>
              <CategoryHeader>Skill Bonuses</CategoryHeader>
              <StatBonusesContainer>
                <StatBonusesTitle>Active Bonuses from Skills</StatBonusesTitle>
                <StatBonusesGrid>
                  {activeBonuses.map(([stat, value]) => (
                    <StatBonusItem key={stat} $value={value}>
                      <span className="stat-name">{statLabels[stat] || stat}</span>
                      <span className="stat-value">{value}</span>
                    </StatBonusItem>
                  ))}
                </StatBonusesGrid>
              </StatBonusesContainer>
            </CategorySection>
          )}
        </>
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