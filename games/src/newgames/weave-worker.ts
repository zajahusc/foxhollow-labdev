import {checkGrid,makeWeave,solve} from './weave.js';
import type {Level} from '../types.js';
import type {WeaveMode,WeavePuzzle} from './types.js';
export type WeaveRequest={id:number;action:'solve'|'candidates';puzzle:WeavePuzzle;letters:string;cell:number}|{id:number;action:'generate';size:number;mode:WeaveMode;level:Level;seed:string};
export interface WorkerReply {id:number;error?:string;solutions?:string[];exhausted?:boolean;issues?:string[];letters?:string[];unknown?:string[];puzzle?:WeavePuzzle}
const scope=globalThis as unknown as {onmessage:((e:MessageEvent<WeaveRequest>)=>void)|null;postMessage:(r:WorkerReply)=>void};
scope.onmessage=({data})=>{
 try{
  if(data.action==='generate'){scope.postMessage({id:data.id,puzzle:makeWeave(data.size,data.mode,data.level,data.seed)});return;}
  if(data.action==='solve'){const r=solve(data.puzzle,data.letters);scope.postMessage({id:data.id,solutions:r.solutions,exhausted:r.exhausted,issues:checkGrid(data.puzzle,data.letters,false)});return;}
  const letters:string[]=[],unknown:string[]=[];
  if(data.puzzle.givens[data.cell]!=='.')throw Error('Choose an open editable cell.');
  for(const letter of 'abcdefghijklmnopqrstuvwxyz'){
   const board=[...data.letters];board[data.cell]=letter;const result=solve(data.puzzle,board.join(''),1,30000);
   if(result.solutions.length)letters.push(letter);else if(!result.exhausted)unknown.push(letter);
  }
  scope.postMessage({id:data.id,letters,unknown});
 }catch(e){scope.postMessage({id:data.id,error:e instanceof Error?e.message:'Solver could not finish.'});}
};
