> Historical release document. The current collection no longer includes the retired game described here; Word Weave and WordBridge were redesigned on October 22, 2026. See [UX-UPDATE.md](UX-UPDATE.md) for current behavior.

# Release report — Word Orbit, Semantic Gravity, Word Weave

## Implemented

Three complete single-player games at `/wordorbit/`, `/semanticgravity/` and `/wordweave/`, integrated into the homepage and six-game collection. All have UTC daily assignments, practice and difficulty selection, interactive tutorials, meaningful hints, transparent scoring, persistent independent progress/statistics/streaks/personal bests, spoiler-free result sharing, light/dark/device themes, keyboard and touch controls, error handling and reduced-motion styling.

Word Orbit uses approved, normalized answer groups, distinct relationship categories, targeted category/clue/first-letter hints, guided and blind modes, four through eight nodes, per-orbit explanations, and an explicitly local alternative-answer flag. Semantic Gravity uses actual cosine-ranked pretrained GloVe vectors, exact vocabulary-relative ranks, temperature labels, improvement/best-guess feedback, a radial target-distance diagram and accessible table, deterministic neighbor hints, vocabulary search and configurable daily limits. Word Weave uses one shared licensed dictionary, an MRV/backtracking/forward-checking solver, proven-unique daily grids, Word Square/Cross Weave/Letter Weave, a genuinely open-ended Free Weave mode, fixed starting words, exact letter inventories, pencil notes, undo/redo, keyboard arrows and mobile entry, check/candidate/reveal hints and safe reset/submit controls. Heavy grid searches run in a Web Worker.

## Verified initial content

| Game | Actual count | Difficulty / coverage |
| --- | ---: | --- |
| Word Orbit | 12 centers; 96 explicit relationships | Every center supports 4/5/6/6/8-node difficulty variants; these are not counted as separate centers |
| Semantic Gravity | 100 targets | 20 per estimated level; 6,028 supported entries; genuine frozen GloVe 6B 50-dimensional vectors |
| Word Weave | 100 distinct, uniquely solvable grids | 20 per level; 37 Square, 29 Cross, 34 Letter; 14 size 3×3, 29 size 4×4, 57 size 5×5 |

There are 212 initial content entries, **88 below the 300-entry target**. The shortfall is Word Orbit's center bank. Repeated practice and difficulty variants do not inflate that count. Additional Weave practice can be generated in a worker; Free Weave accepts any valid completion, including one different from the stored example. Daily schedules are explicit through October 20, 2027 and reuse banks after their cycles.

## Tests executed

- Strict TypeScript checking, ESLint and production compilation: passed.
- 43 unit/integrity tests: passed, including the existing games. New checks cover all Orbit answer groups, aliases, duplicates, hints, scoring and completion; real vector checksum/dimensions/cosine math, all 100 Gravity target rankings and hints, unsupported guesses, spelling variants, frozen model versions, score/limit boundaries; every Weave bank grid's actual uniqueness, zero/multiple-solution detection, alternative Free Weave acceptance, inventories, fixed letters, notes, undo/redo, scoring and deterministic generation; all 1,095 new daily assignments, saves, corruption and first-completion records.
- 40 browser checks: passed (23 prior collection checks plus 17 new-game checks). Covers end-to-end play, tutorials, wrong/unsupported guesses, hints and refresh recovery, completing/revealing puzzles, local feedback, sharing, practice/filters, generated alternate Free Weave solutions, worker hints, model loading, touch letter entry, keyboard navigation, themes, UTC rollover, blocked storage, and regression availability of the previous three games.
- Layouts checked at 320, 390, 768 and 1440px, with dark mode and reduced motion; screenshots inspected. No uncaught errors in the passing browser suite.
- CI runs type/lint/unit/browser checks and checks committed compiled output for drift.

## Known limits

Orbit is a smaller source-checked construction bank without independent human editorial sign-off; unlisted associations may be valid and are not falsely described as semantically wrong. The model vocabulary is bounded, general embeddings blend senses, and difficulty estimates/guess limits are not real-player-calibrated. Orbit and Gravity practice revisit their finite banks. Weave is limited to 3–5 cells per side, with a common-word subset and finite search budget; inconclusive searches are reported rather than called unique/unsatisfiable. These games do not yet have offline service-worker caching, accounts, cloud sync or a feedback backend. Feedback stays on the device. Automated Chromium checks do not constitute a physical iPhone/Safari or manual screen-reader certification.

## Run and extend

See [NEW-GAMES.md](NEW-GAMES.md) for `npm ci`, build/dev/test commands, architecture, safe data-publication instructions, model/dictionary versioning, persistence and future enhancements. [Data sources and licenses](data/NEW-GAMES-SOURCES.md) and [model provenance](data/gravity-provenance.json) are checked in. Priority next work: independent Orbit editorial expansion, broader/sense-specific semantic coverage, consented difficulty calibration, and more dictionary-backed Weave layouts under new version IDs.
