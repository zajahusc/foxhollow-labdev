import { dailyDay, nextDailyReset } from '../time.js';
import { el, button, link, label, select, modal, confirm, share, notify } from '../newgames/ui.js';
import { catalog, levels } from './common.js';
import { blankSave, storageKey, decode, initial, commit, submit, useHint, reveal, statistics, shareText, explanation, choosePractice, validatePuzzle } from './engine.js';
import { negativeCategories } from './negative.js';
import { renderGame, moveGrid, drawing } from './views.js';
const game = document.body.dataset.game, info = catalog[game], app = document.getElementById('app');
let save = blankSave(game), session = null, publication = null, mode = 'daily', level = 2, fossilMode = 'Any', negativeCategory = 'Any', viewedDay = dailyDay(), message = '', busy = false, storageBlocked = false, failure = '', drawings = {}, continuousPlaying = false;
try {
    save = decode(localStorage.getItem(storageKey(game)), game);
}
catch {
    storageBlocked = true;
}
function persist() { if (session?.mode === 'daily' && !save.records.some(r => r.key === `daily:${session.day}`) && !storageBlocked) {
    try {
        const raw = localStorage.getItem(storageKey(game)), candidate = raw ? JSON.parse(raw)?.daily?.[session.day] : null;
        const latest = candidate?.phase && candidate.phase !== 'playing' ? decode(raw, game) : null, finished = latest?.daily[session.day];
        if (finished && finished.phase !== 'playing' && latest) {
            save = { ...latest, theme: save.theme, animation: save.animation, hintOrder: save.hintOrder, continuous: save.continuous };
            session = finished;
        }
    }
    catch { /* The active visit remains playable. */ }
} if (session)
    save = commit(save, session); try {
    localStorage.setItem(storageKey(game), JSON.stringify(save));
}
catch {
    if (!storageBlocked)
        notify('Browser storage is unavailable. You can play during this visit.');
    storageBlocked = true;
} }
function sync() { if (storageBlocked)
    return; try {
    save = decode(localStorage.getItem(storageKey(game)), game);
}
catch { /* Preserve active visit. */ } }
function daily() { viewedDay = dailyDay(); const saved = save.daily[viewedDay]; if (saved) {
    session = saved;
    return;
} const id = publication?.schedule[viewedDay], puzzle = publication?.puzzles.find(p => p.id === id); session = puzzle ? initial(puzzle, 'daily', 0, viewedDay) : null; if (session)
    persist(); }
function rollover() { if (mode === 'daily' && viewedDay !== dailyDay()) {
    continuousPlaying = false;
    sync();
    daily();
    message = 'A new daily is ready. Your previous progress remains saved.';
    render();
} }
function change(focus) { persist(); if (focus !== 'persist-only')
    render(focus); }
function doSubmit() {
    if (!session || session.phase !== 'playing' || busy)
        return;
    const before = session;
    rollover();
    if (before !== session) {
        notify('New York midnight has passed. This is the new daily.');
        return;
    }
    const p = session.puzzle, g = session.progress;
    if (['lexiconlock', 'wordfossil', 'linebyline'].includes(p.game) && !(p.game === 'wordfossil' && p.mode === 'evolution') && !g.text.trim()) {
        notify('Enter an answer first.');
        return;
    }
    if ((p.game === 'paradoxbox' || p.game === 'negativelogic') && g.choice < 0) {
        notify('Choose an answer first.');
        return;
    }
    if (p.game === 'alibi' && g.liar < 0) {
        notify('Choose whose testimony is false.');
        return;
    }
    session = submit(session);
    message = session.phase === 'playing' ? `That does not satisfy this puzzle. ${8 - session.mistakes} attempts remain.` : '';
    if (session.phase !== 'playing')
        continuousPlaying = false;
    persist();
    render(session.phase === 'playing' ? 'answer-input' : 'result-heading');
}
function switchMode(next) { if (busy || next === mode)
    return; const action = () => { continuousPlaying = false; mode = next; message = ''; sync(); if (mode === 'daily')
    daily();
else if (save.practice) {
    session = save.practice;
    level = session.puzzle.level;
}
else {
    void newPractice();
    return;
} render(); }; if (session?.phase === 'playing')
    confirm('Switch puzzles?', 'Your progress is saved. You can return whenever you like.', action);
else
    action(); }
