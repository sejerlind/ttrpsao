'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styled, { ThemeProvider } from 'styled-components';
import { theme } from '../theme';
import { supabase, type DatabaseCharacter } from '../../../../lib/supabase';
import TechTree from '../../../../components/player/TechTree';
import { PlayerProgression, SkillTreeType, SkillNode, SkillCategory } from '../../../../components/types'; // Adjusted path

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

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};

  .spinner {
    width: 50px;
    height: 50px;
    border: 3px solid ${props => props.theme.colors.surface.border};
    border-top: 3px solid ${props => props.theme.colors.accent.cyan};
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
  text-align: center;

  .error-icon {
    font-size: 4rem;
    opacity: 0.5;
  }

  h3 {
    color: ${props => props.theme.colors.status.error};
    margin: 0;
  }

  button {
    background: ${props => props.theme.colors.accent.cyan};
    color: ${props => props.theme.colors.primary.bg};
    border: none;
    padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
    border-radius: ${props => props.theme.borderRadius.medium};
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: ${props => props.theme.colors.accent.blue};
      transform: translateY(-2px);
    }
  }
`;

// Sample player progression data
const createSampleProgression = (level: number): PlayerProgression => ({
  totalLevel: level,
  skillPoints: Math.floor(level * 2.5),
  unspentSkillPoints: Math.max(0, Math.floor(level * 0.5) - 3),
  talentPoints: Math.floor(level / 5),
  unspentTalentPoints: Math.max(0, Math.floor(level / 10)),
  skillTrees: {
    [SkillTreeType.COMBAT]: {
      totalPointsSpent: Math.min(10, Math.floor(level * 0.3)),
      highestTierUnlocked: Math.min(3, Math.floor(level / 10) + 1),
      specializations: level > 15 ? ['weapon_master'] : [],
      masteryBonus: level > 20 ? 0.1 : 0
    },
    [SkillTreeType.MAGIC]: {
      totalPointsSpent: Math.min(8, Math.floor(level * 0.2)),
      highestTierUnlocked: Math.min(2, Math.floor(level / 15) + 1),
      specializations: [],
      masteryBonus: 0
    },
    [SkillTreeType.CRAFTING]: {
      totalPointsSpent: Math.min(5, Math.floor(level * 0.1)),
      highestTierUnlocked: 1,
      specializations: [],
      masteryBonus: 0
    },
    [SkillTreeType.EXPLORATION]: {
      totalPointsSpent: Math.min(6, Math.floor(level * 0.15)),
      highestTierUnlocked: Math.min(2, Math.floor(level / 12) + 1),
      specializations: [],
      masteryBonus: 0
    },
    [SkillTreeType.SOCIAL]: {
      totalPointsSpent: Math.min(3, Math.floor(level * 0.05)),
      highestTierUnlocked: 1,
      specializations: [],
      masteryBonus: 0
    },
    [SkillTreeType.DEFENSIVE]: {
      totalPointsSpent: Math.min(7, Math.floor(level * 0.18)),
      highestTierUnlocked: Math.min(2, Math.floor(level / 14) + 1),
      specializations: [],
      masteryBonus: 0
    }
  },
  unlockedSkills: level > 1 ? ['combat_basic_attack', 'magic_basic_spells'] : ['combat_basic_attack'],
  masteryLevels: {
    'sword': Math.min(100, level * 3),
    'magic': Math.min(100, level * 2),
    'crafting': Math.min(100, level * 1)
  }
});

export default function SkillsPage() {
  const params = useParams();
  const router = useRouter();
  const [character, setCharacter] = useState<DatabaseCharacter | null>(null);
  const [playerProgression, setPlayerProgression] = useState<PlayerProgression | null>(null);
  const [loadedSkills, setLoadedSkills] = useState<SkillNode[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCharacter = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if Supabase is configured
      if (!supabase) {
        console.log('Database not configured, using sample data');
        // Use sample character data when database is not available
        const sampleCharacter: DatabaseCharacter = {
          id: params.id as string,
          name: 'Sample Character',
          class: 'Paladin',
          level: 38,
          experience: 28500,
          experience_to_next: 42000,
          health_current: 280,
          health_max: 320,
          mana_current: 65,
          mana_max: 80,
          stamina_current: 140,
          stamina_max: 160,
          action_points_current: 5,
          action_points_max: 7,
          armor_current: 145,

          magic_resist_current: 85,

        };
        
        setCharacter(sampleCharacter);
        setPlayerProgression(createSampleProgression(sampleCharacter.level));
        setIsLoading(false);
        return;
      }

      // Try to fetch character from database
      try {
        const { data: characterData, error: characterError } = await supabase
          .from('characters')
          .select('*')
          .eq('id', params.id)
          .single();

        if (characterError) {
          console.log('Database error occurred, using fallback data:', characterError.message || 'Unknown error');
          throw new Error(`Database error: ${characterError.message || 'Unknown error'}`);
        }

        if (!characterData) {
          console.log('Character not found in database, using sample data');
          throw new Error('Character not found');
        }

        // Load skills from database
        const { data: skillsData, error: skillsError } = await supabase
          .from('skills')
          .select('*')
          .order('skill_tree, tier, position_x, position_y');

        // Load character's skill progression
        const { data: characterSkillsData, error: characterSkillsError } = await supabase
          .from('character_skills')
          .select('*')
          .eq('character_id', params.id);

        // Load player progression
        const { data: progressionData, error: progressionError } = await supabase
          .from('player_progression')
          .select('*')
          .eq('character_id', params.id)
          .single();

        if (skillsError || characterSkillsError || progressionError) {
          console.log('Error loading skill data, using sample progression');
        }

        // Successfully loaded from database
        setCharacter(characterData);
        
        // Create progression data from database or fallback to sample
        let progression: PlayerProgression;
        
        if (skillsData && !skillsError) {
          // Map database skills to our skill format and merge with character progression
          const characterSkillsMap = new Map(
            (characterSkillsData || []).map(cs => [cs.skill_id, cs])
          );

          const mappedSkills = skillsData.map(skill => ({
            id: skill.id,
            name: skill.name,
            description: skill.description || '',
            icon: skill.icon || '⚔️',
            tier: skill.tier,
            position: { x: skill.position_x, y: skill.position_y },
            skillTree: skill.skill_tree as SkillTreeType,
            prerequisites: skill.prerequisites || [],
            cost: {
              skillPoints: skill.cost_skill_points,
              level: skill.cost_level,
              ...(skill.cost_gold > 0 && { gold: skill.cost_gold })
            },
            maxRank: skill.max_rank,
            currentRank: characterSkillsMap.get(skill.id)?.current_rank || 0,
            isUnlocked: characterSkillsMap.get(skill.id)?.is_unlocked || false,
            isMaxed: (characterSkillsMap.get(skill.id)?.current_rank || 0) >= skill.max_rank,
            category: skill.category as SkillCategory,
            effects: skill.effects || []
          }));

          progression = {
            totalLevel: progressionData?.total_level || characterData.level,
            skillPoints: progressionData?.skill_points || Math.floor(characterData.level * 2),
            unspentSkillPoints: progressionData?.unspent_skill_points || Math.floor(characterData.level * 0.2),
            talentPoints: progressionData?.talent_points || Math.floor(characterData.level / 2),
            unspentTalentPoints: progressionData?.unspent_talent_points || Math.floor(characterData.level * 0.1),
            skillTrees: {
              [SkillTreeType.COMBAT]: { totalPointsSpent: 0, highestTierUnlocked: 1, specializations: [], masteryBonus: 0 },
              [SkillTreeType.MAGIC]: { totalPointsSpent: 0, highestTierUnlocked: 1, specializations: [], masteryBonus: 0 },
              [SkillTreeType.CRAFTING]: { totalPointsSpent: 0, highestTierUnlocked: 1, specializations: [], masteryBonus: 0 },
              [SkillTreeType.EXPLORATION]: { totalPointsSpent: 0, highestTierUnlocked: 1, specializations: [], masteryBonus: 0 },
              [SkillTreeType.SOCIAL]: { totalPointsSpent: 0, highestTierUnlocked: 1, specializations: [], masteryBonus: 0 },
              [SkillTreeType.DEFENSIVE]: { totalPointsSpent: 0, highestTierUnlocked: 1, specializations: [], masteryBonus: 0 }
            },
            unlockedSkills: mappedSkills.filter(s => s.isUnlocked).map(s => s.id),
            masteryLevels: {}
          };

          // Update the TechTree component to use the mapped skills
          // We'll need to pass the skills data to the component
          console.log('Loaded skills from database:', mappedSkills.length, 'skills');
          setLoadedSkills(mappedSkills as SkillNode[]);
        } else {
          // Fallback to sample progression
          progression = createSampleProgression(characterData.level);
        }
        
        setPlayerProgression(progression);
        
      } catch {
        console.log('Database operation failed, using sample character data');
        
        // Use sample character data as fallback
        const fallbackCharacter: DatabaseCharacter = {
          id: params.id as string,
          name: 'Demo Character',
          class: 'Mage',
          level: 25,
          experience: 15000,
          experience_to_next: 25000,
          health_current: 150,
          health_max: 175,
          mana_current: 220,
          mana_max: 250,
          stamina_current: 90,
          stamina_max: 110,
          action_points_current: 7,
          action_points_max: 7,
          armor_current: 45,

          magic_resist_current: 79,

        };
        
        setCharacter(fallbackCharacter);
        setPlayerProgression(createSampleProgression(fallbackCharacter.level));
      }

    } catch {
      console.log('Unexpected error, using final fallback character data');
      
      // Final fallback - ensure we always have a character
      const ultimateFallback: DatabaseCharacter = {
        id: params.id as string,
        name: 'Fallback Character',
        class: 'Archer',
        level: 15,
        experience: 7500,
        experience_to_next: 12000,
        health_current: 120,
        health_max: 150,
        mana_current: 80,
        mana_max: 100,
        stamina_current: 160,
        stamina_max: 180,
        action_points_current: 8,
        action_points_max: 10,
        armor_current: 60,
        magic_resist_current: 50
      };
      
      setCharacter(ultimateFallback);
      setPlayerProgression(createSampleProgression(ultimateFallback.level));
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      loadCharacter();
    }
  }, [params.id, loadCharacter]);

  const handleSkillUpgrade = (skillId: string) => {
    console.log('Upgrading skill:', skillId);
    // Here you would implement the actual skill upgrade logic
    // This would typically involve:
    // 1. Checking if the player has enough skill points
    // 2. Checking prerequisites
    // 3. Updating the database
    // 4. Updating the local state
    
    if (playerProgression && playerProgression.unspentSkillPoints > 0) {
      setPlayerProgression(prev => prev ? {
        ...prev,
        unspentSkillPoints: prev.unspentSkillPoints - 1,
        unlockedSkills: [...prev.unlockedSkills, skillId]
      } : null);
    }
  };

  const handleSkillPreview = (skill: SkillNode | null) => {
    console.log('Previewing skill:', skill);
    // Here you could show additional information about the skill
    // in a side panel or update some state for skill comparison
  };

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <LoadingContainer>
            <div className="spinner"></div>
            <h3>Loading Character Skills...</h3>
          </LoadingContainer>
        </Container>
      </ThemeProvider>
    );
  }

  if (error || !character || !playerProgression) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <ErrorContainer>
            <div className="error-icon">⚠️</div>
            <h3>Error Loading Skills</h3>
            <p>{error || 'Character not found'}</p>
            <button onClick={loadCharacter}>Retry</button>
          </ErrorContainer>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <PageHeader>
          <BackButton onClick={() => router.back()}>
            Back to Character
          </BackButton>
          <PageTitle>Skills & Talents - {character.name}</PageTitle>
        </PageHeader>

        <TechTree
          playerProgression={playerProgression}
          onSkillUpgrade={handleSkillUpgrade}
          onSkillPreview={handleSkillPreview}
          skills={loadedSkills || undefined}
        />
      </Container>
    </ThemeProvider>
  );
} 