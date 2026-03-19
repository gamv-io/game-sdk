/**
 * @gamvio/game-sdk/client
 *
 * React hooks for Gamvio games.
 *
 * Usage:
 *   import { useGamvio } from '@gamvio/game-sdk/client';
 *
 *   function MyGame() {
 *     const { user, isReady, startSession, submitScore } = useGamvio();
 *     // ...
 *   }
 */

'use client';

export { useGamvio } from './use-gamvio';
export { GamvioGameProvider } from './gamvio-provider';
export type { GamvioGameProviderProps } from './gamvio-provider';
