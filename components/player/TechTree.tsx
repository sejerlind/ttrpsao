// src/components/TechTree.tsx
'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  SkillNode,
  SkillTreeType,
  PlayerProgression,
} from '../types';
import { calculateTreePositions, mapDsToSkillNodes, DsRow } from '../../app/utils/skillMappers';
import { getAbilitiesFromSkill } from '../../lib/abilityManager';

interface TechTreeProps {
  playerProgression: PlayerProgression;
  /**
   * Pass EITHER:
   *  - `skills`: already-shaped SkillNode[] (positions will be recalculated)
   *  - `dsRows`: your raw DS rows (we'll map + position them)
   */
  skills?: SkillNode[];
  dsRows?: DsRow[];
  onSkillUpgrade: (skillId: string) => void;
  onSkillPreview: (skill: SkillNode | null) => void;
  onAbilitiesUnlocked?: (abilities: string[]) => void; // Callback when new abilities are unlocked
}

const TechTreeContainer = styled.div`
  background: ${(p) => p.theme.gradients.background};
  border-radius: ${(p) => p.theme.borderRadius.large};
  padding: ${(p) => p.theme.spacing.xl};
  position: relative;
  overflow: hidden;
  min-height: 600px;
`;

const TreeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(p) => p.theme.spacing.xl};
  padding-bottom: ${(p) => p.theme.spacing.lg};
  border-bottom: 2px solid ${(p) => p.theme.colors.accent.cyan};

  h2 {
    color: ${(p) => p.theme.colors.text.accent};
    font-size: 2rem;
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${(p) => p.theme.spacing.md};

    &::before {
      content: '🌟';
      font-size: 1.5rem;
    }
  }
`;

const ProgressionStats = styled.div`
  display: flex;
  gap: ${(p) => p.theme.spacing.lg};

  .stat {
    background: ${(p) => p.theme.gradients.card};
    border: ${(p) => p.theme.borders.card};
    border-radius: ${(p) => p.theme.borderRadius.medium};
    padding: ${(p) => p.theme.spacing.md};
    text-align: center;
    min-width: 120px;

    .label {
      font-size: 0.8rem;
      color: ${(p) => p.theme.colors.text.muted};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: ${(p) => p.theme.spacing.xs};
    }

    .value {
      font-size: 1.5rem;
      font-weight: bold;
      color: ${(p) => p.theme.colors.accent.cyan};
    }
  }
