import { checkGrid, makeCrossword, makeWeave, solve } from './weave.js';
const scope = globalThis;
scope.onmessage = ({ data }) => {
    try {
        if (data.action === 'generate') {
            scope.postMessage({ id: data.id, puzzle: data.mode === 'crossword' ? makeCrossword(data.level, data.seed, data.level % 4) : makeWeave(data.size, data.mode, data.level, data.seed) });
            return;
        }
        if (data.action === 'solve') {
            const r = solve(data.puzzle, data.letters);
            scope.postMessage({ id: data.id, solutions: r.solutions, exhausted: r.exhausted, issues: checkGrid(data.puzzle, data.letters, false) });
            return;
        }
        const letters = [], unknown = [];
        if (data.puzzle.givens[data.cell] !== '.')
            throw Error('Choose an open editable cell.');
        for (const letter of 'abcdefghijklmnopqrstuvwxyz') {
            const board = [...data.letters];
            board[data.cell] = letter;
            const result = solve(data.puzzle, board.join(''), 1, 30000);
            if (result.solutions.length)
                letters.push(letter);
            else if (!result.exhausted)
                unknown.push(letter);
        }
        scope.postMessage({ id: data.id, letters, unknown });
    }
    catch (e) {
        scope.postMessage({ id: data.id, error: e instanceof Error ? e.message : 'Solver could not finish.' });
    }
};
