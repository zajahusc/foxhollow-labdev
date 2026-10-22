# Release report — October 21, 2026

## Implemented

Two working static browser games, at `/fourthword/` and `/oddrule/`, with shared TypeScript logic and distinct responsive identities. Both support deterministic UTC dailies, unlimited practice, five difficulty levels, category selection, three progressive hints, configurable practice attempts, transparent base-score penalties, explanations, persistent progress, stats, daily streaks, personal bests, spoiler-free sharing and explicit spoiler sharing. Fourth Thing supports choice puzzles and constrained numeric free response; Odd Rule has confirmed card selection plus an optional multiple-choice rule stage. Native dialogs provide instructions, settings, stats, reset/reveal confirmations and explicitly local feedback, including note readback and copying.

Both light and dark modes support manual selection or device settings. Keyboard controls, focus states, semantic headings, live feedback, reduced motion and touch targets are implemented. The homepage and `/games/` collection link all three games, including the existing WordBridge. No runtime dependency on an LLM, network API, secret or account.

## Content counts

| Game | Level 1 | Level 2 | Level 3 | Level 4 | Level 5 | Constructed bank | Additional frozen daily instances |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| The Fourth Thing | 8 | 8 | 8 | 8 | 8 | 40 | 121 |
| The Odd Rule | 7 | 7 | 7 | 7 | 7 | 35 | 121 |

The initial constructed bank is 125 short of the brief's 200-puzzle target. Generated instances reuse ten numerical families, and the schedule reuses the constructed bank. They are not counted as independently authored relationship families. All 730 scheduled assignments and all published objects pass the validators. The explicit schedule ends October 20, 2027; practice remains available thereafter.

## Validation executed

- Strict TypeScript type check and successful production compilation to committed browser modules.
- ESLint: passed.
- 24 unit/integrity tests: passed. Includes all published puzzles, 730 schedule assignments, seeded generators across both games and all levels, score floors/penalties/bonus, normalization, wrong/duplicate answers, failed/revealed games, first daily completion, persistence/corruption, stats/streaks, date boundaries and sharing.
- 23 browser checks in Chromium: passed. Includes end-to-end wrong answer → hint → solve → explanation → share; refresh recovery; rule-stage refresh; free-response keyboard journey; exhausted attempts; practice filters; reveal confirmation; stats; local feedback; UTC rollover; cross-tab completion; settings/theme/reset; blocked storage; and homepage/collection/WordBridge availability.
- Responsive screenshots inspected. Browser layouts checked at 320, 390, 768 and 1440px, including long words, dark mode, keyboard selection and reduced motion. No uncaught browser errors.
- Continuous integration workflow added for type/lint/unit/browser checks and compiled-output drift.

## Limits and intentionally deferred work

Initial content is objective spelling, written structure, number properties and constrained sequences. The brief's semantic, scientific, geographic, cultural and abstract relationship categories need a real source-backed editorial workflow before publication. The validators screen for competing rules in the published catalog; they cannot prove universal absence of other interpretations. No human approval or real player difficulty calibration is claimed. Language/Structure practice cycles once the filtered collection is exhausted; Numbers can keep generating new instances. Browser testing uses Chromium, not a manual screen-reader session or a physical iPhone/Safari device.

Accounts, sync, a feedback backend, offline caching for the new games, licensed dictionary expansion, Daily Double, themed packs and adaptive difficulty are deferred. Saved feedback stays on the device. A client-only game cannot prevent deliberate inspection of answers.

## Recommended next work

Prioritize independently reviewed relationship diversity over increasing generated instance counts. Add explicit editorial approval/citation schemas, licensed lexical/reference evidence and new authored families. Then collect consented completion/hint metrics to calibrate estimated difficulty. Expand the fixed schedule before it ends, preserving published IDs and historical assignments.