`;


const TreeCanvas = styled.div`
  position: relative;
  width: 100%;
  min-height: 1000px;
  min-width: 100%;
  background:
    linear-gradient(45deg,
      ${(p) => p.theme.colors.primary.bg} 0%,
      ${(p) => p.theme.colors.primary.secondary} 100%),
    radial-gradient(circle at 20% 50%, rgba(59,130,246,0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(16,185,129,0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(139,92,246,0.1) 0%, transparent 50%);
  border-radius: ${(p) => p.theme.borderRadius.large};
  overflow: auto;
  border: 2px solid ${(p) => p.theme.colors.surface.border};
  padding: 40px;

  isolation: isolate;

  &::-webkit-scrollbar { width: 12px; height: 12px; }
  &::-webkit-scrollbar-track {
    background: ${(p) => p.theme.colors.surface.dark};
    border-radius: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${(p) => p.theme.colors.accent.cyan};
    border-radius: 6px;
    border: 2px solid ${(p) => p.theme.colors.surface.dark};
  }
  &::-webkit-scrollbar-thumb:hover { background: ${(p) => p.theme.colors.accent.cyan}cc; }

`;

const TreeSection = styled.div<{ $treeType: string }>`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  
  ${(p) => p.$treeType === 'combat' && `
    background: 
      radial-gradient(circle at 20% 30%, rgba(251, 191, 36, 0.1) 0%, transparent 40%),
      radial-gradient(circle at 80% 70%, rgba(245, 158, 11, 0.1) 0%, transparent 40%);
  `}
  
  ${(p) => p.$treeType === 'magic' && `
    background: 
      radial-gradient(circle at 20% 30%, rgba(139, 95, 214, 0.1) 0%, transparent 40%),
      radial-gradient(circle at 80% 70%, rgba(124, 58, 237, 0.1) 0%, transparent 40%);
  `}
  
  ${(p) => p.$treeType === 'crafting' && `
    background: 
      radial-gradient(circle at 20% 30%, rgba(16, 185, 129, 0.1) 0%, transparent 40%),
      radial-gradient(circle at 80% 70%, rgba(5, 150, 105, 0.1) 0%, transparent 40%);
  `}
`;

const TreeTitle = styled.div<{ $treeType: string }>`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: ${(p) => p.theme.gradients.card};
  border: 2px solid ${(p) => {
    switch (p.$treeType) {
      case 'combat': return '#f59e0b';
      case 'magic': return '#8b5fd6';
      case 'crafting': return '#10b981';
      default: return p.theme.colors.surface.border;
    }
  }};
  border-radius: ${(p) => p.theme.borderRadius.medium};
  padding: ${(p) => p.theme.spacing.md} ${(p) => p.theme.spacing.lg};
  color: ${(p) => p.theme.colors.text.accent};
  font-size: 1.5rem;
  font-weight: bold;
  z-index: 100;
  box-shadow: ${(p) => p.theme.shadows.cardHover};
  
  &::before {
    content: ${(p) => {
      switch (p.$treeType) {
        case 'combat': return '"⚔️"';
        case 'magic': return '"🔮"';
        case 'crafting': return '"🔨"';
        default: return '""';
      }
    }};
    margin-right: ${(p) => p.theme.spacing.sm};
  }
`;

const TreeStats = styled.div<{ $treeType: string }>`
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: ${(p) => p.theme.spacing.md};
  z-index: 100;
  
  .stat {
    background: ${(p) => p.theme.gradients.card};
    border: 1px solid ${(p) => {
      switch (p.$treeType) {
        case 'combat': return '#f59e0b';
        case 'magic': return '#8b5fd6';
        case 'crafting': return '#10b981';
        default: return p.theme.colors.surface.border;
      }
    }};
    border-radius: ${(p) => p.theme.borderRadius.small};
    padding: ${(p) => p.theme.spacing.sm};
    text-align: center;
    min-width: 80px;
    
    .label {
      font-size: 0.7rem;
      color: ${(p) => p.theme.colors.text.muted};
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .value {
      font-size: 1rem;
      font-weight: bold;
      color: ${(p) => {
        switch (p.$treeType) {
          case 'combat': return '#f59e0b';
          case 'magic': return '#8b5fd6';
          case 'crafting': return '#10b981';
          default: return p.theme.colors.accent.cyan;
        }
      }};
    }
  }
`;

const SkillConnection = styled.line<{ $isActive: boolean; $treeType: string }>`
  stroke: ${(p) => p.$isActive ? '#fbbf24' : '#4b5563'};
  stroke-width: ${(p) => p.$isActive ? 3 : 2};
  stroke-dasharray: ${(p) => p.$isActive ? 'none' : '5,5'};
  opacity: ${(p) => p.$isActive ? 1 : 0.5};
  transition: all 0.3s ease;
  z-index: 5;
  
  ${(p) => p.$isActive && `
    filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.6));
  `}
`;

const SkillNodeComponent = styled.div<{
  $tier: number;
  $isUnlocked: boolean;
  $isMaxed: boolean;
  $canUpgrade: boolean;
  $canUnlock: boolean;
  $position: { x: number; y: number };
  $skillTree: SkillTreeType;
}>`
  width: 80px;
  height: 80px;
  cursor: ${(p) => (p.$canUpgrade || p.$canUnlock ? 'pointer' : 'default')};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  position: relative;
  z-index: 10;
  will-change: transform;
  backface-visibility: hidden;
  border-radius: 12px;

  background: ${(p) => {
    if (!p.$isUnlocked) {
      // Locked skills - different colors based on whether they can be unlocked
      if (p.$canUnlock) {
        // Can be unlocked - bright, inviting colors
        switch (p.$skillTree) {
          case SkillTreeType.COMBAT: return 'linear-gradient(145deg, #fbbf24, #f59e0b)';
          case SkillTreeType.MAGIC: return 'linear-gradient(145deg, #8b5fd6, #7c3aed)';
          case SkillTreeType.DEFENSIVE: return 'linear-gradient(145deg, #3b82f6, #1d4ed8)';
          case SkillTreeType.CRAFTING: return 'linear-gradient(145deg, #10b981, #059669)';
          case SkillTreeType.EXPLORATION: return 'linear-gradient(145deg, #06b6d4, #0891b2)';
          case SkillTreeType.SOCIAL: return 'linear-gradient(145deg, #ec4899, #db2777)';
          default: return 'linear-gradient(145deg, #10b981, #059669)';
        }
      } else {
        // Cannot be unlocked - dark, muted colors
        return 'linear-gradient(145deg, #374151, #1f2937)';
      }
    }
    if (p.$isMaxed) {
      // Maxed skills - bright, completed colors
      switch (p.$skillTree) {
        case SkillTreeType.COMBAT: return 'linear-gradient(145deg, #fbbf24, #f59e0b)';
        case SkillTreeType.MAGIC: return 'linear-gradient(145deg, #8b5fd6, #7c3aed)';
        case SkillTreeType.DEFENSIVE: return 'linear-gradient(145deg, #3b82f6, #1d4ed8)';
        case SkillTreeType.CRAFTING: return 'linear-gradient(145deg, #10b981, #059669)';
        case SkillTreeType.EXPLORATION: return 'linear-gradient(145deg, #06b6d4, #0891b2)';
        case SkillTreeType.SOCIAL: return 'linear-gradient(145deg, #ec4899, #db2777)';
        default: return 'linear-gradient(145deg, #fbbf24, #f59e0b)';
      }
    }
    if (p.$canUpgrade) {
      // Can be upgraded - bright, active colors
      switch (p.$skillTree) {
        case SkillTreeType.COMBAT: return 'linear-gradient(145deg, #fbbf24, #f59e0b)';
        case SkillTreeType.MAGIC: return 'linear-gradient(145deg, #8b5fd6, #7c3aed)';
        case SkillTreeType.DEFENSIVE: return 'linear-gradient(145deg, #3b82f6, #1d4ed8)';
        case SkillTreeType.CRAFTING: return 'linear-gradient(145deg, #10b981, #059669)';
        case SkillTreeType.EXPLORATION: return 'linear-gradient(145deg, #06b6d4, #0891b2)';
        case SkillTreeType.SOCIAL: return 'linear-gradient(145deg, #ec4899, #db2777)';
        default: return 'linear-gradient(145deg, #3b82f6, #1d4ed8)';
      }
    }
    // Default unlocked but not upgradeable
    switch (p.$skillTree) {
      case SkillTreeType.COMBAT: return 'linear-gradient(145deg, #fbbf24, #f59e0b)';
      case SkillTreeType.MAGIC: return 'linear-gradient(145deg, #8b5fd6, #7c3aed)';
      case SkillTreeType.DEFENSIVE: return 'linear-gradient(145deg, #3b82f6, #1d4ed8)';
      case SkillTreeType.CRAFTING: return 'linear-gradient(145deg, #10b981, #059669)';
      case SkillTreeType.EXPLORATION: return 'linear-gradient(145deg, #06b6d4, #0891b2)';
      case SkillTreeType.SOCIAL: return 'linear-gradient(145deg, #ec4899, #db2777)';
      default: return 'linear-gradient(145deg, #10b981, #059669)';
    }
  }};

  border: 3px solid ${(p) => {
    if (!p.$isUnlocked) {
      if (p.$canUnlock) return '#10b981'; // Green border for unlockable skills
      return '#4b5563'; // Gray border for locked skills
    }
    if (p.$isMaxed) return '#d97706'; // Orange border for maxed skills
    if (p.$canUpgrade) return '#1e40af'; // Blue border for upgradeable skills
    return '#047857'; // Default green border
  }};

  box-shadow: ${(p) => {
    if (!p.$isUnlocked) {
      if (p.$canUnlock) return '0 0 15px rgba(16, 185, 129, 0.4)'; // Green glow for unlockable skills
      return '0 4px 6px rgba(0, 0, 0, 0.3)'; // Dark shadow for locked skills
    }
    if (p.$isMaxed) return '0 0 20px rgba(251, 191, 36, 0.5)'; // Orange glow for maxed skills
    if (p.$canUpgrade) return '0 0 15px rgba(59, 130, 246, 0.4)'; // Blue glow for upgradeable skills
    return '0 4px 6px rgba(0, 0, 0, 0.1)'; // Default shadow
  }};

  opacity: ${(p) => {
    if (p.$isUnlocked) return 1;
    if (p.$canUnlock) return 0.8; // More visible for unlockable skills
    return 0.5; // Less visible for locked skills
  }};

  &:hover {
    z-index: 20;
    .tooltip {
      opacity: 1;
      visibility: visible;
      transform: translateY(-5px);
    }
  }

  ${(p) =>
    p.$canUpgrade &&
    `
    animation: pulse 3s infinite;
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
      70% { box-shadow: 0 0 0 6px rgba(59,130,246,0); }
      100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
    }
  `}

  ${(p) =>
    p.$canUnlock &&
    `
    animation: unlockPulse 2s infinite;
    @keyframes unlockPulse {
      0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
      70% { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
      100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
    }
  `}

  .tier-indicator {
    position: absolute;
    top: -10px; right: -10px;
    width: 28px; height: 28px;
    border-radius: 50%;
    background: ${(p) => {
      switch (p.$tier) {
        case 1: return 'linear-gradient(145deg, #94a3b8, #64748b)';
        case 2: return 'linear-gradient(145deg, #10b981, #059669)';
        case 3: return 'linear-gradient(145deg, #3b82f6, #1d4ed8)';
        case 4: return 'linear-gradient(145deg, #8b5fd6, #7c3aed)';
        case 5: return 'linear-gradient(145deg, #f59e0b, #d97706)';
        default: return '#6b7280';
      }
    }};
    color: white;
    font-size: 0.8rem;
    font-weight: bold;
    display: flex; align-items: center; justify-content: center;
    border: 3px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }

  .rank-indicator {
    position: absolute;
    bottom: -10px;
    left: 50%; transform: translateX(-50%);
    background: ${(p) => p.theme.colors.primary.bg};
    color: ${(p) => p.theme.colors.accent.cyan};
    padding: 3px 10px;
    border-radius: ${(p) => p.theme.borderRadius.pill};
    font-size: 0.8rem; font-weight: bold;
    border: 2px solid ${(p) => p.theme.colors.accent.cyan};
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    min-width: 40px; text-align: center;
  }

  .unlock-indicator {
    position: absolute;
    top: -15px;
    left: -15px;
    background: #10b981;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    animation: unlockBounce 1.5s infinite;
    
    @keyframes unlockBounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }
  }
`;


// Removed unused TierLine component

const TierWrapper = styled.div`
  position: absolute;
  left: 50%;
  right: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 20px;
  width: 100%;
`;

const SkillHighlightOverlay = styled.div`
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: transparent;
  border: 3px solid #dc2626;
  border-radius: 14px;
  z-index: 15;
  animation: highlightPulse 0.6s ease-in-out infinite;
  box-shadow: 0 0 15px rgba(220, 38, 38, 0.8);
  
  @keyframes highlightPulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.8;
      border-color: #dc2626;
    }
    50% {
      transform: scale(1.05);
      opacity: 1;
      border-color: #ef4444;
    }
  }