async function generatedPractice() { return new Promise((resolve, reject) => { const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' }); const timer = setTimeout(() => { worker.terminate(); reject(Error('The generator took too long. Try another puzzle.')); }, 20000); worker.onmessage = event => { clearTimeout(timer); worker.terminate(); if (event.data.error)
    reject(Error(event.data.error));
else
    resolve(event.data.puzzle); }; worker.onerror = event => { event.preventDefault(); clearTimeout(timer); worker.terminate(); reject(Error('The puzzle worker could not load. Reload and try again.')); }; worker.postMessage({ game, level, seed: `practice-${game}-${save.serial}-${Date.now()}`, category: negativeCategory === 'Any' ? undefined : negativeCategory }); }); }
async function newPractice() { if (!publication || busy)
    return; const run = async () => { busy = true; continuousPlaying = false; message = ''; mode = 'practice'; save.serial++; render(); try {
    const procedural = ['lexiconlock', 'alibi', 'missingmove', 'tiletheory', 'negativelogic'].includes(game);
    const p = procedural ? await generatedPractice() : choosePractice(publication.puzzles.filter(p => game !== 'wordfossil' || fossilMode === 'Any' || p.game === 'wordfossil' && p.mode === fossilMode), level, [...save.recent, ...(session ? [session.puzzle.id] : [])], save.serial, game);
    if (!validatePuzzle(p).valid)
        throw Error('This puzzle did not pass validation.');
    session = initial(p, 'practice', save.serial);
    persist();
}
catch (error) {
    save.serial = Math.max(0, save.serial - 1);
    if (session)
        mode = session.mode;
    message = error instanceof Error ? error.message : 'Practice could not be prepared.';
    notify(message);
}
finally {
    busy = false;
    render();
} }; if (session?.phase === 'playing' && session.mode === 'practice' && mode === 'practice')
    confirm('Start a fresh practice puzzle?', 'This replaces unfinished practice. Your daily progress stays saved.', () => void run());
else
    await run(); }
const help = {
    lexiconlock: ['Use every constraint to identify one word in the frozen published dictionary. A, E, I, O and U are vowels; Y is a consonant.', 'Check off clues you have considered. The letter keyboard and notebook are optional. Guesses do not reveal individual letter correctness.', '500 base points; a miss costs 50, a hint costs 75. A first-attempt solution adds 100.'],
    alibi: ['Reconstruct the listed order with the person selectors, then select the one false testimony. Public evidence is always true.', 'One testimony belongs to each character. AND is a conjunction: a testimony is false if either clause is false. Exactly one testimony is false overall.', 'Expert and Master add circular badge assignments. Follow the displayed badge order and choose its starting badge.'],
    missingmove: ['Use only the printed operations to transform the working board into the target within its move limit. Each button applies one move immediately.', 'Rows wrap one place right. Columns wrap one place down. Reversals mirror only the named row/column. Board rotation is 90° clockwise. Swaps exchange the two numbered cells. A slide moves a neighboring tile into the specified empty cell; it is legal only while that destination is empty.', 'Undo, redo and reset do not count as extra moves. Any valid route to the target within the limit is accepted.'],
    tiletheory: ['Each row, column and dotted constellation must contain one of every tile. Colors repeat the shapes for a second visual cue.', 'Select a cell, then choose a tile or press its number. Arrow keys move; Delete erases. Given cells stay fixed.', 'Pencil marks are personal notes. Check rules distinguishes satisfied, violated and incomplete rules without showing the final answer.'],
    wordfossil: ['Identify the documented historical stem shared by three modern words. A common stem or approved historical form is accepted.', 'These are real etymological families. Similar spelling alone is not evidence of shared origin. Sources are linked after completion.', 'Practice includes Shared Root, Etymology Detective, Word Evolution and Root Reconstruction. Historical forms are sourced, with period labels explained after completion. 700 points; a hint costs 100, a miss 50. Extra detective fragments cost 30.'],
    negativelogic: ['Every clue says something the answer is NOT. Cross out candidates that match the excluded property.', 'You can restore or mark possibilities freely. Use a radio button to pick the final answer. Additional exclusions lower the available score by 30.', 'Choose numbers, spelling, geometry, animals, countries, chemical elements, dated history or acoustic instruments. Definitions and citations accompany the factual sets. Only the complete clue set guarantees a unique survivor.'],
    paradoxbox: ['Read the scenario literally, then choose the explanation that fits every stated fact.', 'Harder scenarios initially hide choices. Reveal them when ready, or request a clue first.', 'Each alternative has a specific contradiction, explained after the game. The 20 original scenes cycle in practice.'],
    linebyline: ['Begin with a blank canvas. Draw a line to reveal the next meaningful stroke, or enter the landmark at any time.', 'Approved aliases are case and accent insensitive. Generic answers such as tower are not enough. Hints reveal continent, category and country; change their order in Settings.', 'The first stroke allows 1,000 points, the final stroke 100 before penalties. Each miss costs 30 and each hint 75. Continuous drawing is optional in Settings.'],
};
function instructions() { let step = 0; const body = el('div'), demo = button('Try a practice example', () => { document.getElementById('dialog').close(); mode = 'practice'; void newPractice(); }, 'primary'); const show = () => { body.replaceChildren(el('p', `Step ${step + 1} of ${help[game].length}`, 'eyebrow'), el('p', help[game][step])); const actions = el('div', '', 'actions'); if (step)
    actions.append(button('Previous', () => { step--; show(); })); if (step < help[game].length - 1)
    actions.append(button('Next instruction', () => { step++; show(); }));
else
    actions.append(demo); body.append(actions); }; show(); modal('A little way to play.', [body, el('p', 'Every daily resets at midnight New York time. Eight incorrect submissions end a puzzle. Revealing scores zero. Practice never changes your daily streak.', 'muted')]); }
