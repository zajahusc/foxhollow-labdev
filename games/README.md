# Foxhollow daily games

The Fourth Thing lives at `/fourthword/`; The Odd Rule at `/oddrule/`. `/games/` is the collection page. These are static applications for the repository's existing GitHub Pages deployment. WordBridge stays independent.

## Development

Use Node.js 22.12+ and Python 3:

```sh
npm ci
npm run build
npm run dev
```

Visit `http://127.0.0.1:8090/fourthword/` or `/oddrule/`. TypeScript compiles directly to browser ES modules in `games/build/`. No frontend runtime, API key, external font or application server is needed. Commit generated `games/build/` files because GitHub Pages publishes the repository root. `npm run build` does not modify puzzle publications.

## Validation

```sh
npm run check
npm run lint
npm test
npx playwright install chromium
# With npm run dev running in another terminal:
npm run test:browser
```

The browser runner accepts `GAMES_TEST_URL`; its default is `http://127.0.0.1:8090`. It freezes the browser clock at the schedule's first UTC day for repeatable tests. Screenshots go to `/tmp/fourthword-*.png` and `/tmp/oddrule-*.png`. CI checks types, lint, all published assignments, generators and complete browser journeys, then checks committed compiled output for drift.

## Architecture

- `src/types.ts`: discriminated puzzle unions, sessions, scoring records, versioned saves, statistics.
- `src/rules.ts`: 35 explicit predicates with category, estimated difficulty, hints and item-by-item explanations. The only source of rule grading.
- `src/data.ts`: constructors, seeded generators, normalization, validation and ambiguity scan.
- `src/published.ts`: frozen v1 bank of 40 Fourth Thing / 35 Odd Rule puzzles. New revisions need new IDs.
- `src/daily-generated.ts`: 242 additional generated daily puzzles, frozen at publication.
- `src/schedule.ts`: 365 explicit assignments per game, October 21, 2026–October 20, 2027. Reuses the constructed bank between generated slots; it is not 365 distinct rule families. Out-of-range dates offer practice instead of inventing an assignment.
- `src/engine.ts`: pure answer evaluation, transitions, penalties, bonus, daily records, stats, streaks, sharing and practice selection.
- `src/storage.ts`: versioned serialization behind a storage adapter; corrupt records are rejected and unavailable storage falls back to the active in-memory visit.
- `src/app.ts`: safe DOM rendering, native accessible dialogs, confirmation, theme, forms, countdown, focus, cross-tab updates.
- `style.css`: shared responsive design; purple for Fourth Thing, green for Odd Rule; device and manual themes, reduced motion.

## Adding a puzzle or rule family

1. Add a precise rule to `rules.ts`: a unique ID, title, predicate, progressive hints, explanation function, category and estimated level. Predicates must be deterministic and not access network services. Level estimates reflect reasoning steps and simultaneous constraints; `observedDifficulty` remains `null` because no player data has been collected.
2. Construct candidate items with `construct(material, game)` or create a typed `Puzzle`. A Fourth Thing word puzzle must use choices; free response is reserved for explicitly constrained number sequences, with exact approved aliases. New sequence families must extend the independently checked sequence specification in `data.ts`.
3. Run `validatePuzzle(candidate)`. It checks all clue/choice memberships, exact five-of-six membership, descriptions, IDs, hints, and competing published predicates. Do not publish failures. `validateBank` rejects duplicate IDs. Include a test that rejects plausible competing answers.
4. Review the candidate's full explanation and hints. The rule-catalog scan is limited: it cannot prove that every conceivable English interpretation is absent. Unresolved ambiguity is a reason to revise or withhold a puzzle.
5. Freeze approved objective candidates as new entries in `published.ts`, and run the complete suite. Never silently mutate an existing published ID. Keep old versions available for saved sessions and historical schedules.
6. Add explicit future date→ID assignments in `schedule.ts`. Generated daily content belongs in `daily-generated.ts` as full frozen objects. Never make published daily selection depend on a changing bank length, a random clock value or an updated generator.

Semantic, scientific, geographic and cultural puzzles are intentionally not in this initial bank. Before adding them, introduce a separate editorial-verification schema with a named reviewer, source citations, verified distractors, approval date and ambiguity resolution. Unapproved candidates must remain outside `published.ts`; LLM consensus must never stand in for that approval. The current schema permits deterministic publication only.

## Scoring and persistence

Base points = 100 × level. Each wrong answer costs 15% of **original** base; hints cost 10%, 15%, 20% cumulatively. No timer penalty. Name the Rule adds 25% of base for a correct rule or subtracts 15% for a wrong rule. Reveal/failure earns zero; the floor is zero. Daily allows 3 wrong guesses; practice settings allow 3–5 for the next puzzle. Completed daily records cannot be overwritten by normal replay. Native sharing falls back to clipboard, then a selectable copy dialog; default shares omit solutions.

Each game has a separate `foxhollow.<game>.v1` localStorage key. Daily records, active practice (including rule-naming), attempted IDs, recent completed IDs, settings and explicitly local feedback persist. Statistics include finished wins/failures; attempted counts include unfinished games. A successful UTC daily solve advances the streak once. Yesterday's streak remains visible until today's deadline; a missed UTC day resets it. Practice never affects streaks. Progress is browser-local; there is no account or device sync.

## Practice and content limits

Numbers supports seeded generation across ten families and all five levels. Any-category practice mixes generation with the bank. Language/Structure are finite collections, avoid recent puzzles until exhausted, then revisit them without an immediate repeat. The interface explains this distinction. Generated content is validated before display. There is no runtime LLM dependency.

See [CONTENT.md](CONTENT.md) for counts and the release shortfall. There is no claim of universal ambiguity detection, human editorial approval, real player calibration or specialist semantic coverage.

## Future backend

Replace the `StorageAdapter` with an authenticated service and preserve engine/record contracts. Serve frozen daily IDs, perform server-side answer validation and merge first-completion records there. Static client answers can be inspected deliberately; this release does not claim anti-cheat protection. Feedback is explicitly local and is not transmitted. Add licensed dictionary/reference-backed content and an editorial workflow before widening semantic categories. Offline service-worker caching, accounts, cross-device sync, Daily Double and adaptive difficulty are deferred.
