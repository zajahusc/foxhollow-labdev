import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {orbitBank,validateOrbit,activeOrbits,orbitCount,orbitGuess,orbitHint} from '../build/newgames/orbit.js';
import {gravityTargets} from '../build/newgames/targets.js';
import {cosine,model,rank,gravityGuess,gravityHint,neighborHints,temperature,normalizeGuess} from '../build/newgames/gravity.js';
import {weaveBank} from '../build/newgames/weave-bank.js';
import {dictionary,dictionaryVersion} from '../build/newgames/dictionary.js';
import {solve,slots,counts,validateWeave,checkGrid,editCell,undo,redo,submitWeave,weaveScore,makeWeave} from '../build/newgames/weave.js';
import {initial,blankSave,commit,decode,giveUp,statistics,resultText,utcDay} from '../build/newgames/shared.js';
import {newSchedule} from '../build/newgames/schedule.js';
const vocabulary=JSON.parse(readFileSync('games/data/gravity-v1.json','utf8'));
const raw=readFileSync('games/data/gravity-v1.f32');
const vectors=new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));
const trained=model(vocabulary,vectors);
const template={id:'test-free',size:3,mode:'free',level:1,layout:'.........',givens:'cat......',solution:'catareten',inventory:null,dictionary:dictionaryVersion,unique:false,searchNodes:0,constraints:{noRepeat:false},estimated:true};

