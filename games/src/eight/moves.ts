import {rng,shuffled,validation} from './common.js';
import type {Meta,Level} from './common.js';
export type Move={kind:'row'|'column'|'reflectRow'|'reflectColumn';index:number}|{kind:'swap'|'slide';a:number;b:number}|{kind:'rotate'};
export interface MovePuzzle extends Meta{game:'missingmove';size:number;before:number[];target:number[];operations:Move[];solution:number[];optimal:number;limit:number}
export function applyMove(board:readonly number[],size:number,move:Move):number[]{const out=[...board];const copy=(indices:number[],source:number[])=>indices.forEach((idx,i)=>out[idx]=board[source[i]!]!);
 switch(move.kind){case'row':{const row=Array.from({length:size},(_,i)=>move.index*size+i);copy(row,[row[size-1]!,...row.slice(0,-1)]);break;}case'column':{const col=Array.from({length:size},(_,i)=>i*size+move.index);copy(col,[col[size-1]!,...col.slice(0,-1)]);break;}case'reflectRow':{const row=Array.from({length:size},(_,i)=>move.index*size+i);copy(row,[...row].reverse());break;}case'reflectColumn':{const col=Array.from({length:size},(_,i)=>i*size+move.index);copy(col,[...col].reverse());break;}case'rotate':for(let r=0;r<size;r++)for(let c=0;c<size;c++)out[c*size+size-1-r]=board[r*size+c]!;break;case'swap':[out[move.a],out[move.b]]=[out[move.b]!,out[move.a]!];break;case'slide':if(board[move.b]===0&&Math.abs(Math.floor(move.a/size)-Math.floor(move.b/size))+Math.abs(move.a%size-move.b%size)===1)[out[move.a],out[move.b]]=[out[move.b]!,out[move.a]!];break;}
 return out;
}
export function moveText(m:Move):string{switch(m.kind){case'row':return `Row ${m.index+1} → one place (wrap)`;case'column':return `Column ${m.index+1} ↓ one place (wrap)`;case'reflectRow':return `Reverse row ${m.index+1}`;case'reflectColumn':return `Reverse column ${m.index+1}`;case'rotate':return 'Rotate board 90° clockwise';case'swap':return `Swap cells ${m.a+1} and ${m.b+1}`;case'slide':return `Slide cell ${m.a+1} into empty cell ${m.b+1}`;}}
export const sameBoard=(a:readonly number[],b:readonly number[])=>a.length===b.length&&a.every((v,i)=>v===b[i]);
export function shortestMoves(p:Pick<MovePuzzle,'before'|'target'|'operations'|'size'|'limit'>):number[]|null{
 const queue:{board:number[];path:number[]}[]=[{board:p.before,path:[]}],seen=new Set([p.before.join(',')]);
 for(let i=0;i<queue.length;i++){const item=queue[i]!;if(sameBoard(item.board,p.target))return item.path;if(item.path.length===p.limit)continue;for(let j=0;j<p.operations.length;j++){const board=applyMove(item.board,p.size,p.operations[j]!),key=board.join(',');if(seen.has(key))continue;seen.add(key);queue.push({board,path:[...item.path,j]});}}
 return null;
}
export function makeMove(level:Level,seed:string):MovePuzzle{
 const random=rng(seed),size=[3,3,4,4,5][level-1]!,depth=level;
 for(let attempt=0;attempt<100;attempt++){
  const before=shuffled(Array.from({length:size*size},(_,i)=>i),random),all:Move[]=[{kind:'rotate'}];
  for(let i=0;i<size;i++)all.push({kind:'row',index:i},{kind:'column',index:i},{kind:'reflectRow',index:i},{kind:'reflectColumn',index:i});
  const blank=before.indexOf(0);for(let a=0;a<before.length;a++)if(Math.abs(Math.floor(a/size)-Math.floor(blank/size))+Math.abs(a%size-blank%size)===1)all.push({kind:'slide',a,b:blank});
  all.push({kind:'swap',a:0,b:size*size-1},{kind:'swap',a:size-1,b:size*(size-1)});
  const operations=shuffled(all,random).slice(0,level>=4?5:4),sequence=Array.from({length:depth},()=>Math.floor(random()*operations.length));let target=before;
  for(const i of sequence)target=applyMove(target,size,operations[i]!);
  const base={before,target,operations,size,limit:depth},solution=shortestMoves(base);if(solution?.length!==depth)continue;
  return {...base,limit:depth+1,id:`moves-v1-${seed}`,game:'missingmove',version:1,level,optimal:depth,solution};
 }
 throw Error('Could not construct the requested transformation distance.');
}
export function moveAnswer(p:MovePuzzle,board:number[],moves:number){return moves<=p.limit&&sameBoard(board,p.target);}
export function validateMove(p:MovePuzzle){const path=shortestMoves(p),errors:string[]=[];if(!path||path.length!==p.optimal||p.optimal===0||p.limit<p.optimal)errors.push('Published shortest path is invalid.');return validation(errors,path?1:0,'Breadth-first search over the complete published operation palette; any path to the target within the limit is accepted.');}
