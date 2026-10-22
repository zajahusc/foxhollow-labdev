import { shuffle } from '../data.js';
import { crosswordLexicon, crosswordVersion } from './crossword-lexicon.js';
import { dictionary, dictionaryVersion } from './dictionary.js';
const words = new Set(dictionary);
const crosswordWords = Object.keys(crosswordLexicon);
const crossWords = new Set(crosswordWords);
export const dimensions = (p) => [p.width || p.size, p.height || p.size];
const byLength = new Map();
for (const w of dictionary)
    byLength.set(w.length, [...(byLength.get(w.length) || []), w]);
const patternCache = new Map();
export function slots(layout, size, height = size) {
    if (layout.length !== size * height)
        throw Error('Grid dimensions disagree');
    const out = [];
    for (const direction of ['across', 'down'])
        for (let major = 0; major < (direction === 'across' ? height : size); major++) {
            let run = [];
            const end = () => { if (run.length >= 2)
                out.push({ id: `${direction}-${out.length}`, cells: run, direction }); run = []; };
            for (let minor = 0; minor < (direction === 'across' ? size : height); minor++) {
                const at = direction === 'across' ? major * size + minor : minor * size + major;
                if (layout[at] === '#')
                    end();
                else
                    run.push(at);
            }
            end();
        }
    return out;
}
function candidates(pattern, crossword = false) {
    const cached = patternCache.get((crossword ? 'v2:' : 'v1:') + pattern);
    if (cached)
        return cached;
    const c = (crossword ? crosswordWords.filter(w => w.length === pattern.length) : (byLength.get(pattern.length) || [])).filter(w => [...pattern].every((x, i) => x === '.' || w[i] === x));
    if (patternCache.size > 10000)
        patternCache.clear();
    patternCache.set((crossword ? 'v2:' : 'v1:') + pattern, c);
    return c;
}
export function counts(letters) { const result = {}; for (const c of letters)
    if (/[a-z]/.test(c))
        result[c] = (result[c] || 0) + 1; return result; }
