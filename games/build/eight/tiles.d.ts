import type { Meta, Level } from './common.js';
export interface TilePuzzle extends Meta {
    game: 'tiletheory';
    size: number;
    givens: number[];
    solution: number[];
    constellation: number[];
}
export declare const tileNames: string[];
export declare const tileGlyphs: string[];
export declare function tileGroups(p: Pick<TilePuzzle, 'size' | 'constellation'>): number[][];
export declare function allowedTiles(p: TilePuzzle, board: number[], cell: number): number[];
export declare function tileConflicts(p: TilePuzzle, board: number[]): number[];
export declare function solveTiles(p: TilePuzzle, initial?: number[], cap?: number): number[][];
export declare function singleSolve(p: TilePuzzle): boolean;
export declare function makeTiles(level: Level, seed: string): TilePuzzle;
export declare function tileAnswer(p: TilePuzzle, board: number[]): boolean;
export declare function validateTiles(p: TilePuzzle): import("./common.js").Validation;
