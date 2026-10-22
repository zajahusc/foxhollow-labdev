import type { GravitySession, GravityTarget, Vocabulary } from './types.js';
export interface GravityModel {
    vocabulary: Vocabulary;
    vectors: Float32Array;
    index: Map<string, number>;
}
export interface Ranking {
    ordered: string[];
    ranks: Map<string, number>;
    scores: Map<string, number>;
}
export declare function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number;
export declare function model(vocabulary: Vocabulary, vectors: Float32Array): GravityModel;
export declare function rank(model: GravityModel, target: GravityTarget): Ranking;
export declare function normalizeGuess(raw: string, vocabulary: ReadonlyMap<string, number>): string;
export declare function temperature(rank: number, total: number): string;
export declare function gravityGuess(s: GravitySession, t: GravityTarget, r: Ranking, raw: string): {
    session: GravitySession;
    message: string;
};
export declare function gravityHint(s: GravitySession): GravitySession;
export declare function neighborHints(t: GravityTarget, r: Ranking): [string, string];
export declare function loadGravity(): Promise<GravityModel>;
