# Game collection update — October 22, 2026

Word Orbit has been removed from the site and collection navigation. Its old route returns 404.

Word Weave now starts as a blank, numbered crossword with Across and Down clues. Irregular silhouettes and rectangular cells replace the filled-square presentation. Clue selection, direction changes, typing, keyboard navigation and touch entry work directly on the board. Pencil marks, checks, candidate assistance, undo/redo and reveals are available through Options. Automatic correctness feedback is off by default.

The new edition publishes 96 crosswords with licensed WordNet definition clues, three-to-seven-letter answers and verified unique completions under each clue’s accepted answers and crossings. Published shapes include 5×5, 7×5 and 5×7 silhouettes. Existing started and completed sessions retain their original content and progress; untouched dailies use the new edition. See [data sources](data/NEW-GAMES-SOURCES.md) for attribution and reproduction scripts.

WordBridge now shares the collection header, navigation, typography, cards, theme controls, dialogs and mobile layout. Normal and Hard modes are directly accessible. Its engine, dictionary, scoring, New York daily reset and saved progress remain unchanged. The service worker cache version was advanced to deliver the new interface.

Validation: strict TypeScript, lint, 40 automated engine/data tests and 45 browser checks pass. Browser coverage includes complete Normal and Hard WordBridge games, score equivalence with the original engine, saved-game recovery, crossword completion, optional tools, touch entry, dark mode and viewport widths from 320 to 1440 pixels.

Run `npm run check`, `npm run lint`, `npm test` and (with the local preview running) `npm run test:browser`. Compiled browser modules in `games/build/` are committed for GitHub Pages.

## Daily timezone update

Every game now uses midnight America/New_York for daily puzzle selection, rollover and streak dates. Countdown calculations respect the 23-hour and 25-hour daylight saving days. Existing date-keyed progress and records remain saved. WordBridge already used this timezone.
