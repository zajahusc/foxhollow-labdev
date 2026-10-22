import type { Rule } from './types.js';
export declare const vowelCount: (s: string) => number;
export declare const unique: (s: string) => boolean;
export declare const prime: (n: number) => boolean;
export declare const digitSum: (s: string) => number;
export declare const rules: Rule[];
export declare const ruleMap: Map<string, Rule>;
export declare function getRule(id: string): Rule;
