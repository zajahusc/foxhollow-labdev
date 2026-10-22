import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {points} from '../../wordbridge/engine.js';
const base=process.env.GAMES_TEST_URL||'http://127.0.0.1:8090';
const schedule=JSON.parse(readFileSync('wordbridge/data/DailyChallenges.json','utf8'));
const puzzle=schedule.find(p=>p.date==='2026-10-22');
const browser=await chromium.launch(),errors=[];let checks=0;const pass=m=>{checks++;console.log('PASS',m);};
async function setup(options={}){const context=await browser.newContext({viewport:{width:1280,height:1100},...options});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-22T12:00:00Z')});await page.addInitScript(()=>{Object.defineProperty(navigator,'share',{configurable:true,value:undefined});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.__shared=text}});});return {context,page};}
try{
 for(const hard of [false,true]){
  const {context,page}=await setup();await page.goto(base+'/wordbridge/');await page.locator('.endpoints').waitFor();assert.equal(await page.locator('.masthead').count(),1);assert.equal(await page.locator('.game-hero h1').innerText(),'WordBridge');assert.equal(await page.locator('.board').count(),1);
  if(hard)await page.getByRole('button',{name:'Hard · 2× points',exact:true}).click();
  for(const [i,word]of puzzle.route.slice(1).entries()){
   if(hard){await page.getByLabel('Your next synonym').fill(word);await page.getByRole('button',{name:'Link word',exact:false}).click();}
   else await page.locator(`.tile[data-word="${word}"]`).click();
   if(i===0){const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('words-link.session.v1')));assert.equal(saved.path.length,2);await page.reload();await page.locator('.endpoints').waitFor();assert.equal(await page.locator('#mode-hard').isDisabled(),true);}
  }
  await page.locator('dialog[open]').waitFor();const history=await page.evaluate(()=>JSON.parse(localStorage.getItem('words-link.history.v1')));assert.equal(history.length,1);assert.deepEqual(history[0].route,puzzle.route);assert.equal(history[0].hard,hard);assert.equal(history[0].points,points(puzzle.route.length-2,puzzle.route.length-2,hard,false));await page.getByRole('button',{name:'Share results',exact:false}).click();assert.ok((await page.evaluate(()=>window.__shared)).includes('WordBridge'));
  await page.getByRole('button',{name:'Close dialog'}).click();await page.getByRole('button',{name:'Stats',exact:true}).click();assert.match(await page.locator('dialog').innerText(),/Recorded finishes/);await page.getByRole('button',{name:'Close dialog'}).click();await page.reload();await page.locator('.endpoints').waitFor();assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('words-link.history.v1')))).length,1);pass(`WordBridge ${hard?'Hard':'Normal'}: shared UI, complete route, unchanged score, refresh, stats and sharing`);await context.close();
 }
 {
  const {context,page}=await setup();await page.goto(base+'/wordbridge/');await page.locator('.endpoints').waitFor();await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByLabel('Color theme').selectOption('dark');await page.getByRole('button',{name:'Close dialog'}).click();await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');await page.locator('.endpoints').waitFor();await page.locator('.tile').first().click();await page.getByRole('button',{name:'Undo',exact:false}).click();assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('words-link.session.v1')))).path.length,1);await page.getByRole('button',{name:'Reveal route',exact:false}).click();await page.getByRole('button',{name:'Reveal route · 0 points',exact:true}).click();assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('words-link.session.v1')))).assisted,true);pass('WordBridge manual theme persists; undo and assisted reveal preserve prior rules');await context.close();
 }
 for(const width of [320,390,768,1440]){
  const {context,page}=await setup({viewport:{width,height:1100},colorScheme:width===390?'dark':'light',reducedMotion:'reduce'});await page.goto(base+'/wordbridge/');await page.locator('.endpoints').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);await page.screenshot({path:`/tmp/wordbridge-redesign-${width}.png`,fullPage:true});pass(`WordBridge ${width}px: responsive collection layout${width===390?', dark mode':''}`);await context.close();
 }
 {
  const {context,page}=await setup();const response=await page.goto(base+'/wordorbit/');assert.equal(response.status(),404);await page.goto(base+'/games/');assert.equal(await page.locator('[href="/wordorbit/"]').count(),0);assert.equal(await page.locator('.collection-card').count(),13);pass('Retired route is 404 and the collection contains thirteen active games');await context.close();
 }
 assert.deepEqual(errors,[]);pass('No uncaught WordBridge browser errors');console.log(`${checks} WordBridge/removal browser checks passed.`);
}finally{await browser.close();}
