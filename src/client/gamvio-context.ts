'use client';

import { createContext } from 'react';
import type { GamvioGameContext } from '../types';

export const GamvioCtx = createContext<GamvioGameContext | null>(null);
