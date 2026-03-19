/**
 * @gamvio/game-sdk/server
 *
 * Server-side utilities for Gamvio games.
 * HMAC signing and API calls happen here — secrets never reach the browser.
 *
 * Usage in your game's Server Actions file:
 *
 *   import { createGameServer } from '@gamvio/game-sdk/server';
 *
 *   const gamvio = createGameServer({
 *     apiUrl: process.env.GAMVIO_API_URL!,
 *     gameId: process.env.GAMVIO_GAME_ID!,
 *     apiSecret: process.env.GAMVIO_API_SECRET!,
 *   });
 *
 *   export const startSession = gamvio.startSession;
 *   export const submitScore = gamvio.submitScore;
 */

import crypto from 'crypto';
import type { GamvioGameConfig, GameSession, ScoreResult, GamvioUser, LeaderboardEntry, PlayerRank } from '../types';

export type { GamvioGameConfig, GameSession, ScoreResult };

/** Create server-side game SDK functions. All functions run server-side only. */
export function createGameServer(config: GamvioGameConfig) {
  const { apiUrl, gameId, apiSecret } = config;

  async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const res = await fetch(`${apiUrl}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...opts.headers,
      },
    });
    const body = await res.json();
    if (!body.success) {
      throw new Error(body.error?.message || 'API request failed');
    }
    return body.data as T;
  }

  return {
    /**
     * Authenticate a user via platform token.
     * Call this to verify the user's identity from a platform_token or session cookie.
     */
    async authenticateUser(accessToken: string): Promise<GamvioUser> {
      return apiFetch<GamvioUser>('/api/v1/platform/session', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
    },

    /**
     * Start a new game session. Call this before each game round.
     * Returns session_id and hmac_key (kept server-side for signing).
     */
    async startSession(accessToken: string): Promise<GameSession> {
      return apiFetch<GameSession>('/api/v1/game-sessions/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ game_id: gameId }),
      });
    },

    /**
     * Submit a score with server-side HMAC signing.
     * The hmac_key never leaves the server.
     */
    async submitScore(
      accessToken: string,
      sessionId: string,
      hmacKey: string,
      score: number,
      metadata: Record<string, unknown> = {},
    ): Promise<ScoreResult> {
      const timestamp = Date.now();
      const message = `${sessionId}:${score}:${timestamp}`;

      const hmac = crypto.createHmac('sha256', Buffer.from(hmacKey, 'hex'));
      hmac.update(message);
      const signature = hmac.digest('hex');

      return apiFetch<ScoreResult>('/api/v1/game-sessions/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          score,
          timestamp,
          signature,
          metadata: JSON.stringify(metadata),
        }),
      });
    },

    /** Fetch leaderboard for this game (public, no auth needed). */
    async getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
      return apiFetch<LeaderboardEntry[]>(
        `/api/v1/leaderboard/scores?game_id=${gameId}&limit=${limit}`,
      );
    },

    /** Get the current player's rank. */
    async getPlayerRank(accessToken: string): Promise<PlayerRank | null> {
      try {
        return await apiFetch<PlayerRank>(`/api/v1/leaderboard/rank?game_id=${gameId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } catch {
        return null;
      }
    },

    /** Resolve game ID from slug (utility). */
    async resolveGameId(slug: string): Promise<string | null> {
      try {
        const game = await apiFetch<{ id: string }>(`/api/v1/games/${slug}`);
        return game.id;
      } catch {
        return null;
      }
    },
  };
}
