import {normalized,validation} from './common.js';
import type {Meta} from './common.js';
export interface LinePuzzle extends Meta{game:'linebyline';landmarkId:string;name:string;aliases:string[];category:'natural'|'human-made';country:string;continent:string;facts:string[];sources:string[];total:number}
export type LineAction={type:'stroke'}|{type:'guess';answer:string}|{type:'hint'}|{type:'pause'|'play'};
export function landmarkAnswer(p:LinePuzzle,answer:string){return [p.name,...p.aliases].some(x=>normalized(x)===normalized(answer));}
export function strokeScore(revealed:number,total:number,mistakes:number,hints:number){const fraction=Math.max(0,revealed-1)/Math.max(1,total-1);return Math.max(0,Math.round(100-90*fraction-3*mistakes-10*hints));}
export function validateLine(p:LinePuzzle){const errors:string[]=[];if(!p.landmarkId||!p.name||!Number.isInteger(p.total)||p.total<5||p.total>100||!p.country||!p.continent||!p.sources.length||p.sources.some(s=>!s.startsWith('https://'))||!p.facts.length)errors.push('Incomplete illustrated landmark.');if([p.name,...p.aliases].some(x=>normalized(x).length<4))errors.push('Alias is too broad.');return validation(errors,null,'Hand-authored ordered SVG strokes and source-backed metadata; complete illustrations reviewed as a contact sheet.');}
