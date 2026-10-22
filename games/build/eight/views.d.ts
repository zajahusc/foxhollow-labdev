import type { Session, Progress } from './engine.js';
import type { Save } from './engine.js';
export interface ViewContext {
    session: Session;
    save: Save;
    change: (focus?: string) => void;
    submit: () => void;
    drawings: Record<string, string[]>;
    message: (text: string) => void;
}
export declare function renderGame(ctx: ViewContext, parent: HTMLElement): void;
export declare function moveGrid(board: readonly number[], size: number, name: string): HTMLElement;
export declare function drawing(paths: string[], shown: number, animate: boolean): SVGSVGElement;
export declare function resetProgress(s: Session): Progress;
