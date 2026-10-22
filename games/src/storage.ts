import {migrateScores} from './daily-options.js';
import { validatePuzzle } from './data.js';
import type { Game, RecordEntry, SavedData, Session } from './types.js';
export const key=(game:Game)=>`foxhollow.${game}.v1`;
export function empty():SavedData{return {version:1,scoreVersion:2,daily:{},practice:null,records:[],attempted:[],recent:[],practiceSerial:0,settings:{nameRule:false,theme:'system',maxMistakes:3},feedback:[]};}
const obj=(x:unknown):x is Record<string,unknown>=>typeof x==='object'&&x!==null&&!Array.isArray(x);
const strings=(x:unknown):x is string[]=>Array.isArray(x)&&x.every(t=>typeof t==='string');
const numeric=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x)&&x>=0;
function validSession(x:unknown):x is Session {
 if(!obj(x)||!obj(x.puzzle))return false;
 try{
  return typeof x.key==='string'&&(x.mode==='daily'||x.mode==='practice')&&typeof x.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.day)&&
   ['playing','naming','solved','failed'].includes(String(x.phase))&&strings(x.guesses)&&x.guesses.length<=5&&
   numeric(x.hints)&&Number.isInteger(x.hints)&&x.hints<=3&&numeric(x.score)&&numeric(x.started)&&
   (x.finished===null||numeric(x.finished))&&(x.selected===null||typeof x.selected==='string')&&
   typeof x.nameRule==='boolean'&&(x.ruleAnswer===null||typeof x.ruleAnswer==='string')&&[2,3,4,5].includes(Number(x.maxMistakes))&&
   (x.puzzle.game==='fourthword'||x.puzzle.game==='oddrule')&&validatePuzzle(x.puzzle as unknown as Session['puzzle']).valid;
 }catch{return false;}
}
const validRecord=(x:unknown):x is RecordEntry=>obj(x)&&typeof x.key==='string'&&typeof x.puzzleId==='string'&&(x.mode==='daily'||x.mode==='practice')&&typeof x.day==='string'&&[1,2,3,4,5].includes(Number(x.level))&&typeof x.won==='boolean'&&numeric(x.guesses)&&numeric(x.hints)&&numeric(x.score)&&numeric(x.seconds)&&typeof x.ruleNamed==='boolean';
export function deserialize(raw:string|null):SavedData {
 if(!raw)return empty();
 try{
  const x:unknown=JSON.parse(raw);if(!obj(x)||x.version!==1)return empty();
  const d=empty();
  if(obj(x.daily))for(const [day,s]of Object.entries(x.daily))if(validSession(s)&&s.mode==='daily'&&s.day===day)d.daily[day]=s;
  if(validSession(x.practice)&&x.practice.mode==='practice')d.practice=x.practice;
  if(Array.isArray(x.records)){const seen=new Set<string>();d.records=x.records.filter(validRecord).filter(r=>{if(seen.has(r.key))return false;seen.add(r.key);return true;});}
  if(strings(x.attempted))d.attempted=[...new Set(x.attempted)];
  if(strings(x.recent))d.recent=x.recent.slice(0,100);
  if(numeric(x.practiceSerial))d.practiceSerial=Math.floor(x.practiceSerial);
  if(obj(x.settings)){const s=x.settings;d.settings={nameRule:typeof s.nameRule==='boolean'?s.nameRule:false,theme:s.theme==='light'||s.theme==='dark'?s.theme:'system',maxMistakes:s.maxMistakes===4?4:s.maxMistakes===5?5:3};}
  if(Array.isArray(x.feedback))d.feedback=x.feedback.filter((v):v is SavedData['feedback'][number]=>obj(v)&&typeof v.puzzleId==='string'&&typeof v.reason==='string'&&typeof v.created==='string');
  return migrateScores(d,x.scoreVersion);
 }catch{return empty();}
}
export interface StorageAdapter {getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void;removeItem:(key:string)=>void}
export function load(game:Game,storage:Pick<StorageAdapter,'getItem'>):SavedData {try{return deserialize(storage.getItem(key(game)));}catch{return empty();}}
export function store(game:Game,data:SavedData,storage:Pick<StorageAdapter,'setItem'>):boolean {try{storage.setItem(key(game),JSON.stringify(data));return true;}catch{return false;}}
