import { createGameNavigation } from '/games/build/navigation.js';
import { evaluate, score, dateKey } from './engine.js';
const $ = id => document.getElementById(id);
$('navigation').replaceWith(createGameNavigation('wildguess'));
const key = 'foxhollow.wildguess.v1';
let state = { balance: 0, days: {} }, target = '', dictionary, choosing = false, day = dateKey();
let storageOK = true;
function read() { try { const saved = JSON.parse(localStorage.getItem(key)); if (saved && Number.isFinite(saved.balance) && saved.balance >= 0 && saved.days && typeof saved.days === 'object') state = saved; } catch { storageOK = false; } }
read();
function save() { try { localStorage.setItem(key, JSON.stringify(state)); } catch { storageOK = false; } }
function record() { return state.days[day] ??= { hints: {}, guess: '', net: 0 }; }
function notice(message = '') { $('notice').textContent = message || (storageOK ? '' : 'Browser storage is unavailable. Progress will last only for this visit.'); }
async function json(url) { const response = await fetch(url, { signal: AbortSignal.timeout(8000) }); if (!response.ok) throw Error('Load failed'); return response.json(); }
async function load() {
 target = ''; $('guess-form').hidden = true; $('hint').hidden = true; $('share').hidden = true; $('tiles').replaceChildren(); $('status').textContent = 'Opening today’s word…';
 try {
 const [map, words] = await Promise.all([json('https://raw.githubusercontent.com/zajahusc/wildguess-words/main/words.json').catch(() => json('./words.json')), dictionary ? Promise.resolve(dictionary) : json('/wordbridge/data/Synonyms.json').then(data => new Set(data.words.map(word => word.toUpperCase())))]);
 dictionary = words;
 let word = map[day]; word = typeof word === 'string' ? word : word?.word;
 if (!word) { const fallback = await json('./words.json'); word = fallback[day]; word = typeof word === 'string' ? word : word?.word; }
 if (!/^[a-z]{4,12}$/i.test(word || '')) { $('status').textContent = 'No word has been published for today. Please check back later.'; return; }
 target = word.toUpperCase(); render();
 } catch { $('status').textContent = 'Could not load today’s game. Check your connection and try again.'; const retry = document.createElement('button'); retry.textContent = 'Try again'; retry.className = 'tool'; retry.onclick = load; $('tiles').append(retry); }
}
function render() {
 const r = record(); const count = Object.keys(r.hints).length; const cost = [25, 50, 150][count];
 $('date').textContent = day; $('balance').textContent = `${state.balance} lifetime points`;
 $('status').textContent = r.guess ? `${r.guess === target ? 'You got it!' : `Today’s word was ${target}.`} Daily score: ${r.net > 0 ? '+' : ''}${r.net}. Come back tomorrow.` : `${target.length} letters. One guess. ${choosing ? 'Choose a blank tile to reveal.' : 'Trust your instinct.'}`;
 const results = r.guess ? evaluate(r.guess, target) : [];
 $('tiles').replaceChildren(...[...target].map((_, i) => {
 const tile = document.createElement('button'); tile.type = 'button'; const hinted = i in r.hints;
 tile.textContent = hinted ? target[i] : r.guess?.[i] || '?'; tile.className = hinted ? 'hinted' : results[i] || (choosing ? 'choosing' : '');
 tile.disabled = !choosing || hinted || !!r.guess; tile.setAttribute('aria-label', `Position ${i + 1}: ${hinted ? `${target[i]}, bought letter` : r.guess ? `${r.guess[i]}, ${results[i]}` : 'unknown'}`);
 tile.onclick = () => { read(); const current = record(); const price = [25, 50, 150][Object.keys(current.hints).length]; if (dateKey() !== day) return rollover(); if (current.guess || i in current.hints || price === undefined || state.balance < price) return render(); state.balance -= price; current.hints[i] = target[i]; choosing = false; save(); render(); notice(); }; return tile;
 }));
 $('guess-form').hidden = !!r.guess; $('guess').maxLength = target.length; $('guess').minLength = target.length;
 $('hint').hidden = !!r.guess || count >= 3; $('hint').textContent = choosing ? 'Cancel letter selection' : `Buy a letter · ${cost} points`; $('hint').disabled = state.balance < cost;
 $('share').hidden = !r.guess; notice();
}
$('hint').onclick = () => { choosing = !choosing; render(); };
$('guess-form').onsubmit = event => {
 event.preventDefault(); if (dateKey() !== day) return rollover(); read(); const r = record(); if (r.guess) return render();
 const guess = $('guess').value.trim().toUpperCase(); if (guess.length !== target.length || !/^[A-Z]+$/.test(guess)) return notice(`Enter a ${target.length}-letter word.`);
 if (guess !== target && !dictionary.has(guess)) return notice('That word is not in our English dictionary. Try another; your guess has not been used.');
 const points = score(guess, target, r.hints); r.guess = guess; r.net = points.net; state.balance += points.gross; choosing = false; save(); render();
};
$('share').onclick = async () => { const r = record(); const blocks = evaluate(r.guess, target).map((value, i) => i in r.hints ? '🟪' : ({correct:'🟩', misplaced:'🟨', wrong:'⬛'})[value]).join(''); const text = `WildGuess · ${day} (${target.length} letters)\n${blocks}\n${Object.keys(r.hints).length} letters bought\nDaily score: ${r.net}\nhttps://foxhollowlabs.dev/wildguess/`; try { if (navigator.share) await navigator.share({text}); else { await navigator.clipboard.writeText(text); notice('Result copied.'); } } catch (error) { if (error.name !== 'AbortError') { $('notice').textContent = text; } } };
try { const theme = localStorage.getItem('foxhollow.wildguess.theme'); if (theme) document.documentElement.dataset.theme = theme; } catch { /* Device theme remains available. */ }
$('theme').onclick = () => { const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches); const theme = dark ? 'light' : 'dark'; document.documentElement.dataset.theme = theme; try { localStorage.setItem('foxhollow.wildguess.theme', theme); } catch { /* Keep the current theme for this visit. */ } };
function rollover() { day = dateKey(); choosing = false; $('guess').value = ''; load(); }
setInterval(() => { if (dateKey() !== day) rollover(); }, 1000);
addEventListener('storage', event => { if (event.key === key) { read(); choosing = false; if (target) render(); } });
load();
