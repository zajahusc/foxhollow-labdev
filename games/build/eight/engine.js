import { migrateScores } from '../daily-options.js';
import { dailyDay, previousDay } from '../time.js';
import { catalog, hash, normalized } from './common.js';
import { lockAnswer, validateLock, clueText } from './lexicon.js';
import { alibiAnswer, validateAlibi, factText, statementTrue } from './alibi.js';
import { moveAnswer, validateMove, moveText, applyMove } from './moves.js';
import { tileAnswer, validateTiles, tileNames } from './tiles.js';
import { negativeSurvivors, validateNegative } from './negative.js';
import { fossilAnswer, validateFossil } from './fossil.js';
import { paradoxAnswer, validateParadox } from './paradox.js';
import { landmarkAnswer, strokeScore, validateLine } from './lines.js';
export const storageKey = (game) => `foxhollow.${game}.v1`;
export const blankSave = (game) => ({ version: 1, scoreVersion: 2, game, daily: {}, practice: null, records: [], recent: [], serial: 0, theme: 'system', animation: true, hintOrder: 'geography', continuous: false });
export function initial(puzzle, mode, serial = 0, day = dailyDay()) {
    const progress = { text: '', checked: [], notes: {}, order: puzzle.game === 'alibi' ? puzzle.names.map((_, i) => i) : puzzle.game === 'wordfossil' && puzzle.mode === 'evolution' ? [1, 2, 0] : [], liar: -1, badge: 0, board: puzzle.game === 'missingmove' ? [...puzzle.before] : puzzle.game === 'tiletheory' ? [...puzzle.givens] : [], past: [], future: [], movePath: [], eliminated: [], possible: [], choice: -1, clues: 1, strokes: 0, choicesShown: puzzle.level <= 2, pencil: false, selected: 0 };
    return { puzzle, mode, day, serial, phase: 'playing', progress, mistakes: 0, hints: 0, hintTexts: [], started: Date.now(), finished: null, score: 0 };
}
export function validatePuzzle(p) { try {
    if (!p || p.version !== 1 || typeof p.id !== 'string' || !p.id || !Object.hasOwn(catalog, p.game) || ![1, 2, 3, 4, 5].includes(p.level))
        return { valid: false, errors: ['Invalid puzzle identity or difficulty.'], solutions: null, method: 'Runtime schema' };
    if ((p.game === 'tiletheory' || p.game === 'missingmove') && (![3, 4, 5, 6].includes(p.size) || p.solution.length < 1))
        return { valid: false, errors: ['Invalid board dimensions.'], solutions: null, method: 'Runtime schema' };
    if (p.game === 'alibi' && (p.names.length < 3 || p.names.length > 6 || p.statements.length !== p.names.length))
        return { valid: false, errors: ['Invalid character count.'], solutions: null, method: 'Runtime schema' };
    if (p.game === 'negativelogic' && (p.candidates.length < 6 || p.candidates.length > 16 || p.clues.length < 1))
        return { valid: false, errors: ['Invalid elimination bank.'], solutions: null, method: 'Runtime schema' };
    switch (p.game) {
        case 'lexiconlock': return validateLock(p);
        case 'alibi': return validateAlibi(p);
        case 'missingmove': return validateMove(p);
        case 'tiletheory': return validateTiles(p);
        case 'wordfossil': return validateFossil(p);
        case 'negativelogic': return validateNegative(p);
        case 'paradoxbox': return validateParadox(p);
        case 'linebyline': return validateLine(p);
    }
}
catch {
    return { valid: false, errors: ['Malformed puzzle data.'], solutions: null, method: 'Runtime schema' };
} }
export function correct(s) { const p = s.puzzle, g = s.progress; switch (p.game) {
    case 'lexiconlock': return lockAnswer(p, g.text);
    case 'alibi': return g.liar >= 0 && g.liar < p.names.length && alibiAnswer(p, { order: g.order, offset: g.badge }, g.liar);
    case 'missingmove': return moveAnswer(p, g.board, g.movePath.length);
    case 'tiletheory': return tileAnswer(p, g.board);
    case 'wordfossil': return p.mode === 'evolution' ? g.order.length === 3 && g.order.every((v, i) => v === i) : fossilAnswer(p, g.text);
    case 'negativelogic': return p.candidates[g.choice]?.id === p.target;
    case 'paradoxbox': return paradoxAnswer(p, g.choice);
    case 'linebyline': return landmarkAnswer(p, g.text);
} }
export function points(s) { if (s.phase !== 'solved')
    return 0; const p = s.puzzle; if (p.game === 'linebyline')
    return strokeScore(s.progress.strokes, p.total, s.mistakes, s.hints); let value = 100 - 10 * s.mistakes - 10 * s.hints; if (p.game === 'missingmove')
    value -= 5 * Math.max(0, s.progress.movePath.length - p.optimal); if (p.game === 'wordfossil' && p.mode === 'detective')
    value -= 3 * (s.progress.clues - 1); if (p.game === 'negativelogic')
    value -= 3 * (s.progress.clues - 1); return Math.max(0, Math.min(100, value)); }
