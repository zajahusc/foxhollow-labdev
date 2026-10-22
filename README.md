# Foxhollow Labs website

Static website with WordBridge at `/wordbridge/`. Publish this repository root using the existing hosting provider. Directory hosting redirects `/wordbridge` to `/wordbridge/`, keeping game assets and its service worker scoped to the game.

The game uses the bundled WordNet dictionary and daily schedule through June 30, 2027. It needs no API key or backend. The Merriam-Webster backend from the original app is not deployed here. Browser storage keys are preserved for existing progress on the same origin. Scores on other hostnames cannot transfer automatically.

Only public game assets are included; dictionary licenses are in `wordbridge/data/Licenses.txt`.
