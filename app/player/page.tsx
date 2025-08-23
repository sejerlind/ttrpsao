'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styled, { ThemeProvider } from 'styled-components';
import { theme } from './[id]/theme';
import { supabase, type DatabaseCharacter } from '../../lib/supabase';

// Error boundary component
function ErrorBoundary({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('Render error:', error);
    return <>{fallback}</>;
  }
}

const Container = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.gradients.background};
  color: ${props => props.theme.colors.text.primary};
  padding: ${props => props.theme.spacing.xl} ${props => props.theme.spacing.xl};
  width: 100%;

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.md};
  }

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    padding: ${props => props.theme.spacing.xl} ${props => props.theme.spacing.lg};
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xl};
  padding: 0 ${props => props.theme.spacing.xl};

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    padding: 0 ${props => props.theme.spacing.sm};
    margin-bottom: ${props => props.theme.spacing.lg};
  }

  h1 {
    font-size: 3.5rem;
    background: ${props => props.theme.gradients.accent};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 ${props => props.theme.spacing.md} 0;

    @media (max-width: ${props => props.theme.breakpoints.tablet}) {
      font-size: 2.5rem;
    }

    @media (max-width: ${props => props.theme.breakpoints.mobile}) {
      font-size: 2rem;
    }
  }

  p {
    color: ${props => props.theme.colors.text.muted};
    font-size: 1.2rem;

    @media (max-width: ${props => props.theme.breakpoints.mobile}) {
      font-size: 1rem;
    }
  }
`;

const FiltersContainer = styled.div`
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
  width: 100%;
  max-width: none;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  @media (min-width: ${props => props.theme.breakpoints.desktop}) {
    padding: ${props => props.theme.spacing.xxl};
    gap: ${props => props.theme.spacing.xl};
  }

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    padding: ${props => props.theme.spacing.lg};
    margin-bottom: ${props => props.theme.spacing.lg};
    gap: ${props => props.theme.spacing.md};
  }
`;

const FiltersRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  flex: 1;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    flex-direction: row;
    align-items: center;
    gap: ${props => props.theme.spacing.lg};
    flex-wrap: wrap;
  }

  &.main-filters {
    @media (min-width: ${props => props.theme.breakpoints.tablet}) {
      flex: 2;
      min-width: 500px;
    }
  }

  &.view-controls {
    @media (min-width: ${props => props.theme.breakpoints.tablet}) {
      flex: 0;
      justify-content: flex-end;
    }
  }
`;

const SearchInput = styled.input`
  background: ${props => props.theme.colors.surface.dark};
  border: 1px solid ${props => props.theme.colors.surface.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  color: ${props => props.theme.colors.text.primary};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  font-size: 1rem;
  min-width: 280px;
  flex: 1;
  transition: all 0.3s ease;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    min-width: 320px;
    max-width: 400px;
  }

  @media (min-width: ${props => props.theme.breakpoints.desktop}) {
    min-width: 350px;
    max-width: 450px;
    font-size: 1.1rem;
    padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xl};
  }

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent.cyan};
    box-shadow: 0 0 0 2px rgba(93, 211, 232, 0.2);
    transform: scale(1.02);
  }

  &::placeholder {
    color: ${props => props.theme.colors.text.muted};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    min-width: unset;
    width: 100%;
    font-size: 16px; /* Prevents zoom on iOS */
  }
`;

const FilterSelect = styled.select`
  background: ${props => props.theme.colors.surface.dark};
  border: 1px solid ${props => props.theme.colors.surface.border};
  border-radius: ${props => props.theme.borderRadius.medium};
  color: ${props => props.theme.colors.text.primary};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  font-size: 0.9rem;
  min-width: 140px;
  transition: all 0.3s ease;

  @media (min-width: ${props => props.theme.breakpoints.tablet}) {
    min-width: 160px;
  }

  @media (min-width: ${props => props.theme.breakpoints.desktop}) {
    min-width: 180px;
    font-size: 1rem;
    padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xl};
  }

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent.cyan};
    box-shadow: 0 0 0 2px rgba(93, 211, 232, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  option {
    background: ${props => props.theme.colors.surface.dark};
    color: ${props => props.theme.colors.text.primary};
  }

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    min-width: unset;
    width: 100%;
    font-size: 16px; /* Prevents zoom on iOS */
  }
`;

const RangeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${props => props.theme.spacing.xs};
    
    label {
      text-align: center;
    }
  }

  input[type="range"] {
    width: 80px;
    height: 4px;
    background: ${props => props.theme.colors.surface.dark};
    border-radius: ${props => props.theme.borderRadius.pill};
    outline: none;
    -webkit-appearance: none;
    transition: all 0.3s ease;

    @media (max-width: ${props => props.theme.breakpoints.mobile}) {
      width: 100%;
    }

    &:disabled {
      opacity: 0.5;
    }

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      background: ${props => props.theme.colors.accent.cyan};
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.2);
        box-shadow: 0 0 8px rgba(93, 211, 232, 0.5);
      }
    }

    &::-moz-range-thumb {
      width: 16px;
      height: 16px;
      background: ${props => props.theme.colors.accent.cyan};
      border-radius: 50%;
      cursor: pointer;
      border: none;
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.2);
        box-shadow: 0 0 8px rgba(93, 211, 232, 0.5);
      }
    }
  }
`;

const ViewToggle = styled.div`
  display: flex;
  background: ${props => props.theme.colors.surface.dark};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: 3px;
  border: 1px solid ${props => props.theme.colors.surface.border};

  @media (min-width: ${props => props.theme.breakpoints.desktop}) {
    padding: 4px;
  }

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    align-self: center;
    width: 100%;
    max-width: 200px;
  }
