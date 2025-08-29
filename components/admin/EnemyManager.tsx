import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '@/lib/supabase';
import { Enemy } from '@/components/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

const ManagerContainer = styled.div`
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.card};
`;

const ManagerHeader = styled.h3`
  color: ${props => props.theme.colors.text.accent};
  font-size: 1.2rem;
  margin-bottom: ${props => props.theme.spacing.lg};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  &::before {
    content: '👹';
    font-size: 1.1rem;
  }
`;

const EnemyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const EnemyCard = styled.div`
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.md};
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
    border-color: ${props => props.theme.colors.accent.cyan};
    transform: translateY(-2px);
  }

  .enemy-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${props => props.theme.spacing.sm};

    .enemy-name {
      font-weight: bold;
      color: ${props => props.theme.colors.text.primary};
      font-size: 0.9rem;
    }

    .enemy-level {
      background: ${props => props.theme.colors.accent.cyan};
      color: white;
      padding: 2px 6px;
      border-radius: ${props => props.theme.borderRadius.pill};
      font-size: 0.7rem;
      font-weight: bold;
    }
  }

  .enemy-type {
    color: ${props => props.theme.colors.text.secondary};
    font-size: 0.8rem;
    margin-bottom: ${props => props.theme.spacing.xs};
    text-transform: capitalize;
  }

  .enemy-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${props => props.theme.spacing.xs};
    font-size: 0.7rem;
    color: ${props => props.theme.colors.text.muted};

    .stat {
      display: flex;
      justify-content: space-between;
    }
  }

  .add-button {
    width: 100%;
    margin-top: ${props => props.theme.spacing.sm};
    padding: ${props => props.theme.spacing.xs};
    font-size: 0.8rem;
  }
`;

const AddEnemyButton = styled.button`
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.card};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

interface EnemyManagerProps {
  gameSessionId: string;
  onEnemyAdded: () => void;
}

export default function EnemyManager({ gameSessionId, onEnemyAdded }: EnemyManagerProps) {
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [selectedEnemy, setSelectedEnemy] = useState<Enemy | null>(null);

  useEffect(() => {
    loadAvailableEnemies();
  }, []);

  const loadAvailableEnemies = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('enemies')
        .select('*')
        .order('level', { ascending: true });

      if (error) {
        console.error('Error loading enemies:', error);
      } else {
        setEnemies(data || []);
      }
    } catch (error) {
      console.error('Failed to load enemies:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEnemyToBattle = async (enemyName: string) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .rpc('add_enemy_to_battle', {
          session_id: gameSessionId,
          enemy_name: enemyName
        });

      if (error) {
        console.error('Error adding enemy to battle:', error);
        alert(`Failed to add enemy: ${error.message}`);
      } else {
        console.log('✅ Enemy added to battle:', data);
        onEnemyAdded();
        alert(`${enemyName} has joined the battle!`);
      }
    } catch (error) {
      console.error('Failed to add enemy:', error);
      alert('Failed to add enemy to battle');
    }
  };

  const getEnemySprite = (enemyType: string) => {
    const sprites: Record<string, string> = {
      'goblin': '👹',
      'orc': '🦍',
      'elemental': '🔥',
      'undead': '💀',
      'dragon': '🐉',
      'default': '👾'
    };
    return sprites[enemyType] || sprites.default;
  };

  if (loading) {
    return (
      <ManagerContainer>
        <ManagerHeader>Loading Enemies...</ManagerHeader>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <div>Loading available enemies...</div>
        </div>
      </ManagerContainer>
    );
  }

  return (
    <ManagerContainer>
      <ManagerHeader>Add Enemies to Battle</ManagerHeader>
      
      {enemies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
          <div style={{ color: '#95a5a6', fontStyle: 'italic' }}>
            No enemies available. Run the POKEMON_BATTLE_SETUP.sql script first!
          </div>
        </div>
      ) : (
        <EnemyGrid>
          {enemies.map(enemy => (
            <EnemyCard 
              key={enemy.id}
              onClick={() => {
                setSelectedEnemy(enemy);
                setShowInfo(true);
              }}
            >
              <div style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '0.5rem' }}>
                {getEnemySprite(enemy.type)}
              </div>
              
              <div className="enemy-header">
                <div className="enemy-name">{enemy.name}</div>
                <div className="enemy-level">Lv.{enemy.level}</div>
              </div>
              
              <div className="enemy-type">{enemy.type}</div>
              
              <div className="enemy-stats">
                <div className="stat">
                  <span>❤️ HP:</span>
                  <span>{enemy.health_max}</span>
                </div>
                <div className="stat">
                  <span>⚔️ ATK:</span>
                  <span>{enemy.attack_power}</span>
                </div>
                <div className="stat">
                  <span>🛡️ DEF:</span>
                  <span>{enemy.defense}</span>
                </div>
                <div className="stat">
                  <span>⚡ SPD:</span>
                  <span>{enemy.speed}</span>
                </div>
              </div>

              <AddEnemyButton
                className="add-button"
                onClick={(e) => {
                  e.stopPropagation();
                  addEnemyToBattle(enemy.name);
                }}
              >
                Add to Battle
              </AddEnemyButton>
            </EnemyCard>
          ))}
        </EnemyGrid>
      )}

      {/* Enemy Info Modal */}
      <Modal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title={selectedEnemy?.name || 'Enemy Info'}
      >
        {selectedEnemy && (
          <div style={{ padding: '1rem' }}>
            <div style={{ textAlign: 'center', fontSize: '4rem', marginBottom: '1rem' }}>
              {getEnemySprite(selectedEnemy.type)}
            </div>
            
            <h3 style={{ color: '#4ecdc4', marginBottom: '1rem', textAlign: 'center' }}>
              {selectedEnemy.name}
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>Description:</strong>
              <p style={{ marginTop: '0.5rem', lineHeight: '1.6' }}>
                {selectedEnemy.description}
              </p>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div><strong>Type:</strong> {selectedEnemy.type}</div>
              <div><strong>Level:</strong> {selectedEnemy.level}</div>
              <div><strong>Health:</strong> {selectedEnemy.health_max}</div>
              <div><strong>Mana:</strong> {selectedEnemy.mana_max}</div>
              <div><strong>Attack:</strong> {selectedEnemy.attack_power}</div>
              <div><strong>Defense:</strong> {selectedEnemy.defense}</div>
              <div><strong>Speed:</strong> {selectedEnemy.speed}</div>
              <div><strong>EXP Reward:</strong> {selectedEnemy.experience_reward}</div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Button onClick={() => setShowInfo(false)} style={{ marginRight: '1rem' }}>
                Close
              </Button>
              <Button 
                onClick={() => {
                  addEnemyToBattle(selectedEnemy.name);
                  setShowInfo(false);
                }}
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
              >
                Add to Battle
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </ManagerContainer>
  );
}
