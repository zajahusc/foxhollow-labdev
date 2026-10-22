import { readHard, writeHard } from '../daily-options.js';
import { nextDailyReset } from '../time.js';
import { hash } from '../data.js';
import { gravityTargets } from './targets.js';
import { loadGravity, rank, gravityGuess, gravityHint, temperature, neighborHints } from './gravity.js';
import { weaveBank } from './weave-bank.js';
import { crosswordBank } from './crossword-bank.js';
import { slots, counts, dimensions, editCell, undo, redo, submitWeave, validateWeave } from './weave.js';
import { renderCrossword, currentRun } from './crossword-ui.js';
import { newSchedule } from './schedule.js';
import { blankSave, commit, decode, giveUp, initial, levels, names, normalize, resultText, statistics, storageKey, dailyDay } from './shared.js';
import { el, button, link, select, label, modal, closeModal, confirm, notify, share, copy } from './ui.js';
const game = document.body.dataset.game === 'semanticgravity' ? 'semanticgravity' : 'wordweave';
const app = document.getElementById('app');
let save = blankSave(), s = null;
let message = '', busy = false, storageBlocked = false, viewedDay = dailyDay();
let gravityModel = null, ranking = null, rankingId = '', modelError = '';
let worker = null, requestNumber = 0;
const pending = new Map();
try {
    save = decode(localStorage.getItem(storageKey(game)), game);
}
catch { /* A blocked browser store does not prevent play. */ }
function persist() { try {
    localStorage.setItem(storageKey(game), JSON.stringify(save));
}
catch {
    if (!storageBlocked)
        notify('Browser storage is unavailable. This visit remains playable, but cannot be saved.');
    storageBlocked = true;
} }
function refreshSave() { if (storageBlocked)
    return; try {
    save = decode(localStorage.getItem(storageKey(game)), game);
}
catch { /* Retain the in-memory visit. */ } }
function update(next) { refreshSave(); const locked = next.mode === 'daily' ? save.daily[next.day] : null; if (locked && locked.phase !== 'playing') {
    s = locked;
    render();
    return;
} s = next; save = commit(save, next); persist(); render(); }
function workerCall(request) {
    if (!worker) {
        worker = new Worker(new URL('./weave-worker.js', import.meta.url), { type: 'module' });
        worker.onmessage = ({ data }) => { const item = pending.get(data.id); if (!item)
            return; clearTimeout(item.timer); pending.delete(data.id); if (data.error)
            item.reject(Error(data.error));
        else
            item.resolve(data); };
        worker.onerror = () => { for (const item of pending.values()) {
            clearTimeout(item.timer);
            item.reject(Error('The solver worker could not be loaded. Please reload.'));
        } pending.clear(); worker?.terminate(); worker = null; };
    }
    const id = ++requestNumber;
    return new Promise((resolve, reject) => { const timer = setTimeout(() => { pending.delete(id); reject(Error('The solver reached its time limit. Try a smaller grid.')); }, 25000); pending.set(id, { resolve, reject, timer }); worker.postMessage({ ...request, id }); });
}
function hydrate(candidate) {
    if (candidate.game === 'semanticgravity' && !gravityTargets.some(p => p.id === candidate.puzzleId))
        throw Error('Saved Gravity publication is unavailable.');
    if (candidate.game === 'wordweave' && validateWeave(candidate.puzzle, false).length)
        throw Error('Saved grid has invalid constraints.');
    return candidate;
}
function daily() {
    const day = dailyDay();
    viewedDay = day;
    const assignment = newSchedule[day]?.[game];
    if (save.daily[day]?.game === 'wordweave' && assignment && save.daily[day].phase === 'playing') {
        const old = save.daily[day];
        if (old?.game === 'wordweave' && old.puzzle.id !== assignment.id && !old.hints && !old.mistakes && old.letters === old.puzzle.givens)
            delete save.daily[day];
    }
    if (save.daily[day]) {
        try {
            s = hydrate(save.daily[day]);
            return;
        }
        catch {
            delete save.daily[day];
            notify('An incompatible saved puzzle was reset.');
        }
    }
    if (!assignment) {
        s = null;
        return;
    }
    const p = game === 'wordweave' ? [...crosswordBank, ...weaveBank].find(p => p.id === assignment.id) : undefined;
    s = { ...initial(game, assignment.id, assignment.level, 'daily', 0, p, null), hard: readHard(game) };
    if (s.game === 'semanticgravity' && s.hard)
        s.limit = Math.min(10, Math.max(5, Math.floor((s.limit || 20) * .6)));
    save = commit(save, s);
    persist();
}
function rollover() { if (viewedDay !== dailyDay()) {
    daily();
    message = 'A new daily puzzle is ready. Your previous progress remains saved.';
    rankingId = '';
    render();
} }
function stillCurrent(key) { rollover(); return s?.key === key && s.phase === 'playing'; }
function applyTheme() { document.documentElement.dataset.theme = save.theme; }
function settings() {
    const theme = select('Color theme', [['system', 'Follow device'], ['light', 'Light'], ['dark', 'Dark']], save.theme, v => { save.theme = v; persist(); applyTheme(); });
    const nodes = [label('Appearance', theme), el('p', 'Scores and active puzzles stay in this browser. There is no account or device sync.', 'muted')];
    const hard = select('Difficulty', [['normal', 'Normal'], ['hard', 'Hard']], readHard(game) ? 'hard' : 'normal', value => { writeHard(game, value === 'hard'); const fresh = s?.phase === 'playing' && !s.guesses.length && !s.hints && !s.mistakes && (s.game !== 'wordweave' || s.letters === s.puzzle.givens && s.past.length === 0); if (fresh && s) {
        s = { ...s, hard: value === 'hard' };
        if (s.game === 'semanticgravity') {
            const normal = [25, 20, 15, 12, 10][s.level - 1];
            s.limit = s.hard ? Math.min(10, Math.max(5, Math.floor(normal * .6))) : normal;
        }
        save = commit(save, s);
        persist();
        render();
    }
    else
        notify('Difficulty saved for your next daily. Today’s mode stays locked.'); });
    nodes.unshift(label('Difficulty', hard), el('p', game === 'semanticgravity' ? 'Hard: fewer guesses and no hints. Choose before starting; later changes apply to your next daily.' : 'Hard: three incorrect submissions and no checking, candidates or letter reveals. Normal allows eight incorrect submissions. Choose before starting; later changes apply tomorrow.', 'muted'));
    if (save.feedback.length)
        nodes.push(button(`View saved alternatives (${save.feedback.length})`, () => { const notes = save.feedback.map(x => `${x.puzzleId}: ${x.guess}`).join('\n'); modal('Alternatives saved on this device.', [el('p', 'These notes have not been sent to Foxhollow Labs.'), el('p', notes), button('Copy notes', () => { void copy(notes); })]); }));
    nodes.push(button('Reset this game’s saved data', () => confirm('Delete saved progress?', 'This removes this game’s scores, streaks, active puzzles, settings and locally saved alternatives. It cannot be undone.', () => { save = blankSave(); persist(); daily(); applyTheme(); render(); }), 'text-button danger'));
    modal('Make it your own.', nodes);
}
function showStats() { const stats = statistics(save), grid = el('div', '', 'stats-grid'); for (const [k, v] of Object.entries({ Attempted: stats.attempted, Finished: stats.finished, Wins: stats.wins, 'Win rate': stats.winRate + '%', 'Daily streak': stats.streak, 'Longest streak': stats.longest, 'Total points': stats.total, 'Best score': stats.best, 'Average score': stats.average })) {
    const box = el('div');
    box.append(el('strong', String(v)), el('span', k));
    grid.append(box);
} modal('A record of small discoveries.', [grid, el('p', 'Finished includes solves and reveals. Streaks count successful New York daily solves only, once per date. One scored puzzle is available each day.', 'muted')]); }
function tutorial() {
    if (game === 'wordweave') {
        modal('Word Weave', [el('p', 'Fill the numbered Across and Down answers. Select a clue or cell, then type. Press Space or click a crossing again to switch direction; use the arrow keys to move.'), el('p', 'There are no automatic correctness marks. Check, reveal and pencil tools are available under Options when you want them. Submit when the crossword is complete.')]);
        return;
    }
    const target = gravityTargets.find(x => x.word === 'ocean') || gravityTargets[0], input = el('input'), feedback = el('p', '', 'tutorial-feedback');
    input.placeholder = 'Try WATER';
    input.setAttribute('aria-label', 'Tutorial answer');
    feedback.setAttribute('role', 'status');
    modal('Every guess pulls you closer.', [el('p', `Example target: ${target.word.toUpperCase()}. Try a guess for its real semantic rank. This example does not change your scores.`), input, button('Try the example', () => { if (!gravityModel) {
            feedback.textContent = 'Loading the semantic model. Please try again shortly.';
            void ensureModel();
            return;
        } const r = rank(gravityModel, target), position = r.ranks.get(normalize(input.value)); feedback.textContent = position ? `Rank #${position} of ${r.ordered.length} · ${temperature(position, r.ordered.length)}` : 'Outside the supported vocabulary. No attempt used.'; }), feedback, el('h3', 'Scoring'), el('p', '100 base points. A valid wrong guess costs 2. Hints cost 10, 15, then 20. Unknown and repeated guesses cost nothing. Daily resets at midnight New York time.')]);
}
async function ensureModel() {
    if (gravityModel || busy && game !== 'semanticgravity')
        return;
    if (modelError)
        return;
    modelError = 'loading';
    render();
    try {
        gravityModel = await loadGravity();
        modelError = '';
        rankingId = '';
        render();
    }
    catch (e) {
        modelError = e instanceof Error ? e.message : 'Could not load model.';
        render();
    }
}
function fieldForm(placeholder, submit) {
    const form = el('form', '', 'guess-form'), input = el('input');
    input.id = 'guess';
    input.name = 'guess';
    input.placeholder = placeholder;
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('aria-label', 'Your guess');
    const send = el('button', 'Send guess ↗', 'primary');
    send.type = 'submit';
    form.append(input, send);
    form.onsubmit = e => { e.preventDefault(); const value = input.value; submit(value); };
    return form;
}
function rankingInfo() {
    modal('A real rank, within a bounded vocabulary.', [el('p', `Each guess is compared with the target using cosine similarity between 50-dimensional pretrained GloVe word vectors. Rank #1 is the target; #2 is the next closest supported word. This edition contains ${gravityModel?.vocabulary.words.length || 6028} words.`), el('p', 'Temperature bands: closest 0.1% extremely hot; 1% very hot; 5% hot; 15% warm; 40% cool; the rest cold. These describe ranks in this vocabulary, not human similarity percentages.'), el('p', 'The diagram shows only distance to the target. Angular positions are illustrative, not pairwise semantic distances. General embeddings blend word senses and reflect their training corpus; unexpected associations can occur.'), link('Model source and license ↗', '/games/data/NEW-GAMES-SOURCES.md'), button('Explore supported vocabulary', showVocabulary)]);
}
function showVocabulary() {
    if (!gravityModel)
        return;
    const search = el('input');
    search.placeholder = 'Search supported words';
    search.setAttribute('aria-label', 'Search supported vocabulary');
    const list = el('p', '', 'word-list');
    const refresh = () => { const matches = gravityModel.vocabulary.words.filter(w => w.includes(normalize(search.value))); list.textContent = `${matches.length} matches. ${matches.slice(0, 80).join(' · ')}${matches.length > 80 ? ' · …' : ''}`; };
    search.oninput = refresh;
    refresh();
    modal('The supported vocabulary.', [search, list]);
}
function gravityView(state, board) {
    const target = gravityTargets.find(p => p.id === state.puzzleId);
    const done = state.phase !== 'playing';
    if (!gravityModel) {
        const loading = el('p', modelError && modelError !== 'loading' ? modelError : 'Loading the frozen semantic model…', 'model-status');
        loading.setAttribute('role', 'status');
        board.append(loading);
        if (modelError && modelError !== 'loading')
            board.append(button('Retry model download', () => { modelError = ''; void ensureModel(); }, 'primary'));
        else if (!modelError)
            queueMicrotask(() => { void ensureModel(); });
        return;
    }
    if (rankingId !== target.id) {
        ranking = rank(gravityModel, target);
        rankingId = target.id;
    }
    const r = ranking, sorted = [...state.ranks].sort((a, b) => a.rank - b.rank), best = sorted[0];
    const field = el('div', '', 'gravity-field');
    field.setAttribute('aria-hidden', 'true');
    for (let i = 1; i <= 3; i++) {
        const ring = el('div', '', 'gravity-ring');
        ring.style.width = `${i * 28}%`;
        ring.style.height = `${i * 28}%`;
        field.append(ring);
    }
    field.append(el('div', done ? target.word : '?', 'gravity-center'));
    for (const item of sorted.slice(0, 8)) {
        const pct = (item.rank - 1) / (r.ordered.length - 1), radius = item.rank === 1 ? 0 : 10 + Math.pow(pct, .45) * 33, angle = hash(item.word) / 4294967296 * Math.PI * 2;
        if (item.rank === 1)
            continue;
        const node = el('span', item.word, 'gravity-node');
        node.style.left = `${50 + radius * Math.cos(angle)}%`;
        node.style.top = `${50 + radius * Math.sin(angle)}%`;
        field.append(node);
    }
    board.append(field, el('p', 'Radius shows proximity to the target. Angles are illustrative. Closest eight guesses shown.', 'viz-caption'));
    if (best)
        board.append(el('p', `Best so far: ${best.word.toUpperCase()} · #${best.rank} · ${temperature(best.rank, r.ordered.length)}`, 'best-guess'));
    if (!done) {
        board.append(fieldForm('Follow a semantic clue…', raw => { if (!stillCurrent(state.key))
            return; const result = gravityGuess(state, target, r, raw); message = result.message; update(result.session); document.getElementById('guess')?.focus(); }));
        const hint = button(`A gravitational nudge · ${state.hints}/3`, () => { if (s?.game === 'semanticgravity') {
            message = '';
            update(gravityHint(s));
        } }, 'secondary');
        hint.disabled = Boolean(state.hard) || state.hints >= 3;
        board.append(hint);
        if (state.hints) {
            const hints = neighborHints(target, r), list = el('ol', '', 'hints');
            list.append(el('li', `General category: ${target.category}`));
            if (state.hints >= 2)
                list.append(el('li', `Model neighbor #${target.hintRanks[0]}: ${hints[0]}`));
            if (state.hints >= 3)
                list.append(el('li', `Model neighbor #${target.hintRanks[1]}: ${hints[1]}`));
            board.append(list);
        }
        board.append(el('p', state.limit === null ? `${state.guesses.length} guesses` : `${state.guesses.length} / ${state.limit} guesses used`, 'guess-count'));
    }
    if (sorted.length) {
        const table = el('table'), caption = el('caption', 'All guesses, closest first'), header = el('tr');
        for (const text of ['Word', 'Rank', 'Feedback', 'Improvement'])
            header.append(el('th', text));
        table.append(caption, header);
        let previous = Infinity;
        const improvements = new Map();
        for (const item of state.ranks) {
            improvements.set(item.word, Number.isFinite(previous) && item.rank < previous ? `↑ ${previous - item.rank}` : '—');
            previous = Math.min(previous, item.rank);
        }
        for (const item of sorted) {
            const row = el('tr');
            for (const value of [item.word, `#${item.rank} / ${r.ordered.length}`, temperature(item.rank, r.ordered.length), improvements.get(item.word)])
                row.append(el('td', value));
            table.append(row);
        }
        board.append(table);
    }
    if (done) {
        const wrong = sorted.filter(x => x.word !== target.word);
        let bestPrior = Infinity, biggest = 0;
        for (const item of state.ranks) {
            if (Number.isFinite(bestPrior))
                biggest = Math.max(biggest, bestPrior - item.rank);
            bestPrior = Math.min(bestPrior, item.rank);
        }
        board.append(el('p', `Target: ${target.word.toUpperCase()}. Closest incorrect guess: ${wrong[0] ? `${wrong[0].word} (#${wrong[0].rank})` : 'none'}. Biggest improvement: ${Math.max(0, biggest)} places.`));
    }
    board.append(button('How ranks work · vocabulary', rankingInfo, 'text-button'));
}
function selectCell(state, index, touch = false, direction) {
    if (state.puzzle.layout[index] === '#')
        return;
    s = { ...state, selected: index, direction: direction || (state.selected === index ? (state.direction === 'down' ? 'across' : 'down') : (state.direction || 'across')) };
    save = commit(save, s);
    persist();
    render();
    document.getElementById(touch ? 'weave-entry' : `cell-${index}`)?.focus({ preventScroll: true });
}
function enterLetter(state, raw) {
    const next = editCell(state, state.selected, raw);
    if (next === state) {
        notify('This letter is fixed or unavailable.');
        return;
    }
    if (!state.pencil && raw) {
        const run = currentRun(state), position = run?.cells.indexOf(state.selected) ?? -1, nextCell = run?.cells.slice(position + 1).find(i => state.puzzle.givens[i] === '.' && !state.hintLetters[i]);
        if (nextCell !== undefined)
            next.selected = nextCell;
    }
    update(next);
}
function weaveOptions(state) {
    const tools = el('div', '', 'weave-option-tools');
    tools.append(button('Reveal crossword', () => { const key = state.key; confirm('Reveal the crossword?', 'This attempt will earn zero points.', () => { if (s && s.key === key)
        update(giveUp(s)); }); }, 'text-button'));
    tools.append(button(state.pencil ? 'Use pen' : 'Use pencil', () => { closeModal(); update({ ...state, pencil: !state.pencil }); }), button('Undo', () => { closeModal(); update(undo(state)); }), button('Redo', () => { closeModal(); update(redo(state)); }), button('Clear notes', () => { closeModal(); update({ ...state, notes: {} }); }), button('Check entries · 5%', () => { closeModal(); void weaveHint(0); }), button('Cell candidates · 10%', () => { closeModal(); void weaveHint(1); }), button('Reveal a letter · 20%', () => { closeModal(); void weaveHint(2); }), button('Reset entries', () => confirm('Reset entries?', 'Your entries and notes are cleared. Revealed letters and scoring penalties stay.', () => { if (s?.game === 'wordweave') {
        const letters = [...s.puzzle.givens];
        for (const [i, c] of Object.entries(s.hintLetters))
            letters[Number(i)] = c;
        update({ ...s, letters: letters.join(''), notes: {}, past: [], future: [] });
    } })));
    if (state.puzzle.inventory !== null) {
        const available = counts(state.puzzle.inventory), used = counts([...state.letters].filter((_, i) => state.puzzle.givens[i] === '.').join(''));
        tools.append(el('p', 'Remaining letters: ' + Object.keys(available).sort().map(c => `${c.toUpperCase()} ×${available[c] - (used[c] || 0)}`).join(' · ')));
    }
    if (state.hard)
        for (const b of tools.querySelectorAll('button'))
            if (/Check entries|Cell candidates|Reveal a letter/.test(b.textContent || ''))
                b.disabled = true;
    modal('Crossword options', [tools, el('p', 'Checks and reveals are optional and use the existing hint penalties. There are no automatic correctness marks.', 'muted')]);
}
function weaveView(state, board) { renderCrossword(state, board, { select: (i, touch, direction) => selectCell(state, i, touch, direction), enter: raw => { if (s?.game === 'wordweave')
        enterLetter(s, raw); }, options: () => weaveOptions(state), submit: () => { if (s?.game !== 'wordweave')
        return; const result = submitWeave(s); message = result.issues.length ? result.issues.join(' ') : 'Crossword complete.'; update(result.session); } }); }
async function weaveHint(type) {
    if (s?.hard) {
        notify('Hints are off in Hard mode.');
        return;
    }
    if (s?.game !== 'wordweave' || s.phase !== 'playing' || busy)
        return;
    const state = s;
    const key = state.key;
    let cell = state.selected;
    if (state.puzzle.givens[cell] !== '.' || state.hintLetters[cell])
        cell = [...state.puzzle.givens].findIndex((c, i) => c === '.' && !state.hintLetters[i] && state.letters[i] === '.');
    if (type !== 0 && cell < 0) {
        notify('Choose an editable cell, or submit the completed grid.');
        return;
    }
    busy = true;
    render();
    try {
        if (type === 0) {
            const result = await workerCall({ action: 'solve', puzzle: state.puzzle, letters: state.letters, cell });
            if (!stillCurrent(key))
                return;
            message = result.issues?.length ? result.issues.join(' ') : result.solutions?.length ? 'At least one valid completion remains. This is consistency feedback, not a revealed answer.' : result.exhausted ? 'These entries create a contradiction: no valid completion remains. Revisit the intersecting rows and columns.' : 'Search limit reached; consistency could not be determined.';
        }
        else if (type === 1) {
            const result = await workerCall({ action: 'candidates', puzzle: state.puzzle, letters: state.letters, cell });
            if (!stillCurrent(key))
                return;
            message = `Row ${Math.floor(cell / dimensions(state.puzzle)[0]) + 1}, column ${cell % dimensions(state.puzzle)[0] + 1}: solver-confirmed candidates ${result.letters?.join(', ').toUpperCase() || 'none'}.${result.unknown?.length ? ' Search inconclusive for ' + result.unknown.join(', ').toUpperCase() + '.' : ''}`;
        }
        else {
            const result = await workerCall({ action: 'solve', puzzle: state.puzzle, letters: state.letters, cell });
            if (!stillCurrent(key))
                return;
            let witness = result.solutions?.[0];
            if (!witness) {
                const fromGivens = await workerCall({ action: 'solve', puzzle: state.puzzle, letters: state.puzzle.givens, cell });
                witness = fromGivens.solutions?.[0];
            }
            if (!witness)
                throw Error('A valid completion could not be found. No hint charged.');
            if (!stillCurrent(key))
                return;
            const letters = [...state.letters];
            letters[cell] = witness[cell];
            s = { ...state, letters: letters.join(''), hintLetters: { ...state.hintLetters, [cell]: witness[cell] }, past: [], future: [], notes: { ...state.notes, [cell]: '' }, selected: cell };
            message = `Revealed ${witness[cell].toUpperCase()} at row ${Math.floor(cell / dimensions(state.puzzle)[0]) + 1}, column ${cell % dimensions(state.puzzle)[0] + 1}, from a solver-verified completion. Undo history cleared to preserve this fixed hint.`;
        }
        if (s?.game === 'wordweave' && s.key === key) {
            const n = [...s.hintsByType];
            n[type]++;
            s = { ...s, hints: s.hints + 1, hintsByType: n, selected: cell >= 0 ? cell : s.selected };
            save = commit(save, s);
            persist();
        }
    }
    catch (e) {
        notify(e instanceof Error ? e.message : 'The hint could not be computed. No hint charged.');
    }
    finally {
        busy = false;
        render();
    }
}
function resultView(state, board) {
    const heading = el('h2', state.phase === 'solved' ? 'Correct! You solved it.' : 'Today’s answer.', 'result-title');
    heading.id = 'result-heading';
    heading.tabIndex = -1;
    const top = el('div', '', 'result-top');
    top.append(el('span', state.phase === 'solved' ? '◆ SOLVED' : '◇ REVEALED', 'eyebrow'), el('strong', `${state.score} pts`, 'result-score'));
    board.append(top, heading);
    const minutes = Math.floor(((state.finished || Date.now()) - state.started) / 60000), seconds = Math.max(0, Math.floor(((state.finished || Date.now()) - state.started) / 1000) % 60), stats = statistics(save);
    board.append(el('p', `${levels[state.level - 1]} · ${minutes}m ${seconds}s · ${state.hints} hints · ${state.game === 'wordweave' ? state.mistakes + ' incorrect submissions' : state.guesses.length + ' guesses'} · Daily streak ${stats.streak}`, 'muted'));
    const details = el('details', '', 'solution-details');
    details.append(el('summary', 'How it works'));
    board.append(details);
    if (state.game === 'semanticgravity')
        gravityView(state, details);
    else {
        const displayed = state.phase === 'failed' ? { ...state, letters: state.puzzle.solution } : state;
        weaveView(displayed, details);
        const formed = slots(state.puzzle.layout, ...dimensions(state.puzzle)).map(slot => slot.cells.map(i => displayed.letters[i]).join(''));
        details.append(el('p', `${formed.length} words formed. Longest: ${formed.reduce((a, b) => b.length > a.length ? b : a, '').toUpperCase()}. ${state.phase === 'failed' ? 'The displayed grid is an example valid completion.' : ''}`));
    }
    const actions = el('div', '', 'actions');
    actions.append(button('Share result ↗', () => { void share(resultText(state)); }, 'primary'), link('Explore more daily games ↗', '/games/', 'secondary'));
    board.append(actions);
}
function render() {
    const focus = document.activeElement?.id, fragment = document.createDocumentFragment();
    const top = el('div', '', 'masthead'), tools = el('div', '', 'toolbar');
    top.append(link('F.  FOXHOLLOW LABS', '/', 'brand'));
    tools.append(button('?', tutorial, 'icon'), button('Stats', showStats, 'tool'), button('Settings', settings, 'tool'));
    tools.children[0].setAttribute('aria-label', 'How to play');
    top.append(tools);
    fragment.append(top);
    const nav = el('nav', '', 'game-switcher');
    nav.setAttribute('aria-label', 'Game collection');
    nav.append(link('All games', '/games/'), link('WordBridge', '/wordbridge/'), link('The Fourth Thing', '/fourthword/'), link('The Odd Rule', '/oddrule/'));
    for (const g of ['semanticgravity', 'wordweave'])
        nav.append(link(names[g], `/${g}/`, g === game ? 'active' : ''));
    fragment.append(nav);
    const header = el('header', '', 'game-hero'), mark = el('div', game === 'semanticgravity' ? '✺' : '▦', 'game-mark');
    mark.setAttribute('aria-hidden', 'true');
    header.append(el('p', 'A FOXHOLLOW DAILY PUZZLE', 'eyebrow'), mark, el('h1', names[game]), el('p', game === 'semanticgravity' ? 'Every guess pulls you closer.' : 'Every letter changes everything.', 'tagline'));
    fragment.append(header);
    const board = el('section', '', 'board');
    board.setAttribute('aria-label', 'Puzzle');
    board.setAttribute('aria-busy', String(busy));
    if (!s) {
        board.append(el('h2', busy ? 'Preparing a verified puzzle…' : 'The next chapter is being prepared.'), el('p', busy ? 'The solver is working in the background.' : 'No daily assignment is published for this New York date. Please check back tomorrow.'));
    }
    else {
        const edition = el('div', '', 'edition');
        edition.append(el('span', `DAILY / ${s.day}`), el('span', `${s.hard ? 'HARD' : 'NORMAL'} MODE`, 'difficulty'));
        board.append(edition);
        if (s.phase !== 'playing')
            resultView(s, board);
        else if (s.game === 'semanticgravity')
            gravityView(s, board);
        else
            weaveView(s, board);
        const feedback = el('p', busy ? 'Solver is checking the constraints…' : message, 'feedback');
        feedback.setAttribute('role', 'status');
        feedback.setAttribute('aria-live', 'polite');
        board.append(feedback);
        if (s.phase === 'playing' && s.game === 'semanticgravity') {
            const reveal = button('Reveal puzzle', () => { const key = s.key; confirm('Reveal this puzzle?', 'This attempt will earn zero points. You can inspect the connections or grid afterward.', () => { if (s && s.key === key)
                update(giveUp(s)); }); }, 'text-button');
            reveal.disabled = busy;
            board.append(reveal);
        }
    }
    fragment.append(board);
    const footer = el('footer', '', 'game-footer'), count = el('p', '', 'countdown');
    count.id = 'countdown';
    footer.append(count, el('p', 'A few quiet minutes. A fresh way to think.'), link('Explore the puzzle collection ↗', '/games/'), button('Sources & dictionary policy', () => modal('Sources, models and words.', [el('p', game === 'semanticgravity' ? 'GloVe 6B 50-dimensional pretrained vectors, filtered into a frozen 6,028-word vocabulary. Rankings are relative to that vocabulary, not all of English.' : 'Crossword clues and accepted senses come from Open English WordNet 2025. Daily grids are verified against their clues and crossings. Older saved grids retain their original dictionary.'), link('Detailed sources and licenses ↗', '/games/data/NEW-GAMES-SOURCES.md')]), 'text-button'), el('p', 'Saved on this browser · No account needed', 'muted'));
    fragment.append(footer);
    app.replaceChildren(fragment);
    countdown();
    if (focus)
        document.getElementById(focus)?.focus({ preventScroll: true });
}
function countdown() { const node = document.getElementById('countdown'); if (!node)
    return; const left = Math.max(0, Math.floor((nextDailyReset() - Date.now()) / 1000)); node.textContent = `Next daily in ${String(Math.floor(left / 3600)).padStart(2, '0')}:${String(Math.floor(left % 3600 / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')} · midnight New York time`; }
document.addEventListener('keydown', e => {
    if (s?.game !== 'wordweave' || s.phase !== 'playing' || busy || document.getElementById('dialog').open)
        return;
    const target = e.target;
    if (target.tagName === 'INPUT' && target.id !== 'weave-entry' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')
        return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        update(e.shiftKey ? redo(s) : undo(s));
        return;
    }
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -dimensions(s.puzzle)[0], ArrowDown: dimensions(s.puzzle)[0] };
    if (e.key === ' ') {
        e.preventDefault();
        selectCell(s, s.selected);
        return;
    }
    if (delta[e.key]) {
        e.preventDefault();
        let next = s.selected + delta[e.key];
        while (next >= 0 && next < s.letters.length && s.puzzle.layout[next] === '#')
            next += delta[e.key];
        if (next >= 0 && next < s.letters.length)
            selectCell(s, next, false, e.key === 'ArrowUp' || e.key === 'ArrowDown' ? 'down' : 'across');
        return;
    }
    if (target.id === 'weave-entry' && e.key !== 'Backspace' && e.key !== 'Delete')
        return;
    if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        update(editCell(s, s.selected, ''));
        return;
    }
    if (/^[a-z]$/i.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        enterLetter(s, e.key);
    }
});
try {
    applyTheme();
    daily();
    render();
}
catch (e) {
    app.replaceChildren(el('h1', 'This puzzle needs another look.'), el('p', e instanceof Error ? e.message : 'Could not prepare the puzzle.'), link('Back to the collection', '/games/'));
}
setInterval(() => { countdown(); rollover(); }, 1000);
window.addEventListener('storage', e => { if (e.key !== storageKey(game))
    return; refreshSave(); daily(); message = 'Progress updated from another tab.'; render(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden)
    rollover(); });
window.addEventListener('pagehide', () => { worker?.terminate(); });
