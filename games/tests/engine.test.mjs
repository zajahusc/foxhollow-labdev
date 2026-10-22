import test from 'node:test';
import assert from 'node:assert/strict';
import {bank,normalize,validateBank,validatePuzzle,generate,shuffle} from '../build/data.js';
import {getRule,rules,prime} from '../build/rules.js';
import {correct,finish,nameRule,practicePuzzle,previousDay,record,reveal,saveSession,score,session,share,statistics,submit,terminal,useHint,utcDay} from '../build/engine.js';
import {deserialize,empty,load,store} from '../build/storage.js';
import {dailyPuzzle,schedule} from '../build/schedule.js';
const fourth=bank.find(p=>p.game==='fourthword'&&p.answerMode==='choice');
const odd=bank.find(p=>p.game==='oddrule');
const start=(p=fourth,mode='daily',serial=1,naming=false)=>session(p,mode,'2026-10-21',serial,naming);

test('all published puzzles satisfy their predicates and ambiguity checks',()=>{
 assert.doesNotThrow(()=>validateBank(bank));
 assert.equal(bank.filter(p=>p.game==='fourthword').length,40);assert.equal(bank.filter(p=>p.game==='oddrule').length,35);
 for(const game of ['fourthword','oddrule'])for(let level=1;level<=5;level++)assert.equal(bank.filter(p=>p.game===game&&p.level===level).length,game==='fourthword'?8:7);
 for(const p of bank){assert.equal(p.observedDifficulty,null);assert.equal(p.verification.method,'deterministic');}
});
test('normalization handles case, Unicode forms and whitespace without fuzzy matching',()=>{
 assert.equal(normalize('  ＭＡＲＳ \n '),'mars');assert.equal(normalize('  North  West '),'north west');
 assert.ok(correct(fourth,` ${fourth.answer.toUpperCase()} `));assert.ok(!correct(fourth,'an unapproved synonym'));
 for(const p of bank.filter(p=>p.game==='fourthword'&&p.answerMode==='text'))assert.ok(correct(p,' '+p.answer+' '));
});
test('wrong selection, duplicate guess, hint, solution and persistence journey',()=>{
 let s=start();const wrong=fourth.choices.find(x=>x!==fourth.answer);
 s=submit(s,wrong);assert.equal(s.phase,'playing');assert.equal(s.guesses.length,1);assert.equal(submit(s,wrong),s);
 s=useHint(s);assert.equal(s.hints,1);s=submit(s,fourth.answer);assert.equal(s.phase,'solved');assert.equal(s.score,score(s.puzzle.level,1,1,true));
 let d=saveSession(empty(),s);d=saveSession(d,s);assert.equal(d.records.length,1);assert.equal(d.attempted.length,1);
 assert.deepEqual(deserialize(JSON.stringify(d)),d);
});
test('scores always use original base; hint increments, bonus, reveal, minimum',()=>{
 assert.equal(score(4,1,1,true),300);assert.equal(score(4,2,2,true),180);assert.equal(score(4,2,3,true),100);
 assert.equal(score(5,0,0,true,true),625);assert.equal(score(5,0,0,false,true),0);assert.equal(score(1,10,3,true),0);
 let s=start();for(let i=0;i<6;i++)s=useHint(s);assert.equal(s.hints,3);
});
test('three wrong answers exhaust attempts and remain terminal',()=>{
 let s=start();for(const bad of fourth.choices.filter(x=>x!==fourth.answer))s=submit(s,bad);
 assert.equal(s.phase,'failed');assert.equal(s.score,0);assert.equal(submit(s,fourth.answer),s);assert.equal(useHint(s),s);
});
test('revealing and abandoning award zero and do not permit score overwrite',()=>{
 const won=submit(start(),fourth.answer),failed=reveal(start());assert.equal(failed.score,0);assert.ok(terminal(failed));
 let d=saveSession(empty(),won);d=saveSession(d,failed);assert.equal(d.daily['2026-10-21'].phase,'solved');assert.equal(d.records.length,1);
 assert.throws(()=>record(start()),/unfinished/);
});
test('odd outsider selection and rule identification form two distinct stages',()=>{
 let s=start(odd,'daily',1,true);s=submit(s,odd.items.find(x=>x!==odd.answer));assert.equal(s.phase,'playing');
 s=submit(s,odd.answer);assert.equal(s.phase,'naming');assert.equal(s.finished,null);assert.equal(s.score,0);
 assert.equal(nameRule(s,'invented rule'),s);s=nameRule(s,odd.relationship);assert.equal(s.phase,'solved');assert.ok(s.ruleAnswer);assert.equal(s.score,score(odd.level,1,0,true,true));
});
test('wrong rule still completes with one base-score penalty and no bonus',()=>{
 let s=submit(start(odd,'daily',1,true),odd.answer);s=nameRule(s,odd.ruleChoices.find(t=>t!==odd.relationship));
 assert.equal(s.phase,'solved');assert.equal(s.score,score(odd.level,1,0,true));
});
test('rules cannot be guessed until outsider found; strangers cannot be submitted',()=>{
 const s=start(odd);assert.equal(nameRule(s,odd.relationship),s);assert.equal(submit(s,'not on any card'),s);assert.equal(submit(start(),'' ).guesses.length,0);
});
test('UTC boundaries are independent of local offset and include leap dates',()=>{
 assert.equal(utcDay(new Date('2026-10-21T23:59:59-05:00')),'2026-10-22');assert.equal(previousDay('2028-03-01'),'2028-02-29');
});
test('explicit daily assignments remain stable and schedule ends honestly',()=>{
 for(const game of ['fourthword','oddrule']){
  const a=dailyPuzzle(game,'2026-10-21'),b=dailyPuzzle(game,'2026-10-21');assert.deepEqual(a,b);assert.equal(a.game,game);
  assert.equal(dailyPuzzle(game,'2026-10-20'),null);assert.equal(dailyPuzzle(game,'2027-10-21'),null);
 }
 assert.equal(Object.keys(schedule).length,365);
});
test('every scheduled assignment resolves to a valid puzzle',()=>{
 for(const day of Object.keys(schedule))for(const game of ['fourthword','oddrule']){
  const p=dailyPuzzle(game,day);assert.ok(p,`${day}/${game}`);assert.ok(validatePuzzle(p).valid,`${day}/${game}`);
 }
});
test('practice generators are deterministic and independently validated at every level',()=>{
 for(const game of ['fourthword','oddrule'])for(let level=1;level<=5;level++)for(let seed=0;seed<8;seed++){
  const p=generate(game,level,`test-${seed}`),q=generate(game,level,`test-${seed}`);
  assert.deepEqual(p,q);assert.equal(p.level,level);assert.equal(p.source,'procedural');assert.ok(validatePuzzle(p).valid);
 }
});
test('practice filters hold; selected language bank cycles after exhaustion without immediate repeat',()=>{
 for(const game of ['fourthword','oddrule']){
  const recent=bank.filter(p=>p.game===game&&p.category==='Language'&&p.level===3).map(p=>p.id);
  const p=practicePuzzle(game,3,'Language',recent,'practice');assert.equal(p.level,3);assert.equal(p.category,'Language');assert.notEqual(p.id,recent[0]);
  const q=practicePuzzle(game,4,'Numbers',bank.map(p=>p.id),'generated');assert.equal(q.source,'procedural');assert.equal(q.level,4);
 }
});
test('fresh practice avoids recently completed IDs',()=>{
 const first=practicePuzzle('fourthword',0,'Any',[],'seed');const second=practicePuzzle('fourthword',0,'Any',[first.id],'seed');assert.notEqual(first.id,second.id);
 assert.deepEqual(shuffle([1,2,3,4],'seed'),shuffle([1,2,3,4],'seed'));
});
test('statistics track attempts, failures and difficulty; only daily wins affect streaks',()=>{
 let d=empty();
 for(let i=0;i<3;i++){let s=session(fourth,'daily',`2026-10-${19+i}`,i,false);s=submit(s,fourth.answer);d=saveSession(d,s);}
 d=saveSession(d,reveal(session(fourth,'practice','2026-10-21',22,false)));
 const stats=statistics(d,'2026-10-21');assert.equal(stats.streak,3);assert.equal(stats.longest,3);assert.equal(stats.winRate,75);assert.equal(stats.attempted,4);assert.equal(stats.completed,4);
 assert.equal(statistics(d,'2026-10-22').streak,3);assert.equal(statistics(d,'2026-10-23').streak,0);
 const active=session(fourth,'practice','2026-10-21',23,false);d=saveSession(d,active);assert.equal(statistics(d).attempted,5);assert.equal(statistics(d).completed,4);
});
test('daily and practice persist independently, including mid-rule and selected cards',()=>{
 let d=empty();const daily={...start(),selected:fourth.answer};d=saveSession(d,daily);
 const practice=submit(start(odd,'practice',44,true),odd.answer);d=saveSession(d,practice);
 const restored=deserialize(JSON.stringify(d));assert.equal(restored.daily[daily.day].selected,fourth.answer);assert.equal(restored.practice.phase,'naming');
});
test('bad, old and partly corrupted storage recovers without crashing',()=>{
 assert.deepEqual(deserialize('{'),empty());assert.deepEqual(deserialize('{"version":0}'),empty());
 const bad={...empty(),daily:{'2026-10-21':{phase:'solved'}},records:[null,{}, {score:-1}],recent:3};assert.deepEqual(deserialize(JSON.stringify(bad)),empty());
 assert.deepEqual(load('fourthword',{getItem(){throw Error('blocked');}}),empty());assert.equal(store('fourthword',empty(),{setItem(){throw Error('quota');}}),false);
});
test('completed score serialization is idempotent',()=>{
 const d=saveSession(empty(),submit(start(),fourth.answer));const raw=JSON.stringify(d);assert.equal(JSON.stringify(deserialize(raw)),raw);
});
test('share text omits answers and rule by default, includes only with explicit option',()=>{
 const done=submit(start(),fourth.answer),text=share(done);assert.ok(!text.includes(fourth.relationship));assert.ok(!text.includes('Answer:'));assert.ok(text.includes('/fourthword/'));
 assert.ok(share(done,true).includes('Answer: '+fourth.answer));
});
test('validation rejects bad candidates and known alternate interpretations',()=>{
 assert.equal(validatePuzzle({...fourth,clues:[]}).valid,false);assert.equal(validatePuzzle({...fourth,choices:Array(4).fill(fourth.answer)}).valid,false);
 assert.equal(validatePuzzle({...odd,answer:odd.items.find(x=>x!==odd.answer)}).valid,false);
 assert.throws(()=>validateBank([fourth,fourth]),/Duplicate/);
 const s=bank.find(p=>p.ruleId.startsWith('sequence:'));assert.equal(validatePuzzle({...s,answer:'999'}).valid,false);
});
test('all hint and rule-distractor metadata is complete',()=>{
 for(const p of bank){assert.equal(p.hints.length,3);assert.ok(p.hints.every(Boolean));assert.ok(p.estimatedSeconds>0);
  if(p.game==='oddrule'){const good=p.items.filter(getRule(p.ruleId).test);for(const choice of p.ruleChoices.filter(t=>t!==p.relationship)){const r=rules.find(r=>r.title===choice);assert.ok(r);assert.ok(!good.every(r.test));}}
 }
});
test('prime boundary cases and objective predicates are precise',()=>{
 assert.ok(!prime(0));assert.ok(!prime(1));assert.ok(prime(2));assert.ok(!prime(9));assert.ok(prime(997));
 assert.ok(getRule('vowels-ordered').test('facetious'));assert.ok(!getRule('vowels-ordered').test('education'));
 assert.ok(getRule('roman').test('civil'));assert.ok(!getRule('roman').test('silk'));assert.ok(!getRule('prime-reverse').test('11'));
});
test('finishing never produces negative elapsed times',()=>{const s=finish({...start(),started:Date.now()+100000},false);assert.equal(record(s).seconds,0);});
