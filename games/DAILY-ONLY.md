# Daily-only collection — October 22, 2026

All thirteen games now offer one daily challenge per New York calendar date. The daily/practice tabs, practice generators in the player interface, practice filters, and play-another controls have been removed. Existing archived practice saves remain readable for compatibility, but cannot be opened through the game UI and are excluded from current statistics.

Settings in every game offers Normal and Hard. Both use the same published daily puzzle. Choose before playing; selecting a new difficulty after a game has started saves that preference for the next daily without restarting or replacing today's attempt.

- WordBridge: Normal shows synonym choices; Hard requires typed synonyms.
- The Fourth Thing and The Odd Rule: Normal permits three wrong answers; Hard permits two and disables hints.
- Semantic Gravity: Hard reduces the published guess allowance and disables hints.
- Word Weave: Normal permits eight incorrect submissions; Hard permits three and disables entry checks, candidates and letter reveals. Pencil marks and undo remain available.
- The eight newer games: Normal permits eight wrong submissions; Hard permits three and disables hints. Tile Theory also disables rule checking in Hard mode.

New scores range from 0 to 100. Fourth Thing/Odd Rule use a 68–100 difficulty base with the existing proportional penalties and optional rule bonus capped at 100. Gravity uses 100 minus two per valid wrong guess and cumulative hint costs of 10/25/45. Weave uses 100 with the existing percentage penalties. The newer games use 100, generally minus 10 per miss/hint, with small move/exclusion/fragment costs. Line by Line scales from 100 for the first stroke to 10 for the final stroke, minus three per miss and ten per hint. WordBridge starts at 100 and loses five per bridge word beyond par; Hard no longer doubles the score. Reveals and exhausted attempts earn zero.

Legacy TypeScript-game scores are converted once by dividing by ten and capping at 100, with a score-version marker preventing repeated conversion. WordBridge historical results are recalculated under the compact route scoring formula. Outcomes, puzzle dates, saved entries and streak eligibility remain intact.

Success headings explicitly say “Correct! You solved it.” (WordBridge: “Correct! Bridge completed.”). Reasoning, matching items, evidence and explanations begin collapsed under “How it works.” Results link to the collection instead of starting another puzzle.

Every game has its own shared light/dark palette in `colors.css`, including homepage and collection cards. Every primary button palette passes at least 5.45:1 text contrast. Midnight America/New_York rollover, including daylight saving, is unchanged.

Current checks: `npm run check`, `npm run lint`, `npm test`, and `npm run test:browser`. Current browser suites are `daily-only-browser.mjs` and `daily-rollover-browser.mjs`; older practice-oriented browser files document the retired interface and are not part of the current runner. Engine tests retain archived-save and generator coverage so historical data remains supported.
