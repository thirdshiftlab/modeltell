# Modeltell — Frontend

The scrollytelling data story. React + Vite + Tailwind + Framer Motion, with
custom SVG/D3 visualizations. Reads the published dataset (no runtime API).

## Data source

The app renders whatever is in the repo-root `published/` directory. A small
script (`scripts/sync-data.mjs`) copies `published/` → `public/data/` before
`dev` and `build`, and the app fetches it as static JSON at runtime.

If `published/` doesn't exist yet, generate it first. For real data you need API
keys (see the root `.env.example`); for local development you can use the mock
generator, which needs no keys:

```bash
# from the repo root
npx tsx scripts/mock-run.ts                       # → data/<date>_mock/
npx tsx src/analysis/lexical.ts   data/<date>_mock
npx tsx src/analysis/syntactic.ts data/<date>_mock
npx tsx src/publish/publish.ts    data/<date>_mock # → published/
```

## Develop

```bash
cd frontend
npm install
npm run dev      # auto-syncs published/ → public/data first
```

## Build

```bash
npm run build    # type-checks, syncs data, then vite build → dist/
npm run preview
```

`vite.config.ts` sets `base: "./"` so the build works from a domain root
(Vercel) or a subpath (GitHub Pages).

## Structure

```
src/
  App.tsx              Loads data, renders states, wires providers
  Story.tsx            Composes the 8 sections in order
  types.ts             Mirrors the published/ JSON schema
  data/useData.ts      Fetches + assembles the dataset
  state/filters.tsx    Global model/tier filter (shared across sections)
  lib/utils.ts         Radar normalization, similarity, color helpers
  components/          RadarChart, Section, Reveal, ScrollProgress, FilterBar
  sections/            Hook, WordCloud, Fingerprints, HeadToHead,
                       PatternDeepDive, TierAnalysis, SimilarityHeatmap, Watchlist
```

The global filter (bottom-right) toggles models and whole tiers; every
data-driven section reacts to it.
