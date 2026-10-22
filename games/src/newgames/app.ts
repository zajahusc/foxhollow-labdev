import {hash} from '../data.js';
import type {Level} from '../types.js';
import {orbitBank,activeOrbits,orbitGuess,orbitHint,validateOrbit} from './orbit.js';
import {gravityTargets} from './targets.js';
import {loadGravity,rank,gravityGuess,gravityHint,temperature,neighborHints} from './gravity.js';
import type {GravityModel,Ranking} from './gravity.js';
import {weaveBank} from './weave-bank.js';
import {slots,counts,editCell,undo,redo,submitWeave,validateWeave} from './weave.js';
import {dictionary} from './dictionary.js';
import {newSchedule} from './schedule.js';
import {blankSave,commit,decode,giveUp,initial,levels,names,normalize,puzzleId,resultText,shuffle,statistics,storageKey,utcDay} from './shared.js';
import type {NewGame,NewSession,OrbitSession,GravitySession,WeaveSession,WeaveMode,Save} from './types.js';
import type {WeaveRequest,WorkerReply} from './weave-worker.js';
import {el,button,link,select,label,modal,closeModal,confirm,notify,share,copy} from './ui.js';
const game:NewGame=document.body.dataset.game==='wordorbit'?'wordorbit':document.body.dataset.game==='semanticgravity'?'semanticgravity':'wordweave';
const app=document.getElementById('app')!;
let save:Save=blankSave(),s:NewSession|null=null,mode:'daily'|'practice'='daily',filterLevel:Level=2,filterTopic='Any',gridSize=4,weaveMode:WeaveMode='square';
let message='',lastGuess='',busy=false,storageBlocked=false,viewedDay=utcDay();
let gravityModel:GravityModel|null=null,ranking:Ranking|null=null,rankingId='',modelError='';
let worker:Worker|null=null,requestNumber=0;
const pending=new Map<number,{resolve:(r:WorkerReply)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
try{save=decode(localStorage.getItem(storageKey(game)),game);}catch{/* A blocked browser store does not prevent play. */}
function persist(){try{localStorage.setItem(storageKey(game),JSON.stringify(save));}catch{if(!storageBlocked)notify('Browser storage is unavailable. This visit remains playable, but cannot be saved.');storageBlocked=true;}}
function refreshSave(){if(storageBlocked)return;try{save=decode(localStorage.getItem(storageKey(game)),game);}catch{/* Retain the in-memory visit. */}}
function update(next:NewSession){refreshSave();const locked=next.mode==='daily'?save.daily[next.day]:null;if(locked&&locked.phase!=='playing'){s=locked;render();return;}s=next;save=commit(save,next);persist();render();}
function workerCall(request:Omit<Extract<WeaveRequest,{action:'generate'}>,'id'>|Omit<Extract<WeaveRequest,{action:'solve'|'candidates'}>,'id'>):Promise<WorkerReply>{
 if(!worker){worker=new Worker(new URL('./weave-worker.js',import.meta.url),{type:'module'});worker.onmessage=({data}:MessageEvent<WorkerReply>)=>{const item=pending.get(data.id);if(!item)return;clearTimeout(item.timer);pending.delete(data.id);if(data.error)item.reject(Error(data.error));else item.resolve(data);};worker.onerror=()=>{for(const item of pending.values()){clearTimeout(item.timer);item.reject(Error('The solver worker could not be loaded. Please reload.'));}pending.clear();worker?.terminate();worker=null;};}
 const id=++requestNumber;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error('The solver reached its time limit. Try a smaller grid.'));},25000);pending.set(id,{resolve,reject,timer});worker!.postMessage({...request,id});});
}
function hydrate(candidate:NewSession):NewSession{
 if(candidate.game==='wordorbit'&&!orbitBank.some(p=>p.id===candidate.puzzleId))throw Error('Saved Orbit publication is unavailable.');
 if(candidate.game==='semanticgravity'&&!gravityTargets.some(p=>p.id===candidate.puzzleId))throw Error('Saved Gravity publication is unavailable.');
 if(candidate.game==='wordweave'&&validateWeave(candidate.puzzle,false).length)throw Error('Saved grid has invalid constraints.');
 return candidate;
}
function daily(){
 const day=utcDay();viewedDay=day;const assignment=newSchedule[day]?.[game];
 if(save.daily[day]){try{s=hydrate(save.daily[day]!);return;}catch{delete save.daily[day];notify('An incompatible saved puzzle was reset.');}}
 if(!assignment){s=null;return;}
 const p=game==='wordweave'?weaveBank.find(p=>p.id===assignment.id):undefined;
 s=initial(game,assignment.id,assignment.level,'daily',0,p,save.dailyLimit);save=commit(save,s);persist();
}
async function newPractice(force=false){
 if(busy)return;
 if(!force&&s?.mode==='practice'&&s.phase==='playing'&&(s.guesses.length||s.hints||s.game==='wordweave'&&s.letters!==s.puzzle.givens)){
  confirm('Leave this practice puzzle?','This unfinished practice attempt will earn zero points. Daily streaks are unaffected.',()=>{if(s)update(giveUp(s));void newPractice(true);});return;
 }
 busy=true;render();try{
  save.serial++;const seed=`${game}-${save.serial}-${Date.now()}`;
  if(game==='wordorbit'){
   const pool=shuffle(orbitBank.filter(p=>filterTopic==='Any'||p.topic===filterTopic),seed),p=pool.find(p=>!save.recent.includes(p.id))||pool.find(p=>p.id!==save.recent[0])||pool[0];
   if(!p)throw Error('No Orbit puzzle matches this theme.');s=initial(game,p.id,filterLevel,'practice',save.serial);
  }else if(game==='semanticgravity'){
   const pool=shuffle(gravityTargets.filter(p=>p.level===filterLevel&&(filterTopic==='Any'||p.category===filterTopic)),seed),p=pool.find(p=>!save.recent.includes(p.id))||pool.find(p=>p.id!==save.recent[0])||pool[0];
   if(!p)throw Error('No target matches these filters. Try another category or difficulty.');s=initial(game,p.id,p.level,'practice',save.serial);
  }else{
   const pool=shuffle(weaveBank.filter(p=>p.level===filterLevel&&p.size===gridSize&&p.mode===weaveMode),seed);
   let p=pool.find(p=>!save.recent.includes(p.id));
   if(!p){for(let retry=0;retry<8;retry++){const r=await workerCall({action:'generate',size:gridSize,mode:weaveMode,level:filterLevel,seed:seed+'-'+retry});const candidate=r.puzzle;if(candidate&&!save.recent.includes('grid-'+hash(candidate.layout+'|'+candidate.solution))){p=candidate;break;}}}
   if(!p||validateWeave(p,false).length)throw Error('A valid puzzle could not be generated.');
   s=initial(game,p.id,p.level,'practice',save.serial,p);
  }
  mode='practice';save=commit(save,s);persist();message='';rankingId='';
 }catch(e){notify(e instanceof Error?e.message:'Could not start a new puzzle.');}finally{busy=false;render();}
}
function switchMode(next:'daily'|'practice'){
 if(busy||next===mode)return;mode=next;message='';rankingId='';if(mode==='daily')daily();else if(save.practice){try{s=hydrate(save.practice);}catch{s=null;}}else s=null;
 if(mode==='practice'&&!s){void newPractice(true);return;}render();
}
function rollover(){if(mode==='daily'&&viewedDay!==utcDay()){daily();message='A new UTC daily puzzle is ready. Your previous progress remains saved.';rankingId='';render();}}
function stillCurrent(key:string){rollover();return s?.key===key&&s.phase==='playing';}
function applyTheme(){document.documentElement.dataset.theme=save.theme;}
function settings(){
 const theme=select('Color theme',[['system','Follow device'],['light','Light'],['dark','Dark']],save.theme,v=>{save.theme=v as Save['theme'];persist();applyTheme();});
 const nodes:Node[]=[label('Appearance',theme),el('p','Scores and active puzzles stay in this browser. There is no account or device sync.','muted')];
 if(game==='semanticgravity')nodes.push(label('Daily guess limit',select('Daily guess limit',[['0','Use target difficulty'],['10','10 guesses'],['15','15 guesses'],['20','20 guesses'],['25','25 guesses'],['30','30 guesses'],['50','50 guesses']],String(save.dailyLimit||0),value=>{save.dailyLimit=Number(value)||null;if(s?.game==='semanticgravity'&&s.mode==='daily'&&!s.guesses.length&&!s.hints&&s.phase==='playing'){s={...s,limit:save.dailyLimit||[25,20,15,12,10][s.level-1]!};save=commit(save,s);}persist();render();})),el('p','Applies to an untouched daily or the next daily. Practice has unlimited guesses. Limits are initial estimates, not player-calibrated.','muted'));
 if(s?.game==='wordweave'){
  const toggle=el<HTMLInputElement>('input');toggle.type='checkbox';toggle.checked=s.feedback;toggle.onchange=()=>{if(s?.game==='wordweave')update({...s,feedback:toggle.checked});};nodes.push(label('Show completed-word dictionary feedback',toggle));
 }
 if(save.feedback.length)nodes.push(button(`View saved alternatives (${save.feedback.length})`,()=>{const notes=save.feedback.map(x=>`${x.puzzleId}: ${x.guess}`).join('\n');modal('Alternatives saved on this device.',[el('p','These notes have not been sent to Foxhollow Labs.'),el('p',notes),button('Copy notes',()=>{void copy(notes);})]);}));
 nodes.push(button('Reset this game’s saved data',()=>confirm('Delete saved progress?','This removes this game’s scores, streaks, active puzzles, settings and locally saved alternatives. It cannot be undone.',()=>{save=blankSave();persist();mode='daily';daily();applyTheme();render();}),'text-button danger'));
 modal('Make it your own.',nodes);
}
function showStats(){const stats=statistics(save),grid=el('div','','stats-grid');for(const [k,v]of Object.entries({Attempted:stats.attempted,Finished:stats.finished,Wins:stats.wins,'Win rate':stats.winRate+'%','Daily streak':stats.streak,'Longest streak':stats.longest,'Total points':stats.total,'Best score':stats.best,'Average score':stats.average})){const box=el('div');box.append(el('strong',String(v)),el('span',k));grid.append(box);}modal('A record of small discoveries.',[grid,el('p','Finished includes solves and reveals. Streaks count successful UTC daily solves only, once per date. Practice does not affect daily streaks.','muted')]);}
function tutorial(){
 const intro=game==='wordorbit'?'Enter different kinds of connection to the center word. Guided levels show categories; hidden levels reveal each category when solved. Choose a node to direct its hints.':game==='semanticgravity'?'Guess a word and use its semantic rank to move closer. Rank #1 is the target. Words outside the supported vocabulary do not use an attempt.':'Fill every row and column run with a dictionary word. A fixed starting word anchors the grid. Intersections share letters; Letter Weave also requires the exact supplied inventory.';
 const input=el<HTMLInputElement>('input');input.setAttribute('aria-label','Tutorial answer');input.placeholder=game==='wordorbit'?'Try SUN':game==='semanticgravity'?'Try MOUNTAIN':'Try R';
 const feedback=el('p','','tutorial-feedback');feedback.setAttribute('role','status');
 const demoTarget=gravityTargets.find(x=>x.word==='ocean')||gravityTargets[0]!;
 const demo=game==='wordorbit'?'Example center: STAR. Category: Astronomy. Find its nearest familiar example.':game==='semanticgravity'?`Example target (revealed for this tutorial): ${demoTarget.word.toUpperCase()}. Try a guess and see its real model rank.`:'Example grid: CAT / A?E / TEN. The central letter completes ARE both across and down.';
 const tryButton=button('Try the example',()=>{
  if(game==='wordorbit'){const demo=orbitBank[0]!.orbits[0]!;feedback.textContent=demo.accepted.includes(normalize(input.value))?'◆ Connected! SUN fills Astronomy. A celebrity would fill a different orbit.':'Try SUN. Each orbit has an explicit approved-answer list.';}
  else if(game==='semanticgravity'){
   if(!gravityModel){feedback.textContent='The real vector model is loading. Try again shortly.';void ensureModel();return;}
   const t=demoTarget,r=rank(gravityModel,t),position=r.ranks.get(normalize(input.value));feedback.textContent=position?`Rank #${position} of ${r.ordered.length} · ${temperature(position,r.ordered.length)}. This is real cosine-ranked feedback, not letter matching.`:'Outside the supported vocabulary. No attempt would be used.';
  }else feedback.textContent=normalize(input.value)==='r'?'◆ R completes both ARE runs. Each letter constrains two words.':'Try R. It makes ARE horizontally and vertically.';
 });
 modal('Try a little discovery.',[el('p',intro),el('p',demo),input,tryButton,feedback,el('h3','Scoring'),el('p',game==='wordorbit'?'100 points per orbit, +150 for a no-hint solve. An unlisted guess costs 10; per-orbit hints cost 15, then 25, then 40. Scores stop at zero. Expert has six hint steps total; Master has eight.':game==='semanticgravity'?'1,000 base points. Each valid wrong guess costs 20. Hints cost 100, 150, then 200. Duplicate and unsupported guesses cost nothing. Reveals and failed dailies score zero.':'Base 300 / 500 / 750 / 1,000 / 1,500 by difficulty. Validity, candidate and letter hints cost 5%, 10%, 20% of original base per use. An incorrect final submission costs 5%. No hints and no incorrect submissions each add 10%. Reveals score zero.'),el('p','Daily resets at 00:00 UTC. Practice has separate progress. This example does not change your scores.','muted')]);
}
async function ensureModel(){
 if(gravityModel||busy&&game!=='semanticgravity')return;
 if(modelError)return;modelError='loading';render();
 try{gravityModel=await loadGravity();modelError='';rankingId='';render();}catch(e){modelError=e instanceof Error?e.message:'Could not load model.';render();}
}
function fieldForm(placeholder:string,submit:(value:string)=>void):HTMLFormElement{
 const form=el<HTMLFormElement>('form','','guess-form'),input=el<HTMLInputElement>('input');input.id='guess';input.name='guess';input.placeholder=placeholder;input.autocomplete='off';input.spellcheck=false;input.setAttribute('aria-label','Your guess');
 const send=el<HTMLButtonElement>('button','Send guess ↗','primary');send.type='submit';form.append(input,send);form.onsubmit=e=>{e.preventDefault();const value=input.value;submit(value);};return form;
}
function flagAlternative(){const guess=lastGuess||s?.guesses.at(-1)||'';modal('Keep a connection for review.',[el('p',`Your alternative: ${guess}`),el('p','A word can be reasonable without appearing in the approved answer list. This note stays on this device; it is not sent to Foxhollow Labs. Copy it if you want to share it separately.'),button('Save alternative on this device',()=>{if(s){save.feedback.push({puzzleId:puzzleId(s),guess,date:utcDay()});persist();closeModal();notify('Alternative saved on this device.');}},'primary')]);}
function orbitView(state:OrbitSession,board:HTMLElement){
 const p=orbitBank.find(p=>p.id===state.puzzleId)!;const orbits=activeOrbits(p,state.level),done=state.phase!=='playing';
 board.append(el('p',`${Object.keys(state.filled).length} / ${orbits.length} connections · ${state.level<=2?'Guided Orbit':'Blind Orbit'}`,'puzzle-subtitle'));
 const field=el('div','','orbit-constellation'),center=el('div',p.center,'orbit-center');field.setAttribute('aria-label','Central word and connection categories');field.append(center);
 orbits.forEach((o,i)=>{
  const completed=Boolean(state.filled[o.id]),showCategory=done||completed||state.level<=2||(state.assistance[o.id]||0)>0;
  const node=button('',()=>{if(done)modal(`${p.center.toUpperCase()} → ${o.answer.toUpperCase()}`,[el('p',o.explanation),link('Dictionary source ↗',o.source)]);else{update({...state,active:o.id});document.getElementById('orbit-hint')?.focus();}},'orbit-node'+(completed?' filled':'')+(state.active===o.id?' selected':''));
  node.style.left=`${50+38*Math.cos(-Math.PI/2+i*2*Math.PI/orbits.length)}%`;node.style.top=`${50+39*Math.sin(-Math.PI/2+i*2*Math.PI/orbits.length)}%`;
  node.append(el('span',showCategory?o.category:`Orbit ${i+1}`,'orbit-category'),el('strong',done?o.answer:completed?state.filled[o.id]!:'?'));
  node.setAttribute('aria-pressed',String(state.active===o.id));node.setAttribute('aria-label',`${showCategory?o.category:`Hidden orbit ${i+1}`}: ${done?o.answer:completed?state.filled[o.id]:'incomplete'}`);field.append(node);
 });board.append(field);
 if(done)return;
 board.append(fieldForm('Find a connection…',raw=>{
  const key=state.key;if(!stillCurrent(key))return;lastGuess=raw;const result=orbitGuess(state,p,raw);message=result.message;update(result.session);document.getElementById('guess')?.focus();
 }));
 const selected=orbits.find(o=>o.id===state.active&&!state.filled[o.id])||orbits.find(o=>!state.filled[o.id]);
 if(selected){
  const amount=state.assistance[selected.id]||0;const hint=button(`Hint for ${state.level<=2||amount?selected.category:'selected orbit'} · ${amount}/3`,()=>{if(s?.game==='wordorbit'){const next=orbitHint(s,selected.id,p);if(next===s)notify('This level’s hint allowance has been used.');else{message='';update({...next,active:selected.id});}}},'secondary');hint.id='orbit-hint';hint.disabled=amount>=3;
  board.append(hint);if(amount){const list=el('ol','','hints');list.append(el('li',`Category: ${selected.category}`));if(amount>=2)list.append(el('li',selected.clue));if(amount>=3)list.append(el('li',`Primary answer starts with ${selected.answer[0]!.toUpperCase()} and has ${selected.answer.replace(/ /g,'').length} letters, excluding spaces.`));board.append(list);}
 }
 if(lastGuess&&message.startsWith('That word'))board.append(button('Flag a reasonable alternative',flagAlternative,'text-button'));
 if(state.guesses.length)board.append(el('p','Tried: '+state.guesses.join(' · '),'guess-count'));
}
function rankingInfo(){
 modal('A real rank, within a bounded vocabulary.',[el('p',`Each guess is compared with the target using cosine similarity between 50-dimensional pretrained GloVe word vectors. Rank #1 is the target; #2 is the next closest supported word. This edition contains ${gravityModel?.vocabulary.words.length||6028} words.`),el('p','Temperature bands: closest 0.1% extremely hot; 1% very hot; 5% hot; 15% warm; 40% cool; the rest cold. These describe ranks in this vocabulary, not human similarity percentages.'),el('p','The diagram shows only distance to the target. Angular positions are illustrative, not pairwise semantic distances. General embeddings blend word senses and reflect their training corpus; unexpected associations can occur.'),link('Model source and license ↗','/games/data/NEW-GAMES-SOURCES.md'),button('Explore supported vocabulary',showVocabulary)]);
}
function showVocabulary(){
 if(!gravityModel)return;const search=el<HTMLInputElement>('input');search.placeholder='Search supported words';search.setAttribute('aria-label','Search supported vocabulary');const list=el('p','','word-list');
 const refresh=()=>{const matches=gravityModel!.vocabulary.words.filter(w=>w.includes(normalize(search.value)));list.textContent=`${matches.length} matches. ${matches.slice(0,80).join(' · ')}${matches.length>80?' · …':''}`;};search.oninput=refresh;refresh();modal('The supported vocabulary.',[search,list]);
}
function gravityView(state:GravitySession,board:HTMLElement){
 const target=gravityTargets.find(p=>p.id===state.puzzleId)!;const done=state.phase!=='playing';
 if(!gravityModel){
  const loading=el('p',modelError&&modelError!=='loading'?modelError:'Loading the frozen semantic model…','model-status');loading.setAttribute('role','status');board.append(loading);
  if(modelError&&modelError!=='loading')board.append(button('Retry model download',()=>{modelError='';void ensureModel();},'primary'));else if(!modelError)queueMicrotask(()=>{void ensureModel();});return;
 }
 if(rankingId!==target.id){ranking=rank(gravityModel,target);rankingId=target.id;}
 const r=ranking!,sorted=[...state.ranks].sort((a,b)=>a.rank-b.rank),best=sorted[0];
 const field=el('div','','gravity-field');field.setAttribute('aria-hidden','true');for(let i=1;i<=3;i++){const ring=el('div','','gravity-ring');ring.style.width=`${i*28}%`;ring.style.height=`${i*28}%`;field.append(ring);}
 field.append(el('div',done?target.word:'?','gravity-center'));
 for(const item of sorted.slice(0,8)){
  const pct=(item.rank-1)/(r.ordered.length-1),radius=item.rank===1?0:10+Math.pow(pct,.45)*33,angle=hash(item.word)/4294967296*Math.PI*2;
  if(item.rank===1)continue;const node=el('span',item.word,'gravity-node');node.style.left=`${50+radius*Math.cos(angle)}%`;node.style.top=`${50+radius*Math.sin(angle)}%`;field.append(node);
 }board.append(field,el('p','Radius shows proximity to the target. Angles are illustrative. Closest eight guesses shown.','viz-caption'));
 if(best)board.append(el('p',`Best so far: ${best.word.toUpperCase()} · #${best.rank} · ${temperature(best.rank,r.ordered.length)}`,'best-guess'));
 if(!done){
  board.append(fieldForm('Follow a semantic clue…',raw=>{if(!stillCurrent(state.key))return;const result=gravityGuess(state,target,r,raw);message=result.message;update(result.session);document.getElementById('guess')?.focus();}));
  const hint=button(`A gravitational nudge · ${state.hints}/3`,()=>{if(s?.game==='semanticgravity'){message='';update(gravityHint(s));}},'secondary');hint.disabled=state.hints>=3;board.append(hint);
  if(state.hints){const hints=neighborHints(target,r),list=el('ol','','hints');list.append(el('li',`General category: ${target.category}`));if(state.hints>=2)list.append(el('li',`Model neighbor #${target.hintRanks[0]}: ${hints[0]}`));if(state.hints>=3)list.append(el('li',`Model neighbor #${target.hintRanks[1]}: ${hints[1]}`));board.append(list);}
  board.append(el('p',state.limit===null?`${state.guesses.length} guesses · unlimited practice`:`${state.guesses.length} / ${state.limit} guesses used`,'guess-count'));
 }
 if(sorted.length){
  const table=el('table'),caption=el('caption','All guesses, closest first'),header=el('tr');for(const text of ['Word','Rank','Feedback','Improvement'])header.append(el('th',text));table.append(caption,header);
  let previous=Infinity;const improvements=new Map<string,string>();for(const item of state.ranks){improvements.set(item.word,Number.isFinite(previous)&&item.rank<previous?`↑ ${previous-item.rank}`:'—');previous=Math.min(previous,item.rank);}
  for(const item of sorted){const row=el('tr');for(const value of [item.word,`#${item.rank} / ${r.ordered.length}`,temperature(item.rank,r.ordered.length),improvements.get(item.word)!])row.append(el('td',value));table.append(row);}board.append(table);
 }
 if(done){
  const wrong=sorted.filter(x=>x.word!==target.word);let bestPrior=Infinity,biggest=0;for(const item of state.ranks){if(Number.isFinite(bestPrior))biggest=Math.max(biggest,bestPrior-item.rank);bestPrior=Math.min(bestPrior,item.rank);}
  board.append(el('p',`Target: ${target.word.toUpperCase()}. Closest incorrect guess: ${wrong[0]?`${wrong[0].word} (#${wrong[0].rank})`:'none'}. Biggest improvement: ${Math.max(0,biggest)} places.`));
 }
 board.append(button('How ranks work · vocabulary',rankingInfo,'text-button'));
}
function selectCell(state:WeaveSession,index:number,touch=false){if(state.puzzle.layout[index]==='#')return;s={...state,selected:index};save=commit(save,s);persist();render();document.getElementById(touch?'weave-entry':`cell-${index}`)?.focus({preventScroll:true});}
function weaveView(state:WeaveSession,board:HTMLElement){
 const p=state.puzzle,done=state.phase!=='playing';
 board.append(el('p',`${p.size} × ${p.size} · ${p.mode==='free'?'Free Weave · any valid completion':p.mode==='letter'?'Letter Weave':p.mode==='cross'?'Cross Weave':'Word Square'} · ${p.unique?'unique completion':'multiple completions allowed'}`,'puzzle-subtitle'));
 const rules=el('p',`Every across/down run must be a word in the same ${dictionary.length}-word dictionary. ${p.constraints.noRepeat?'No repeated words.':'A word may appear more than once.'}${p.inventory!==null?' Use the supplied letter inventory exactly once.':''}`,'weave-rules');board.append(rules);
 const grid=el('div','','weave-grid');grid.style.setProperty('--size',String(p.size));grid.setAttribute('role','grid');grid.setAttribute('aria-label','Word Weave letter grid');
 for(let row=0;row<p.size;row++){
  const line=el('div','','weave-row');line.setAttribute('role','row');
  for(let col=0;col<p.size;col++){
   const index=row*p.size+col,blocked=p.layout[index]==='#',fixed=p.givens[index]!=='.'||Boolean(state.hintLetters[index]),value=state.letters[index]!;
   const cell=button('',()=>selectCell(state,index),'weave-cell'+(blocked?' blocked':'')+(fixed?' fixed':'')+(state.selected===index?' current':'')+(Math.floor(state.selected/p.size)===row||state.selected%p.size===col?' intersects':''));cell.id=`cell-${index}`;cell.setAttribute('role','gridcell');cell.tabIndex=state.selected===index?0:-1;
   cell.setAttribute('aria-label',blocked?'Blocked cell':`Row ${row+1}, column ${col+1}, ${value==='.'?'empty':value.toUpperCase()}${fixed?', fixed':''}${state.notes[index]?`, pencil ${state.notes[index]}`:''}`);cell.setAttribute('aria-readonly',String(fixed));cell.setAttribute('aria-selected',String(state.selected===index));
   if(blocked){cell.disabled=true;cell.tabIndex=-1;}else{
    if(value!=='.')cell.append(el('strong',value.toUpperCase()));else if(state.notes[index])cell.append(el('span',state.notes[index]!.toUpperCase().split('').join(' '),'pencil-notes'));
    cell.onclick=e=>selectCell(state,index,'pointerType' in e&&e.pointerType==='touch');
   }
   line.append(cell);
  }grid.append(line);
 }
 board.append(grid);
 if(p.inventory!==null){
  const available=counts(p.inventory),used=counts([...state.letters].filter((_,i)=>p.givens[i]==='.').join('')),inventory=el('div','','letter-inventory');inventory.setAttribute('aria-label','Remaining letter inventory');
  for(const letter of Object.keys(available).sort()){const left=available[letter]!-(used[letter]||0),tile=button(`${letter.toUpperCase()} ×${left}`,()=>{if(s?.game==='wordweave')update(editCell(s,s.selected,letter));},'inventory-tile');tile.disabled=done||left<=0;inventory.append(tile);}board.append(el('p','Remaining tiles','eyebrow'),inventory);
 }
 if(done){showWords(state,board);return;}
 const entry=el<HTMLInputElement>('input');entry.id='weave-entry';entry.setAttribute('aria-label','Letter for selected cell');entry.autocomplete='off';entry.autocapitalize='characters';entry.spellcheck=false;entry.maxLength=1;entry.placeholder='A–Z';
 entry.oninput=()=>{if(s?.game==='wordweave'){const next=editCell(s,s.selected,entry.value);if(next===s&&entry.value)notify('This letter is fixed or unavailable in the inventory.');update(next);document.getElementById('weave-entry')?.focus({preventScroll:true});}};
 const controls=el('div','','weave-tools'),pen=button(state.pencil?'Pencil ✓':'Pen ✓',()=>update({...state,pencil:!state.pencil}),'secondary');pen.setAttribute('aria-pressed',String(state.pencil));
 controls.append(label('Selected cell',entry),pen,button('Undo',()=>update(undo(state))),button('Redo',()=>update(redo(state))),button('Clear notes',()=>update({...state,notes:{}})));
 controls.children[2]!.toggleAttribute('disabled',!state.past.length);controls.children[3]!.toggleAttribute('disabled',!state.future.length);board.append(controls);
 const assists=el('div','','weave-assists');
 assists.append(button('Check progress · 5%',()=>{void weaveHint(0);}),button('Cell candidates · 10%',()=>{void weaveHint(1);}),button('Reveal letter · 20%',()=>{void weaveHint(2);}));
 for(const b of assists.querySelectorAll('button'))b.disabled=busy;board.append(assists);
 const actions=el('div','','actions');actions.append(button('Reset entries',()=>confirm('Reset your entries?','The starting word and revealed hint letters stay fixed. Hint penalties and incorrect submissions remain.',()=>{if(s?.game==='wordweave'){const letters=[...s.puzzle.givens];for(const [i,c]of Object.entries(s.hintLetters))letters[Number(i)]=c;update({...s,letters:letters.join(''),notes:{},past:[],future:[]});}})),button('Submit weave ↗',()=>{
  if(s?.game!=='wordweave')return;const result=submitWeave(s);message=result.issues.length?result.issues.join(' '):'Every crossing is valid. A complete weave!';update(result.session);
 },'primary'));board.append(actions);
 if(state.feedback)showWords(state,board);board.append(button('Browse this puzzle dictionary',showWeaveDictionary,'text-button'));
}
function showWords(state:WeaveSession,board:HTMLElement){
 const list=el('div','','weave-word-status');for(const slot of slots(state.puzzle.layout,state.puzzle.size)){
  const word=slot.cells.map(i=>state.letters[i]).join(''),complete=!word.includes('.'),valid=complete&&dictionary.includes(word);
  const item=button(`${slot.direction==='across'?'→':'↓'} ${word.replace(/\./g,'_').toUpperCase()}${complete?valid?' ✓ word':' × outside dictionary':''}`,()=>{selectCell(state,slot.cells[0]!);},'word-status'+(complete&&!valid?' invalid':''));list.append(item);
 }board.append(list,el('p','A dictionary-valid run can still conflict with another crossing. A ✓ does not reveal the intended solution.','muted'));
}
function showWeaveDictionary(){const search=el<HTMLInputElement>('input');search.placeholder='Search words or use ? for one letter';search.setAttribute('aria-label','Search Weave dictionary');const list=el('p','','word-list');const run=()=>{const input=normalize(search.value);const filtered=dictionary.filter(w=>input.includes('?')?w.length===input.length&&[...input].every((c,i)=>c==='?'||w[i]===c):w.includes(input));list.textContent=`${filtered.length} words: ${filtered.slice(0,120).join(' · ')}${filtered.length>120?' · …':''}`;};search.oninput=run;run();modal('The puzzle dictionary.',[el('p','The same versioned common-word list is used by every Weave puzzle. Case does not matter. Proper nouns, abbreviations and uncommon terms are excluded by the published filtering policy. Use ? to find candidates without spending a solver hint.'),search,list,link('Dictionary sources and policy ↗','/games/data/NEW-GAMES-SOURCES.md')]);}
async function weaveHint(type:0|1|2){
 if(s?.game!=='wordweave'||s.phase!=='playing'||busy)return;const state=s;const key=state.key;
 let cell=state.selected;if(state.puzzle.givens[cell]!=='.'||state.hintLetters[cell])cell=[...state.puzzle.givens].findIndex((c,i)=>c==='.'&&!state.hintLetters[i]&&state.letters[i]==='.');
 if(type!==0&&cell<0){notify('Choose an editable cell, or submit the completed grid.');return;}
 busy=true;render();try{
  if(type===0){const result=await workerCall({action:'solve',puzzle:state.puzzle,letters:state.letters,cell});if(!stillCurrent(key))return;
   message=result.issues?.length?result.issues.join(' '):result.solutions?.length?'At least one valid completion remains. This is consistency feedback, not a revealed answer.':result.exhausted?'These entries create a contradiction: no valid completion remains. Revisit the intersecting rows and columns.':'Search limit reached; consistency could not be determined.';
  }else if(type===1){const result=await workerCall({action:'candidates',puzzle:state.puzzle,letters:state.letters,cell});if(!stillCurrent(key))return;
   message=`Row ${Math.floor(cell/state.puzzle.size)+1}, column ${cell%state.puzzle.size+1}: solver-confirmed candidates ${result.letters?.join(', ').toUpperCase()||'none'}.${result.unknown?.length?' Search inconclusive for '+result.unknown.join(', ').toUpperCase()+'.':''}`;
  }else{
   const result=await workerCall({action:'solve',puzzle:state.puzzle,letters:state.letters,cell});if(!stillCurrent(key))return;
   let witness=result.solutions?.[0];if(!witness){const fromGivens=await workerCall({action:'solve',puzzle:state.puzzle,letters:state.puzzle.givens,cell});witness=fromGivens.solutions?.[0];}
   if(!witness)throw Error('A valid completion could not be found. No hint charged.');if(!stillCurrent(key))return;
   const letters=[...state.letters];letters[cell]=witness[cell]!;s={...state,letters:letters.join(''),hintLetters:{...state.hintLetters,[cell]:witness[cell]!},past:[],future:[],notes:{...state.notes,[cell]:''},selected:cell};
   message=`Revealed ${witness[cell]!.toUpperCase()} at row ${Math.floor(cell/state.puzzle.size)+1}, column ${cell%state.puzzle.size+1}, from a solver-verified completion. Undo history cleared to preserve this fixed hint.`;
  }
  if(s?.game==='wordweave'&&s.key===key){const n=[...s.hintsByType] as [number,number,number];n[type]++;s={...s,hints:s.hints+1,hintsByType:n,selected:cell>=0?cell:s.selected};save=commit(save,s);persist();}
 }catch(e){notify(e instanceof Error?e.message:'The hint could not be computed. No hint charged.');}finally{busy=false;render();}
}
function resultView(state:NewSession,board:HTMLElement){
 const heading=el('h2',state.phase==='solved'?'A little discovery.':'Now the pattern is visible.','result-title');heading.id='result-heading';heading.tabIndex=-1;
 const top=el('div','','result-top');top.append(el('span',state.phase==='solved'?'◆ SOLVED':'◇ REVEALED','eyebrow'),el('strong',`${state.score} pts`,'result-score'));board.append(top,heading);
 const minutes=Math.floor(((state.finished||Date.now())-state.started)/60000),seconds=Math.max(0,Math.floor(((state.finished||Date.now())-state.started)/1000)%60),stats=statistics(save);
 board.append(el('p',`${levels[state.level-1]} · ${minutes}m ${seconds}s · ${state.hints} hints · ${state.game==='wordweave'?state.mistakes+' incorrect submissions':state.guesses.length+' guesses'} · Daily streak ${stats.streak}`,'muted'));
 if(state.game==='wordorbit')orbitView(state,board);else if(state.game==='semanticgravity')gravityView(state,board);else{
  const displayed=state.phase==='failed'?{...state,letters:state.puzzle.solution}:state;weaveView(displayed,board);
  const formed=slots(state.puzzle.layout,state.puzzle.size).map(slot=>slot.cells.map(i=>displayed.letters[i]).join(''));board.append(el('p',`${formed.length} words formed. Longest: ${formed.reduce((a,b)=>b.length>a.length?b:a,'').toUpperCase()}. ${state.phase==='failed'?'The displayed grid is an example valid completion.':''}`));
 }
 const actions=el('div','','actions');actions.append(button('Share result ↗',()=>{void share(resultText(state));},'primary'),button('Play another',()=>{mode='practice';void newPractice(true);}));board.append(actions);
}
function render(){
 const focus=(document.activeElement as HTMLElement|null)?.id,fragment=document.createDocumentFragment();
 const top=el('div','','masthead'),tools=el('div','','toolbar');top.append(link('F.  FOXHOLLOW LABS','/','brand'));tools.append(button('?',tutorial,'icon'),button('Stats',showStats,'tool'),button('Settings',settings,'tool'));tools.children[0]!.setAttribute('aria-label','How to play');top.append(tools);fragment.append(top);
 const nav=el('nav','','game-switcher');nav.setAttribute('aria-label','Game collection');nav.append(link('All games','/games/'));for(const g of ['wordorbit','semanticgravity','wordweave']as NewGame[])nav.append(link(names[g],`/${g}/`,g===game?'active':''));fragment.append(nav);
 const header=el('header','','game-hero'),mark=el('div',game==='wordorbit'?'◎':game==='semanticgravity'?'✺':'▦','game-mark');mark.setAttribute('aria-hidden','true');header.append(el('p','A FOXHOLLOW DAILY PUZZLE','eyebrow'),mark,el('h1',names[game]),el('p',game==='wordorbit'?'One word. Many connections.':game==='semanticgravity'?'Every guess pulls you closer.':'Every letter changes everything.','tagline'));fragment.append(header);
 const tabs=el('nav','','mode-tabs');tabs.setAttribute('aria-label','Play mode');for(const m of ['daily','practice']as const){const b=button(m==='daily'?'Daily challenge':'Unlimited practice',()=>switchMode(m),m===mode?'active':'');b.disabled=busy;b.setAttribute('aria-current',mode===m?'page':'false');tabs.append(b);}fragment.append(tabs);
 if(mode==='practice'){
  const filters=el('div','','practice-filters');filters.append(select('Practice difficulty',levels.map((name,i)=>[String(i+1),name]),String(filterLevel),v=>{filterLevel=Number(v) as Level;if(game==='semanticgravity'&&filterTopic!=='Any'&&!gravityTargets.some(p=>p.level===filterLevel&&p.category===filterTopic))filterTopic='Any';render();}));
  if(game==='wordweave'){
   filters.append(select('Weave mode',[['square','Word Square'],['cross','Cross Weave'],['letter','Letter Weave'],['free','Free Weave']],weaveMode,v=>{weaveMode=v as WeaveMode;if(weaveMode==='cross')gridSize=5;render();}),select('Grid size',(weaveMode==='cross'?[5]:[3,4,5]).map(n=>[String(n),`${n} × ${n}`]),String(gridSize),v=>gridSize=Number(v)));
  }else{
   const topics=[...new Set(game==='wordorbit'?orbitBank.map(p=>p.topic):gravityTargets.filter(p=>p.level===filterLevel).map(p=>p.category))].sort();filters.append(select('Practice category',[['Any','Any theme'],...topics.map(t=>[t,t] as [string,string])],filterTopic,v=>filterTopic=v));
  }
  const next=button(busy?'Preparing…':'New puzzle ↗',()=>{void newPractice();});next.disabled=busy;filters.append(next);fragment.append(filters);
  if(game!=='wordweave')fragment.append(el('p',game==='wordorbit'?'Practice explores the 12-center collection, then revisits it. Change difficulty to vary visible categories and orbit count.':'Practice explores 100 supported targets. It avoids recent targets until the selected pool is exhausted, then revisits them.','practice-note muted'));
 }
 const board=el('section','','board');board.setAttribute('aria-label','Puzzle');board.setAttribute('aria-busy',String(busy));
 if(!s){board.append(el('h2',busy?'Preparing a verified puzzle…':'The next chapter is being prepared.'),el('p',busy?'The solver is working in the background.':'No daily assignment is published for this UTC date. Practice remains available.'),button('Play practice',()=>switchMode('practice'),'primary'));}
 else{
  const edition=el('div','','edition');edition.append(el('span',s.mode==='daily'?`DAILY / ${s.day}`:'PRACTICE / NO STREAK PRESSURE'),el('span',levels[s.level-1]!,'difficulty'));board.append(edition);
  if(s.phase!=='playing')resultView(s,board);else if(s.game==='wordorbit')orbitView(s,board);else if(s.game==='semanticgravity')gravityView(s,board);else weaveView(s,board);
  const feedback=el('p',busy?'Solver is checking the constraints…':message,'feedback');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');board.append(feedback);
  if(s.phase==='playing'){const reveal=button('Reveal puzzle',()=>{const key=s!.key;confirm('Reveal this puzzle?','This attempt will earn zero points. You can inspect the connections or grid afterward.',()=>{if(s&&s.key===key)update(giveUp(s));});},'text-button');reveal.disabled=busy;board.append(reveal);}
 }
 fragment.append(board);const footer=el('footer','','game-footer'),count=el('p','','countdown');count.id='countdown';footer.append(count,el('p','A few quiet minutes. A fresh way to think.'),link('Explore all six games ↗','/games/'),button('Sources & dictionary policy',()=>modal('Sources, models and words.',[el('p',game==='wordorbit'?'Finite connections and aliases are grounded in documented dictionary senses. An unlisted association may still be reasonable; you can save it for review locally.':game==='semanticgravity'?'GloVe 6B 50-dimensional pretrained vectors, filtered into a frozen 6,028-word vocabulary. Rankings are relative to that vocabulary, not all of English.':'A versioned common-word subset from the collection’s Open English WordNet data. The exact same word list is used for every grid. Daily uniqueness is checked under that vocabulary and the printed constraints.'),link('Detailed sources and licenses ↗','/games/data/NEW-GAMES-SOURCES.md')]),'text-button'),el('p','Saved on this browser · No account needed','muted'));fragment.append(footer);app.replaceChildren(fragment);countdown();if(focus)document.getElementById(focus)?.focus({preventScroll:true});
}
function countdown(){const node=document.getElementById('countdown');if(!node)return;const left=Math.max(0,Math.floor((Date.parse(utcDay()+'T00:00:00Z')+86400000-Date.now())/1000));node.textContent=`Next daily in ${String(Math.floor(left/3600)).padStart(2,'0')}:${String(Math.floor(left%3600/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')} · 00:00 UTC`;}
document.addEventListener('keydown',e=>{
 if(s?.game!=='wordweave'||s.phase!=='playing'||busy||(document.getElementById('dialog') as HTMLDialogElement).open)return;
 const target=e.target as HTMLElement;if(target.tagName==='INPUT'&&target.id!=='weave-entry'||target.tagName==='SELECT'||target.tagName==='TEXTAREA')return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();update(e.shiftKey?redo(s):undo(s));return;}
 const delta:Record<string,number>={ArrowLeft:-1,ArrowRight:1,ArrowUp:-s.puzzle.size,ArrowDown:s.puzzle.size};
 if(delta[e.key]){e.preventDefault();let next=s.selected+delta[e.key]!;while(next>=0&&next<s.letters.length&&s.puzzle.layout[next]==='#')next+=delta[e.key]!;if(next>=0&&next<s.letters.length)selectCell(s,next);return;}
 if(target.id==='weave-entry'&&e.key!=='Backspace'&&e.key!=='Delete')return;
 if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();update(editCell(s,s.selected,''));return;}
 if(/^[a-z]$/i.test(e.key)&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();const state=s,next=editCell(state,state.selected,e.key);if(next===state){notify('This cell is fixed or that tile is unavailable.');return;}update(next);}
});
try{for(const p of orbitBank){const errors=validateOrbit(p);if(errors.length)throw Error(errors.join('; '));}applyTheme();daily();render();}catch(e){app.replaceChildren(el('h1','This puzzle needs another look.'),el('p',e instanceof Error?e.message:'Could not prepare the puzzle.'),link('Back to the collection','/games/'));}
setInterval(()=>{countdown();rollover();},1000);
window.addEventListener('storage',e=>{if(e.key!==storageKey(game))return;refreshSave();if(mode==='daily')daily();else s=save.practice;message='Progress updated from another tab.';render();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)rollover();});
window.addEventListener('pagehide',()=>{worker?.terminate();});
