import type { Level } from '../types.js';
import type { Orbit, OrbitPuzzle, OrbitSession } from './types.js';
export declare const orbitBank: OrbitPuzzle[];
export declare const orbitCount: (level: Level) => number;
export declare const activeOrbits: (p: OrbitPuzzle, level: Level) => Orbit[];
export declare function validateOrbit(p: OrbitPuzzle): string[];
export declare function orbitGuess(s: OrbitSession, p: OrbitPuzzle, raw: string): {
    session: OrbitSession;
    message: string;
};
export declare function orbitHint(s: OrbitSession, id: string, p: OrbitPuzzle): OrbitSession;
