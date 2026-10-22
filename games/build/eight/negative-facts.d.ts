/** Factual candidate sets for Negative Logic. False values are explicit, not missing data.
 * Geography uses UN M49 statistical subregions, not political/cultural continents.
 * A mainland capital lies on a continent rather than an offshore island; country
 * membership and coastline refer to the named sovereign state, including islands.
 * History quarters are years 01–25, 26–50, 51–75, 76–00 of a century.
 * Musical traits refer to ordinary acoustic versions and their standard construction.
 * Animal traits refer to healthy adult animals, and leg counts include vestigial legs but exclude wings/arms.
 */
export interface NegativeFactSet {
    category: string;
    candidates: {
        id: string;
        label: string;
        tags: Record<string, boolean>;
        sources: string[];
    }[];
    properties: {
        key: string;
        description: string;
    }[];
}
export declare const negativeFactSets: NegativeFactSet[];