`;

const SkillTooltip = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: ${(p) => p.theme.gradients.card};
  border: ${(p) => p.theme.borders.card};
  border-radius: ${(p) => p.theme.borderRadius.medium};
  padding: ${(p) => p.theme.spacing.md};
  white-space: normal;
  opacity: 0; visibility: hidden;
  transition: all 0.2s ease;
  z-index: 10000;
  min-width: 250px; max-width: 300px;
  box-shadow: ${(p) => p.theme.shadows.cardHover};
  font-size: 0.9rem;
  pointer-events: none;

  .skill-name {
    font-weight: bold;
    color: ${(p) => p.theme.colors.text.accent};
    font-size: 1.1rem;
    margin-bottom: ${(p) => p.theme.spacing.sm};
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .skill-meta {
    font-size: 0.8rem;
    color: ${(p) => p.theme.colors.text.muted};
    font-weight: normal;
    font-style: italic;
  }
  .skill-description {
    color: ${(p) => p.theme.colors.text.secondary};
    font-size: 0.9rem;
    margin-bottom: ${(p) => p.theme.spacing.md};
    line-height: 1.4;
  }
  .skill-effects {
    margin-bottom: ${(p) => p.theme.spacing.md};
    .effect {
      background: ${(p) => p.theme.colors.surface.dark};
      padding: ${(p) => p.theme.spacing.xs} ${(p) => p.theme.spacing.sm};
      border-radius: ${(p) => p.theme.borderRadius.small};
      margin-bottom: ${(p) => p.theme.spacing.xs};
      font-size: 0.8rem;
      border-left: 3px solid ${(p) => p.theme.colors.accent.cyan};
    }
  }
  .skill-cost {
    border-top: 1px solid ${(p) => p.theme.colors.surface.border};
    padding-top: ${(p) => p.theme.spacing.sm};
    font-size: 0.8rem;
    color: ${(p) => p.theme.colors.text.muted};
  }

  .prerequisites {
    margin-top: ${(p) => p.theme.spacing.sm};
    padding-top: ${(p) => p.theme.spacing.sm};
    border-top: 1px solid ${(p) => p.theme.colors.surface.border};
  }

  .prereq-title {
    font-weight: bold;
    font-size: 0.8rem;
    margin-bottom: ${(p) => p.theme.spacing.xs};
    color: ${(p) => p.theme.colors.text.accent};
  }

  .prereq-item {
    font-size: 0.75rem;
    padding: 2px 0;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .prereq-item.unlocked {
    color: #10b981;
  }

  .prereq-item.missing {
    color: #ef4444;
  }

  .skill-tree-tag {
    font-size: 0.7rem;
    color: ${(p) => p.theme.colors.text.muted};
    font-style: italic;
    margin-left: 4px;
  }

  .tier-tag {
    font-size: 0.7rem;
    background: ${(p) => p.theme.colors.surface.dark};
    color: ${(p) => p.theme.colors.accent.cyan};
    padding: 1px 4px;
    border-radius: 3px;
    margin-left: 4px;
    font-weight: bold;
  }
`;


