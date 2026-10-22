import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.GAMES_TEST_URL||'http://127.0.0.1:8090';
const browser=await chromium.launch();
try {
 for(const game of ['fourthword','oddrule','semanticgravity','wordweave','wordbridge','lexiconlock','alibi','missingmove','tiletheory','wordfossil','negativelogic','paradoxbox','linebyline']) {
  const context=await browser.newContext({timezoneId:'Asia/Tokyo'}),page=await context.newPage();
  const key=game==='wordbridge'?'words-link.session.v1':`foxhollow.${game}.v1`;
  const state=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  await page.clock.install({time:new Date('2026-10-22T23:59:58Z')});await page.goto(`${base}/${game}/`);
  await page.waitForFunction(k=>!!localStorage.getItem(k),key);
  if(game==='wordbridge')assert.equal((await state()).day,'2026-10-22');else assert.ok((await state()).daily['2026-10-22']);
  await page.clock.setSystemTime(new Date('2026-10-23T00:00:01Z'));await page.clock.runFor(31000);
  if(game==='wordbridge')assert.equal((await state()).day,'2026-10-22');else {assert.equal((await state()).daily['2026-10-23'],undefined);assert.match(await page.locator('#countdown').innerText(),/03:59:2\d.*midnight New York time/);}
  await page.clock.setSystemTime(new Date('2026-10-23T04:00:01Z'));await page.clock.runFor(31000);
  await page.waitForFunction(({key,bridge})=>{const s=JSON.parse(localStorage.getItem(key));return bridge?s?.day==='2026-10-23':!!s?.daily['2026-10-23'];},{key,bridge:game==='wordbridge'});
  if(game!=='wordbridge')assert.ok((await state()).daily['2026-10-22']);
  console.log(`PASS ${game}: Tokyo player keeps same puzzle at UTC midnight, rolls at New York midnight`);
  await context.close();
 }
} finally {await browser.close();}
