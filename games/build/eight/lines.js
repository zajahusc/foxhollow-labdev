import { normalized, validation } from './common.js';
export function landmarkAnswer(p, answer) { return [p.name, ...p.aliases].some(x => normalized(x) === normalized(answer)); }
export function strokeScore(revealed, total, mistakes, hints) { const fraction = Math.max(0, revealed - 1) / Math.max(1, total - 1); return Math.max(0, Math.round(1000 - 900 * fraction - 30 * mistakes - 75 * hints)); }
export function validateLine(p) { const errors = []; if (!p.landmarkId || !p.name || !Number.isInteger(p.total) || p.total < 5 || p.total > 100 || !p.country || !p.continent || !p.sources.length || p.sources.some(s => !s.startsWith('https://')) || !p.facts.length)
    errors.push('Incomplete illustrated landmark.'); if ([p.name, ...p.aliases].some(x => normalized(x).length < 4))
    errors.push('Alias is too broad.'); return validation(errors, null, 'Hand-authored ordered SVG strokes and source-backed metadata; complete illustrations reviewed as a contact sheet.'); }
