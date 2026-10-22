export { lockDictionary } from './lock-dictionary.js';
import type { Meta, Level } from './common.js';
export type LockClue = {
    kind: 'at';
    index: number;
    letter: string;
} | {
    kind: 'vowels';
    count: number;
} | {
    kind: 'contains' | 'excludes';
    letter: string;
} | {
    kind: 'distinct';
    count: number;
} | {
    kind: 'frequency';
    letter: string;
    count: number;
} | {
    kind: 'vowelAt';
    index: number;
    yes: boolean;
} | {
    kind: 'adjacentVowels';
    yes: boolean;
} | {
    kind: 'alphabet';
    index: number;
    after: boolean;
};
export interface LockPuzzle extends Meta {
    game: 'lexiconlock';
    word: string;
    dictionary: 'fox-crossword-wordnet-v2';
    clues: LockClue[];
    diagnostic: number[];
}
export declare function fits(word: string, c: LockClue): boolean;
export declare function clueText(c: LockClue): string;
export declare function lockCandidates(p: LockPuzzle, clues?: LockClue[]): string[];
export declare function makeLock(level: Level, seed: string): LockPuzzle;
export declare function validateLock(p: LockPuzzle): import("./common.js").Validation;
export declare const lockAnswer: (p: LockPuzzle, answer: string) => boolean;
