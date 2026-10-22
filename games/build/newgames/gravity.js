import { normalize } from '../data.js';
export function cosine(a, b) {
    if (a.length !== b.length || !a.length)
        throw Error('Incompatible embedding dimensions');
    let dot = 0, aa = 0, bb = 0;
    for (let i = 0; i < a.length; i++) {
        const x = a[i], y = b[i];
        if (!Number.isFinite(x) || !Number.isFinite(y))
            throw Error('Invalid vector');
        dot += x * y;
        aa += x * x;
        bb += y * y;
    }
    if (!aa || !bb)
        throw Error('Zero-norm vector');
    return dot / Math.sqrt(aa * bb);
}
export function model(vocabulary, vectors) {
    if (vocabulary.model !== 'GloVe-6B-50d-v1' || vocabulary.version !== 'fox-common-glove-v1' || vocabulary.dimensions !== 50 || vectors.length !== vocabulary.words.length * 50 || new Set(vocabulary.words).size !== vocabulary.words.length || vectors.some(x => !Number.isFinite(x)))
        throw Error('Invalid or incompatible semantic data');
    return { vocabulary, vectors, index: new Map(vocabulary.words.map((w, i) => [w, i])) };
}
export function rank(model, target) {
    const { vocabulary: v, vectors, index } = model;
    if (target.model !== v.model || target.vocabulary !== v.version)
        throw Error('This puzzle requires a different frozen model version');
    const at = index.get(target.word);
    if (at === undefined)
        throw Error('Target outside vocabulary');
    const a = vectors.subarray(at * v.dimensions, (at + 1) * v.dimensions);
    const scores = new Map();
    for (const [i, word] of v.words.entries())
        scores.set(word, cosine(a, vectors.subarray(i * v.dimensions, (i + 1) * v.dimensions)));
    const ordered = [...v.words].sort((a, b) => a === target.word ? -1 : b === target.word ? 1 : scores.get(b) - scores.get(a) || (a < b ? -1 : 1));
    return { ordered, ranks: new Map(ordered.map((w, i) => [w, i + 1])), scores };
}
const spelling = { theater: 'theatre', harbor: 'harbour', grey: 'gray', colour: 'color' };
export function normalizeGuess(raw, vocabulary) { const w = normalize(raw), alias = spelling[w]; return alias && vocabulary.has(alias) ? alias : w; }
export function temperature(rank, total) {
    if (rank === 1)
        return 'Found';
    const p = rank / total;
    return p <= .001 ? 'Extremely hot' : p <= .01 ? 'Very hot' : p <= .05 ? 'Hot' : p <= .15 ? 'Warm' : p <= .4 ? 'Cool' : 'Cold';
}
export function gravityGuess(s, t, r, raw) {
    if (s.phase !== 'playing')
        return { session: s, message: 'This puzzle is finished.' };
    const word = normalizeGuess(raw, r.ranks), position = r.ranks.get(word);
    if (!position)
        return { session: s, message: 'That word is outside the supported vocabulary. No attempt used.' };
    if (s.guesses.includes(word))
        return { session: s, message: 'Already tried. No attempt used.' };
    const won = word === t.word, guesses = [...s.guesses, word], failed = !won && s.limit !== null && guesses.length >= s.limit;
    const cost = [0, 10, 25, 45][s.hints];
    const oldBest = Math.min(Infinity, ...s.ranks.map(x => x.rank));
    return { session: { ...s, guesses, ranks: [...s.ranks, { word, rank: position }], mistakes: s.mistakes + (won ? 0 : 1), phase: won ? 'solved' : failed ? 'failed' : 'playing', finished: won || failed ? Date.now() : null, score: failed ? 0 : Math.max(0, 100 - (s.mistakes + (won ? 0 : 1)) * 2 - cost) }, message: `${word}: rank #${position} of ${r.ordered.length}. ${temperature(position, r.ordered.length)}.${position < oldBest && Number.isFinite(oldBest) ? ` Improved by ${oldBest - position} places.` : ''}` };
}
export function gravityHint(s) { return s.phase === 'playing' && !s.hard && s.hints < 3 ? { ...s, hints: s.hints + 1 } : s; }
export function neighborHints(t, r) {
    const a = r.ordered[t.hintRanks[0] - 1], b = r.ordered[t.hintRanks[1] - 1];
    if (!a || !b || a === t.word || b === t.word || a === b)
        throw Error('Invalid semantic hints');
    return [a, b];
}
let loading = null;
export function loadGravity() {
    if (loading)
        return loading;
    loading = (async () => {
        const [metadata, data] = await Promise.all([fetch('/games/data/gravity-v1.json'), fetch('/games/data/gravity-v1.f32')]);
        if (!metadata.ok || !data.ok)
            throw Error('The semantic model could not be loaded. Check your connection and retry.');
        const v = await metadata.json(), buffer = await data.arrayBuffer();
        if (crypto.subtle) {
            const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buffer)), x => x.toString(16).padStart(2, '0')).join('');
            if (hash !== v.sha256)
                throw Error('Semantic data checksum mismatch. Please reload.');
        }
        return model(v, new Float32Array(buffer));
    })().catch(e => { loading = null; throw e; });
    return loading;
}
