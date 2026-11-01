export const gameLinks:readonly (readonly [string,string])[]=[
 ['wordbridge','WordBridge'],['fourthword','The Fourth Thing'],['oddrule','The Odd Rule'],['semanticgravity','Semantic Gravity'],['wordweave','Word Weave'],['lexiconlock','Lexicon Lock'],['alibi','The Alibi'],['missingmove','The Missing Move'],['tiletheory','Tile Theory'],['wordfossil','Word Fossil'],['negativelogic','Negative Logic'],['paradoxbox','Paradox Box'],['linebyline','Line by Line'],['wildguess','WildGuess'],
];
export function createGameNavigation(active:string):HTMLElement{
 const nav=document.createElement('nav');nav.className='game-switcher';nav.id='game-navigation';nav.setAttribute('aria-label','Game collection');
 const collection=document.createElement('a');collection.href='/games/';collection.textContent='All games';
 const label=document.createElement('label');label.className='game-picker';const text=document.createElement('span');text.textContent='Switch game';
 const picker=document.createElement('select');picker.setAttribute('aria-label','Switch game');for(const [id,name]of gameLinks){const option=document.createElement('option');option.value=id;option.textContent=name;picker.append(option);}picker.value=active;picker.onchange=()=>{if(picker.value!==active)location.assign(`/${picker.value}/`);};label.append(text,picker);nav.append(collection,label);return nav;
}
