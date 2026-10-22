import { negativeFactSets } from './negative-facts.js';
import { rng, shuffled, validation } from './common.js';
import { lockDictionary } from './lexicon.js';
const prime = (n) => n >= 2 && !Array.from({ length: Math.max(0, Math.floor(Math.sqrt(n)) - 1) }, (_, i) => i + 2).some(d => n % d === 0);
export function property(c, p) { const n = Number(c.label); switch (p.kind) {
    case 'divisible': return n % Number(p.value) === 0;
    case 'greater': return n > Number(p.value);
    case 'digit': return c.label.includes(String(p.value));
    case 'prime': return prime(n);
    case 'square': return Number.isInteger(Math.sqrt(n));
    case 'vowel': return [...c.label].filter(x => 'aeiou'.includes(x)).length === p.value;
    case 'length': return c.label.length === p.value;
    case 'letter': return c.label.includes(String(p.value));
    case 'sides': return c.sides === p.value;
    case 'filled': return Number(p.value) === 1 ? c.filled : !c.filled;
    case 'curved': return c.curved;
    case 'tag': return c.tags?.[String(p.value)] === true;
} }
export function negativeSurvivors(p, clues = p.clues) { return p.candidates.filter(c => clues.every(x => !property(c, x))); }
export const negativeCategories = ['Numbers', 'Spelling', 'Geometry', ...negativeFactSets.map(s => s.category)];
export function makeNegative(level, seed, chosen) {
    const random = rng(seed), category = chosen || negativeCategories[Math.floor(random() * negativeCategories.length)], count = [6, 8, 10, 12, 16][level - 1];
    const plain = (label) => ({ id: label, label, sides: 0, filled: false, curved: false });
    let pool;
    const properties = [];
    const add = (kind, value, text) => properties.push({ id: `${kind}-${value}`, kind, value, text });
    if (category === 'Numbers') {
        pool = Array.from({ length: 90 }, (_, i) => plain(String(i + 10)));
        for (const n of [2, 3, 4, 5, 7, 9, 11])
            add('divisible', n, `It is not divisible by ${n}.`);
        for (const n of [25, 50, 75])
            add('greater', n, `It is not greater than ${n}.`);
        for (let n = 0; n < 10; n++)
            add('digit', n, `It does not contain the digit ${n}.`);
        add('prime', 0, 'It is not prime.');
        add('square', 0, 'It is not a perfect square.');
    }
    else if (category === 'Spelling') {
        pool = lockDictionary.filter(w => w.length <= 6).map(plain);
        for (const c of 'abcdefghijklmnopqrstuvwxyz')
            add('letter', c, `It does not contain ${c.toUpperCase()}.`);
        for (let n = 0; n <= 5; n++)
            add('vowel', n, `It does not contain exactly ${n} vowels (A, E, I, O, U).`);
        for (let n = 4; n <= 6; n++)
            add('length', n, `It is not ${n} letters long.`);
    }
    else if (category === 'Geometry') {
        pool = [];
        for (const [name, sides] of [['triangle', 3], ['square', 4], ['pentagon', 5], ['hexagon', 6], ['heptagon', 7], ['octagon', 8], ['circle', 0], ['semicircle', 1]])
            for (const filled of [false, true])
                pool.push({ id: `${filled ? 'solid' : 'outline'}-${name}`, label: `${filled ? 'Solid' : 'Outline'} ${name}`, sides, filled, curved: sides < 2 });
        for (const n of [0, 1, 3, 4, 5, 6, 7, 8])
            add('sides', n, `It does not have ${n} straight sides.`);
        add('filled', 1, 'It is not solid-filled.');
        add('filled', 0, 'It is not an outline-only shape.');
        add('curved', 1, 'It has no curved boundary.');
    }
    else {
        const facts = negativeFactSets.find(s => s.category === category);
        if (!facts)
            throw Error('Unknown factual category.');
        pool = facts.candidates.map(c => ({ ...plain(c.label), id: c.id, tags: c.tags, sources: c.sources }));
        for (const p of facts.properties)
            add('tag', p.key, `It is not ${p.description}.`);
    }
    for (let attempt = 0; attempt < 100; attempt++) {
        const target = shuffled(pool, random)[0], trueClues = shuffled(properties.filter(p => !property(target, p)), random);
        const eligible = pool.filter(c => c.id === target.id || trueClues.some(p => property(c, p)));
        if (eligible.length < count)
            continue;
        const candidates = shuffled([target, ...shuffled(eligible.filter(c => c.id !== target.id), random).slice(0, count - 1)], random);
        let survivors = candidates;
        const clues = [];
        while (survivors.length > 1) {
            const best = [...trueClues].sort((a, b) => survivors.filter(c => property(c, b)).length - survivors.filter(c => property(c, a)).length)[0];
            const next = survivors.filter(c => !property(c, best));
            if (next.length === survivors.length)
                break;
            clues.push(best);
            survivors = next;
            trueClues.splice(trueClues.indexOf(best), 1);
        }
        if (survivors.length === 1 && clues.length >= 2)
            return { id: `negative-v1-${seed}`, game: 'negativelogic', version: 1, level, category, candidates, target: target.id, clues };
    }
    throw Error('Could not construct an unambiguous elimination puzzle.');
}
export function validateNegative(p) { const survivors = negativeSurvivors(p), errors = []; if (survivors.length !== 1 || survivors[0].id !== p.target)
    errors.push('Exclusions are not unique.'); if (new Set(p.candidates.map(c => c.id)).size !== p.candidates.length)
    errors.push('Repeated candidates.'); if (p.clues.some(c => c.kind === 'tag') && p.candidates.some(c => !c.sources?.length || p.clues.some(clue => typeof c.tags?.[String(clue.value)] !== 'boolean')))
    errors.push('Missing explicit sourced attribute.'); return validation(errors, survivors.length, 'Exact arithmetic, spelling and explicit geometric attributes; exhaustive candidate filtering.'); }
