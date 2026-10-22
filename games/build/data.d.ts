import type { Game, Level, Puzzle, Validation } from './types.js';
export declare const normalize: (s: string) => string;
export declare function hash(s: string): number;
export declare function random(seed: string): () => number;
export declare function shuffle<T>(values: readonly T[], seed: string): T[];
interface Material {
    id: string;
    yes: string[];
    no: string[];
    surface: string;
}
export declare const materials: Material[];
export declare function construct(material: Material, game: Game, seed?: string, source?: 'constructed' | 'procedural'): Puzzle;
export declare const bank: Puzzle[];
export declare function validatePuzzle(p: Puzzle): Validation;
export declare function validateBank(puzzles: Puzzle[]): void;
export declare function generate(game: Game, level: Level, seed: string): Puzzle;
export {};
