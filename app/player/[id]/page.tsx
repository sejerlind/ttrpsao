'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styled, { ThemeProvider } from 'styled-components';
import './player.scss';
import { theme } from './theme';
import { supabase } from '../../../lib/supabase';

// Import new components
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import CharacterHeader from '../../../components/player/CharacterHeader';
import ResourcesGrid from '../../../components/player/ResourcesGrid';
import AbilitiesSection from '../../../components/player/AbilitiesSection';
import FloatingTextList from '../../../components/common/FloatingText';
import { calculateDamageWithResistance, formatDamageInfo, getDamageTypeIcon } from '../../../lib/damageCalculation';

// Import types
import type { 
  Character, 
  Resources, 
  Ability, 
  Buff, 
  UsedAbility, 
  FloatingTextItem,
  GameSession,
  AbilityUsageLog,
  BattleEncounter,
  PlayerProgression
} from '../../../components/types';
import type { DatabaseCharacter } from '../../../lib/supabase';

// Import ability system
import { getPlayerAbilities, getAbilitiesFromUnlockedSkillsWithLevels, getStatBonusesFromSkills } from '../../../lib/abilityManager';

// Main container styled component
const Container = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.gradients.background};
  color: ${props => props.theme.colors.text.primary};
  padding: ${props => props.theme.spacing.xl};
  width: 100%;

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.md};
  }

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    padding: ${props => props.theme.spacing.xl} ${props => props.theme.spacing.lg};
  }

  @media (min-width: ${props => props.theme.breakpoints.wide}) {
    padding: ${props => props.theme.spacing.xl} ${props => props.theme.spacing.xxl};
  }
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.xl};
  padding-bottom: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.surface.border};

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${props => props.theme.spacing.md};
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.surface.card};
  border: 1px solid ${props => props.theme.colors.surface.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  color: ${props => props.theme.colors.text.primary};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.surface.hover};
    border-color: ${props => props.theme.colors.accent.cyan};
    transform: translateX(-2px);
  }

  &::before {
    content: '←';
    font-size: 1.2rem;
  }

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    font-size: 0.85rem;
  }
`;

const PageTitle = styled.h1`
  color: ${props => props.theme.colors.text.accent};
  font-size: 2rem;
  margin: 0;
  font-weight: 600;

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    font-size: 1.5rem;
  }

  @media (min-width: ${props => props.theme.breakpoints.wide}) {
    font-size: 2.5rem;
  }
`;

const SkillsButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.accent.cyan};
  color: ${props => props.theme.colors.primary.bg};
  border: none;
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.accent.blue};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.card};
  }

  &::before {
    content: '🌟';
    font-size: 1.2rem;
  }

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    font-size: 0.85rem;
  }
`;

const MainLayout = styled.div<{ $hasActiveSession?: boolean }>`
  display: grid;
  grid-template-columns: ${props => props.$hasActiveSession ? '1fr 300px' : '1fr'};
  gap: ${props => props.theme.spacing.xl};
  margin-top: ${props => props.theme.spacing.lg};
  min-height: calc(100vh - 200px);

  @media (max-width: ${props => props.theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
    gap: ${props => props.theme.spacing.lg};
  }
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: ${props => props.theme.spacing.xl};

  @media (max-width: ${props => props.theme.breakpoints.desktop}) {
    grid-template-columns: 1fr 320px;
    gap: ${props => props.theme.spacing.lg};
  }

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
    gap: ${props => props.theme.spacing.md};
  }

  @media (min-width: ${props => props.theme.breakpoints.wide}) {
    grid-template-columns: 1fr 420px;
    gap: ${props => props.theme.spacing.xxl};
  }

  /* Ultra-wide screens */
  @media (min-width: 1600px) {
    grid-template-columns: 1fr 480px;
    gap: ${props => props.theme.spacing.xxxl};
  }
`;

const StatsPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xl};

  @media (max-width: ${props => props.theme.breakpoints.desktop}) {
    margin-top: ${props => props.theme.spacing.xl};
  }
`;

const SessionSidebar = styled.div`
  position: sticky;
  top: 20px;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  overflow-y: auto;
  max-height: calc(100vh - 40px);
  padding: ${props => props.theme.spacing.lg};
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: ${props => props.theme.borderRadius.large};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    transition: background 0.2s ease;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  @media (max-width: ${props => props.theme.breakpoints.desktop}) {
    position: static;
    max-height: none;
    overflow-y: visible;
    margin-top: ${props => props.theme.spacing.xl};
    padding: 0;
    background: transparent;
    border: none;
    box-shadow: none;
    gap: ${props => props.theme.spacing.lg};
  }

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    order: -1;
  }
`;

const SessionCard = styled.div`
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.md};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  flex-shrink: 0; /* Prevent cards from shrinking */

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, ${props => props.theme.colors.accent.cyan}, ${props => props.theme.colors.accent.blue});
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  h3 {
    margin: 0 0 ${props => props.theme.spacing.md} 0;
    color: ${props => props.theme.colors.text.accent};
    font-size: 1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.sm};
    
    &:before {
      content: '';
      width: 3px;
      height: 14px;
      background: linear-gradient(135deg, ${props => props.theme.colors.accent.cyan}, ${props => props.theme.colors.accent.blue});
      border-radius: 2px;
    }
  }
`;

const TurnDisplay = styled.div`
  text-align: center;
  background: linear-gradient(135deg, #4ecdc4, #44a08d);
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  position: relative;
  overflow: hidden;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
  flex-shrink: 0; /* Prevent compression */

  &:before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    animation: shimmer 4s ease-in-out infinite;
  }

  @keyframes shimmer {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(180deg); }
  }

  .turn-number {
    font-size: 2.2rem;
    font-weight: 900;
    color: white;
    margin-bottom: ${props => props.theme.spacing.xs};
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    position: relative;
    z-index: 1;
  }

  .turn-label {
    font-size: 0.9rem;
    color: white;
    opacity: 0.95;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    position: relative;
    z-index: 1;
  }
`;

const SessionInfo = styled.div`
  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${props => props.theme.spacing.md} 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 0.9rem;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      margin: 0 -${props => props.theme.spacing.lg};
      padding-left: ${props => props.theme.spacing.lg};
      padding-right: ${props => props.theme.spacing.lg};
      border-radius: ${props => props.theme.borderRadius.small};
    }

    &:last-child {
      border-bottom: none;
    }

    .label {
      color: ${props => props.theme.colors.text.secondary};
      font-weight: 500;
      font-size: 0.85rem;
    }

    .value {
      color: ${props => props.theme.colors.text.primary};
      font-weight: 600;
      text-align: right;
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.9rem;
    }
  }

  .status {
    padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.md};
    border-radius: ${props => props.theme.borderRadius.pill};
    font-size: 0.75rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    
    &.active { 
      background: linear-gradient(135deg, #10b981, #059669);
      color: white; 
    }
    &.preparing { 
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white; 
    }
  }
