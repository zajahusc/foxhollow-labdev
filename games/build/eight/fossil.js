import { normalized, validation } from './common.js';
export const fossilAnswer = (p, answer) => [p.root, ...p.aliases].some(x => normalized(x) === normalized(answer));
export function validateFossil(p) { const errors = []; if (!p.root || p.words.length < (p.mode === 'reconstruction' ? 2 : 3) || p.sources.length < (p.mode === 'evolution' || p.mode === 'reconstruction' ? 1 : 3) || p.sources.some(s => !s.startsWith('https://')) || !p.language || !p.meaning || p.hints.length !== 3)
    errors.push('Missing etymology verification metadata.'); if (p.mode === 'evolution' && (!p.forms || p.forms.length !== 3 || p.periods?.length !== 3))
    errors.push('Missing historical forms.'); if (p.mode === 'reconstruction' && !p.pieces)
    errors.push('Missing morpheme metadata.'); return validation(errors, null, 'Documented root and three individually sourced descendants. Historical relationships are source-backed editorial data, not inferred from spelling.'); }
