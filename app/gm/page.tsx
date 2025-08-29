'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled, { ThemeProvider } from 'styled-components';
import { theme } from '@/app/player/[id]/theme';
import { supabase, DatabaseCharacter } from '@/lib/supabase';
import { 
  GameSession, 
  AbilityUsageLog
} from '@/components/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import EnemyManager from '@/components/admin/EnemyManager';

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

const Subtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
  margin: ${props => props.theme.spacing.sm} 0 0 0;
  opacity: 0.8;
`;

const GMDashboard = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.xl};

  @media (max-width: ${props => props.theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

const DashboardCard = styled.div`
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.card};

  h2 {
    font-size: 1.5rem;
    margin-bottom: ${props => props.theme.spacing.lg};
    color: ${props => props.theme.colors.text.accent};
    font-weight: 600;
  }
`;

const TurnControlPanel = styled.div`
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.card};
  
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing.lg};

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const TurnInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.lg};

  .turn-display {
    background: ${props => props.theme.colors.accent.cyan};
    color: ${props => props.theme.colors.primary.bg};
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
    border-radius: ${props => props.theme.borderRadius.pill};
    font-weight: bold;
    font-size: 1.1rem;
  }

  .session-status {
    color: ${props => props.theme.colors.text.secondary};
    font-size: 0.9rem;
  }
`;

const NextTurnButton = styled.button`
  background: ${props => props.theme.gradients.accent};
  border: none;
  border-radius: ${props => props.theme.borderRadius.medium};
  color: ${props => props.theme.colors.primary.bg};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  font-size: 1rem;
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

const CreateSessionButton = styled.button`
  background: ${props => props.theme.colors.accent.cyan};
  color: ${props => props.theme.colors.primary.bg};
  border: none;
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.accent.blue};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.card};
  }
`;

const GameSessionCard = styled.div`
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.md};
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${props => props.theme.shadows.card};

  &:hover {
    background: ${props => props.theme.colors.surface.hover};
    border-color: ${props => props.theme.colors.accent.cyan};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.cardHover};
  }

  .session-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${props => props.theme.spacing.sm};

    .session-name {
      font-weight: 600;
      font-size: 1.1rem;
      color: ${props => props.theme.colors.text.primary};
    }

    .session-status {
      padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.md};
      border-radius: ${props => props.theme.borderRadius.pill};
      font-size: 0.8rem;
      font-weight: bold;
      text-transform: uppercase;
      
      &.preparing { 
        background: ${props => props.theme.colors.status.warning}; 
        color: ${props => props.theme.colors.primary.bg}; 
      }
      &.active { 
        background: ${props => props.theme.colors.status.success}; 
        color: ${props => props.theme.colors.primary.bg}; 
      }
      &.paused { 
        background: ${props => props.theme.colors.status.error}; 
        color: ${props => props.theme.colors.primary.bg}; 
      }
      &.completed { 
        background: ${props => props.theme.colors.text.muted}; 
        color: ${props => props.theme.colors.primary.bg}; 
      }
    }
  }

  .session-info {
    color: ${props => props.theme.colors.text.secondary};
    font-size: 0.9rem;
    margin-bottom: ${props => props.theme.spacing.xs};
  }

  .session-players {
    color: ${props => props.theme.colors.text.accent};
    font-size: 0.85rem;
  }

  .session-turn {
    color: ${props => props.theme.colors.accent.cyan};
    font-size: 0.9rem;
    font-weight: 600;
    margin-top: ${props => props.theme.spacing.xs};
  }
`;

const AbilityLogCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;

  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;

    .character-name {
      font-weight: bold;
      color: #ff6b6b;
    }

    .timestamp {
      font-size: 0.8rem;
      color: #95a5a6;
    }
  }

  .ability-info {
    color: #4ecdc4;
    font-weight: bold;
    margin-bottom: 0.25rem;
  }

  .ability-effect {
    color: #b8c6db;
    font-size: 0.9rem;
  }
