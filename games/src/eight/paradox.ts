import {validation} from './common.js';
import type {Meta} from './common.js';
export interface ParadoxPuzzle extends Meta{game:'paradoxbox';scenario:string;choices:string[];answer:number;hints:string[];explanation:string;refutations:string[];validation:{method:string}}
export type ParadoxAction={type:'choose';choice:number}|{type:'showChoices'}|{type:'hint'};
export const paradoxAnswer=(p:ParadoxPuzzle,choice:number)=>choice===p.answer;
export function validateParadox(p:ParadoxPuzzle){const errors:string[]=[];if(p.choices.length!==4||new Set(p.choices).size!==4||!Number.isInteger(p.answer)||p.answer<0||p.answer>=4||p.hints.length!==3||p.refutations.length!==4||!p.validation.method||!p.scenario||!p.explanation)errors.push('Incomplete finite-choice scenario.');return validation(errors,1,'Authored closed-choice scenario with explicit facts and individual distractor refutations; schema checks do not prove universal lateral uniqueness.');}
