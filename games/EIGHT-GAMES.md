# Eight more ways to think

These games extend the existing static TypeScript collection at foxhollowlabs.dev. No account, paid API, frontend runtime, external font or server database is needed. Existing game engines and storage keys are retained. Word Orbit remains retired.

## Play

| Game | Route | Mechanic |
| --- | --- | --- |
| Lexicon Lock | [/lexiconlock/](/lexiconlock/) | Combine uniquely identifying letter constraints. |
| The Alibi | [/alibi/](/alibi/) | Reconstruct an order and identify one false testimony. |
| The Missing Move | [/missingmove/](/missingmove/) | Transform a numbered tile board using its published operation palette. |
| Tile Theory | [/tiletheory/](/tiletheory/) | Fill rows, columns and an irregular constellation with geometric tiles. |
| Word Fossil | [/wordfossil/](/wordfossil/) | Shared roots, historical spelling order, reconstruction and etymology detective puzzles. |
| Negative Logic | [/negativelogic/](/negativelogic/) | Eliminate candidates using objective negative properties. |
| Paradox Box | [/paradoxbox/](/paradoxbox/) | Resolve an apparent contradiction under explicit scenario facts. |
| Line by Line | [/linebyline/](/linebyline/) | Recognize a landmark from progressively revealed SVG ink strokes. |

Every game has daily play, five estimated difficulty bands, practice, an instruction walkthrough, hints, scoring, a terminal win/loss/reveal state, explanations, statistics, personal bests, daily streaks, sharing and browser-local saves. Interfaces support keyboard and touch, manual/device themes, reduced motion and narrow viewports.

All daily selection, rollover, countdowns and streak dates use **America/New_York**. This preserves the owner's explicit timezone preference over the original brief's UTC paragraph. The initial banks contain 370 playable puzzles in total. Each game publishes 365 explicit date-to-ID assignments, October 22, 2026–October 21, 2027. Dates are calendar labels in New York. Out-of-range dates offer practice. Banks cycle; these are not 365 distinct puzzles per game.

## Engines and correctness

