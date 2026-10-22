import {readFileSync} from 'node:fs';import {clueText,lockCandidates} from '../build/eight/lexicon.js';
const pub=JSON.parse(readFileSync('games/data/eight/lexiconlock.json','utf8')),p=process.argv[2]?pub.puzzles.find(p=>p.id===process.argv[2]):pub.puzzles[0];
if(!p)throw Error('Unknown published puzzle ID.');console.log(p.id);console.log('Before clues:',lockCandidates(p,[]).length);
p.clues.forEach((c,i)=>console.log(`${i+1}. ${clueText(c)} → ${lockCandidates(p,p.clues.slice(0,i+1)).length} candidates`));
