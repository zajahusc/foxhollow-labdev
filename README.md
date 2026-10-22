# Foxhollow Labs website

Static website with WordBridge at `/wordbridge/`. Publish this repository root using the existing hosting provider. Directory hosting redirects `/wordbridge` to `/wordbridge/`, keeping game assets and its service worker scoped to the game.

The game uses the bundled WordNet dictionary and daily schedule through June 30, 2027. It needs no API key or backend. The Merriam-Webster backend from the original app is not deployed here. Browser storage keys are preserved for existing progress on the same origin. Scores on other hostnames cannot transfer automatically.

Only public game assets are included; dictionary licenses are in `wordbridge/data/Licenses.txt`.

## Daily puzzle collection

- `/fourthword/`: The Fourth Thing — complete a hidden relationship.
- `/oddrule/`: The Odd Rule — select the outsider and optionally name its rule.
- `/games/`: collection page linking all three games.

The two new games use shared TypeScript, build to committed static ES modules, and require no backend. Run `npm ci`, `npm run build`, then `npm run dev`. Verification: `npm run check`, `npm run lint`, `npm test`, and `npm run test:browser` with the local preview running. Full architecture, publication instructions, content counts, limitations and extension guidance are in [games/README.md](games/README.md) and [games/CONTENT.md](games/CONTENT.md).

The collection also includes [Semantic Gravity](/semanticgravity/) and [Word Weave](/wordweave/). See [new-game architecture, content counts, sources and operating instructions](games/NEW-GAMES.md). Real versioned GloVe rankings power Gravity; a dictionary-backed constraint solver validates Weave grids, with proven unique daily completions and an explicitly open-ended Free Weave mode.

Word Weave now uses blank, numbered mini-crosswords with Across/Down clues and irregular rectangular layouts. WordBridge uses the shared collection UI while retaining its original game logic and saves. [Current UX update](games/UX-UPDATE.md).

The collection also includes eight new daily games: Lexicon Lock, The Alibi, The Missing Move, Tile Theory, Word Fossil, Negative Logic, Paradox Box and Line by Line. See [game documentation](games/EIGHT-GAMES.md) for mechanics, sources, actual content counts and validation. All daily games reset at midnight New York time.
