import type { Game, Puzzle } from './types.js';
export declare const schedule: Record<string, Record<Game, {
    id: string;
}>>;
export declare function dailyPuzzle(game: Game, day: string): Puzzle | null;