function settings() { const theme = select('Color theme', [['system', 'Follow device'], ['light', 'Light'], ['dark', 'Dark']], save.theme, v => { save.theme = v; document.documentElement.dataset.theme = v; persist(); }); const animation = el('input'); animation.type = 'checkbox'; animation.checked = save.animation; animation.onchange = () => { save.animation = animation.checked; persist(); }; const nodes = [label('Color theme', theme), label('Animate new drawing strokes', animation)]; if (game === 'linebyline') {
    const continuous = el('input');
    continuous.type = 'checkbox';
    continuous.checked = save.continuous;
    continuous.onchange = () => { save.continuous = continuous.checked; continuousPlaying = false; persist(); render(); };
    nodes.push(label('Offer continuous drawing controls', continuous), label('Geographic hint order', select('Hint order', [['geography', 'Continent → category → country'], ['category', 'Category → continent → country']], save.hintOrder, v => { save.hintOrder = v; persist(); })));
} nodes.push(el('p', 'Progress and statistics are saved in this browser. There is no account or device sync.', 'muted'), button('Clear this game’s saved progress', () => confirm('Clear this game?', 'This removes every score and puzzle saved for this game on this browser.', () => { save = blankSave(game); session = null; mode = 'daily'; document.documentElement.dataset.theme = 'system'; daily(); persist(); render(); }), 'danger')); modal('A little your way.', nodes); }
function showStats() { const stats = statistics(save), grid = el('div', '', 'stats-grid'); for (const [text, value] of Object.entries({ 'Total played': stats.attempted, 'Completed': stats.completed, 'Win rate': `${stats.winRate}%`, 'Daily streak': stats.streak, 'Longest streak': stats.longest, 'Personal best': stats.best, 'Average score': stats.average, 'Average hints': stats.averageHints })) {
    const item = el('div');
    item.append(el('strong', String(value)), el('span', text));
    grid.append(item);
} const table = el('table'); table.append(el('caption', 'By difficulty')); for (const r of stats.byLevel) {
    const row = el('tr');
    row.append(el('th', levels[r.level - 1]), el('td', `${r.played} finished`), el('td', `${r.wins} wins`));
    table.append(row);
} const nodes = [grid, table, el('p', 'Streaks count successful daily solves once per New York date. Reveals and exhausted attempts score zero. Practice does not affect streaks.', 'muted')]; if (game === 'linebyline') {
    nodes.push(el('p', `Average strokes on wins: ${stats.averageStrokes} · Fewest strokes: ${stats.fewestStrokes}`));
    for (const field of ['continent', 'category']) {
        const counts = new Map();
        for (const r of save.records.filter(r => r.won))
            counts.set(r[field], (counts.get(r[field]) || 0) + 1);
        nodes.push(el('h3', field === 'continent' ? 'Wins by continent' : 'Wins by landmark category'));
        for (const [name, n] of counts)
            nodes.push(el('p', `${name}: ${n}`));
    }
} modal('A record of small discoveries.', nodes); }
function resultView(parent) {
    if (!session)
        return;
    const s = session, p = s.puzzle;
    const title = el('h2', s.phase === 'solved' ? 'A little discovery.' : s.phase === 'lost' ? 'The answer, uncovered.' : 'The full picture.', 'result-title');
    title.id = 'result-heading';
    title.tabIndex = -1;
    parent.append(el('p', `${s.score} POINTS · ${s.hints} HINTS · ${s.mistakes} MISSES`, 'eyebrow'), title);
    if (p.game === 'missingmove')
        parent.append(moveGrid(p.target, p.size, 'Solved target'));
    if (p.game === 'tiletheory') {
        const symbols = ['●', '■', '▲', '◆', '★', '⬢'];
        const grid = el('div', '', 'theory-grid');
        grid.style.setProperty('--size', String(p.size));
        for (const v of p.solution) {
            const cell = el('span', symbols[v - 1], 'theory-cell');
            cell.dataset.value = String(v);
            grid.append(cell);
        }
        parent.append(grid);
    }
    if (p.game === 'linebyline') {
        const frame = el('div', '', 'drawing-frame');
        frame.id = 'result-drawing';
        frame.append(drawing(drawings[p.landmarkId] || [], p.total, false));
        parent.append(frame, el('p', `${s.progress.strokes}/${p.total} strokes used · ${p.country} · ${p.category}`));
        const replay = button('Replay drawing', () => { const paths = drawings[p.landmarkId] || []; frame.replaceChildren(drawing(paths, 0, false)); let n = 0; const timer = setInterval(() => { if (!frame.isConnected) {
            clearInterval(timer);
            return;
        } n++; frame.replaceChildren(drawing(paths, n, save.animation)); if (n >= paths.length)
            clearInterval(timer); }, save.animation ? 450 : 80); });
        parent.append(replay);
    }
    for (const text of explanation(p))
        parent.append(el('p', text, 'explanation'));
    if (p.game === 'wordfossil' || p.game === 'linebyline') {
        const sources = el('div', '', 'source-links');
        sources.append(el('h3', 'Explore the sources'));
        p.sources.forEach((url, i) => { const a = link(`Reference ${i + 1} ↗`, url); a.target = '_blank'; a.rel = 'noopener noreferrer'; sources.append(a); });
        parent.append(sources);
    }
    if (p.game === 'negativelogic' && p.candidates.some(c => c.sources?.length)) {
        const details = el('details', '', 'notebook');
        details.append(el('summary', 'Candidate attributes & verification sources'));
        for (const c of p.candidates) {
            details.append(el('h3', c.label), el('p', p.clues.filter(clue => clue.kind === 'tag').map(clue => `${clue.text.slice(10)} ${c.tags?.[String(clue.value)] ? 'yes' : 'no'}`).join(' · '), 'muted'));
            for (const [i, url] of (c.sources || []).entries()) {
                const a = link(`Reference ${i + 1} ↗`, url);
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                details.append(a, el('span', ' '));
            }
        }
        parent.append(details);
    }
    const actions = el('div', '', 'actions');
    actions.append(button('Share result ↗', () => void share(shareText(s)), 'primary'), button('Play another', () => { mode = 'practice'; void newPractice(); }));
    parent.append(actions, el('p', 'Your first daily result is saved. Replaying does not replace it.', 'muted'));
}
function render(focus) {
    document.documentElement.dataset.theme = save.theme;
    app.replaceChildren();
    const head = el('div', '', 'masthead'), tools = el('div', '', 'toolbar');
    tools.append(button('?', instructions, 'icon'), button('Stats', showStats, 'tool'), button('Settings', settings, 'tool'));
    tools.firstElementChild.setAttribute('aria-label', 'How to play');
    head.append(link('F. FOXHOLLOW LABS', '/', 'brand'), tools);
    const nav = el('nav', '', 'game-switcher');
    nav.setAttribute('aria-label', 'Game collection');
    nav.append(link('All games ↗', '/games/'), select('Jump to another puzzle', Object.entries(catalog).map(([id, c]) => [id, c.name]), game, v => { location.href = `/${v}/`; }));
    const hero = el('header', '', 'game-hero');
    hero.append(el('p', 'A FOXHOLLOW DAILY PUZZLE', 'eyebrow'), el('div', info.mark, 'game-mark'), el('h1', info.name), el('p', info.tagline, 'tagline'));
    const modes = el('nav', '', 'mode-tabs');
    modes.setAttribute('aria-label', 'Puzzle mode');
    for (const [value, text] of [['daily', 'Daily challenge'], ['practice', 'Unlimited practice']]) {
        const b = button(text, () => switchMode(value), mode === value ? 'active' : '');
        b.setAttribute('aria-pressed', String(mode === value));
        b.disabled = busy;
        modes.append(b);
    }
    app.append(head, nav, hero, modes);
    if (mode === 'practice') {
        const filters = el('div', '', 'practice-filters');
        filters.append(label('Difficulty', select('Difficulty', levels.map((l, i) => [String(i + 1), l]), String(level), v => { level = Number(v); })), button('New puzzle ↻', () => void newPractice()));
        if (game === 'negativelogic')
            filters.insertBefore(label('Category', select('Category', [['Any', 'Any category'], ...negativeCategories.map((c) => [c, c])], negativeCategory, v => { negativeCategory = v; })), filters.lastChild);
        if (game === 'wordfossil')
            filters.insertBefore(label('Fossil mode', select('Fossil mode', [['Any', 'Any mode'], ['root', 'Shared Root'], ['detective', 'Etymology Detective'], ['evolution', 'Word Evolution'], ['reconstruction', 'Root Reconstruction']], fossilMode, v => { fossilMode = v; })), filters.lastChild);
        app.append(filters);
        if (['wordfossil', 'paradoxbox', 'linebyline'].includes(game))
            app.append(el('p', `Practice explores ${publication?.puzzles.length || 20} verified ${game === 'linebyline' ? 'illustrations' : game === 'wordfossil' ? 'language puzzles' : 'original scenarios'}. It avoids recent entries, then cycles through the collection.`, 'muted practice-note'));
        else
            app.append(el('p', 'New seeded puzzles are generated and validated in a background worker. The published dictionary and mathematical space are finite.', 'muted practice-note'));
    }
    const board = el('section', '', 'board eight-board');
    board.setAttribute('aria-label', `${info.name} puzzle`);
    board.setAttribute('aria-busy', String(busy));
    if (failure) {
        board.append(el('h2', 'The puzzle could not load.'), el('p', failure), button('Try loading again', () => void load(), 'primary'));
    }
    else if (!publication || busy) {
        board.append(el('p', busy ? 'Preparing a verified puzzle…' : 'Opening the puzzle collection…', 'loading'));
    }
    else if (!session)
        board.append(el('h2', 'A fresh chapter is being prepared.'), el('p', 'There is no published daily for this New York date. Unlimited practice is available.'), button('Play practice', () => { mode = 'practice'; void newPractice(); }, 'primary'));
    else {
        const edition = el('div', '', 'edition');
        edition.append(el('span', mode === 'daily' ? `DAILY / ${session.day}` : 'PRACTICE / NO STREAK PRESSURE'), el('span', levels[session.puzzle.level - 1], 'difficulty'));
        board.append(edition);
        if (session.phase !== 'playing')
            resultView(board);
        else {
            const target = el('div', '', 'game-content');
            renderGame({ session, save, change, submit: doSubmit, drawings, message: text => { message = text; const node = document.getElementById('game-message'); if (node)
                    node.textContent = text; } }, target);
            board.append(target);
            if (game === 'linebyline' && save.continuous) {
                const controls = el('div', '', 'board-tools');
                controls.append(button(continuousPlaying ? 'Pause drawing' : 'Start continuous drawing', () => { continuousPlaying = !continuousPlaying; render(); }), el('p', 'One stroke every 3 seconds. Pause before guessing.', 'muted'));
                board.append(controls);
            }
            const feedback = el('p', message, 'feedback');
            feedback.id = 'game-message';
            feedback.setAttribute('role', 'status');
            board.append(feedback);
            for (const text of session.hintTexts)
                board.append(el('p', text, 'hint-card'));
            const tools = el('div', '', 'helpers');
            const hint = button(`Hint · ${session.hints}/3`, () => { if (!session)
                return; const before = session; rollover(); if (!session || session !== before) {
                notify('A new daily has started. Choose again when ready.');
                return;
            } session = useHint(session, save.hintOrder); persist(); render(); });
            hint.disabled = session.hints >= 3;
            tools.append(hint, button('Reveal solution', () => confirm('Reveal the solution?', 'This ends the puzzle with zero points. Your first daily result cannot be replaced.', () => { if (!session)
                return; const before = session; rollover(); if (session !== before) {
                notify('A new daily has started. Choose again when ready.');
                return;
            } if (session) {
                session = reveal(session);
                continuousPlaying = false;
                persist();
                render('result-heading');
            } }), 'text-button'));
            board.append(tools, el('p', `Eight incorrect submissions end the puzzle. ${session.mistakes}/8 used. Hints and misses reduce your score.`, 'muted'));
        }
    }
    app.append(board);
    const footer = el('footer', '', 'game-footer'), count = el('p');
    count.id = 'countdown';
    footer.append(count, el('p', 'A few quiet minutes. A fresh way to think.'), link('Explore the puzzle collection ↗', '/games/'), link('Sources & puzzle policy ↗', '/games/EIGHT-GAMES.md'), el('p', storageBlocked ? 'Storage unavailable · Playable for this visit' : 'Saved on this browser · No account needed', 'muted'));
    app.append(footer);
    countdown();
    if (focus)
        document.getElementById(focus)?.focus({ preventScroll: true });
}
function countdown() { const node = document.getElementById('countdown'); if (!node)
    return; const left = Math.max(0, Math.floor((nextDailyReset() - Date.now()) / 1000)); node.textContent = `Next daily in ${String(Math.floor(left / 3600)).padStart(2, '0')}:${String(Math.floor(left % 3600 / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')} · midnight New York time`; }
