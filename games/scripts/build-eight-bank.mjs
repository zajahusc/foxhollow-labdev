// Explicit publication step. Ordinary builds never mutate published puzzles or schedules.
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {negativeCategories} from '../build/eight/negative.js';import {catalog} from '../build/eight/common.js';import {generate,generatedGames} from '../build/eight/generate.js';import {validatePuzzle} from '../build/eight/engine.js';import {fossilContent,paradoxContent} from '../build/eight/content.js';import {evolutionContent,reconstructionContent} from '../build/eight/fossil-variants.js';import {landmarkContent,landmarkDrawings} from '../build/eight/landmarks.js';
mkdirSync('games/data/eight',{recursive:true});
for(const game of Object.keys(catalog).filter(game=>!process.argv[2]||game===process.argv[2])){
 const path=`games/data/eight/${game}.json`;if(existsSync(path))throw Error(`${path} is frozen. Publish a new version instead of replacing it.`);
 let puzzles=[];
 if(game==='negativelogic'){for(let level=1;level<=5;level++)for(const [j,category]of negativeCategories.entries())for(let i=0;i<2;i++)puzzles.push(generate(game,level,`published-negative-${level}-${j}-${i}`,category));}
 else if(generatedGames.includes(game))for(let level=1;level<=5;level++)for(let i=0;i<10;i++)puzzles.push(generate(game,level,`published-${game}-${level}-${i}`));
 else if(game==='wordfossil')puzzles=[...fossilContent.flatMap(p=>[{...p,game,version:1,mode:'root'},{...p,id:p.id+'-detective',game,version:1,mode:'detective'}]),...evolutionContent.map(p=>({...p,game,version:1,mode:'evolution',root:p.forms.at(-1),aliases:[],language:'English',meaning:'documented historical spelling stages',words:p.forms})),...reconstructionContent.map(p=>({...p,game,version:1,mode:'reconstruction',root:p.answer,pieces:{prefix:p.prefix,root:p.root,suffix:p.suffix},words:[p.prefix,p.root,p.suffix].filter(Boolean)}))];
 else if(game==='paradoxbox')puzzles=paradoxContent.map(p=>({...p,game,version:1}));
 else puzzles=landmarkContent.map(p=>({...p,id:`line-v1-${p.id}`,landmarkId:p.id,game,version:1,total:landmarkDrawings[p.id].length}));
 for(const p of puzzles){const v=validatePuzzle(p);if(!v.valid)throw Error(`${p.id}: ${v.errors}`);}
 const schedule={};for(let i=0;i<365;i++){const date=new Date(Date.UTC(2026,9,22+i)).toISOString().slice(0,10);const level=i%5+1,pool=puzzles.filter(p=>p.level===level);schedule[date]=pool[Math.floor(i/5)%pool.length].id;}
 writeFileSync(path,JSON.stringify({version:1,game,puzzles,schedule})+'\n');console.log(game,puzzles.length,'puzzles,',Object.keys(schedule).length,'explicit New York dates');
}
