'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled, { ThemeProvider } from 'styled-components';
import { theme } from '@/app/player/[id]/theme';
import { supabase } from '@/lib/supabase';
import { 
  GameSession, 
  AbilityUsageLog,
  BattleEncounter
} from '@/components/types';
import type { DatabaseCharacter } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import InitiativeTracker from '@/components/combat/InitiativeTracker';
import BattleLog from '@/components/combat/BattleLog';
import PokemonBattle from '@/components/battle/PokemonBattle';

const Container = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.gradients.background};
  color: ${props => props.theme.colors.text.primary};
  padding: ${props => props.theme.spacing.lg};
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.xl};
  padding: ${props => props.theme.spacing.lg};
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.large};
  box-shadow: ${props => props.theme.shadows.card};

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    flex-direction: column;
    gap: ${props => props.theme.spacing.md};
    align-items: flex-start;
  }
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.text.accent};
  font-size: 2.5rem;
  margin: 0;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    font-size: 2rem;
  }

  &::before {
    content: '⚔️';
    margin-right: ${props => props.theme.spacing.md};
  }
`;

const GameDashboard = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px 300px;
  gap: ${props => props.theme.spacing.lg};
  height: calc(100vh - 200px);

  @media (max-width: ${props => props.theme.breakpoints.wide}) {
    grid-template-columns: 1fr 300px;
  }

  @media (max-width: ${props => props.theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
    height: auto;
  }
`;

const MainPanel = styled.div`
  display: grid;
  grid-template-rows: auto 1fr;
  gap: ${props => props.theme.spacing.lg};
  overflow: hidden;
`;

const StatusBar = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const StatusCard = styled.div<{ $type?: 'session' | 'turn' | 'players' | 'activity' }>`
  background: ${props => {
    switch (props.$type) {
      case 'session': return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'turn': return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      case 'players': return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
      case 'activity': return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
      default: return props.theme.gradients.card;
    }
  }};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  color: white;
  text-align: center;
  box-shadow: ${props => props.theme.shadows.card};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover::before {
    opacity: 1;
  }

  .value {
    font-size: 2rem;
    font-weight: 900;
    margin-bottom: ${props => props.theme.spacing.xs};
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .label {
    font-size: 0.9rem;
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
  }
`;

const CombatArena = styled.div`
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.card};
  overflow: hidden;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7);
  }
`;

const ArenaTitle = styled.h2`
  color: ${props => props.theme.colors.text.accent};
  font-size: 1.5rem;
  margin-bottom: ${props => props.theme.spacing.lg};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  &::before {
    content: '🎯';
    font-size: 1.2rem;
  }
`;

const PlayersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  max-height: calc(100vh - 400px);
  overflow-y: auto;
  padding-right: ${props => props.theme.spacing.sm};

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.accent.cyan};
    border-radius: 4px;
  }
`;

const PlayerCard = styled.div<{ $isActive?: boolean; $lowHealth?: boolean }>`
  background: ${props => props.$isActive 
    ? 'linear-gradient(145deg, rgba(78, 205, 196, 0.2), rgba(69, 183, 209, 0.2))'
    : 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))'};
  border: 2px solid ${props => {
    if (props.$lowHealth) return '#ef4444';
    if (props.$isActive) return props.theme.colors.accent.cyan;
    return 'rgba(255, 255, 255, 0.1)';
  }};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.shadows.cardHover};
    border-color: ${props => props.theme.colors.accent.cyan};
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => {
      if (props.$lowHealth) return 'linear-gradient(90deg, #ef4444, #dc2626)';
      if (props.$isActive) return 'linear-gradient(90deg, #4ecdc4, #45b7d1)';
      return 'transparent';
    }};
  }
`;

const PlayerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.md};

  .name {
    font-size: 1.1rem;
    font-weight: bold;
    color: ${props => props.theme.colors.text.primary};
  }

  .class-level {
    font-size: 0.8rem;
    color: ${props => props.theme.colors.text.secondary};
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 8px;
    border-radius: ${props => props.theme.borderRadius.pill};
    font-weight: 600;
  }
`;

const ResourceBars = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const ResourceBar = styled.div<{ $type: 'health' | 'mana' | 'stamina' | 'ap' }>`
  .resource-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .resource-label {
    color: ${props => {
      switch (props.$type) {
        case 'health': return '#ef4444';
        case 'mana': return '#3b82f6';
        case 'stamina': return '#10b981';
        case 'ap': return '#f59e0b';
        default: return props.theme.colors.text.secondary;
      }
    }};
  }

  .resource-value {
    color: ${props => props.theme.colors.text.primary};
    font-size: 0.75rem;
  }

  .resource-bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }

  .resource-fill {
    height: 100%;
    background: ${props => {
      switch (props.$type) {
        case 'health': return 'linear-gradient(90deg, #ef4444, #dc2626)';
        case 'mana': return 'linear-gradient(90deg, #3b82f6, #1d4ed8)';
        case 'stamina': return 'linear-gradient(90deg, #10b981, #059669)';
        case 'ap': return 'linear-gradient(90deg, #f59e0b, #d97706)';
        default: return '#666';
      }
    }};
    transition: width 0.3s ease;
    border-radius: 4px;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  }
`;