`;

const PlayerMiniCard = styled.div<{ $isCurrentPlayer?: boolean }>`
  background: ${props => props.$isCurrentPlayer 
    ? 'linear-gradient(145deg, rgba(93, 211, 232, 0.15), rgba(74, 144, 226, 0.15))'
    : 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))'};
  border: 2px solid ${props => props.$isCurrentPlayer 
    ? props.theme.colors.accent.cyan 
    : 'rgba(255, 255, 255, 0.1)'};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.xs};
  font-size: 0.8rem;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
    border-color: ${props => props.$isCurrentPlayer 
      ? props.theme.colors.accent.cyan 
      : 'rgba(255, 255, 255, 0.2)'};
  }

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${props => props.$isCurrentPlayer 
      ? `linear-gradient(90deg, ${props.theme.colors.accent.cyan}, ${props.theme.colors.accent.blue})`
      : 'transparent'};
  }

  .player-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: ${props => props.theme.spacing.xs};

    .player-name {
      font-weight: bold;
      color: ${props => props.theme.colors.text.primary};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.85rem;
    }

    .you-badge {
      background: linear-gradient(135deg, ${props => props.theme.colors.accent.cyan}, ${props => props.theme.colors.accent.blue});
      color: white;
      padding: 1px 6px;
      border-radius: ${props => props.theme.borderRadius.pill};
      font-size: 0.6rem;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }
  }

  .player-details {
    color: ${props => props.theme.colors.text.secondary};
    font-size: 0.7rem;
    font-weight: 500;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .action-points {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 6px;
    border-radius: ${props => props.theme.borderRadius.pill};
    font-size: 0.65rem;
    font-weight: bold;
    
    .ap-icon {
      font-size: 0.7rem;
    }
    
    .ap-text {
      color: ${props => props.theme.colors.text.primary};
    }
    
    &.low-ap {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
      
      .ap-text {
        color: #ef4444;
      }
    }
    
    &.no-ap {
      background: rgba(127, 29, 29, 0.3);
      color: #dc2626;
      
      .ap-text {
        color: #dc2626;
      }
    }
  }
`;

const ActivityItem = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.xs};
  font-size: 0.75rem;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateX(2px);
  }

  &:before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(135deg, ${props => props.theme.colors.accent.cyan}, ${props => props.theme.colors.accent.blue});
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover:before {
    opacity: 1;
  }

  .activity-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;

    .player-name {
      font-weight: bold;
      color: ${props => props.theme.colors.text.primary};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.75rem;
    }

    .turn-info {
      font-size: 0.65rem;
      color: ${props => props.theme.colors.text.muted};
      white-space: nowrap;
      background: rgba(255, 255, 255, 0.1);
      padding: 1px 4px;
      border-radius: ${props => props.theme.borderRadius.pill};
      font-weight: 600;
    }
  }

  .ability-name {
    color: ${props => props.theme.colors.text.accent};
    font-weight: 600;
    font-size: 0.7rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const BuffsSection = styled.div`
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.card};

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    padding: ${props => props.theme.spacing.lg};
  }

  h3 {
    margin: 0 0 ${props => props.theme.spacing.lg} 0;
    color: ${props => props.theme.colors.text.accent};
    font-size: 1.3rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.sm};

    @media (max-width: ${props => props.theme.breakpoints.mobile}) {
      font-size: 1.1rem;
    }

    &::before {
      content: '✨';
      font-size: 1.2rem;
    }
  }

  .buffs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: ${props => props.theme.spacing.md};
    max-height: 200px;
    overflow-y: auto;

    @media (max-width: ${props => props.theme.breakpoints.mobile}) {
      grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
      gap: ${props => props.theme.spacing.sm};
    }
  }

  .no-effects {
    color: ${props => props.theme.colors.text.muted};
    font-style: italic;
    text-align: center;
    padding: ${props => props.theme.spacing.lg};
    background: ${props => props.theme.colors.surface.dark};
    border-radius: ${props => props.theme.borderRadius.medium};
    border: 1px dashed ${props => props.theme.colors.surface.border};
  }
`;

const BuffIcon = styled.div<{ $type: 'buff' | 'debuff' }>`
  width: 60px;
  height: 60px;
  border-radius: ${props => props.theme.borderRadius.large};
  background: ${props => props.$type === 'buff' 
    ? 'linear-gradient(145deg, #10b981, #059669)' 
    : 'linear-gradient(145deg, #ef4444, #dc2626)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.4rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border: 2px solid ${props => props.$type === 'buff' ? '#065f46' : '#991b1b'};
  box-shadow: ${props => props.theme.shadows.card};

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
  }

  @media (min-width: ${props => props.theme.breakpoints.wide}) {
    width: 70px;
    height: 70px;
    font-size: 1.6rem;
  }

  &:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: ${props => props.theme.shadows.cardHover};
    
    .tooltip {
      opacity: 1;
      visibility: visible;
      transform: translateY(-5px);
    }
  }

  &:active {
    transform: translateY(-2px) scale(1.02);
  }

  .tooltip {
    position: absolute;
    bottom: 120%;
    left: 50%;
    transform: translateX(-50%);
    background: ${props => props.theme.gradients.card};
    border: ${props => props.theme.borders.card};
    border-radius: ${props => props.theme.borderRadius.medium};
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    white-space: nowrap;
    font-size: 0.8rem;
    font-weight: normal;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
    z-index: 1000;
    color: ${props => props.theme.colors.text.primary};
    box-shadow: ${props => props.theme.shadows.cardHover};

    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: ${props => props.theme.colors.surface.card};
    }

    .effect-name {
      font-weight: bold;
      color: ${props => props.$type === 'buff' ? '#10b981' : '#ef4444'};
      margin-bottom: 2px;
    }

    .effect-description {
      color: ${props => props.theme.colors.text.secondary};
      font-size: 0.75rem;
    }

    .effect-duration {
      color: ${props => props.theme.colors.text.muted};
      font-size: 0.7rem;
      margin-top: 2px;
    }
  }
