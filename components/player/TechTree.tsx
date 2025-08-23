'use client';

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { 
  SkillNode, 
  SkillTreeType, 
  SkillCategory, 
  TechTreeState, 
  PlayerProgression,
  SkillEffect 
} from '../types';

interface TechTreeProps {
  playerProgression: PlayerProgression;
  onSkillUpgrade: (skillId: string) => void;
  onSkillPreview: (skill: SkillNode | null) => void;
}

const TechTreeContainer = styled.div`
  background: ${props => props.theme.gradients.background};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.xl};
  position: relative;
  overflow: hidden;
  min-height: 600px;
`;

const TreeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xl};
  padding-bottom: ${props => props.theme.spacing.lg};
  border-bottom: 2px solid ${props => props.theme.colors.accent.cyan};

  h2 {
    color: ${props => props.theme.colors.text.accent};
    font-size: 2rem;
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.md};

    &::before {
      content: '🌟';
      font-size: 1.5rem;
    }
  }
`;

const ProgressionStats = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.lg};
  
  .stat {
    background: ${props => props.theme.gradients.card};
    border: ${props => props.theme.borders.card};
    border-radius: ${props => props.theme.borderRadius.medium};
    padding: ${props => props.theme.spacing.md};
    text-align: center;
    min-width: 120px;

    .label {
      font-size: 0.8rem;
      color: ${props => props.theme.colors.text.muted};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: ${props => props.theme.spacing.xs};
    }

    .value {
      font-size: 1.5rem;
      font-weight: bold;
      color: ${props => props.theme.colors.accent.cyan};
    }
  }
`;

const TreeFilters = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xl};
  flex-wrap: wrap;
