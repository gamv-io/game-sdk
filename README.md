<div align="center">
  <img src="https://gamv.io/images/gamvio-logo.svg" alt="Gamvio" width="120" />
  <h1>@gamvio/game-sdk</h1>
  <p><strong>Build games on Gamvio with authentication, anti-cheat scoring, and leaderboards.</strong></p>

  <p>
    <a href="https://www.npmjs.com/package/@gamvio/game-sdk"><img src="https://img.shields.io/npm/v/@gamvio/game-sdk?style=flat-square&color=0070f3" alt="npm version" /></a>
    <a href="https://www.npmjs.com/package/@gamvio/game-sdk"><img src="https://img.shields.io/npm/dm/@gamvio/game-sdk?style=flat-square&color=0070f3" alt="npm downloads" /></a>
    <a href="https://github.com/gamv-io/game-sdk/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@gamvio/game-sdk?style=flat-square" alt="license" /></a>
    <img src="https://img.shields.io/badge/TypeScript-5.7+-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Next.js-14%2B-black?style=flat-square&logo=next.js" alt="Next.js" />
  </p>

  <p>
    <a href="https://gamv.io/developers/docs">Documentation</a> &bull;
    <a href="https://gamv.io/developers">Developer Portal</a> &bull;
    <a href="https://github.com/gamv-io/sample-arcade">Example Games</a> &bull;
    <a href="https://gamv.io">gamv.io</a>
  </p>
</div>

---

## Why this SDK?

The Gamvio Game SDK handles the hard parts of building games on a platform: **identity verification**, **tamper-proof score submission** via HMAC-SHA256 signing, and **real-time leaderboards** -- all through a clean, type-safe API that keeps secrets off the client.

```
Server (secrets safe)          Client (React hooks)
┌────────────────────┐         ┌────────────────────┐
│ createGameServer() │ <-----> │ GamvioGameProvider  │
│ - authenticateUser │         │ - useGamvio()       │
│ - startSession     │         │ - submitScore()     │
│ - submitScore      │         │ - getLeaderboard()  │
│ - getLeaderboard   │         │ - getMyRank()       │
│ - getPlayerRank    │         │                     │
│ - resolveGameId    │         │ Auto session mgmt   │
└────────────────────┘         └────────────────────┘
   @gamvio/game-sdk/server        @gamvio/game-sdk/client
```

---

## Quick Start

Choose the approach that fits your stack:

### Option A: Scaffold a new game (recommended)

```bash
npx create-gamvio-game my-game
```

Creates a ready-to-run Next.js project with auth, sessions, and leaderboards pre-wired.

### Option B: Next.js Server Actions