// Removed unused StatusIcons and StatusIcon styled components

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
  overflow-y: auto;
  max-height: calc(100vh - 200px);

  @media (max-width: ${props => props.theme.breakpoints.desktop}) {
    max-height: none;
    margin-top: ${props => props.theme.spacing.xl};
  }
`;

const SidebarCard = styled.div`
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadows.card};

  h3 {
    color: ${props => props.theme.colors.text.accent};
    font-size: 1.1rem;
    margin-bottom: ${props => props.theme.spacing.md};
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.sm};
  }
`;

const TurnCounter = styled.div`
  text-align: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.xl};
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    animation: rotate 4s linear infinite;
  }

  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .turn-number {
    font-size: 3rem;
    font-weight: 900;
    color: white;
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
    position: relative;
    z-index: 1;
    margin-bottom: ${props => props.theme.spacing.sm};
  }

  .turn-label {
    font-size: 1rem;
    color: white;
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-weight: 600;
    position: relative;
    z-index: 1;
  }
`;

// Removed unused ActivityFeed and ActivityItem styled components

const NoDataMessage = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.text.muted};
  font-style: italic;
  
  .icon {
    font-size: 3rem;
    margin-bottom: ${props => props.theme.spacing.md};
    opacity: 0.5;
  }
  
  .message {
    font-size: 1.1rem;
    margin-bottom: ${props => props.theme.spacing.sm};
  }
  
  .submessage {
    font-size: 0.9rem;
    opacity: 0.7;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};

  .spinner {
    width: 60px;
    height: 60px;
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-top: 4px solid ${props => props.theme.colors.accent.cyan};
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading-text {
    color: ${props => props.theme.colors.text.primary};
    font-size: 1.2rem;
    font-weight: 600;
  }
`;

// Using DatabaseCharacter directly instead of extending it with empty interface

