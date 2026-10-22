/**
 * Historical variants checked against the linked dictionary entries on 2026-10-22.
 * Forms are representative documented spellings, not a claim that every speaker
 * changed spelling at one instant or that the listed stages exhaust the history.
 * A Modern English label describes the surviving standard spelling; it does not
 * claim that spelling was first invented in the Modern English period.
 */
export interface EvolutionEntry {
    id: string;
    level: number;
    /** Oldest to newest; the UI shuffles these for the ordering puzzle. */
    forms: string[];
    /** Corresponds to forms; shown after completion, not while ordering. */
    periods: string[];
    explanation: string;
    sources: string[];
    hints: string[];
}
export declare const evolutionContent: EvolutionEntry[];
export interface ReconstructionEntry {
    id: string;
    level: number;
    /** Modern combining spellings; empty suffix means no additional ending. */
    prefix: string;
    root: string;
    suffix: string;
    answer: string;
    aliases: string[];
    language: string;
    meaning: string;
    explanation: string;
    sources: string[];
    hints: string[];
}
/**
 * These reconstruct modern English words from documented historical elements.
 * They do not pretend that English concatenation reproduces a Latin/Greek
 * inflected word or establish which exact route of borrowing a dictionary calls
 * uncertain. Difficulty estimates reflect vocabulary and morphological opacity.
 */
export declare const reconstructionContent: ReconstructionEntry[];
