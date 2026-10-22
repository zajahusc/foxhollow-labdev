# Word Orbit, Semantic Gravity and Word Weave — data publication v1

## Semantic Gravity

Real GloVe 6B / 50-dimensional pretrained vectors by Jeffrey Pennington, Richard Socher and Christopher D. Manning, Stanford NLP. [Project](https://nlp.stanford.edu/projects/glove/), [paper](https://nlp.stanford.edu/pubs/glove.pdf), [official licensing statement](https://github.com/stanfordnlp/GloVe#license). The pretrained vectors are offered under the [Public Domain Dedication and License](https://opendatacommons.org/licenses/pddl/).

The original converted archive is distributed by [gensim-data](https://github.com/piskvorky/gensim-data). Model archive MD5: `c289bc5d7f2f02c6dc9f2f9b67641813`. The archive remains outside this repository. `gravity-v1.f32` is a filtered, L2-normalized, little-endian Float32 subset; its SHA-256, vocabulary, model identity and exact transformations are recorded in `gravity-v1.json` and `gravity-provenance.json`. `games/scripts/prepare-gravity.py` reproduces it.

The frozen vocabulary contains 6,028 common eligible entries, selected by corpus frequency from the existing filtered WordNet vocabulary, plus explicit everyday target candidates. There are 100 targets, 20 per estimated difficulty. Each guess is ranked by actual cosine similarity within this vocabulary, with the exact target first and stable lexical tie-breaking. No letter matching, invented percentage or hand-authored association score is used. Neighbor hints come from ranks 30 and 5, never the target. Difficulty uses close-neighbor density and corpus frequency as a proxy, not observed player data. General GloVe vectors can blend senses and contain corpus bias; model rankings need not match everyone's intuition. Vectors and vocabulary are frozen to preserve historical dailies.

## Word Weave

Dictionary `fox-common-wordnet-v1` contains 1,805 common three-to-five-letter entries. It is a frequency-filtered subset of the existing Open English WordNet-derived data, with a small explicitly listed tutorial/word-square supplement. The original extraction admits lowercase lexical entries only, omitting capitalized proper names. The current publication excludes the existing PG blocklist plus additional explicit terms. Common inflections are permitted only if present in this same versioned list. Puzzle modes never silently change dictionary membership.

[Open English WordNet 2025](https://en-word.net/) is under CC BY 4.0, with underlying Princeton WordNet notices. Source, hashes, full license text and adaptations are retained at [Provenance.json](/wordbridge/data/Provenance.json) and [Licenses.txt](/wordbridge/data/Licenses.txt). This subset changes the eligible word selection, not the source definitions; no definitions are bundled. No endorsement by the WordNet projects is implied.

All 100 daily-bank grids have an actual solution and exactly one completion under their printed constraints and this dictionary. The solver counts up to two and accepts uniqueness only when it has exhausted search with exactly one result. Free Weave permits multiple valid completions and accepts any that satisfy the published dictionary and active constraints. Different valid Free Weave results are never rejected for differing from the construction example.

## Word Orbit

Twelve centers, each with eight distinct relationship categories, supply 96 explicit relationships. Difficulty selects four/five/six/six/eight of these; those variants are not counted as separate authored puzzles. Accepted aliases are finite, normalized, disjoint within each center, and explained. Unlisted associations are described as unlisted, not asserted to be semantically invalid; players can save an alternative locally and copy it for review.

Construction review checked the dictionary senses and the stated example relationships; the source page for each center is linked in every relationship. These are paraphrased constructed connections, not copied dictionary definitions. No independent human editorial approval or proof of exhaustive semantic uniqueness is claimed. Before major content expansion, an independent editor should review alternatives and coverage.

Dictionary references: [star](https://www.merriam-webster.com/dictionary/star), [spring](https://www.merriam-webster.com/dictionary/spring), [light](https://www.merriam-webster.com/dictionary/light), [key](https://www.merriam-webster.com/dictionary/key), [branch](https://www.merriam-webster.com/dictionary/branch), [pitch](https://www.merriam-webster.com/dictionary/pitch), [bank](https://www.merriam-webster.com/dictionary/bank), [scale](https://www.merriam-webster.com/dictionary/scale), [root](https://www.merriam-webster.com/dictionary/root), [bridge](https://www.merriam-webster.com/dictionary/bridge), [cell](https://www.merriam-webster.com/dictionary/cell), [ring](https://www.merriam-webster.com/dictionary/ring). Illustrative compounds/applications extend those senses; source pages are not claims of external editorial endorsement. The software-branch example also follows the [Git branch documentation](https://git-scm.com/docs/git-branch).

## Scheduling and practice

Explicit mappings cover October 21, 2026 through October 20, 2027. All mappings are checked in and do not depend on changing bank sizes. Banks cycle once exhausted. Orbit/Gravity practice revisits their bounded collections after recent eligible content is exhausted. Weave can generate new verified grids in a Web Worker; the fixed dictionary still implies a finite mathematical space. No paid API is called in ordinary gameplay.
