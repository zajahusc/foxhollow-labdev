import { dimensions, slots } from './weave.js';
import { crosswordLexicon } from './crossword-lexicon.js';
import { el, button, label } from './ui.js';
export function currentRun(s) { const runs = slots(s.puzzle.layout, ...dimensions(s.puzzle)); return runs.find(r => r.direction === (s.direction || 'across') && r.cells.includes(s.selected)) || runs.find(r => r.cells.includes(s.selected)); }
export function renderCrossword(s, board, actions) {
    const p = s.puzzle, [width, height] = dimensions(p), runs = slots(p.layout, width, height), active = currentRun(s), done = s.phase !== 'playing', starts = [...new Set(runs.map(r => r.cells[0]))].sort((a, b) => a - b);
    const clueFor = (run) => p.clues?.[run.id] || { number: starts.indexOf(run.cells[0]) + 1, text: crosswordLexicon[run.cells.map(i => p.solution[i]).join('')]?.text || 'Complete this saved entry from its crossings.' };
    const top = el('div', '', 'crossword-toolbar');
    top.append(el('span', `${width} × ${height} · ${p.clues ? 'Crossword' : p.mode === 'free' ? 'Free Weave' : 'Saved puzzle'}`, 'crossword-edition'));
    if (!done)
        top.append(button('Options', actions.options, 'tool'));
    board.append(top);
    const layout = el('div', '', 'crossword-layout'), left = el('div', '', 'crossword-left'), grid = el('div', '', 'weave-grid crossword-grid');
    grid.style.setProperty('--size', String(width));
    grid.setAttribute('role', 'grid');
    grid.setAttribute('aria-label', 'Word Weave crossword');
    for (let row = 0; row < height; row++) {
        const line = el('div', '', 'weave-row');
        line.setAttribute('role', 'row');
        for (let col = 0; col < width; col++) {
            const i = row * width + col, blocked = p.layout[i] === '#', fixed = p.givens[i] !== '.' || Boolean(s.hintLetters[i]), value = s.letters[i];
            const cell = button('', () => actions.select(i), 'weave-cell' + (blocked ? ' blocked' : '') + (fixed ? ' fixed' : '') + (s.selected === i ? ' current' : '') + (active?.cells.includes(i) ? ' intersects' : ''));
            cell.id = `cell-${i}`;
            cell.setAttribute('role', 'gridcell');
            cell.tabIndex = s.selected === i ? 0 : -1;
            cell.setAttribute('aria-label', blocked ? 'Blocked cell' : `Row ${row + 1}, column ${col + 1}, ${value === '.' ? 'empty' : value.toUpperCase()}${fixed ? ', fixed' : ''}${s.notes[i] ? `, pencil ${s.notes[i]}` : ''}`);
            cell.setAttribute('aria-readonly', String(fixed));
            cell.setAttribute('aria-selected', String(s.selected === i));
            if (blocked) {
                cell.disabled = true;
                cell.tabIndex = -1;
            }
            else {
                const number = starts.indexOf(i) + 1;
                if (number)
                    cell.append(el('span', String(number), 'cell-number'));
                if (value !== '.')
                    cell.append(el('strong', value.toUpperCase()));
                else if (s.notes[i])
                    cell.append(el('span', s.notes[i].toUpperCase().split('').join(' '), 'pencil-notes'));
                cell.onclick = e => actions.select(i, 'pointerType' in e && e.pointerType === 'touch');
            }
            line.append(cell);
        }
        grid.append(line);
    }
    left.append(grid);
    if (active) {
        const clue = clueFor(active);
        left.append(el('p', `${clue.number} ${active.direction === 'across' ? 'Across' : 'Down'} · ${clue.text} (${active.cells.length})`, 'active-clue'));
    }
    if (!done) {
        const entry = el('input');
        entry.id = 'weave-entry';
        entry.setAttribute('aria-label', 'Letter for selected cell');
        entry.autocomplete = 'off';
        entry.autocapitalize = 'characters';
        entry.spellcheck = false;
        entry.maxLength = 1;
        entry.placeholder = 'A–Z';
        entry.oninput = () => { actions.enter(entry.value); document.getElementById('weave-entry')?.focus({ preventScroll: true }); };
        const controls = el('div', '', 'crossword-entry');
        controls.append(label('Letter', entry), button(s.direction === 'down' ? 'Down ↓' : 'Across →', () => actions.select(s.selected, false, s.direction === 'down' ? 'across' : 'down')), button('Submit', actions.submit, 'primary'));
        left.append(controls);
    }
    const clues = el('div', '', 'crossword-clues');
    for (const direction of ['across', 'down']) {
        const group = el('section', '', 'clue-group');
        group.append(el('h3', direction === 'across' ? 'Across' : 'Down'));
        for (const run of runs.filter(r => r.direction === direction)) {
            const c = clueFor(run), b = button('', () => actions.select(run.cells[0], false, direction), 'clue' + (active?.id === run.id ? ' active' : ''));
            b.append(el('strong', String(c.number)), el('span', `${c.text} (${run.cells.length})`));
            b.setAttribute('aria-label', `${c.number} ${direction}: ${c.text}, ${run.cells.length} letters`);
            group.append(b);
        }
        clues.append(group);
    }
    layout.append(left, clues);
    board.append(layout);
}
