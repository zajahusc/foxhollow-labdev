import type { NewGame } from './types.js';
import type { Level } from '../types.js';
export declare const newSchedule: Record<string, Record<NewGame, {
    id: string;
    level: Level;
}>>;
