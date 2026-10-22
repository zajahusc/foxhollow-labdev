export type Game = 'fourthword' | 'oddrule';
export type Level = 1 | 2 | 3 | 4 | 5;
export type Category = 'Language' | 'Numbers' | 'Structure';
export interface Rule {
    id: string;
    title: string;
    category: Category;
    level: Level;
    hints: [string, string, string];
    test: (item: string) => boolean;
    explain: (item: string) => string;
    reasoning: string;
}
interface PuzzleBase {
    id: string;
    version: 1;
    game: Game;
    level: Level;
    category: Category;
    ruleId: string;
    relationship: string;
    hints: [string, string, string];
    explanation: string;
    evidence: string[];
    source: 'constructed' | 'procedural';
    verification: {
        method: 'deterministic';
        notes: string;
        ambiguity: 'checked-in-rule-catalog';
    };
    created: string;
    estimatedSeconds: number;
    observedDifficulty: null;
}
export interface FourthPuzzle extends PuzzleBase {
    game: 'fourthword';
    clues: [string, string, string];
    answer: string;
    choices: [string, string, string, string];
    aliases: string[];
    answerMode: 'choice' | 'text';
    constraint: string;
    distractorExplanations: string[];
}
export interface OddPuzzle extends PuzzleBase {
    game: 'oddrule';
    items: [string, string, string, string, string, string];
    answer: string;
    ruleChoices: [string, string, string, string];
    decoy: string;
}
export type Puzzle = FourthPuzzle | OddPuzzle;
export type Mode = 'daily' | 'practice';
export type Phase = 'playing' | 'naming' | 'solved' | 'failed';
export interface Session {
    key: string;
    puzzle: Puzzle;
    mode: Mode;
    day: string;
    phase: Phase;
    guesses: string[];
    hints: number;
    selected: string | null;
    nameRule: boolean;
    ruleAnswer: string | null;
    score: number;
    maxMistakes: 3 | 4 | 5;
    started: number;
    finished: number | null;
}
export interface RecordEntry {
    key: string;
    puzzleId: string;
    mode: Mode;
    day: string;
    level: Level;
    won: boolean;
    guesses: number;
    hints: number;
    score: number;
    seconds: number;
    ruleNamed: boolean;
}
export interface Settings {
    nameRule: boolean;
    theme: 'system' | 'light' | 'dark';
    maxMistakes: 3 | 4 | 5;
}
export interface SavedData {
    version: 1;
    daily: {
        [day: string]: Session;
    };
    practice: Session | null;
    records: RecordEntry[];
    attempted: string[];
    recent: string[];
    settings: Settings;
    practiceSerial: number;
    feedback: {
        puzzleId: string;
        reason: string;
        created: string;
    }[];
}
export interface Validation {
    valid: boolean;
    errors: string[];
}
export interface Statistics {
    attempted: number;
    completed: number;
    winRate: number;
    streak: number;
    longest: number;
    averageGuesses: number;
    averageHints: number;
    totalPoints: number;
    averageScore: number;
    best: number;
    byLevel: {
        level: Level;
        played: number;
        wins: number;
        points: number;
    }[];
}
export {};
