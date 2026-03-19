'use client';

import { useContext } from 'react';
import { GamvioCtx } from './gamvio-context';
import type { GamvioGameContext } from '../types';

/**
 * Access Gamvio game SDK context.
 * Must be used within a <GamvioGameProvider>.
 *
 * @example
 * ```tsx
 * const { user, isReady, submitScore } = useGamvio();
 *
 * async function onWin() {
 *   await submitScore(100, { level: 1 });
 * }
 * ```
 */
export function useGamvio(): GamvioGameContext {
  const ctx = useContext(GamvioCtx);
  if (!ctx) {
    throw new Error('useGamvio() must be used within a <GamvioGameProvider>');
  }
  return ctx;
}
