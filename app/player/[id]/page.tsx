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

// Import types
import type { 
  Character, 
  Resources, 
  Ability, 
  Buff, 
  UsedAbility, 
  FloatingTextItem 
} from '../../../components/types';

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

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: ${props => props.theme.spacing.xl};
  margin-top: ${props => props.theme.spacing.xl};

  @media (max-width: ${props => props.theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
    gap: ${props => props.theme.spacing.lg};
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
    armor: { current: 0, max: 0 },
    magicResist: { current: 0, max: 0 },
  });

  const [abilities, setAbilities] = useState<Ability[]>([]);
  const [isLoadingAbilities, setIsLoadingAbilities] = useState(true);

  const [buffs] = useState<Buff[]>([
    { id: '1', name: 'Swift', type: 'buff', duration: 45, icon: '⚡' },
    { id: '2', name: 'Blessed', type: 'buff', duration: 120, icon: '✨' },
    { id: '3', name: 'Poisoned', type: 'debuff', duration: 8, icon: '🟢' },
  ]);

  const [activeCategory, setActiveCategory] = useState<'all' | 'basic' | 'skill' | 'ultimate'>('all');
  const [selectedAbility, setSelectedAbility] = useState<Ability | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [recentlyUsedAbilities, setRecentlyUsedAbilities] = useState<UsedAbility[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);

  // Load character data from Supabase
  const loadCharacter = useCallback(async () => {
    try {
      setIsLoadingCharacter(true);
      setCharacterError(null);
      
      if (!supabase) {
        setCharacterError('Database not configured');
        return;
      }

      if (!playerId) {
        setCharacterError('No player ID provided');
        return;
      }

      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', playerId)
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
        name: data.name,
        class: data.class,
        level: data.level,
        experience: data.experience,
        experienceToNext: data.experience_to_next,
      };

      const resources: Resources = {
        health: { current: data.health_current, max: data.health_max },
        mana: { current: data.mana_current, max: data.mana_max },
        stamina: { current: data.stamina_current, max: data.stamina_max },
        actionPoints: { current: data.action_points_current, max: data.action_points_max },
        armor: { current: data.armor_current, max: data.armor_max },
        magicResist: { current: data.magic_resist_current, max: data.magic_resist_max },
      };

      setCharacter(character);
      setResources(resources);
    } catch (error) {
      console.error('Failed to load character:', error);
      setCharacterError('Unexpected error occurred');
    } finally {
      setIsLoadingCharacter(false);
    }
  }, [playerId]);

  // Load abilities from Supabase for specific player
  const loadAbilities = useCallback(async () => {
    try {
      setIsLoadingAbilities(true);
      
      if (!supabase) {
        console.warn('Supabase not configured');
        setAbilities([]);
        return;
      }

      if (!playerId) {
        console.warn('No player ID provided');
        setAbilities([]);
        return;
      }

      // Load abilities specific to this player through the junction table
      console.log('Loading abilities for character:', playerId);
      
      // Since foreign key relationship might not be set up properly, use direct approach
      console.log('Using direct approach to load abilities...');
      
      // Get character ability IDs first
      const { data: charAbilities, error: charError } = await supabase
        .from('character_abilities')
        .select('ability_id, is_equipped, slot_position')
        .eq('character_id', playerId);
        
      if (charError) {
        console.error('Error loading character abilities:', charError);
        setAbilities([]);
        return;
      }
      
      if (!charAbilities || charAbilities.length === 0) {
        console.log('No abilities found for this character');
        setAbilities([]);
        return;
      }
      
      console.log('Character ability IDs:', charAbilities.map(ca => ca.ability_id));
      
      // Get the actual abilities
      const { data: abilitiesData, error: abilitiesError } = await supabase
        .from('Abilities')
        .select('*')
        .in('id', charAbilities.map(ca => ca.ability_id));
        
      if (abilitiesError) {
        console.error('Error loading abilities:', abilitiesError);
        setAbilities([]);
        return;
      }
      
      console.log('Abilities data:', abilitiesData);
      
      const playerAbilities = abilitiesData?.map((dbAbility: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        id: dbAbility.id,
        name: dbAbility.name,
        description: dbAbility.description,
        category: dbAbility.category,
        cooldownMax: dbAbility.cooldown_max,
        currentCooldown: dbAbility.current_cooldown || 0,
        damage: dbAbility.damage || undefined,
        manaCost: dbAbility.mana_cost || undefined,
        effects: dbAbility.effects || []
      })) || [];
      
      console.log(`✅ Loaded ${playerAbilities.length} abilities for player ${playerId}`);
      setAbilities(playerAbilities);

      // OLD JOIN APPROACH (commented out due to foreign key issues)
      /*
      const { data, error } = await supabase
        .from('character_abilities')
        .select(`
          ability_id,
          is_equipped,
          slot_position,
          Abilities!inner (
            id,
            name,
            description,
            category,
            cooldown_max,
            current_cooldown,
            damage,
            mana_cost,
            effects,
            icon
          )
        `)
        .eq('character_id', playerId);

      if (error) {
        console.error('Error loading player abilities:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        setAbilities([]);
        return;
      }

      console.log('Raw abilities data:', data);

      // If the join query failed or returned no data, try a simpler approach
      if (!data || data.length === 0) {
        // This code is now redundant since we're using direct approach above
      }
      */
    } catch (error) {
      console.error('Failed to load player abilities:', error);
      setAbilities([]);
    } finally {
      setIsLoadingAbilities(false);
    }
  }, [playerId]);

  // Load character and abilities on component mount or when playerId changes
  useEffect(() => {
    if (playerId) {
      loadCharacter();
      loadAbilities();
    }
  }, [playerId, loadAbilities, loadCharacter]);

  // Auto-update cooldowns
  useEffect(() => {
    const interval = setInterval(() => {
      setAbilities(prev => prev.map(ability => ({
        ...ability,
        currentCooldown: Math.max(0, ability.currentCooldown - 1)
      })));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  const handleUseAbility = (ability: Ability, event: React.MouseEvent) => {
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

    // Add to recently used
    const usedAbility: UsedAbility = {
      abilityName: ability.name,
      timestamp: new Date(),
      effect: ability.damage ? `Dealt ${ability.damage} damage` : ability.effects?.[0] || 'Effect applied'
    };
    setRecentlyUsedAbilities(prev => [usedAbility, ...prev.slice(0, 4)]);

    // Show floating text
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const floatingText: FloatingTextItem = {
      id: Date.now().toString(),
      text: ability.damage ? ability.damage : ability.effects?.[0] || 'Used!',
      x: rect.left + rect.width / 2,
      y: rect.top,
      type: ability.damage ? 'damage' : 'effect'
    };
    setFloatingTexts(prev => [...prev, floatingText]);

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
          <SkillsButton onClick={() => router.push(`/player/${params.id}/skills`)}>
            Skills
          </SkillsButton>
        </PageHeader>
        
        <CharacterHeader character={character} resources={resources} />
        
        <ResourcesGrid resources={resources} />

        <MainContent>
          <AbilitiesSection
            abilities={abilities}
            activeCategory={activeCategory}
            isLoading={isLoadingAbilities}
            onCategoryChange={setActiveCategory}
            onAbilityClick={handleAbilityClick}
            isRecentlyUsed={isRecentlyUsed}
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
      </Container>
    </ThemeProvider>
  );
} 