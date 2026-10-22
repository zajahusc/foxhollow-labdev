/**
 * Word Fossil: individually checked Online Etymology Dictionary entries, 2026-10-22.
 * Explanations and hints are original paraphrases; source prose is not reproduced.
 * These are Latin/Greek historical stems, not claims about reconstructed PIE roots.
 * Difficulty is an editorial estimate; no human playtest is claimed.
 */
export interface FossilContent {
    id: string;
    level: number;
    root: string;
    aliases: string[];
    language: string;
    meaning: string;
    words: string[];
    explanation: string;
    sources: string[];
    hints: string[];
}
export type FossilEntry = FossilContent;
export declare const fossilContent: FossilContent[];
export interface ParadoxContent {
    id: string;
    level: number;
    scenario: string;
    choices: string[];
    answer: number;
    hints: string[];
    explanation: string;
    /** One entry per choice, aligned after choice rotation. */
    refutations: string[];
    validation: {
        method: string;
        authorship: string;
        scope: string;
        humanReviewed: boolean;
    };
}
export type ParadoxEntry = ParadoxContent;
export declare const paradoxContent: ParadoxContent[];
