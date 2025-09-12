import React, { useState } from 'react';
import styled from 'styled-components';
import { supabase } from '@/lib/supabase';
import { Enemy } from '@/components/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

const CreatorContainer = styled.div`
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.card};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const CreatorHeader = styled.h3`
  color: ${props => props.theme.colors.text.accent};
  font-size: 1.2rem;
  margin-bottom: ${props => props.theme.spacing.lg};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  &::before {
    content: '🛠️';
    font-size: 1.1rem;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};

  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};

  label {
    display: block;
    margin-bottom: ${props => props.theme.spacing.sm};
    font-weight: bold;
    color: ${props => props.theme.colors.text.accent};
    font-size: 0.9rem;
  }

  input, textarea, select {
    width: 100%;
    padding: ${props => props.theme.spacing.sm};
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: ${props => props.theme.borderRadius.medium};
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 0.9rem;

    &::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    &:focus {
      outline: none;
      border-color: ${props => props.theme.colors.accent.cyan};
      background: rgba(255, 255, 255, 0.15);
    }
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }

  input[type="number"] {
    max-width: 120px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const PresetButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.lg};
  flex-wrap: wrap;
`;

const PresetButton = styled.button`
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  justify-content: flex-end;
  margin-top: ${props => props.theme.spacing.lg};
`;

const ValidationError = styled.div`
  color: ${props => props.theme.colors.status.error};
  font-size: 0.8rem;
  margin-top: ${props => props.theme.spacing.xs};