`;

const ModalContent = styled.div`
  .form-group {
    margin-bottom: 1rem;

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: bold;
      color: #4ecdc4;
    }

    input, textarea, select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 1rem;

      &::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }

      &:focus {
        outline: none;
        border-color: #4ecdc4;
      }
    }

    textarea {
      resize: vertical;
      min-height: 100px;
    }
  }

  .player-selection {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 0.5rem;

    .player-item {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      border-radius: 4px;
      margin-bottom: 0.25rem;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      input[type="checkbox"] {
        margin-right: 0.5rem;
        width: auto;
      }

      .player-info {
        .player-name {
          font-weight: bold;
        }
        .player-class {
          font-size: 0.8rem;
          color: #95a5a6;
        }
      }
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
`;

export default function GMPage() {
  const router = useRouter();
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [abilityLogs, setAbilityLogs] = useState<AbilityUsageLog[]>([]);
  const [availableCharacters, setAvailableCharacters] = useState<DatabaseCharacter[]>([]);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  
  // Form states
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionDescription, setNewSessionDescription] = useState('');
  const [newSessionGM, setNewSessionGM] = useState('');
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [isAdvancingTurn, setIsAdvancingTurn] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeSession) {
      loadAbilityLogs(activeSession.id);
      setCurrentTurn(activeSession.current_turn || 1);
      
      // Poll for new ability logs every 5 seconds
      const interval = setInterval(() => {
        loadAbilityLogs(activeSession.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeSession]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadGameSessions(),
        loadAvailableCharacters()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGameSessions = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('game_sessions_with_stats')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGameSessions(data || []);
    } catch (error) {
      console.error('Error loading game sessions:', error);
    }
  };

  const loadAvailableCharacters = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('name');

      if (error) throw error;
      setAvailableCharacters(data || []);
    } catch (error) {
      console.error('Error loading characters:', error);
    }
  };

  const loadAbilityLogs = async (sessionId: string) => {
    if (!supabase) return;

    try {
      console.log('📊 Loading ability logs for session:', sessionId);
      
      // Try the view first
      const { data, error } = await supabase
        .from('recent_ability_usage')
        .select('*')
        .eq('game_session_id', sessionId)
        .order('used_at', { ascending: false })
        .limit(20);

      if (error) {
        console.warn('⚠️ View query failed, trying direct table query:', error);
        
        // Fallback to direct table query if view fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('ability_usage_log')
          .select(`
            *,
            characters!inner(name, class),
            Abilities!inner(name, description, category)
          `)
          .eq('game_session_id', sessionId)
          .order('used_at', { ascending: false })
          .limit(20);

        if (fallbackError) {
          console.error('❌ Fallback query also failed:', fallbackError);
          throw fallbackError;
        }

        // Transform the fallback data to match the expected format
        const transformedData = fallbackData?.map(log => ({
          ...log,
          character_name: log.characters?.name,
          character_class: log.characters?.class,
          ability_name: log.Abilities?.name,
          ability_description: log.Abilities?.description,
          ability_category: log.Abilities?.category
        })) || [];

        setAbilityLogs(transformedData);
        return;
      }

      console.log('✅ Loaded ability logs:', data?.length || 0, 'entries');
      setAbilityLogs(data || []);
    } catch (error) {
      console.error('❌ Error loading ability logs:', error);
      // Set empty array to prevent UI issues
      setAbilityLogs([]);
    }
  };

  const createGameSession = async () => {
    if (!supabase || !newSessionName.trim() || !newSessionGM.trim()) return;

    try {
      console.log('Creating game session with data:', {
        name: newSessionName,
        description: newSessionDescription,
        gm_name: newSessionGM,
        status: 'preparing'
      });

      // Create the game session
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .insert({
          name: newSessionName,
          description: newSessionDescription,
          gm_name: newSessionGM,
          status: 'preparing'
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Session creation error details:', sessionError);
        alert(`Error creating session: ${sessionError.message}`);
        throw sessionError;
      }

      console.log('Session created successfully:', sessionData);

      // Add selected characters to the session
      if (selectedCharacters.length > 0) {
        console.log('Adding players to session:', selectedCharacters);
        
        const playerInserts = selectedCharacters.map(characterId => ({
          game_session_id: sessionData.id,
          character_id: characterId
        }));

        const { error: playersError } = await supabase
          .from('game_session_players')
          .insert(playerInserts);

        if (playersError) {
          console.error('Players insertion error:', playersError);
          alert(`Error adding players: ${playersError.message}`);
          throw playersError;
        }

        console.log('Players added successfully');
      }

      // Reset form and reload sessions
      setNewSessionName('');
      setNewSessionDescription('');
      setNewSessionGM('');
      setSelectedCharacters([]);
      setShowCreateModal(false);
      
      loadGameSessions();
      alert('Game session created successfully!');
    } catch (error) {
      console.error('Error creating game session:', error);
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error 
        ? (error as { message: string }).message 
        : 'Unknown error occurred';
      
      if (errorMessage.includes('relation "game_sessions" does not exist')) {
        alert('GM tables not found! Please run the gm_system_setup.sql script in your database first.');
      } else {
        alert(`Error creating session: ${errorMessage}`);
      }
    }
  };

  const startGameSession = async (sessionId: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({ 
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
      loadGameSessions();
    } catch (error) {
      console.error('Error starting game session:', error);
    }
  };

  const endGameSession = async (sessionId: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({ 
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
      loadGameSessions();
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
      }
    } catch (error) {
      console.error('Error ending game session:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const handleCharacterToggle = (characterId: string) => {
    setSelectedCharacters(prev => 
      prev.includes(characterId)
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
    );
  };

  const advanceTurn = async () => {
    if (!supabase || !activeSession) return;

    setIsAdvancingTurn(true);
    try {
      console.log('🔄 Advancing turn for session:', activeSession.id);
      
      // Call the stored procedure to advance turn
      const { data, error } = await supabase
        .rpc('advance_game_turn', { session_id: activeSession.id });

      if (error) {
        console.error('❌ Error advancing turn:', error);
        const errorMessage = typeof error === 'object' && error !== null && 'message' in error 
          ? (error as { message: string }).message 
          : 'Unknown error occurred';
        alert(`Error advancing turn: ${errorMessage}`);
        return;
      }

      console.log('✅ Turn advanced successfully:', data);
      
      // Update local state
      const newTurn = data?.[0]?.new_turn || currentTurn + 1;
      setCurrentTurn(newTurn);
      
      // Reload sessions to get updated data
      loadGameSessions();
      
      alert(`Turn advanced to ${newTurn}! All player cooldowns reduced.`);
    } catch (error) {
      console.error('❌ Unexpected error advancing turn:', error);
      alert('Failed to advance turn');
    } finally {
      setIsAdvancingTurn(false);
    }
  };

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <PageHeader>
            <PageTitle>🎲 Game Master Dashboard</PageTitle>
            <Subtitle>Loading...</Subtitle>
          </PageHeader>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <PageHeader>
          <div>
            <PageTitle>🎲 Game Master Dashboard</PageTitle>
            <Subtitle>Manage game sessions and track player actions</Subtitle>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <CreateSessionButton onClick={() => setShowCreateModal(true)}>
              ➕ Create New Session
            </CreateSessionButton>
            <CreateSessionButton 
              onClick={() => router.push('/playing')}
              style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
            >
              ⚔️ Combat Overview
            </CreateSessionButton>
          </div>
        </PageHeader>

        {/* Turn Control Panel - only show if there's an active session */}
        {activeSession && activeSession.status === 'active' && (
          <TurnControlPanel>
            <TurnInfo>
              <div className="turn-display">
                Turn {currentTurn}
              </div>
              <div className="session-status">
                Session: {activeSession.name}
              </div>
            </TurnInfo>
            <NextTurnButton 
              onClick={advanceTurn}
              disabled={isAdvancingTurn}
            >
              {isAdvancingTurn ? '⏳ Advancing...' : '⏭️ Next Turn'}
            </NextTurnButton>
          </TurnControlPanel>
        )}

      <GMDashboard>
        <DashboardCard>
          <h2>Game Sessions</h2>
          {gameSessions.length === 0 ? (
            <p>No game sessions yet. Create your first session!</p>
          ) : (
            gameSessions.map(session => (
              <GameSessionCard 
                key={session.id}
                onClick={() => {
                  setActiveSession(session);
                  setShowSessionModal(true);
                }}
              >
                <div className="session-header">
                  <div className="session-name">{session.name}</div>
                  <div className={`session-status ${session.status}`}>
                    {session.status}
                  </div>
                </div>

                <div className="session-info">
                  GM: {session.gm_name} • Created: {new Date(session.created_at).toLocaleDateString()}
                </div>
                <div className="session-players">
                  👥 {session.player_count} players: {session.player_names || 'None'}
                </div>
                {session.status === 'active' && session.current_turn && (
                  <div className="session-turn">
                    🎯 Turn {session.current_turn}
                  </div>
                )}
              </GameSessionCard>
            ))
          )}
        </DashboardCard>

        <DashboardCard>
          <h2>Recent Ability Usage</h2>
          {activeSession ? (
            <>
              <div style={{ marginBottom: '1rem', color: '#4ecdc4' }}>
                Session: {activeSession.name}
              </div>
              {abilityLogs.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: '#95a5a6',
                  fontStyle: 'italic'
                }}>
                  <div>📝 No ability usage recorded yet</div>
                  <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Abilities used by players will appear here in real-time
                  </div>
                </div>
              ) : (
                abilityLogs.map(log => (
                  <AbilityLogCard key={log.id}>
                    <div className="log-header">
                      <div className="character-name">{log.character_name || 'Unknown Player'}</div>
                      <div className="timestamp">{formatTimestamp(log.used_at)}</div>
                    </div>
                    <div className="ability-info">
                      {log.ability_name || 'Unknown Ability'}
                      {log.turn_used && (
                        <span style={{ 
                          fontSize: '0.8rem', 
                          color: '#4ecdc4', 
                          marginLeft: '0.5rem' 
                        }}>
                          (Turn {log.turn_used})
                        </span>
                      )}
                    </div>
                    <div className="ability-effect">
                      {log.damage_dealt && `Damage: ${log.damage_dealt}`}
                      {log.effect_description && ` - ${log.effect_description}`}
                    </div>
                  </AbilityLogCard>
                ))
              )}
            </>
          ) : (
            <p>Select a game session to view ability usage.</p>
          )}
        </DashboardCard>
      </GMDashboard>

      {/* Enemy Manager - Only show if there's an active session */}
      {activeSession && activeSession.status === 'active' && (
        <div style={{ marginTop: '2rem' }}>
          <EnemyManager 
            gameSessionId={activeSession.id}
            onEnemyAdded={() => {
              console.log('Enemy added to battle!');
              // Optionally refresh data here
            }}
          />
        </div>
      )}

      {/* Create Game Session Modal */}
      <Modal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        title="Create New Game Session"
      >
        <ModalContent>
          <div className="form-group">
            <label>Session Name *</label>
            <input
              type="text"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="Enter session name..."
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={newSessionDescription}
              onChange={(e) => setNewSessionDescription(e.target.value)}
              placeholder="Describe the session..."
            />
          </div>

          <div className="form-group">
            <label>Game Master Name *</label>
            <input
              type="text"
              value={newSessionGM}
              onChange={(e) => setNewSessionGM(e.target.value)}
              placeholder="Enter GM name..."
            />
          </div>

          <div className="form-group">
            <label>Select Players</label>
            <div className="player-selection">
              {availableCharacters.map(character => (
                <div key={character.id} className="player-item">
                  <input
                    type="checkbox"
                    checked={selectedCharacters.includes(character.id)}
                    onChange={() => handleCharacterToggle(character.id)}
                  />
                  <div className="player-info">
                    <div className="player-name">{character.name}</div>
                    <div className="player-class">Level {character.level} {character.class}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <ButtonGroup>
            <Button onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createGameSession}
              disabled={!newSessionName.trim() || !newSessionGM.trim()}
            >
              Create Session
            </Button>
          </ButtonGroup>
        </ModalContent>
      </Modal>

      {/* Game Session Management Modal */}
      <Modal 
        isOpen={showSessionModal} 
        onClose={() => setShowSessionModal(false)}
        title={activeSession?.name || 'Game Session'}
      >
        {activeSession && (
          <ModalContent>
            <div className="form-group">
              <label>Status</label>
              <div className={`session-status ${activeSession.status}`}>
                {activeSession.status.toUpperCase()}
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <p>{activeSession.description || 'No description provided.'}</p>
            </div>

            <div className="form-group">
              <label>Game Master</label>
              <p>{activeSession.gm_name}</p>
            </div>

            <div className="form-group">
              <label>Players</label>
              <p>{activeSession.player_names || 'No players assigned'}</p>
            </div>

            <ButtonGroup>
              <Button onClick={() => setShowSessionModal(false)}>
                Close
              </Button>
              
              {activeSession.status === 'preparing' && (
                <Button onClick={() => startGameSession(activeSession.id)}>
                  Start Session
                </Button>
              )}
              
              {activeSession.status === 'active' && (
                <Button 
                  onClick={() => endGameSession(activeSession.id)}
                >
                  End Session
                </Button>
              )}
            </ButtonGroup>
          </ModalContent>
        )}
      </Modal>
    </Container>
    </ThemeProvider>
  );
}
