const key='foxhollow.daily-options.v1';
const memory:Record<string,boolean>={};
export function readHard(game:string):boolean{try{return JSON.parse(localStorage.getItem(key)||'{}')[game]===true;}catch{return memory[game]===true;}}
export function writeHard(game:string,hard:boolean){memory[game]=hard;try{const options=JSON.parse(localStorage.getItem(key)||'{}');localStorage.setItem(key,JSON.stringify({...options,[game]:hard}));}catch{/* Keep the preference for this visit. */}}
export const compactLegacyScore=(score:number)=>Math.min(100,Math.max(0,Math.round(score/10)));
export function migrateScores<T extends {scoreVersion?:2;daily:Record<string,{score:number}>;records:{score:number}[];practice:{score:number}|null}>(data:T,oldVersion:unknown):T{
 if(oldVersion!==2){for(const s of Object.values(data.daily))s.score=compactLegacyScore(s.score);if(data.practice)data.practice.score=compactLegacyScore(data.practice.score);for(const r of data.records)r.score=compactLegacyScore(r.score);}data.scoreVersion=2;return data;
}
