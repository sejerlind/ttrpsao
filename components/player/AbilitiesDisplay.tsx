// components/player/AbilitiesDisplay.tsx
'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { Ability, PlayerProgression } from '../types';
import { getPlayerAbilities, getAbilitiesByCategory } from '../../lib/abilityManager';

interface AbilitiesDisplayProps {
  playerProgression: PlayerProgression;
  onAbilityUse?: (ability: Ability) => void;
}

const AbilitiesContainer = styled.div`
  background: ${(p) => p.theme.gradients.background};
  border-radius: ${(p) => p.theme.borderRadius.large};
  padding: ${(p) => p.theme.spacing.xl};
  border: 2px solid ${(p) => p.theme.colors.surface.border};
`;

const AbilitiesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(p) => p.theme.spacing.xl};
  padding-bottom: ${(p) => p.theme.spacing.lg};
  border-bottom: 2px solid ${(p) => p.theme.colors.accent.cyan};

  h2 {
    color: ${(p) => p.theme.colors.text.accent};
    font-size: 1.8rem;
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${(p) => p.theme.spacing.md};

    &::before {
      content: '⚡';
      font-size: 1.5rem;
    }
  }
`;

const CategoryTabs = styled.div`
  display: flex;
  gap: ${(p) => p.theme.spacing.sm};
  margin-bottom: ${(p) => p.theme.spacing.lg};
`;

const CategoryTab = styled.button<{ $active: boolean }>`
  background: ${(p) => (p.$active ? p.theme.colors.accent.cyan : p.theme.colors.surface.card)};
  color: ${(p) => (p.$active ? p.theme.colors.primary.bg : p.theme.colors.text.primary)};
  border: 1px solid ${(p) => (p.$active ? p.theme.colors.accent.cyan : p.theme.colors.surface.border)};
  border-radius: ${(p) => p.theme.borderRadius.medium};
  padding: ${(p) => p.theme.spacing.sm} ${(p) => p.theme.spacing.lg};
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;

  &:hover {
    background: ${(p) => (p.$active ? p.theme.colors.accent.cyan : p.theme.colors.surface.hover)};
    transform: translateY(-2px);
  }
`;

const AbilitiesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${(p) => p.theme.spacing.lg};
`;

const AbilityCard = styled.div<{ $category: string; $onCooldown: boolean }>`
  background: ${(p) => p.theme.gradients.card};
  border: 2px solid ${(p) => {
    switch (p.$category) {
      case 'basic': return '#10b981';
      case 'skill': return '#3b82f6';
      case 'ultimate': return '#f59e0b';
      default: return p.theme.colors.surface.border;
    }
  }};
  border-radius: ${(p) => p.theme.borderRadius.medium};
  padding: ${(p) => p.theme.spacing.lg};
  transition: all 0.3s ease;
  opacity: ${(p) => p.$onCooldown ? 0.6 : 1};
  cursor: ${(p) => p.$onCooldown ? 'not-allowed' : 'pointer'};
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${(p) => p.theme.shadows.cardHover};
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${(p) => {
      switch (p.$category) {
        case 'basic': return 'linear-gradient(90deg, #10b981, #059669)';
        case 'skill': return 'linear-gradient(90deg, #3b82f6, #1d4ed8)';
        case 'ultimate': return 'linear-gradient(90deg, #f59e0b, #d97706)';
        default: return p.theme.colors.surface.border;
      }
    }};
  }
`;

const AbilityHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${(p) => p.theme.spacing.md};
`;

const AbilityName = styled.h3`
  color: ${(p) => p.theme.colors.text.accent};
  font-size: 1.2rem;
  margin: 0;
  font-weight: bold;
`;

const AbilityCategory = styled.span<{ $category: string }>`
  background: ${(p) => {
    switch (p.$category) {
      case 'basic': return '#10b981';
      case 'skill': return '#3b82f6';
      case 'ultimate': return '#f59e0b';
      default: return p.theme.colors.surface.dark;
    }
  }};
  color: white;
  padding: 2px 8px;
  border-radius: ${(p) => p.theme.borderRadius.small};
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
`;

const AbilityDescription = styled.p`
  color: ${(p) => p.theme.colors.text.secondary};
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: ${(p) => p.theme.spacing.md};
`;

const AbilityStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${(p) => p.theme.spacing.sm};
  margin-bottom: ${(p) => p.theme.spacing.md};
`;

const StatItem = styled.div`
  background: ${(p) => p.theme.colors.surface.dark};
  padding: ${(p) => p.theme.spacing.sm};
  border-radius: ${(p) => p.theme.borderRadius.small};
  text-align: center;

  .label {
    font-size: 0.7rem;
    color: ${(p) => p.theme.colors.text.muted};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }

  .value {
    font-size: 0.9rem;
    font-weight: bold;
    color: ${(p) => p.theme.colors.accent.cyan};
  }
`;

