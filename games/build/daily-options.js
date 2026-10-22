const key = 'foxhollow.daily-options.v1';
const memory = {};
export function readHard(game) { try {
    return JSON.parse(localStorage.getItem(key) || '{}')[game] === true;
}
catch {
    return memory[game] === true;
} }
export function writeHard(game, hard) { memory[game] = hard; try {
    const options = JSON.parse(localStorage.getItem(key) || '{}');
    localStorage.setItem(key, JSON.stringify({ ...options, [game]: hard }));
}
catch { /* Keep the preference for this visit. */ } }
export const compactLegacyScore = (score) => Math.min(100, Math.max(0, Math.round(score / 10)));
export function migrateScores(data, oldVersion) {
    if (oldVersion !== 2) {
        for (const s of Object.values(data.daily))
            s.score = compactLegacyScore(s.score);
        if (data.practice)
            data.practice.score = compactLegacyScore(data.practice.score);
        for (const r of data.records)
            r.score = compactLegacyScore(r.score);
    }
    data.scoreVersion = 2;
    return data;
}
