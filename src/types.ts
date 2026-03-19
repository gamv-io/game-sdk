/** Configuration for the Gamvio Game SDK */
export interface GamvioGameConfig {
  /** Gamvio API base URL (e.g., "https://gamv.io") */
  apiUrl: string;
  /** Game ID (UUID from developer portal) */
  gameId: string;
  /** API Secret key for server-side operations (gv_secret_xxx) */
  apiSecret: string;
}

/** User information from platform authentication */
export interface GamvioUser {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
}

/** Game session returned by startSession */
export interface GameSession {
  session_id: string;
  hmac_key: string;
  started_at: string;
}

/** Result of score submission */
export interface ScoreResult {
  score_id: string;
  score: number;
  session_id: string;
}

/** Leaderboard entry */
export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  score: number;
  played_at: string;
}

/** Player rank info */
export interface PlayerRank {
  rank: number;
  score: number;
  total_players: number;
}

/** Context value provided by GamvioGameProvider */
export interface GamvioGameContext {
  /** Whether SDK is initialized and user is authenticated */
  isReady: boolean;
  /** Whether SDK is loading */
  isLoading: boolean;
  /** Authenticated user info */
  user: GamvioUser | null;
  /** Access token for API calls */
  accessToken: string | null;
  /** Game ID */
  gameId: string | null;
  /** Error message if initialization failed */
  error: string | null;
  /** Start a new game session (call before each game round) */
  startSession: () => Promise<GameSession>;
  /** Submit a score for the current session */
  submitScore: (score: number, metadata?: Record<string, unknown>) => Promise<ScoreResult>;
  /** Get the leaderboard */
  getLeaderboard: (limit?: number) => Promise<LeaderboardEntry[]>;
  /** Get the current player's rank */
  getMyRank: () => Promise<PlayerRank | null>;
}
