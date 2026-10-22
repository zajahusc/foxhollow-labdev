import type { Meta } from './common.js';
export interface FossilPuzzle extends Meta {
    game: 'wordfossil';
    mode?: 'root' | 'detective' | 'evolution' | 'reconstruction';
    forms?: string[];
    periods?: string[];
    pieces?: {
        prefix: string;
        root: string;
        suffix: string;
    };
    root: string;
    aliases: string[];
    language: string;
    meaning: string;
    words: string[];
    explanation: string;
    sources: string[];
    hints: string[];
}
export type FossilAction = {
    type: 'guess';
    answer: string;
} | {
    type: 'hint';
};
export declare const fossilAnswer: (p: FossilPuzzle, answer: string) => boolean;
export declare function validateFossil(p: FossilPuzzle): import("./common.js").Validation;
