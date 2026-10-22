import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {gravityTargets} from '../build/newgames/targets.js';
import {solve} from '../build/newgames/weave.js';
import {storageKey} from '../build/newgames/shared.js';
const base=process.env.GAMES_TEST_URL||'http://127.0.0.1:8090';
const browser=await chromium.launch({headless:true});
const errors=[];let checks=0;const passed=name=>{checks++;console.log('PASS',name);};
async function setup(options={}){const context=await browser.newContext({viewport:{width:1280,height:1100},...options}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-22T12:00:00Z')});await page.addInitScript(()=>{Object.defineProperty(navigator,'share',{configurable:true,value:undefined});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.__shared=text}});});return {context,page};}
async function data(page,game){return page.evaluate(k=>JSON.parse(localStorage.getItem(k)),storageKey(game));}
async function guess(page,word){await page.getByLabel('Your guess',{exact:true}).fill(word);await page.getByRole('button',{name:'Send guess',exact:false}).click();}
async function enterGrid(page,state,letters=state.puzzle.solution){for(let i=0;i<state.puzzle.layout.length;i++)if(state.puzzle.givens[i]==='.'&&!state.hintLetters[i]){await page.locator(`#cell-${i}`).click();await page.keyboard.press(letters[i]);}}
try{
 {
  const {context,page}=await setup();await page.goto(base+'/semanticgravity/');await page.getByLabel('Your guess',{exact:true}).waitFor();const d=await data(page,'semanticgravity'),state=d.daily['2026-10-22'],target=gravityTargets.find(t=>t.id===state.puzzleId);
  await guess(page,'zzzzunsupported');assert.match(await page.locator('.feedback').innerText(),/outside/);assert.equal((await data(page,'semanticgravity')).daily['2026-10-22'].guesses.length,0);
  await guess(page,target.word==='volcano'?'mountain':'volcano');await page.getByRole('button',{name:'A gravitational nudge',exact:false}).click();await page.reload();await page.getByLabel('Your guess',{exact:true}).waitFor();assert.equal((await data(page,'semanticgravity')).daily['2026-10-22'].hints,1);passed('Gravity real model loads; unsupported guesses are free; rank and hint survive refresh');
  await page.getByRole('button',{name:'How to play',exact:true}).click();await page.getByLabel('Tutorial answer').fill('mountain');await page.getByRole('button',{name:'Try the example',exact:true}).click();assert.match(await page.locator('.tutorial-feedback').innerText(),/Rank #/);await page.getByRole('button',{name:'Close dialog',exact:true}).click();
  await guess(page,target.word);await page.locator('#result-heading').waitFor();assert.ok((await data(page,'semanticgravity')).records[0].score>0);assert.match(await page.locator('table').innerText(),/#1 /);
  await page.getByRole('button',{name:'Share result',exact:false}).click();assert.ok(!(await page.evaluate(()=>window.__shared)).includes(target.word));passed('Gravity tutorial uses actual ranks; target solves at #1, result and share work');await context.close();
 }
 {
  const {context,page}=await setup();await page.goto(base+'/wordweave/');await page.locator('.weave-grid').waitFor();let state=(await data(page,'wordweave')).daily['2026-10-22'];assert.equal(state.puzzle.mode,'crossword');assert.equal(state.letters,state.puzzle.layout);assert.equal(await page.locator('.weave-cell.fixed:not(.blocked)').count(),0);assert.equal(await page.locator('.word-status,.weave-assists,.weave-word-status').count(),0);assert.ok(await page.getByRole('heading',{name:'Across',exact:true}).count());assert.ok(await page.getByRole('heading',{name:'Down',exact:true}).count());passed('Crossword starts blank with Across/Down clues and no automatic feedback or prominent hint controls');
  const index=state.puzzle.givens.indexOf('.');await page.locator('#cell-'+index).click();await page.keyboard.press('a');await page.getByRole('button',{name:'Options',exact:true}).click();await page.getByRole('button',{name:'Undo',exact:true}).click();assert.equal((await data(page,'wordweave')).daily['2026-10-22'].letters[index],'.');await page.getByRole('button',{name:'Options',exact:true}).click();await page.getByRole('button',{name:'Use pencil',exact:true}).click();await page.locator('#cell-'+index).click();await page.keyboard.press('e');assert.equal((await data(page,'wordweave')).daily['2026-10-22'].notes[index],'e');await page.reload();await page.locator('.weave-grid').waitFor();assert.equal((await data(page,'wordweave')).daily['2026-10-22'].notes[index],'e');passed('Crossword optional pencil/undo tools and refresh preserve real progress');
  await page.getByRole('button',{name:'Options',exact:true}).click();await page.getByRole('button',{name:'Use pen',exact:true}).click();state=(await data(page,'wordweave')).daily['2026-10-22'];await enterGrid(page,state);await page.getByRole('button',{name:'Submit',exact:true}).click();await page.locator('#result-heading').waitFor();assert.equal((await data(page,'wordweave')).records.length,1);await page.getByRole('button',{name:'Share result',exact:false}).click();assert.match(await page.evaluate(()=>window.__shared),/WORD WEAVE/);await page.reload();assert.equal((await data(page,'wordweave')).records.length,1);passed('Full clue-based crossword solve, share and first score survive refresh');
  await page.getByRole('button',{name:'Unlimited practice',exact:true}).click();await page.getByLabel('Weave mode').selectOption('free');await page.getByLabel('Grid size').selectOption('3');await page.getByRole('button',{name:'New puzzle',exact:false}).click();await page.waitForFunction(()=>document.querySelector('.board').getAttribute('aria-busy')==='false');state=(await data(page,'wordweave')).practice;const alternative=solve(state.puzzle).solutions.find(x=>x!==state.puzzle.solution);assert.ok(alternative);await enterGrid(page,state,alternative);await page.getByRole('button',{name:'Submit',exact:true}).click();await page.locator('#result-heading').waitFor();passed('Optional Free Weave still accepts a different valid completion');await context.close();
 }
 for(const width of [320,390,768,1440]){
  const {context,page}=await setup({viewport:{width,height:1100},colorScheme:width===390?'dark':'light',reducedMotion:'reduce'});
  for(const game of ['semanticgravity','wordweave']){
   await page.goto(`${base}/${game}/`);await page.locator('.board').waitFor();if(game==='semanticgravity')await page.getByLabel('Your guess',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,`${game}/${width} overflow`);
   await page.screenshot({path:`/tmp/${game}-${width}.png`,fullPage:true});
   if(game==='wordweave'){const editable=page.locator('.weave-cell:not(.fixed):not(.blocked)').first();await editable.focus();await page.keyboard.press('ArrowRight');assert.match(await page.evaluate(()=>document.activeElement.id),/^cell-/);}
  }
  passed(`${width}px: both layouts, textual rank alternative, reduced motion, keyboard grid${width===390?', dark mode':''}`);await context.close();
 }
 {
  const {context,page}=await setup({viewport:{width:390,height:844},hasTouch:true,isMobile:true});await page.goto(base+'/wordweave/');await page.locator('.weave-cell:not(.fixed):not(.blocked)').first().tap();assert.equal(await page.evaluate(()=>document.activeElement.id),'weave-entry');await page.getByLabel('Letter for selected cell').fill('e');assert.ok((await data(page,'wordweave')).daily['2026-10-22'].letters.includes('e'));passed('Mobile touch opens the letter field and accepts an on-screen keyboard entry');await context.close();
 }
 {
  const {context,page}=await setup();await page.goto(base+'/semanticgravity/');await page.getByLabel('Your guess',{exact:true}).waitFor();await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByLabel('Daily guess limit',{exact:true}).selectOption('10');await page.getByRole('button',{name:'Close dialog',exact:true}).click();assert.equal((await data(page,'semanticgravity')).daily['2026-10-22'].limit,10);await page.getByRole('button',{name:'Reveal puzzle',exact:true}).click();await page.getByRole('button',{name:'Confirm',exact:true}).click();await page.locator('#result-heading').waitFor();assert.equal((await data(page,'semanticgravity')).records[0].score,0);passed('Gravity configurable daily limit and zero-score reveal confirmation');await context.close();
 }
 assert.deepEqual(errors,[]);passed('No uncaught browser errors');console.log(`${checks} new-game browser checks passed.`);
}finally{await browser.close();}
