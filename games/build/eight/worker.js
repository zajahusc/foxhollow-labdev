import { generate } from './generate.js';
import { validatePuzzle } from './engine.js';
self.onmessage = (event) => { try {
    const puzzle = generate(event.data.game, event.data.level, event.data.seed, event.data.category), check = validatePuzzle(puzzle);
    if (!check.valid)
        throw Error(check.errors.join(' '));
    self.postMessage({ puzzle });
}
catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Puzzle generation failed.' });
} };
