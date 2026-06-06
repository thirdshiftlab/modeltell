# Modeltell

[![License: MIT](https://img.shields.io/badge/License-MIT-e9c46a.svg)](LICENSE)
![Models tracked](https://img.shields.io/badge/models-13-457b9d)
![Syntactic patterns](https://img.shields.io/badge/patterns-15-2a9d8f)
![Prompts](https://img.shields.io/badge/prompts-30-8a8a93)
![Zero deps](https://img.shields.io/badge/runtime%20deps-0-e63946)

**Computational linguistics analysis of AI-generated text.**

Modeltell systematically measures the lexical and syntactic fingerprints of large language models. Unlike word-level "AI detector" lists, this project analyzes *grammatical constructions* - the sentence structures, rhetorical patterns, and compositional habits that define each model's linguistic identity.

## What Makes This Different

Everyone knows LLMs overuse "delve" and "leverage." That's table stakes. Modeltell goes deeper:

- **Syntactic pattern detection**: Tricolon frequency, hedging constructions, pseudo-inclusive openers ("Whether you're X or Y"), em-dash dramatic pivots, power verb stacking density
- **Structural analysis**: Opener/closer classification, bullet-to-prose ratios, formatting density, sentence length variance
- **Cross-model fingerprinting**: Radar profiles that reveal each model's unique combination of linguistic habits
- **Evolution tracking**: How do these patterns shift across model versions? Are models converging or diverging?

## Architecture

```
prompts/catalog.json       30 standardized content generation prompts
patterns/definitions.json  15 syntactic patterns + lexical watchlists
src/runner/                Multi-provider API runner (3 runs per prompt per model)
src/analysis/              Lexical (cross-model TF-IDF, Burrows's Delta) + Syntactic (regex patterns)
src/publish/               Transforms analysis → community JSON (published/)
src/cli/                   Zero-dependency content linter (npm run check)
scripts/mock-run.ts        Synthetic dataset generator (no API keys needed)
data/{run-id}/             Raw outputs + analysis results per run
published/                 Versioned community dataset (the static JSON API)
frontend/                  Scrollytelling visualization (React + Vite + D3)
```

## Tracked Models

| Tier | Models |
|------|--------|
| Frontier | Claude Opus 4.8 / 4.7 / 4.6, GPT-5.5, Gemini 3.1 Pro |
| Mid | Claude Sonnet 4.6, GPT-5.4 Mini, Gemini 3.5 Flash |
| Open Source | Llama 4 Maverick, DeepSeek V4 Pro / V3.2, Mistral Large (2512), Qwen3.7 Max |

The current registry lives in `src/runner/models.ts` (13 models, with `family`/`version` for drift). Adding a model = one entry there.

## Detected Patterns

| Pattern | What It Detects | Severity |
|---------|----------------|----------|
| Tricolon | "innovative, scalable, and transformative" | High |
| Whether-You're | "Whether you're a startup or enterprise..." | Critical |
| Hedging Opener | "It's worth noting that..." | High |
| Not-Just-But | "not just a tool, but a partner" | High |
| In-Today's-Landscape | "In today's fast-paced digital landscape..." | Critical |
| Em-Dash Pivot | "one platform - endless possibilities" | Medium |
| Power Verb Stacking | "drive, boost, and accelerate" | High |
| Future-Forward Closing | "As we move forward..." | High |
| ... and 7 more | See `patterns/definitions.json` | |

## Quick Start

```bash
# Install
npm install

# Configure keys: copy and edit .env (auto-loaded by the runner)
cp .env.example .env
```

**Keys:** set `OPENROUTER_API_KEY`. The default registry routes all 13 models
through OpenRouter's single OpenAI-compatible API, so that one key is all you
need. Open models are provider-pinned (and the serving backend is recorded in
each result) for reproducibility.

> The runner also ships direct-provider adapters (`callAnthropic`, `callOpenAI`,
> …), but they're only used if you change a model's `provider` in
> `src/runner/models.ts` away from `"openrouter"`. With the default registry the
> direct keys (`ANTHROPIC_API_KEY`, …) are not consulted.

```bash
# Run generation (all models you have keys for)
npm run run:all

# Fast smoke run: a few models, 1 generation per prompt
RUNS_PER_PROMPT=1 ONLY_MODELS=claude-sonnet-4.6,gpt-5.5 npm run run:all

# German corpus instead of English (prompts, patterns, stopwords)
LOCALE=de npm run run:all

# Convenience model groups (just preset ONLY_MODELS filters - everything
# still runs through OpenRouter, these don't hit providers directly)
npm run run:anthropic   # the Claude models   (run:openai, run:google, run:opensource too)

# Analyze results (set LOCALE=de for German lexical stopwords)
npm run analyze:lexical -- data/<run-id>
npm run analyze:syntactic -- data/<run-id>

# Publish the community dataset → published/<locale>/
npm run publish:data -- data/<run-id>
```

### No API keys? Use the mock generator

For developing the analysis, publisher, or frontend without spending anything,
generate a full synthetic dataset (model-specific pattern density, no API calls):

```bash
npx tsx scripts/mock-run.ts
RUN=$(ls -td data/*_mock | head -1)
npx tsx src/analysis/lexical.ts "$RUN" && npx tsx src/analysis/syntactic.ts "$RUN" && npx tsx src/publish/publish.ts "$RUN"
```

## CLI Linter

A zero-dependency, **bilingual (EN/DE)** linter that flags AI patterns in any
text. The language is auto-detected; override with `--locale en|de`. Exits
non-zero on grade C or below, so it drops straight into CI:

```bash
npm run check -- "In today's fast-paced landscape, whether you're a pro or a beginner..."
npx modeltell check --locale de "In der heutigen schnelllebigen Welt optimieren wir nahtlos."
npx modeltell check --file landing-page.md --json
echo "some text" | npx modeltell check -
```

It embeds its own patterns/words per language (no external files), so it runs
standalone after `npm run build:cli` (output: `dist/cli/check.js`).

## Automated Runs

A GitHub Action runs the full pipeline monthly and commits results. See `.github/workflows/monthly-run.yml`.

## Frontend

A scroll-driven data story built with React, Vite, Framer Motion, and custom
SVG/D3 visualizations. It reads the `published/` dataset - no runtime API. See
[`frontend/README.md`](frontend/README.md) for details.

```bash
cd frontend && npm install && npm run dev   # auto-syncs published/ first
```

Sections, in scroll order:

1. **Hook** - an annotated AI sentence, every "tell" highlighted inline
2. **The Word Cloud** - frequent AI-associated vocabulary, sized by frequency
3. **Model Fingerprints** - a radar chart per model across 8 syntactic dimensions
4. **Head to Head** - overlay any two models + a similarity score
5. **Version Drift** - one model family across its own versions (e.g. Opus 4.6→4.8)
6. **Pattern Deep-Dive** - each construction with a real example, CI whiskers, significance markers, the fix
7. **Tier Analysis** - Frontier vs Mid vs Open Source averages
8. **Similarity Heatmap** - every pair, scored (radar similarity ⇄ Burrows's Delta)
9. **The Watchlist** - full pattern list + CLI call-to-action

A **language switcher (EN/DE)** flips both the UI and the underlying corpus.

## Data API

The pipeline publishes a versioned, self-contained JSON dataset under
`published/<locale>/`, served as a static API via GitHub Pages
(`.github/workflows/pages.yml`). Each corpus language gets its own namespace:

```
published/locales.json                            discovery: which languages exist
published/<locale>/index.json                     entry point  (locale = en | de | …)
published/<locale>/models/{model-id}.json         per-model fingerprint (self-contained)
published/<locale>/watchlist/words.json           frequent AI-associated words
published/<locale>/watchlist/constructions.json   syntactic constructions
published/<locale>/comparisons/tier-summary.json  frontier/mid/opensource averages
published/<locale>/comparisons/similarity-matrix.json   radar similarity matrix
published/<locale>/comparisons/delta-matrix.json        Burrows's Delta matrix
published/<locale>/validation/regex-precision.json      manual precision audit (optional)
```

`validation/regex-precision.json` is **optional and currently English-only** - a
locale's `index.json` lists `files.regex_precision` only when that audit exists,
so always read it from the index rather than assuming the path.

Start at `locales.json`, then `published/en/index.json` (or `…/de/index.json`).
On GitHub Pages that's e.g. `https://<owner>.github.io/modeltell/en/index.json`.

## Data Format

Raw outputs: `data/{run-id}/{model-id}.json`
Lexical analysis: `data/{run-id}/_lexical_analysis.json`
Syntactic analysis: `data/{run-id}/_syntactic_analysis.json`

All data is committed to the repo for full transparency and reproducibility.

## Scope, accuracy & limitations

We try to be precise about what these numbers do and don't support. The full
methodology & limitations page (in the frontend, route `#/methodology`) is the
canonical reference. In short:

- **Not an AI detector.** This describes tendencies of model output in aggregate,
  not the provenance of any single text. Published AI detectors are unreliable
  and biased; don't use this to judge whether a person wrote something.
- **No human baseline (yet).** The lexical scores measure *cross-model*
  distinctiveness (TF-IDF vs the aggregate of all models), **not** "overuse vs
  humans." A matched human corpus is future work.
- **Heuristic detection, partially validated.** Patterns are regular expressions.
  A manual precision audit ([`validation/regex-precision.json`](validation/regex-precision.json))
  measured **~71% micro-precision** with a wide spread - clean for some patterns
  (not-just-but, power verbs), but **~0% for `parenthetical_aside`** and ~0.75 for
  `tricolon`/`em_dash_pivot` (they over-count in long lists). **Recall is not yet
  measured**, and the audit is single-annotator.
- **Significance is pattern-level.** Each frequency carries a 95% bootstrap CI and
  an FDR-corrected permutation test (model vs. field); full pairwise tests are not
  yet done.
- **Task/prompt bias.** One domain (business/marketing copy), one system prompt,
  default decoding - "model style" is entangled with "task style."

## Contributing

PRs welcome - see [CONTRIBUTING.md](CONTRIBUTING.md). In short: add patterns to
`patterns/definitions.json`, models to `src/runner/models.ts`, prompts to
`prompts/catalog.json`. Keep the pipeline zero-dependency and `tsc --noEmit`
clean. (Pattern regexes are JavaScript - no Python-style `(?i)` inline flags.)

## License

MIT

---

Built by [Third Shift Lab](https://thirdshiftlab.com) as an open research project.