`;

interface MonsterCreatorProps {
  onMonsterCreated: () => void;
}

interface MonsterPreset {
  name: string;
  type: string;
  level: number;
  health_max: number;
  mana_max: number;
  attack_power: number;
  defense: number;
  speed: number;
  armor_value: number;
  magic_resist_value: number;
  experience_reward: number;
  gold_reward: number;
  description: string;
}

const monsterPresets: Record<string, MonsterPreset> = {
  minion: {
    name: 'Custom Minion',
    type: 'minion',
    level: 1,
    health_max: 40,
    mana_max: 20,
    attack_power: 6,
    defense: 2,
    speed: 8,
    armor_value: 5,
    magic_resist_value: 2,
    experience_reward: 25,
    gold_reward: 10,
    description: 'A weak creature perfect for low-level encounters.'
  },
  soldier: {
    name: 'Custom Soldier',
    type: 'humanoid',
    level: 3,
    health_max: 100,
    mana_max: 30,
    attack_power: 12,
    defense: 6,
    speed: 10,
    armor_value: 20,
    magic_resist_value: 8,
    experience_reward: 75,
    gold_reward: 40,
    description: 'A trained warrior with standard combat abilities.'
  },
  elite: {
    name: 'Custom Elite',
    type: 'elite',
    level: 5,
    health_max: 180,
    mana_max: 60,
    attack_power: 18,
    defense: 10,
    speed: 12,
    armor_value: 35,
    magic_resist_value: 15,
    experience_reward: 150,
    gold_reward: 80,
    description: 'A powerful foe that requires strategy to defeat.'
  },
  boss: {
    name: 'Custom Boss',
    type: 'boss',
    level: 8,
    health_max: 350,
    mana_max: 120,
    attack_power: 25,
    defense: 15,
    speed: 8,
    armor_value: 60,
    magic_resist_value: 40,
    experience_reward: 400,
    gold_reward: 200,
    description: 'A formidable opponent that challenges entire parties.'
  }
};

export default function MonsterCreator({ onMonsterCreated }: MonsterCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<Enemy>>({
    name: '',
    type: 'custom',
    level: 1,
    health_max: 100,
    health_current: 100,
    mana_max: 50,
    mana_current: 50,
    attack_power: 10,
    defense: 5,
    speed: 10,
    armor_value: 10,
    magic_resist_value: 5,
    experience_reward: 50,
    gold_reward: 25,
    description: '',
    abilities: [],
    resistances: [],
    weaknesses: []
  });

  const handleInputChange = (field: keyof Enemy, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const applyPreset = (presetKey: string) => {
    const preset = monsterPresets[presetKey];
    setFormData({
      ...formData,
      ...preset,
      health_current: preset.health_max,
      mana_current: preset.mana_max
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.type?.trim()) {
      errors.type = 'Type is required';
    }

    if (!formData.level || formData.level < 1) {
      errors.level = 'Level must be at least 1';
    }

    if (!formData.health_max || formData.health_max < 1) {
      errors.health_max = 'Max health must be at least 1';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createMonster = async () => {
    if (!validateForm() || !supabase) return;

    setIsCreating(true);
    try {
      const monsterData = {
        ...formData,
        health_current: formData.health_max,
        mana_current: formData.mana_max,
        abilities: formData.abilities || [],
        resistances: formData.resistances || [],
        weaknesses: formData.weaknesses || []
      };

      const { error } = await supabase
        .from('enemies')
        .insert([monsterData]);

      if (error) {
        console.error('Error creating monster:', error);
        alert(`Failed to create monster: ${error.message}`);
      } else {
        alert(`${formData.name} has been created successfully!`);
        resetForm();
        setIsOpen(false);
        onMonsterCreated();
      }
    } catch (error) {
      console.error('Failed to create monster:', error);
      alert('Failed to create monster');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'custom',
      level: 1,
      health_max: 100,
      health_current: 100,
      mana_max: 50,
      mana_current: 50,
      attack_power: 10,
      defense: 5,
      speed: 10,
      experience_reward: 50,
      gold_reward: 25,
      description: '',
      abilities: [],
      resistances: [],
      weaknesses: []
    });
    setValidationErrors({});
  };

  const handleArrayInput = (field: 'abilities' | 'resistances' | 'weaknesses', value: string) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    handleInputChange(field, array);
  };

  return (
    <>
      <CreatorContainer>
        <CreatorHeader>Monster Creator</CreatorHeader>
        <p style={{ 
          color: 'rgba(255, 255, 255, 0.8)', 
          marginBottom: '1rem', 
          fontSize: '0.9rem' 
        }}>
          Create custom monsters for your battles. Use presets for quick setup or create from scratch.
        </p>
        
        <Button onClick={() => setIsOpen(true)}>
          🆕 Create New Monster
        </Button>
      </CreatorContainer>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create New Monster"
      >
        <div style={{ padding: '1rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: '#4ecdc4', marginBottom: '0.5rem' }}>Quick Presets</h4>
            <PresetButtons>
              {Object.entries(monsterPresets).map(([key, preset]) => (
                <PresetButton key={key} onClick={() => applyPreset(key)}>
                  {preset.name.replace('Custom ', '')} (Lv.{preset.level})
                </PresetButton>
              ))}
            </PresetButtons>
          </div>

          <FormGrid>
            <div>
              <FormGroup>
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter monster name..."
                />
                {validationErrors.name && <ValidationError>{validationErrors.name}</ValidationError>}
              </FormGroup>

              <FormGroup>
                <label>Type *</label>
                <select
                  value={formData.type || 'custom'}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                >
                  <option value="custom">Custom</option>
                  <option value="goblin">Goblin</option>
                  <option value="orc">Orc</option>
                  <option value="elemental">Elemental</option>
                  <option value="undead">Undead</option>
                  <option value="dragon">Dragon</option>
                  <option value="humanoid">Humanoid</option>
                  <option value="beast">Beast</option>
                  <option value="minion">Minion</option>
                  <option value="elite">Elite</option>
                  <option value="boss">Boss</option>
                </select>
                {validationErrors.type && <ValidationError>{validationErrors.type}</ValidationError>}
              </FormGroup>

              <FormGroup>
                <label>Level *</label>
                <input
                  type="number"
                  value={formData.level || 1}
                  onChange={(e) => handleInputChange('level', parseInt(e.target.value) || 1)}
                  min="1"
                  max="20"
                />
                {validationErrors.level && <ValidationError>{validationErrors.level}</ValidationError>}
              </FormGroup>
            </div>

            <div>
              <FormGroup>
                <label>Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the monster's appearance and behavior..."
                />
              </FormGroup>
            </div>
          </FormGrid>

          <h4 style={{ color: '#4ecdc4', marginBottom: '0.5rem' }}>Combat Stats</h4>
          <StatsGrid>
            <FormGroup>
              <label>Max Health *</label>
              <input
                type="number"
                value={formData.health_max || 100}
                onChange={(e) => handleInputChange('health_max', parseInt(e.target.value) || 100)}
                min="1"
              />
              {validationErrors.health_max && <ValidationError>{validationErrors.health_max}</ValidationError>}
            </FormGroup>

            <FormGroup>
              <label>Max Mana</label>
              <input
                type="number"
                value={formData.mana_max || 50}
                onChange={(e) => handleInputChange('mana_max', parseInt(e.target.value) || 50)}
                min="0"
              />
            </FormGroup>

            <FormGroup>
              <label>Attack Power</label>
              <input
                type="number"
                value={formData.attack_power || 10}
                onChange={(e) => handleInputChange('attack_power', parseInt(e.target.value) || 10)}
                min="0"
              />
            </FormGroup>

            <FormGroup>
              <label>Defense</label>
              <input
                type="number"
                value={formData.defense || 5}
                onChange={(e) => handleInputChange('defense', parseInt(e.target.value) || 5)}
                min="0"
              />
            </FormGroup>

            <FormGroup>
              <label>Speed</label>
              <input
                type="number"
                value={formData.speed || 10}
                onChange={(e) => handleInputChange('speed', parseInt(e.target.value) || 10)}
                min="0"
              />
            </FormGroup>

            <FormGroup>
              <label>Armor</label>
              <input
                type="number"
                value={formData.armor_value || 10}
                onChange={(e) => handleInputChange('armor_value' as keyof Enemy, parseInt(e.target.value) || 10)}
                min="0"
              />
            </FormGroup>

            <FormGroup>
              <label>Magic Resist</label>
              <input
                type="number"
                value={formData.magic_resist_value || 5}
                onChange={(e) => handleInputChange('magic_resist_value' as keyof Enemy, parseInt(e.target.value) || 5)}
                min="0"
              />
            </FormGroup>
          </StatsGrid>

          <h4 style={{ color: '#4ecdc4', marginBottom: '0.5rem' }}>Rewards</h4>
          <FormGrid>
            <FormGroup>
              <label>Experience Reward</label>
              <input
                type="number"
                value={formData.experience_reward || 50}
                onChange={(e) => handleInputChange('experience_reward', parseInt(e.target.value) || 50)}
                min="0"
              />
            </FormGroup>

            <FormGroup>
              <label>Gold Reward</label>
              <input
                type="number"
                value={formData.gold_reward || 25}
                onChange={(e) => handleInputChange('gold_reward', parseInt(e.target.value) || 25)}
                min="0"
              />
            </FormGroup>
          </FormGrid>

          <h4 style={{ color: '#4ecdc4', marginBottom: '0.5rem' }}>Special Properties (Optional)</h4>
          <FormGrid>
            <FormGroup>
              <label>Abilities (comma-separated)</label>
              <input
                type="text"
                value={formData.abilities?.join(', ') || ''}
                onChange={(e) => handleArrayInput('abilities', e.target.value)}
                placeholder="Fireball, Heal, Poison Spit..."
              />
            </FormGroup>

            <FormGroup>
              <label>Resistances (comma-separated)</label>
              <input
                type="text"
                value={formData.resistances?.join(', ') || ''}
                onChange={(e) => handleArrayInput('resistances', e.target.value)}
                placeholder="Fire, Ice, Poison..."
              />
            </FormGroup>
          </FormGrid>

          <FormGroup>
            <label>Weaknesses (comma-separated)</label>
            <input
              type="text"
              value={formData.weaknesses?.join(', ') || ''}
              onChange={(e) => handleArrayInput('weaknesses', e.target.value)}
              placeholder="Water, Lightning, Holy..."
            />
          </FormGroup>

          <ButtonGroup>
            <Button onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={resetForm} style={{ background: '#6c757d' }}>
              Reset Form
            </Button>
            <Button 
              onClick={createMonster}
              disabled={isCreating}
              style={{ background: 'linear-gradient(135deg, #28a745, #20c997)' }}
            >
              {isCreating ? '⏳ Creating...' : '✨ Create Monster'}
            </Button>
          </ButtonGroup>
        </div>
      </Modal>
    </>
  );
}