Add the SDK to an existing Next.js app in 4 steps -- see [Full Next.js Integration](#full-nextjs-integration) below.

### Option C: Any backend + client

Use `createGameServer()` in Express, Fastify, or any Node.js server. See [Non-Next.js Integration](#non-nextjs-integration).

---

## Installation

```bash
# npm
npm install @gamvio/game-sdk

# pnpm
pnpm add @gamvio/game-sdk

# yarn
yarn add @gamvio/game-sdk
```

### Peer dependencies

```bash
npm install next react react-dom
```

> **Minimum versions:** Next.js >= 14, React >= 18

---

## Full Next.js Integration

### 1. Environment variables

```env
GAMVIO_API_URL=https://gamv.io
GAMVIO_GAME_ID=your-game-uuid
GAMVIO_API_SECRET=gv_secret_xxx
```

### 2. Server Actions

```ts
// app/game/actions.ts
'use server';

import { createGameServer } from '@gamvio/game-sdk/server';

const gamvio = createGameServer({
  apiUrl: process.env.GAMVIO_API_URL!,
  gameId: process.env.GAMVIO_GAME_ID!,
  apiSecret: process.env.GAMVIO_API_SECRET!,
});

export const authenticateUser = gamvio.authenticateUser;
export const startSession    = gamvio.startSession;
export const submitScore     = gamvio.submitScore;
export const getLeaderboard  = gamvio.getLeaderboard;
export const getPlayerRank   = gamvio.getPlayerRank;
```

### 3. Page with Provider

```tsx
// app/game/page.tsx
import { GamvioGameProvider } from '@gamvio/game-sdk/client';
import {
  authenticateUser, startSession, submitScore, getLeaderboard, getPlayerRank,
} from './actions';
import { MyGame } from './my-game';

export default async function GamePage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token!;
  const user = await authenticateUser(token);

  return (
    <GamvioGameProvider
      accessToken={token}
      user={user}
      gameId={process.env.GAMVIO_GAME_ID!}
      onStartSession={startSession}
      onSubmitScore={submitScore}
      onGetLeaderboard={getLeaderboard}
      onGetMyRank={getPlayerRank}
    >
      <MyGame />
    </GamvioGameProvider>
  );
}
```

### 4. Game Component

```tsx
// app/game/my-game.tsx
'use client';

import { useGamvio } from '@gamvio/game-sdk/client';

export function MyGame() {
  const { user, isReady, isLoading, error, submitScore, getLeaderboard } = useGamvio();

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  async function handleGameOver(finalScore: number) {
    const result = await submitScore(finalScore, { level: 3 });
    console.log('Submitted:', result.score_id);
  }

  return (
    <div>
      <p>Welcome, {user?.name}!</p>
      <button onClick={() => handleGameOver(1500)} disabled={!isReady}>
        Submit Score
      </button>
    </div>
  );
}
```

---

## Non-Next.js Integration

Use `createGameServer()` on any Node.js backend (Express, Fastify, Hono, etc.) and call the Gamvio API from your own routes.

```ts
import { createGameServer } from '@gamvio/game-sdk/server';

const gamvio = createGameServer({
  apiUrl: process.env.GAMVIO_API_URL!,
  gameId: process.env.GAMVIO_GAME_ID!,
  apiSecret: process.env.GAMVIO_API_SECRET!,
});

app.post('/api/gamvio/submit', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')!;
  const session = await gamvio.startSession(token);
  const result = await gamvio.submitScore(
    token,
    session.session_id,
    session.hmac_key,
    req.body.score,
  );
  res.json(result);
});
```

The client sends its platform token via the `Authorization` header. Your backend handles HMAC signing transparently.

---

## Server SDK

```ts
import { createGameServer } from '@gamvio/game-sdk/server';
```

### `createGameServer(config)`

Creates a server-side SDK instance. All methods run **server-side only** -- secrets never reach the browser.

```ts
const gamvio = createGameServer({
  apiUrl: string;     // Gamvio API base URL
  gameId: string;     // Your game's UUID (from Developer Portal)
  apiSecret: string;  // Server-side secret key (gv_secret_xxx)
});
```

### Methods

#### `authenticateUser(accessToken)`

Verify a platform token and retrieve the user's identity.

```ts
const user = await gamvio.authenticateUser(token);
// => { id, name, email?, avatar_url? }
```

#### `startSession(accessToken)`

Start a new game session. **Must be called before each game round.** Returns `session_id` and `hmac_key` for score signing.

```ts
const session = await gamvio.startSession(token);
// => { session_id, hmac_key, started_at }
```

#### `submitScore(accessToken, sessionId, hmacKey, score, metadata?)`

Submit a score with HMAC-SHA256 anti-cheat signing. The SDK computes the signature server-side.

```ts
const result = await gamvio.submitScore(
  token,
  session.session_id,
  session.hmac_key,
  1500,
  { level: 3, difficulty: 'hard' },
);
// => { score_id, score, session_id }
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `accessToken` | `string` | Yes | User's platform token |
| `sessionId` | `string` | Yes | From `startSession()` |
| `hmacKey` | `string` | Yes | From `startSession()` (hex) |
| `score` | `number` | Yes | Numeric score value |
| `metadata` | `Record<string, unknown>` | No | Arbitrary key-value data |

#### `getLeaderboard(limit?)`

Fetch the game's leaderboard. No authentication required.

```ts
const entries = await gamvio.getLeaderboard(10);
// => [{ rank, user_id, user_name, score, played_at }, ...]
```

#### `getPlayerRank(accessToken)`

Get the current player's rank and score. Returns `null` if the player has no scores.

```ts
const rank = await gamvio.getPlayerRank(token);
// => { rank, score, total_players } | null
```

#### `resolveGameId(slug)`

Convert a game slug to its UUID. Useful for multi-game projects.

```ts
const gameId = await gamvio.resolveGameId('space-invaders');
// => "550e8400-e29b-41d4-a716-446655440000" | null
```

---

## Client SDK

```ts
import { GamvioGameProvider, useGamvio } from '@gamvio/game-sdk/client';
```

### `<GamvioGameProvider>`

Context provider that wraps your game. **Auto-starts a session on mount** and auto-starts a new session after each score submission.

| Prop | Type | Required | Description |
|---|---|---|---|
| `accessToken` | `string` | Yes | Platform access token |
| `user` | `GamvioUser` | Yes | Authenticated user info |
| `gameId` | `string` | Yes | Game UUID |
| `onStartSession` | `(token: string) => Promise<GameSession>` | Yes | Server action for session start |
| `onSubmitScore` | `(token, sessionId, hmacKey, score, metadata?) => Promise<ScoreResult>` | Yes | Server action for score submission |
| `onGetLeaderboard` | `(limit?: number) => Promise<LeaderboardEntry[]>` | No | Server action for leaderboard |
| `onGetMyRank` | `(token: string) => Promise<PlayerRank \| null>` | No | Server action for player rank |

### `useGamvio()`

Hook to access SDK state and actions. Must be used within `<GamvioGameProvider>`.

| Property | Type | Description |
|---|---|---|
| `isReady` | `boolean` | `true` when session is active and ready for score submission |
| `isLoading` | `boolean` | `true` during initialization |
| `user` | `GamvioUser \| null` | Current user |
| `accessToken` | `string \| null` | Platform access token |
| `gameId` | `string \| null` | Game UUID |
| `error` | `string \| null` | Error message if initialization failed |
| `startSession()` | `() => Promise<GameSession>` | Manually start a new session |
| `submitScore(score, metadata?)` | `(score: number, metadata?) => Promise<ScoreResult>` | Submit score for current session |
| `getLeaderboard(limit?)` | `(limit?: number) => Promise<LeaderboardEntry[]>` | Fetch leaderboard |
| `getMyRank()` | `() => Promise<PlayerRank \| null>` | Get current player's rank |

---

## Authentication Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│  gamv.io │     │  Your Game   │     │  Your Server │     │ Gamvio   │
│ Platform │     │  (Browser)   │     │  (Node.js)   │     │ API      │
└────┬─────┘     └──────┬───────┘     └──────┬───────┘     └────┬─────┘
     │                  │                    │                   │
     │  1. User clicks  │                    │                   │
     │     "Play"       │                    │                   │
     │                  │                    │                   │
     │  2. Redirect     │                    │                   │
     │  ?token=xxx ───> │                    │                   │
     │                  │                    │                   │
     │                  │  3. authenticateUser(token)             │
     │                  │  ─────────────────>│                   │
     │                  │                    │  4. Verify token  │
     │                  │                    │  ────────────────>│
     │                  │                    │                   │
     │                  │                    │  5. Return user   │
     │                  │                    │  <────────────────│
     │                  │                    │                   │
     │                  │  6. User data      │                   │
     │                  │  <─────────────────│                   │
     │                  │                    │                   │
     │                  │  7. GamvioGameProvider                 │
     │                  │     initialized    │                   │
     └──────────────────┴────────────────────┴───────────────────┘
```

**Two types of credentials:**

| Credential | Who has it | Purpose | Lifetime |
|---|---|---|---|
| **Platform Token** (`token`) | User / Browser | Identifies the player | Short-lived, per-session |
| **API Secret** (`gv_secret_xxx`) | Your server only | Authenticates your game | Long-lived, rotate in Dev Portal |

---

## Anti-Cheat Architecture

Score submissions are protected by HMAC-SHA256 signatures computed **server-side**. The signing key never reaches the browser.

```
  Browser (Client)                Server                     Gamvio API
  ─────────────────         ─────────────────           ─────────────────
        │                         │                           │
        │  1. startSession()      │                           │
        │ ───────────────────────>│                           │
        │                         │  POST /game-sessions/start│
        │                         │ ─────────────────────────>│
        │                         │                           │
        │                         │  { session_id, hmac_key } │
        │                         │ <─────────────────────────│
        │                         │                           │
        │  { session_id }         │  (hmac_key stays here!)   │
        │ <───────────────────────│                           │
        │                         │                           │
        │  2. Player plays...     │                           │
        │                         │                           │
        │  3. submitScore(1500)   │                           │
        │ ───────────────────────>│                           │
        │                         │                           │
        │                    4. Server computes HMAC:         │
        │                    msg = "{session_id}:{score}:{ts}"│
        │                    sig = HMAC-SHA256(hmac_key, msg) │
        │                         │                           │
        │                         │  POST /game-sessions/score│
        │                         │  { score, signature, ts } │
        │                         │ ─────────────────────────>│
        │                         │                           │
        │                         │  5. API verifies sig      │
        │                         │     Session consumed       │
        │                         │ <─────────────────────────│
        │                         │                           │
        │  { score_id, score }    │                           │
        │ <───────────────────────│                           │
```

**Security properties:**

- `hmac_key` never reaches the browser
- Each session allows exactly **one** score submission
- Signature includes a timestamp to prevent replay attacks
- The SDK auto-starts a new session after each submission

---

## Score Submission

Complete flow from game start to score submission:

```tsx
'use client';

import { useGamvio } from '@gamvio/game-sdk/client';

export function SpaceGame() {
  const { isReady, submitScore, getLeaderboard, getMyRank } = useGamvio();

  async function onGameOver(score: number) {
    // Step 1: Submit the score (HMAC signing happens server-side)
    const result = await submitScore(score, {
      level: 5,
      enemies_defeated: 42,
      time_ms: 93200,
    });
    console.log('Score ID:', result.score_id);

    // Step 2: Fetch updated leaderboard
    const leaderboard = await getLeaderboard(10);

    // Step 3: Check player's rank
    const myRank = await getMyRank();
    if (myRank) {
      console.log(`Rank #${myRank.rank} of ${myRank.total_players}`);
    }

    // A new session is automatically started -- player can play again
  }

  return (
    <button onClick={() => onGameOver(1500)} disabled={!isReady}>
      Finish Game
    </button>
  );
}
```

---

## Leaderboards

```tsx
'use client';

