import type { Meta, Level } from './common.js';
export type Move = {
    kind: 'row' | 'column' | 'reflectRow' | 'reflectColumn';
    index: number;
} | {
    kind: 'swap' | 'slide';
    a: number;
    b: number;
} | {
    kind: 'rotate';
};
export interface MovePuzzle extends Meta {
    game: 'missingmove';
    size: number;
    before: number[];
    target: number[];
    operations: Move[];
    solution: number[];
    optimal: number;
    limit: number;
}
export declare function applyMove(board: readonly number[], size: number, move: Move): number[];
export declare function moveText(m: Move): string;
export declare const sameBoard: (a: readonly number[], b: readonly number[]) => boolean;
export declare function shortestMoves(p: Pick<MovePuzzle, 'before' | 'target' | 'operations' | 'size' | 'limit'>): number[] | null;
export declare function makeMove(level: Level, seed: string): MovePuzzle;
export declare function moveAnswer(p: MovePuzzle, board: number[], moves: number): boolean;
export declare function validateMove(p: MovePuzzle): import("./common.js").Validation;
