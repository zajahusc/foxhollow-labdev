import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluate, score, dateKey } from '../../wildguess/engine.js';
test('WildGuess consumes duplicate matches only once', () => {
 assert.deepEqual(evaluate('ALLEY', 'APPLE'), ['correct','misplaced','wrong','misplaced','wrong']);
 assert.deepEqual(evaluate('PAPAL', 'APPLE'), ['misplaced','misplaced','correct','wrong','misplaced']);
});
test('WildGuess preserves original bonus and deducts hint costs once', () => {
 assert.deepEqual(score('APPLE','APPLE',{}), {gross:135,net:135});
 assert.deepEqual(score('APPLE','APPLE',{0:'A',2:'P'}), {gross:131,net:56});
 assert.deepEqual(score('ZZZZZ','APPLE',{0:'A'}), {gross:0,net:-25});
});
test('WildGuess resets at New York midnight across daylight saving', () => {
 assert.equal(dateKey(new Date('2026-11-01T03:59:59Z')), '2026-10-31');
 assert.equal(dateKey(new Date('2026-11-01T04:00:00Z')), '2026-11-01');
 assert.equal(dateKey(new Date('2026-11-02T04:59:59Z')), '2026-11-01');
 assert.equal(dateKey(new Date('2026-11-02T05:00:00Z')), '2026-11-02');
});
test('bundled daily feed contains valid words and today coverage', () => {
 const map=JSON.parse(readFileSync(new URL('../../wildguess/words.json',import.meta.url)));
 assert.ok(map['2026-11-01']);
 for(const entry of Object.values(map)) assert.match(typeof entry === 'string' ? entry : entry.word,/^[a-z]{4,12}$/i);
});