import { useGamvio } from '@gamvio/game-sdk/client';
import { useEffect, useState } from 'react';
import type { LeaderboardEntry } from '@gamvio/game-sdk';

export function Leaderboard() {
  const { getLeaderboard } = useGamvio();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    getLeaderboard(20).then(setEntries);
  }, [getLeaderboard]);

  return (
    <table>
      <thead>
        <tr><th>#</th><th>Player</th><th>Score</th></tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <tr key={e.user_id}>
            <td>{e.rank}</td>
            <td>{e.user_name}</td>
            <td>{e.score.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## Multi-Game Projects

If your app hosts multiple games, use `resolveGameId()` to dynamically look up game UUIDs from slugs:

```ts
// app/game/[slug]/actions.ts
'use server';

import { createGameServer } from '@gamvio/game-sdk/server';

const gamvio = createGameServer({
  apiUrl: process.env.GAMVIO_API_URL!,
  gameId: '',  // Will be resolved per-request
  apiSecret: process.env.GAMVIO_API_SECRET!,
});

export async function getGameId(slug: string) {
  const id = await gamvio.resolveGameId(slug);
  if (!id) throw new Error(`Unknown game: ${slug}`);
  return id;
}
```

---

## Test Mode

During development, generate test tokens without a real Gamvio account:

```bash
curl -X POST https://gamv.io/api/v1/sdk/auth/test-token \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": "your-game-uuid",
    "api_secret": "gv_secret_xxx",
    "test_user": {
      "name": "Test Player",
      "email": "test@example.com"
    }
  }'
```

Returns a short-lived access token you can use in place of a real platform token. Pass it via `?token=xxx` in your game URL during development.

> **Note:** Test tokens are only available for games in development mode (configured in the Developer Portal).

---

## Error Handling

```tsx
import { useGamvio } from '@gamvio/game-sdk/client';

function MyGame() {
  const { error, isReady, submitScore } = useGamvio();

  // Initialization errors are surfaced via the error property
  if (error) return <div>Failed to initialize: {error}</div>;

  async function handleSubmit(score: number) {
    try {
      await submitScore(score);
    } catch (err) {
      if (err instanceof Error) {
        console.error('Submit failed:', err.message);
      }
    }
  }

  return <button onClick={() => handleSubmit(100)} disabled={!isReady}>Submit</button>;
}
```

### Error Codes

| Error | Cause | Resolution |
|---|---|---|
| `No active session` | `submitScore()` called before session is ready | Wait for `isReady === true` or call `startSession()` |
| `API request failed` | Network error or server issue | Retry with exponential backoff |
| `Invalid token` | Expired or malformed platform token | Redirect user to re-authenticate via gamv.io |
| `Session already consumed` | Score already submitted for this session | SDK auto-starts a new session; wait for `isReady` |
| `Invalid signature` | HMAC verification failed (should not happen with SDK) | Ensure `hmac_key` from `startSession()` is passed correctly |
| `Game not found` | Invalid `gameId` in config | Verify UUID in Developer Portal |
| `Unauthorized` | Invalid or missing `apiSecret` | Check `GAMVIO_API_SECRET` env variable |

---

## TypeScript Types

All types are exported from the root entry point:

```ts
import type {
  GamvioGameConfig,
  GamvioUser,
  GameSession,
  ScoreResult,
  LeaderboardEntry,
  PlayerRank,
  GamvioGameContext,
} from '@gamvio/game-sdk';
```

<details>
<summary><strong>Full type definitions</strong></summary>

```ts
interface GamvioGameConfig {
  apiUrl: string;
  gameId: string;
  apiSecret: string;
}

interface GamvioUser {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
}

interface GameSession {
  session_id: string;
  hmac_key: string;
  started_at: string;
}

interface ScoreResult {
  score_id: string;
  score: number;
  session_id: string;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  score: number;
  played_at: string;
}

interface PlayerRank {
  rank: number;
  score: number;
  total_players: number;
}

interface GamvioGameContext {
  isReady: boolean;
  isLoading: boolean;
  user: GamvioUser | null;
  accessToken: string | null;
  gameId: string | null;
  error: string | null;
  startSession: () => Promise<GameSession>;
  submitScore: (score: number, metadata?: Record<string, unknown>) => Promise<ScoreResult>;
  getLeaderboard: (limit?: number) => Promise<LeaderboardEntry[]>;
  getMyRank: () => Promise<PlayerRank | null>;
}

interface GamvioGameProviderProps {
  children: ReactNode;
  accessToken: string;
  user: GamvioUser;
  gameId: string;
  onStartSession: (accessToken: string) => Promise<GameSession>;
  onSubmitScore: (
    accessToken: string,
    sessionId: string,
    hmacKey: string,
    score: number,
    metadata?: Record<string, unknown>,
  ) => Promise<ScoreResult>;
  onGetLeaderboard?: (limit?: number) => Promise<LeaderboardEntry[]>;
  onGetMyRank?: (accessToken: string) => Promise<PlayerRank | null>;
}
```

</details>

---

## API Reference

### Server methods (`@gamvio/game-sdk/server`)

| Method | Parameters | Returns | Auth |
|---|---|---|---|
| `authenticateUser` | `(accessToken: string)` | `Promise<GamvioUser>` | Token |
| `startSession` | `(accessToken: string)` | `Promise<GameSession>` | Token |
| `submitScore` | `(accessToken, sessionId, hmacKey, score, metadata?)` | `Promise<ScoreResult>` | Token |
| `getLeaderboard` | `(limit?: number)` | `Promise<LeaderboardEntry[]>` | None |
| `getPlayerRank` | `(accessToken: string)` | `Promise<PlayerRank \| null>` | Token |
| `resolveGameId` | `(slug: string)` | `Promise<string \| null>` | None |

### Client hooks (`@gamvio/game-sdk/client`)

| Export | Type | Description |
|---|---|---|
| `GamvioGameProvider` | Component | Context provider, auto-manages sessions |
| `useGamvio()` | Hook | Access SDK state and actions |

### Package entry points

| Import path | Environment | Contains |
|---|---|---|
| `@gamvio/game-sdk` | Any | All types re-exported |
| `@gamvio/game-sdk/server` | Node.js only | `createGameServer()` |
| `@gamvio/game-sdk/client` | Browser (React) | `GamvioGameProvider`, `useGamvio()` |
| `@gamvio/game-sdk/components` | Browser (React) | Pre-built UI components |

---

## Links

| | |
|---|---|
| **Platform** | [gamv.io](https://gamv.io) |
| **Developer Portal** | [gamv.io/developers](https://gamv.io/developers) |
| **Documentation** | [gamv.io/developers/docs](https://gamv.io/developers/docs) |
| **Example Games** | [github.com/gamv-io/games](https://github.com/gamv-io/sample-arcade) |
| **Source** | [github.com/gamv-io/game-sdk](https://github.com/gamv-io/game-sdk) |
| **Issues** | [github.com/gamv-io/game-sdk/issues](https://github.com/gamv-io/game-sdk/issues) |

---

## License

[MIT](./LICENSE) -- Gamvio, Inc.
