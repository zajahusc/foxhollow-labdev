import { el, button, label, select } from '../newgames/ui.js';
import { clueText } from './lexicon.js';
import { factText } from './alibi.js';
import { applyMove, moveText } from './moves.js';
import { tileGlyphs, tileNames, tileGroups, tileConflicts } from './tiles.js';
const pill = (text) => el('span', text, 'puzzle-pill');
function textEntry(ctx, parent, prompt) { const input = el('input'); input.id = 'answer-input'; input.autocomplete = 'off'; input.spellcheck = false; input.setAttribute('aria-label', prompt); input.placeholder = prompt; input.value = ctx.session.progress.text; const form = el('form', '', 'puzzle-entry'); form.append(label(prompt, input), button('Submit answer', ctx.submit, 'primary')); form.onsubmit = e => { e.preventDefault(); ctx.submit(); }; input.oninput = () => { ctx.session.progress.text = input.value; ctx.change('persist-only'); const letters = parent.querySelectorAll('.lock-slot'); letters.forEach((node, i) => node.textContent = input.value[i]?.toUpperCase() || '·'); }; parent.append(form); return input; }
function notes(ctx, parent, key, title = 'Notebook') { const details = el('details', '', 'notebook'); details.append(el('summary', title)); const area = el('textarea'); area.value = ctx.session.progress.notes[key] || ''; area.setAttribute('aria-label', title); area.placeholder = 'Your own deductions, saved with this puzzle.'; area.oninput = () => { ctx.session.progress.notes[key] = area.value; ctx.change('persist-only'); }; details.append(area); parent.append(details); }
function checkbox(text, checked, action) { const input = el('input'); input.type = 'checkbox'; input.checked = checked; input.onchange = action; return label(text, input); }
export function renderGame(ctx, parent) {
    const s = ctx.session, p = s.puzzle, g = s.progress;
    if (p.game === 'lexiconlock') {
        const lock = el('div', '', 'word-lock');
        lock.setAttribute('aria-label', `${p.word.length}-letter word lock`);
        for (let i = 0; i < p.word.length; i++)
            lock.append(el('span', g.text[i]?.toUpperCase() || '·', 'lock-slot'));
        parent.append(pill(`${p.word.length} letters · ${p.clues.length} constraints`), lock);
        const clues = el('div', '', 'lock-clues');
        p.clues.forEach((c, i) => clues.append(checkbox(clueText(c), g.checked.includes(i), () => { g.checked = g.checked.includes(i) ? g.checked.filter(x => x !== i) : [...g.checked, i]; ctx.change('persist-only'); })));
        parent.append(clues);
        const input = textEntry(ctx, parent, 'Candidate word');
        input.maxLength = p.word.length;
        const keys = el('div', '', 'virtual-keyboard');
        keys.setAttribute('aria-label', 'Letter keyboard');
        for (const row of ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']) {
            const r = el('div');
            for (const letter of row)
                r.append(button(letter.toUpperCase(), () => { if (g.text.length < p.word.length)
                    g.text += letter; ctx.change('answer-input'); }, 'letter-key'));
            keys.append(r);
        }
        keys.append(button('⌫ Delete', () => { g.text = g.text.slice(0, -1); ctx.change('answer-input'); }), button('Clear', () => { g.text = ''; ctx.change('answer-input'); }));
        parent.append(keys);
        notes(ctx, parent, 'letters', 'Candidate-letter notes');
    }
    else if (p.game === 'alibi') {
        parent.append(pill(p.category), el('h2', 'One story does not hold up.', 'puzzle-title'), el('p', p.scenario, 'case-scenario'), el('p', 'Each character gives one testimony. Exactly one testimony is false. A statement joined by AND is true only when both parts are true. Every piece of public evidence is true.', 'game-instruction'));
        if (p.rotation)
            parent.append(el('p', `Badges follow this fixed circular order along the positions: ${p.objects.join(' → ')} → ${p.objects[0]}. Determine which badge starts the row. This is an additional attribute of the arrangement.`, 'evidence-callout'));
        if (p.evidence.length) {
            const evidence = el('div', '', 'public-evidence');
            evidence.append(el('h3', 'Public evidence'));
            for (const f of p.evidence)
                evidence.append(el('p', factText(f, p) + '.'));
            parent.append(evidence);
        }
        const cards = el('div', '', 'testimony-grid');
        p.statements.forEach((statement, i) => { const card = el('div', '', 'testimony'); const avatar = el('span', p.names[i].slice(0, 1), 'avatar'); const radio = el('input'); radio.type = 'radio'; radio.name = 'liar'; radio.checked = g.liar === i; radio.setAttribute('aria-label', `Select ${p.names[i]} as the liar`); radio.onchange = () => { g.liar = i; ctx.change('persist-only'); }; card.append(avatar, el('strong', p.names[i]), el('p', statement.facts.map(f => factText(f, p)).join(' AND ') + '.'), label('False testimony', radio)); cards.append(card); });
        parent.append(cards);
        const order = el('div', '', 'arrangement');
        order.append(el('h3', 'Reconstruct the order'));
        p.slots.forEach((slot, i) => { order.append(label(slot, select(`Person in ${slot}`, p.names.map((name, j) => [String(j), name]), String(g.order[i]), value => { const selected = Number(value), other = g.order.indexOf(selected); [g.order[i], g.order[other]] = [g.order[other], g.order[i]]; ctx.change(); }))); });
        if (p.rotation)
            order.append(label('Badge in the first position', select('First badge', p.objects.map((name, i) => [String(i), name]), String(g.badge), v => { g.badge = Number(v); ctx.change('persist-only'); })));
        parent.append(order, button('Submit deduction', ctx.submit, 'primary'));
        notes(ctx, parent, 'case', 'Case notes');
    }
    else if (p.game === 'missingmove') {
        parent.append(el('p', `Reach the target in at most ${p.limit} move${p.limit === 1 ? '' : 's'}. Every operation below counts as one move; only this palette is permitted. Numbered symbols keep colors optional.`, 'game-instruction'));
        const pair = el('div', '', 'before-after');
        const a = el('div'), b = el('div');
        a.append(el('h3', 'Before'), moveGrid(p.before, p.size, 'Before'));
        b.append(el('h3', 'Target'), moveGrid(p.target, p.size, 'Target'));
        pair.append(a, el('span', '→', 'board-arrow'), b);
        parent.append(pair, el('h3', `Your board · ${g.movePath.length}/${p.limit} moves`), moveGrid(g.board, p.size, 'Working board'));
        const ops = el('div', '', 'operation-palette');
        p.operations.forEach((op, i) => { const b = button(moveText(op), () => { const next = applyMove(g.board, p.size, op); if (next.every((x, j) => x === g.board[j])) {
            ctx.message('That operation has no effect on this board.');
            return;
        } g.board = next; g.movePath.push(i); g.future = []; ctx.change(); }); b.disabled = g.movePath.length >= p.limit; ops.append(b); });
        const tools = el('div', '', 'board-tools');
        const undo = button('Undo', () => { const op = g.movePath.pop(); if (op === undefined)
            return; g.future.push([op]); g.board = g.movePath.reduce((board, index) => applyMove(board, p.size, p.operations[index]), [...p.before]); ctx.change(); }), redo = button('Redo', () => { const op = g.future.pop()?.[0]; if (op === undefined)
            return; g.movePath.push(op); g.board = applyMove(g.board, p.size, p.operations[op]); ctx.change(); });
        undo.disabled = !g.movePath.length;
        redo.disabled = !g.future.length;
        tools.append(undo, redo, button('Reset board', () => { g.board = [...p.before]; g.movePath = []; g.future = []; ctx.change(); }));
        parent.append(ops, tools, button('Submit board', ctx.submit, 'primary'));
    }
    else if (p.game === 'tiletheory') {
        parent.append(el('p', `Each row, each column and the ${p.size} dotted constellation cells must contain every tile exactly once. Shape and color identify the same tile; no color perception is required.`, 'game-instruction'));
        const grid = el('div', '', 'theory-grid');
        grid.style.setProperty('--size', String(p.size));
        grid.setAttribute('role', 'group');
        grid.setAttribute('aria-label', 'Tile grid');
        g.selected = Math.min(g.selected, g.board.length - 1);
        g.board.forEach((value, i) => { const b = button('', () => { g.selected = i; ctx.change(`tile-cell-${i}`); }, `theory-cell ${p.givens[i] ? 'given' : ''} ${g.selected === i ? 'selected' : ''} ${p.constellation.includes(i) ? 'constellation' : ''}`); b.id = `tile-cell-${i}`; b.dataset.value = String(value); b.tabIndex = g.selected === i ? 0 : -1; b.setAttribute('aria-label', `Cell ${i + 1}${p.constellation.includes(i) ? ', constellation' : ''}: ${value ? tileNames[value - 1] : 'empty'}${p.givens[i] ? ', given' : ''}`); b.append(el('span', value ? tileGlyphs[value - 1] : (g.notes[String(i)] || '·'), value ? 'tile-symbol' : 'pencil-note')); b.onkeydown = e => { const d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: p.size, ArrowUp: -p.size }; if (d[e.key] !== undefined) {
            e.preventDefault();
            g.selected = Math.max(0, Math.min(g.board.length - 1, i + d[e.key]));
            ctx.change(`tile-cell-${g.selected}`);
        }
        else if (/^[1-6]$/.test(e.key)) {
            e.preventDefault();
            placeTile(ctx, Number(e.key));
        }
        else if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            placeTile(ctx, 0);
        } }; grid.append(b); });
        parent.append(grid);
        const palette = el('div', '', 'tile-palette');
        for (let v = 1; v <= p.size; v++) {
            const b = button(`${v} · ${tileGlyphs[v - 1]} ${tileNames[v - 1].split(' · ')[0]}`, () => placeTile(ctx, v));
            b.dataset.value = String(v);
            b.setAttribute('aria-label', `Place ${tileNames[v - 1]}`);
            palette.append(b);
        }
        palette.append(button('Erase', () => placeTile(ctx, 0)));
        parent.append(palette);
        const controls = el('div', '', 'board-tools');
        const undo = button('Undo', () => { const board = g.past.pop(); if (board) {
            g.future.push([...g.board]);
            g.board = board;
            ctx.change();
        } }), redo = button('Redo', () => { const board = g.future.pop(); if (board) {
            g.past.push([...g.board]);
            g.board = board;
            ctx.change();
        } });
        undo.disabled = !g.past.length;
        redo.disabled = !g.future.length;
        controls.append(button(g.pencil ? 'Pencil on' : 'Pencil off', () => { g.pencil = !g.pencil; ctx.change(); }), undo, redo, button('Check rules', () => { if (s.hard) {
            ctx.message('Rule checking is off in Hard mode.');
            return;
        } const conflicts = tileConflicts(p, g.board); const done = tileGroups(p).filter(group => group.every(i => g.board[i]) && !group.some(i => conflicts.includes(i))).length; ctx.message(conflicts.length ? `Rule violated in ${conflicts.length} cells. No final answers revealed.` : `${done} rules satisfied; ${tileGroups(p).length - done} not yet decidable. No violations.`); }), button('Reset grid', () => { g.past.push([...g.board]); g.board = [...p.givens]; g.future = []; g.notes = {}; ctx.change(); }));
        if (s.hard)
            for (const b of controls.querySelectorAll('button'))
                if (b.textContent === 'Check rules')
                    b.disabled = true;
        parent.append(controls, button('Submit grid', ctx.submit, 'primary'));
    }
    else if (p.game === 'wordfossil') {
        const mode = p.mode || 'root';
        parent.append(pill(mode === 'evolution' ? 'Word Evolution' : mode === 'reconstruction' ? 'Root Reconstruction' : mode === 'detective' ? 'Etymology Detective' : 'Shared Root'), el('h2', mode === 'evolution' ? 'Put the layers in order.' : mode === 'reconstruction' ? 'Reconstruct the word.' : 'Fragments of a shared history.', 'puzzle-title'));
        if (mode === 'evolution') {
            parent.append(el('p', 'Arrange these documented English spellings from oldest to newest. The historical period labels are revealed after you finish.', 'game-instruction'));
            const order = el('div', '', 'arrangement');
            for (let i = 0; i < 3; i++)
                order.append(label(['Oldest', 'Middle', 'Newest'][i], select(`Historical form ${i + 1}`, p.forms.map((form, j) => [String(j), form]), String(g.order[i]), value => { const selected = Number(value), other = g.order.indexOf(selected); [g.order[i], g.order[other]] = [g.order[other], g.order[i]]; ctx.change(); })));
            parent.append(order, button('Submit history', ctx.submit, 'primary'));
        }
        else {
            const words = mode === 'detective' ? p.words.slice(0, g.clues) : p.words;
            const fragments = el('div', '', 'fossil-fragments');
            words.forEach((word, i) => { const card = el('div', '', 'fossil-fragment'); card.append(el('span', mode === 'reconstruction' ? ['PREFIX', 'ROOT', 'SUFFIX'][i] : `FRAGMENT 0${i + 1}`, 'eyebrow'), el('strong', word.toUpperCase())); fragments.append(card); });
            parent.append(fragments, el('p', mode === 'reconstruction' ? `Combine these documented ${p.language} elements into the modern English word meaning: ${p.meaning}.` : 'Find their documented historical stem. A Latin or Greek source form is accepted alongside the common combining form. Similar spelling alone does not establish a shared history.', 'game-instruction'));
            if (mode === 'detective') {
                const next = button('Uncover another fragment · −30 points', () => { g.clues = Math.min(g.clues + 1, p.words.length); ctx.change(); });
                next.disabled = g.clues >= p.words.length;
                parent.append(next);
            }
            textEntry(ctx, parent, mode === 'reconstruction' ? 'Reconstructed word' : 'Root or historical stem');
        }
        notes(ctx, parent, 'dig', 'Excavation notes');
    }
    else if (p.game === 'negativelogic') {
        parent.append(pill(`${p.category} / ${p.candidates.length} possibilities`), el('h2', 'Let the exclusions speak.', 'puzzle-title'), el('p', 'Cross out a card to eliminate it, or restore it. Choose a possible answer with its radio button. Your notes never cost points. Submit whenever you can deduce the answer.', 'game-instruction'));
        const definition = p.category.startsWith('Animals') ? 'Animal attributes refer to healthy adults; leg counts include vestigial legs but exclude wings and octopus arms. Egg-laying refers to the species, including sterile workers.' : p.category.startsWith('Geography') ? 'Country regions follow UN M49 statistical subregions. Capital locations use mainland versus island; coastlines refer to the sovereign state.' : p.category.startsWith('History') ? 'Centuries run from year 01 through 100. Their quarters are years 01–25, 26–50, 51–75 and 76–100.' : p.category.startsWith('Everyday') ? 'Instrument properties refer to ordinary acoustic versions and standard construction. More than one sound-producing mechanism can apply.' : '';
        if (definition)
            parent.append(el('p', definition, 'muted'));
        const clues = el('ol', '', 'negative-clues');
        p.clues.slice(0, g.clues).forEach(c => clues.append(el('li', c.text)));
        parent.append(clues);
        const next = button(`Reveal next exclusion · ${Math.min(g.clues, p.clues.length)}/${p.clues.length}`, () => { g.clues = Math.min(g.clues + 1, p.clues.length); ctx.change(); });
        next.disabled = g.clues >= p.clues.length;
        parent.append(next);
        const cards = el('div', '', 'candidate-grid');
        p.candidates.forEach((c, i) => { const card = el('div', '', `candidate ${g.eliminated.includes(c.id) ? 'eliminated' : ''} ${g.possible.includes(c.id) ? 'possible' : ''}`); const radio = el('input'); radio.type = 'radio'; radio.name = 'candidate'; radio.checked = g.choice === i; radio.setAttribute('aria-label', `Choose ${c.label}`); radio.onchange = () => { g.choice = i; ctx.change('persist-only'); }; card.append(label(c.label, radio), button(g.eliminated.includes(c.id) ? 'Restore' : 'Cross out', () => { g.eliminated = g.eliminated.includes(c.id) ? g.eliminated.filter(x => x !== c.id) : [...g.eliminated, c.id]; ctx.change(); }, 'candidate-note'), button(g.possible.includes(c.id) ? 'Unmark ?' : 'Mark ?', () => { g.possible = g.possible.includes(c.id) ? g.possible.filter(x => x !== c.id) : [...g.possible, c.id]; ctx.change(); }, 'candidate-note')); cards.append(card); });
        parent.append(cards, button('Submit answer', ctx.submit, 'primary'));
    }
    else if (p.game === 'paradoxbox') {
        parent.append(pill('A different point of view'), el('blockquote', p.scenario, 'scenario-card'));
        if (!g.choicesShown)
            parent.append(el('p', 'Think it through first. You can ask for a clue before opening the four explanations.', 'game-instruction'), button('Show the explanations', () => { g.choicesShown = true; ctx.change(); }, 'primary'));
        else {
            const choices = el('div', '', 'paradox-choices');
            p.choices.forEach((choice, i) => { const b = button(choice, () => { g.choice = i; ctx.change(`choice-${i}`); }, `paradox-choice ${g.choice === i ? 'selected' : ''}`); b.id = `choice-${i}`; b.setAttribute('aria-pressed', String(g.choice === i)); choices.append(b); });
            parent.append(choices, button('Submit explanation', ctx.submit, 'primary'));
        }
        notes(ctx, parent, 'assumption', 'What am I assuming?');
    }
    else {
        const frame = el('div', '', 'drawing-frame');
        frame.append(drawing(ctx.drawings[p.landmarkId] || [], g.strokes, ctx.save.animation));
        const caption = el('p', `${g.strokes} / ${p.total} strokes revealed`, 'drawing-caption');
        frame.append(caption);
        parent.append(frame);
        const draw = button(g.strokes === 0 ? 'Draw the first line' : 'Draw another line', () => { g.strokes = Math.min(p.total, g.strokes + 1); ctx.change('draw-line'); }, 'primary');
        draw.id = 'draw-line';
        draw.disabled = g.strokes >= p.total;
        parent.append(draw, el('p', 'Name this landmark. Approved alternative names and accents are accepted. Reveal more strokes whenever you need them.', 'game-instruction'));
        textEntry(ctx, parent, 'What landmark is this?');
    }
}
export function moveGrid(board, size, name) { const grid = el('div', '', 'move-grid'); grid.style.setProperty('--size', String(size)); grid.setAttribute('role', 'img'); grid.setAttribute('aria-label', `${name}: ${board.map(x => x || 'empty').join(', ')}`); for (const value of board) {
    const cell = el('span', value ? String(value) : '·', 'move-tile');
    cell.dataset.value = String(value % 6 + 1);
    grid.append(cell);
} return grid; }
export function drawing(paths, shown, animate) { const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 320 240'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', `Landmark line drawing, ${shown} strokes visible`); svg.classList.add('landmark-drawing'); for (const [i, path] of paths.slice(0, shown).entries()) {
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', path);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', 'currentColor');
    p.setAttribute('stroke-width', '2.4');
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    p.setAttribute('pathLength', '1');
    if (animate && i === shown - 1)
        p.classList.add('new-stroke');
    svg.append(p);
} return svg; }
function placeTile(ctx, value) { const p = ctx.session.puzzle, g = ctx.session.progress; if (p.game !== 'tiletheory' || p.givens[g.selected] || value > p.size)
    return; if (g.pencil) {
    const key = String(g.selected), existing = g.notes[key] || '';
    g.notes[key] = value === 0 ? '' : existing.includes(String(value)) ? existing.replace(String(value), '') : existing + value;
}
else {
    g.past.push([...g.board]);
    g.past = g.past.slice(-100);
    g.future = [];
    g.board[g.selected] = value;
    delete g.notes[String(g.selected)];
} ctx.change(`tile-cell-${g.selected}`); }
export function resetProgress(s) { return { ...s.progress, text: '', checked: [], notes: {} }; }