`;

const ViewButton = styled.button<{ $active: boolean }>`
  background: ${props => props.$active ? props.theme.colors.accent.cyan : 'transparent'};
  color: ${props => props.$active ? props.theme.colors.primary.bg : props.theme.colors.text.muted};
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.small};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  font-weight: 500;
  flex: 1;
  min-width: 60px;

  @media (min-width: ${props => props.theme.breakpoints.desktop}) {
    padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
    font-size: 1rem;
    min-width: 80px;
  }

  &:hover:not(:disabled) {
    background: ${props => props.$active ? props.theme.colors.accent.cyan : props.theme.colors.surface.hover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    padding: ${props => props.theme.spacing.md};
    font-size: 0.9rem;
  }
`;

const PlayersHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
  padding: 0 ${props => props.theme.spacing.sm};
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${props => props.theme.spacing.sm};
    padding: 0;
  }

  @media (min-width: ${props => props.theme.breakpoints.desktop}) {
    margin-bottom: ${props => props.theme.spacing.xl};
    padding: 0 ${props => props.theme.spacing.md};
  }
  
  h2 {
    color: ${props => props.theme.colors.text.primary};
    font-size: 1.8rem;
    margin: 0;
    font-weight: 600;

    @media (max-width: ${props => props.theme.breakpoints.mobile}) {
      font-size: 1.5rem;
    }

    @media (min-width: ${props => props.theme.breakpoints.desktop}) {
      font-size: 2rem;
    }
  }

  .results-count {
    color: ${props => props.theme.colors.text.muted};
    font-size: 1rem;
    font-weight: 500;

    @media (max-width: ${props => props.theme.breakpoints.mobile}) {
      font-size: 0.9rem;
      align-self: flex-end;
    }

    @media (min-width: ${props => props.theme.breakpoints.desktop}) {
      font-size: 1.1rem;
    }
  }
`;

const PlayersGrid = styled.div<{ $viewMode: 'grid' | 'list' }>`
  display: grid;
  grid-template-columns: ${props => {
    if (props.$viewMode === 'list') return '1fr';
    return 'repeat(auto-fill, minmax(320px, 1fr))';
  }};
  gap: ${props => props.theme.spacing.xl};
  margin-top: ${props => props.theme.spacing.xl};
  width: 100%;

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: ${props => props.theme.spacing.lg};
    margin-top: ${props => props.theme.spacing.lg};
  }

  @media (min-width: ${props => props.theme.breakpoints.mobile}) and (max-width: ${props => props.theme.breakpoints.tablet}) {
    grid-template-columns: ${props => props.$viewMode === 'grid' 
      ? 'repeat(auto-fill, minmax(280px, 1fr))' 
      : '1fr'};
    gap: ${props => props.theme.spacing.lg};
  }

  @media (min-width: ${props => props.theme.breakpoints.tablet}) and (max-width: ${props => props.theme.breakpoints.desktop}) {
    grid-template-columns: ${props => props.$viewMode === 'grid' 
      ? 'repeat(auto-fill, minmax(300px, 1fr))' 
      : '1fr'};
  }

  @media (min-width: ${props => props.theme.breakpoints.desktop}) {
    grid-template-columns: ${props => props.$viewMode === 'grid' 
      ? 'repeat(auto-fill, minmax(320px, 1fr))' 
      : '1fr'};
  }

  @media (min-width: ${props => props.theme.breakpoints.wide}) {
    grid-template-columns: ${props => props.$viewMode === 'grid' 
      ? 'repeat(auto-fill, minmax(350px, 1fr))' 
      : '1fr'};
  }

  /* Ultra-wide screens */
  @media (min-width: 1600px) {
    grid-template-columns: ${props => props.$viewMode === 'grid' 
      ? 'repeat(auto-fill, minmax(380px, 1fr))' 
      : '1fr'};
    gap: ${props => props.theme.spacing.xxl};
  }
`;

const PlayerCard = styled.div<{ $class: string; $viewMode: 'grid' | 'list' }>`
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.xl};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: ${props => props.$viewMode === 'list' ? 'flex' : 'block'};
  align-items: ${props => props.$viewMode === 'list' ? 'center' : 'initial'};
  gap: ${props => props.$viewMode === 'list' ? props.theme.spacing.xl : '0'};
  transform: translateY(0);

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    padding: ${props => props.theme.spacing.lg};
    display: block;
    align-items: initial;
    gap: 0;
  }

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    ${props => props.$viewMode === 'list' && `
      flex-direction: column;
      align-items: stretch;
      gap: ${props.theme.spacing.lg};
    `}
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => {
      switch(props.$class.toLowerCase()) {
        case 'mage': return 'linear-gradient(90deg, #3b82f6, #1d4ed8)';
        case 'paladin': return 'linear-gradient(90deg, #f59e0b, #d97706)';
        case 'assassin': return 'linear-gradient(90deg, #8b5fd6, #7c3aed)';
        case 'warrior': return 'linear-gradient(90deg, #ef4444, #dc2626)';
        case 'archer': return 'linear-gradient(90deg, #10b981, #059669)';
        default: return props.theme.gradients.accent;
      }
    }};
    transition: height 0.3s ease;
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: ${props => props.theme.shadows.cardHover};
    border-color: ${props => props.theme.colors.accent.cyan};

    &::before {
      height: 6px;
    }

    @media (max-width: ${props => props.theme.breakpoints.mobile}) {
      transform: translateY(-4px);
    }
  }

  &:active {
    transform: translateY(-2px);
    transition: all 0.1s ease;
  }

  .character-main {
    display: flex;
    flex-direction: ${props => props.$viewMode === 'list' ? 'row' : 'column'};
    align-items: ${props => props.$viewMode === 'list' ? 'center' : 'initial'};
    gap: ${props => props.$viewMode === 'list' ? props.theme.spacing.lg : '0'};
    flex: ${props => props.$viewMode === 'list' ? '1' : 'initial'};

    @media (max-width: ${props => props.theme.breakpoints.mobile}) {
      flex-direction: column;
      align-items: initial;
      gap: 0;
    }

    @media (max-width: ${props => props.theme.breakpoints.tablet}) {
      ${props => props.$viewMode === 'list' && `
        flex-direction: column;
        align-items: stretch;
        gap: ${props.theme.spacing.lg};
      `}
    }
  }

  .character-portrait {
    position: relative;
    font-size: ${props => props.$viewMode === 'list' ? '48px' : '64px'};
    text-align: center;
    margin-bottom: ${props => props.$viewMode === 'list' ? '0' : props.theme.spacing.lg};
    flex-shrink: 0;
    transition: font-size 0.3s ease;

    @media (max-width: ${props => props.theme.breakpoints.mobile}) {
      font-size: 48px;
      margin-bottom: ${props => props.theme.spacing.lg};
    }

    .level-badge {
      position: absolute;
      top: ${props => props.$viewMode === 'list' ? '-8px' : '-10px'};
      right: 50%;
      transform: translateX(50%);
      background: ${props => {
        switch(props.$class.toLowerCase()) {
          case 'mage': return 'linear-gradient(145deg, #3b82f6, #1d4ed8)';
          case 'paladin': return 'linear-gradient(145deg, #f59e0b, #d97706)';
          case 'assassin': return 'linear-gradient(145deg, #8b5fd6, #7c3aed)';
          case 'warrior': return 'linear-gradient(145deg, #ef4444, #dc2626)';
          case 'archer': return 'linear-gradient(145deg, #10b981, #059669)';
          default: return props.theme.gradients.accent;
        }
      }};
      border: 2px solid white;
      border-radius: ${props => props.theme.borderRadius.pill};
      padding: 4px 12px;
      font-size: 14px;
      font-weight: bold;
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;

      @media (max-width: ${props => props.theme.breakpoints.mobile}) {
        font-size: 12px;
        padding: 3px 8px;
        top: -8px;
      }
    }
  }

  .character-info-section {
    flex: 1;
    min-width: 0;
  }

  .character-name {
    font-size: ${props => props.$viewMode === 'list' ? '1.5rem' : '1.8rem'};
    font-weight: bold;
    color: ${props => props.theme.colors.text.primary};
    margin-bottom: ${props => props.theme.spacing.sm};
    text-align: ${props => props.$viewMode === 'list' ? 'left' : 'center'};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media (max-width: ${props => props.theme.breakpoints.mobile}) {
      font-size: 1.5rem;
      text-align: center;
      white-space: normal;
      overflow: visible;
      text-overflow: unset;
    }
  }

  .character-info {
    text-align: ${props => props.$viewMode === 'list' ? 'left' : 'center'};
    margin-bottom: ${props => props.theme.spacing.lg};

    @media (max-width: ${props => props.theme.breakpoints.mobile}) {
      text-align: center;
    }

    .class-level {
      color: ${props => {
        switch(props.$class.toLowerCase()) {
          case 'mage': return '#3b82f6';
          case 'paladin': return '#f59e0b';
          case 'assassin': return '#8b5fd6';
          case 'warrior': return '#ef4444';
          case 'archer': return '#10b981';
          default: return props.theme.colors.text.accent;
        }
      }};
      font-size: ${props => props.$viewMode === 'list' ? '1.1rem' : '1.3rem'};
      font-weight: bold;
      margin-bottom: ${props => props.theme.spacing.xs};
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: color 0.3s ease;

      @media (max-width: ${props => props.theme.breakpoints.mobile}) {
        font-size: 1.1rem;
      }
    }

    .experience {
      color: ${props => props.theme.colors.text.muted};
      font-size: 0.9rem;

      @media (max-width: ${props => props.theme.breakpoints.mobile}) {
        font-size: 0.85rem;
      }
    }

    .experience-bar {
      margin-top: ${props => props.theme.spacing.sm};
      height: 8px;
      background: ${props => props.theme.colors.surface.dark};
      border-radius: ${props => props.theme.borderRadius.pill};
      overflow: hidden;
      position: relative;

      .experience-fill {
        height: 100%;
        background: ${props => {
          switch(props.$class.toLowerCase()) {
            case 'mage': return 'linear-gradient(90deg, #3b82f6, #1d4ed8)';
            case 'paladin': return 'linear-gradient(90deg, #f59e0b, #d97706)';
            case 'assassin': return 'linear-gradient(90deg, #8b5fd6, #7c3aed)';
            case 'warrior': return 'linear-gradient(90deg, #ef4444, #dc2626)';
            case 'archer': return 'linear-gradient(90deg, #10b981, #059669)';
            default: return props.theme.gradients.accent;
          }
        }};
        transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: ${props => props.theme.borderRadius.pill};
      }
    }
  }

  .character-resources {
    display: grid;
    grid-template-columns: ${props => props.$viewMode === 'list' ? 'repeat(4, 1fr)' : '1fr 1fr'};
    gap: ${props => props.theme.spacing.sm};
    margin-bottom: ${props => props.theme.spacing.lg};
    min-width: ${props => props.$viewMode === 'list' ? '400px' : 'auto'};

    @media (max-width: ${props => props.theme.breakpoints.mobile}) {
      grid-template-columns: 1fr 1fr;
      min-width: auto;
    }

    @media (max-width: ${props => props.theme.breakpoints.tablet}) {
      ${props => props.$viewMode === 'list' && `
        grid-template-columns: 1fr 1fr;
        min-width: auto;
      `}
    }

    .resource {
      .resource-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
        font-size: 0.75rem;

        .label {
          color: ${props => props.theme.colors.text.muted};
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .value {
          color: ${props => props.theme.colors.text.accent};
          font-weight: bold;
        }
      }

      .resource-bar {
        height: 6px;
        background: ${props => props.theme.colors.surface.dark};
        border-radius: ${props => props.theme.borderRadius.pill};
        overflow: hidden;

        .resource-fill {
          height: 100%;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: ${props => props.theme.borderRadius.pill};

          &.health {
            background: linear-gradient(90deg, #ef4444, #dc2626);
          }

          &.mana {
            background: linear-gradient(90deg, #3b82f6, #1d4ed8);
          }

          &.stamina {
            background: linear-gradient(90deg, #10b981, #059669);
          }

          &.armor {
            background: linear-gradient(90deg, #f59e0b, #d97706);
          }
        }
      }
    }
  }

  .character-quick-stats {
    display: flex;
    justify-content: space-around;
    font-size: 0.85rem;
    padding-top: ${props => props.theme.spacing.md};
    border-top: 1px solid ${props => props.theme.colors.surface.border};
    min-width: ${props => props.$viewMode === 'list' ? '200px' : 'auto'};

    @media (max-width: ${props => props.theme.breakpoints.mobile}) {
      min-width: auto;
      gap: ${props => props.theme.spacing.xs};
    }

    @media (max-width: ${props => props.theme.breakpoints.tablet}) {
      ${props => props.$viewMode === 'list' && `
        min-width: auto;
      `}
    }
    
    .quick-stat {
      text-align: center;
      transition: transform 0.2s ease;

      &:hover {
        transform: scale(1.05);
      }
    
      .stat-value {
        font-weight: bold;
        color: ${props => props.theme.colors.text.accent};
        font-size: 1.1rem;
        display: block;

        @media (max-width: ${props => props.theme.breakpoints.mobile}) {
          font-size: 1rem;
        }
      }
    
      .stat-label {
        color: ${props => props.theme.colors.text.muted};
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 2px;

        @media (max-width: ${props => props.theme.breakpoints.mobile}) {
          font-size: 0.65rem;
        }
      }
    }
  }
`;

const SkeletonCard = styled.div`
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.xl};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.theme.colors.surface.border};
  }

  .skeleton-content {
    display: flex;
    flex-direction: column;
    gap: ${props => props.theme.spacing.lg};
  }

  .skeleton-portrait {
    width: 64px;
    height: 64px;
    background: ${props => props.theme.colors.surface.dark};
    border-radius: 50%;
    margin: 0 auto;
    position: relative;
    animation: pulse 1.5s ease-in-out infinite;

    &::after {
      content: '';
      position: absolute;
      top: -8px;
      right: -8px;
      width: 24px;
      height: 18px;
      background: ${props => props.theme.colors.surface.dark};
      border-radius: ${props => props.theme.borderRadius.pill};
      animation: pulse 1.5s ease-in-out infinite;
    }
  }

  .skeleton-text {
    background: ${props => props.theme.colors.surface.dark};
    border-radius: ${props => props.theme.borderRadius.small};
    animation: pulse 1.5s ease-in-out infinite;

    &.name {
      height: 24px;
      width: 60%;
      margin: 0 auto;
    }

    &.class {
      height: 18px;
      width: 40%;
      margin: 0 auto;
    }

    &.experience {
      height: 14px;
      width: 80%;
      margin: 0 auto;
    }

    &.bar {
      height: 8px;
      width: 100%;
      margin-top: ${props => props.theme.spacing.sm};
    }

    &.resource-bar {
      height: 6px;
      width: 100%;
    }
  }

  .skeleton-resources {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${props => props.theme.spacing.sm};

    .skeleton-resource {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .skeleton-resource-header {
        display: flex;
        justify-content: space-between;
        
        .skeleton-label {
          width: 50px;
          height: 12px;
          background: ${props => props.theme.colors.surface.dark};
          border-radius: ${props => props.theme.borderRadius.small};
          animation: pulse 1.5s ease-in-out infinite;
        }

        .skeleton-value {
          width: 40px;
          height: 12px;
          background: ${props => props.theme.colors.surface.dark};
          border-radius: ${props => props.theme.borderRadius.small};
          animation: pulse 1.5s ease-in-out infinite;
        }
      }
    }
  }

  .skeleton-stats {
    display: flex;
    justify-content: space-around;
    padding-top: ${props => props.theme.spacing.md};
    border-top: 1px solid ${props => props.theme.colors.surface.border};

    .skeleton-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;

      .skeleton-stat-value {
        width: 24px;
        height: 16px;
        background: ${props => props.theme.colors.surface.dark};
        border-radius: ${props => props.theme.borderRadius.small};
        animation: pulse 1.5s ease-in-out infinite;
      }

      .skeleton-stat-label {
        width: 30px;
        height: 12px;
        background: ${props => props.theme.colors.surface.dark};
        border-radius: ${props => props.theme.borderRadius.small};
        animation: pulse 1.5s ease-in-out infinite;
      }
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 0.4;
    }
    50% {
      opacity: 0.6;
    }
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xxxl} ${props => props.theme.spacing.xl};
  text-align: center;
  color: ${props => props.theme.colors.text.muted};
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.large};

  .empty-icon {
    font-size: 4rem;
    margin-bottom: ${props => props.theme.spacing.lg};
    opacity: 0.5;
  }

  h3 {
    color: ${props => props.theme.colors.text.secondary};
    font-size: 1.5rem;
    margin-bottom: ${props => props.theme.spacing.sm};
  }

  p {
    font-size: 1rem;
    line-height: 1.5;
    max-width: 400px;
    margin-bottom: ${props => props.theme.spacing.lg};
  }

  button {
    background: ${props => props.theme.colors.accent.cyan};
    color: ${props => props.theme.colors.primary.bg};
    border: none;
    padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
    border-radius: ${props => props.theme.borderRadius.medium};
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: ${props => props.theme.colors.accent.blue};
      transform: translateY(-2px);
    }
  }
`;

export default function PlayersPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<DatabaseCharacter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and view state - ensure all values are properly initialized
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [minLevel, setMinLevel] = useState<number>(1);
  const [maxLevel, setMaxLevel] = useState<number>(100);
  const [sortBy, setSortBy] = useState<'name' | 'level' | 'class' | 'health'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const loadPlayers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!supabase) {
        setError('Database not configured');
        setIsLoading(false);
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from('characters')
        .select('*')
        .order('name', { ascending: true });

      if (supabaseError) {
        console.error('Error loading players:', supabaseError);
        setError('Failed to load players');
        setIsLoading(false);
        return;
      }

      setPlayers(data || []);
    } catch (error) {
      console.error('Failed to load players:', error);
      setError('Unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    // Update max level when players change
    if (players.length > 0) {
      const newMaxLevel = Math.max(...players.map(p => p.level));
      setMaxLevel(newMaxLevel);
    }
  }, [players]);

  const handlePlayerClick = (playerId: string) => {
    router.push(`/player/${playerId}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setClassFilter('');
    setLevelFilter('');
    setMinLevel(1);
    setMaxLevel(maxPlayerLevel);
    setSortBy('name');
  };

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const getClassEmoji = (playerClass: string): string => {
    switch(playerClass.toLowerCase()) {
      case 'mage': return '🧙‍♂️';
      case 'paladin': return '🛡️';
      case 'assassin': return '🗡️';
      case 'warrior': return '⚔️';
      case 'archer': return '🏹';
      case 'priest': return '✨';
      case 'rogue': return '🥷';
      case 'monk': return '👊';
      default: return '⚔️';
    }
  };

  // Filtered and sorted players
  const filteredPlayers = useMemo(() => {
    try {
      
      const filtered = players.filter(player => {
        const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             player.class.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClass = !classFilter || player.class.toLowerCase() === classFilter.toLowerCase();
        const matchesLevel = !levelFilter || player.level.toString() === levelFilter;
        const matchesLevelRange = player.level >= minLevel && player.level <= maxLevel;
        
        return matchesSearch && matchesClass && matchesLevel && matchesLevelRange;
      });

      // Sort the filtered results
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'level':
            return b.level - a.level; // Descending order
          case 'class':
            return a.class.localeCompare(b.class);
          case 'health':
            const aHealthPercent = (a.health_current / a.health_max) * 100;
            const bHealthPercent = (b.health_current / b.health_max) * 100;
            return bHealthPercent - aHealthPercent; // Descending order
          default:
            return 0;
        }
      });

      return filtered;
    } catch (error) {
      console.error('Error filtering players:', error);
      return [];
    }
  }, [players, searchTerm, classFilter, levelFilter, minLevel, maxLevel, sortBy]);

  // Get unique classes and max level for dynamic filter options
  const availableClasses = useMemo(() => {
    try {
      const classes = [...new Set(players.map(p => p.class))].sort();
      return classes;
    } catch (error) {
      console.error('Error getting available classes:', error);
      return [];
    }
  }, [players]);

  const maxPlayerLevel = useMemo(() => {
    try {
      const maxLevel = players.length > 0 ? Math.max(...players.map(p => p.level)) : 100;
      return maxLevel;
    } catch (error) {
      console.error('Error getting max level:', error);
      return 100;
    }
  }, [players]);

  const availableLevels = useMemo(() => {
    try {
      const levels = [...new Set(players.map(p => p.level))].sort((a, b) => a - b);
      return levels;
    } catch (error) {
      console.error('Error getting available levels:', error);
      return [];
    }
  }, [players]);

  if (isLoading) {
    return (
      <ErrorBoundary fallback={<div>Loading failed</div>}>
        <ThemeProvider theme={theme}>
          <Container>
            <Header>
              <h1>TTRPG Players</h1>
              <p>Select a character to view their details</p>
            </Header>
            <FiltersContainer>
              <SearchInput 
                placeholder="Search characters..." 
                value=""
                onChange={() => {}}
                disabled 
              />
              <FilterSelect 
                value=""
                onChange={() => {}}
                disabled
              >
                <option value="">All Classes</option>
              </FilterSelect>
              <FilterSelect 
                value=""
                onChange={() => {}}
                disabled
              >
                <option value="">All Levels</option>
              </FilterSelect>
              <FilterSelect 
                value="name"
                onChange={() => {}}
                disabled
              >
                <option value="name">Sort by Name</option>
              </FilterSelect>
              <RangeContainer>
                <label>Level 1-100:</label>
                <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  value="1" 
                  onChange={() => {}}
                  disabled 
                />
                <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  value="100" 
                  onChange={() => {}}
                  disabled 
                />
              </RangeContainer>
              <ViewToggle>
                <ViewButton $active={true} disabled>Grid</ViewButton>
                <ViewButton $active={false} disabled>List</ViewButton>
              </ViewToggle>
            </FiltersContainer>
            <PlayersHeader>
              <h2>Loading Characters...</h2>
              <span className="results-count">Please wait</span>
            </PlayersHeader>
            <PlayersGrid $viewMode="grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index}>
                  <div className="skeleton-content">
                    <div className="skeleton-portrait"></div>
                    <div className="skeleton-text name"></div>
                    <div className="skeleton-text class"></div>
                    <div className="skeleton-text experience"></div>
                    <div className="skeleton-text bar"></div>
                    <div className="skeleton-resources">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="skeleton-resource">
                          <div className="skeleton-resource-header">
                            <div className="skeleton-label"></div>
                            <div className="skeleton-value"></div>
                          </div>
                          <div className="skeleton-text resource-bar"></div>
                        </div>
                      ))}
                    </div>
                    <div className="skeleton-stats">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="skeleton-stat">
                          <div className="skeleton-stat-value"></div>
                          <div className="skeleton-stat-label"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </SkeletonCard>
              ))}
            </PlayersGrid>
          </Container>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  if (error) {
    return (
      <ErrorBoundary fallback={<div>Error page failed to render</div>}>
        <ThemeProvider theme={theme}>
          <Container>
            <Header>
              <h1>TTRPG Players</h1>
              <p>Select a character to view their details</p>
            </Header>
            <div style={{ textAlign: 'center', color: 'red' }}>
              <h3>Error: {error}</h3>
              <button onClick={loadPlayers} style={{ marginTop: '16px', padding: '8px 16px' }}>
                Retry
              </button>
            </div>
          </Container>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  if (players.length === 0) {
    return (
      <ErrorBoundary fallback={<div>Empty state failed to render</div>}>
        <ThemeProvider theme={theme}>
          <Container>
            <Header>
              <h1>TTRPG Players</h1>
              <p>Select a character to view their details</p>
            </Header>
            <EmptyState>
              <div className="empty-icon">🎲</div>
              <h3>No Characters Found</h3>
              <p>
                It looks like there are no characters in your campaign yet. 
                Add some characters to get started!
              </p>
              <button onClick={loadPlayers}>
                Refresh
              </button>
            </EmptyState>
          </Container>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  const hasActiveFilters = searchTerm || classFilter || levelFilter || minLevel > 1 || maxLevel < maxPlayerLevel;

  return (
    <ErrorBoundary fallback={<div>Main page failed to render</div>}>
      <ThemeProvider theme={theme}>
        <Container>
          <Header>
            <h1>TTRPG Players</h1>
            <p>Select a character to view their details</p>
          </Header>

          <FiltersContainer>
            <FiltersRow className="main-filters">
              <SearchInput 
                placeholder="Search characters..." 
                value={searchTerm} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} 
              />
              <FilterSelect 
                value={classFilter} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setClassFilter(e.target.value)}
              >
                <option value="">All Classes</option>
                {availableClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </FilterSelect>
              <FilterSelect 
                value={levelFilter} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLevelFilter(e.target.value)}
              >
                <option value="">All Levels</option>
                {availableLevels.map(lvl => (
                  <option key={lvl} value={lvl}>Level {lvl}</option>
                ))}
              </FilterSelect>
              <FilterSelect 
                value={sortBy} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as 'name' | 'level' | 'class' | 'health')}
              >
                <option value="name">Sort by Name</option>
                <option value="level">Sort by Level</option>
                <option value="class">Sort by Class</option>
                <option value="health">Sort by Health</option>
              </FilterSelect>
              <RangeContainer>
                <label>Level {minLevel}-{maxLevel}:</label>
                <input 
                  type="range" 
                  min="1" 
                  max={maxPlayerLevel} 
                  value={minLevel} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinLevel(Number(e.target.value))}
                  title={`Minimum Level: ${minLevel}`}
                />
                <input 
                  type="range" 
                  min="1" 
                  max={maxPlayerLevel} 
                  value={maxLevel} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxLevel(Number(e.target.value))}
                  title={`Maximum Level: ${maxLevel}`}
                />
              </RangeContainer>
            </FiltersRow>
            <FiltersRow className="view-controls">
              <ViewToggle>
                <ViewButton $active={viewMode === 'grid'} onClick={() => setViewMode('grid')}>Grid</ViewButton>
                <ViewButton $active={viewMode === 'list'} onClick={() => setViewMode('list')}>List</ViewButton>
              </ViewToggle>
            </FiltersRow>
          </FiltersContainer>

          <PlayersHeader>
            <h2>All Characters</h2>
            <span className="results-count">Showing {filteredPlayers.length} results</span>
          </PlayersHeader>

          {filteredPlayers.length === 0 ? (
            <EmptyState>
              <div className="empty-icon">🔍</div>
              <h3>No Results Found</h3>
              <p>
                No characters match your current filters. 
                Try adjusting your search criteria or clearing the filters.
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters}>
                  Clear Filters
                </button>
              )}
            </EmptyState>
          ) : (
            <PlayersGrid $viewMode={viewMode}>
              {filteredPlayers.map(player => (
                <PlayerCard
                  key={player.id}
                  onClick={() => handlePlayerClick(player.id)}
                  $class={player.class}
                  $viewMode={viewMode}
                >
                  <div className="character-main">
                    <div className="character-portrait">
                      {getClassEmoji(player.class)}
                      <div className="level-badge">Lv {player.level}</div>
                    </div>
                    <div className="character-info-section">
                      <div className="character-name">{player.name}</div>
                      <div className="character-info">
                        <div className="class-level">
                          Level {player.level} {player.class}
                        </div>
                        <div className="experience">
                          {formatNumber(player.experience)} / {formatNumber(player.experience_to_next)} XP
                        </div>
                        <div className="experience-bar">
                          <div 
                            className="experience-fill"
                            style={{ width: `${(player.experience / player.experience_to_next) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="character-resources">
                        <div className="resource">
                          <div className="resource-header">
                            <span className="label">Health</span>
                            <span className="value">{player.health_current}/{player.health_max}</span>
                          </div>
                          <div className="resource-bar">
                            <div 
                              className="resource-fill health"
                              style={{ width: `${(player.health_current / player.health_max) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="resource">
                          <div className="resource-header">
                            <span className="label">Mana</span>
                            <span className="value">{player.mana_current}/{player.mana_max}</span>
                          </div>
                          <div className="resource-bar">
                            <div 
                              className="resource-fill mana"
                              style={{ width: `${(player.mana_current / player.mana_max) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="resource">
                          <div className="resource-header">
                            <span className="label">Stamina</span>
                            <span className="value">{player.stamina_current}/{player.stamina_max}</span>
                          </div>
                          <div className="resource-bar">
                            <div 
                              className="resource-fill stamina"
                              style={{ width: `${(player.stamina_current / player.stamina_max) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="resource">
                          <div className="resource-header">
                            <span className="label">Armor</span>
                            <span className="value">{player.armor_current}/{player.armor_max}</span>
                          </div>
                          <div className="resource-bar">
                            <div 
                              className="resource-fill armor"
                              style={{ width: `${(player.armor_current / player.armor_max) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="character-quick-stats">
                        <div className="quick-stat">
                          <span className="stat-value">{player.action_points_current}</span>
                          <span className="stat-label">AP</span>
                        </div>
                        <div className="quick-stat">
                          <span className="stat-value">{player.level}</span>
                          <span className="stat-label">Level</span>
                        </div>
                        <div className="quick-stat">
                          <span className="stat-value">{Math.round((player.armor_current / player.armor_max) * 100)}%</span>
                          <span className="stat-label">Armor</span>
                        </div>
                        <div className="quick-stat">
                          <span className="stat-value">{Math.round((player.magic_resist_current / player.magic_resist_max) * 100)}%</span>
                          <span className="stat-label">M.Resist</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </PlayerCard>
              ))}
            </PlayersGrid>
          )}
        </Container>
      </ThemeProvider>
    </ErrorBoundary>
  );
} 