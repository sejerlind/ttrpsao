'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styled, { ThemeProvider } from 'styled-components';
import { theme } from '../theme';
import { supabase, type DatabaseCharacter } from '../../../../lib/supabase';
import TechTree from '../../../../components/player/TechTree';
import { PlayerProgression, SkillTreeType, SkillNode, SkillCategory } from '../../../../components/types'; // Adjusted path

// Map database skill tree names to enum values
const mapSkillTreeName = (dbName: string): SkillTreeType => {
  const mapping: Record<string, SkillTreeType> = {
    'combat': SkillTreeType.COMBAT,
    'magic': SkillTreeType.MAGIC,
    'crafting': SkillTreeType.CRAFTING,
    'defensive': SkillTreeType.DEFENSIVE,
    'exploration': SkillTreeType.EXPLORATION,
    'social': SkillTreeType.SOCIAL
  };
  const mapped = mapping[dbName] || SkillTreeType.COMBAT;
  if (!mapping[dbName]) {
    console.warn(`Unknown skill tree name: ${dbName}, defaulting to COMBAT`);
  }
  return mapped;
};

// Import the positioning function from TechTree
export const calculateTreePositions = (skills: SkillNode[]): SkillNode[] => {
  // --- layout constants (tune freely) ---------------------------------------
  const NODE_WIDTH = 84;        // approx width of a node in px
  const NODE_X_GAP = 120;       // gap between nodes inside the same group
  const GROUP_GAP = 140;        // gap between different groups on the same tier
  const TREE_WIDTH = 460;       // width reserved for each tree column
  const TREE_GAP = 160;         // gap between tree columns
  const LEFT_MARGIN = 60;       // left page margin
  const TIER_Y_START = 210;     // where tier 1 starts (keeps headers clear)
  const TIER_Y_GAP = 170;       // vertical gap between tiers

  // Preferred left→right order of trees (whatever your enum is)
  const treeOrder: SkillTreeType[] = [
    SkillTreeType.COMBAT,
    SkillTreeType.CRAFTING,
    SkillTreeType.MAGIC,
    SkillTreeType.DEFENSIVE,
    SkillTreeType.EXPLORATION,
    SkillTreeType.SOCIAL,
  ];

  // Useful maps
  const byId = new Map(skills.map(s => [s.id, s]));

  // Find which trees exist in the dataset and sort by preferred order
  const trees = Array.from(new Set(skills.map(s => s.skillTree)))
    .sort((a, b) => treeOrder.indexOf(a) - treeOrder.indexOf(b));

  // Column offsets for each tree (no string switching; works with enums)
  const treeOffset = new Map<SkillTreeType, number>();
  trees.forEach((t, i) => {
    treeOffset.set(t, LEFT_MARGIN + i * (TREE_WIDTH + TREE_GAP));
  });

  // Group skills by tree
  const byTree = new Map<SkillTreeType, SkillNode[]>();
  for (const s of skills) {
    const arr = byTree.get(s.skillTree) || [];
    arr.push(s);
    byTree.set(s.skillTree, arr);
  }

  // Layout per tree
  for (const t of trees) {
    const treeSkills = byTree.get(t) || [];
    const startX = treeOffset.get(t)!;

    // Group by tier in this tree
    const tiers = new Map<number, SkillNode[]>();
    for (const s of treeSkills) {
      const arr = tiers.get(s.tier) || [];
      arr.push(s);
      tiers.set(s.tier, arr);
    }
    const maxTier = Math.max(...Array.from(tiers.keys()));

    for (let tier = 1; tier <= maxTier; tier++) {
      const nodes = tiers.get(tier) || [];
      if (!nodes.length) continue;

      const baseY = TIER_Y_START + (tier - 1) * TIER_Y_GAP;

      type Group = {
        parentId: string | null;
        nodes: SkillNode[];
        width: number;
        center: number; // desired center (usually parent's x)
      };

      const groups: Group[] = [];

      if (tier === 1) {
        // Each tier-1 node is its own group, centered in the tree column
        for (const n of nodes) {
          groups.push({
            parentId: null,
            nodes: [n],
            width: NODE_WIDTH,
            center: startX + TREE_WIDTH / 2,
          });
        }
      } else {
        // Children group under a parent from previous tier (if any)
        const prevTierIds = new Set((tiers.get(tier - 1) || []).map(n => n.id));
        const tmp = new Map<string, SkillNode[]>();

        for (const n of nodes) {
          const parent = (n.prerequisites || []).find(p => prevTierIds.has(p));
          const key = parent ?? `orphan-${n.id}`;
          if (!tmp.has(key)) tmp.set(key, []);
          tmp.get(key)!.push(n);
        }

        for (const [key, arr] of tmp) {
          const width = Math.max(NODE_WIDTH, NODE_WIDTH + (arr.length - 1) * NODE_X_GAP);
          const parentId = key.startsWith('orphan-') ? null : key;
          const parentX =
            parentId && byId.get(parentId) ? byId.get(parentId)!.position.x : startX + TREE_WIDTH / 2;

          groups.push({ parentId, nodes: arr, width, center: parentX });
        }
      }

      // Sort by desired center (so left-to-right follows parents),
      // then lay groups without overlap, keeping at least GROUP_GAP
      groups.sort((a, b) => a.center - b.center);

      let cursor = startX + 30; // small left padding inside the tree column
      for (const g of groups) {
        const desiredLeft = g.center - g.width / 2;
        const left = Math.max(desiredLeft, cursor);
        g.center = left + g.width / 2;
        cursor = left + g.width + GROUP_GAP;
      }

      // If we overflow the column, shift left a bit to balance
      const used = cursor - startX - GROUP_GAP + 30; // width we actually used
      const overflow = used > TREE_WIDTH ? used - TREE_WIDTH : 0;
      const shift = overflow ? -overflow / 2 : 0;

      // Finally place nodes inside each group (evenly spaced)
      for (const g of groups) {
        const count = g.nodes.length;

        if (count === 1) {
          g.nodes[0].position.x = g.center + shift;
          g.nodes[0].position.y = baseY;
        } else {
          const span = (count - 1) * NODE_X_GAP;
          let x = g.center - span / 2 + shift;

          // deterministic order inside a group
          g.nodes.sort((a, b) => a.name.localeCompare(b.name));

          for (const n of g.nodes) {
            n.position.x = x;
            n.position.y = baseY;
            x += NODE_X_GAP;
          }
        }
      }
    }
  }

  return skills;
};

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

