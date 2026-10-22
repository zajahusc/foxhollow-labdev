export declare function readHard(game: string): boolean;
export declare function writeHard(game: string, hard: boolean): void;
export declare const compactLegacyScore: (score: number) => number;
export declare function migrateScores<T extends {
    scoreVersion?: 2;
    daily: Record<string, {
        score: number;
    }>;
    records: {
        score: number;
    }[];
    practice: {
        score: number;
    } | null;
}>(data: T, oldVersion: unknown): T;