const AbilityEffects = styled.div`
  margin-bottom: ${(p) => p.theme.spacing.md};

  .effects-title {
    font-size: 0.8rem;
    color: ${(p) => p.theme.colors.text.muted};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: ${(p) => p.theme.spacing.xs};
  }

  .effect {
    background: ${(p) => p.theme.colors.surface.dark};
    padding: ${(p) => p.theme.spacing.xs} ${(p) => p.theme.spacing.sm};
    border-radius: ${(p) => p.theme.borderRadius.small};
    margin-bottom: ${(p) => p.theme.spacing.xs};
    font-size: 0.8rem;
    border-left: 3px solid ${(p) => p.theme.colors.accent.cyan};
  }
`;

const UseButton = styled.button<{ $disabled: boolean }>`
  width: 100%;
  background: ${(p) => p.$disabled ? p.theme.colors.surface.dark : p.theme.colors.accent.cyan};
  color: ${(p) => p.$disabled ? p.theme.colors.text.muted : p.theme.colors.primary.bg};
  border: none;
  border-radius: ${(p) => p.theme.borderRadius.medium};
  padding: ${(p) => p.theme.spacing.sm};
  font-weight: bold;
  cursor: ${(p) => p.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  opacity: ${(p) => p.$disabled ? 0.6 : 1};

  &:hover:not(:disabled) {
    background: ${(p) => p.theme.colors.accent.cyan}cc;
    transform: translateY(-2px);
  }
`;

const CooldownOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${(p) => p.theme.borderRadius.medium};
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${(p) => p.theme.spacing.xl};
  color: ${(p) => p.theme.colors.text.muted};
  font-style: italic;
`;

export default function AbilitiesDisplay({ playerProgression, onAbilityUse }: AbilitiesDisplayProps) {
  const [activeCategory, setActiveCategory] = useState<'basic' | 'skill' | 'ultimate'>('skill');
  
  const allAbilities = getPlayerAbilities(playerProgression);
  const filteredAbilities = getAbilitiesByCategory(playerProgression, activeCategory);
  
  const handleAbilityUse = (ability: Ability) => {
    if (ability.currentCooldown > 0) return;
    onAbilityUse?.(ability);
  };

  const getCategoryCount = (category: 'basic' | 'skill' | 'ultimate') => {
    return getAbilitiesByCategory(playerProgression, category).length;
  };

  return (
    <AbilitiesContainer>
      <AbilitiesHeader>
        <h2>Abilities</h2>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>
          {allAbilities.length} abilities unlocked
        </div>
      </AbilitiesHeader>

      <CategoryTabs>
        <CategoryTab 
          $active={activeCategory === 'basic'} 
          onClick={() => setActiveCategory('basic')}
        >
          Basic ({getCategoryCount('basic')})
        </CategoryTab>
        <CategoryTab 
          $active={activeCategory === 'skill'} 
          onClick={() => setActiveCategory('skill')}
        >
          Skills ({getCategoryCount('skill')})
        </CategoryTab>
        <CategoryTab 
          $active={activeCategory === 'ultimate'} 
          onClick={() => setActiveCategory('ultimate')}
        >
          Ultimate ({getCategoryCount('ultimate')})
        </CategoryTab>
      </CategoryTabs>

      {filteredAbilities.length === 0 ? (
        <EmptyState>
          No {activeCategory} abilities unlocked yet. Unlock skills to gain new abilities!
        </EmptyState>
      ) : (
        <AbilitiesGrid>
          {filteredAbilities.map((ability) => (
            <AbilityCard
              key={ability.id}
              $category={ability.category}
              $onCooldown={ability.currentCooldown > 0}
              onClick={() => handleAbilityUse(ability)}
            >
              {ability.currentCooldown > 0 && (
                <CooldownOverlay>
                  {ability.currentCooldown}s
                </CooldownOverlay>
              )}
              
              <AbilityHeader>
                <AbilityName>{ability.name}</AbilityName>
                <AbilityCategory $category={ability.category}>
                  {ability.category}
                </AbilityCategory>
              </AbilityHeader>

              <AbilityDescription>{ability.description}</AbilityDescription>

              <AbilityStats>
                {ability.damage && (
                  <StatItem>
                    <div className="label">Damage</div>
                    <div className="value">{ability.damage}</div>
                  </StatItem>
                )}
                {ability.manaCost !== undefined && (
                  <StatItem>
                    <div className="label">Mana Cost</div>
                    <div className="value">{ability.manaCost}</div>
                  </StatItem>
                )}
                <StatItem>
                  <div className="label">Cooldown</div>
                  <div className="value">{ability.cooldownMax}s</div>
                </StatItem>
                <StatItem>
                  <div className="label">Current CD</div>
                  <div className="value">{ability.currentCooldown}s</div>
                </StatItem>
              </AbilityStats>

              {ability.effects && ability.effects.length > 0 && (
                <AbilityEffects>
                  <div className="effects-title">Effects</div>
                  {ability.effects.map((effect, index) => (
                    <div key={index} className="effect">
                      {effect}
                    </div>
                  ))}
                </AbilityEffects>
              )}

              <UseButton 
                $disabled={ability.currentCooldown > 0}
                disabled={ability.currentCooldown > 0}
              >
                {ability.currentCooldown > 0 ? `On Cooldown (${ability.currentCooldown}s)` : 'Use Ability'}
              </UseButton>
            </AbilityCard>
          ))}
        </AbilitiesGrid>
      )}
    </AbilitiesContainer>
  );
}