`;

const FilterButton = styled.button<{ $active: boolean }>`
  background: ${props => props.$active ? props.theme.colors.accent.cyan : props.theme.colors.surface.card};
  color: ${props => props.$active ? props.theme.colors.primary.bg : props.theme.colors.text.primary};
  border: 1px solid ${props => props.$active ? props.theme.colors.accent.cyan : props.theme.colors.surface.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;

  &:hover {
    background: ${props => props.$active ? props.theme.colors.accent.cyan : props.theme.colors.surface.hover};
    transform: translateY(-2px);
  }
`;

const TreeCanvas = styled.div`
  position: relative;
  width: 100%;
  height: 800px;
  background: linear-gradient(45deg, 
    ${props => props.theme.colors.primary.bg} 0%, 
    ${props => props.theme.colors.primary.secondary} 100%);
  border-radius: ${props => props.theme.borderRadius.large};
  overflow: auto;
  border: 2px solid ${props => props.theme.colors.surface.border};
`;

const SkillNodeComponent = styled.div<{ 
  $tier: number; 
  $isUnlocked: boolean; 
  $isMaxed: boolean;
  $canUpgrade: boolean;
  $position: { x: number; y: number };
}>`
  position: absolute;
  left: ${props => props.$position.x * 150 + 50}px;
  top: ${props => props.$position.y * 120 + 50}px;
  width: 80px;
  height: 80px;
  border-radius: ${props => props.theme.borderRadius.large};
  cursor: ${props => props.$canUpgrade ? 'pointer' : 'default'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  position: relative;
  
  background: ${props => {
    if (!props.$isUnlocked) return 'linear-gradient(145deg, #374151, #1f2937)';
    if (props.$isMaxed) return 'linear-gradient(145deg, #fbbf24, #f59e0b)';
    if (props.$canUpgrade) return 'linear-gradient(145deg, #3b82f6, #1d4ed8)';
    return 'linear-gradient(145deg, #10b981, #059669)';
  }};

  border: 3px solid ${props => {
    if (!props.$isUnlocked) return '#4b5563';
    if (props.$isMaxed) return '#d97706';
    if (props.$canUpgrade) return '#1e40af';
    return '#047857';
  }};

  box-shadow: ${props => {
    if (!props.$isUnlocked) return '0 4px 6px rgba(0, 0, 0, 0.3)';
    if (props.$isMaxed) return '0 0 20px rgba(251, 191, 36, 0.5)';
    if (props.$canUpgrade) return '0 0 15px rgba(59, 130, 246, 0.4)';
    return '0 4px 6px rgba(0, 0, 0, 0.1)';
  }};

  opacity: ${props => props.$isUnlocked ? 1 : 0.5};

  &:hover {
    transform: ${props => props.$isUnlocked ? 'translateY(-4px) scale(1.1)' : 'none'};
    z-index: 10;
    
    .tooltip {
      opacity: 1;
      visibility: visible;
      transform: translateY(-10px);
    }
  }

  .tier-indicator {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: ${props => {
      switch(props.$tier) {
        case 1: return 'linear-gradient(145deg, #94a3b8, #64748b)';
        case 2: return 'linear-gradient(145deg, #10b981, #059669)';
        case 3: return 'linear-gradient(145deg, #3b82f6, #1d4ed8)';
        case 4: return 'linear-gradient(145deg, #8b5fd6, #7c3aed)';
        case 5: return 'linear-gradient(145deg, #f59e0b, #d97706)';
        default: return '#6b7280';
      }
    }};
    color: white;
    font-size: 0.7rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
  }

  .rank-indicator {
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    background: ${props => props.theme.colors.primary.bg};
    color: ${props => props.theme.colors.accent.cyan};
    padding: 2px 8px;
    border-radius: ${props => props.theme.borderRadius.pill};
    font-size: 0.7rem;
    font-weight: bold;
    border: 1px solid ${props => props.theme.colors.accent.cyan};
  }
`;

const SkillTooltip = styled.div`
  position: absolute;
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%);
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.lg};
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 1000;
  min-width: 300px;
  max-width: 400px;
  white-space: normal;
  box-shadow: ${props => props.theme.shadows.cardHover};

  .skill-name {
    font-weight: bold;
    color: ${props => props.theme.colors.text.accent};
    font-size: 1.1rem;
    margin-bottom: ${props => props.theme.spacing.sm};
  }

  .skill-description {
    color: ${props => props.theme.colors.text.secondary};
    font-size: 0.9rem;
    margin-bottom: ${props => props.theme.spacing.md};
    line-height: 1.4;
  }

  .skill-effects {
    margin-bottom: ${props => props.theme.spacing.md};

    .effect {
      background: ${props => props.theme.colors.surface.dark};
      padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
      border-radius: ${props => props.theme.borderRadius.small};
      margin-bottom: ${props => props.theme.spacing.xs};
      font-size: 0.8rem;
      border-left: 3px solid ${props => props.theme.colors.accent.cyan};
    }
  }

  .skill-cost {
    border-top: 1px solid ${props => props.theme.colors.surface.border};
    padding-top: ${props => props.theme.spacing.sm};
    font-size: 0.8rem;
    color: ${props => props.theme.colors.text.muted};
  }
`;

const ConnectionLine = styled.div<{ 
  $from: { x: number; y: number }; 
  $to: { x: number; y: number };
  $isActive: boolean;
}>`
  position: absolute;
  background: ${props => props.$isActive ? props.theme.colors.accent.cyan : props.theme.colors.surface.border};
  height: 2px;
  transform-origin: left center;
  opacity: ${props => props.$isActive ? 0.8 : 0.3};
  transition: all 0.3s ease;
  
  ${props => {
    const deltaX = props.$to.x - props.$from.x;
    const deltaY = props.$to.y - props.$from.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 150;
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    
    return `
      left: ${(props.$from.x * 150) + 50 + 40}px;
      top: ${(props.$from.y * 120) + 50 + 40}px;
      width: ${distance - 80}px;
      transform: rotate(${angle}deg);
    `;
  }}
