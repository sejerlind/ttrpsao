'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styled, { ThemeProvider } from 'styled-components';
import { theme } from '../theme';
import { supabase } from '@/lib/supabase';
import { 
  GameSession, 
  BattleEncounter
} from '@/components/types';
import type { DatabaseCharacter } from '@/lib/supabase';
import Button from '@/components/ui/Button';
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

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  background: linear-gradient(135deg, rgba(78, 205, 196, 0.2), rgba(69, 183, 209, 0.2));
  border: 2px solid ${props => props.theme.colors.accent.cyan};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.md};

  .player-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: ${props => props.theme.colors.accent.cyan};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    color: white;
    font-weight: bold;
  }

  .player-details {
    .player-name {
      font-weight: bold;
      color: ${props => props.theme.colors.text.primary};
      font-size: 1.1rem;
    }
    .player-class {
      color: ${props => props.theme.colors.text.secondary};
      font-size: 0.9rem;
    }
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

const ErrorContainer = styled.div`
  background: ${props => props.theme.gradients.card};
  border: ${props => props.theme.borders.card};
  border-radius: ${props => props.theme.borderRadius.large};
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  box-shadow: ${props => props.theme.shadows.card};

  .error-icon {
    font-size: 3rem;
    margin-bottom: ${props => props.theme.spacing.md};
  }

  .error-title {
    color: ${props => props.theme.colors.text.accent};
    font-size: 1.5rem;
    margin-bottom: ${props => props.theme.spacing.md};
    font-weight: 600;
  }

  .error-message {
    color: ${props => props.theme.colors.text.secondary};
    margin-bottom: ${props => props.theme.spacing.lg};
    line-height: 1.6;
  }
`;

export default function PlayerPlayingPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.id as string;
  
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<DatabaseCharacter[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<DatabaseCharacter | null>(null);
  const [enemies, setEnemies] = useState<BattleEncounter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load player character and check if they're in an active game session
  const loadPlayerAndGameData = useCallback(async () => {
    if (!supabase || !playerId) {
      setError('Invalid player ID or database not configured');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // First, load the player character with fresh data
      const { data: playerData, error: playerError } = await supabase
        .from('characters')
        .select('*')
        .eq('id', playerId)
        .maybeSingle();

      if (playerError) {
        console.error('Error loading player:', playerError);
        setError('Failed to load player data');
        setIsLoading(false);
        return;
      }

      if (!playerData) {
        setError('Player not found');
        setIsLoading(false);
        return;
      }

      setCurrentPlayer(playerData);

      // Check if this player is in an active game session
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_session_players')
        .select(`
          game_session_id,
          game_sessions!inner(
            id,
            status,
            name,
            current_turn,
            gm_name,
            description
          )
        `)
        .eq('character_id', playerId)
        .eq('is_active', true)
        .eq('game_sessions.status', 'active')
        .limit(1);

      if (sessionError) {
        console.error('Error checking game session:', sessionError);
        setError('Failed to check active game sessions');
        setIsLoading(false);
        return;
      }

      if (!sessionData || sessionData.length === 0) {
        setError('This player is not currently in an active game session');
        setIsLoading(false);
        return;
      }

      const activeSession = sessionData[0];
      const gameSession = activeSession.game_sessions as unknown as GameSession;
      setGameSession(gameSession);

      // Load all players in the session with fresh data
      console.log('🔍 Loading players for session:', gameSession.id);
      
      // First get the character IDs in this session
      const { data: sessionPlayerIds, error: playerIdsError } = await supabase
        .from('game_session_players')
        .select('character_id')
        .eq('game_session_id', gameSession.id)
        .eq('is_active', true);

      if (playerIdsError) {
        console.error('Error loading session player IDs:', playerIdsError);
        setError('Failed to load session players');
        setIsLoading(false);
        return;
      }

      if (!sessionPlayerIds || sessionPlayerIds.length === 0) {
        console.log('⚠️ No active players found in session');
        setPlayers([]);
      } else {
        // Now get the full character data for these players
        const characterIds = sessionPlayerIds.map(sp => sp.character_id);
        console.log('🔍 Loading character data for IDs:', characterIds);

        const { data: sessionPlayers, error: playersError } = await supabase
          .from('characters')
          .select('*')
          .in('id', characterIds)
          .order('name', { ascending: true });

        if (playersError) {
          console.error('Error loading session players:', playersError);
          setError('Failed to load session players');
          setIsLoading(false);
          return;
        }

        if (sessionPlayers && sessionPlayers.length > 0) {
          console.log('✅ Loaded session players:', sessionPlayers.map(p => `${p.name} (${p.class})`));
          setPlayers(sessionPlayers);
        } else {
          console.log('⚠️ No session players data found');
          setPlayers([]);
        }
      }

      // Load battle encounters (enemies)
      const { data: encounters, error: encountersError } = await supabase
        .from('active_battle_encounters')
        .select('*')
        .eq('game_session_id', gameSession.id)
        .order('turn_order_position', { ascending: true });

      if (!encountersError && encounters) {
        setEnemies(encounters);
      }

    } catch (error) {
      console.error('Error loading player battle data:', error);
      setError('Unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [playerId]);

  // Refresh function that can be called when needed
  const refreshData = useCallback(() => {
    console.log('🔄 Refreshing player battle data...');
    loadPlayerAndGameData();
  }, [loadPlayerAndGameData]);

  // Load data on mount
  useEffect(() => {
    loadPlayerAndGameData();
  }, [loadPlayerAndGameData]);

  // Set up real-time updates
  useEffect(() => {
    if (!supabase || !gameSession) return;

    // Real-time updates via Supabase channels (no polling timer)
    const subscription = supabase
      .channel(`player-battle-${playerId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'characters'
      }, (payload) => {
        console.log('🔄 Character updated in real-time:', payload);
        // Only reload if it affects our session players
        loadPlayerAndGameData();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'active_battle_encounters'
      }, (payload) => {
        console.log('🔄 Battle encounter updated in real-time:', payload);
        loadPlayerAndGameData();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_sessions'
      }, (payload) => {
        console.log('🔄 Game session updated in real-time:', payload);
        if (payload.new?.id === gameSession.id) {
          loadPlayerAndGameData();
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ability_usage_log'
      }, (payload) => {
        console.log('🔄 New ability used in real-time:', payload);
        if (payload.new?.game_session_id === gameSession.id) {
          loadPlayerAndGameData();
        }
      })
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(subscription);
      }
    };
  }, [gameSession, playerId, loadPlayerAndGameData]);

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <LoadingSpinner>
            <div className="spinner"></div>
            <div className="loading-text">Loading Battle View...</div>
          </LoadingSpinner>
        </Container>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <Header>
            <Title>Battle View</Title>
            <Button onClick={() => router.push(`/player/${playerId}`)}>
              👤 Back to Character
            </Button>
          </Header>
          <ErrorContainer>
            <div className="error-icon">⚠️</div>
            <div className="error-title">Cannot View Battle</div>
            <div className="error-message">{error}</div>
            <Button onClick={() => router.push(`/player/${playerId}`)}>
              Return to Character Page
            </Button>
          </ErrorContainer>
        </Container>
      </ThemeProvider>
    );
  }

  if (!gameSession || !currentPlayer) {
    return (
      <ThemeProvider theme={theme}>
        <Container>
          <Header>
            <Title>Battle View</Title>
            <Button onClick={() => router.push(`/player/${playerId}`)}>
              👤 Back to Character
            </Button>
          </Header>
          <ErrorContainer>
            <div className="error-icon">🎮</div>
            <div className="error-title">No Active Battle</div>
            <div className="error-message">
              You are not currently in an active game session with a battle.
            </div>
            <Button onClick={() => router.push(`/player/${playerId}`)}>
              Return to Character Page
            </Button>
          </ErrorContainer>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <Header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Title>Battle: {gameSession.name}</Title>
            <PlayerInfo>
              <div className="player-avatar">
                {currentPlayer.name.charAt(0).toUpperCase()}
              </div>
              <div className="player-details">
                <div className="player-name">{currentPlayer.name}</div>
                <div className="player-class">{currentPlayer.class} • Level {currentPlayer.level}</div>
              </div>
            </PlayerInfo>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Button onClick={() => router.push('/playing')}>
              📊 Combat Overview
            </Button>
            <Button onClick={() => router.push(`/player/${playerId}`)}>
              👤 Character Page
            </Button>
            <Button onClick={() => router.push('/')}>
              🏠 Home
            </Button>
          </div>
        </Header>

        <PokemonBattle
          players={players}
          enemies={enemies}
          currentTurn={gameSession.current_turn || 1}
          gameSessionId={gameSession.id}
          currentPlayerId={playerId}
          onPlayerAction={(action) => {
            console.log('Player action:', action);
            // Refresh data after action - but only when an action happens
            refreshData();
          }}
        />
      </Container>
    </ThemeProvider>
  );
}