test('Orbit: every center has eight reviewed, disjoint relationship groups',()=>{
 assert.equal(orbitBank.length,12);assert.equal(orbitBank.reduce((n,p)=>n+p.orbits.length,0),96);
 for(const p of orbitBank){assert.deepEqual(validateOrbit(p),[]);for(let level=1;level<=5;level++)assert.equal(activeOrbits(p,level).length,[4,5,6,6,8][level-1]);}
 const p=structuredClone(orbitBank[0]);p.orbits[1].accepted.push(p.orbits[0].answer);assert.ok(validateOrbit(p).some(x=>x.includes('Overlapping')));
});
test('Orbit: approved variants normalize, each guess fills one orbit, duplicates do not spend points',()=>{
 const p=orbitBank[0];let s=initial('wordorbit',p.id,1,'daily',0);
 s=orbitGuess(s,p,'  SUN  ').session;assert.equal(Object.keys(s.filled).length,1);assert.equal(s.score,100);
 assert.equal(orbitGuess(s,p,'sun').session,s);assert.equal(orbitGuess(s,p,'our sun').session,s);
 const miss=orbitGuess(s,p,'a plausible unlisted connection');assert.match(miss.message,/not in this puzzle/);assert.equal(miss.session.mistakes,1);
});
test('Orbit: guided/blind levels, all required orbits, full no-hint scoring and results',()=>{
 for(const level of [1,2,3,4,5]){const p=orbitBank[0];let s=initial('wordorbit',p.id,level,'practice',1);for(const o of activeOrbits(p,level))s=orbitGuess(s,p,o.answer).session;
  assert.equal(s.phase,'solved');assert.equal(s.score,orbitCount(level)*100+150);assert.ok(s.finished);}
});
test('Orbit: targeted three-stage hints, expert caps, penalties and zero floor',()=>{
 const p=orbitBank[0];let s=initial('wordorbit',p.id,4,'practice',1);for(const o of p.orbits.slice(0,2))for(let n=0;n<3;n++)s=orbitHint(s,o.id,p);
 assert.equal(s.hints,6);assert.equal(orbitHint(s,p.orbits[2].id,p),s);assert.equal(orbitHint(s,'missing',p),s);
 for(let i=0;i<80;i++)s=orbitGuess(s,p,'unlisted '+i).session;
 for(const o of activeOrbits(p,4))s=orbitGuess(s,p,o.answer).session;assert.equal(s.score,0);
});
test('Gravity: actual frozen vectors match metadata checksum and dimensionality',()=>{
 assert.equal(vocabulary.words.length,6028);assert.equal(vectors.length,6028*50);assert.equal(createHash('sha256').update(raw).digest('hex'),vocabulary.sha256);
 assert.throws(()=>model(vocabulary,new Float32Array(30)),/Invalid/);assert.throws(()=>cosine([1,2],[1]),/dimensions/);assert.throws(()=>cosine([0,0],[1,1]),/Zero/);
 assert.equal(cosine([1,0],[1,0]),1);assert.equal(cosine([1,0],[0,1]),0);assert.equal(cosine([1,0],[-1,0]),-1);
});
test('Gravity: all 100 targets have stable real ranks, target first, valid deterministic neighbors and frozen versions',()=>{
 assert.equal(gravityTargets.length,100);for(let level=1;level<=5;level++)assert.equal(gravityTargets.filter(t=>t.level===level).length,20);
 for(const t of gravityTargets){const ranking=rank(trained,t);assert.equal(ranking.ranks.get(t.word),1);assert.equal(new Set(ranking.ordered).size,6028);const hints=neighborHints(t,ranking);assert.ok(hints.every(x=>x!==t.word));assert.equal(ranking.ranks.get(hints[0]),30);assert.equal(ranking.ranks.get(hints[1]),5);
  for(let i=2;i<ranking.ordered.length;i++)assert.ok(ranking.scores.get(ranking.ordered[i-1])>=ranking.scores.get(ranking.ordered[i]));}
 const t=gravityTargets[0];assert.deepEqual(rank(trained,t).ordered,rank(trained,t).ordered);assert.throws(()=>rank(trained,{...t,model:'future-model'}),/version/);
});
test('Gravity: semantic distance is not shared spelling',()=>{
 const t=gravityTargets.find(t=>t.word==='rabbit'),r=rank(trained,t);
 assert.ok(r.ranks.get('animal')<r.ranks.get('habit')); // Real corpus semantics, not letters.
});
test('Gravity: unsupported and duplicate guesses are free; wrong→hint→solve score is exact',()=>{
 const t=gravityTargets[0],r=rank(trained,t);let s=initial('semanticgravity',t.id,t.level,'daily',0);
 assert.equal(gravityGuess(s,t,r,'notawordzzzzz').session,s);
 const wrong=r.ordered[100];s=gravityGuess(s,t,r,wrong).session;assert.equal(s.mistakes,1);assert.equal(gravityGuess(s,t,r,wrong).session,s);
 for(let n=0;n<3;n++)s=gravityHint(s);s=gravityGuess(s,t,r,t.word).session;assert.equal(s.phase,'solved');assert.equal(s.score,530);assert.equal(temperature(1,6028),'Found');assert.equal(temperature(6000,6028),'Cold');
 assert.equal(normalizeGuess('  HARBOR  ',trained.index),'harbour');
});
test('Gravity: daily limits fail at the configured boundary, practice remains unlimited',()=>{
 const t=gravityTargets[0],r=rank(trained,t);let s=initial('semanticgravity',t.id,t.level,'daily',0,undefined,10);
 for(const w of r.ordered.slice(1,11))s=gravityGuess(s,t,r,w).session;assert.equal(s.phase,'failed');assert.equal(s.score,0);
 const practice=initial('semanticgravity',t.id,t.level,'practice',1);assert.equal(practice.limit,null);
});
test('Weave: all 100 distinct published grids are valid and solver-proven unique',()=>{
 assert.equal(weaveBank.length,100);assert.equal(new Set(weaveBank.map(p=>p.layout+p.solution)).size,100);
 for(let level=1;level<=5;level++)assert.equal(weaveBank.filter(p=>p.level===level).length,20);
 assert.deepEqual([...new Set(weaveBank.map(p=>p.mode))].sort(),['cross','letter','square']);
 for(const p of weaveBank){assert.deepEqual(validateWeave(p),[],p.id);assert.deepEqual(checkGrid(p,p.solution),[]);assert.ok([...p.givens].filter(c=>c==='.').length>=3);for(const slot of slots(p.layout,p.size))assert.ok(dictionary.includes(slot.cells.map(i=>p.solution[i]).join('')));}
});
test('Weave: solver distinguishes unsatisfiable, unique and multiple completions',()=>{
 const zero=solve({...template,givens:'zzz......'});assert.equal(zero.solutions.length,0);assert.equal(zero.exhausted,true);
 const multiple=solve(template);assert.equal(multiple.solutions.length,2);assert.equal(multiple.exhausted,false);
 const unique=solve(weaveBank[0]);assert.equal(unique.solutions.length,1);assert.equal(unique.exhausted,true);
});
test('Weave: Free Weave accepts a valid alternate completion rather than a stored example',()=>{
 const result=solve(template);const alternative=result.solutions.find(x=>x!==template.solution);assert.ok(alternative);
 let s=initial('wordweave',template.id,1,'practice',1,template);s={...s,letters:alternative};assert.equal(submitWeave(s).session.phase,'solved');
});
test('Weave: fixed letters, pencil-only notes, undo and redo preserve crossings',()=>{
 const p=weaveBank.find(p=>p.mode==='square'&&p.size===3);let s=initial('wordweave',p.id,p.level,'practice',1,p);const open=p.givens.indexOf('.'),fixed=[...p.givens].findIndex(c=>c!=='.'&&c!=='#');
 assert.equal(editCell(s,fixed,'z'),s);let changed=editCell(s,open,'e');assert.equal(changed.letters[open],'e');assert.equal(undo(changed).letters,s.letters);assert.equal(redo(undo(changed)).letters,changed.letters);
 changed=editCell({...s,pencil:true},open,'a');assert.equal(changed.letters[open],'.');assert.equal(changed.notes[open],'a');assert.ok(submitWeave(changed).issues.length);
});
test('Weave: inventory counts have exact multiplicities and reject extra tiles',()=>{
 const p=weaveBank.find(p=>p.mode==='letter'),s=initial('wordweave',p.id,p.level,'practice',1,p),open=p.givens.indexOf('.');assert.equal(p.inventory.length,[...p.givens].filter(c=>c==='.').length);
 assert.deepEqual(counts('abbee'),{a:1,b:2,e:2});const absent=[...'abcdefghijklmnopqrstuvwxyz'].find(c=>!p.inventory.includes(c));assert.equal(editCell(s,open,absent),s);
 assert.deepEqual(checkGrid(p,p.solution),[]);
});
test('Weave: scoring, incorrect submission, hint penalties and minimum score are exact',()=>{
 const p=weaveBank[0];let s=initial('wordweave',p.id,1,'practice',1,p);assert.ok(submitWeave(s).issues.length);assert.equal(submitWeave(s).session.mistakes,1);
 s={...s,letters:p.solution};assert.equal(submitWeave(s).session.score,360);s={...s,hints:3,hintsByType:[1,1,1],mistakes:1};assert.equal(weaveScore(s),180);
 assert.equal(weaveScore({...s,hintsByType:[50,50,50]}),0);
});
test('Weave: deterministic generator produces proven grids and supported mode policies',()=>{
 for(const mode of ['square','letter','cross']){const size=mode==='cross'?5:4;const a=makeWeave(size,mode,3,'unit-generated-'+mode),b=makeWeave(size,mode,3,'unit-generated-'+mode);assert.deepEqual(a,b);assert.deepEqual(validateWeave(a),[]);}
 const free=makeWeave(3,'free',1,'free');assert.equal(free.unique,false);assert.throws(()=>makeWeave(4,'cross',2,'invalid'),/5×5/);
});
test('New game publication schedule resolves all 1,095 assignments without implicit selection',()=>{
 assert.equal(Object.keys(newSchedule).length,365);for(const entry of Object.values(newSchedule)){
  assert.ok(orbitBank.some(p=>p.id===entry.wordorbit.id));assert.ok(gravityTargets.some(p=>p.id===entry.semanticgravity.id));assert.ok(weaveBank.some(p=>p.id===entry.wordweave.id));}
 assert.equal(newSchedule['2027-10-21'],undefined);
});
test('Shared saves: separate games, corrupt data, refresh restore and first completed daily score',()=>{
 const p=orbitBank[0];let s=initial('wordorbit',p.id,1,'daily',0);s=orbitGuess(s,p,'sun').session;let d=commit(blankSave(),s);assert.deepEqual(decode(JSON.stringify(d),'wordorbit'),d);
 assert.equal(decode(JSON.stringify(d),'wordweave').daily[utcDay()],undefined);assert.deepEqual(decode('{broken','wordorbit'),blankSave());
 for(const o of activeOrbits(p,1).filter(o=>!s.filled[o.id]))s=orbitGuess(s,p,o.answer).session;d=commit(d,s);assert.equal(d.records.length,1);assert.equal(commit(d,giveUp(initial('wordorbit',p.id,1,'daily',0))).records[0].score,d.records[0].score);
 assert.equal(statistics(d).streak,1);assert.equal(statistics(d).wins,1);
 const shared=resultText(s);assert.ok(!shared.includes('sun'));assert.ok(!shared.includes('star'));
});
test('Weave progress with notes/history round-trips safely; reveal earns zero',()=>{
 const p=weaveBank[0];let s=initial('wordweave',p.id,p.level,'daily',0,p);s=editCell({...s,pencil:true},s.selected,'e');const saved=commit(blankSave(),s);assert.deepEqual(decode(JSON.stringify(saved),'wordweave'),saved);assert.equal(giveUp(s).score,0);assert.equal(giveUp(s).phase,'failed');
});
