import type { Meta } from './common.js';
export interface ParadoxPuzzle extends Meta {
    game: 'paradoxbox';
    scenario: string;
    choices: string[];
    answer: number;
    hints: string[];
    explanation: string;
    refutations: string[];
    validation: {
        method: string;
    };
}
export type ParadoxAction = {
    type: 'choose';
    choice: number;
} | {
    type: 'showChoices';
} | {
    type: 'hint';
};
export declare const paradoxAnswer: (p: ParadoxPuzzle, choice: number) => boolean;
export declare function validateParadox(p: ParadoxPuzzle): import("./common.js").Validation;
