import type { Game, Level, Validation } from './common.js';
import type { LockPuzzle } from './lexicon.js';
import type { AlibiPuzzle } from './alibi.js';
import type { MovePuzzle } from './moves.js';
import type { TilePuzzle } from './tiles.js';
import type { NegativePuzzle } from './negative.js';
import type { FossilPuzzle } from './fossil.js';
import type { ParadoxPuzzle } from './paradox.js';
import type { LinePuzzle } from './lines.js';
export type Puzzle = LockPuzzle | AlibiPuzzle | MovePuzzle | TilePuzzle | NegativePuzzle | FossilPuzzle | ParadoxPuzzle | LinePuzzle;
export interface Progress {
    text: string;
    checked: number[];
    notes: Record<string, string>;
    order: number[];
    liar: number;
    badge: number;
    board: number[];
    past: number[][];
    future: number[][];
    movePath: number[];
    eliminated: string[];
    possible: string[];
    choice: number;
    clues: number;
    strokes: number;
    choicesShown: boolean;
    pencil: boolean;
    selected: number;
}
export interface Session {
    puzzle: Puzzle;
    mode: 'daily' | 'practice';
    day: string;
    serial: number;
    phase: 'playing' | 'solved' | 'revealed' | 'lost';
    progress: Progress;
    mistakes: number;
    hints: number;
    hintTexts: string[];
    started: number;
    finished: number | null;
    score: number;
}
export interface Result {
    key: string;
    puzzleId: string;
    day: string;
    mode: 'daily' | 'practice';
    level: Level;
    won: boolean;
    score: number;
    hints: number;
    mistakes: number;
    strokes: number;
    continent: string;
    category: string;
}
export interface Save {
    version: 1;
    game: Game;
    daily: Record<string, Session>;
    practice: Session | null;
    records: Result[];
    recent: string[];
    serial: number;
    theme: 'system' | 'light' | 'dark';
    animation: boolean;
    hintOrder: 'geography' | 'category';
    continuous: boolean;
}
export declare const storageKey: (game: Game) => string;
export declare const blankSave: (game: Game) => Save;
export declare function initial(puzzle: Puzzle, mode: 'daily' | 'practice', serial?: number, day?: string): Session;
export declare function validatePuzzle(p: Puzzle): Validation;
export declare function correct(s: Session): boolean;
export declare function points(s: Session): number;
export declare function submit(s: Session): Session;
export declare const reveal: (s: Session) => Session;
export declare function hintText(s: Session, order?: Save['hintOrder']): string;
export declare function useHint(s: Session, order?: Save['hintOrder']): Session;
export declare function explanation(p: Puzzle): string[];
export declare const resultKey: (s: Session) => string;
export declare function commit(save: Save, s: Session): Save;
export declare function statistics(save: Save, today?: string): {
    attempted: number;
    completed: number;
    wins: number;
    winRate: number;
    streak: number;
    longest: number;
    best: number;
    average: number;
    averageHints: string;
    byLevel: {
        level: number;
        played: number;
        wins: number;
    }[];
    averageStrokes: string;
    fewestStrokes: number;
};
export declare function shareText(s: Session): string;
export declare function decode(raw: string | null, game: Game): Save;
export declare function choosePractice(bank: Puzzle[], level: Level, recent: string[], serial: number, game: Game): Puzzle;
export declare const answerNormalized: (s: string) => string;