`;

const RecentlyUsedSection = styled.div`
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.card};

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    padding: ${props => props.theme.spacing.lg};
  }

  h3 {
    margin: 0 0 ${props => props.theme.spacing.lg} 0;
    color: ${props => props.theme.colors.text.accent};
    font-size: 1.3rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.sm};

    @media (max-width: ${props => props.theme.breakpoints.mobile}) {
      font-size: 1.1rem;
    }

    &::before {
      content: '⚡';
      font-size: 1.2rem;
    }
  }

  .recent-items {
    max-height: 300px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: ${props => props.theme.colors.accent.cyan} transparent;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: ${props => props.theme.colors.accent.cyan};
      border-radius: 3px;
    }
  }

  .recent-item {
    font-size: 0.9rem;
    padding: ${props => props.theme.spacing.md};
    border-bottom: 1px solid ${props => props.theme.colors.surface.border};
    transition: all 0.2s ease;
    
    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: ${props => props.theme.colors.surface.hover};
      border-radius: ${props => props.theme.borderRadius.small};
    }
    
    .ability-name {
      font-weight: bold;
      color: ${props => props.theme.colors.text.accent};
      margin-bottom: ${props => props.theme.spacing.xs};
    }
    
    .timestamp {
      color: ${props => props.theme.colors.text.muted};
      font-size: 0.75rem;
      float: right;
    }
    
    .effect {
      color: #10b981;
      font-size: 0.85rem;
      clear: both;
    }
  }

  .no-actions {
    color: ${props => props.theme.colors.text.muted};
    font-style: italic;
    text-align: center;
    padding: ${props => props.theme.spacing.lg};
    background: ${props => props.theme.colors.surface.dark};
    border-radius: ${props => props.theme.borderRadius.medium};
    border: 1px dashed ${props => props.theme.colors.surface.border};
  }