export function submit(s) { if (s.phase !== 'playing')
    return s; if (correct(s)) {
    const next = { ...s, phase: 'solved', finished: Date.now() };
    return { ...next, score: points(next) };
} const mistakes = s.mistakes + 1, limit = s.hard ? 3 : 8; return { ...s, mistakes, phase: mistakes >= limit ? 'lost' : 'playing', finished: mistakes >= limit ? Date.now() : null }; }
export const reveal = (s) => s.phase === 'playing' ? { ...s, phase: 'revealed', score: 0, finished: Date.now() } : s;
export function hintText(s, order = 'geography') {
    const p = s.puzzle, i = s.hints, g = s.progress;
    switch (p.game) {
        case 'lexiconlock': return [`The first letter is ${p.word[0].toUpperCase()}.`, `The last letter is ${p.word.at(-1).toUpperCase()}.`, `The first two letters are ${p.word.slice(0, 2).toUpperCase()}.`][i];
        case 'alibi': return [`${p.names[p.solution.order[0]]} is in ${p.slots[0]}.`, `${p.names[p.solution.order[1]]} is in ${p.slots[1]}.`, `${p.names[p.liar]} has the false statement.`][i];
        case 'missingmove': {
            let board = [...p.before];
            for (let j = 0; j < i; j++)
                board = applyMove(board, p.size, p.operations[p.solution[j % p.solution.length]]);
            return `From the original board, move ${Math.min(i + 1, p.solution.length)} of a shortest route is: ${moveText(p.operations[p.solution[Math.min(i, p.solution.length - 1)]])}. Reset the board first if you want to follow that route.`;
        }
        case 'tiletheory': {
            const cell = g.board.findIndex((v, j) => v !== p.solution[j]);
            return cell < 0 ? 'The completed grid satisfies the published solution.' : `Cell ${cell + 1} takes ${tileNames[p.solution[cell] - 1]}.`;
        }
        case 'wordfossil':
        case 'paradoxbox': return p.hints[i];
        case 'negativelogic': {
            const remaining = negativeSurvivors(p, p.clues.slice(0, g.clues));
            return i === 0 ? `${remaining.length} candidate${remaining.length === 1 ? ' remains' : 's remain'} after the visible clues.` : i === 1 ? `The complete clues leave exactly one survivor. Read each exclusion literally.` : `The target is ${p.candidates.find(c => c.id === p.target).label}.`;
        }
        case 'linebyline': return (order === 'geography' ? [`Continent: ${p.continent}.`, `Category: ${p.category}.`, `Country: ${p.country}.`] : [`Category: ${p.category}.`, `Continent: ${p.continent}.`, `Country: ${p.country}.`])[i];
    }
}
export function useHint(s, order = 'geography') { if (s.phase !== 'playing' || s.hard || s.hints >= 3)
    return s; return { ...s, hints: s.hints + 1, hintTexts: [...s.hintTexts, hintText(s, order)] }; }
