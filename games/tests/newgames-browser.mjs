import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {orbitBank,activeOrbits} from '../build/newgames/orbit.js';
import {gravityTargets} from '../build/newgames/targets.js';
import {solve} from '../build/newgames/weave.js';
import {storageKey} from '../build/newgames/shared.js';
const base=process.env.GAMES_TEST_URL||'http://127.0.0.1:8090';
const browser=await chromium.launch({headless:true});
const errors=[];let checks=0;const passed=name=>{checks++;console.log('PASS',name);};
async function setup(options={}){const context=await browser.newContext({viewport:{width:1280,height:1100},...options}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-21T12:00:00Z')});await page.addInitScript(()=>{Object.defineProperty(navigator,'share',{configurable:true,value:undefined});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.__shared=text}});});return {context,page};}
async function data(page,game){return page.evaluate(k=>JSON.parse(localStorage.getItem(k)),storageKey(game));}
async function guess(page,word){await page.getByLabel('Your guess',{exact:true}).fill(word);await page.getByRole('button',{name:'Send guess',exact:false}).click();}
async function enterGrid(page,state,letters=state.puzzle.solution){for(let i=0;i<state.puzzle.layout.length;i++)if(state.puzzle.givens[i]==='.'&&!state.hintLetters[i]){await page.locator(`#cell-${i}`).click();await page.keyboard.press(letters[i]);}}
try{
 {
  const {context,page}=await setup();await page.goto(base+'/wordorbit/');await page.locator('.orbit-center').waitFor();let d=await data(page,'wordorbit'),state=d.daily['2026-10-21'],p=orbitBank.find(p=>p.id===state.puzzleId);
  assert.equal(await page.locator('.orbit-node').count(),4);await page.getByRole('button',{name:'How to play',exact:true}).click();await page.getByLabel('Tutorial answer').fill('SUN');await page.getByRole('button',{name:'Try the example',exact:true}).click();assert.match(await page.locator('.tutorial-feedback').innerText(),/Connected/);await page.getByRole('button',{name:'Close dialog',exact:true}).click();passed('Orbit interactive tutorial and guided four-node daily');
  await guess(page,'reasonable alternative');assert.match(await page.locator('.feedback').innerText(),/not in this puzzle/);await page.getByRole('button',{name:'Flag a reasonable alternative'}).click();await page.getByRole('button',{name:'Save alternative on this device'}).click();assert.equal((await data(page,'wordorbit')).feedback.length,1);
  await page.locator('#orbit-hint').click();await page.reload();assert.equal((await data(page,'wordorbit')).daily['2026-10-21'].hints,1);
  for(const orbit of activeOrbits(p,state.level))await guess(page,orbit.answer);
  await page.locator('#result-heading').waitFor();assert.equal((await data(page,'wordorbit')).records.length,1);await page.reload();assert.equal((await data(page,'wordorbit')).records.length,1);
  await page.getByRole('button',{name:'Share result',exact:false}).click();const text=await page.evaluate(()=>window.__shared);assert.ok(text&&!text.includes('sun'));passed('Orbit wrong guess, local alternative flag, targeted hint, solve, refresh and spoiler-free share');
  await page.getByRole('button',{name:'Unlimited practice',exact:true}).click();await page.getByLabel('Practice difficulty').selectOption('5');await page.getByRole('button',{name:'New puzzle',exact:false}).click();assert.equal(await page.locator('.orbit-node').count(),8);assert.ok((await page.locator('.orbit-node').first().innerText()).includes('Orbit'));passed('Orbit Master practice uses eight hidden categories');await context.close();
 }
 {
  const {context,page}=await setup();await page.goto(base+'/semanticgravity/');await page.getByLabel('Your guess',{exact:true}).waitFor();const d=await data(page,'semanticgravity'),state=d.daily['2026-10-21'],target=gravityTargets.find(t=>t.id===state.puzzleId);
  await guess(page,'zzzzunsupported');assert.match(await page.locator('.feedback').innerText(),/outside/);assert.equal((await data(page,'semanticgravity')).daily['2026-10-21'].guesses.length,0);
  await guess(page,target.word==='volcano'?'mountain':'volcano');await page.getByRole('button',{name:'A gravitational nudge',exact:false}).click();await page.reload();await page.getByLabel('Your guess',{exact:true}).waitFor();assert.equal((await data(page,'semanticgravity')).daily['2026-10-21'].hints,1);passed('Gravity real model loads; unsupported guesses are free; rank and hint survive refresh');
  await page.getByRole('button',{name:'How to play',exact:true}).click();await page.getByLabel('Tutorial answer').fill('mountain');await page.getByRole('button',{name:'Try the example',exact:true}).click();assert.match(await page.locator('.tutorial-feedback').innerText(),/Rank #/);await page.getByRole('button',{name:'Close dialog',exact:true}).click();
  await guess(page,target.word);await page.locator('#result-heading').waitFor();assert.ok((await data(page,'semanticgravity')).records[0].score>0);assert.match(await page.locator('table').innerText(),/#1 /);
  await page.getByRole('button',{name:'Share result',exact:false}).click();assert.ok(!(await page.evaluate(()=>window.__shared)).includes(target.word));passed('Gravity tutorial uses actual ranks; target solves at #1, result and share work');await context.close();
 }
 {
  const {context,page}=await setup();await page.goto(base+'/wordweave/');await page.locator('.weave-grid').waitFor();let d=await data(page,'wordweave'),state=d.daily['2026-10-21'];const open=state.puzzle.givens.indexOf('.');
  await page.locator(`#cell-${open}`).click();await page.getByRole('button',{name:'Pen ✓',exact:true}).click();await page.keyboard.press('e');assert.equal((await data(page,'wordweave')).daily['2026-10-21'].notes[open],'e');assert.equal((await data(page,'wordweave')).daily['2026-10-21'].letters[open],'.');await page.getByRole('button',{name:'Pencil ✓',exact:true}).click();await page.locator(`#cell-${open}`).click();await page.keyboard.press('a');await page.getByRole('button',{name:'Undo',exact:true}).click();assert.equal((await data(page,'wordweave')).daily['2026-10-21'].letters[open],'.');await page.getByRole('button',{name:'Redo',exact:true}).click();passed('Weave keyboard entry, pencil notes, undo and redo preserve state');
  await page.getByRole('button',{name:'Submit weave',exact:false}).click();assert.match(await page.locator('.feedback').innerText(),/Fill every/);
  await page.getByRole('button',{name:'Check progress',exact:false}).click();await page.waitForFunction(()=>document.querySelector('.board').getAttribute('aria-busy')==='false');assert.ok((await data(page,'wordweave')).daily['2026-10-21'].hints>=1);
  await page.getByRole('button',{name:'Reveal letter',exact:false}).click();await page.waitForFunction(()=>document.querySelector('.board').getAttribute('aria-busy')==='false');
  await page.reload();await page.locator('.weave-grid').waitFor();state=(await data(page,'wordweave')).daily['2026-10-21'];assert.ok(Object.keys(state.hintLetters).length>0);await enterGrid(page,state);await page.getByRole('button',{name:'Submit weave',exact:false}).click();await page.locator('#result-heading').waitFor();assert.equal((await data(page,'wordweave')).records.length,1);await page.reload();assert.equal((await data(page,'wordweave')).records.length,1);passed('Weave incorrect submission, worker-backed check/reveal, refresh recovery and full solve');
  await page.getByRole('button',{name:'Share result',exact:false}).click();assert.match(await page.evaluate(()=>window.__shared),/WORD WEAVE/);
  await page.getByRole('button',{name:'Unlimited practice',exact:true}).click();await page.getByLabel('Weave mode').selectOption('free');await page.getByLabel('Grid size').selectOption('3');await page.getByRole('button',{name:'New puzzle',exact:false}).click();await page.waitForFunction(()=>document.querySelector('.board').getAttribute('aria-busy')==='false');state=(await data(page,'wordweave')).practice;
  assert.equal(state.puzzle.unique,false);const alternative=solve(state.puzzle).solutions.find(x=>x!==state.puzzle.solution);assert.ok(alternative);await enterGrid(page,state,alternative);await page.getByRole('button',{name:'Submit weave',exact:false}).click();await page.locator('#result-heading').waitFor();passed('Free Weave generates in a Worker and accepts a different valid completion');await context.close();
 }
 for(const width of [320,390,768,1440]){
  const {context,page}=await setup({viewport:{width,height:1100},colorScheme:width===390?'dark':'light',reducedMotion:'reduce'});
  for(const game of ['wordorbit','semanticgravity','wordweave']){
   await page.goto(`${base}/${game}/`);await page.locator('.board').waitFor();if(game==='semanticgravity')await page.getByLabel('Your guess',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,`${game}/${width} overflow`);
   await page.screenshot({path:`/tmp/${game}-${width}.png`,fullPage:true});
   if(game==='wordweave'){const editable=page.locator('.weave-cell:not(.fixed):not(.blocked)').first();await editable.focus();await page.keyboard.press('ArrowRight');assert.match(await page.evaluate(()=>document.activeElement.id),/^cell-/);}
  }
  passed(`${width}px: all three layouts, textual rank alternative, reduced motion, keyboard grid${width===390?', dark mode':''}`);await context.close();
 }
 {
  const {context,page}=await setup();await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('denied');};Storage.prototype.setItem=()=>{throw Error('denied');};});await page.goto(base+'/wordorbit/');await guess(page,'sun');assert.equal(await page.locator('.orbit-node.filled').count(),1);passed('Blocked localStorage preserves an in-memory playable Orbit');await context.close();
 }
 {
  const {context,page}=await setup();await page.goto(base+'/wordorbit/');await page.clock.setSystemTime(new Date('2026-10-22T00:00:01Z'));await page.clock.runFor(1100);await page.waitForFunction(()=>document.querySelector('.edition').textContent.includes('2026-10-22'));assert.ok((await data(page,'wordorbit')).daily['2026-10-21']);passed('UTC rollover preserves prior daily and starts the published next assignment');await context.close();
 }
 {
  const {context,page}=await setup({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await page.goto(base+'/wordweave/');await page.locator('.weave-cell:not(.fixed):not(.blocked)').first().tap();assert.equal(await page.evaluate(()=>document.activeElement.id),'weave-entry');await page.getByLabel('Letter for selected cell').fill('e');assert.ok((await data(page,'wordweave')).daily['2026-10-21'].letters.includes('e'));passed('Mobile touch opens the letter field and accepts an on-screen keyboard entry');await context.close();
 }
 {
  const {context,page}=await setup();await page.goto(base+'/semanticgravity/');await page.getByLabel('Your guess',{exact:true}).waitFor();await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByLabel('Daily guess limit',{exact:true}).selectOption('10');await page.getByRole('button',{name:'Close dialog',exact:true}).click();assert.equal((await data(page,'semanticgravity')).daily['2026-10-21'].limit,10);await page.getByRole('button',{name:'Reveal puzzle',exact:true}).click();await page.getByRole('button',{name:'Confirm',exact:true}).click();await page.locator('#result-heading').waitFor();assert.equal((await data(page,'semanticgravity')).records[0].score,0);passed('Gravity configurable daily limit and zero-score reveal confirmation');await context.close();
 }
 assert.deepEqual(errors,[]);passed('No uncaught browser errors');console.log(`${checks} new-game browser checks passed.`);
}finally{await browser.close();}
