import {rng,shuffled,permutations,validation} from './common.js';
import type {Meta,Level} from './common.js';
export interface World{order:number[];offset:number}
export type Fact={kind:'before'|'adjacent';a:number;b:number}|{kind:'at'|'notAt';a:number;slot:number}|{kind:'owns';a:number;item:number};
export interface Testimony{person:number;facts:Fact[]}
export interface AlibiPuzzle extends Meta{game:'alibi';names:string[];category:string;scenario:string;slots:string[];objects:string[];rotation:boolean;statements:Testimony[];evidence:Fact[];solution:World;liar:number}
export const factTrue=(f:Fact,w:World):boolean=>{const a=w.order.indexOf(f.a);switch(f.kind){case'before':return a<w.order.indexOf(f.b);case'adjacent':return Math.abs(a-w.order.indexOf(f.b))===1;case'at':return a===f.slot;case'notAt':return a!==f.slot;case'owns':return (a+w.offset)%w.order.length===f.item;}};
export const statementTrue=(s:Testimony,w:World)=>s.facts.every(f=>factTrue(f,w));
export function factText(f:Fact,p:AlibiPuzzle):string{switch(f.kind){case'before':return `${p.names[f.a]} is earlier in the listed order than ${p.names[f.b]}`;case'adjacent':return `${p.names[f.a]} is immediately beside ${p.names[f.b]} in the listed order`;case'at':return `${p.names[f.a]} is in ${p.slots[f.slot]}`;case'notAt':return `${p.names[f.a]} is not in ${p.slots[f.slot]}`;case'owns':return `${p.names[f.a]} has the ${p.objects[f.item]} badge`;}}
export function allWorlds(p:Pick<AlibiPuzzle,'names'|'rotation'>):World[]{const a=permutations(p.names.map((_,i)=>i));return a.flatMap(order=>Array.from({length:p.rotation?p.names.length:1},(_,offset)=>({order,offset})));}
export function solveAlibi(p:AlibiPuzzle):World[]{return allWorlds(p).filter(w=>p.evidence.every(f=>factTrue(f,w))&&p.statements.filter(s=>!statementTrue(s,w)).length===1);}
export function makeAlibi(level:Level,seed:string):AlibiPuzzle{
 const random=rng(seed),n=[3,4,5,6,6][level-1]!,rotation=level>=4;
 const names=shuffled(['Ada','Ben','Cleo','Dev','Ellis','Fran','Gus','Hana'],random).slice(0,n),category=shuffled(['Arrival order','Gallery locations','Object lockers','Reading-room seats','Workshop schedule','Missing-item search','Occupation interviews','Train timeline'],random)[0]!;
 const setting:Record<string,[string,string]>={'Arrival order':['arrival','The studio arrival log is missing. Each visitor recalls part of the order. Reconstruct the log and identify the false testimony.'],'Gallery locations':['gallery post','The gallery map lost its staff labels. Each guide occupied one numbered post, ordered left to right. Restore the assignments and find the false testimony.'],'Object lockers':['locker','Each visitor left a notebook in one numbered locker. Each locker belongs to one visitor. Reconstruct the assignments from their statements.'],'Reading-room seats':['seat','A reading room has numbered seats, ordered left to right. Every reader occupied a different seat. Restore the seating plan and identify the false testimony.'],'Workshop schedule':['appointment','Each participant had one distinct numbered appointment, earliest to latest. Reconstruct the workshop schedule from their conflicting accounts.'],'Missing-item search':['search stop','A search log has numbered stops, first to last. Each person checked one different stop. Restore the assignments and find the false account.'],'Occupation interviews':['interview','A careers team lost the order of its numbered interviews, first to last. Each candidate had one slot. Rebuild the order and identify the false testimony.'],'Train timeline':['check-in','A station check-in log lost its passenger names. Each passenger has one numbered check-in, earliest to latest. Restore the timeline and find the false statement.']};
 const [slotName,scenario]=setting[category]!;
 const slots=Array.from({length:n},(_,i)=>`${slotName} ${i+1}`),objects=['amber','blue','coral','green','violet','white'].slice(0,n);
 const solution={order:shuffled(names.map((_,i)=>i),random),offset:rotation?Math.floor(random()*n):0},liar=Math.floor(random()*n),facts:Fact[]=[];
 for(let a=0;a<n;a++){for(let b=0;b<n;b++)if(a!==b)facts.push({kind:'before',a,b},{kind:'adjacent',a,b});for(let slot=0;slot<n;slot++)facts.push({kind:'at',a,slot},{kind:'notAt',a,slot});if(rotation)for(let item=0;item<n;item++)facts.push({kind:'owns',a,item});}
 const truth=shuffled(facts.filter(f=>factTrue(f,solution)),random),falsehood=shuffled(facts.filter(f=>!factTrue(f,solution)),random);
 const statements:Testimony[]=names.map((_,person)=>({person,facts:[person===liar?falsehood[person]! :truth[person]!,...(level>=3?[truth[person+n]!]:[])]}));
 const p:AlibiPuzzle={id:`alibi-v1-${seed}`,game:'alibi',version:1,level,names,category,scenario,slots,objects,rotation,statements,evidence:[],solution,liar};
 let worlds=allWorlds(p).filter(w=>p.statements.filter(s=>!statementTrue(s,w)).length===1);
 // Public evidence is chosen by actual elimination, rather than an invented narrative inference.
 while(worlds.length>1){let best:Fact|undefined,bestWorlds=worlds;for(const f of truth){if(p.evidence.includes(f))continue;const next=worlds.filter(w=>factTrue(f,w));if(next.length<bestWorlds.length){best=f;bestWorlds=next;}}if(!best)throw Error('Could not distinguish worlds.');p.evidence.push(best);worlds=bestWorlds;}
 if(worlds.length!==1)throw Error('No consistent alibi.');
 for(let i=p.evidence.length-1;i>=0;i--){const f=p.evidence[i]!;p.evidence.splice(i,1);if(solveAlibi(p).length!==1)p.evidence.splice(i,0,f);}
 return p;
}
export function alibiAnswer(p:AlibiPuzzle,w:World,liar:number){return w.order.length===p.names.length&&new Set(w.order).size===p.names.length&&p.evidence.every(f=>factTrue(f,w))&&p.statements.filter(s=>!statementTrue(s,w)).length===1&&!statementTrue(p.statements[liar]!,w);}
export function validateAlibi(p:AlibiPuzzle){const worlds=solveAlibi(p),errors:string[]=[];if(worlds.length!==1||!alibiAnswer(p,p.solution,p.liar))errors.push('Exactly one arrangement and one false statement are required.');return validation(errors,worlds.length,'Exhaustive permutations plus every allowed badge rotation; conjunctions count as one testimony, false if any clause is false.');}
