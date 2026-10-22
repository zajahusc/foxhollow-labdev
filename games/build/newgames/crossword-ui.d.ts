import type { WeaveSession } from './types.js';
export interface CrosswordActions {
    select: (cell: number, touch?: boolean, direction?: 'across' | 'down') => void;
    enter: (value: string) => void;
    options: () => void;
    submit: () => void;
}
export declare function currentRun(s: WeaveSession): import("./types.js").Slot | undefined;
export declare function renderCrossword(s: WeaveSession, board: HTMLElement, actions: CrosswordActions): void;
