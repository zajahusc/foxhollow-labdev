import type { Meta, Level } from './common.js';
export interface World {
    order: number[];
    offset: number;
}
export type Fact = {
    kind: 'before' | 'adjacent';
    a: number;
    b: number;
} | {
    kind: 'at' | 'notAt';
    a: number;
    slot: number;
} | {
    kind: 'owns';
    a: number;
    item: number;
};
export interface Testimony {
    person: number;
    facts: Fact[];
}
export interface AlibiPuzzle extends Meta {
    game: 'alibi';
    names: string[];
    category: string;
    scenario: string;
    slots: string[];
    objects: string[];
    rotation: boolean;
    statements: Testimony[];
    evidence: Fact[];
    solution: World;
    liar: number;
}
export declare const factTrue: (f: Fact, w: World) => boolean;
export declare const statementTrue: (s: Testimony, w: World) => boolean;
export declare function factText(f: Fact, p: AlibiPuzzle): string;
export declare function allWorlds(p: Pick<AlibiPuzzle, 'names' | 'rotation'>): World[];
export declare function solveAlibi(p: AlibiPuzzle): World[];
export declare function makeAlibi(level: Level, seed: string): AlibiPuzzle;
export declare function alibiAnswer(p: AlibiPuzzle, w: World, liar: number): boolean;
export declare function validateAlibi(p: AlibiPuzzle): import("./common.js").Validation;
