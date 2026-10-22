import type { Level } from '../types.js';
export type NewGame = 'wordorbit' | 'semanticgravity' | 'wordweave';
export type WeaveMode = 'square' | 'cross' | 'letter' | 'free';
export interface Orbit {
    id: string;
    category: string;
    answer: string;
    accepted: string[];
    rejected: string[];
    clue: string;
    explanation: string;
    source: string;
}
export interface OrbitPuzzle {
    id: string;
    center: string;
    topic: string;
    orbits: Orbit[];
    review: {
        method: 'source-backed-construction';
        notes: string;
        date: string;
    };
}
export interface GravityTarget {
    id: string;
    word: string;
    category: string;
    level: Level;
    model: string;
    vocabulary: string;
    neighbors: number;
    hintRanks: [number, number];
    estimated: true;
}
export interface Vocabulary {
    version: string;
    model: string;
    dimensions: number;
    words: string[];
    source: string;
    sha256: string;
}
export interface WeavePuzzle {
    id: string;
    level: Level;
    size: number;
    mode: WeaveMode;
    layout: string;
    givens: string;
    solution: string;
    inventory: string | null;
    dictionary: string;
    unique: boolean;
    searchNodes: number;
    constraints: {
        noRepeat: boolean;
    };
    estimated: true;
}
interface Base {
    key: string;
    game: NewGame;
    mode: 'daily' | 'practice';
    day: string;
    level: Level;
    phase: 'playing' | 'solved' | 'failed';
    started: number;
    finished: number | null;
    score: number;
    guesses: string[];
    mistakes: number;
    hints: number;
}
export interface OrbitSession extends Base {
    game: 'wordorbit';
    puzzleId: string;
    filled: Record<string, string>;
    assistance: Record<string, number>;
    active: string | null;
}
export interface GravitySession extends Base {
    game: 'semanticgravity';
    puzzleId: string;
    ranks: {
        word: string;
        rank: number;
    }[];
    limit: number | null;
}
export interface GridSnapshot {
    letters: string;
    notes: Record<string, string>;
}
export interface WeaveSession extends Base {
    game: 'wordweave';
    puzzle: WeavePuzzle;
    letters: string;
    notes: Record<string, string>;
    past: GridSnapshot[];
    future: GridSnapshot[];
    selected: number;
    pencil: boolean;
    hintsByType: [number, number, number];
    hintLetters: Record<number, string>;
    feedback: boolean;
}
export type NewSession = OrbitSession | GravitySession | WeaveSession;
export interface Result {
    key: string;
    puzzleId: string;
    mode: 'daily' | 'practice';
    day: string;
    won: boolean;
    score: number;
    guesses: number;
    mistakes: number;
    hints: number;
    level: Level;
    seconds: number;
}
export interface Save {
    version: 1;
    daily: Record<string, NewSession>;
    practice: NewSession | null;
    records: Result[];
    attempted: string[];
    recent: string[];
    serial: number;
    theme: 'system' | 'light' | 'dark';
    dailyLimit: number | null;
    feedback: {
        puzzleId: string;
        guess: string;
        date: string;
    }[];
}
export interface SolveResult {
    solutions: string[];
    nodes: number;
    exhausted: boolean;
}
export interface Slot {
    id: string;
    cells: number[];
    direction: 'across' | 'down';
}
export {};