`;

const ModalBody = styled.div`
  .description {
    margin-bottom: ${props => props.theme.spacing.xl};
    color: ${props => props.theme.colors.text.primary};
    line-height: 1.6;
    font-size: 1rem;
    padding: ${props => props.theme.spacing.lg};
    background: ${props => props.theme.colors.surface.dark};
    border-radius: ${props => props.theme.borderRadius.medium};
    border: 1px solid ${props => props.theme.colors.surface.border};
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: ${props => props.theme.spacing.lg};
    margin-bottom: ${props => props.theme.spacing.xl};

    .stat {
      text-align: center;
      padding: ${props => props.theme.spacing.lg};
      background: ${props => props.theme.colors.surface.card};
      border-radius: ${props => props.theme.borderRadius.large};
      border: 1px solid ${props => props.theme.colors.surface.border};
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: ${props => props.theme.shadows.card};
      }

      .label {
        font-size: 0.85rem;
        color: ${props => props.theme.colors.text.muted};
        margin-bottom: ${props => props.theme.spacing.sm};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }

      .value {
        font-weight: bold;
        color: ${props => props.theme.colors.text.accent};
        font-size: 1.2rem;
      }
    }
  }

  .effects {
    h4 {
      color: ${props => props.theme.colors.text.accent};
      margin-bottom: ${props => props.theme.spacing.md};
      font-size: 1.1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: ${props => props.theme.spacing.sm};

      &::before {
        content: '⚔️';
        font-size: 1rem;
      }
    }

    .effect {
      padding: ${props => props.theme.spacing.md};
      margin-bottom: ${props => props.theme.spacing.sm};
      background: ${props => props.theme.colors.surface.card};
      border-radius: ${props => props.theme.borderRadius.medium};
      font-size: 0.9rem;
      border-left: 3px solid ${props => props.theme.colors.accent.cyan};
      transition: all 0.2s ease;

      &:hover {
        background: ${props => props.theme.colors.surface.hover};
        transform: translateX(4px);
      }

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid ${props => props.theme.colors.surface.border};
  border-top: 4px solid ${props => props.theme.colors.accent.cyan};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
  text-align: center;

  h1 {
    color: ${props => props.theme.colors.status.error};
    margin: 0;
  }

  p {
    color: ${props => props.theme.colors.text.muted};
    margin: 0;
  }
`;


export default function PlayerPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.id as string;

  // State management
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoadingCharacter, setIsLoadingCharacter] = useState(true);
  const [characterError, setCharacterError] = useState<string | null>(null);

  const [resources, setResources] = useState<Resources>({
    health: { current: 0, max: 0 },
    mana: { current: 0, max: 0 },
    stamina: { current: 0, max: 0 },
    actionPoints: { current: 0, max: 0 },
    armor: { current: 0 },
    magicResist: { current: 0 },
  });

  const [abilities, setAbilities] = useState<Ability[]>([]);
  const [isLoadingAbilities, setIsLoadingAbilities] = useState(true);
  const [manaRegen, setManaRegen] = useState<number>(10); // Store mana regen separately
  const [statBonuses, setStatBonuses] = useState<Record<string, number>>({});
  const [activeGameSession, setActiveGameSession] = useState<string | null>(null);
  const [currentGameTurn, setCurrentGameTurn] = useState<number>(1);
  const [battleEnemies, setBattleEnemies] = useState<BattleEncounter[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [showTargetSelection, setShowTargetSelection] = useState(false);

  // Session-related state
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [sessionPlayers, setSessionPlayers] = useState<DatabaseCharacter[]>([]);
  const [recentActivity, setRecentActivity] = useState<AbilityUsageLog[]>([]);

  const [buffs] = useState<Buff[]>([
    { id: '1', name: 'Swift', type: 'buff', duration: 45, icon: '⚡' },
    { id: '2', name: 'Blessed', type: 'buff', duration: 120, icon: '✨' },
    { id: '3', name: 'Poisoned', type: 'debuff', duration: 8, icon: '🟢' },
  ]);

  const [activeCategory, setActiveCategory] = useState<'all' | 'basic' | 'skill' | 'ultimate' | 'bonuses'>('all');
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [recentlyUsedAbilities, setRecentlyUsedAbilities] = useState<UsedAbility[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);
  const [playerProgression, setPlayerProgression] = useState<PlayerProgression | null>(null);

  // Load character data from Supabase
  const loadCharacter = useCallback(async (currentStatBonuses: Record<string, number>) => {
    try {
      console.log('🔄 Starting loadCharacter with playerId:', playerId);
      console.log('📊 Current stat bonuses:', currentStatBonuses);
      setIsLoadingCharacter(true);
      setCharacterError(null);
      
      if (!supabase) {
        console.error('❌ Supabase not configured');
        setCharacterError('Database not configured');
        return;
      }

      if (!playerId) {
        console.error('❌ No player ID provided');
        setCharacterError('No player ID provided');
        return;
      }

      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', playerId)
        .single();

      // Also load player progression for abilities
      const { data: progressionData, error: progressionError } = await supabase
        .from('player_progression')
        .select('*')
        .eq('character_id', playerId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setCharacterError('Player not found');
        } else {
          console.error('Error loading character:', error);
          setCharacterError('Failed to load player data');
        }
        return;
      }

      // Transform database character to component format
      const character: Character = {
        id: data.id,
        name: data.name,
        class: data.class,
        level: data.level,
        experience: data.experience,
        experienceToNext: data.experience_to_next,
      };

      // Apply stat bonuses to resources
      const baseHealth = data.health_max + (currentStatBonuses.health || 0);
      const baseMana = data.mana_max + (currentStatBonuses.mana || 0);
      const baseArmor = data.armor_current + (currentStatBonuses.armor || 0);
      const baseMagicResist = data.magic_resist_current + (currentStatBonuses.magic_resist || 0);
      
      const resources: Resources = {
        health: { 
          current: Math.min(data.health_current, baseHealth), 
          max: baseHealth 
        },
        mana: { 
          current: Math.min(data.mana_current, baseMana), 
          max: baseMana 
        },
        stamina: { current: data.stamina_current, max: data.stamina_max },
        actionPoints: { current: data.action_points_current, max: data.action_points_max },
        armor: { current: baseArmor },
        magicResist: { current: baseMagicResist },
        bonuses: {
          attack_damage: currentStatBonuses.attack_damage || 0,
          health: currentStatBonuses.health || 0,
          mana: currentStatBonuses.mana || 0,
          armor: currentStatBonuses.armor || 0,
          magic_resist: currentStatBonuses.magic_resist || 0,
          mana_regen: currentStatBonuses.mana_regen || 0,
          crit_chance: currentStatBonuses.crit_chance || 0,
          crit_damage: currentStatBonuses.crit_damage || 0,
          attack_speed: currentStatBonuses.attack_speed || 0,
          movement_speed: currentStatBonuses.movement_speed || 0
        }
      };

      setCharacter(character);
      setResources(resources);
      // Store mana regen (default to 10 if not set)
      setManaRegen(data.mana_regen || 10);

      // Process player progression data
      if (progressionData && !progressionError) {
        const progression: PlayerProgression = {
          totalLevel: progressionData.total_level || data.level,
          skillPoints: progressionData.skill_points || data.level * 2,
          unspentSkillPoints: progressionData.unspent_skill_points || 0,
          levelSkillPoints: progressionData.level_skill_points || data.level * 2,
          talentPoints: progressionData.talent_points || Math.floor(data.level / 2),
          unspentTalentPoints: progressionData.unspent_talent_points || 0,
          skillTrees: {
            combat: { totalPointsSpent: 0, highestTierUnlocked: 1, specializations: [], masteryBonus: 0 },
            magic: { totalPointsSpent: 0, highestTierUnlocked: 1, specializations: [], masteryBonus: 0 },
            crafting: { totalPointsSpent: 0, highestTierUnlocked: 1, specializations: [], masteryBonus: 0 },
            exploration: { totalPointsSpent: 0, highestTierUnlocked: 1, specializations: [], masteryBonus: 0 },
            social: { totalPointsSpent: 0, highestTierUnlocked: 1, specializations: [], masteryBonus: 0 },
            defensive: { totalPointsSpent: 0, highestTierUnlocked: 1, specializations: [], masteryBonus: 0 }
          },
          unlockedSkills: [],
          masteryLevels: {},
          unlockedAbilities: progressionData.unlocked_abilities || []
        };
        setPlayerProgression(progression);
      } else {
        // Create default progression if not found
        const defaultProgression: PlayerProgression = {
          totalLevel: data.level,
          skillPoints: data.level * 2,
          unspentSkillPoints: 0,
          levelSkillPoints: data.level * 2,
          talentPoints: Math.floor(data.level / 2),
          unspentTalentPoints: 0,
          skillTrees: {
            combat: { totalPointsSpent: 0, highestTierUnlocked: 1, specializations: [], masteryBonus: 0 },
            magic: { totalPointsSpent: 0, highestTierUnlocked: 1, specializations: [], masteryBonus: 0 },
            crafting: { totalPointsSpent: 0, highestTierUnlocked: 1, specializations: [], masteryBonus: 0 },
            exploration: { totalPointsSpent: 0, highestTierUnlocked: 1, specializations: [], masteryBonus: 0 },
            social: { totalPointsSpent: 0, highestTierUnlocked: 1, specializations: [], masteryBonus: 0 },
            defensive: { totalPointsSpent: 0, highestTierUnlocked: 1, specializations: [], masteryBonus: 0 }
          },
          unlockedSkills: [],
          masteryLevels: {},
          unlockedAbilities: []
        };
        setPlayerProgression(defaultProgression);
      }
    } catch (error) {
      console.error('Failed to load character:', error);
      setCharacterError('Unexpected error occurred');
    } finally {
      setIsLoadingCharacter(false);
    }
  }, [playerId]);

  // Load unlocked skills from database
  const loadUnlockedSkills = useCallback(async () => {
    if (!supabase || !playerId) return [];
    
    try {
      const { data: skills, error: skillsError } = await supabase
        .from('character_skills')
        .select('skill_id, is_unlocked')
        .eq('character_id', playerId)
        .eq('is_unlocked', true);
        
      if (skillsError) {
        console.error('❌ Error loading skills:', skillsError);
        return [];
      }
      
      const skillIds = skills?.map(s => s.skill_id) || [];
      
      return skillIds;
    } catch (error) {
      console.error('❌ Failed to load unlocked skills:', error);
      return [];
    }
  }, [playerId]);


  // Load abilities using the new ability system with skill levels
  const loadAbilities = useCallback(async (progression: PlayerProgression, skills: string[] = []) => {
    try {
      setIsLoadingAbilities(true);
      
      // Get abilities from both sources
      const directAbilities = getPlayerAbilities(progression);
      const skillAbilities = await getAbilitiesFromUnlockedSkillsWithLevels(playerId!, skills);
      
      // Combine and deduplicate abilities
      const allAbilities = [...directAbilities];
      skillAbilities.forEach(skillAbility => {
        if (!allAbilities.find(a => a.id === skillAbility.id)) {
          allAbilities.push(skillAbility);
        }
      });
      
      console.log(`✅ Loaded ${allAbilities.length} abilities for character ${playerId}`);
      
      setAbilities(allAbilities);
      
    } catch (error) {
      console.error('❌ Failed to load player abilities:', error);
      setAbilities([]);
    } finally {
      setIsLoadingAbilities(false);
    }
  }, [playerId]);

  // Load battle encounters for combat targeting
  const loadBattleEnemies = async (sessionId: string) => {
    if (!supabase) return;

    try {
      console.log('🔍 Loading battle enemies from database for session:', sessionId);
      const { data: encounters, error } = await supabase
        .from('active_battle_encounters')
        .select('*')
        .eq('game_session_id', sessionId)
        .order('turn_order_position', { ascending: true });

      if (!error && encounters) {
        setBattleEnemies(encounters);
        console.log('🎯 Loaded battle enemies from database for targeting:', encounters.map(e => `${e.enemy_name}: ${e.enemy_health_current}/${e.enemy_health_max} HP - Level ${e.enemy_level}`));
      } else if (error) {
        console.error('❌ Error loading battle enemies from database:', error);
      } else {
        console.log('ℹ️ No battle enemies found in database for session:', sessionId);
      }
    } catch (error) {
      console.error('Error loading battle enemies:', error);
    }
  };

  // Check if this character is in any active game sessions
  // Load session players and activity
  const loadSessionData = async (sessionId: string) => {
    if (!supabase) return;

    try {
      // Load other players in the session with their current action points
      const { data: playersData, error: playersError } = await supabase
        .from('game_session_players')
        .select(`
          character_id,
          characters!inner(
            id,
            name,
            class,
            level,
            action_points_current,
            action_points_max
          )
        `)
        .eq('game_session_id', sessionId)
        .eq('is_active', true);

      if (!playersError && playersData) {
        const players = playersData.map(p => p.characters).filter(Boolean) as unknown as DatabaseCharacter[];
        setSessionPlayers(players);
      }

      // Load recent activity
      const { data: activityData, error: activityError } = await supabase
        .from('ability_usage_log')
        .select(`
          *,
          characters!inner(name),
          Abilities!inner(name, description)
        `)
        .eq('game_session_id', sessionId)
        .order('used_at', { ascending: false })
        .limit(10);

      if (!activityError && activityData) {
        const activities = activityData.map(activity => ({
          ...activity,
          character_name: activity.characters?.name,
          ability_name: activity.Abilities?.name,
          ability_description: activity.Abilities?.description
        }));
        setRecentActivity(activities);
      }
    } catch (error) {
      console.error('Error loading session data:', error);
    }
  };

  const checkActiveGameSession = useCallback(async () => {
    if (!supabase || !character) {
      console.log('🔍 Cannot check game session - missing supabase or character');
      return;
    }

    console.log('🔍 Checking for active game sessions for character:', character.name, character.id);

    try {
      const { data, error } = await supabase
        .from('game_session_players')
        .select(`
          game_session_id,
          game_sessions!inner(
            id,
            status,
            name,
            current_turn
          )
        `)
        .eq('character_id', character.id)
        .eq('is_active', true)
        .eq('game_sessions.status', 'active')
        .limit(1);

      if (error) {
        console.error('❌ Error checking active game session:', error);
        return;
      }

      console.log('🔍 Game session query results:', data);

      if (data && data.length > 0) {
        const sessionData = data[0];
        const gameSession = sessionData.game_sessions as unknown as GameSession;
        setActiveGameSession(sessionData.game_session_id);
        setCurrentGameTurn(gameSession?.current_turn || 1);
        setGameSession(gameSession);
        console.log('✅ Found active game session:', {
          sessionId: sessionData.game_session_id,
          sessionName: gameSession?.name,
          status: gameSession?.status,
          currentTurn: gameSession?.current_turn
        });

        // Load session players and activity
        loadSessionData(sessionData.game_session_id);
        // Load battle enemies for targeting
        loadBattleEnemies(sessionData.game_session_id);
      } else {
        setActiveGameSession(null);
        setCurrentGameTurn(1);
        setGameSession(null);
        setSessionPlayers([]);
        setRecentActivity([]);
        console.log('ℹ️ No active game sessions found for this character');
      }
    } catch (error) {
      console.error('❌ Unexpected error checking active game session:', error);
    }
  }, [character]);

  // Load character and stat bonuses when playerId changes
  useEffect(() => {
    if (playerId) {
      console.log('🚀 useEffect triggered for playerId:', playerId);
      const loadData = async () => {
        try {
          console.log('📊 Loading stat bonuses...');
          // Load stat bonuses first
          const bonuses = await getStatBonusesFromSkills(playerId);
          console.log('✅ Stat bonuses loaded:', bonuses);
          setStatBonuses(bonuses);
          // Then load character with the stat bonuses
          console.log('👤 Loading character...');
          await loadCharacter(bonuses);
          console.log('✅ Character loaded successfully');
        } catch (error) {
          console.error('❌ Error in loadData:', error);
        }
      };
      loadData();
    }
  }, [playerId, loadCharacter]);

  // Load abilities when player progression changes
  useEffect(() => {
    if (playerProgression) {
      // Load skills first, then abilities
      loadUnlockedSkills().then(skills => {
        loadAbilities(playerProgression, skills);
      });
    }
  }, [playerProgression, loadAbilities, loadUnlockedSkills]);

  // Check for active game sessions when character loads
  useEffect(() => {
    if (character) {
      checkActiveGameSession();
    }
  }, [character, checkActiveGameSession]);

  // Calculate damage using the enhanced damage system

  // Log ability usage to database for GM tracking
  const logAbilityUsage = async (ability: Ability, effectDescription: string, targetDescription?: string, actualDamage?: number) => {
    console.log('🎯 Attempting to log ability usage:', {
      ability: ability.name,
      effect: effectDescription,
      hasSupabase: !!supabase,
      activeGameSession,
      hasCharacter: !!character,
      characterId: character?.id
    });

    // Only log if we're in an active game session and have database access
    if (!supabase) {
      console.log('❌ No Supabase connection available');
      return;
    }
    
    if (!activeGameSession) {
      console.log('❌ No active game session found');
      return;
    }
    
    if (!character) {
      console.log('❌ No character data available');
      return;
    }

    try {
      console.log('📤 Sending ability usage to database...');
      
      const { data, error } = await supabase
        .from('ability_usage_log')
        .insert({
          game_session_id: activeGameSession,
          character_id: character.id,
          ability_id: ability.id,
          effect_description: effectDescription,
          damage_dealt: actualDamage ? actualDamage.toString() : null,
          mana_cost_paid: ability.manaCost || 0,
          action_points_used: 1,
          turn_used: currentGameTurn,
          target_description: targetDescription || null,
          notes: null
        })
        .select();

      if (error) {
        console.error('❌ Database error logging ability usage:', error);
        return;
      }

      console.log('✅ Ability usage logged successfully:', data);

      // Update character's action points and mana in database to keep everything in sync
      const { error: updateError } = await supabase
        .from('characters')
        .update({ 
          action_points_current: Math.max(0, resources.actionPoints.current - 1),
          mana_current: Math.max(0, resources.mana.current - (ability.manaCost || 0))
        })
        .eq('id', character.id);

      if (updateError) {
        console.error('❌ Failed to update character resources:', updateError);
      } else {
        console.log('✅ Character resources updated in database');
      }

      // Refresh session data to update action points display for all players
      loadSessionData(activeGameSession);
    } catch (error) {
      console.error('❌ Unexpected error logging ability usage:', error);
    }
  };

  // Turn-based cooldown system (no auto-decrement)
  // Cooldowns now only decrease when GM advances turn
  const reduceCooldowns = () => {
    setAbilities(prev => prev.map(ability => ({
      ...ability,
      currentCooldown: Math.max(0, ability.currentCooldown - 1)
    })));
  };

  // Reset Action Points and regenerate mana when turn advances
  const resetActionPoints = () => {
    setResources(prev => ({
      ...prev,
      actionPoints: {
        ...prev.actionPoints,
        current: prev.actionPoints.max
      }
    }));
  };

  // Note: Mana regeneration is handled automatically by the database 
  // when the GM advances turns, so no client-side function is needed

  // Listen for turn advance events from GM
  useEffect(() => {
    if (!supabase || !activeGameSession) return;

    console.log('🔔 Setting up turn monitoring for session:', activeGameSession);

    // Method 1: Realtime subscription (primary)
    const channel = supabase
      .channel(`game-session-${activeGameSession}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${activeGameSession}`
      }, (payload) => {
        console.log('🔄 Realtime turn update received:', payload);
        if (payload.new && payload.new.current_turn) {
          const newTurn = payload.new.current_turn;
          if (newTurn > currentGameTurn) {
            console.log(`🎯 Turn advanced from ${currentGameTurn} to ${newTurn}, reducing cooldowns, resetting Action Points, and regenerating mana`);
            setCurrentGameTurn(newTurn);
            reduceCooldowns();
            resetActionPoints();
            // Note: Mana regen will be handled by the database and session refresh
            // Refresh session data when turn advances
            if (activeGameSession) {
              loadSessionData(activeGameSession);
            }
          }
        }
      })
      .subscribe();

    // Method 2: Polling backup (secondary - in case realtime fails)
    const pollInterval = setInterval(async () => {
      if (!supabase) return;
      
      try {
        const { data, error } = await supabase
          .from('game_sessions')
          .select('current_turn')
          .eq('id', activeGameSession)
          .single();

        if (!error && data && data.current_turn > currentGameTurn) {
          console.log(`🔄 Polling detected turn advance from ${currentGameTurn} to ${data.current_turn}`);
          setCurrentGameTurn(data.current_turn);
          reduceCooldowns();
          resetActionPoints();
          // Note: Mana regen will be handled by the database and session refresh
          // Refresh session data when turn advances
          if (activeGameSession) {
            loadSessionData(activeGameSession);
          }
        }
      } catch (error) {
        console.error('Error polling for turn updates:', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => {
      console.log('🔕 Cleaning up turn monitoring');
      if (supabase) {
        supabase.removeChannel(channel);
      }
      clearInterval(pollInterval);
    };
  }, [activeGameSession, currentGameTurn]);

  // Cleanup recently used abilities
  useEffect(() => {
    const cleanup = setInterval(() => {
      setRecentlyUsedAbilities(prev => 
        prev.filter(used => Date.now() - used.timestamp.getTime() < 10000)
      );
    }, 1000);

    return () => clearInterval(cleanup);
  }, []);

  // Cleanup floating texts
  useEffect(() => {
    const cleanup = setInterval(() => {
      setFloatingTexts(prev => 
        prev.filter(text => Date.now() - parseInt(text.id) < 2000)
      );
    }, 2000);

    return () => clearInterval(cleanup);
  }, []);

  // Helper functions
  const handleAbilityClick = (ability: Ability) => {
    setSelectedAbility(ability);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedAbility(null);
  };

  const canUseAbility = (ability: Ability): boolean => {
    return ability.currentCooldown === 0 && 
           resources.mana.current >= (ability.manaCost || 0) &&
           resources.actionPoints.current > 0;
  };

  const handleUseAbility = async (ability: Ability, event: React.MouseEvent) => {
    if (!canUseAbility(ability)) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const errorText: FloatingTextItem = {
        id: Date.now().toString(),
        text: ability.currentCooldown > 0 ? 'On Cooldown!' : 'Not Enough Resources!',
        x: rect.left + rect.width / 2,
        y: rect.top,
        type: 'error'
      };
      setFloatingTexts(prev => [...prev, errorText]);
      return;
    }

    // Check if in combat and ability requires targeting
    const inCombat = battleEnemies.length > 0;
    const needsTarget = inCombat && (ability.damage || ability.effects?.some(e => e.toLowerCase().includes('heal')));

    if (needsTarget && !selectedTarget) {
      // Show target selection
      setShowTargetSelection(true);
      setCurrentSelectedAbility(ability);
      return;
    }

    await executeAbility(ability, event);
  };

  const [currentSelectedAbility, setCurrentSelectedAbility] = useState<Ability | null>(null);

  const executeAbility = async (ability: Ability, event: React.MouseEvent) => {
    // Use ability
    setAbilities(prev => prev.map(a => 
      a.id === ability.id 
        ? { ...a, currentCooldown: a.cooldownMax }
        : a
    ));

    setResources(prev => ({
      ...prev,
      mana: { 
        ...prev.mana, 
        current: Math.max(0, prev.mana.current - (ability.manaCost || 0))
      },
      actionPoints: {
        ...prev.actionPoints,
        current: Math.max(0, prev.actionPoints.current - 1)
      }
    }));

    // Calculate actual damage with resistance
    let effectDescription = '';
    let targetDescription = '';
    let actualDamage = 0; // Default damage amount

    if (selectedTarget && selectedTarget.startsWith('enemy_')) {
      const encounterId = selectedTarget.replace('enemy_', '');
      const targetEnemy = battleEnemies.find(e => e.encounter_id === encounterId);
      
      if (targetEnemy && ability.damage && supabase) {
        // Calculate damage with enemy's armor/magic resistances
        const damageInfo = calculateDamageWithResistance(
          ability.damage,
          { 
            armor_current: targetEnemy.armor_value || targetEnemy.defense || 0,
            magic_resist_current: targetEnemy.magic_resist_value || 0
          },
          ability
        );
        
        actualDamage = damageInfo.finalDamage;
        
        // Apply damage to enemy
        const newHealth = Math.max(0, targetEnemy.enemy_health_current - actualDamage);
        
        const { error: enemyUpdateError } = await supabase
          .from('battle_encounters')
          .update({
            enemy_health_current: newHealth,
            updated_at: new Date().toISOString()
          })
          .eq('id', encounterId);

        if (!enemyUpdateError) {
          const damageTypeIcon = getDamageTypeIcon(damageInfo.damageType);
          effectDescription = `${damageTypeIcon} ${formatDamageInfo(damageInfo)} to ${targetEnemy.enemy_name}`;
          targetDescription = targetEnemy.enemy_name || 'Unknown Enemy';
          
          if (newHealth <= 0) {
            effectDescription += ' (DEFEATED!)';
            // Mark enemy as inactive
            await supabase
              .from('battle_encounters')
              .update({ is_active: false })
              .eq('id', encounterId);
          }
        }
      }
    } else if (selectedTarget && selectedTarget.startsWith('player_')) {
      const playerId = selectedTarget.replace('player_', '');
      const targetPlayer = sessionPlayers.find(p => p.id === playerId);
      
      if (targetPlayer && ability.effects?.some(e => e.toLowerCase().includes('heal')) && supabase) {
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
          targetDescription = targetPlayer.name;
        }
      }
    }

    // Fallback effect description
    if (!effectDescription) {
      effectDescription = ability.damage ? `Dealt ${actualDamage || ability.damage} damage` : ability.effects?.[0] || 'Effect applied';
    }

    // Add to recently used
    const usedAbility: UsedAbility = {
      abilityName: ability.name,
      timestamp: new Date(),
      effect: effectDescription
    };
    setRecentlyUsedAbilities(prev => [usedAbility, ...prev.slice(0, 4)]);

    // Log ability usage to database for GM tracking
    await logAbilityUsage(ability, effectDescription, targetDescription, actualDamage);

    // Show floating text
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const floatingText: FloatingTextItem = {
      id: Date.now().toString(),
      text: actualDamage > 0 ? `${actualDamage} DMG` : effectDescription,
      x: rect.left + rect.width / 2,
      y: rect.top,
      type: actualDamage > 0 ? 'damage' : 'effect'
    };
    setFloatingTexts(prev => [...prev, floatingText]);

    // Reset selection and close modal
    setSelectedTarget(null);
    setShowTargetSelection(false);
    setCurrentSelectedAbility(null);
    handleCloseModal();
  };

  const isRecentlyUsed = (abilityId: string): boolean => {
    return recentlyUsedAbilities.some(used => 
      used.abilityName === abilities.find(a => a.id === abilityId)?.name &&
      Date.now() - used.timestamp.getTime() < 3000
    );
  };

  const getBuffDescription = (buff: Buff): string => {
    switch (buff.name) {
      case 'Swift':
        return 'Increases movement and attack speed by 25%';
      case 'Blessed':
        return 'Regenerates health and mana over time';
      case 'Poisoned':
        return 'Takes damage over time and reduces healing';
      default:
        return buff.type === 'buff' ? 'Positive effect' : 'Negative effect';
    }
  };

  // Loading state
  if (isLoadingCharacter) {
    return (
      <ThemeProvider theme={theme}>
        <LoadingContainer>
          <LoadingSpinner />
          <h2>Loading Player Data...</h2>
          <p>Player ID: {playerId}</p>
        </LoadingContainer>
      </ThemeProvider>
    );
  }

  // Error state
  if (characterError || !character) {
    return (
      <ThemeProvider theme={theme}>
        <ErrorContainer>
          <h1>Player Not Found</h1>
          <p>{characterError || 'Unable to load player data'}</p>
          <p>Player ID: {playerId}</p>
          <Button onClick={() => router.push('/')}>
            Go Home
          </Button>
        </ErrorContainer>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <PageHeader>
          <BackButton onClick={() => router.back()}>
            Back
          </BackButton>
          <PageTitle>Player: {character.name}</PageTitle>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {activeGameSession && (
              <SkillsButton 
                onClick={() => router.push('/playing')}
                style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
              >
                ⚔️ Combat Overview
              </SkillsButton>
            )}
            <SkillsButton onClick={() => router.push(`/player/${params.id}/skills`)}>
              Skills
            </SkillsButton>
          </div>
        </PageHeader>
        
        {/* Game Session Status Indicator */}
        {activeGameSession && (
          <div style={{
            padding: '12px 20px',
            margin: '12px 0',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '12px',
            textAlign: 'center',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '16px' }}>🎮</span>
              <span>IN ACTIVE GAME SESSION - Abilities will be tracked</span>
              <span style={{ 
                background: 'rgba(255, 255, 255, 0.2)', 
                padding: '4px 8px', 
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                Turn {currentGameTurn}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                onClick={() => router.push(`/player/${playerId}/playing`)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease'
                }}
              >
                ⚔️ Battle View
              </Button>
              <Button
                onClick={() => router.push('/playing')}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease'
                }}
              >
                📊 Overview
              </Button>
            </div>
          </div>
        )}
        
        <CharacterHeader character={character} resources={resources} />
        
        <ResourcesGrid resources={resources} manaRegen={manaRegen} />


        <MainLayout $hasActiveSession={!!activeGameSession}>
          <MainContent>
            <AbilitiesSection
              abilities={abilities}
              activeCategory={activeCategory}
              isLoading={isLoadingAbilities}
              onCategoryChange={setActiveCategory}
              onAbilityClick={handleAbilityClick}
              isRecentlyUsed={isRecentlyUsed}
              statBonuses={statBonuses}
            />

            <StatsPanel>
              <BuffsSection>
                <h3>Active Effects</h3>
                <div className="buffs-grid">
                  {buffs.map(buff => (
                    <BuffIcon 
                      key={buff.id} 
                      $type={buff.type}
                    >
                      {buff.icon}
                      <div className="tooltip">
                        <div className="effect-name">{buff.name}</div>
                        <div className="effect-description">{getBuffDescription(buff)}</div>
                        <div className="effect-duration">Duration: {buff.duration}s</div>
                      </div>
                    </BuffIcon>
                  ))}
                </div>
              </BuffsSection>

              <RecentlyUsedSection>
                <h3>Recent Actions</h3>
                {recentlyUsedAbilities.length === 0 ? (
                  <div className="no-actions">No recent actions</div>
                ) : (
                  <div className="recent-items">
                    {recentlyUsedAbilities.map((used, index) => (
                      <div key={index} className="recent-item">
                        <div className="ability-name">{used.abilityName}</div>
                        <div className="effect">{used.effect}</div>
                        <div className="timestamp">{used.timestamp.toLocaleTimeString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </RecentlyUsedSection>
            </StatsPanel>
          </MainContent>

          {/* Session Sidebar - Always visible on the right when in active session */}
          {activeGameSession && gameSession && (
            <SessionSidebar>
              {/* Turn Display */}
              <TurnDisplay>
                <div className="turn-number">{currentGameTurn}</div>
                <div className="turn-label">Turn</div>
              </TurnDisplay>

              {/* Session Info */}
              <SessionCard>
                <h3>Session Info</h3>
                <SessionInfo>
                  <div className="info-item">
                    <span className="label">Name:</span>
                    <span className="value">{gameSession.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">GM:</span>
                    <span className="value">{gameSession.gm_name}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Status:</span>
                    <span className={`status ${gameSession.status}`}>
                      {gameSession.status}
                    </span>
                  </div>
                </SessionInfo>
              </SessionCard>

              {/* Players */}
              <SessionCard>
                <h3>Players ({sessionPlayers.length})</h3>
                {sessionPlayers.map(player => {
                  const actionPoints = player.action_points_current || 0;
                  const maxActionPoints = player.action_points_max || 1;
                  const apClass = actionPoints === 0 ? 'no-ap' : actionPoints <= Math.floor(maxActionPoints * 0.3) ? 'low-ap' : '';
                  
                  return (
                    <PlayerMiniCard 
                      key={player.id}
                      $isCurrentPlayer={player.id === playerId}
                    >
                      <div className="player-header">
                        <div className="player-name">{player.name}</div>
                        {player.id === playerId && (
                          <div className="you-badge">You</div>
                        )}
                      </div>
                      <div className="player-details">
                        <span>{player.class} • Level {player.level}</span>
                        <div className={`action-points ${apClass}`}>
                          <span className="ap-icon">⚡</span>
                          <span className="ap-text">{actionPoints}/{maxActionPoints}</span>
                        </div>
                      </div>
                    </PlayerMiniCard>
                  );
                })}
              </SessionCard>

              {/* Recent Activity */}
              <SessionCard>
                <h3>Recent Activity</h3>
                {recentActivity.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '1.5rem 1rem', 
                    color: '#95a5a6',
                    fontStyle: 'italic',
                    fontSize: '0.8rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                    border: '1px dashed rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📝</div>
                    <div>No recent activity</div>
                    <div style={{ fontSize: '0.7rem', opacity: '0.7', marginTop: '0.25rem' }}>
                      Actions will appear here
                    </div>
                  </div>
                ) : (
                  recentActivity.slice(0, 12).map(activity => (
                    <ActivityItem key={activity.id}>
                      <div className="activity-header">
                        <div className="player-name">{activity.character_name}</div>
                        <div className="turn-info">T{activity.turn_used}</div>
                      </div>
                      <div className="ability-name">{activity.ability_name}</div>
                    </ActivityItem>
                  ))
                )}
              </SessionCard>
            </SessionSidebar>
          )}
        </MainLayout>

        <FloatingTextList texts={floatingTexts} />

        {/* Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title={selectedAbility?.name || ''}
          footer={
            selectedAbility && (
              <>
                <Button onClick={handleCloseModal}>
                  Close
                </Button>
                <Button 
                  $primary 
                  disabled={!canUseAbility(selectedAbility)}
                  onClick={(e) => e && handleUseAbility(selectedAbility, e)}
                >
                  Use Ability
                </Button>
              </>
            )
          }
        >
          {selectedAbility && (
            <ModalBody>
              <div style={{ marginBottom: theme.spacing.md }}>
                <Badge $category={selectedAbility.category}>
                  {selectedAbility.category}
                </Badge>
              </div>
              
              <div className="description">{selectedAbility.description}</div>

              <div className="stats">
                {selectedAbility.damage && (
                  <div className="stat">
                    <div className="label">Damage</div>
                    <div className="value">{selectedAbility.damage}</div>
                  </div>
                )}
                {selectedAbility.manaCost && (
                  <div className="stat">
                    <div className="label">Mana Cost</div>
                    <div className="value">{selectedAbility.manaCost}</div>
                  </div>
                )}
                <div className="stat">
                  <div className="label">Cooldown</div>
                  <div className="value">{selectedAbility.cooldownMax}s</div>
                </div>
              </div>

              {selectedAbility.effects && selectedAbility.effects.length > 0 && (
                <div className="effects">
                  <h4>Effects:</h4>
                  {selectedAbility.effects.map((effect, index) => (
                    <div key={index} className="effect">• {effect}</div>
                  ))}
                </div>
              )}
            </ModalBody>
          )}
        </Modal>

        {/* Target Selection Modal for Combat */}
        <Modal
          isOpen={showTargetSelection}
          onClose={() => {
            setShowTargetSelection(false);
            setCurrentSelectedAbility(null);
            setSelectedTarget(null);
          }}
          title={`Select Target for ${currentSelectedAbility?.name || 'Ability'}`}
        >
          <div style={{ padding: theme.spacing.md }}>
            <p style={{ marginBottom: theme.spacing.md, color: theme.colors.text.secondary }}>
              Choose a target for your ability:
            </p>
            
            {/* Enemy Targets */}
            {battleEnemies.length > 0 && (
              <div style={{ marginBottom: theme.spacing.lg }}>
                <h4 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.sm }}>
                  Enemies:
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                  gap: theme.spacing.sm 
                }}>
                  {battleEnemies.map(enemy => (
                    <button
                      key={enemy.encounter_id}
                      onClick={() => setSelectedTarget(`enemy_${enemy.encounter_id}`)}
                      style={{
                        background: selectedTarget === `enemy_${enemy.encounter_id}` 
                          ? theme.colors.accent.cyan 
                          : 'rgba(255, 255, 255, 0.1)',
                        border: selectedTarget === `enemy_${enemy.encounter_id}` 
                          ? '2px solid transparent' 
                          : '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: theme.borderRadius.medium,
                        padding: theme.spacing.sm,
                        color: selectedTarget === `enemy_${enemy.encounter_id}` 
                          ? 'white' 
                          : theme.colors.text.secondary,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {enemy.enemy_name || 'Unknown Enemy'}
                      </div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                        {enemy.enemy_health_current}/{enemy.enemy_health_max || 100} HP
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Player Targets (for healing abilities) */}
            {currentSelectedAbility?.effects?.some(e => e.toLowerCase().includes('heal')) && (
              <div style={{ marginBottom: theme.spacing.lg }}>
                <h4 style={{ color: theme.colors.text.primary, marginBottom: theme.spacing.sm }}>
                  Party Members:
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                  gap: theme.spacing.sm 
                }}>
                  {[character, ...sessionPlayers].filter(p => p).map(player => (
                    <button
                      key={player!.id}
                      onClick={() => setSelectedTarget(`player_${player!.id}`)}
                      style={{
                        background: selectedTarget === `player_${player!.id}` 
                          ? theme.colors.accent.cyan 
                          : 'rgba(255, 255, 255, 0.1)',
                        border: selectedTarget === `player_${player!.id}` 
                          ? '2px solid transparent' 
                          : '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: theme.borderRadius.medium,
                        padding: theme.spacing.sm,
                        color: selectedTarget === `player_${player!.id}` 
                          ? 'white' 
                          : theme.colors.text.secondary,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {player!.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                        {(player as DatabaseCharacter).health_current}/{(player as DatabaseCharacter).health_max} HP
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: theme.spacing.lg 
            }}>
              <Button onClick={() => {
                setShowTargetSelection(false);
                setCurrentSelectedAbility(null);
                setSelectedTarget(null);
              }}>
                Cancel
              </Button>
              <Button 
                $primary 
                onClick={() => {
                  if (currentSelectedAbility) {
                    executeAbility(currentSelectedAbility, {} as React.MouseEvent);
                  }
                }}
                disabled={!selectedTarget}
              >
                Use Ability
              </Button>
            </div>
          </div>
        </Modal>
      </Container>
    </ThemeProvider>
  );
} 