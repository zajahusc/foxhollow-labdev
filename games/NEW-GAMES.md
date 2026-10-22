# Word Orbit, Semantic Gravity and Word Weave

New routes: `/wordorbit/`, `/semanticgravity/`, `/wordweave/`. They extend the existing static GitHub Pages collection without replacing WordBridge, The Fourth Thing or The Odd Rule.

## Run and test

Node.js 22.12+ and Python 3 are sufficient:

```sh
npm ci
npm run check
npm run lint
npm test
npm run dev
```

Open `http://127.0.0.1:8090/wordorbit/`, `/semanticgravity/` or `/wordweave/`. In another terminal:

```sh
npx playwright install chromium
npm run test:browser
```

`GAMES_TEST_URL` changes the browser test origin. Tests use a fixed UTC clock to avoid changing daily assignments. The production command is `npm run build`. Commit generated `games/build/` modules because Pages publishes the repository root. No application server, paid API call or user API key is required.

## Architecture

New modules live in `games/src/newgames/` and compile alongside the existing TypeScript. Existing scoring/date/seed utilities and collection CSS are reused. `ui.ts` supplies safe DOM helpers, native dialogs, confirmations, copy and share; `shared.ts` supplies versioned independent storage, records, first-completion locking, statistics and streaks. `app.ts` presents all three mechanics with one shared shell. Every text value is rendered as text rather than injected HTML.

- `orbit.ts`: twelve centers, eight relationship groups each, explicit normalized approved aliases, disjoint answer groups, construction-source references, targeted hints and scoring. Difficulty selects 4/5/6/6/8 orbits; guided for Easy/Normal, hidden categories for Hard/Expert/Master. Expert limits total hint steps to six, Master to eight. Unlisted plausible associations can be saved locally and copied; there is no implication that local feedback has been transmitted.
- `gravity.ts`: exact cosine computation over real pretrained GloVe vectors, deterministic ranks, explicit supported vocabulary and spelling variants, neighbor hints, temperatures and scoring. `targets.ts` freezes 100 target IDs with model/vocabulary versions, categories and estimated difficulty. `games/data/gravity-v1.f32` plus `.json` contain the frozen normalized model subset; data checksum is verified in the browser before use. No arbitrary keyword score or invented similarity percentage is used. Radius reflects rank to target; angles are explicitly illustrative. The accessible table provides rank, temperature, improvement and best guess.
- `dictionary.ts`: same 1,805-word versioned common-English dictionary for every Weave mode. The policy, notices and underlying extraction are documented in [sources](data/NEW-GAMES-SOURCES.md).
- `weave.ts`: word-length/pattern indexing, cached candidate domains, MRV backtracking, forward checking, crossings, fixed letters, optional word-uniqueness rule and inventory-frequency checks. `solve` returns solutions, node count and whether search exhausted. Only exactly one solution with exhausted search proves uniqueness. Budget-limited searches are never called unique or unsatisfiable.
- `weave-worker.ts`: generation, consistency and candidate searches run in a Web Worker. Hints distinguish dictionary validity, constraint consistency and revealed letters. Reveals use a solver witness; Free Weave derives a compatible completion when available. Revealed letters are fixed, and prior undo history is cleared so they cannot be undone away.
- `weave-bank.ts`: 100 distinct matrices whose completions have actually been counted. 37 Word Squares, 34 Letter Weaves, 29 Cross Weaves; 14 size 3×3, 29 size 4×4, 57 size 5×5. All five levels have 20 puzzles. Word/letter grids support 3/4/5; Cross Weave uses 5×5 to keep every designated run at least three letters long.
- `schedule.ts`: 365 explicit assignments per game, October 21, 2026–October 20, 2027. Content repeats after the applicable bank has been explored. No date depends on the current bank length; adding puzzles does not reassign historical days.

## Rebuilding data

Ordinary builds never regenerate publications. The original GloVe archive belongs outside the repository. Retrieve the checksum-pinned `glove-wiki-gigaword-50.gz` from the gensim-data source in [provenance](data/gravity-provenance.json), then run:

```sh
python3 games/scripts/prepare-gravity.py /absolute/path/to/glove-wiki-gigaword-50.gz
npm run build
node games/scripts/build-weave-bank.mjs
npm run build
npm test
```

These are **content-publication commands**, not routine builds: changing vocabulary changes the solution space, and changing vectors changes ranks. A future update must use new model/dictionary versions and puzzle IDs, retain the old publications needed by existing saves/dailies, and extend the explicit future schedule instead of overwriting past assignments. Generator candidates are validated, duplicate matrices rejected, and unique completions counted before being written. Independently review new Orbit senses, aliases and rejected alternatives before publication.

## Saves, sharing and accessibility

Each game has its own `foxhollow.<slug>.v1` key, active daily/practice progress, first completed daily result, recently completed IDs, statistics, streaks, personal bests and settings. Daily boundaries use UTC. A streak advances for successful daily solves only, once per date; practice cannot extend it. Refreshing does not create a new attempt. Corrupt/incompatible data resets safely; unavailable storage preserves an in-memory visit. There is no device/cloud sync.

Tutorials contain playable examples that do not alter statistics. Orbit provides labeled selectable nodes and a compact mobile/list arrangement. Gravity has a textual rank table independent of the diagram. Weave supports roving grid focus, arrows, letters, Backspace/Delete, a mobile letter field, pencil notes, undo/redo, reset, inventory buttons and check/submit controls. Keyboard shortcuts are ignored inside unrelated form fields and dialogs. Theme supports device/light/dark selection; motion respects reduced-motion settings. Native dialogs provide focus containment and close controls. Default result sharing contains no answers; clipboard and selectable-text fallback are available.

## Actual initial content and limits

| Game | Authored centers / targets / grids | Difficulty distribution |
| --- | ---: | --- |
| Word Orbit | 12 centers, 96 relationships | Each center supports all five variants; variants are not counted as distinct centers |
| Semantic Gravity | 100 targets | 20 per level, estimated from contextual-neighbor density and frequency |
| Word Weave | 100 unique grids | 20 per level, estimated from constraints, clue count, size and search work |

This is **212 distinct game-content entries**, 88 below the brief's target of 300. Orbit is 88 centers short of its 100-center goal. There is no claim of 100 independently authored Orbit puzzles by counting difficulty variants.

Orbit construction is source-checked, but there is no independent human editor sign-off or exhaustive semantic-coverage guarantee. Gravity uses a bounded 6,028-word general embedding vocabulary, so some familiar words are unsupported, senses can mix, and proximity may surprise a person. Its difficulty/guess limits are initial estimates without real player calibration. Orbit and Gravity practice revisit finite banks after exhaustion. Weave generation has a finite dictionary/search budget; failed or inconclusive generation is reported rather than published. No six-by-six or larger grids are included. New games do not yet install an offline service worker. No manual screen-reader or physical-device certification is claimed by the automated browser tests.

## Next improvements

Commission independent editorial review and expand Orbit with genuinely distinct centers/relationships and more approved alternatives. Broaden and evaluate semantic vocabulary using sense-specific data while preserving model versions. Add consented player metrics to calibrate difficulty and daily guess limits. Expand the Weave dictionary and layouts under new version IDs, then consider larger grids and stronger no-repeat constraints. Add optional cloud saves and a real feedback endpoint only after defining conflict/privacy behavior; current feedback is local only.
