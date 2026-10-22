import { dailyDay, previousDay } from '../engine.js';
import { hash, normalize, shuffle } from '../data.js';
export { dailyDay, previousDay, normalize, shuffle };
export const names = { semanticgravity: 'Semantic Gravity', wordweave: 'Word Weave' };
export const levels = ['Easy', 'Normal', 'Hard', 'Expert', 'Master'];
export const storageKey = (game) => `foxhollow.${game}.v1`;
export function blankSave() { return { version: 1, daily: {}, practice: null, records: [], attempted: [], recent: [], serial: 0, theme: 'system', dailyLimit: null, feedback: [] }; }
export function initial(game, id, level, mode, serial, puzzle, limit = null) {
    const day = dailyDay(), base = { key: mode === 'daily' ? `daily:${day}` : `practice:${serial}`, game, mode, day, level, phase: 'playing', started: Date.now(), finished: null, score: 0, guesses: [], mistakes: 0, hints: 0 };
    if (game === 'semanticgravity')
        return { ...base, game, puzzleId: id, ranks: [], limit: mode === 'practice' ? null : limit || [25, 20, 15, 12, 10][level - 1] };
    if (!puzzle)
        throw Error('A verified Weave grid is required.');
    return { ...base, game, puzzle, letters: puzzle.givens, notes: {}, past: [], future: [], selected: puzzle.givens.indexOf('.'), pencil: false, hintsByType: [0, 0, 0], hintLetters: {}, feedback: false };
}
const object = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const strings = (v) => Array.isArray(v) && v.every(x => typeof x === 'string');
const dictionaryObject = (v, value) => object(v) && Object.values(v).every(value);
function validSession(v, game) {
    if (!object(v) || v.game !== game || typeof v.key !== 'string' || typeof v.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v.day) || !['daily', 'practice'].includes(String(v.mode)) || !['playing', 'solved', 'failed'].includes(String(v.phase)) || !finite(v.level) || ![1, 2, 3, 4, 5].includes(v.level) || !finite(v.started) || !(v.finished === null || finite(v.finished)) || !finite(v.score) || !strings(v.guesses) || !finite(v.mistakes) || !finite(v.hints))
        return false;
    if (game === 'semanticgravity')
        return typeof v.puzzleId === 'string' && (v.limit === null || finite(v.limit)) && Array.isArray(v.ranks) && v.ranks.every(x => object(x) && typeof x.word === 'string' && finite(x.rank));
    if (!object(v.puzzle) || typeof v.puzzle.givens !== 'string' || typeof v.puzzle.layout !== 'string' || !finite(v.puzzle.size) || typeof v.letters !== 'string' || v.letters.length !== v.puzzle.givens.length || v.puzzle.layout.length !== v.letters.length)
        return false;
    const letterLength = v.letters.length;
    return dictionaryObject(v.notes, x => typeof x === 'string') && Array.isArray(v.past) && Array.isArray(v.future) && [...v.past, ...v.future].every(x => object(x) && typeof x.letters === 'string' && x.letters.length === letterLength && dictionaryObject(x.notes, x => typeof x === 'string')) && finite(v.selected) && typeof v.pencil === 'boolean' && Array.isArray(v.hintsByType) && v.hintsByType.length === 3 && v.hintsByType.every(finite) && dictionaryObject(v.hintLetters, x => typeof x === 'string') && typeof v.feedback === 'boolean';
}
export function decode(raw, game) {
    try {
        const v = JSON.parse(raw || 'null');
        if (!object(v) || v.version !== 1)
            return blankSave();
        const d = blankSave();
        if (object(v.daily))
            for (const [day, s] of Object.entries(v.daily))
                if (validSession(s, game) && s.day === day && s.mode === 'daily')
                    d.daily[day] = s;
        if (validSession(v.practice, game) && v.practice.mode === 'practice')
            d.practice = v.practice;
        if (Array.isArray(v.records)) {
            const seen = new Set();
            d.records = v.records.filter((x) => object(x) && typeof x.key === 'string' && typeof x.puzzleId === 'string' && typeof x.day === 'string' && (x.mode === 'daily' || x.mode === 'practice') && typeof x.won === 'boolean' && finite(x.score) && finite(x.guesses) && finite(x.hints) && finite(x.level) && finite(x.seconds)).filter(x => { if (seen.has(x.key))
                return false; seen.add(x.key); return true; });
        }
        if (strings(v.attempted))
            d.attempted = [...new Set(v.attempted)];
        if (strings(v.recent))
            d.recent = v.recent.slice(0, 200);
        if (finite(v.serial))
            d.serial = v.serial;
        if (v.theme === 'light' || v.theme === 'dark')
            d.theme = v.theme;
        if (finite(v.dailyLimit) && v.dailyLimit >= 10 && v.dailyLimit <= 50)
            d.dailyLimit = v.dailyLimit;
        if (Array.isArray(v.feedback))
            d.feedback = v.feedback.filter((x) => object(x) && typeof x.puzzleId === 'string' && typeof x.guess === 'string' && typeof x.date === 'string');
        return d;
    }
    catch {
        return blankSave();
    }
}
export function puzzleId(s) { return s.game === 'wordweave' ? s.puzzle.id : s.puzzleId; }
export function commit(d, s) {
    if (s.mode === 'daily' && d.daily[s.day]?.phase !== 'playing' && d.daily[s.day])
        return d;
    const records = [...d.records], done = s.phase !== 'playing';
    if (done && !records.some(x => x.key === s.key))
        records.push({ key: s.key, puzzleId: puzzleId(s), mode: s.mode, day: s.day, won: s.phase === 'solved', level: s.level, score: s.score, guesses: s.guesses.length, mistakes: s.mistakes, hints: s.hints, seconds: Math.max(0, Math.round(((s.finished || Date.now()) - s.started) / 1000)) });
    return { ...d, daily: s.mode === 'daily' ? { ...d.daily, [s.day]: s } : d.daily, practice: s.mode === 'practice' ? s : d.practice, records, attempted: d.attempted.includes(s.key) ? d.attempted : [...d.attempted, s.key], recent: done ? [puzzleId(s), ...(s.game === 'wordweave' ? ['grid-' + hash(s.puzzle.layout + '|' + s.puzzle.solution)] : []), ...d.recent.filter(id => id !== puzzleId(s))].slice(0, 200) : d.recent };
}
export function statistics(d, today = dailyDay()) {
    const wins = d.records.filter(r => r.won), days = [...new Set(wins.filter(r => r.mode === 'daily').map(r => r.day))].sort();
    let longest = 0, run = 0, prev = '';
    for (const day of days) {
        run = previousDay(day) === prev ? run + 1 : 1;
        longest = Math.max(run, longest);
        prev = day;
    }
    let streak = 0, day = days.includes(today) ? today : previousDay(today);
    while (days.includes(day)) {
        streak++;
        day = previousDay(day);
    }
    const total = d.records.reduce((n, r) => n + r.score, 0);
    return { attempted: d.attempted.length, finished: d.records.length, wins: wins.length, winRate: d.records.length ? Math.round(100 * wins.length / d.records.length) : 0, streak, longest, total, best: Math.max(0, ...d.records.map(x => x.score)), average: d.records.length ? Math.round(total / d.records.length) : 0 };
}
export function giveUp(s) { return s.phase !== 'playing' ? s : { ...s, phase: 'failed', score: 0, finished: Date.now() }; }
export function resultText(s) { return `${names[s.game].toUpperCase()} · ${s.mode === 'daily' ? s.day : 'Practice'}\n${levels[s.level - 1]} · ${s.phase === 'solved' ? 'Solved ◆' : 'Revealed ◇'}\nScore: ${s.score} · Hints: ${s.hints} · ${s.game === 'wordweave' ? `Incorrect submissions: ${s.mistakes}` : `Guesses: ${s.guesses.length}`}\nhttps://foxhollowlabs.dev/${s.game}/`; }