const ResetButton = styled.button`
  background: ${props => props.theme.colors.status.error};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  &:hover {
    background: #dc2626;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
  }

  &:disabled {
    background: #6b7280;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  &::before {
    content: '🔄';
    font-size: 1rem;
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
  skillPoints: level * 2, // 2 skill points per level
  unspentSkillPoints: Math.max(0, level * 2 - 3), // Start with some spent points
  levelSkillPoints: level * 2, // Skill points from level alone
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

          const mappedSkills = skillsData.map(skill => {
            const characterSkill = characterSkillsMap.get(skill.id);
            const currentRank = characterSkill?.current_rank || 0;
            const isUnlocked = characterSkill?.is_unlocked || false;
            
            // Basic skills (tier 1 with no prerequisites) should be unlocked by default
            const shouldBeUnlocked = skill.tier === 1 && (!skill.prerequisites || skill.prerequisites.length === 0);
            
            return {
              id: skill.id,
              name: skill.name,
              description: skill.description || '',
              icon: skill.icon || '⚔️',
              tier: skill.tier,
              position: { x: 0, y: 0 }, // Will be calculated by calculateTreePositions
              position_x: skill.position_x,
              position_y: skill.position_y,
              skillTree: mapSkillTreeName(skill.skill_tree),
              prerequisites: skill.prerequisites || [],
              cost: {
                skillPoints: skill.cost_skill_points,
                level: skill.cost_level,
                ...(skill.cost_gold > 0 && { gold: skill.cost_gold })
              },
              maxRank: skill.max_rank,
              currentRank: currentRank,
              isUnlocked: isUnlocked || shouldBeUnlocked,
              isMaxed: currentRank >= skill.max_rank,
              category: skill.category as SkillCategory,
              effects: skill.effects || []
            };
          });

          progression = {
            totalLevel: progressionData?.total_level || characterData.level,
            skillPoints: progressionData?.skill_points || characterData.level * 2,
            unspentSkillPoints: progressionData?.unspent_skill_points || Math.max(0, characterData.level * 2 - 3),
            levelSkillPoints: progressionData?.level_skill_points || characterData.level * 2,
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

          // Apply positioning to the mapped skills
          const positionedSkills = calculateTreePositions(mappedSkills);
          
          // Debug: Log skill distribution by tree
          const skillsByTree = positionedSkills.reduce((acc, skill) => {
            if (!acc[skill.skillTree]) acc[skill.skillTree] = [];
            acc[skill.skillTree].push(skill);
            return acc;
          }, {} as Record<string, SkillNode[]>);
          
          console.log('Skills by tree:', Object.keys(skillsByTree).map(tree => 
            `${tree}: ${skillsByTree[tree].length} skills`
          ));
          
          // Debug: Log actual positions for each tree
          Object.keys(skillsByTree).forEach(tree => {
            const treeSkills = skillsByTree[tree];
            if (treeSkills.length > 0) {
              const positions = treeSkills.map(s => `(${s.position.x}, ${s.position.y})`);
              console.log(`${tree} positions:`, positions);
            }
          });
          
          // Update the TechTree component to use the mapped skills
          // We'll need to pass the skills data to the component
          console.log('Loaded skills from database:', positionedSkills.length, 'skills');
          setLoadedSkills(positionedSkills as SkillNode[]);
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

  const handleSkillUpgrade = async (skillId: string) => {
    console.log('Upgrading skill:', skillId);
    console.log('Player progression:', playerProgression);
    console.log('Character:', character);
    console.log('Loaded skills:', loadedSkills);
    
    if (!playerProgression || !character) {
      console.error('Missing character or progression data');
      alert('Missing character or progression data');
      return;
    }

    // Check if we have enough skill points
    if (playerProgression.unspentSkillPoints <= 0) {
      console.log('Not enough skill points');
      return;
    }

    // Find the skill to upgrade
    const skillToUpgrade = loadedSkills?.find(skill => skill.id === skillId);
    if (!skillToUpgrade) {
      console.error('Skill not found:', skillId);
      return;
    }

    // Check level requirement
    if (character.level < skillToUpgrade.cost.level) {
      console.log('Level requirement not met');
      return;
    }

    // Check prerequisites
    const hasPrereqs = skillToUpgrade.prerequisites.every(prereqId => 
      playerProgression.unlockedSkills.includes(prereqId)
    );
    
    if (!hasPrereqs) {
      console.log('Prerequisites not met');
      return;
    }

    // Check if skill is already maxed
    if (skillToUpgrade.isMaxed) {
      console.log('Skill is already maxed');
      return;
    }

    try {
      // If database is available, use the upgrade function
      if (supabase) {
        const { data, error } = await supabase.rpc('upgrade_skill', {
          p_character_id: character.id,
          p_skill_id: skillId
        });

        if (error) {
          console.error('Database error:', error);
          alert(`Database error: ${error.message}`);
          return;
        }

        if (!data) {
          console.error('No data returned from database');
          alert('No response from database');
          return;
        }

        if (!data.success) {
          console.log('Upgrade failed:', data.message);
          alert(`Skill upgrade failed: ${data.message}`);
          return;
        }

        console.log('Skill upgraded successfully:', data);
      } else {
        // Fallback for when database is not available - just update local state
        console.log('Database not available, updating local state only');
      }

      // Update local state
      setPlayerProgression(prev => {
        if (!prev) return null;
        
        const newUnspentPoints = Math.max(0, prev.unspentSkillPoints - skillToUpgrade.cost.skillPoints);
        const newUnlockedSkills = prev.unlockedSkills.includes(skillId) 
          ? prev.unlockedSkills 
          : [...prev.unlockedSkills, skillId];
        
        console.log('Updating progression:', {
          oldUnspent: prev.unspentSkillPoints,
          newUnspent: newUnspentPoints,
          oldUnlocked: prev.unlockedSkills,
          newUnlocked: newUnlockedSkills
        });
        
        return {
          ...prev,
          unspentSkillPoints: newUnspentPoints,
          unlockedSkills: newUnlockedSkills
        };
      });

      // Update loaded skills
      setLoadedSkills(prev => {
        if (!prev) return null;
        
        return prev.map(skill => {
          if (skill.id === skillId) {
            const newRank = skill.currentRank + 1;
            const updatedSkill = {
              ...skill,
              currentRank: newRank,
              isUnlocked: true,
              isMaxed: newRank >= skill.maxRank
            };
            console.log('Updating skill:', skill.id, 'from rank', skill.currentRank, 'to', newRank);
            return updatedSkill;
          }
          return skill;
        });
      });

      console.log('Skill upgraded successfully:', skillId);
      
      // Show success message
      const skillName = skillToUpgrade.name;
      const newRank = skillToUpgrade.currentRank + 1;
      console.log(`Successfully upgraded ${skillName} to rank ${newRank}!`);
    } catch (error) {
      console.error('Error upgrading skill:', error);
      console.log(`Error upgrading skill: ${error}`);
    }
  };

  const handleSkillPreview = (skill: SkillNode | null) => {
    console.log('Previewing skill:', skill);
    // Here you could show additional information about the skill
    // in a side panel or update some state for skill comparison
  };

  const handleResetSkills = async () => {
    if (!character) {
      console.error('No character selected');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to reset ALL skills for ${character.name}? This will restore all skill points but remove all skill upgrades. This action cannot be undone!`
    );

    if (!confirmed) {
      return;
    }

    try {
      if (supabase) {
        const { data, error } = await supabase.rpc('reset_character_skills', {
          p_character_id: character.id
        });

        if (error) {
          console.error('Database error:', error);
          alert(`Database error: ${error.message}`);
          return;
        }

        if (!data || !data.success) {
          console.log('Reset failed:', data?.message);
          alert(`Reset failed: ${data?.message || 'Unknown error'}`);
          return;
        }

        console.log('Skills reset successfully:', data);
      }

      // Update local state to reflect the reset
      setPlayerProgression(prev => {
        if (!prev) return null;
        
        const totalSkillPoints = character.level * 2;
        return {
          ...prev,
          unspentSkillPoints: totalSkillPoints,
          unlockedSkills: []
        };
      });

      // Reset loaded skills
      setLoadedSkills(prev => {
        if (!prev) return null;
        
        return prev.map(skill => ({
          ...skill,
          currentRank: 0,
          isUnlocked: skill.tier === 1 && (!skill.prerequisites || skill.prerequisites.length === 0),
          isMaxed: false
        }));
      });

      console.log('All skills have been reset!');
      alert(`All skills have been reset! You now have ${character.level * 2} skill points available.`);
    } catch (error) {
      console.error('Error resetting skills:', error);
      alert(`Error resetting skills: ${error}`);
    }
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
          <ResetButton onClick={handleResetSkills}>
            Reset All Skills
          </ResetButton>
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