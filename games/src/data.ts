import {published} from './published.js';
import { getRule, prime, rules } from './rules.js';
import type { Game, Level, OddPuzzle, Puzzle, Rule, Validation } from './types.js';
export const normalize = (s: string) => s.normalize('NFKC').trim().toLocaleLowerCase('en-US').replace(/\s+/g,' ');
export function hash(s: string): number { let h=2166136261; for(const c of s) h=Math.imul(h^c.charCodeAt(0),16777619); return h>>>0; }
export function random(seed: string): () => number { let a=hash(seed);return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;}; }
export function shuffle<T>(values: readonly T[], seed: string): T[] { const out=[...values],rng=random(seed);for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j]!,out[i]!];}return out; }
interface Material { id: string; yes: string[]; no: string[]; surface: string }
const m=(id:string, yes:string, no:string, surface='All six are ordinary words; the spelling supplies the difference.'): Material => ({id,yes:yes.split(' '),no:no.split(' '),surface});
export const materials: Material[] = [
 m('palindrome','level radar civic kayak rotor refer','river lover cable','All six are five-letter words; length alone cannot identify the outsider.'),
 m('double','coffee balloon ribbon rabbit butter letter','planet timber basket'),
 m('starts-vowel','apple orbit ember olive uncle inlet','peach berry grape'),
 m('ends-e','stone flame globe crane smile plate','bread cloud brush'),
 m('five','cloud bread chair plant river brush','garden bridge forest'),
 m('no-e','cloud chair mango tulip scarf violin','lemon peach melon'),
 m('isogram','planet bridge forest garden cloud timber','pepper banana letter'),
 m('three-vowels','banana tomato casino divide potato radio','ribbon planet timber'),
 m('same-ends','arena bulb civic kayak river roar','cabin lemon cloud'),
 m('abc','defiant hijack first thirsty understudy stucco','station thunder familiar'),
 m('alphabetical','almost begins chintz biopsy ghost abhors','planet garden silver'),
 m('descending','spied wrong trod spoke zoned toned','stone cloud bread'),
 m('only-e','cheese sleeve pepper tremble fence twelve','coffee planet orange'),
 m('hidden-one','money stone honey lonely honest clone','pepper ribbon coffee'),
 m('vowel-edges','area opera idea aloe igloo emu','cello peach oven'),
 m('alternating','banana tomato papaya potato casino divide','pencil basket garden'),
 m('top-row','typewriter perpetuity property priority quiet writer','printer keyboard screen'),
 m('roman','civil civic vivid mild mix dim','silk silkily wax'),
 m('vowels-ordered','facetious abstemious dangerous abstention anxious radio','education behaviour ambidextrous'),
 m('two-pairs','noon peep deed toot mama papa','tart tent door'),
 m('six-two-unique','planet bridge stream garden silver forest','letter pepper settle'),
 m('mirror-vowels','banana tomato deified redivider rotator leveler','cabbage treasure chocolate'),
 m('half-alphabet','black badge chalk flame climb claim','branch candle maple'),
 m('edge-sum','by boy dew draw goat ghost','day toy glow'),
 m('middle-vowel','plant crisp ghost flute shout truce','teeth level radar'),
 m('even','12 24 38 46 58 72','13 25 39','Every card is a two-digit integer; inspect divisibility.'),
 m('square','4 9 16 25 36 49','40 20 30','All six are positive integers; look for a multiplication property.'),
 m('prime','11 17 23 31 43 59','21 27 39','All six are odd two-digit numbers, so oddness is not the hidden rule.'),
 m('power-two','2 4 8 16 32 64','6 12 24','All cards are positive even numbers; that surface pattern is not enough.'),
 m('cube','8 27 64 125 216 343','81 49 144','All six are whole numbers; powers can have different exponents.'),
 m('triangular','3 6 10 15 21 28','12 20 30','All are positive integers; think of arrangements rather than digits.'),
 m('digit-nine','18 27 36 45 54 63','99 198 999','All six are divisible by nine; a stricter digit rule separates them.'),
 m('square-odd','9 25 49 81 121 169','64 36 100','All are perfect squares; there is a second condition.'),
 m('prime-reverse','13 17 31 37 71 73','19 23 29','All six are prime; reversing digits introduces another test.'),
 m('square-digit-square','9 36 81 100 144 169','49 25 16','All six are squares; now examine a quantity made from their digits.'),
];
// Static construction choices are stable: published IDs never depend on array length.
function base(r: Rule, game: Game, id: string, source: 'constructed'|'procedural') {
 return {id,version:1 as const,game,level:r.level,category:r.category,ruleId:r.id,relationship:r.title,hints:r.hints,
  explanation:r.reasoning,evidence:[] as string[],source,
  verification:{method:'deterministic' as const, notes:'Exact predicate applied to every clue and choice. Alternative-outsider scan covers all published rule predicates; this is not a proof against every conceivable natural-language rule.',ambiguity:'checked-in-rule-catalog' as const},
  created:'2026-10-21',estimatedSeconds:[20,40,75,120,180][r.level-1]!,observedDifficulty:null};
}
function ruleChoices(r: Rule, good: string[], seed: string): [string,string,string,string] {
 const other=shuffle(rules.filter(t=>(t.category==='Numbers')===(r.category==='Numbers') && t.id!==r.id && !good.every(x=>t.test(x))), seed).slice(0,3);
 if(other.length!==3)throw Error('Not enough checked rule distractors');
 return shuffle([r.title,...other.map(x=>x.title)],seed+'-rule') as [string,string,string,string];
}
export function construct(material: Material, game: Game, seed=material.id, source: 'constructed'|'procedural'='constructed'): Puzzle {
 const r=getRule(material.id), id=`${game}-${source==='procedural'?'generated-':''}${seed}`;
 const positives=source==='procedural'?shuffle(material.yes,seed):material.yes;
 const negatives=shuffle(material.no,seed);
 if(game==='fourthword') {
  const clues=positives.slice(0,3) as [string,string,string],answer=positives[3]!;
  const choices=shuffle([answer,...negatives.slice(0,3)],id) as [string,string,string,string];
  return {...base(r,game,id,source),game,clues,answer,choices,aliases:[answer],answerMode:'choice',
   constraint:'Choose the one option that shares the intended pattern with all three clues.',
   evidence:[...clues,answer].map(r.explain),distractorExplanations:choices.filter(x=>x!==answer).map(r.explain)};
 }
 const good=positives.slice(0,5),answer=negatives[0]!;
 const items=shuffle([...good,answer],id) as OddPuzzle['items'];
 return {...base(r,game,id,source),game,items,answer,ruleChoices:ruleChoices(r,good,id),
  decoy:material.surface,evidence:items.map(r.explain)};
}
export const bank: Puzzle[] = published;
// Typed answer mode uses explicit numerical constraints, rather than ambiguous broad word categories.
const sequenceSpecs: { id:string;level:Level; values:[number,number,number,number];instruction:string; explanation:string; wrong:[number,number,number] }[] = [
 {id:'constant-step',level:1,values:[14,21,28,35],instruction:'Each step adds the same amount. Continue the sequence.',explanation:'Each term is seven greater than the previous one.',wrong:[34,36,42]},
 {id:'doubling',level:2,values:[6,12,24,48],instruction:'Each step multiplies by the same positive factor. Continue the sequence.',explanation:'Every term doubles the previous one.',wrong:[36,46,60]},
 {id:'growing-step',level:3,values:[2,5,10,17],instruction:'The differences are consecutive odd numbers. Continue the sequence.',explanation:'The steps are +3, +5, +7, then +9.',wrong:[15,16,18]},
 {id:'multiply-add',level:4,values:[2,5,11,23],instruction:'Repeat the same operation: multiply by a fixed whole number, then add one.',explanation:'Multiply by two, then add one: 2 → 5 → 11 → 23.',wrong:[22,24,33]},
 {id:'second-difference',level:5,values:[3,8,18,38],instruction:'Successive positive differences double. Continue the sequence.',explanation:'The differences are 5, 10, then 20, so 18 + 20 = 38.',wrong:[28,36,40]},
];
export function validatePuzzle(p: Puzzle): Validation {
 const errors:string[]=[];
 if(!p.id || p.version!==1 || !Number.isInteger(p.level) || p.level<1 || p.level>5) errors.push('Invalid identity or difficulty');
 if(p.hints.length!==3 || p.hints.some(h=>!h.trim()) || !p.explanation || p.evidence.some(x=>!x))errors.push('Missing explanation or hints');
 if(p.verification.method!=='deterministic')errors.push('Unverified puzzle');
 if(p.game==='fourthword') {
  if(p.clues.length!==3 || new Set(p.clues).size!==3)errors.push('Requires three distinct clues');
  if(p.choices.length!==4 || new Set(p.choices.map(normalize)).size!==4 || !p.choices.includes(p.answer))errors.push('Requires four distinct choices including answer');
  if(!p.aliases.includes(p.answer) || p.aliases.some(a=>normalize(a)!==normalize(p.answer)))errors.push('Unapproved answer alias');
  if(p.ruleId.startsWith('sequence:')){
   const spec=sequenceSpecs.find(s=>`sequence:${s.id}`===p.ruleId);
   if(!spec || [...p.clues,p.answer].join('|')!==spec.values.join('|') || p.constraint!==spec.instruction || p.answerMode!=='text')errors.push('Invalid constrained sequence');
  } else {
   const r=getRule(p.ruleId);
   if(!p.clues.every(r.test) || !r.test(p.answer) || p.choices.filter(r.test).length!==1)errors.push('Invalid clue or distractor');
   if(p.answerMode!=='choice')errors.push('Broad relationships require choices');
   const conflicting=rules.filter(t=>(t.category==='Numbers')===(p.category==='Numbers') && t.id!==r.id && p.clues.every(t.test) && p.choices.filter(t.test).length===1 && !t.test(p.answer));
   if(conflicting.length)errors.push('Alternative completion: '+conflicting.map(t=>t.id).join(', '));
  }
 } else {
  const r=getRule(p.ruleId),good=p.items.filter(r.test);
  if(p.items.length!==6 || new Set(p.items.map(normalize)).size!==6 || !p.items.includes(p.answer))errors.push('Requires six distinct items');
  if(good.length!==5 || r.test(p.answer))errors.push('Must have exactly five matches');
  if(p.ruleChoices.length!==4 || new Set(p.ruleChoices).size!==4 || !p.ruleChoices.includes(r.title))errors.push('Invalid rule choices');
  if(p.ruleChoices.some(t=>t!==r.title && rules.find(x=>x.title===t)?.test && good.every(getRule(rules.find(x=>x.title===t)!.id).test)))errors.push('Ambiguous rule description');
  const alternatives=rules.filter(t=>(t.category==='Numbers')===(p.category==='Numbers') && p.items.filter(t.test).length===5 && t.test(p.answer));
  if(alternatives.length)errors.push('Alternative outsider: '+alternatives.map(t=>t.id).join(', '));
  if(p.evidence.length!==6)errors.push('Explain every item');
 }
 return {valid:errors.length===0,errors};
}
export function validateBank(puzzles: Puzzle[]): void {
 const ids=new Set<string>();for(const p of puzzles){if(ids.has(p.id))throw Error('Duplicate '+p.id);ids.add(p.id);const result=validatePuzzle(p);if(!result.valid)throw Error(`${p.id}: ${result.errors.join('; ')}`);}
}
// Generated practice uses numerical families: objectively checked, with a huge seeded search space.
export function generate(game: Game, level: Level, seed: string): Puzzle {
 const rng=random(seed), families=rules.filter(r=>r.category==='Numbers'&&r.level===level);
 for(let trial=0;trial<200;trial++){
  const r=families[Math.floor(rng()*families.length)]!;
  const limit=r.id==='prime-reverse'?9999:r.id==='cube'?50000:r.id==='square-digit-square'?50000:r.id==='power-two'?16384:level===1?144:5000;
  const yes:string[]=[],no:string[]=[];
  const candidates=shuffle(Array.from({length:limit},(_,i)=>String(i+2)),seed+trial);
  for(const s of candidates){if(r.test(s)){if(yes.length<8)yes.push(s);}else if(no.length<5){const n=Number(s);const decoy=r.id==='prime-reverse'?prime(n):r.id==='square-odd'||r.id==='square-digit-square'?Number.isInteger(Math.sqrt(n)):r.id==='digit-nine'?n%9===0:r.id==='power-two'?n%2===0:true;if(decoy)no.push(s);}if(yes.length===8&&no.length===5)break;}
  if(yes.length<5)continue;
  const p=construct({id:r.id,yes,no,surface:'All cards are positive integers. Focus on the stated numbers lens; a second property may be hiding underneath.'},game,`${level}-${seed}-${trial}`,'procedural');
  if(validatePuzzle(p).valid)return p;
 }
 throw Error('No unambiguous generated puzzle found. Choose another seed.');
}
