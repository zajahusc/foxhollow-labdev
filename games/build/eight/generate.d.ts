import type { Game, Level } from './common.js';
import type { Puzzle } from './engine.js';
export declare const generatedGames: Game[];
export declare function generate(game: Game, level: Level, seed: string, category?: string): Puzzle;