- **Lexicon Lock:** frozen licensed WordNet-derived vocabulary. Every clue is a structured predicate. The generator filters the entire eligible length pool, verifies exactly one survivor, removes redundant clues, and rejects any clue that identifies the answer alone. Published diagnostics store survivor counts after every clue. Run `node games/scripts/diagnose-lock.mjs [puzzle-id]` after building. No guessed part-of-speech or syllable claims are used. Source and full license notices remain at [WordNet sources](data/NEW-GAMES-SOURCES.md), [provenance](/wordbridge/data/Provenance.json) and [licenses](/wordbridge/data/Licenses.txt).
- **The Alibi:** exhaustive permutations, one conjunction per character, exactly one false testimony. Every public evidence constraint is true. Expert/Master include a second badge attribute with a fully stated circular-order rule. The solver enumerates every permitted rotation as well as every order. Scenario labels vary, but all initial categories use this explicit ordered-slot model; they are not separate unconstrained multi-attribute mystery engines.
- **The Missing Move:** rows/columns wrap by one position, reflections reverse their named line, rotation is clockwise, swaps exchange specified cells, and a slide requires an adjacent empty destination. Each puzzle lists its complete legal palette. Breadth-first search proves its minimum distance. Answer checking compares the resulting board and move count, so a legitimate alternative route is accepted.
- **Tile Theory:** each tile has one fixed shape/color identity. Colors duplicate shape identity for accessibility rather than adding an independent color variable. Rows, columns and the dotted irregular constellation each require every tile once. An MRV solver counts completions; a separate naked/hidden single solver verifies a deduction path. Prefilled tiles cannot be edited. Check reports satisfied, violated or incomplete rules without exposing a solution.
- **Word Fossil:** 20 source-checked root families, with three individually sourced descendants per family; Shared Root and Detective presentations, five documented three-stage English spelling sequences and five documented morpheme reconstructions. These yield 50 playable language puzzles. Dictionary citations are stored with every entry and linked after completion. Historical labels are representative attested stages, not invented precise dates or claims about a sudden universal spelling change. Original explanations paraphrase [Online Etymology Dictionary](https://www.etymonline.com/); no source article is copied.
- **Negative Logic:** exact arithmetic, literal spelling, explicit geometry and individually sourced factual attributes. The eight domains include animals, UN M49 countries, periodic-table elements, dated historical events and ordinary acoustic instruments; the five factual sets contain 80 fully attributed candidates. There are 80 published elimination puzzles. A complete clue set must preserve its target and eliminate every distractor. A visible prefix of those clues can still admit multiple possibilities; early guessing is optional. Personal elimination/uncertainty marks are reversible and never count as mistakes.
- **Paradox Box:** 20 original four-choice scenarios with three progressive hints and an explicit refutation for each distractor. Published records disclose AI-assisted authorship, no human review, and finite-choice consistency scope. Structured tests check completeness and grading; they do not pretend to prove that every imaginable free-form explanation is impossible. Difficulty is editorially estimated and has not been calibrated against player data.
- **Line by Line:** **20 complete original illustrations**, 10 natural and 10 human-made, with **252 meaningful continuous SVG paths**. This is below the aspirational target of 50. Every path is ordered by the illustrator, rendered and checked for positive visible length and bounds, and the complete contact sheet was visually inspected. Metadata and source URLs are separate from stroke data; drawings load only on the Line by Line route. Each published alias names the landmark rather than a generic related concept. More landmarks require deliberate drawing and metadata review, not automatic SVG splitting.

## Scoring

Eight incorrect submissions end a puzzle at zero. A reveal always earns zero. Scores are clamped at zero and have no time penalty.

| Game | Scoring |
| --- | --- |
| Lexicon Lock | 500 base, −50/miss, −75/hint, +100 for first-attempt solve. |
| The Alibi, Tile Theory, Paradox Box | 600 + 40 × level, −50/miss, −75/hint. |
| The Missing Move | 700, −40/miss, −75/hint, −40 per move beyond proven optimum. |
| Word Fossil | 700, −50/miss, −100/hint; Detective extra fragments cost 30 each. |
| Negative Logic | 600, −50/miss, −75/hint, −30 per extra exclusion; up to 100 bonus for correctly crossed-out distractors. |
| Line by Line | First stroke 1,000 to final stroke 100, scaled by total strokes; −30/miss, −75/hint. A blank-canvas correct guess earns the first-stroke maximum. |

Undo/redo and personal notes do not cost points. Line by Line continuous drawing is optional, pauses for dialogs/hidden tabs, and can be paused before guessing. Reduced motion disables stroke animation. Settings can disable animation and swap continent/category hint order. Results include a drawing replay that never affects scoring.

## Persistence, statistics and publication

Each new game uses `foxhollow.<slug>.v1`. Saves contain date-keyed daily sessions, an active practice session, first-completion results, recent IDs, practice serials and settings. Runtime decoding rejects malformed/cross-game sessions. Storage denial retains a playable in-memory visit. First completed daily results are immutable; practice scores never affect streaks. Cross-tab updates synchronize and retain the first saved finish. Progress does not sync across browsers or devices.

Stats include attempted/finished counts, win rate, current/longest streak, personal best, average score/hints and difficulty distribution. Line by Line adds average/fewest strokes and win counts by continent/category. Default shares contain no answers. Native share falls back to clipboard and then a selectable text dialog.

Procedural practice runs in a Web Worker for Lexicon Lock, The Alibi, The Missing Move, Tile Theory and Negative Logic. It produces and validates seeded puzzles within finite dictionaries and mathematical spaces. Word Fossil, Paradox Box and Line by Line cycle their source-checked finite collections, avoiding recent eligible entries where possible. Difficulty/mode choices with one verified entry necessarily repeat.

Published JSON under `data/eight/` contains full frozen objects and schedules. `scripts/build-eight-bank.mjs` is an explicit publication tool, refuses to overwrite an existing bank, and is never invoked by ordinary builds. Future edits need new versioned puzzle IDs and deliberate future schedule changes. Static client answers can be inspected; no anti-cheat claim is made.

## Development and checks

Source: `src/eight/`, with independent per-game engines and shared presentation/storage/scoring. Static routes use `/games/style.css` plus `/games/eight.css`. Generated ES modules in `build/` are committed for GitHub Pages.

```sh
npm run check
npm run lint
npm test
npm run dev
# In another terminal, with Chromium installed:
npm run test:browser
```

Tests validate every published puzzle and all 2,920 assignments, engine transitions/penalties, alternative transformation routes, dictionary uniqueness, arrangement solutions, tile deductions, candidate filtering, source schemas, aliases, corrupt saves, first results, calendar streaks and daylight saving boundaries. Browser journeys cover all eight daily and Master practice solves, wrong answers, hints, refresh, sharing, themes, mobile widths, keyboard entry, actual SVG paths and thirteen-game New York rollover. Factual source correctness and artistic recognizability also require editorial/source and visual review; schema checks do not replace those reviews.

Release validation: strict type checking, lint, 59 unit/data tests and 84 browser checks pass. The complete collection includes 13 active games.
