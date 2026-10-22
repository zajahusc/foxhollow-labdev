/** Original editorial SVG drawings. Metadata is separate so the drawing module can be loaded on demand.
 * All drawings use viewBox="0 0 320 240", fill="none", round caps/joins, stroke-width="2.4".
 * Each array item is one continuous pen stroke; order is authored, never randomized.
 * Sources verify factual metadata; no illustration is copied from those sources.
 */
export interface Landmark {
    id: string;
    name: string;
    aliases: string[];
    category: 'natural' | 'human-made';
    country: string;
    continent: string;
    level: number;
    facts: string[];
    sources: string[];
}
export declare const landmarkContent: Landmark[];
/** Progressive paths authored specifically for these puzzles. No text, labels, fills or disconnected M subpaths. */
export declare const landmarkDrawings: Record<string, string[]>;
