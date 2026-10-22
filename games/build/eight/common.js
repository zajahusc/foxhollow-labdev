export const normalized = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
export function hash(s) { let h = 2166136261; for (const c of s)
    h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
export function rng(seed) { let a = hash(seed); return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function shuffled(a, random) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
} return b; }
export function permutations(a) { if (!a.length)
    return [[]]; return a.flatMap((x, i) => permutations(a.filter((_, j) => i !== j)).map(rest => [x, ...rest])); }
export function validation(errors, solutions, method) { return { valid: errors.length === 0, errors, solutions, method }; }
export const levels = ['Easy', 'Normal', 'Hard', 'Expert', 'Master'];
export const catalog = {
    lexiconlock: { name: 'Lexicon Lock', tagline: 'Crack the word. Unlock the code.', mark: '⌑', accent: '#7a583a', description: 'Combine letter constraints to open a word lock.' },
    alibi: { name: 'The Alibi', tagline: 'Everyone has a story. Someone is lying.', mark: '◈', accent: '#7b526e', description: 'Arrange the evidence. Find the one false statement.' },
    missingmove: { name: 'The Missing Move', tagline: 'What happened between before and after?', mark: '↷', accent: '#426b88', description: 'Transform a board and reconstruct its missing moves.' },
    tiletheory: { name: 'Tile Theory', tagline: 'Every tile has its place.', mark: '◇', accent: '#3b756c', description: 'Place geometric tiles to satisfy a constellation of rules.' },
    wordfossil: { name: 'Word Fossil', tagline: 'Dig into the history of language.', mark: '⌁', accent: '#9b633d', description: 'Trace modern words back to a documented root.' },
    negativelogic: { name: 'Negative Logic', tagline: 'Find the answer by discovering what it isn’t.', mark: '∉', accent: '#735793', description: 'Cross out possibilities. Let the exclusions speak.' },
    paradoxbox: { name: 'Paradox Box', tagline: 'The answer changes everything.', mark: '⊡', accent: '#9a5960', description: 'Resolve a strange scene by questioning an assumption.' },
    linebyline: { name: 'Line by Line', tagline: 'Recognize the world, one line at a time.', mark: '〰', accent: '#3b6c7b', description: 'Name a landmark as its ink drawing slowly emerges.' },
};
