import type { Level } from '../types.js';
import type { WeaveMode, WeavePuzzle } from './types.js';
export type WeaveRequest = {
    id: number;
    action: 'solve' | 'candidates';
    puzzle: WeavePuzzle;
    letters: string;
    cell: number;
} | {
    id: number;
    action: 'generate';
    size: number;
    mode: WeaveMode;
    level: Level;
    seed: string;
};
export interface WorkerReply {
    id: number;
    error?: string;
    solutions?: string[];
    exhausted?: boolean;
    issues?: string[];
    letters?: string[];
    unknown?: string[];
    puzzle?: WeavePuzzle;
}
