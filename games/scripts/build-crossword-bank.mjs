import {writeFileSync} from 'node:fs';
import {makeCrossword,validateWeave} from '../build/newgames/weave.js';
const bank=[],seen=new Set();
for(let level=1;level<=5;level++){
 for(let n=0;n<250&&bank.filter(p=>p.level===level).length<20;n++){
  try{
   const pattern=level===1?n%2===0?0:3:level===2?n%4:n%2+1;
   const p=makeCrossword(level,`published-${level}-${n}`,pattern);
   if(seen.has(p.layout+p.solution))continue;
   const issues=validateWeave(p);if(issues.length)throw Error(issues.join('; '));
   seen.add(p.layout+p.solution);bank.push(p);
  }catch{/* Reject unsuccessful or ambiguous candidates. */}
 }
 console.log('Crosswords at level',level,bank.filter(p=>p.level===level).length);
}
writeFileSync(new URL('../src/newgames/crossword-bank.ts',import.meta.url),"import type {WeavePuzzle} from './types.js';\nexport const crosswordBank:WeavePuzzle[]="+JSON.stringify(bank)+';\n');
console.log(bank.length,'blank, source-clued, solver-verified crosswords');
