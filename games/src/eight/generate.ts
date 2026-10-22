import {makeLock} from './lexicon.js';import {makeAlibi} from './alibi.js';import {makeMove} from './moves.js';import {makeTiles} from './tiles.js';import {makeNegative} from './negative.js';
import type {Game,Level} from './common.js';import type {Puzzle} from './engine.js';
export const generatedGames:Game[]=['lexiconlock','alibi','missingmove','tiletheory','negativelogic'];
export function generate(game:Game,level:Level,seed:string,category?:string):Puzzle{switch(game){case'lexiconlock':return makeLock(level,seed);case'alibi':return makeAlibi(level,seed);case'missingmove':return makeMove(level,seed);case'tiletheory':return makeTiles(level,seed);case'negativelogic':return makeNegative(level,seed,category);default:throw Error('This game uses its verified editorial collection.');}}
