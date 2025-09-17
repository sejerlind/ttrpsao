// src/utils/skillMappers.ts
// Maps your DS rows to your internal SkillNode shape with simple positioning.

import { SkillNode, SkillTreeType, SkillCategory, PlayerProgression } from '../../components/types';

// The row shape coming from your datasource (what you pasted)
export type DsRow = {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: number;
  position_x: number;
  position_y: number;
  skill_tree: string;
  prerequisites: string[] | null;
  cost_skill_points: number;
  cost_level: number;
  cost_gold: number;
  max_rank: number;
  category: string;
  effects: string; // JSON string in DS (often "[]")
};

// --- helpers -----------------------------------------------------------------

const mapSkillTree = (s: string): SkillTreeType => {
  const normalized = (s || '').toLowerCase().trim();
  switch (normalized) {
    case 'combat': return SkillTreeType.COMBAT;
    case 'magic': return SkillTreeType.MAGIC;
    case 'defense':
    case 'defensive': return SkillTreeType.DEFENSIVE;
    case 'crafting': return SkillTreeType.CRAFTING;
    case 'exploration': return SkillTreeType.EXPLORATION;
    case 'social': return SkillTreeType.SOCIAL;
    default: 
      console.warn(`Unknown skill tree: "${s}", defaulting to CRAFTING`);
      return SkillTreeType.CRAFTING;
  }
};

const mapCategory = (s: string): SkillCategory => {
  const val = (s || '').toLowerCase();
  if (val === 'passive') return SkillCategory.PASSIVE;
  if (val === 'active') return SkillCategory.ACTIVE;
  if (val === 'ultimate') return SkillCategory.ULTIMATE;

  // Some DS rows use "legendary". If your enum lacks it, fallback safely.
  if (val === 'legendary') return (SkillCategory.LEGENDARY ?? SkillCategory.ULTIMATE);

  return SkillCategory.PASSIVE;
};

const parseEffects = (effectsStr: string | undefined, name: string) => {
  try {
    const v = effectsStr ? JSON.parse(effectsStr) : [];
    if (Array.isArray(v)) return v;
  } catch {}
  return [{ type: 'info', target: name, value: 1, description: name }];
};

// --- public API --------------------------------------------------------------

/**
 * Convert your DS rows → SkillNode[] (without positions filled yet).
 * We infer isUnlocked/currentRank if you don't store ranks yet.
 */
export const mapDsToSkillNodes = (
  rows: DsRow[],
  playerProgression: PlayerProgression
): SkillNode[] => {
  const unlocked = new Set(playerProgression.unlockedSkills ?? []);

  return rows.map<SkillNode>((r) => {
    const skillTree = mapSkillTree(r.skill_tree);
    const isUnlocked = unlocked.has(r.id) || r.tier === 1; // tweak if tier1 should be locked
    const currentRank = isUnlocked ? Math.min(1, r.max_rank || 1) : 0;
    const isMaxed = currentRank >= (r.max_rank || 1);

    return {
      id: r.id,
      name: r.name,
      description: r.description,
      icon: r.icon,
      tier: r.tier,
      position: { x: r.position_x * 150, y: r.position_y * 150 }, // Use actual positions from DB
      skillTree,
      prerequisites: Array.isArray(r.prerequisites) ? r.prerequisites : [],
      cost: {
        skillPoints: r.cost_skill_points ?? 0,
        level: r.cost_level ?? 1,
        gold: r.cost_gold ?? 0,
      },
      maxRank: r.max_rank ?? 1,
      currentRank,
      isUnlocked,
      isMaxed,
      category: mapCategory(r.category),
      effects: parseEffects(r.effects, r.name),
    };
  });
};

/**
 * Position skills in a three-tree layout with proper branching like the image
 */
export const calculateTreePositions = (skills: SkillNode[]): SkillNode[] => {
  console.log('=== CALCULATING TREE POSITIONS ===');
  console.log('Input skills:', skills.length);
  
  // Group skills by tree type
  const skillsByTree = skills.reduce((acc, skill) => {
    if (!acc[skill.skillTree]) acc[skill.skillTree] = [];
    acc[skill.skillTree].push(skill);
    return acc;
  }, {} as Record<string, SkillNode[]>);
  
  console.log('Skills grouped by tree:', Object.keys(skillsByTree).map(tree => ({
    tree,
    count: skillsByTree[tree].length
  })));

  // Position each tree separately
  Object.entries(skillsByTree).forEach(([treeType, treeSkills]) => {
    console.log(`\n--- Positioning ${treeType} tree (${treeSkills.length} skills) ---`);
    
    // Group by tier within each tree
    const skillsByTier = treeSkills.reduce((acc, skill) => {
      if (!acc[skill.tier]) acc[skill.tier] = [];
      acc[skill.tier].push(skill);
      return acc;
    }, {} as Record<number, SkillNode[]>);
    
    console.log('Skills by tier:', Object.keys(skillsByTier).map(tier => ({
      tier: parseInt(tier),
      count: skillsByTier[parseInt(tier)].length,
      skills: skillsByTier[parseInt(tier)].map(s => s.name)
    })));

    // Calculate tree-specific X offset - center each tree in its section
    let treeXOffset = 0;
    const treeSectionWidth = 300; // Width of each tree section
    switch (treeType) {
      case 'combat': treeXOffset = 50; break;      // Left tree - more centered
      case 'crafting': treeXOffset = 400; break;   // Middle tree - centered
      case 'magic': treeXOffset = 750; break;      // Right tree - more centered
    }

    // Position skills in a branching pattern
    Object.entries(skillsByTier).forEach(([tier, tierSkills]) => {
      const tierNum = parseInt(tier);
      const baseY = 200 + (tierNum - 1) * 120; // Better vertical spacing between tiers
      
      console.log(`\n  Tier ${tierNum} (${tierSkills.length} skills):`);
      console.log(`  Base Y position: ${baseY}`);
      
      // Sort skills by prerequisites to create proper branching
      tierSkills.sort((a, b) => {
        // Skills with fewer prerequisites come first
        const aPrereqs = a.prerequisites?.length || 0;
        const bPrereqs = b.prerequisites?.length || 0;
        if (aPrereqs !== bPrereqs) return aPrereqs - bPrereqs;
        return a.name.localeCompare(b.name);
      });

      // Calculate horizontal distribution based on tier
      const skillCount = tierSkills.length;
      const centerX = treeXOffset + treeSectionWidth / 2;
      
      // All skills in the same tier get the same X position (center of tree)
      tierSkills.forEach((skill) => {
        skill.position.x = centerX;
        skill.position.y = baseY;
      });
      
      console.log(`    All ${skillCount} skills in tier ${tierNum} positioned at center X: ${centerX}, Y: ${baseY}`);
      tierSkills.forEach(skill => {
        console.log(`      ${skill.name}: (${skill.position.x}, ${skill.position.y})`);
      });
    });
  });

  console.log('\n=== FINAL POSITIONED SKILLS ===');
  skills.forEach(skill => {
    console.log(`${skill.name} (${skill.skillTree} T${skill.tier}): (${skill.position.x}, ${skill.position.y})`);
  });
  console.log('=== END POSITIONING ===\n');

  return skills;
};
