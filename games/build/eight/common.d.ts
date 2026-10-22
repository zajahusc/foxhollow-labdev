export type Level = 1 | 2 | 3 | 4 | 5;
export type Game = 'lexiconlock' | 'alibi' | 'missingmove' | 'tiletheory' | 'wordfossil' | 'negativelogic' | 'paradoxbox' | 'linebyline';
export interface Meta {
    id: string;
    game: Game;
    level: Level;
    version: 1;
}
export interface Validation {
    valid: boolean;
    errors: string[];
    solutions: number | null;
    method: string;
}
export declare const normalized: (s: string) => string;
export declare function hash(s: string): number;
export declare function rng(seed: string): () => number;
export declare function shuffled<T>(a: readonly T[], random: () => number): T[];
export declare function permutations(a: number[]): number[][];
export declare function validation(errors: string[], solutions: number | null, method: string): Validation;
export declare const levels: string[];
export declare const catalog: Record<Game, {
    name: string;
    tagline: string;
    mark: string;
    accent: string;
    description: string;
}>;
