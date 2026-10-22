import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {bank} from '../build/data.js';
import {empty,key} from '../build/storage.js';
import {session} from '../build/engine.js';
const base=process.env.GAMES_TEST_URL||'http://127.0.0.1:8090';
const browser=await chromium.launch({headless:true});
let checks=0;const errors=[];
const check=(description)=>{checks++;console.log('PASS',description);};
async function setup(options={}){
 const context=await browser.newContext({viewport:{width:1280,height:1100},...options});const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-10-21T12:00:00Z')});
 await page.addInitScript(()=>{Object.defineProperty(navigator,'share',{configurable:true,value:undefined});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__shared=text;}}});});
 return {context,page};
}
async function saved(page,game){return page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key(game));}
async function selectAndLock(page,answer){
 const option=page.locator('.answers button').filter({hasText:answer}).first();await option.click();await page.getByRole('button',{name:'Lock in answer',exact:false}).click();
}
try{
 for(const game of ['fourthword','oddrule']){
  const {context,page}=await setup();await page.goto(`${base}/${game}/`);await page.locator('.board .edition').waitFor();
  let d=await saved(page,game),s=d.daily['2026-10-21'],p=s.puzzle;
  assert.equal(await page.locator('h1').innerText(),game==='fourthword'?'The Fourth Thing':'The Odd Rule');
  assert.equal(await page.locator('#lock-answer').isDisabled(),true);check(`${game}: daily loads, pending choice cannot be submitted`);
  if(game==='oddrule'){
   await page.getByRole('button',{name:'Settings',exact:true}).click();await page.locator('#name-rule-setting').check();await page.getByRole('button',{name:'Close dialog',exact:true}).click();
  }
  const wrong=(p.choices||p.items).find(x=>x!==p.answer);await selectAndLock(page,wrong);
  assert.match(await page.locator('.feedback').innerText(),/Not quite/);assert.equal((await saved(page,game)).daily['2026-10-21'].guesses.length,1);
  await page.getByRole('button',{name:'A little hint',exact:false}).click();assert.equal(await page.locator('.hints li').count(),1);
  await page.reload();assert.equal(await page.locator('.hints li').count(),1);check(`${game}: wrong answer, hint and unfinished refresh recovery`);
  await selectAndLock(page,p.answer);
  if(game==='oddrule'){
   await page.locator('#rule-heading').waitFor();await page.reload();await page.getByRole('button',{name:p.relationship,exact:true}).click();
  }
  await page.locator('#result-heading').waitFor();d=await saved(page,game);assert.equal(d.records.length,1);assert.equal(d.daily['2026-10-21'].phase,'solved');assert.ok(d.records[0].score>0);
  await page.reload();assert.equal((await saved(page,game)).records.length,1);check(`${game}: solve, explanation, saved first completion${game==='oddrule'?', rule stage resumes after refresh':''}`);
  await page.getByRole('button',{name:'Share result',exact:false}).click();const text=await page.evaluate(()=>window.__shared);assert.ok(text&&!text.includes('Answer:'));assert.ok(!text.includes(p.relationship));check(`${game}: spoiler-free clipboard share`);
  await page.getByRole('button',{name:'Stats',exact:true}).click();assert.ok((await page.locator('dialog').innerText()).includes('Daily streak'));await page.getByRole('button',{name:'Close dialog',exact:true}).click();
  await page.getByRole('button',{name:'Puzzle feedback',exact:true}).click();await page.getByRole('button',{name:'Save note on this device',exact:true}).click();assert.equal((await saved(page,game)).feedback.length,1);check(`${game}: stats and explicitly local feedback`);
  await page.getByRole('button',{name:'Unlimited practice',exact:true}).click();await page.getByLabel('Practice difficulty').selectOption('5');await page.getByLabel('Practice category').selectOption('Numbers');await page.getByRole('button',{name:'New puzzle',exact:false}).click();
  d=await saved(page,game);assert.equal(d.practice.puzzle.level,5);assert.equal(d.practice.puzzle.category,'Numbers');
  await page.getByRole('button',{name:'Reveal answer',exact:true}).click();await page.getByRole('button',{name:'Confirm',exact:true}).click();await page.locator('#result-heading').waitFor();assert.equal((await saved(page,game)).records.at(-1).score,0);check(`${game}: practice filters, confirmation and zero-score reveal`);
  await page.screenshot({path:`/tmp/${game}-desktop.png`,fullPage:true});
  await context.close();
 }
 // A full free-response journey, including a typed wrong answer and Enter submission.
 {
  const {context,page}=await setup();await page.goto(`${base}/fourthword/`);
  const p=bank.find(p=>p.game==='fourthword'&&p.answerMode==='text'&&p.level===4),d=empty();d.daily['2026-10-21']=session(p,'daily','2026-10-21',0,false);d.attempted=['daily:2026-10-21'];
  await page.evaluate(([k,d])=>localStorage.setItem(k,JSON.stringify(d)),[key('fourthword'),d]);await page.reload();
  await page.getByLabel('Your fourth item').fill('999');await page.getByLabel('Your fourth item').press('Enter');assert.match(await page.locator('.feedback').innerText(),/Not quite/);
  await page.getByLabel('Your fourth item').fill(' '+p.answer+' ');await page.getByLabel('Your fourth item').press('Enter');await page.locator('#result-heading').waitFor();check('Fourth Thing: constrained text mode supports keyboard, wrong answer and normalized solution');await context.close();
 }
 // Exhaustion and cross-tab daily completion sync.
 {
  const {context,page}=await setup();await page.goto(`${base}/fourthword/`);const d=await saved(page,'fourthword'),p=d.daily['2026-10-21'].puzzle;
  const other=await context.newPage();await other.clock.install({time:new Date('2026-10-21T12:00:00Z')});await other.goto(`${base}/fourthword/`);
  for(const value of p.choices.filter(x=>x!==p.answer))await selectAndLock(page,value);
  await page.locator('#result-heading').waitFor();await other.locator('#result-heading').waitFor();assert.equal((await saved(page,'fourthword')).records[0].won,false);assert.equal((await saved(page,'fourthword')).records[0].score,0);check('Three mistakes reveal, zero score, terminal result syncs across tabs');await context.close();
 }
 // Midnight rollover must replace the daily assignment and preserve the old state.
 {
  const {context,page}=await setup();await page.goto(`${base}/oddrule/`);await page.clock.setSystemTime(new Date('2026-10-22T00:00:01Z'));await page.clock.runFor(1100);await page.waitForFunction(()=>document.querySelector('.edition').textContent.includes('2026-10-22'));
  const d=await saved(page,'oddrule');assert.ok(d.daily['2026-10-21']);assert.ok(d.daily['2026-10-22']);check('UTC date transition publishes next assignment and retains prior progress');await context.close();
 }
 // Responsive, long words, dark/light, keyboard and reduced-motion checks.
 for(const width of [320,390,768,1440]){
  const {context,page}=await setup({viewport:{width,height:1100},colorScheme:width===390?'dark':'light',reducedMotion:'reduce'});
  for(const game of ['fourthword','oddrule']){
   await page.goto(`${base}/${game}/`);
   if(game==='fourthword'){
    const d=empty(),p=bank.find(p=>p.id==='fourthword-vowels-ordered');d.daily['2026-10-21']=session(p,'daily','2026-10-21',0,false);
    await page.evaluate(([k,d])=>localStorage.setItem(k,JSON.stringify(d)),[key(game),d]);await page.reload();
   }
   await page.locator('.board').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,`${width}/${game} page overflow`);
   const cards=page.locator('.clue-card,.odd-card');for(let i=0;i<await cards.count();i++)assert.ok(await cards.nth(i).evaluate(e=>e.scrollWidth<=e.clientWidth+1),`${width}/${game} card overflow`);
   await page.locator('.answers button').first().focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#lock-answer').isDisabled(),false);
   await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.activeElement.tagName==='BUTTON'));
   await page.screenshot({path:`/tmp/${game}-${width}.png`,fullPage:true});
  }
  check(`${width}px: both responsive layouts, long words, keyboard selection, reduced motion${width===390?', dark mode':''}`);await context.close();
 }
 // Settings, saved feedback readback, manual theme, reset cancellation and confirmation.
 {
  const {context,page}=await setup();await page.goto(`${base}/fourthword/`);
  await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByLabel('Color theme').selectOption('dark');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');await page.getByRole('button',{name:'Close dialog',exact:true}).click();await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'Reset this game’s saved data',exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal((await saved(page,'fourthword')).settings.theme,'dark');
  await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'Reset this game’s saved data',exact:true}).click();await page.getByRole('button',{name:'Confirm',exact:true}).click();assert.equal((await saved(page,'fourthword')).settings.theme,'system');assert.equal((await saved(page,'fourthword')).records.length,0);check('Settings: manual theme persists; reset requires confirmation and clears game data');await context.close();
 }
 // Existing game and collection navigation are retained.
 {
  const {context,page}=await setup();await page.goto(base+'/games/');assert.equal(await page.locator('.collection-card').count(),5);
  await page.goto(base+'/');assert.equal(await page.locator('.game-cards a').count(),5);await page.goto(base+'/wordbridge/');assert.match(await page.locator('h1').innerText(),/WordBridge/);check('Homepage and collection link all five games; WordBridge remains available');await context.close();
 }
 // Unavailable storage must not prevent a playable puzzle.
 {
  const {context,page}=await setup();await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('denied');};Storage.prototype.setItem=()=>{throw Error('denied');};});await page.goto(`${base}/fourthword/`);await page.locator('.answers').waitFor();await page.getByRole('button',{name:'A little hint',exact:false}).click();assert.equal(await page.locator('.hints li').count(),1);check('Blocked localStorage: game remains playable in memory');await context.close();
 }
 assert.deepEqual(errors,[],'No uncaught browser errors');check('No uncaught browser errors');console.log(`\n${checks} browser checks passed.`);
}finally{await browser.close();}
