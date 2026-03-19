'use client';

import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { GamvioCtx } from './gamvio-context';
import type { GamvioUser, GameSession, ScoreResult, LeaderboardEntry, PlayerRank } from '../types';

export interface GamvioGameProviderProps {
  children: ReactNode;
  /** Access token from the platform (passed via URL param or session) */
  accessToken: string;
  /** User info from the platform */
  user: GamvioUser;
  /** Game ID (resolved from slug or config) */
  gameId: string;
  /**
   * Server Action: start a game session.
   * Signature: (accessToken: string) => Promise<GameSession>
   */
  onStartSession: (accessToken: string) => Promise<GameSession>;
  /**
   * Server Action: submit a score.
   * Signature: (accessToken: string, sessionId: string, hmacKey: string, score: number, metadata?: Record<string, unknown>) => Promise<ScoreResult>
   */
  onSubmitScore: (
    accessToken: string,
    sessionId: string,
    hmacKey: string,
    score: number,
    metadata?: Record<string, unknown>,
  ) => Promise<ScoreResult>;
  /** Server Action: get leaderboard. */
  onGetLeaderboard?: (limit?: number) => Promise<LeaderboardEntry[]>;
  /** Server Action: get player rank. */
  onGetMyRank?: (accessToken: string) => Promise<PlayerRank | null>;
}

export function GamvioGameProvider({
  children,
  accessToken,
  user,
  gameId,
  onStartSession,
  onSubmitScore,
  onGetLeaderboard,
  onGetMyRank,
}: GamvioGameProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<GameSession | null>(null);

  // Auto-start first session on mount
  useEffect(() => {
    onStartSession(accessToken)
      .then((session) => {
        sessionRef.current = session;
        setIsReady(true);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to start session');
        setIsLoading(false);
      });
  }, [accessToken, onStartSession]);

  const startSession = useCallback(async (): Promise<GameSession> => {
    const session = await onStartSession(accessToken);
    sessionRef.current = session;
    setIsReady(true);
    return session;
  }, [accessToken, onStartSession]);

  const submitScore = useCallback(
    async (score: number, metadata?: Record<string, unknown>): Promise<ScoreResult> => {
      if (!sessionRef.current) {
        throw new Error('No active session. Call startSession() first.');
      }
      const { session_id, hmac_key } = sessionRef.current;
      const result = await onSubmitScore(accessToken, session_id, hmac_key, score, metadata);

      // Session is consumed — start a new one for next round
      sessionRef.current = null;
      setIsReady(false);
      onStartSession(accessToken)
        .then((s) => {
          sessionRef.current = s;
          setIsReady(true);
        })
        .catch(() => {});

      return result;
    },
    [accessToken, onSubmitScore, onStartSession],
  );

  const getLeaderboard = useCallback(
    async (limit = 20): Promise<LeaderboardEntry[]> => {
      if (!onGetLeaderboard) return [];
      return onGetLeaderboard(limit);
    },
    [onGetLeaderboard],
  );

  const getMyRank = useCallback(async (): Promise<PlayerRank | null> => {
    if (!onGetMyRank) return null;
    return onGetMyRank(accessToken);
  }, [accessToken, onGetMyRank]);

  return (
    <GamvioCtx.Provider
      value={{
        isReady,
        isLoading,
        user,
        accessToken,
        gameId,
        error,
        startSession,
        submitScore,
        getLeaderboard,
        getMyRank,
      }}
    >
      {children}
    </GamvioCtx.Provider>
  );
}
