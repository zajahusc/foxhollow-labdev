import type { Meta } from './common.js';
export interface LinePuzzle extends Meta {
    game: 'linebyline';
    landmarkId: string;
    name: string;
    aliases: string[];
    category: 'natural' | 'human-made';
    country: string;
    continent: string;
    facts: string[];
    sources: string[];
    total: number;
}
export type LineAction = {
    type: 'stroke';
} | {
    type: 'guess';
    answer: string;
} | {
    type: 'hint';
} | {
    type: 'pause' | 'play';
};
export declare function landmarkAnswer(p: LinePuzzle, answer: string): boolean;
export declare function strokeScore(revealed: number, total: number, mistakes: number, hints: number): number;
export declare function validateLine(p: LinePuzzle): import("./common.js").Validation;
