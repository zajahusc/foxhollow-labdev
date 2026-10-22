import { validatePuzzle } from './data.js';
export const key = (game) => `foxhollow.${game}.v1`;
export function empty() { return { version: 1, daily: {}, practice: null, records: [], attempted: [], recent: [], practiceSerial: 0, settings: { nameRule: false, theme: 'system', maxMistakes: 3 }, feedback: [] }; }
const obj = (x) => typeof x === 'object' && x !== null && !Array.isArray(x);
const strings = (x) => Array.isArray(x) && x.every(t => typeof t === 'string');
const numeric = (x) => typeof x === 'number' && Number.isFinite(x) && x >= 0;
function validSession(x) {
    if (!obj(x) || !obj(x.puzzle))
        return false;
    try {
        return typeof x.key === 'string' && (x.mode === 'daily' || x.mode === 'practice') && typeof x.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x.day) &&
            ['playing', 'naming', 'solved', 'failed'].includes(String(x.phase)) && strings(x.guesses) && x.guesses.length <= 5 &&
            numeric(x.hints) && Number.isInteger(x.hints) && x.hints <= 3 && numeric(x.score) && numeric(x.started) &&
            (x.finished === null || numeric(x.finished)) && (x.selected === null || typeof x.selected === 'string') &&
            typeof x.nameRule === 'boolean' && (x.ruleAnswer === null || typeof x.ruleAnswer === 'string') && [3, 4, 5].includes(Number(x.maxMistakes)) &&
            (x.puzzle.game === 'fourthword' || x.puzzle.game === 'oddrule') && validatePuzzle(x.puzzle).valid;
    }
    catch {
        return false;
    }
}
const validRecord = (x) => obj(x) && typeof x.key === 'string' && typeof x.puzzleId === 'string' && (x.mode === 'daily' || x.mode === 'practice') && typeof x.day === 'string' && [1, 2, 3, 4, 5].includes(Number(x.level)) && typeof x.won === 'boolean' && numeric(x.guesses) && numeric(x.hints) && numeric(x.score) && numeric(x.seconds) && typeof x.ruleNamed === 'boolean';
export function deserialize(raw) {
    if (!raw)
        return empty();
    try {
        const x = JSON.parse(raw);
        if (!obj(x) || x.version !== 1)
            return empty();
        const d = empty();
        if (obj(x.daily))
            for (const [day, s] of Object.entries(x.daily))
                if (validSession(s) && s.mode === 'daily' && s.day === day)
                    d.daily[day] = s;
        if (validSession(x.practice) && x.practice.mode === 'practice')
            d.practice = x.practice;
        if (Array.isArray(x.records)) {
            const seen = new Set();
            d.records = x.records.filter(validRecord).filter(r => { if (seen.has(r.key))
                return false; seen.add(r.key); return true; });
        }
        if (strings(x.attempted))
            d.attempted = [...new Set(x.attempted)];
        if (strings(x.recent))
            d.recent = x.recent.slice(0, 100);
        if (numeric(x.practiceSerial))
            d.practiceSerial = Math.floor(x.practiceSerial);
        if (obj(x.settings)) {
            const s = x.settings;
            d.settings = { nameRule: typeof s.nameRule === 'boolean' ? s.nameRule : false, theme: s.theme === 'light' || s.theme === 'dark' ? s.theme : 'system', maxMistakes: s.maxMistakes === 4 ? 4 : s.maxMistakes === 5 ? 5 : 3 };
        }
        if (Array.isArray(x.feedback))
            d.feedback = x.feedback.filter((v) => obj(v) && typeof v.puzzleId === 'string' && typeof v.reason === 'string' && typeof v.created === 'string');
        return d;
    }
    catch {
        return empty();
    }
}
export function load(game, storage) { try {
    return deserialize(storage.getItem(key(game)));
}
catch {
    return empty();
} }
export function store(game, data, storage) { try {
    storage.setItem(key(game), JSON.stringify(data));
    return true;
}
catch {
    return false;
} }
