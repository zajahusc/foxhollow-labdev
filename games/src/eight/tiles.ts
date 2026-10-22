import {rng,shuffled,validation} from './common.js';
import type {Meta,Level} from './common.js';
export interface TilePuzzle extends Meta{game:'tiletheory';size:number;givens:number[];solution:number[];constellation:number[]}
export const tileNames=['Circle · blue','Square · coral','Triangle · gold','Diamond · green','Star · violet','Hexagon · teal'];
export const tileGlyphs=['●','■','▲','◆','★','⬢'];
export function tileGroups(p:Pick<TilePuzzle,'size'|'constellation'>):number[][]{const n=p.size;return [...Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>r*n+c)),...Array.from({length:n},(_,c)=>Array.from({length:n},(_,r)=>r*n+c)),p.constellation];}
export function allowedTiles(p:TilePuzzle,board:number[],cell:number):number[]{if(p.givens[cell])return[p.givens[cell]!];const blocked=new Set(tileGroups(p).filter(g=>g.includes(cell)).flatMap(g=>g.filter(i=>i!==cell).map(i=>board[i]!)));return Array.from({length:p.size},(_,i)=>i+1).filter(v=>!blocked.has(v));}
export function tileConflicts(p:TilePuzzle,board:number[]):number[]{return [...new Set(tileGroups(p).flatMap(g=>g.filter(i=>board[i]!==0&&g.some(j=>j!==i&&board[i]===board[j]))))];}
export function solveTiles(p:TilePuzzle,initial=p.givens,cap=2):number[][]{
 const results:number[][]=[],board=[...initial];if(tileConflicts(p,board).length||p.givens.some((v,i)=>v!==0&&v!==board[i]))return[];
 function visit(){if(results.length>=cap)return;let cell=-1,values:number[]=[];for(let i=0;i<board.length;i++)if(!board[i]){const options=allowedTiles(p,board,i);if(!options.length)return;if(cell<0||options.length<values.length){cell=i;values=options;if(options.length===1)break;}}if(cell<0){results.push([...board]);return;}for(const value of values){board[cell]=value;visit();if(results.length>=cap)break;}board[cell]=0;}visit();return results;
}
export function singleSolve(p:TilePuzzle):boolean{
 const board=[...p.givens];let changed=true;while(changed){changed=false;for(let i=0;i<board.length;i++)if(!board[i]){const values=allowedTiles(p,board,i);if(values.length===1){board[i]=values[0]!;changed=true;}}
  for(const group of tileGroups(p))for(let v=1;v<=p.size;v++){if(group.some(i=>board[i]===v))continue;const options=group.filter(i=>!board[i]&&allowedTiles(p,board,i).includes(v));if(options.length===1){board[options[0]!]=v;changed=true;}}
 }return board.every(v=>v!==0)&&tileConflicts(p,board).length===0;
}
export function makeTiles(level:Level,seed:string):TilePuzzle{
 const random=rng(seed),size=[3,4,4,5,6][level-1]!,rows=shuffled(Array.from({length:size},(_,i)=>i),random),cols=shuffled([...rows],random),symbols=shuffled(rows.map(i=>i+1),random);
 const solution=rows.flatMap(r=>cols.map(c=>symbols[(r+c)%size]!)),constellation:number[]=[];
 for(let v=1;v<=size;v++)constellation.push(shuffled(solution.map((x,i)=>x===v?i:-1).filter(i=>i>=0),random)[0]!);
 const p:TilePuzzle={id:`tiles-v1-${seed}`,game:'tiletheory',version:1,level,size,givens:[...solution],solution,constellation};
 const minimum=Math.ceil(size*size*([.5,.42,.32,.28,.23][level-1]!));
 for(const cell of shuffled(solution.map((_,i)=>i),random)){if(p.givens.filter(Boolean).length<=minimum)break;const value=p.givens[cell]!;p.givens[cell]=0;if(!singleSolve(p)||solveTiles(p).length!==1)p.givens[cell]=value;}
 return p;
}
export function tileAnswer(p:TilePuzzle,board:number[]):boolean{return board.length===p.size*p.size&&board.every(v=>v>=1&&v<=p.size)&&p.givens.every((v,i)=>v===0||v===board[i])&&tileConflicts(p,board).length===0;}
export function validateTiles(p:TilePuzzle){const solutions=solveTiles(p),errors:string[]=[];if(solutions.length!==1||!tileAnswer(p,p.solution))errors.push('Grid must have exactly one valid completion.');if(!singleSolve(p))errors.push('Grid cannot be solved by the published single-placement deduction rules.');return validation(errors,solutions.length,'Exhaustive MRV constraint solver plus a separate naked/hidden single deduction pass.');}