export function explanation(p) { switch (p.game) {
    case 'lexiconlock': return [`The word is ${p.word.toUpperCase()}.`, ...p.clues.map(clueText), 'All clues together identify exactly one eligible dictionary word.'];
    case 'alibi': return [`${p.names[p.liar]} has the false testimony.`, p.solution.order.map((v, i) => `${p.slots[i]}: ${p.names[v]}${p.rotation ? ` (${p.objects[(i + p.solution.offset) % p.names.length]} badge)` : ''}`).join(' · '), ...p.statements.map(s => `${p.names[s.person]}: ${statementTrue(s, p.solution) ? 'TRUE' : 'FALSE'} — ${s.facts.map(f => factText(f, p)).join(' AND ')}.`)];
    case 'missingmove': return [`The shortest route uses ${p.optimal} move${p.optimal === 1 ? '' : 's'}.`, ...p.solution.map((j, i) => `${i + 1}. ${moveText(p.operations[j])}`), 'Any legal route within the printed limit is accepted.'];
    case 'tiletheory': return ['Each row, column and the marked constellation contains every tile once.', 'The initial clues have exactly one completion, also solvable by single-placement deductions.'];
    case 'wordfossil': return [`${p.root.toUpperCase()} · ${p.language} · ${p.meaning}`, p.explanation, ...(p.mode === 'evolution' ? p.forms.map((form, i) => `${form} — ${p.periods[i]}`) : [])];
    case 'negativelogic': return [`The answer is ${p.candidates.find(c => c.id === p.target).label}.`, ...p.clues.map(c => c.text), 'Filtering every candidate by every exclusion leaves just this one.'];
    case 'paradoxbox': return [p.choices[p.answer], p.explanation, ...p.choices.map((c, i) => `${i === p.answer ? 'Fits' : 'Ruled out'}: ${c} — ${p.refutations[i]}`)];
    case 'linebyline': return [`${p.name} · ${p.country} · ${p.category}`, ...p.facts];
} }
export const resultKey = (s) => s.mode === 'daily' ? `daily:${s.day}` : `practice:${s.serial}`;
export function commit(save, s) {
    if (s.mode === 'daily' && save.records.some(r => r.key === resultKey(s)) && save.daily[s.day]?.phase !== 'playing')
        return save;
    const next = { ...save, daily: { ...save.daily }, records: [...save.records], recent: [...save.recent] };
    if (s.mode === 'daily')
        next.daily[s.day] = s;
    else
        next.practice = s;
    const key = resultKey(s);
    if (s.phase !== 'playing' && !next.records.some(r => r.key === key)) {
        const p = s.puzzle;
        next.records.push({ key, puzzleId: p.id, day: s.day, mode: s.mode, level: p.level, won: s.phase === 'solved', score: s.score, hints: s.hints, mistakes: s.mistakes, strokes: s.progress.strokes, continent: p.game === 'linebyline' ? p.continent : '', category: p.game === 'linebyline' ? p.category : '' });
        next.recent = [...next.recent.filter(id => id !== p.id), p.id].slice(-30);
    }
    return next;
}
export function statistics(save, today = dailyDay()) {
    const records = save.records.filter(r => r.mode === 'daily'), wins = records.filter(r => r.won), days = [...new Set(wins.filter(r => r.mode === 'daily').map(r => r.day))].sort();
    let longest = 0, run = 0, last = '';
    for (const day of days) {
        run = previousDay(day) === last ? run + 1 : 1;
        longest = Math.max(longest, run);
        last = day;
    }
    let streak = 0, day = days.includes(today) ? today : previousDay(today);
    while (days.includes(day)) {
        streak++;
        day = previousDay(day);
    }
    const attempted = Object.keys(save.daily).length;
    return { attempted, completed: records.length, wins: wins.length, winRate: records.length ? Math.round(100 * wins.length / records.length) : 0, streak, longest, best: Math.max(0, ...records.map(r => r.score)), average: records.length ? Math.round(records.reduce((n, r) => n + r.score, 0) / records.length) : 0, averageHints: records.length ? (records.reduce((n, r) => n + r.hints, 0) / records.length).toFixed(1) : '0', byLevel: [1, 2, 3, 4, 5].map(level => ({ level, played: records.filter(r => r.level === level).length, wins: wins.filter(r => r.level === level).length })), averageStrokes: wins.length ? (wins.reduce((n, r) => n + r.strokes, 0) / wins.length).toFixed(1) : '0', fewestStrokes: wins.length ? Math.min(...wins.map(r => r.strokes)) : 0 };
}
export function shareText(s) { return `${catalog[s.puzzle.game].name.toUpperCase()} · ${s.mode === 'daily' ? s.day : 'Practice'}\n${s.phase === 'solved' ? '✦ Solved' : '◇ Revealed'} · ${s.score} points\n${s.puzzle.game === 'linebyline' ? `✏ Strokes: ${s.progress.strokes}/${s.puzzle.total}\n` : ''}Hints: ${s.hints} · Misses: ${s.mistakes}\nhttps://foxhollowlabs.dev/${s.puzzle.game}/`; }
function validSession(value, game) { try {
    const s = value, p = s.progress;
    if (!s || s.puzzle.game !== game || !['playing', 'solved', 'revealed', 'lost'].includes(s.phase) || !['daily', 'practice'].includes(s.mode) || !/^\d{4}-\d{2}-\d{2}$/.test(s.day) || !Number.isFinite(s.started) || !Number.isInteger(s.serial) || !Number.isInteger(s.mistakes) || s.mistakes < 0 || s.hints < 0 || s.hints > 3 || !Number.isInteger(s.hints) || !Number.isFinite(s.score) || s.score < 0)
        return false;
    if (!Array.isArray(s.hintTexts) || s.hintTexts.some(x => typeof x !== 'string') || typeof p.text !== 'string' || typeof p.notes !== 'object' || !p.notes || Object.values(p.notes).some(x => typeof x !== 'string'))
        return false;
    for (const k of ['checked', 'order', 'board', 'movePath'])
        if (!Array.isArray(p[k]) || !p[k].every(x => Number.isInteger(x) && x >= 0))
            return false;
    for (const k of ['eliminated', 'possible'])
        if (!Array.isArray(p[k]) || !p[k].every(x => typeof x === 'string'))
            return false;
    if (!Array.isArray(p.past) || !Array.isArray(p.future) || [...p.past, ...p.future].some(a => !Array.isArray(a) || a.some(x => !Number.isInteger(x))))
        return false;
    for (const k of ['liar', 'badge', 'choice', 'clues', 'strokes', 'selected'])
        if (!Number.isInteger(p[k]))
            return false;
    if (typeof p.choicesShown !== 'boolean' || typeof p.pencil !== 'boolean' || p.strokes < 0 || p.clues < 1 || p.liar < -1 || p.choice < -1 || p.selected < 0)
        return false;
    if (!validatePuzzle(s.puzzle).valid)
        return false;
    const puzzle = s.puzzle;
    if (puzzle.game === 'tiletheory' && (p.board.length !== puzzle.size ** 2 || p.board.some(x => x > puzzle.size) || puzzle.givens.some((v, i) => v !== 0 && v !== p.board[i])))
        return false;
    if (puzzle.game === 'missingmove' && (p.board.length !== puzzle.size ** 2 || p.movePath.some(x => x >= puzzle.operations.length)))
        return false;
    if (puzzle.game === 'alibi' && (p.order.length !== puzzle.names.length || new Set(p.order).size !== p.order.length || p.order.some(x => x >= puzzle.names.length) || p.badge >= puzzle.names.length))
        return false;
    return true;
}
catch {
    return false;
} }
export function decode(raw, game) { const empty = blankSave(game); if (!raw)
    return empty; try {
    const v = JSON.parse(raw);
    if (v.version !== 1 || v.game !== game || !v.daily || typeof v.daily !== 'object' || Array.isArray(v.daily) || !Array.isArray(v.records) || !Array.isArray(v.recent) || v.recent.some(x => typeof x !== 'string') || !Number.isInteger(v.serial) || v.serial < 0)
        return empty;
    empty.daily = Object.fromEntries(Object.entries(v.daily).filter(([day, s]) => validSession(s, game) && s.day === day && s.mode === 'daily'));
    empty.practice = validSession(v.practice, game) && v.practice.mode === 'practice' ? v.practice : null;
    empty.records = v.records.filter(r => r && typeof r.key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.day) && typeof r.puzzleId === 'string' && ['daily', 'practice'].includes(r.mode) && Number.isFinite(r.score) && r.score >= 0 && typeof r.won === 'boolean' && [1, 2, 3, 4, 5].includes(r.level) && [r.hints, r.mistakes, r.strokes].every(x => Number.isFinite(x) && x >= 0) && typeof r.continent === 'string' && typeof r.category === 'string').filter((r, i, a) => a.findIndex(x => x.key === r.key) === i);
    empty.recent = v.recent.slice(-30);
    empty.serial = v.serial;
    empty.theme = ['light', 'dark', 'system'].includes(v.theme) ? v.theme : 'system';
    empty.animation = v.animation !== false;
    empty.continuous = v.continuous === true;
    empty.hintOrder = v.hintOrder === 'category' ? 'category' : 'geography';
    return migrateScores(empty, v.scoreVersion);
}
catch {
    return empty;
} }
export function choosePractice(bank, level, recent, serial, game) { const pool = bank.filter(p => p.level === level), fresh = pool.filter(p => !recent.includes(p.id)), eligible = fresh.length ? fresh : pool.filter(p => p.id !== recent.at(-1)); if (!pool.length)
    throw Error('No published puzzles at this level.'); return (eligible.length ? eligible : pool)[hash(`${game}:${serial}`) % (eligible.length || pool.length)]; }
export const answerNormalized = normalized;