export default function PlayingScreen() {
  const router = useRouter();
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<DatabaseCharacter[]>([]);
  const [enemies, setEnemies] = useState<BattleEncounter[]>([]);
  const [recentActivity, setRecentActivity] = useState<AbilityUsageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showBattleView, setShowBattleView] = useState(false);
  // Removed refreshTimer state as it's not used elsewhere in the component

  // Load active game session and related data
  const loadGameData = async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      // Find active game sessions
      const { data: sessions, error: sessionError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (sessionError) {
        console.error('Error loading active sessions:', sessionError);
        setIsLoading(false);
        return;
      }

      if (!sessions || sessions.length === 0) {
        setGameSession(null);
        setPlayers([]);
        setRecentActivity([]);
        setIsLoading(false);
        return;
      }

      const activeSession = sessions[0] as GameSession;
      setGameSession(activeSession);

      // Load players in the session with fresh data
      const { data: sessionPlayers, error: playersError } = await supabase
        .from('game_session_players')
        .select(`
          character_id,
          characters!inner(
            id,
            name,
            class,
            level,
            experience,
            experience_to_next,
            health_current,
            health_max,
            mana_current,
            mana_max,
            stamina_current,
            stamina_max,
            action_points_current,
            action_points_max,
            armor_current,
            magic_resist_current,
            created_at,
            updated_at
          )
        `)
        .eq('game_session_id', activeSession.id)
        .eq('is_active', true);

      if (!playersError && sessionPlayers) {
        const playersList = sessionPlayers.map(sp => sp.characters as unknown as DatabaseCharacter);
        setPlayers(playersList);
        console.log('✅ Loaded players with fresh data:', playersList.map(p => `${p.name}: ${p.action_points_current}/${p.action_points_max} AP`));
      }

      // Load recent activity
      const { data: activity, error: activityError } = await supabase
        .from('ability_usage_log')
        .select(`
          *,
          characters!inner(name),
          Abilities!inner(name, description)
        `)
        .eq('game_session_id', activeSession.id)
        .order('used_at', { ascending: false })
        .limit(20);

      if (!activityError && activity) {
        const activities = activity.map(a => ({
          ...a,
          character_name: a.characters?.name,
          ability_name: a.Abilities?.name,
          ability_description: a.Abilities?.description
        }));
        setRecentActivity(activities);
      }

      // Load battle encounters (enemies) from database
      const { data: encounters, error: encountersError } = await supabase
        .from('active_battle_encounters')
        .select('*')
        .eq('game_session_id', activeSession.id)
        .order('turn_order_position', { ascending: true });

      if (!encountersError && encounters) {
        setEnemies(encounters);
        console.log('✅ Loaded enemies from database:', encounters.map(e => `${e.enemy_name} (${e.enemy_health_current}/${e.enemy_health_max} HP) - Level ${e.enemy_level}`));
      } else if (encountersError) {
        console.error('❌ Error loading enemies from database:', encountersError);
      }

    } catch (error) {
      console.error('Error loading game data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh data every 5 seconds and listen for real-time updates
  useEffect(() => {
    loadGameData();
    
    // Polling backup
    const timer = setInterval(loadGameData, 5000);

    // Real-time updates via Supabase channels
    let subscription: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;
    
    if (supabase) {
      subscription = supabase
        .channel('game-updates')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'characters'
        }, (payload) => {
          console.log('🔄 Character updated in real-time:', payload);
          // Refresh data when any character changes
          loadGameData();
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'battle_encounters'
        }, (payload) => {
          console.log('🔄 Battle encounter updated in real-time:', payload);
          // Refresh data when enemy health changes
          loadGameData();
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'ability_usage_log'
        }, (payload) => {
          console.log('🔄 New ability used in real-time:', payload);
          // Refresh data when abilities are used
          loadGameData();
        })
        .subscribe();
    }

    return () => {
      if (timer) clearInterval(timer);
      if (subscription && supabase) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  // Helper functions
  const calculateHealthPercentage = (current: number, max: number) => 
    max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;

  const isLowHealth = (current: number, max: number) => 
    calculateHealthPercentage(current, max) < 25;

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Removed handlePlayerAction - party is view-only now

  const toggleBattleView = () => {
    setShowBattleView(!showBattleView);
  };

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <LoadingSpinner>
            <div className="spinner"></div>
            <div className="loading-text">Loading Combat Overview...</div>
          </LoadingSpinner>
        </Container>
      </ThemeProvider>
    );
  }

  if (!gameSession) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <Header>
            <Title>Combat Overview</Title>
            <Button onClick={() => router.push('/')}>
              🏠 Home
            </Button>
          </Header>
          <NoDataMessage>
            <div className="icon">🎮</div>
            <div className="message">No Active Game Session</div>
            <div className="submessage">
              Start a game session from the GM Dashboard to see the combat overview
            </div>
          </NoDataMessage>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <Header>
          <Title>{showBattleView ? 'Pokemon Battle' : 'Combat Overview'}</Title>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Button onClick={toggleBattleView}>
              {showBattleView ? '📊 Overview' : '⚔️ Battle View'}
            </Button>
            <Button onClick={() => setShowSessionModal(true)}>
              ℹ️ Session Info
            </Button>
            <Button onClick={() => router.push('/gm')}>
              🎲 GM Dashboard
            </Button>
            <Button onClick={() => router.push('/')}>
              🏠 Home
            </Button>
          </div>
        </Header>

        <StatusBar>
          <StatusCard $type="session">
            <div className="value">{gameSession.name}</div>
            <div className="label">Active Session</div>
          </StatusCard>
          <StatusCard $type="turn">
            <div className="value">{gameSession.current_turn || 1}</div>
            <div className="label">Current Turn</div>
          </StatusCard>
          <StatusCard $type="players">
            <div className="value">{players.length}</div>
            <div className="label">Players</div>
          </StatusCard>
          <StatusCard $type="activity">
            <div className="value">{recentActivity.length}</div>
            <div className="label">Recent Actions</div>
          </StatusCard>
        </StatusBar>

        {showBattleView ? (
          <PokemonBattle
            players={players}
            enemies={enemies}
            currentTurn={gameSession.current_turn || 1}
            gameSessionId={gameSession.id}
            // No currentPlayerId - this is the general overview
            onPlayerAction={(action) => {
              console.log('Player action:', action);
              // Refresh game data after action
              loadGameData();
            }}
          />
        ) : (
          <GameDashboard>
            <MainPanel>
              <CombatArena>
                <ArenaTitle>Active Players</ArenaTitle>
                <PlayersGrid>
                {players.map((player, index) => (
                  <PlayerCard 
                    key={player.id}
                    $isActive={index === 0} // First player is considered active for now - could be enhanced with real turn tracking
                    $lowHealth={isLowHealth(player.health_current, player.health_max)}
                  >
                    <PlayerHeader>
                      <div className="name">{player.name}</div>
                      <div className="class-level">
                        {player.class} • Level {player.level}
                      </div>
                    </PlayerHeader>

                    <ResourceBars>
                      <ResourceBar $type="health">
                        <div className="resource-header">
                          <span className="resource-label">❤️ Health</span>
                          <span className="resource-value">
                            {player.health_current}/{player.health_max}
                          </span>
                        </div>
                        <div className="resource-bar">
                          <div 
                            className="resource-fill"
                            style={{ 
                              width: `${calculateHealthPercentage(player.health_current, player.health_max)}%` 
                            }}
                          />
                        </div>
                      </ResourceBar>

                      <ResourceBar $type="mana">
                        <div className="resource-header">
                          <span className="resource-label">💙 Mana</span>
                          <span className="resource-value">
                            {player.mana_current}/{player.mana_max}
                          </span>
                        </div>
                        <div className="resource-bar">
                          <div 
                            className="resource-fill"
                            style={{ 
                              width: `${calculateHealthPercentage(player.mana_current, player.mana_max)}%` 
                            }}
                          />
                        </div>
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: 'rgba(255, 255, 255, 0.7)', 
                          textAlign: 'center', 
                          marginTop: '4px',
                          fontStyle: 'italic'
                        }}>
                          +{player.mana_regen || 10} per turn
                        </div>
                      </ResourceBar>

                      <ResourceBar $type="stamina">
                        <div className="resource-header">
                          <span className="resource-label">💚 Stamina</span>
                          <span className="resource-value">
                            {player.stamina_current}/{player.stamina_max}
                          </span>
                        </div>
                        <div className="resource-bar">
                          <div 
                            className="resource-fill"
                            style={{ 
                              width: `${calculateHealthPercentage(player.stamina_current, player.stamina_max)}%` 
                            }}
                          />
                        </div>
                      </ResourceBar>

                      <ResourceBar $type="ap">
                        <div className="resource-header">
                          <span className="resource-label">⚡ Action Points</span>
                          <span className="resource-value">
                            {player.action_points_current}/{player.action_points_max}
                          </span>
                        </div>
                        <div className="resource-bar">
                          <div 
                            className="resource-fill"
                            style={{ 
                              width: `${calculateHealthPercentage(player.action_points_current, player.action_points_max)}%` 
                            }}
                          />
                        </div>
                      </ResourceBar>
                    </ResourceBars>

                    {/* Status effects can be added later when we have a proper buff/debuff system in the database */}
                  </PlayerCard>
                ))}
              </PlayersGrid>
            </CombatArena>
          </MainPanel>

          <Sidebar>
            <SidebarCard>
              <TurnCounter>
                <div className="turn-number">{gameSession.current_turn || 1}</div>
                <div className="turn-label">Current Turn</div>
              </TurnCounter>
            </SidebarCard>

            <InitiativeTracker 
              players={players}
              currentTurn={gameSession.current_turn || 1}
              onPlayerClick={(player) => console.log('Selected player:', player.name)}
            />

            <SidebarCard>
              <h3>🎮 Session Stats</h3>
              <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>GM:</span>
                  <span style={{ fontWeight: 'bold' }}>{gameSession.gm_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Started:</span>
                  <span>{gameSession.started_at ? formatTimestamp(gameSession.started_at) : 'Recently'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Duration:</span>
                  <span>
                    {gameSession.started_at 
                      ? `${Math.floor((Date.now() - new Date(gameSession.started_at).getTime()) / 60000)}m`
                      : '0m'
                    }
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Status:</span>
                  <span style={{ 
                    color: '#10b981', 
                    fontWeight: 'bold',
                    textTransform: 'capitalize'
                  }}>
                    {gameSession.status}
                  </span>
                </div>
              </div>
            </SidebarCard>
          </Sidebar>

          {/* Battle Log Sidebar */}
          <div>
            <BattleLog actions={recentActivity} maxEntries={30} />
          </div>
        </GameDashboard>
        )}

        {/* Session Info Modal */}
        <Modal
          isOpen={showSessionModal}
          onClose={() => setShowSessionModal(false)}
          title="Session Information"
        >
          <div style={{ padding: '1rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#4ecdc4' }}>
              {gameSession.name}
            </h3>
            
            {gameSession.description && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>Description:</strong>
                <p style={{ marginTop: '0.5rem', lineHeight: '1.6' }}>
                  {gameSession.description}
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <strong>Game Master:</strong><br />
                {gameSession.gm_name}
              </div>
              <div>
                <strong>Current Turn:</strong><br />
                Turn {gameSession.current_turn || 1}
              </div>
              <div>
                <strong>Players:</strong><br />
                {players.length} active
              </div>
              <div>
                <strong>Status:</strong><br />
                <span style={{ color: '#10b981', fontWeight: 'bold', textTransform: 'capitalize' }}>
                  {gameSession.status}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Button onClick={() => setShowSessionModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </Container>
    </ThemeProvider>
  );
}