export default function TechTree({
  playerProgression,
  skills: propSkills,
  dsRows,
  onSkillUpgrade,
  onSkillPreview,
  onAbilitiesUnlocked,
}: TechTreeProps) {
  const [hoveredSkill, setHoveredSkill] = useState<SkillNode | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [highlightedSkills, setHighlightedSkills] = useState<string[]>([]);
  const [highlightTimeout, setHighlightTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleSkillHover = (skill: SkillNode | null) => {
    setHoveredSkill(skill);
    onSkillPreview(skill);
  };

  const highlightMissingSkills = (missingSkillIds: string[]) => {
    // Clear any existing timeout
    if (highlightTimeout) {
      clearTimeout(highlightTimeout);
    }
    
    setHighlightedSkills(missingSkillIds);
    
    // Auto-hide highlights after 3 seconds
    const timeout = setTimeout(() => {
      setHighlightedSkills([]);
      setHighlightTimeout(null);
    }, 3000);
    
    setHighlightTimeout(timeout);
  };

  const handleSkillClick = (skill: SkillNode) => {
    // Check if skill can be unlocked/upgraded
    if (canUpgradeSkill(skill)) {
      onSkillUpgrade(skill.id);
      
      // Check for ability unlocks when upgrading
      const abilities = getAbilitiesFromSkill(skill);
      if (abilities.length > 0) {
        const abilityIds = abilities.map(a => a.id);
        onAbilitiesUnlocked?.(abilityIds);
      }
      return;
    }
    
    if (canUnlockSkill(skill)) {
      onSkillUpgrade(skill.id);
      
      // Check for ability unlocks when unlocking
      const abilities = getAbilitiesFromSkill(skill);
      if (abilities.length > 0) {
        const abilityIds = abilities.map(a => a.id);
        onAbilitiesUnlocked?.(abilityIds);
      }
      return;
    }
    
    // Skill cannot be unlocked/upgraded - highlight missing prerequisites
    const prereqInfo = getPrerequisiteInfo(skill);
    
    // Only highlight missing prerequisites if there are any
    if (!prereqInfo.hasPrereqs && prereqInfo.missingPrereqs.length > 0) {
      highlightMissingSkills(prereqInfo.missingPrereqs);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (highlightTimeout) {
        clearTimeout(highlightTimeout);
      }
    };
  }, [highlightTimeout]);

  // Build skills from either props or DS rows
  const derivedFromDs = dsRows?.length
    ? calculateTreePositions(mapDsToSkillNodes(dsRows, playerProgression))
    : undefined;

  // If caller provided propSkills, still (re)calculate positions in case they changed spacings
  const skillsWithPositions = propSkills?.length
    ? calculateTreePositions([...propSkills.map((s) => ({ ...s }))])
    : undefined;

  const skills = skillsWithPositions || derivedFromDs || [];
  
  // Log skill positions for debugging
  console.log('=== SKILL TREE POSITIONS ===');
  skills.forEach(skill => {
    console.log(`Skill: ${skill.name} (${skill.id})`, {
      position: skill.position,
      skillTree: skill.skillTree,
      tier: skill.tier,
      isUnlocked: skill.isUnlocked
    });
  });
  console.log('=== END SKILL POSITIONS ===');
  
  // Early guard
  if (!skills.length) {
    return (
      <TechTreeContainer>
        <TreeHeader>
          <h2>Skill Trees</h2>
          <ProgressionStats>
            <div className="stat"><div className="label">Level</div><div className="value">{playerProgression.totalLevel}</div></div>
            <div className="stat"><div className="label">Available SP</div><div className="value">{playerProgression.unspentSkillPoints}</div></div>
            <div className="stat"><div className="label">Total SP</div><div className="value">{playerProgression.skillPoints}</div></div>
            <div className="stat"><div className="label">Talent Points</div><div className="value">{playerProgression.unspentTalentPoints}</div></div>
          </ProgressionStats>
        </TreeHeader>
        <div style={{ opacity: 0.7 }}>No skills to display.</div>
      </TechTreeContainer>
    );
  }

  // Removed filteredSkills as we now show all trees in separate sections

  const canUpgradeSkill = (skill: SkillNode): boolean => {
    if (skill.isMaxed) return false;
    if ((playerProgression.unspentSkillPoints ?? 0) < (skill.cost.skillPoints ?? 0)) return false;
    if ((playerProgression.totalLevel ?? 1) < (skill.cost.level ?? 1)) return false;

    if (skill.tier === 1 && (!skill.prerequisites || !skill.prerequisites.length)) return true;

    const hasPrereqs = (skill.prerequisites ?? []).every((id) =>
      playerProgression.unlockedSkills.includes(id)
    );
    return hasPrereqs;
  };

  const canUnlockSkill = (skill: SkillNode): boolean => {
    if (skill.isUnlocked) return false; // Already unlocked
    if ((playerProgression.unspentSkillPoints ?? 0) < (skill.cost.skillPoints ?? 0)) return false;
    if ((playerProgression.totalLevel ?? 1) < (skill.cost.level ?? 1)) return false;

    // Check if prerequisites are met
    const hasPrereqs = (skill.prerequisites ?? []).every((id) =>
      playerProgression.unlockedSkills.includes(id)
    );
    return hasPrereqs;
  };

  const getPrerequisiteInfo = (skill: SkillNode) => {
    if (!skill.prerequisites || skill.prerequisites.length === 0) {
      return { hasPrereqs: true, missingPrereqs: [], unlockedPrereqs: [] };
    }

    const unlockedPrereqs = skill.prerequisites.filter(id => 
      playerProgression.unlockedSkills.includes(id)
    );
    const missingPrereqs = skill.prerequisites.filter(id => 
      !playerProgression.unlockedSkills.includes(id)
    );

    return {
      hasPrereqs: missingPrereqs.length === 0,
      missingPrereqs,
      unlockedPrereqs
    };
  };

  const getSkillInfoById = (skillId: string) => {
    const skill = skills.find(s => s.id === skillId);
    return skill ? { 
      name: skill.name, 
      skillTree: skill.skillTree, 
      tier: skill.tier 
    } : { 
      name: skillId, 
      skillTree: null, 
      tier: null 
    };
  };

  // Helper function to group skills by tier
  const groupSkillsByTier = (skills: SkillNode[]) => {
    return skills.reduce((acc, skill) => {
      if (!acc[skill.tier]) acc[skill.tier] = [];
      acc[skill.tier].push(skill);
      return acc;
    }, {} as Record<number, SkillNode[]>);
  };

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
            <div className="label">Available SP</div>
            <div className="value">{playerProgression.unspentSkillPoints}</div>
          </div>
          <div className="stat">
            <div className="label">Total SP</div>
            <div className="value">{playerProgression.skillPoints}</div>
          </div>
          <div className="stat">
            <div className="label">Talent Points</div>
            <div className="value">{playerProgression.unspentTalentPoints}</div>
          </div>
        </ProgressionStats>
      </TreeHeader>

      <TreeCanvas onMouseMove={handleMouseMove}>
        {/* Three Tree Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', width: '100%', height: '100%', minHeight: '900px', gap: '40px', padding: '0 40px' }}>
          
          {/* Combat Tree (Left) */}
          <TreeSection $treeType="combat" style={{ flex: 1, position: 'relative' }}>
            <TreeTitle $treeType="combat">Combat Tree</TreeTitle>
            <TreeStats $treeType="combat">
              <div className="stat">
                <div className="label">Points Spent</div>
                <div className="value">
                  {skills.filter(s => s.skillTree === SkillTreeType.COMBAT && s.isUnlocked).length}/
                  {skills.filter(s => s.skillTree === SkillTreeType.COMBAT).length}
                </div>
              </div>
              <div className="stat">
                <div className="label">Required Level</div>
                <div className="value">
                  {Math.max(...skills.filter(s => s.skillTree === SkillTreeType.COMBAT).map(s => s.cost.level))}
                </div>
              </div>
            </TreeStats>
            
            {/* SVG for connections */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
              {skills
                .filter(s => s.skillTree === SkillTreeType.COMBAT)
                .map(skill => {
                  const connections = (skill as SkillNode & { visual_connections?: string[] }).visual_connections || [];
                  return connections.map((connectionId: string, index: number) => {
                    const connectedSkill = skills.find(s => s.id === connectionId);
                    if (!connectedSkill) return null;
                    
                    const isActive = skill.isUnlocked && connectedSkill.isUnlocked;
                    return (
                      <SkillConnection
                        key={`${skill.id}-${connectionId}-${index}`}
                        $isActive={isActive}
                        $treeType="combat"
                        x1={skill.position.x}
                        y1={skill.position.y}
                        x2={connectedSkill.position.x}
                        y2={connectedSkill.position.y}
                      />
                    );
                  });
                })
                .flat()
                .filter(Boolean)}
            </svg>
            
            {/* Combat Skills */}
            {Object.entries(groupSkillsByTier(skills.filter(s => s.skillTree === SkillTreeType.COMBAT)))
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([tier, tierSkills]) => (
                <TierWrapper
                  key={`combat-tier-${tier}`}
                  style={{ top: `${200 + (parseInt(tier) - 1) * 120}px` }}
                >
                  {tierSkills.map((skill) => (
                    <SkillNodeComponent
                      key={skill.id}
                      $tier={skill.tier}
                      $isUnlocked={skill.isUnlocked}
                      $isMaxed={skill.isMaxed}
                      $canUpgrade={canUpgradeSkill(skill)}
                      $canUnlock={canUnlockSkill(skill)}
                      $position={{ x: 0, y: 0 }} // Position handled by TierWrapper
                      $skillTree={skill.skillTree}
                      onClick={() => handleSkillClick(skill)}
                      onMouseEnter={() => handleSkillHover(skill)}
                      onMouseLeave={() => handleSkillHover(null)}
                      title={skill.name}
                    >
                  {skill.icon}
                  <div className="tier-indicator">{skill.tier}</div>
                  {skill.currentRank > 0 && (
                    <div className="rank-indicator">
                      {skill.currentRank}/{skill.maxRank}
                    </div>
                  )}
                  {canUnlockSkill(skill) && (
                    <div className="unlock-indicator">🔓</div>
                  )}
                  {highlightedSkills.includes(skill.id) && (
                    <SkillHighlightOverlay />
                  )}
                    </SkillNodeComponent>
                  ))}
                </TierWrapper>
              ))}
          </TreeSection>

          {/* Crafting Tree (Middle) */}
          <TreeSection $treeType="crafting" style={{ flex: 1, position: 'relative' }}>
            <TreeTitle $treeType="crafting">Crafting Tree</TreeTitle>
            <TreeStats $treeType="crafting">
              <div className="stat">
                <div className="label">Points Spent</div>
                <div className="value">
                  {skills.filter(s => s.skillTree === SkillTreeType.CRAFTING && s.isUnlocked).length}/
                  {skills.filter(s => s.skillTree === SkillTreeType.CRAFTING).length}
                </div>
              </div>
              <div className="stat">
                <div className="label">Required Level</div>
                <div className="value">
                  {Math.max(...skills.filter(s => s.skillTree === SkillTreeType.CRAFTING).map(s => s.cost.level))}
                </div>
              </div>
            </TreeStats>
            
            {/* SVG for connections */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
              {skills
                .filter(s => s.skillTree === SkillTreeType.CRAFTING)
                .map(skill => {
                  const connections = (skill as SkillNode & { visual_connections?: string[] }).visual_connections || [];
                  return connections.map((connectionId: string, index: number) => {
                    const connectedSkill = skills.find(s => s.id === connectionId);
                    if (!connectedSkill) return null;
                    
                    const isActive = skill.isUnlocked && connectedSkill.isUnlocked;
        return (
                      <SkillConnection
                        key={`${skill.id}-${connectionId}-${index}`}
                        $isActive={isActive}
                        $treeType="crafting"
                        x1={skill.position.x}
                        y1={skill.position.y}
                        x2={connectedSkill.position.x}
                        y2={connectedSkill.position.y}
          />
        );
      });
                })
                .flat()
                .filter(Boolean)}
            </svg>
            
            {/* Crafting Skills */}
            {Object.entries(groupSkillsByTier(skills.filter(s => s.skillTree === SkillTreeType.CRAFTING)))
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([tier, tierSkills]) => (
                <TierWrapper
                  key={`crafting-tier-${tier}`}
                  style={{ top: `${200 + (parseInt(tier) - 1) * 120}px` }}
                >
                  {tierSkills.map((skill) => (
                    <SkillNodeComponent
                      key={skill.id}
                      $tier={skill.tier}
                      $isUnlocked={skill.isUnlocked}
                      $isMaxed={skill.isMaxed}
                      $canUpgrade={canUpgradeSkill(skill)}
                      $canUnlock={canUnlockSkill(skill)}
                      $position={{ x: 0, y: 0 }} // Position handled by TierWrapper
                      $skillTree={skill.skillTree}
                      onClick={() => handleSkillClick(skill)}
                      onMouseEnter={() => handleSkillHover(skill)}
                      onMouseLeave={() => handleSkillHover(null)}
                      title={skill.name}
                    >
                  {skill.icon}
                  <div className="tier-indicator">{skill.tier}</div>
                  {skill.currentRank > 0 && (
                    <div className="rank-indicator">
                      {skill.currentRank}/{skill.maxRank}
                    </div>
                  )}
                  {canUnlockSkill(skill) && (
                    <div className="unlock-indicator">🔓</div>
                  )}
                  {highlightedSkills.includes(skill.id) && (
                    <SkillHighlightOverlay />
                  )}
                    </SkillNodeComponent>
                  ))}
                </TierWrapper>
              ))}
          </TreeSection>

          {/* Magic Tree (Right) */}
          <TreeSection $treeType="magic" style={{ flex: 1, position: 'relative' }}>
            <TreeTitle $treeType="magic">Magic Tree</TreeTitle>
            <TreeStats $treeType="magic">
              <div className="stat">
                <div className="label">Points Spent</div>
                <div className="value">
                  {skills.filter(s => s.skillTree === SkillTreeType.MAGIC && s.isUnlocked).length}/
                  {skills.filter(s => s.skillTree === SkillTreeType.MAGIC).length}
                </div>
              </div>
              <div className="stat">
                <div className="label">Required Level</div>
                <div className="value">
                  {Math.max(...skills.filter(s => s.skillTree === SkillTreeType.MAGIC).map(s => s.cost.level))}
                </div>
              </div>
            </TreeStats>
            
            {/* SVG for connections */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
              {skills
                .filter(s => s.skillTree === SkillTreeType.MAGIC)
                .map(skill => {
                  const connections = (skill as SkillNode & { visual_connections?: string[] }).visual_connections || [];
                  return connections.map((connectionId: string, index: number) => {
                    const connectedSkill = skills.find(s => s.id === connectionId);
                    if (!connectedSkill) return null;
                    
                    const isActive = skill.isUnlocked && connectedSkill.isUnlocked;
                    return (
                      <SkillConnection
                        key={`${skill.id}-${connectionId}-${index}`}
                        $isActive={isActive}
                        $treeType="magic"
                        x1={skill.position.x}
                        y1={skill.position.y}
                        x2={connectedSkill.position.x}
                        y2={connectedSkill.position.y}
                      />
                    );
                  });
                })
                .flat()
                .filter(Boolean)}
            </svg>
            
            {/* Magic Skills */}
            {Object.entries(groupSkillsByTier(skills.filter(s => s.skillTree === SkillTreeType.MAGIC)))
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([tier, tierSkills]) => (
                <TierWrapper
                  key={`magic-tier-${tier}`}
                  style={{ top: `${200 + (parseInt(tier) - 1) * 120}px` }}
                >
                  {tierSkills.map((skill) => (
                    <SkillNodeComponent
                      key={skill.id}
                      $tier={skill.tier}
                      $isUnlocked={skill.isUnlocked}
                      $isMaxed={skill.isMaxed}
                      $canUpgrade={canUpgradeSkill(skill)}
                      $canUnlock={canUnlockSkill(skill)}
                      $position={{ x: 0, y: 0 }} // Position handled by TierWrapper
                      $skillTree={skill.skillTree}
                      onClick={() => handleSkillClick(skill)}
                      onMouseEnter={() => handleSkillHover(skill)}
                      onMouseLeave={() => handleSkillHover(null)}
                      title={skill.name}
                    >
        {skill.icon}
        <div className="tier-indicator">{skill.tier}</div>
        {skill.currentRank > 0 && (
          <div className="rank-indicator">
            {skill.currentRank}/{skill.maxRank}
          </div>
        )}
        {canUnlockSkill(skill) && (
          <div className="unlock-indicator">🔓</div>
        )}
        {highlightedSkills.includes(skill.id) && (
          <SkillHighlightOverlay />
        )}
                    </SkillNodeComponent>
                  ))}
                </TierWrapper>
              ))}
          </TreeSection>
  </div>
  
  {/* Global Tooltip */}
  {hoveredSkill && (
    <SkillTooltip
      style={{
        left: `${mousePosition.x}px`,
        top: `${mousePosition.y - 20}px`,
        opacity: 1,
        visibility: 'visible',
        transform: 'translate(-50%, -100%)'
      }}
    >
      <div className="skill-name">
        {hoveredSkill.name}
        <span className="skill-meta">
          T{hoveredSkill.tier} • {hoveredSkill.skillTree}
        </span>
      </div>
      <div className="skill-description">{hoveredSkill.description}</div>
      <div className="skill-effects">
        {(hoveredSkill.effects ?? []).map((e, i: number) => (
          <div key={i} className="effect">
            {e?.description ?? JSON.stringify(e)}
          </div>
        ))}
      </div>
      <div className="skill-cost">
        Cost: {hoveredSkill.cost.skillPoints ?? 0} SP | Level {hoveredSkill.cost.level ?? 1}
        {!!hoveredSkill.cost.gold && ` | ${hoveredSkill.cost.gold} Gold`}
      </div>
      {(() => {
        const prereqInfo = getPrerequisiteInfo(hoveredSkill);
        if (prereqInfo.hasPrereqs && hoveredSkill.prerequisites && hoveredSkill.prerequisites.length > 0) {
          return (
            <div className="prerequisites">
              <div className="prereq-title">✅ Prerequisites Met:</div>
              {prereqInfo.unlockedPrereqs.map((prereqId, i) => {
                const prereqInfo = getSkillInfoById(prereqId);
                return (
                  <div key={i} className="prereq-item unlocked">
                    ✓ {prereqInfo.name}
                    {prereqInfo.tier && (
                      <span className="tier-tag">T{prereqInfo.tier}</span>
                    )}
                    {prereqInfo.skillTree && (
                      <span className="skill-tree-tag">({prereqInfo.skillTree})</span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        } else if (!prereqInfo.hasPrereqs) {
          return (
            <div className="prerequisites">
              <div className="prereq-title">❌ Missing Prerequisites:</div>
              {prereqInfo.missingPrereqs.map((prereqId, i) => {
                const prereqInfo = getSkillInfoById(prereqId);
                return (
                  <div key={i} className="prereq-item missing">
                    ✗ {prereqInfo.name}
                    {prereqInfo.tier && (
                      <span className="tier-tag">T{prereqInfo.tier}</span>
                    )}
                    {prereqInfo.skillTree && (
                      <span className="skill-tree-tag">({prereqInfo.skillTree})</span>
                    )}
                  </div>
                );
              })}
              {prereqInfo.unlockedPrereqs.length > 0 && (
                <>
                  <div className="prereq-title" style={{ marginTop: '8px' }}>✅ Completed:</div>
                  {prereqInfo.unlockedPrereqs.map((prereqId, i) => {
                    const prereqInfo = getSkillInfoById(prereqId);
                    return (
                      <div key={i} className="prereq-item unlocked">
                        ✓ {prereqInfo.name}
                        {prereqInfo.tier && (
                          <span className="tier-tag">T{prereqInfo.tier}</span>
                        )}
                        {prereqInfo.skillTree && (
                          <span className="skill-tree-tag">({prereqInfo.skillTree})</span>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          );
        }
        return null;
      })()}
      {canUnlockSkill(hoveredSkill) && (
        <div className="unlock-status" style={{ color: '#10b981', fontWeight: 'bold', marginTop: '8px' }}>
          🔓 Ready to Unlock!
        </div>
      )}
    </SkillTooltip>
  )}
</TreeCanvas>


    </TechTreeContainer>
  );
}
