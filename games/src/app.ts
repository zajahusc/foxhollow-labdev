import {readHard,writeHard} from './daily-options.js';
import {nextDailyReset} from './time.js';
import { bank, validateBank } from './data.js';
import { correct, nameRule, reveal, saveSession, session, share, statistics, submit, terminal, useHint, dailyDay } from './engine.js';
import { dailyPuzzle } from './schedule.js';
import { empty, key, load, store } from './storage.js';
import type { Game, SavedData, Session } from './types.js';
const game:Game=document.body.dataset.game==='oddrule'?'oddrule':'fourthword';
const fourth=game==='fourthword';
const title=fourth?'The Fourth Thing':'The Odd Rule';
const levels=fourth?['Obvious','Familiar','Tricky','Difficult','Expert']:['Easy','Normal','Hard','Expert','Master'];
const app=document.getElementById('app')!;
const dialog=document.getElementById('dialog') as HTMLDialogElement;
const toast=document.getElementById('toast')!;
const $=<T extends HTMLElement>(tag:string,text='',cls=''):T=>{const e=document.createElement(tag) as T;e.textContent=text;if(cls)e.className=cls;return e;};
function button(text:string,action:()=>void,cls=''):HTMLButtonElement {const b=$<HTMLButtonElement>('button',text,cls);b.type='button';b.onclick=action;return b;}
function link(text:string,href:string,cls=''):HTMLAnchorElement{const a=$<HTMLAnchorElement>('a',text,cls);a.href=href;return a;}
function label(text:string,control:HTMLElement){const l=$<HTMLLabelElement>('label',text);l.append(control);return l;}
function select<T extends string>(name:string,options:{value:T;text:string}[],value:T,onchange:(v:T)=>void):HTMLSelectElement {
 const e=$<HTMLSelectElement>('select');e.setAttribute('aria-label',name);
 for(const o of options){const opt=$<HTMLOptionElement>('option',o.text);opt.value=o.value;e.append(opt);}e.value=value;e.onchange=()=>onchange(e.value as T);return e;
}
let data:SavedData;try{data=load(game,localStorage);}catch{data=empty();}
let current:Session|null=null;
let dailyViewedDay=dailyDay();
let notice='',storageWarned=false,noticeTimeout:ReturnType<typeof setTimeout>|undefined;
function notify(message:string){toast.textContent=message;toast.classList.add('show');clearTimeout(noticeTimeout);noticeTimeout=setTimeout(()=>toast.classList.remove('show'),5000);}
function persist(){let ok=false;try{ok=store(game,data,localStorage);}catch{/* Some browsers deny access to storage itself. Keep the active visit playable. */}if(!ok&&!storageWarned){storageWarned=true;notify('Browser storage is unavailable. Progress lasts for this visit.');}}
function sync(){if(storageWarned)return;try{data=load(game,localStorage);}catch{/* Some browsers deny access to storage itself. Keep the active visit playable. */}}
function update(next:Session){
 sync();
 const locked=next.mode==='daily'?data.daily[next.day]:null;
 if(locked&&terminal(locked)){current=locked;render();return;}
 current=next;data=saveSession(data,next);persist();render();
}
function getDaily(){
 const day=dailyDay(),saved=data.daily[day];dailyViewedDay=day;
 if(saved){current=saved;return;}
 const p=dailyPuzzle(game,day);if(!p){current=null;return;}
 current={...session(p,'daily',day,0,data.settings.nameRule),hard:readHard(game),maxMistakes:readHard(game)?2:3};data=saveSession(data,current);persist();
}
function openModal(heading:string,content:Node[]){
 const old=document.activeElement as HTMLElement|null;
 dialog.replaceChildren();const top=$('div','','dialog-head'),h=$('h2',heading);h.id='dialog-title';
 const close=button('×',()=>dialog.close(),'icon close');close.setAttribute('aria-label','Close dialog');top.append(h,close);dialog.append(top,...content);dialog.setAttribute('aria-labelledby','dialog-title');
 if(!dialog.open)dialog.showModal();dialog.onclose=()=>old?.focus();
}
function confirm(heading:string,description:string,action:()=>void){
 const controls=$('div','','actions');controls.append(button('Cancel',()=>dialog.close(),'secondary'),button('Confirm',()=>{dialog.close();action();},'primary'));
 openModal(heading,[$('p',description),controls]);
}
function instructions(){
 const list=$('ol');const items=fourth?[
  'Find the hidden relationship connecting three clues. Choose the fourth item that follows it.',
  'Select an option, then lock it in. Some number puzzles ask you to type an answer under an explicit sequence constraint.',
  'Normal allows three wrong answers and optional hints. Hard allows two wrong answers and no hints.'
 ]:[
  'Five of the six cards follow a hidden rule. Select the one that breaks it, then lock in your answer.',
  'The obvious category can be a decoy. A smaller spelling or numerical property may be the real rule.',
  'Turn on Name the Rule in settings before your first move for a second step and a possible bonus.'
 ];for(const t of items)list.append($('li',t));
 openModal('A little way to play.',[list,$('h3','Every point explained'),$('p','Scores range from 0 to 100, with a base of 60 + 8 × difficulty level. Each wrong guess costs 15% of the original base. Hints cost 10%, 15%, then 20% of base. There is no time penalty, and scores stop at zero.'),
 $('p',fourth?'A reveal or exhausted attempts scores zero.':'Correctly naming the rule can add up to 25% of base, capped at 100 total points. A wrong rule choice costs 15% of base; you still complete the puzzle. Reveals score zero.'),$('h3','One day. One shared puzzle.'),$('p','Daily resets at midnight New York time. Everyone gets the same published assignment. Your first completed daily score is saved. Hard mode uses the same puzzle with fewer attempts and no hints.'),$('p','Spelling rules count A, E, I, O and U as vowels; Y is a consonant. Word meanings do not determine the spelling puzzles. Answers and rules are checked against the published rule catalog, not every possible interpretation.')]);
}
function settings(){
 const theme=select('Color theme',[{value:'system',text:'Follow device'},{value:'light',text:'Light'},{value:'dark',text:'Dark'}],data.settings.theme,v=>{data.settings.theme=v;persist();applyTheme();});
 const hard=select('Difficulty',[{value:'normal',text:'Normal'},{value:'hard',text:'Hard'}],readHard(game)?'hard':'normal',value=>{writeHard(game,value==='hard');if(current?.phase==='playing'&&!current.guesses.length&&!current.hints&&!current.selected){current={...current,hard:value==='hard',maxMistakes:value==='hard'?2:3};data=saveSession(data,current);persist();render();}else notify('Difficulty saved for your next daily. Today’s mode stays locked.');});
 const nodes:Node[]=[label('Difficulty',hard),$('p','Normal: three wrong answers. Hard: two wrong answers and no hints. Choose before you start; later changes apply to your next daily.','muted'),label('Appearance',theme)];
 if(!fourth){
  const toggle=$<HTMLInputElement>('input');toggle.type='checkbox';toggle.checked=data.settings.nameRule;toggle.id='name-rule-setting';
  toggle.onchange=()=>{
   data.settings.nameRule=toggle.checked;
   if(current?.phase==='playing'&&current.guesses.length===0&&current.hints===0){current={...current,nameRule:toggle.checked};data=saveSession(data,current);}
   persist();render();
  };
  nodes.push(label('Name the Rule · optional second step',toggle),$('p','Changes affect an untouched current puzzle or your next puzzle. A correct rule can add a bonus, capped at 100 total points.','muted'));
 }
 if(data.feedback.length)nodes.push(button(`View saved puzzle notes (${data.feedback.length})`,showNotes,'secondary'));
 nodes.push($('h3','Your browser, your progress'),$('p','Scores stay in this browser on this device. They do not sync to other devices. Clearing site data removes them.'),button('Reset this game’s saved data',()=>confirm('Delete all saved progress?','This removes this game’s scores, streak, active puzzles, settings and locally saved feedback. It cannot be undone.',()=>{data=empty();persist();notice='';getDaily();applyTheme();render();notify('Saved progress cleared.');}),'text-button danger'));
 openModal('Make it your own.',nodes);
}
function showNotes(){
 const list=$('ul','','evidence');for(const note of data.feedback)list.append($('li',`${note.puzzleId} · ${note.reason} · ${note.created.slice(0,10)}`));
 const text=data.feedback.map(n=>`${n.puzzleId}: ${n.reason}`).join('\n');
 openModal('Your saved puzzle notes.',[list,$('p','Saved on this device only. Copy these notes if you want to share them separately.','muted'),button('Copy notes',()=>{
  void (navigator.clipboard?navigator.clipboard.writeText(text):Promise.reject(Error('Clipboard unavailable'))).then(()=>notify('Notes copied.')).catch(()=>{const area=$<HTMLTextAreaElement>('textarea');area.value=text;area.readOnly=true;area.rows=7;openModal('Copy your notes.',[area]);area.select();});
 },'secondary')]);
}
function showStats(){
 const s=statistics(data),grid=$('div','','stats-grid');
 const entries:[string,string|number][]=[['Attempted',s.attempted],['Finished',s.completed],['Win rate',`${Math.round(s.winRate)}%`],['Daily streak',s.streak],['Longest streak',s.longest],['Total points',s.totalPoints],['Best score',s.best],['Average score',s.averageScore.toFixed(1)],['Average guesses',s.averageGuesses.toFixed(1)],['Average hints',s.averageHints.toFixed(1)]];
 for(const [name,value]of entries){const box=$('div');box.append($('strong',String(value)),$('span',name));grid.append(box);}
 const table=$('table'),caption=$('caption','By difficulty'),head=$('tr');for(const h of ['Difficulty','Finished','Wins','Points'])head.append($('th',h));table.append(caption,head);
 for(const row of s.byLevel){const tr=$('tr');for(const text of [levels[row.level-1]!,row.played,row.wins,row.points])tr.append($('td',String(text)));table.append(tr);}
 openModal('A record of small discoveries.',[grid,table,$('p','Win rate and averages use finished puzzles. Attempts include unfinished puzzles. Daily streaks count successful daily solves only, once per New York date.','muted')]);
}
function applyTheme(){document.documentElement.dataset.theme=data.settings.theme;}
function nextCountdown(){
 const el=document.getElementById('countdown');if(!el)return;
 const now=new Date(),next=nextDailyReset(now);
 const left=Math.max(0,Math.floor((next-now.getTime())/1000));
 const h=String(Math.floor(left/3600)).padStart(2,'0'),m=String(Math.floor(left%3600/60)).padStart(2,'0'),s=String(left%60).padStart(2,'0');
 el.textContent=`Next daily in ${h}:${m}:${s} · midnight New York time`;
}
function rollover(){
 if(dailyViewedDay!==dailyDay()){
  const wasActive=current&&!terminal(current);
  notice=wasActive?'A new day in New York has begun. Your unfinished prior-day progress remains saved; this is today’s puzzle.':'A fresh daily puzzle is ready.';
  getDaily();render();
 }
}
function lock(answer:string){
 if(!current)return;const originalDay=current.day;rollover();if(!current||current.day!==originalDay){notify('A new daily puzzle has started. Please choose again.');return;}
 const before=current;const next=submit(current,answer);
 if(next===before){notify('Choose a new answer before locking it in.');return;}
 notice=correct(next.puzzle,answer)?'':`Not quite. ${next.maxMistakes-next.guesses.length} ${next.maxMistakes-next.guesses.length===1?'attempt':'attempts'} remaining. Try a hint or another answer.`;
 update(next);focusAfterAnswer();
}
function focusAfterAnswer(){requestAnimationFrame(()=>{(document.getElementById('result-heading')||document.getElementById('rule-heading')||document.querySelector<HTMLButtonElement>('.answers button:not(:disabled)')||document.getElementById('free-answer'))?.focus();});}
function choose(value:string,id:string){if(!current||current.phase!=='playing')return;current={...current,selected:value};data=saveSession(data,current);persist();render();document.getElementById(id)?.focus();}
function answerButton(value:string,i:number,s:Session,cls='answer'){
 const b=button(value,()=>choose(value,`choice-${i}`),cls+(s.selected===value?' selected':''));b.id=`choice-${i}`;b.setAttribute('aria-pressed',String(s.selected===value));
 const wrong=s.guesses.some(g=>g.toLowerCase()===value.toLowerCase())&&!correct(s.puzzle,value);
 if(wrong){b.disabled=true;b.append($('span','× Tried','tried'));}
 return b;
}
function renderPlaying(s:Session,board:HTMLElement){
 const p=s.puzzle;
 if(p.game==='fourthword'){
  const clues=$('div','','clue-grid');p.clues.forEach((text,i)=>{const card=$('div','','clue-card');card.append($('span',String(i+1).padStart(2,'0'),'card-index'),$('strong',text));clues.append(card);});
  const mystery=$('div','','clue-card mystery');mystery.append($('span','04','card-index'),$('strong','?'));clues.append(mystery);board.append(clues);
  board.append($('h2','What’s the fourth thing?','question'),$('p',p.answerMode==='text'?p.constraint:'One option completes the hidden relationship.','prompt'));
  if(p.answerMode==='choice'){
   const answers=$('div','','answers');for(const [i,text]of p.choices.entries())answers.append(answerButton(text,i,s));board.append(answers);
   const lockButton=button('Lock in answer  ↗',()=>{if(current?.selected)lock(current.selected);},'primary lock');lockButton.disabled=!s.selected;lockButton.id='lock-answer';board.append(lockButton);
  }else{
   const form=$<HTMLFormElement>('form','','free-response'),input=$<HTMLInputElement>('input');input.id='free-answer';input.name='answer';input.type='text';input.autocomplete='off';input.spellcheck=false;input.placeholder='Your answer';input.setAttribute('aria-label','Your fourth item');input.inputMode='numeric';input.value=s.selected||'';
   input.oninput=()=>{if(current){current={...current,selected:input.value};data=saveSession(data,current);persist();}};
   const submitButton=$<HTMLButtonElement>('button','Lock in answer ↗','primary');submitButton.type='submit';
   form.onsubmit=e=>{e.preventDefault();lock(input.value);};form.append(input,submitButton);board.append(form);
  }
 }else{
  board.append($('h2','Which one breaks the rule?','question'),$('p','Five follow the same rule. Find the outsider.','prompt'));
  const grid=$('div','','odd-grid answers');p.items.forEach((text,i)=>grid.append(answerButton(text,i,s,'odd-card')));board.append(grid);
  const lockButton=button('Lock in answer  ↗',()=>{if(current?.selected)lock(current.selected);},'primary lock');lockButton.disabled=!s.selected;lockButton.id='lock-answer';board.append(lockButton);
  if(s.nameRule)board.append($('p','Name the Rule is on · solve the outsider, then identify the pattern.','bonus-note'));
 }
 const message=$('p',notice,'feedback');message.setAttribute('role','status');message.setAttribute('aria-live','polite');board.append(message);
 const helper=$('div','','helpers'),hint=button(s.hints<3?`A little hint · ${s.hints}/3`:'All hints shown',()=>{if(current){notice='';update(useHint(current));}},'secondary');hint.disabled=Boolean(s.hard)||s.hints>=3;
 helper.append(hint,button('Reveal answer',()=>confirm('Reveal this puzzle?','The explanation will be shown and this attempt will earn zero points.',()=>{if(current)update(reveal(current));focusAfterAnswer();}),'text-button'));board.append(helper);
 if(s.hints){const hints=$('ol','','hints');s.puzzle.hints.slice(0,s.hints).forEach(h=>hints.append($('li',h)));board.append(hints);}
 const guesses=$('p',`${s.guesses.length} of ${s.maxMistakes} attempts used${s.guesses.length?' · '+s.guesses.join(' / '):''}`,'guess-count');board.append(guesses);
}
function renderNaming(s:Session,board:HTMLElement){
 if(s.puzzle.game!=='oddrule')return;
 const h=$('h2','Outsider found. Name the rule.','question');h.id='rule-heading';h.tabIndex=-1;
 board.append($('div','◆','solved-mark'),h,$('p',`${s.puzzle.answer} breaks the pattern. Which rule do the other five follow?`,'prompt'));
 const options=$('div','','rule-choices');for(const option of s.puzzle.ruleChoices)options.append(button(option,()=>{if(current){update(nameRule(current,option));focusAfterAnswer();}},'answer rule-option'));
 board.append(options,$('p','One choice. Correct: +25% of base. Incorrect: −15% of base.','muted'));
}
async function shareResult(s:Session,spoilers=false){
 const text=share(s,spoilers);
 if(navigator.share){try{await navigator.share({text});return;}catch(e){if(e instanceof Error&&e.name==='AbortError')return;}}
 try{await navigator.clipboard.writeText(text);notify('Result copied. '+(spoilers?'Includes the answer.':'No spoilers.'));}
 catch{const area=$<HTMLTextAreaElement>('textarea');area.value=text;area.readOnly=true;area.rows=8;area.setAttribute('aria-label','Result to copy');openModal('Copy your result.',[area]);area.select();}
}
function feedback(s:Session){
 const reason=select('Feedback reason',[{value:'Ambiguous answer',text:'Ambiguous answer'},{value:'Incorrect fact',text:'Incorrect fact'},{value:'Unclear explanation',text:'Unclear explanation'},{value:'Difficulty mismatch',text:'Difficulty mismatch'},{value:'Other issue',text:'Other issue'}],'Ambiguous answer',()=>{});
 const text=$<HTMLTextAreaElement>('textarea');text.rows=3;text.maxLength=1000;text.placeholder='Optional notes';text.setAttribute('aria-label','Optional feedback notes');
 openModal('Keep a puzzle note.',[label('What felt off?',reason),text,$('p','This note is saved only in this browser. It is not sent to Foxhollow Labs. You can copy it to share separately.','muted'),button('Save note on this device',()=>{data.feedback.push({puzzleId:s.puzzle.id,reason:reason.value+(text.value?': '+text.value:''),created:new Date().toISOString()});persist();dialog.close();notify('Note saved on this device.');},'primary')]);
}
function renderResult(s:Session,board:HTMLElement){
 const won=s.phase==='solved',h=$('h2',won?'Correct! You solved it.':'Today’s answer.','result-title');h.tabIndex=-1;h.id='result-heading';
 const top=$('div','','result-top');top.append($('span',won?'◆ SOLVED':'◇ REVEALED','eyebrow'),$('strong',`${s.score} pts`,'result-score'));board.append(top,h);
 const details=$('details','','solution-details');details.append($('summary','How it works'));board.append(details);
 if(s.puzzle.game==='fourthword'){
  const row=$('div','','solution-row');for(const value of [...s.puzzle.clues,s.puzzle.answer])row.append($('span',value,value===s.puzzle.answer?'solution-answer':''));details.append(row);
 }else{
  const matches=$('div','','matching-items');for(const value of s.puzzle.items.filter(x=>x!==s.puzzle.answer))matches.append($('span',`✓ ${value}`));details.append(matches,$('p',`The odd one: ${s.puzzle.answer}`,'outsider'));
 }
 details.append($('h3',s.puzzle.relationship,'relationship'),$('p',s.puzzle.explanation));
 const evidence=$('ul','','evidence');for(const detail of s.puzzle.evidence)evidence.append($('li',detail));details.append(evidence);
 if(s.puzzle.game==='oddrule')details.append($('p',`The decoy: ${s.puzzle.decoy}`,'decoy'));
 if(s.ruleAnswer)details.append($('p',s.ruleAnswer===s.puzzle.relationship?'✓ Rule named correctly · bonus applied, capped at 100 points.':'Your rule choice did not match. This solve includes the 15% base penalty.','bonus-note'));
 details.append($('p',`${s.guesses.length} ${s.guesses.length===1?'guess':'guesses'} · ${s.hints} hints · Base ${60+s.puzzle.level*8} points. All penalties use the original base.`,'muted'));
 const actions=$('div','','actions');actions.append(button('Share result ↗',()=>{void shareResult(s);},'primary'),link('Explore more daily games ↗','/games/','secondary'));board.append(actions);
 const extras=$('div','','result-extras');extras.append(button('Share with answer',()=>confirm('Include the answer?','This version will reveal the puzzle’s answer and relationship to anyone you share it with.',()=>{void shareResult(s,true);}),'text-button'),button('Puzzle feedback',()=>feedback(s),'text-button'));board.append(extras);
}
function render(){
 const focused=(document.activeElement as HTMLElement|null)?.id;
 const content=document.createDocumentFragment();
 const top=$('div','','masthead');top.append(link('F.  FOXHOLLOW LABS','/','brand'));
 const tools=$('div','','toolbar');tools.append(button('?',instructions,'icon'),button('Stats',showStats,'tool'),button('Settings',settings,'tool'));tools.children[0]!.setAttribute('aria-label','How to play');top.append(tools);content.append(top);
 const switcher=$('nav','','game-switcher');switcher.setAttribute('aria-label','Games');switcher.append(link('All games','/games/'),link('WordBridge','/wordbridge/'),link('The Fourth Thing','/fourthword/',fourth?'active':''),link('The Odd Rule','/oddrule/',fourth?'':'active'),link('Semantic Gravity','/semanticgravity/'),link('Word Weave','/wordweave/'));content.append(switcher);
 const hero=$('header','','game-hero'),mark=$('div',fourth?'✦':'∴','game-mark');mark.setAttribute('aria-hidden','true');
 hero.append($('p','A FOXHOLLOW DAILY PUZZLE','eyebrow'),mark,$('h1',title),$('p',fourth?'Three belong together. What’s the fourth?':'Find the rule. Break the pattern.','tagline'));content.append(hero);
 const board=$('section','','board');board.setAttribute('aria-label','Puzzle');
 if(current){
  const edition=$('div','','edition'),left=$('span',`DAILY / ${current.day}`);
  edition.append(left,$('span',`${current.hard?'HARD':'NORMAL'} · ${current.puzzle.category}`,'difficulty'));board.append(edition);
  if(current.phase==='playing')renderPlaying(current,board);else if(current.phase==='naming')renderNaming(current,board);else renderResult(current,board);
 }else{
  board.append($('h2','The next chapter is being prepared.'),$('p','There is no published daily assignment for this New York date. Please check back tomorrow.'));
 }
 content.append(board);
 const foot=$('footer','','game-footer'),count=$('p','','countdown');count.id='countdown';
 foot.append(count,$('p','A few quiet minutes. A fresh way to think.'),link('Explore the puzzle collection ↗','/games/'),$('p','Saved on this browser · No account needed','muted'));content.append(foot);
 app.replaceChildren(content);nextCountdown();if(focused)document.getElementById(focused)?.focus();
}
try{validateBank(bank);applyTheme();getDaily();render();}catch(e){app.replaceChildren($('h1','Something needs another look.'),$('p',e instanceof Error?e.message:'The puzzle could not be loaded.'),link('Back to Foxhollow Labs','/'));}
setInterval(()=>{nextCountdown();rollover();},1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)rollover();});
window.addEventListener('storage',event=>{if(event.key===key(game)){sync();getDaily();notice='Progress updated from another tab.';render();}});
