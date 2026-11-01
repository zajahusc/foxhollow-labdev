export function evaluate(guess, target) {
 const remaining = [...target]; const result = [...target].map(() => 'wrong');
 [...guess].forEach((letter, i) => { if (letter === target[i]) { result[i] = 'correct'; remaining[i] = null; } });
 [...guess].forEach((letter, i) => { if (result[i] === 'correct') return; const j = remaining.indexOf(letter); if (j >= 0) { result[i] = 'misplaced'; remaining[j] = null; } });
 return result;
}
export function score(guess, target, hints) {
 const gross = evaluate(guess, target).reduce((sum, result, i) => sum + (result === 'correct' ? (i in hints ? 0 : 2) : result === 'misplaced' ? 1 : 0), 0) + (guess === target ? 25 * target.length : 0);
 const cost = [25, 50, 150].slice(0, Object.keys(hints).length).reduce((a, b) => a + b, 0);
 return { gross, net: gross - cost };
}
export function dateKey(now = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now); }
