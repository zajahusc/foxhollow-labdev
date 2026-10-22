import {lockDictionary} from './lock-dictionary.js';
export {lockDictionary} from './lock-dictionary.js';
import {rng,shuffled,validation} from './common.js';
import type {Meta,Level} from './common.js';
export type LockClue={kind:'at';index:number;letter:string}|{kind:'vowels';count:number}|{kind:'contains'|'excludes';letter:string}|{kind:'distinct';count:number}|{kind:'frequency';letter:string;count:number}|{kind:'vowelAt';index:number;yes:boolean}|{kind:'adjacentVowels';yes:boolean}|{kind:'alphabet';index:number;after:boolean};
export interface LockPuzzle extends Meta{game:'lexiconlock';word:string;dictionary:'fox-crossword-wordnet-v2';clues:LockClue[];diagnostic:number[]}
const vowel=(c:string)=>'aeiou'.includes(c);
export function fits(word:string,c:LockClue):boolean{
 switch(c.kind){case'at':return word[c.index]===c.letter;case'vowels':return [...word].filter(vowel).length===c.count;case'contains':return word.includes(c.letter);case'excludes':return !word.includes(c.letter);case'distinct':return new Set(word).size===c.count;case'frequency':return [...word].filter(x=>x===c.letter).length===c.count;case'vowelAt':return vowel(word[c.index]!)===c.yes;case'adjacentVowels':return /[aeiou]{2}/.test(word)===c.yes;case'alphabet':return (word.charCodeAt(c.index)>109)===c.after;}
}
export function clueText(c:LockClue):string{switch(c.kind){case'at':return `Letter ${c.index+1} is ${c.letter.toUpperCase()}.`;case'vowels':return `Exactly ${c.count} vowels (A, E, I, O, U).`;case'contains':return `Contains ${c.letter.toUpperCase()}.`;case'excludes':return `Does not contain ${c.letter.toUpperCase()}.`;case'distinct':return `${c.count} distinct letters${c.count===1?'':' in total'}.`;case'frequency':return `${c.letter.toUpperCase()} appears exactly ${c.count} times.`;case'vowelAt':return `Letter ${c.index+1} is ${c.yes?'a vowel':'a consonant'}.`;case'adjacentVowels':return c.yes?'Contains two consecutive vowels.':'No two vowels are consecutive.';case'alphabet':return `Letter ${c.index+1} is in ${c.after?'N–Z':'A–M'}.`;}}
export function lockCandidates(p:LockPuzzle,clues=p.clues){return lockDictionary.filter(w=>w.length===p.word.length&&clues.every(c=>fits(w,c)));}
export function makeLock(level:Level,seed:string):LockPuzzle{
 const random=rng(seed),length=[4,5,6,7,7][level-1]!,pool=lockDictionary.filter(w=>w.length===length);
 for(const word of shuffled(pool,random)){
  const candidates:LockClue[]=[{kind:'vowels',count:[...word].filter(vowel).length},{kind:'distinct',count:new Set(word).size},{kind:'adjacentVowels',yes:/[aeiou]{2}/.test(word)}];
  for(let i=0;i<length;i++)candidates.push({kind:'vowelAt',index:i,yes:vowel(word[i]!)},{kind:'alphabet',index:i,after:word.charCodeAt(i)>109});
  for(const letter of 'abcdefghijklmnopqrstuvwxyz')candidates.push(word.includes(letter)?{kind:'contains',letter}:{kind:'excludes',letter});
  for(const letter of new Set(word))if([...word].filter(x=>x===letter).length>1)candidates.push({kind:'frequency',letter,count:[...word].filter(x=>x===letter).length});
  const indirect=shuffled(candidates,random);const direct=shuffled([...word].map((letter,index):LockClue=>({kind:'at',index,letter})),random);
  const usable=(level<=2?[...direct.slice(0,level===1?2:1),...indirect,...direct]:[...indirect,...direct]).filter(c=>pool.filter(w=>fits(w,c)).length>1);
  let remaining=pool;const clues:LockClue[]=[];
  for(const c of usable){const next=remaining.filter(w=>fits(w,c));if(next.length<remaining.length){clues.push(c);remaining=next;}if(remaining.length===1)break;}
  if(remaining.length!==1||clues.length<2)continue;
  for(let i=clues.length-1;i>=0;i--){const rest=clues.filter((_,j)=>i!==j);if(rest.length>=2&&pool.filter(w=>rest.every(c=>fits(w,c))).length===1)clues.splice(i,1);}
  const diagnostic=clues.map((_,i)=>pool.filter(w=>clues.slice(0,i+1).every(c=>fits(w,c))).length);
  return {id:`lock-v1-${seed}`,game:'lexiconlock',version:1,level,word,dictionary:'fox-crossword-wordnet-v2',clues,diagnostic};
 }
 throw Error('Could not construct a unique word lock.');
}
export function validateLock(p:LockPuzzle){const errors:string[]=[];const c=lockCandidates(p);if(c.length!==1||c[0]!==p.word)errors.push('Clues must identify exactly the published word.');if(p.clues.length<2||p.clues.some(c=>lockDictionary.filter(w=>w.length===p.word.length&&fits(w,c)).length<2))errors.push('A single clue gives the answer.');return validation(errors,c.length,'Exhaustive filtering of the frozen 3,646-entry source dictionary; only 4–7 letter entries eligible.');}
export const lockAnswer=(p:LockPuzzle,answer:string)=>answer.trim().toLowerCase()===p.word;