`;

// Sample skill data - this would normally come from your database
const sampleSkillTrees: SkillNode[] = [
  // Combat Tree
  {
    id: 'combat_basic_attack',
    name: 'Basic Combat',
    description: 'Foundation of all combat techniques. Increases basic attack damage and accuracy.',
    icon: '⚔️',
    tier: 1,
    position: { x: 0, y: 0 },
    skillTree: SkillTreeType.COMBAT,
    prerequisites: [],
    cost: { skillPoints: 1, level: 1 },
    maxRank: 5,
    currentRank: 0,
    isUnlocked: true,
    isMaxed: false,
    category: SkillCategory.PASSIVE,
    effects: [
      { type: 'stat_bonus', target: 'attack', value: 5, description: '+5 Attack per rank', scaling: 'linear' }
    ]
  },
  {
    id: 'combat_sword_mastery',
    name: 'Sword Mastery',
    description: 'Advanced sword combat techniques for increased damage and critical strikes.',
    icon: '🗡️',
    tier: 2,
    position: { x: 1, y: 0 },
    skillTree: SkillTreeType.COMBAT,
    prerequisites: ['combat_basic_attack'],
    cost: { skillPoints: 2, level: 5 },
    maxRank: 3,
    currentRank: 0,
    isUnlocked: false,
    isMaxed: false,
    category: SkillCategory.PASSIVE,
    effects: [
      { type: 'stat_bonus', target: 'crit_chance', value: 3, description: '+3% Crit Chance per rank' },
      { type: 'stat_bonus', target: 'sword_damage', value: 10, description: '+10% Sword Damage per rank' }
    ]
  },
  {
    id: 'combat_berserker_rage',
    name: 'Berserker Rage',
    description: 'Enter a rage state for massive damage at the cost of defense.',
    icon: '😡',
    tier: 3,
    position: { x: 2, y: 0 },
    skillTree: SkillTreeType.COMBAT,
    prerequisites: ['combat_sword_mastery'],
    cost: { skillPoints: 4, level: 15 },
    maxRank: 1,
    currentRank: 0,
    isUnlocked: false,
    isMaxed: false,
    category: SkillCategory.ACTIVE,
    effects: [
      { type: 'ability_unlock', target: 'berserker_rage', value: 1, description: 'Unlocks Berserker Rage ability' }
    ]
  },
  {
    id: 'combat_weapon_throw',
    name: 'Weapon Throw',
    description: 'Throw your weapon at enemies for ranged damage.',
    icon: '🪃',
    tier: 2,
    position: { x: 1, y: 1 },
    skillTree: SkillTreeType.COMBAT,
    prerequisites: ['combat_basic_attack'],
    cost: { skillPoints: 3, level: 8 },
    maxRank: 1,
    currentRank: 0,
    isUnlocked: false,
    isMaxed: false,
    category: SkillCategory.ACTIVE,
    effects: [
      { type: 'ability_unlock', target: 'weapon_throw', value: 1, description: 'Unlocks Weapon Throw ability' }
    ]
  },

  // Magic Tree
  {
    id: 'magic_basic_spells',
    name: 'Basic Magic',
    description: 'Foundation of magical knowledge and mana manipulation.',
    icon: '🔮',
    tier: 1,
    position: { x: 0, y: 2 },
    skillTree: SkillTreeType.MAGIC,
    prerequisites: [],
    cost: { skillPoints: 1, level: 1 },
    maxRank: 5,
    currentRank: 0,
    isUnlocked: true,
    isMaxed: false,
    category: SkillCategory.PASSIVE,
    effects: [
      { type: 'stat_bonus', target: 'mana', value: 20, description: '+20 Mana per rank' }
    ]
  },
  {
    id: 'magic_fireball',
    name: 'Fireball',
    description: 'Launch a devastating fireball at your enemies.',
    icon: '🔥',
    tier: 2,
    position: { x: 1, y: 2 },
    skillTree: SkillTreeType.MAGIC,
    prerequisites: ['magic_basic_spells'],
    cost: { skillPoints: 3, level: 8 },
    maxRank: 1,
    currentRank: 0,
    isUnlocked: false,
    isMaxed: false,
    category: SkillCategory.ACTIVE,
    effects: [
      { type: 'ability_unlock', target: 'fireball', value: 1, description: 'Unlocks Fireball ability' }
    ]
  },
  {
    id: 'magic_ice_shard',
    name: 'Ice Shard',
    description: 'Freeze and damage enemies with ice magic.',
    icon: '❄️',
    tier: 2,
    position: { x: 1, y: 3 },
    skillTree: SkillTreeType.MAGIC,
    prerequisites: ['magic_basic_spells'],
    cost: { skillPoints: 3, level: 10 },
    maxRank: 1,
    currentRank: 0,
    isUnlocked: false,
    isMaxed: false,
    category: SkillCategory.ACTIVE,
    effects: [
      { type: 'ability_unlock', target: 'ice_shard', value: 1, description: 'Unlocks Ice Shard ability' }
    ]
  },
  {
    id: 'magic_meteor',
    name: 'Meteor',
    description: 'Call down a massive meteor for devastating area damage.',
    icon: '☄️',
    tier: 4,
    position: { x: 2, y: 2 },
    skillTree: SkillTreeType.MAGIC,
    prerequisites: ['magic_fireball'],
    cost: { skillPoints: 8, level: 25, gold: 5000 },
    maxRank: 1,
    currentRank: 0,
    isUnlocked: false,
    isMaxed: false,
    category: SkillCategory.ULTIMATE,
    effects: [
      { type: 'ability_unlock', target: 'meteor', value: 1, description: 'Unlocks Meteor ultimate ability' }
    ]
  },

  // Defensive Tree
  {
    id: 'defense_basic_block',
    name: 'Basic Defense',
    description: 'Learn the fundamentals of blocking and damage reduction.',
    icon: '🛡️',
    tier: 1,
    position: { x: 0, y: 4 },
    skillTree: SkillTreeType.DEFENSIVE,
    prerequisites: [],
    cost: { skillPoints: 1, level: 1 },
    maxRank: 5,
    currentRank: 0,
    isUnlocked: true,
    isMaxed: false,
    category: SkillCategory.PASSIVE,
    effects: [
      { type: 'stat_bonus', target: 'block_chance', value: 5, description: '+5% Block Chance per rank' }
    ]
  },
  {
    id: 'defense_iron_skin',
    name: 'Iron Skin',
    description: 'Harden your skin to reduce incoming damage.',
    icon: '🛡️',
    tier: 2,
    position: { x: 1, y: 4 },
    skillTree: SkillTreeType.DEFENSIVE,
    prerequisites: ['defense_basic_block'],
    cost: { skillPoints: 2, level: 6 },
    maxRank: 3,
    currentRank: 0,
    isUnlocked: false,
    isMaxed: false,
    category: SkillCategory.PASSIVE,
    effects: [
      { type: 'stat_bonus', target: 'damage_reduction', value: 5, description: '+5% Damage Reduction per rank' }
    ]
  },

  // Crafting Tree
  {
    id: 'crafting_basic_smithing',
    name: 'Basic Smithing',
    description: 'Learn to forge basic weapons and armor.',
    icon: '🔨',
    tier: 1,
    position: { x: 0, y: 6 },
    skillTree: SkillTreeType.CRAFTING,
    prerequisites: [],
    cost: { skillPoints: 1, level: 1 },
    maxRank: 5,
    currentRank: 0,
    isUnlocked: true,
    isMaxed: false,
    category: SkillCategory.PASSIVE,
    effects: [
      { type: 'modifier', target: 'crafting_success', value: 10, description: '+10% Crafting Success Rate per rank' }
    ]
  },
  {
    id: 'crafting_enchanting',
    name: 'Enchanting',
    description: 'Imbue weapons and armor with magical properties.',
    icon: '✨',
    tier: 2,
    position: { x: 1, y: 6 },
    skillTree: SkillTreeType.CRAFTING,
    prerequisites: ['crafting_basic_smithing'],
    cost: { skillPoints: 3, level: 12 },
    maxRank: 3,
    currentRank: 0,
    isUnlocked: false,
    isMaxed: false,
    category: SkillCategory.PASSIVE,
    effects: [
      { type: 'unlock_equipment', target: 'enchanted_gear', value: 1, description: 'Unlocks enchanted equipment crafting' }
    ]
  },

  // Exploration Tree
  {
    id: 'exploration_pathfinding',
    name: 'Pathfinding',
    description: 'Navigate through difficult terrain with ease.',
    icon: '🗺️',
    tier: 1,
    position: { x: 0, y: 8 },
    skillTree: SkillTreeType.EXPLORATION,
    prerequisites: [],
    cost: { skillPoints: 1, level: 1 },
    maxRank: 3,
    currentRank: 0,
    isUnlocked: true,
    isMaxed: false,
    category: SkillCategory.PASSIVE,
    effects: [
      { type: 'stat_bonus', target: 'movement_speed', value: 10, description: '+10% Movement Speed per rank' }
    ]
  },
  {
    id: 'exploration_treasure_hunter',
    name: 'Treasure Hunter',
    description: 'Find hidden treasures and rare items.',
    icon: '💎',
    tier: 2,
    position: { x: 1, y: 8 },
    skillTree: SkillTreeType.EXPLORATION,
    prerequisites: ['exploration_pathfinding'],
    cost: { skillPoints: 2, level: 8 },
    maxRank: 5,
    currentRank: 0,
    isUnlocked: false,
    isMaxed: false,
    category: SkillCategory.PASSIVE,
    effects: [
      { type: 'stat_bonus', target: 'loot_find', value: 15, description: '+15% Better Loot Find per rank' }
    ]
  },

  // Social Tree
  {
    id: 'social_charisma',
    name: 'Charisma',
    description: 'Improve your ability to influence others.',
    icon: '💬',
    tier: 1,
    position: { x: 0, y: 10 },
    skillTree: SkillTreeType.SOCIAL,
    prerequisites: [],
    cost: { skillPoints: 1, level: 1 },
    maxRank: 5,
    currentRank: 0,
    isUnlocked: true,
    isMaxed: false,
    category: SkillCategory.PASSIVE,
    effects: [
      { type: 'stat_bonus', target: 'persuasion', value: 10, description: '+10% Persuasion Success per rank' }
    ]
  },
  {
    id: 'social_leadership',
    name: 'Leadership',
    description: 'Inspire allies and boost party performance.',
    icon: '👑',
    tier: 2,
    position: { x: 1, y: 10 },
    skillTree: SkillTreeType.SOCIAL,
    prerequisites: ['social_charisma'],
    cost: { skillPoints: 3, level: 10 },
    maxRank: 3,
    currentRank: 0,
    isUnlocked: false,
    isMaxed: false,
    category: SkillCategory.PASSIVE,
    effects: [
      { type: 'stat_bonus', target: 'party_bonus', value: 5, description: '+5% Party Damage Bonus per rank' }
    ]
  }
];

export default function TechTree({ playerProgression, onSkillUpgrade, onSkillPreview }: TechTreeProps) {
  const [activeFilter, setActiveFilter] = useState<SkillTreeType | 'all'>('all');
  const [skills] = useState<SkillNode[]>(sampleSkillTrees);
  const [hoveredSkill, setHoveredSkill] = useState<SkillNode | null>(null);

  const filteredSkills = skills.filter(skill => 
    activeFilter === 'all' || skill.skillTree === activeFilter
  );

  const canUpgradeSkill = (skill: SkillNode): boolean => {
    if (skill.isMaxed) return false;
    if (playerProgression.unspentSkillPoints < skill.cost.skillPoints) return false;
    if (playerProgression.totalLevel < skill.cost.level) return false;
    
    // Check prerequisites
    const hasPrereqs = skill.prerequisites.every(prereqId => 
      playerProgression.unlockedSkills.includes(prereqId)
    );
    
    return hasPrereqs;
  };

  const getSkillConnections = (skill: SkillNode) => {
    return skills.filter(s => s.prerequisites.includes(skill.id));
  };

  const skillTreeFilters = [
    { key: 'all' as const, label: 'All Trees', icon: '🌟' },
    { key: SkillTreeType.COMBAT, label: 'Combat', icon: '⚔️' },
    { key: SkillTreeType.MAGIC, label: 'Magic', icon: '🔮' },
    { key: SkillTreeType.CRAFTING, label: 'Crafting', icon: '🔨' },
    { key: SkillTreeType.EXPLORATION, label: 'Exploration', icon: '🗺️' },
    { key: SkillTreeType.SOCIAL, label: 'Social', icon: '💬' },
    { key: SkillTreeType.DEFENSIVE, label: 'Defense', icon: '🛡️' }
  ];

  return (
    <TechTreeContainer>
      <TreeHeader>
        <h2>Skill Trees</h2>
        <ProgressionStats>
          <div className="stat">
            <div className="label">Level</div>
            <div className="value">{playerProgression.totalLevel}</div>
          </div>
          <div className="stat">
            <div className="label">Skill Points</div>
            <div className="value">{playerProgression.unspentSkillPoints}</div>
          </div>
          <div className="stat">
            <div className="label">Talent Points</div>
            <div className="value">{playerProgression.unspentTalentPoints}</div>
          </div>
        </ProgressionStats>
      </TreeHeader>

      <TreeFilters>
        {skillTreeFilters.map(filter => (
          <FilterButton
            key={filter.key}
            $active={activeFilter === filter.key}
            onClick={() => setActiveFilter(filter.key)}
          >
            {filter.icon} {filter.label}
          </FilterButton>
        ))}
      </TreeFilters>

      <TreeCanvas>
        {/* Draw connection lines */}
        {filteredSkills.map(skill => 
          getSkillConnections(skill).map(connectedSkill => (
            <ConnectionLine
              key={`${skill.id}-${connectedSkill.id}`}
              $from={skill.position}
              $to={connectedSkill.position}
              $isActive={skill.isUnlocked}
            />
          ))
        )}

        {/* Draw skill nodes */}
        {filteredSkills.map(skill => (
          <SkillNodeComponent
            key={skill.id}
            $tier={skill.tier}
            $isUnlocked={skill.isUnlocked}
            $isMaxed={skill.isMaxed}
            $canUpgrade={canUpgradeSkill(skill)}
            $position={skill.position}
            onClick={() => canUpgradeSkill(skill) && onSkillUpgrade(skill.id)}
            onMouseEnter={() => {
              setHoveredSkill(skill);
              onSkillPreview(skill);
            }}
            onMouseLeave={() => {
              setHoveredSkill(null);
              onSkillPreview(null);
            }}
          >
            {skill.icon}
            <div className="tier-indicator">{skill.tier}</div>
            {skill.currentRank > 0 && (
              <div className="rank-indicator">
                {skill.currentRank}/{skill.maxRank}
              </div>
            )}
            
            <SkillTooltip className="tooltip">
              <div className="skill-name">{skill.name}</div>
              <div className="skill-description">{skill.description}</div>
              
              <div className="skill-effects">
                {skill.effects.map((effect, index) => (
                  <div key={index} className="effect">
                    {effect.description}
                  </div>
                ))}
              </div>
              
              <div className="skill-cost">
                Cost: {skill.cost.skillPoints} SP | Level {skill.cost.level}
                {skill.cost.gold && ` | ${skill.cost.gold} Gold`}
              </div>
            </SkillTooltip>
          </SkillNodeComponent>
        ))}
      </TreeCanvas>
    </TechTreeContainer>
  );
} 