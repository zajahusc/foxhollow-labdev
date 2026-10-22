import type { Meta, Level } from './common.js';
export interface NegativeProperty {
    id: string;
    text: string;
    kind: 'divisible' | 'greater' | 'digit' | 'prime' | 'square' | 'vowel' | 'length' | 'letter' | 'sides' | 'filled' | 'curved' | 'tag';
    value: number | string;
}
export interface NegativeCandidate {
    id: string;
    label: string;
    sides: number;
    filled: boolean;
    curved: boolean;
    tags?: Record<string, boolean>;
    sources?: string[];
}
export interface NegativePuzzle extends Meta {
    game: 'negativelogic';
    category: string;
    candidates: NegativeCandidate[];
    target: string;
    clues: NegativeProperty[];
}
export declare function property(c: NegativeCandidate, p: NegativeProperty): boolean;
export declare function negativeSurvivors(p: NegativePuzzle, clues?: NegativeProperty[]): NegativeCandidate[];
export declare const negativeCategories: string[];
export declare function makeNegative(level: Level, seed: string, chosen?: NegativePuzzle['category']): NegativePuzzle;
export declare function validateNegative(p: NegativePuzzle): import("./common.js").Validation;
