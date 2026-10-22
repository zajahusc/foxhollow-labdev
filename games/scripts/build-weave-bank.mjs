// Explicit content publication command; ordinary production builds never regenerate puzzles.
import {writeFileSync} from 'node:fs';
import {makeWeave,validateWeave} from '../build/newgames/weave.js';
const bank=[],seen=new Set();
for(let level=1;level<=5;level++){
 for(let n=0;n<300&&bank.filter(p=>p.level===level).length<20;n++){
  const mode=['square','letter','cross'][n%3],size=mode==='cross'?5:level===1?3:level<4?4:5;
  try{
   const p=makeWeave(size,mode,level,`published-${level}-${n}`);
   const fingerprint=p.layout+'|'+p.solution;
   if(seen.has(fingerprint)||[...p.givens].filter(c=>c==='.').length<3)continue;
   const errors=validateWeave(p);if(errors.length)throw Error(errors.join('; '));
   seen.add(fingerprint);bank.push(p);
  }catch(error){if(n%30===0)console.log('Candidate skipped:',error.message);}
 }
 console.log('Level',level,bank.filter(p=>p.level===level).length);
}
writeFileSync(new URL('../src/newgames/weave-bank.ts',import.meta.url),"import type {WeavePuzzle} from './types.js';\nexport const weaveBank:WeavePuzzle[]="+JSON.stringify(bank)+';\n');
console.log(bank.length,'unique, solver-verified grids published.');
