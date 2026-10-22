import { bank, generate, hash, normalize, shuffle, validatePuzzle } from './data.js';
import type { Category, Game, Level, Mode, Puzzle, RecordEntry, SavedData, Session, Statistics } from './types.js';
export const utcDay=(date=new Date())=>date.toISOString().slice(0,10);
export const previousDay=(day:string)=>utcDay(new Date(Date.parse(day+'T00:00:00Z')-86400000));
export const terminal=(s:Session)=>s.phase==='solved'||s.phase==='failed';
export function score(level:Level,mistakes:number,hints:number,won:boolean,ruleNamed=false):number {
 if(!won)return 0;
 const hintPenalty=[0,.1,.25,.45][Math.max(0,Math.min(3,hints))]!;
 return Math.max(0,Math.round(level*100*(1-.15*Math.max(0,mistakes)-hintPenalty+(ruleNamed?.25:0))));
}
export function session(puzzle:Puzzle, mode:Mode, day:string, serial:number, nameRule:boolean,maxMistakes:3|4|5=3):Session {
 const v=validatePuzzle(puzzle);if(!v.valid)throw Error(v.errors.join('; '));
 return {key:mode==='daily'?`daily:${day}`:`practice:${serial}`,puzzle,mode,day,phase:'playing',guesses:[],hints:0,selected:null,nameRule,ruleAnswer:null,score:0,maxMistakes,started:Date.now(),finished:null};
}
export function correct(p:Puzzle,answer:string):boolean {
 return p.game==='fourthword'?p.aliases.some(x=>normalize(x)===normalize(answer)):normalize(p.answer)===normalize(answer);
}
export function submit(current:Session, answer:string):Session {
 if(current.phase!=='playing'||!answer.trim())return current;
 const p=current.puzzle,clean=normalize(answer);
 if(current.guesses.some(g=>normalize(g)===clean))return current;
 if((p.game==='oddrule'&&!p.items.some(x=>normalize(x)===clean))||(p.game==='fourthword'&&p.answerMode==='choice'&&!p.choices.some(x=>normalize(x)===clean)))return current;
 const next={...current,guesses:[...current.guesses,answer.trim()],selected:null};
 if(correct(p,answer)) {
  if(p.game==='oddrule'&&current.nameRule)return {...next,phase:'naming'};
  return finish(next,true);
 }
 if(next.guesses.length>=next.maxMistakes)return finish(next,false);
 return next;
}
export function useHint(s:Session):Session {return s.phase==='playing'&&s.hints<3?{...s,hints:s.hints+1}:s;}
export function nameRule(s:Session,answer:string):Session {
 if(s.phase!=='naming'||s.puzzle.game!=='oddrule'||!s.puzzle.ruleChoices.includes(answer))return s;
 return finish({...s,ruleAnswer:answer},true);
}
export function finish(s:Session,won:boolean):Session {
 const named=s.ruleAnswer===s.puzzle.relationship;
 const mistakes=s.guesses.filter(x=>!correct(s.puzzle,x)).length+(s.ruleAnswer!==null&&!named?1:0);
 return {...s,phase:won?'solved':'failed',score:score(s.puzzle.level,mistakes,s.hints,won,named),finished:Date.now(),selected:null};
}
export function reveal(s:Session):Session { return terminal(s)?s:finish(s,false); }
export function record(s:Session):RecordEntry {
 if(!terminal(s))throw Error('Cannot record an unfinished puzzle');
 return {key:s.key,puzzleId:s.puzzle.id,mode:s.mode,day:s.day,level:s.puzzle.level,won:s.phase==='solved',guesses:s.guesses.length,hints:s.hints,score:s.score,
  seconds:Math.max(0,Math.round(((s.finished||s.started)-s.started)/1000)),ruleNamed:s.ruleAnswer===s.puzzle.relationship};
}
export function saveSession(data:SavedData,s:Session):SavedData {
 if(s.mode==='daily'&&data.daily[s.day]&&terminal(data.daily[s.day]!))return data;
 const records=[...data.records];if(terminal(s)&&!records.some(r=>r.key===s.key))records.push(record(s));
 return {...data,daily:s.mode==='daily'?{...data.daily,[s.day]:s}:data.daily,practice:s.mode==='practice'?s:data.practice,
  attempted:data.attempted.includes(s.key)?data.attempted:[...data.attempted,s.key], records,
  recent:terminal(s)?[s.puzzle.id,...data.recent.filter(id=>id!==s.puzzle.id)].slice(0,100):data.recent};
}
export function statistics(data:SavedData,today=utcDay()):Statistics {
 const r=data.records,wins=r.filter(x=>x.won),days=[...new Set(wins.filter(x=>x.mode==='daily').map(x=>x.day))].sort();
 let longest=0,run=0,previous='';for(const day of days){run=previousDay(day)===previous?run+1:1;longest=Math.max(longest,run);previous=day;}
 let streak=0,day=days.includes(today)?today:previousDay(today);while(days.includes(day)){streak++;day=previousDay(day);}
 const points=r.reduce((n,x)=>n+x.score,0),avg=(f:(x:RecordEntry)=>number)=>r.length?r.reduce((n,x)=>n+f(x),0)/r.length:0;
 return {attempted:data.attempted.length,completed:r.length,winRate:r.length?wins.length/r.length*100:0,streak,longest,
  averageGuesses:avg(x=>x.guesses),averageHints:avg(x=>x.hints),totalPoints:points,averageScore:avg(x=>x.score),best:Math.max(0,...r.map(x=>x.score)),
  byLevel:([1,2,3,4,5]as Level[]).map(level=>({level,played:r.filter(x=>x.level===level).length,wins:wins.filter(x=>x.level===level).length,points:r.filter(x=>x.level===level).reduce((n,x)=>n+x.score,0)}))};
}
function freshGenerated(game:Game,level:Level,seed:string,recent:string[]):Puzzle {
 for(let retry=0;retry<102;retry++){
  const p=generate(game,level,retry?`${seed}-retry-${retry}`:seed);
  if(!recent.includes(p.id))return p;
 }
 throw Error('Could not find a fresh puzzle. Please try again.');
}
export function practicePuzzle(game:Game,level:Level|0,category:Category|'Any',recent:string[],seed:string):Puzzle {
 const pool=shuffle(bank.filter(p=>p.game===game&&(!level||p.level===level)&&(category==='Any'||p.category===category)),seed);
 const fresh=pool.find(p=>!recent.includes(p.id));
 if(category==='Numbers'||category==='Any'&&hash(seed)%2===0)return freshGenerated(game,level||(([1,2,3,4,5]as Level[])[hash(seed+'difficulty')%5]!),seed,recent);
 if(fresh)return fresh;
 if(category==='Any'){
  const target=level||([1,2,3,4,5]as Level[])[Math.floor(shuffle([0,1,2,3,4],seed)[0]!)]!;
  return freshGenerated(game,target,seed,recent);
 }
 // A finite curated language bank cycles only after the selected pool has been exhausted.
 const next=pool.find(p=>p.id!==recent[0]);if(next)return next;
 throw Error('No puzzles match these filters. Try another category.');
}
export function share(s:Session,spoilers=false):string {
 const title=s.puzzle.game==='fourthword'?'THE FOURTH THING':'THE ODD RULE';
 const result=s.phase==='solved'?`Solved in ${s.guesses.length} ${s.guesses.length===1?'guess':'guesses'}`:'Revealed · 0 points';
 const marks=s.guesses.map(g=>correct(s.puzzle,g)?'◆':'○').join(' ');
 return `${title} · ${s.mode==='daily'?s.day:'Practice'}\nLevel ${s.puzzle.level} · ${result}\nHints: ${s.hints}/3 · Score: ${s.score}${s.nameRule&&s.puzzle.game==='oddrule'?`\nRule identified: ${s.ruleAnswer===s.puzzle.relationship?'yes':'no'}`:''}\n${marks||'◇'}${spoilers?`\nAnswer: ${s.puzzle.answer}\n${s.puzzle.relationship}`:''}\nhttps://foxhollowlabs.dev/${s.puzzle.game}/`;
}