async function load() { failure = ''; render(); try {
    const response = await fetch(`/games/data/eight/${game}.json`);
    if (!response.ok)
        throw Error(`Puzzle collection unavailable (${response.status}). Please try again.`);
    const data = await response.json();
    if (data.version !== 1 || data.game !== game || !Array.isArray(data.puzzles) || !data.schedule)
        throw Error('Unrecognized puzzle publication.');
    for (const p of data.puzzles)
        if (!validatePuzzle(p).valid)
            throw Error('The published puzzle validation failed.');
    publication = data;
    if (game === 'linebyline')
        drawings = (await import('./landmarks.js')).landmarkDrawings;
    daily();
    render();
}
catch (error) {
    failure = error instanceof Error ? error.message : 'Check your connection and reload.';
    render();
} }
setInterval(() => { countdown(); rollover(); }, 1000);
setInterval(() => { if (continuousPlaying && session?.phase === 'playing' && session.puzzle.game === 'linebyline' && !document.hidden && !document.getElementById('dialog').open) {
    session.progress.strokes = Math.min(session.puzzle.total, session.progress.strokes + 1);
    if (session.progress.strokes >= session.puzzle.total)
        continuousPlaying = false;
    persist();
    render();
} }, 3000);
document.addEventListener('visibilitychange', () => { if (!document.hidden)
    rollover(); });
window.addEventListener('storage', e => { if (e.key === storageKey(game)) {
    sync();
    if (mode === 'daily')
        daily();
    else
        session = save.practice;
    render();
} });
void load();
