import {shuffle} from '../data.js';
import {dictionary,dictionaryVersion} from './dictionary.js';
import type {Level} from '../types.js';
import type {Slot,SolveResult,WeaveMode,WeavePuzzle,WeaveSession} from './types.js';
const words=new Set(dictionary);
const byLength=new Map<number,string[]>();for(const w of dictionary)byLength.set(w.length,[...(byLength.get(w.length)||[]),w]);
const patternCache=new Map<string,string[]>();
export function slots(layout:string,size:number):Slot[]{
 if(layout.length!==size*size)throw Error('Grid dimensions disagree');
 const out:Slot[]=[];
 for(const direction of ['across','down']as const)for(let major=0;major<size;major++){
  let run:number[]=[];
  const end=()=>{if(run.length>=2)out.push({id:`${direction}-${out.length}`,cells:run,direction});run=[];};
  for(let minor=0;minor<size;minor++){const at=direction==='across'?major*size+minor:minor*size+major;if(layout[at]==='#')end();else run.push(at);}end();
 }
 return out;
}
function candidates(pattern:string):string[]{
 const cached=patternCache.get(pattern);if(cached)return cached;
 const c=(byLength.get(pattern.length)||[]).filter(w=>[...pattern].every((x,i)=>x==='.'||w[i]===x));
 if(patternCache.size>10000)patternCache.clear();patternCache.set(pattern,c);return c;
}
export function counts(letters:string):Record<string,number>{const result:Record<string,number>={};for(const c of letters)if(/[a-z]/.test(c))result[c]=(result[c]||0)+1;return result;}
function fitsInventory(p:WeavePuzzle,letters:string):boolean {
 if(p.inventory===null)return true;const used=counts([...letters].filter((_,i)=>p.givens[i]==='.').join('')),available=counts(p.inventory);
 return Object.entries(used).every(([c,n])=>n<=(available[c]||0));
}
export function solve(p:WeavePuzzle,entry=p.givens,limit=2,budget=200000,seed=''):SolveResult{
 const positions=slots(p.layout,p.size),solutions:string[]=[];let nodes=0,exhausted=true;
 if(entry.length!==p.layout.length)return {solutions:[],nodes:0,exhausted:true};
 const initial=[...entry];for(let i=0;i<initial.length;i++){if(p.layout[i]==='#'){if(initial[i]!=='#')return {solutions:[],nodes:0,exhausted:true};}else if(!/^[a-z.]$/.test(initial[i]!))return {solutions:[],nodes:0,exhausted:true};if(p.givens[i]!=='.'&&p.givens[i]!==initial[i])return {solutions:[],nodes:0,exhausted:true};}
 if(!fitsInventory(p,entry))return {solutions:[],nodes:0,exhausted:true};
 function search(board:string){
  if(solutions.length>=limit){exhausted=false;return;}if(++nodes>budget){exhausted=false;return;}
  const domains=positions.map(slot=>({slot,pattern:slot.cells.map(i=>board[i]).join('')}));
  const completed=domains.filter(x=>!x.pattern.includes('.')).map(x=>x.pattern);
  if(completed.some(w=>!words.has(w))||p.constraints.noRepeat&&new Set(completed).size!==completed.length||!fitsInventory(p,board))return;
  let chosen:{slot:Slot;values:string[]}|null=null;
  for(const {slot,pattern}of domains){
   if(!pattern.includes('.'))continue;
   const values=candidates(pattern).filter(w=>!p.constraints.noRepeat||!completed.includes(w));
   if(!values.length)return;if(!chosen||values.length<chosen.values.length)chosen={slot,values};
  }
  if(!chosen){if(!board.includes('.')&&!solutions.includes(board))solutions.push(board);return;}
  const ordered=seed?shuffle(chosen.values,seed+board):chosen.values;
  for(const w of ordered){const next=[...board];chosen.slot.cells.forEach((cell,i)=>next[cell]=w[i]!);
   // Forward checking: intersecting slots must retain at least one compatible dictionary entry.
   const text=next.join('');if(!fitsInventory(p,text))continue;
   if(positions.some(s=>!candidates(s.cells.map(i=>text[i]).join('')).length))continue;
   search(text);if(solutions.length>=limit||nodes>budget){exhausted=false;return;}
  }
 }
 search(entry);return {solutions,nodes,exhausted};
}
export function checkGrid(p:WeavePuzzle,letters:string,requireComplete=true):string[]{
 const issues:string[]=[];if(letters.length!==p.layout.length)return ['Grid has the wrong size.'];
 if([...p.givens].some((c,i)=>c!=='.'&&letters[i]!==c))issues.push('A fixed cell was changed.');
 if(requireComplete&&letters.includes('.'))issues.push('Fill every open cell.');
 const runs=slots(p.layout,p.size),complete:string[]=[];
 for(const [i,s]of runs.entries()){const w=s.cells.map(n=>letters[n]).join('');if(!w.includes('.')){complete.push(w);if(!words.has(w))issues.push(`${s.direction} run ${i+1}: ${w.toUpperCase()} is outside the puzzle dictionary.`);}}
 if(p.constraints.noRepeat&&new Set(complete).size!==complete.length)issues.push('Repeated words are not permitted.');
 if(!fitsInventory(p,letters))issues.push('The supplied letter inventory is exceeded.');
 if(requireComplete&&p.inventory!==null&&JSON.stringify(Object.entries(counts([...letters].filter((_,i)=>p.givens[i]==='.').join(''))).sort())!==JSON.stringify(Object.entries(counts(p.inventory)).sort()))issues.push('Use every supplied letter exactly once.');
 return issues;
}
export function validateWeave(p:WeavePuzzle,prove=true):string[]{
 const issues:string[]=[];
 if(p.dictionary!==dictionaryVersion||p.layout.length!==p.size*p.size||!['square','cross','letter','free'].includes(p.mode))issues.push('Invalid dictionary or layout version.');
 const covered=new Set(slots(p.layout,p.size).flatMap(s=>s.cells));if([...p.layout].some((c,i)=>c!=='#'&&!covered.has(i)))issues.push('An open cell belongs to no word.');
 issues.push(...checkGrid(p,p.solution));
 const fullWord=slots(p.layout,p.size).some(s=>s.direction==='across'&&s.cells.every(i=>/[a-z]/.test(p.givens[i]!)));if(!fullWord)issues.push('A complete starting word is required.');
 if(p.unique&&prove){const result=solve(p);if(result.solutions.length!==1||!result.exhausted||result.solutions[0]!==p.solution)issues.push('Unique completion has not been proven.');}
 return issues;
}
export function makeWeave(size:number,mode:WeaveMode,level:Level,seed:string):WeavePuzzle{
 if(![3,4,5].includes(size))throw Error('Supported grid sizes are 3, 4 and 5.');
 if(mode==='cross'&&size!==5)throw Error('Cross Weave uses 5×5 to keep every run at least three letters long.');
 const layout=Array.from({length:size*size},(_,i)=>mode==='cross'&&size>=4&&[0,size-1,size*(size-1),size*size-1].includes(i)?'#':'.').join('');
 const p:WeavePuzzle={id:`weave-v1-${seed}`,level,size,mode,layout,givens:layout,solution:'',inventory:null,dictionary:dictionaryVersion,unique:mode!=='free',searchNodes:0,constraints:{noRepeat:false},estimated:true};
 const first=solve(p,p.givens,1,100000,seed);if(!first.solutions[0])throw Error('No verified grid found within the search budget. Try another size or mode.');p.solution=first.solutions[0];
 const starting=slots(layout,size).find(s=>s.direction==='across')!;const givens=[...layout];starting.cells.forEach(i=>givens[i]=p.solution[i]!);p.givens=givens.join('');
 if(mode==='letter')p.inventory=[...p.solution].filter((_,i)=>p.givens[i]==='.').sort().join('');
 if(mode==='free')return p;
 const order=shuffle([...p.solution].map((_,i)=>i).filter(i=>p.givens[i]==='.'),seed+'-clues');
 for(let tries=0;tries<=order.length;tries++){
  const result=solve(p);p.searchNodes+=result.nodes;
  if(result.solutions.length===1&&result.exhausted){p.solution=result.solutions[0]!;break;}
  const cell=order[tries];if(cell===undefined)throw Error('Uniqueness could not be proven.');givens[cell]=p.solution[cell]!;p.givens=givens.join('');
  if(mode==='letter')p.inventory=[...p.solution].filter((_,i)=>p.givens[i]==='.').sort().join('');
 }
 // Remove redundant clues; a verified grid with every letter given is not a useful puzzle.
 for(const cell of order){
  if(p.givens[cell]==='.')continue;const saved=p.givens;givens[cell]='.';p.givens=givens.join('');
  if(mode==='letter')p.inventory=[...p.solution].filter((_,i)=>p.givens[i]==='.').sort().join('');
  const check=solve(p);p.searchNodes+=check.nodes;
  if(check.solutions.length!==1||!check.exhausted){p.givens=saved;givens[cell]=p.solution[cell]!;}
 }
 // Easier settings supply additional fixed letters, while keeping the same verified rules.
 const extra=level===1?Math.max(0,size-1):level===2?1:0;
 let added=0;for(const i of order){if(p.givens[i]==='.'&&added<extra&&[...p.givens].filter(c=>c==='.').length>3){givens[i]=p.solution[i]!;p.givens=givens.join('');added++;}}
 if(mode==='letter')p.inventory=[...p.solution].filter((_,i)=>p.givens[i]==='.').sort().join('');
 const errors=validateWeave(p);if(errors.length)throw Error(errors.join(' '));return p;
}
export function editCell(s:WeaveSession,cell:number,raw:string):WeaveSession{
 if(s.phase!=='playing'||s.puzzle.givens[cell]!=='.'||s.hintLetters[cell])return s;
 const c=raw.toLowerCase().replace(/[^a-z]/g,'').slice(-1),letters=[...s.letters],notes={...s.notes};
 if(s.pencil){if(!c)delete notes[cell];else notes[cell]=(notes[cell]||'').includes(c)?notes[cell]!.replace(c,''):[...(notes[cell]||''),c].sort().join('');}
 else{letters[cell]=c||'.';delete notes[cell];if(!fitsInventory(s.puzzle,letters.join('')))return s;}
 return {...s,letters:letters.join(''),notes,past:[...s.past,{letters:s.letters,notes:s.notes}].slice(-150),future:[]};
}
export function undo(s:WeaveSession):WeaveSession{const before=s.past.at(-1);return s.phase==='playing'&&before?{...s,...before,past:s.past.slice(0,-1),future:[{letters:s.letters,notes:s.notes},...s.future]}:s;}
export function redo(s:WeaveSession):WeaveSession{const after=s.future[0];return s.phase==='playing'&&after?{...s,...after,past:[...s.past,{letters:s.letters,notes:s.notes}],future:s.future.slice(1)}:s;}
export function weaveScore(s:WeaveSession):number{const base=[300,500,750,1000,1500][s.level-1]!;return Math.max(0,Math.round(base*(1-s.hintsByType[0]*.05-s.hintsByType[1]*.1-s.hintsByType[2]*.2-s.mistakes*.05+(!s.hints?.1:0)+(!s.mistakes?.1:0))));}
export function submitWeave(s:WeaveSession):{session:WeaveSession;issues:string[]}{
 if(s.phase!=='playing')return {session:s,issues:[]};const issues=checkGrid(s.puzzle,s.letters);
 if(!issues.length&&s.puzzle.unique&&s.letters!==s.puzzle.solution)issues.push('This grid does not meet the published unique solution.');
 if(issues.length)return {session:{...s,mistakes:s.mistakes+1},issues};
 return {session:{...s,phase:'solved',score:weaveScore(s),finished:Date.now()},issues:[]};
}
export const dictionaryCandidates=(pattern:string)=>[...candidates(pattern)];