function fitsInventory(p, letters) {
    if (p.inventory === null)
        return true;
    const used = counts([...letters].filter((_, i) => p.givens[i] === '.').join('')), available = counts(p.inventory);
    return Object.entries(used).every(([c, n]) => n <= (available[c] || 0));
}
export function solve(p, entry = p.givens, limit = 2, budget = 200000, seed = '') {
    const positions = slots(p.layout, ...dimensions(p)), solutions = [];
    let nodes = 0, exhausted = true;
    if (entry.length !== p.layout.length)
        return { solutions: [], nodes: 0, exhausted: true };
    const initial = [...entry];
    for (let i = 0; i < initial.length; i++) {
        if (p.layout[i] === '#') {
            if (initial[i] !== '#')
                return { solutions: [], nodes: 0, exhausted: true };
        }
        else if (!/^[a-z.]$/.test(initial[i]))
            return { solutions: [], nodes: 0, exhausted: true };
        if (p.givens[i] !== '.' && p.givens[i] !== initial[i])
            return { solutions: [], nodes: 0, exhausted: true };
    }
    if (!fitsInventory(p, entry))
        return { solutions: [], nodes: 0, exhausted: true };
    function search(board) {
        if (solutions.length >= limit) {
            exhausted = false;
            return;
        }
        if (++nodes > budget) {
            exhausted = false;
            return;
        }
        const domains = positions.map(slot => ({ slot, pattern: slot.cells.map(i => board[i]).join('') }));
        const completed = domains.filter(x => !x.pattern.includes('.')).map(x => x.pattern);
        if (completed.some(w => !(p.dictionary === crosswordVersion ? crossWords : words).has(w)) || p.constraints.noRepeat && new Set(completed).size !== completed.length || !fitsInventory(p, board))
            return;
        let chosen = null;
        for (const { slot, pattern } of domains) {
            if (!pattern.includes('.'))
                continue;
            const values = (p.clues?.[slot.id] ? p.clues[slot.id].accepted.filter(w => [...pattern].every((c, i) => c === '.' || w[i] === c)) : candidates(pattern, p.dictionary === crosswordVersion)).filter(w => !p.constraints.noRepeat || !completed.includes(w));
            if (!values.length)
                return;
            if (!chosen || values.length < chosen.values.length)
                chosen = { slot, values };
        }
        if (!chosen) {
            if (!board.includes('.') && !solutions.includes(board))
                solutions.push(board);
            return;
        }
        const ordered = seed ? shuffle(chosen.values, seed + board) : chosen.values;
        for (const w of ordered) {
            const next = [...board];
            chosen.slot.cells.forEach((cell, i) => next[cell] = w[i]);
            // Forward checking: intersecting slots must retain at least one compatible dictionary entry.
            const text = next.join('');
            if (!fitsInventory(p, text))
                continue;
            if (positions.some(s => { const pattern = s.cells.map(i => text[i]).join(''); return !(p.clues?.[s.id] ? p.clues[s.id].accepted.filter(w => [...pattern].every((c, i) => c === '.' || w[i] === c)) : candidates(pattern, p.dictionary === crosswordVersion)).length; }))
                continue;
            search(text);
            if (solutions.length >= limit || nodes > budget) {
                exhausted = false;
                return;
            }
        }
    }
    search(entry);
    return { solutions, nodes, exhausted };
}
export function checkGrid(p, letters, requireComplete = true) {
    const issues = [];
    if (letters.length !== p.layout.length)
        return ['Grid has the wrong size.'];
    if ([...p.givens].some((c, i) => c !== '.' && letters[i] !== c))
        issues.push('A fixed cell was changed.');
    if (requireComplete && letters.includes('.'))
        issues.push('Fill every open cell.');
    const runs = slots(p.layout, ...dimensions(p)), complete = [];
    for (const [i, s] of runs.entries()) {
        const w = s.cells.map(n => letters[n]).join('');
        if (!w.includes('.')) {
            complete.push(w);
            if (!(p.dictionary === crosswordVersion ? crossWords : words).has(w))
                issues.push(`${s.direction} run ${i + 1}: ${w.toUpperCase()} is outside the puzzle dictionary.`);
        }
    }
    if (p.clues)
        for (const run of runs) {
            const text = run.cells.map(i => letters[i]).join('');
            if (!text.includes('.') && !p.clues[run.id]?.accepted.includes(text))
                issues.push(`${run.direction} ${p.clues[run.id]?.number}: the entry does not fit its clue.`);
        }
    if (p.constraints.noRepeat && new Set(complete).size !== complete.length)
        issues.push('Repeated words are not permitted.');
    if (!fitsInventory(p, letters))
        issues.push('The supplied letter inventory is exceeded.');
    if (requireComplete && p.inventory !== null && JSON.stringify(Object.entries(counts([...letters].filter((_, i) => p.givens[i] === '.').join(''))).sort()) !== JSON.stringify(Object.entries(counts(p.inventory)).sort()))
        issues.push('Use every supplied letter exactly once.');
    return issues;
}
export function validateWeave(p, prove = true) {
    const issues = [];
    if (![dictionaryVersion, crosswordVersion].includes(p.dictionary) || p.layout.length !== dimensions(p)[0] * dimensions(p)[1] || !['square', 'cross', 'letter', 'free', 'crossword'].includes(p.mode))
        issues.push('Invalid dictionary or layout version.');
    const covered = new Set(slots(p.layout, ...dimensions(p)).flatMap(s => s.cells));
    if ([...p.layout].some((c, i) => c !== '#' && !covered.has(i)))
        issues.push('An open cell belongs to no word.');
    issues.push(...checkGrid(p, p.solution));
    if (p.mode === 'crossword' && slots(p.layout, ...dimensions(p)).some(s => !p.clues?.[s.id]?.text || !p.clues[s.id].accepted.includes(p.clues[s.id].answer)))
        issues.push('Missing crossword clue.');
    const fullWord = slots(p.layout, ...dimensions(p)).some(s => s.direction === 'across' && s.cells.every(i => /[a-z]/.test(p.givens[i])));
    if (p.mode !== 'crossword' && !fullWord)
        issues.push('A complete starting word is required.');
    if (p.unique && prove) {
        const result = solve(p);
        if (result.solutions.length !== 1 || !result.exhausted || result.solutions[0] !== p.solution)
            issues.push('Unique completion has not been proven.');
    }
    return issues;
}
export function makeWeave(size, mode, level, seed) {
    if (![3, 4, 5].includes(size))
        throw Error('Supported grid sizes are 3, 4 and 5.');
    if (mode === 'cross' && size !== 5)
        throw Error('Cross Weave uses 5×5 to keep every run at least three letters long.');
    const layout = Array.from({ length: size * size }, (_, i) => mode === 'cross' && size >= 4 && [0, size - 1, size * (size - 1), size * size - 1].includes(i) ? '#' : '.').join('');
    const p = { id: `weave-v1-${seed}`, level, size, mode, layout, givens: layout, solution: '', inventory: null, dictionary: dictionaryVersion, unique: mode !== 'free', searchNodes: 0, constraints: { noRepeat: false }, estimated: true };
    const first = solve(p, p.givens, 1, 100000, seed);
    if (!first.solutions[0])
        throw Error('No verified grid found within the search budget. Try another size or mode.');
    p.solution = first.solutions[0];
    const starting = slots(layout, size).find(s => s.direction === 'across');
    const givens = [...layout];
    starting.cells.forEach(i => givens[i] = p.solution[i]);
    p.givens = givens.join('');
    if (mode === 'letter')
        p.inventory = [...p.solution].filter((_, i) => p.givens[i] === '.').sort().join('');
    if (mode === 'free')
        return p;
    const order = shuffle([...p.solution].map((_, i) => i).filter(i => p.givens[i] === '.'), seed + '-clues');
    for (let tries = 0; tries <= order.length; tries++) {
        const result = solve(p);
        p.searchNodes += result.nodes;
        if (result.solutions.length === 1 && result.exhausted) {
            p.solution = result.solutions[0];
            break;
        }
        const cell = order[tries];
        if (cell === undefined)
            throw Error('Uniqueness could not be proven.');
        givens[cell] = p.solution[cell];
        p.givens = givens.join('');
        if (mode === 'letter')
            p.inventory = [...p.solution].filter((_, i) => p.givens[i] === '.').sort().join('');
    }
    // Remove redundant clues; a verified grid with every letter given is not a useful puzzle.
    for (const cell of order) {
        if (p.givens[cell] === '.')
            continue;
        const saved = p.givens;
        givens[cell] = '.';
        p.givens = givens.join('');
        if (mode === 'letter')
            p.inventory = [...p.solution].filter((_, i) => p.givens[i] === '.').sort().join('');
        const check = solve(p);
        p.searchNodes += check.nodes;
        if (check.solutions.length !== 1 || !check.exhausted) {
            p.givens = saved;
            givens[cell] = p.solution[cell];
        }
    }
    // Easier settings supply additional fixed letters, while keeping the same verified rules.
    const extra = level === 1 ? Math.max(0, size - 1) : level === 2 ? 1 : 0;
    let added = 0;
    for (const i of order) {
        if (p.givens[i] === '.' && added < extra && [...p.givens].filter(c => c === '.').length > 3) {
            givens[i] = p.solution[i];
            p.givens = givens.join('');
            added++;
        }
    }
    if (mode === 'letter')
        p.inventory = [...p.solution].filter((_, i) => p.givens[i] === '.').sort().join('');
    const errors = validateWeave(p);
    if (errors.length)
        throw Error(errors.join(' '));
    return p;
}
export function editCell(s, cell, raw) {
    if (s.phase !== 'playing' || s.puzzle.givens[cell] !== '.' || s.hintLetters[cell])
        return s;
    const c = raw.toLowerCase().replace(/[^a-z]/g, '').slice(-1), letters = [...s.letters], notes = { ...s.notes };
    if (s.pencil) {
        if (!c)
            delete notes[cell];
        else
            notes[cell] = (notes[cell] || '').includes(c) ? notes[cell].replace(c, '') : [...(notes[cell] || ''), c].sort().join('');
    }
    else {
        letters[cell] = c || '.';
        delete notes[cell];
        if (!fitsInventory(s.puzzle, letters.join('')))
            return s;
    }
    return { ...s, letters: letters.join(''), notes, past: [...s.past, { letters: s.letters, notes: s.notes }].slice(-150), future: [] };
}
export function undo(s) { const before = s.past.at(-1); return s.phase === 'playing' && before ? { ...s, ...before, past: s.past.slice(0, -1), future: [{ letters: s.letters, notes: s.notes }, ...s.future] } : s; }
export function redo(s) { const after = s.future[0]; return s.phase === 'playing' && after ? { ...s, ...after, past: [...s.past, { letters: s.letters, notes: s.notes }], future: s.future.slice(1) } : s; }
export function weaveScore(s) { return Math.max(0, Math.round(100 * (1 - s.hintsByType[0] * .05 - s.hintsByType[1] * .1 - s.hintsByType[2] * .2 - s.mistakes * .05))); }
export function submitWeave(s) {
    if (s.phase !== 'playing')
        return { session: s, issues: [] };
    const issues = checkGrid(s.puzzle, s.letters);
    if (!issues.length && s.puzzle.unique && s.letters !== s.puzzle.solution)
        issues.push('This grid does not meet the published unique solution.');
    if (issues.length) {
        const mistakes = s.mistakes + 1, failed = mistakes >= (s.hard ? 3 : 8);
        return { session: { ...s, mistakes, phase: failed ? 'failed' : 'playing', score: 0, finished: failed ? Date.now() : null }, issues };
    }
    return { session: { ...s, phase: 'solved', score: weaveScore(s), finished: Date.now() }, issues: [] };
}
export const dictionaryCandidates = (pattern) => [...candidates(pattern)];
const basePatterns = [['...##', '...##', '.....', '##...', '##...'], ['....###', '....###', '.......', '###....', '###....']];
const transpose = (rows) => [...rows[0]].map((_, i) => rows.map(row => row[i]).join(''));
export const crosswordPatterns = [...basePatterns, transpose(basePatterns[1]), transpose(basePatterns[0])];
export function makeCrossword(level, seed, patternIndex = 0) {
    const rows = crosswordPatterns[patternIndex % crosswordPatterns.length], width = rows[0].length, height = rows.length;
    const layout = rows.join(''), p = { id: `crossword-v2-${seed}`, level, size: width, width, height, mode: 'crossword', layout, givens: layout, solution: '', inventory: null, dictionary: crosswordVersion, unique: true, searchNodes: 0, constraints: { noRepeat: true }, estimated: true };
    const full = solve(p, layout, 1, 200000, seed);
    if (!full.solutions[0])
        throw Error('No crossword fill found in the search budget.');
    p.solution = full.solutions[0];
    const runs = slots(layout, width, height), starts = [...new Set(runs.map(s => s.cells[0]))].sort((a, b) => a - b);
    p.clues = {};
    for (const run of runs) {
        const answer = run.cells.map(i => p.solution[i]).join(''), entry = crosswordLexicon[answer];
        if (!entry)
            throw Error('A source clue is missing.');
        p.clues[run.id] = { number: starts.indexOf(run.cells[0]) + 1, text: entry.text, answer, accepted: entry.accepted.filter(w => crossWords.has(w)), synset: entry.synset };
    }
    const result = solve(p);
    p.searchNodes = result.nodes;
    if (result.solutions.length !== 1 || !result.exhausted)
        throw Error('Clues do not yet determine a unique crossword.');
    const errors = validateWeave(p);
    if (errors.length)
        throw Error(errors.join('; '));
    return p;
}
