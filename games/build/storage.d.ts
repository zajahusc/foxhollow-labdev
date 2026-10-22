import type { Game, SavedData } from './types.js';
export declare const key: (game: Game) => string;
export declare function empty(): SavedData;
export declare function deserialize(raw: string | null): SavedData;
export interface StorageAdapter {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
}
export declare function load(game: Game, storage: Pick<StorageAdapter, 'getItem'>): SavedData;
export declare function store(game: Game, data: SavedData, storage: Pick<StorageAdapter, 'setItem'>): boolean;
