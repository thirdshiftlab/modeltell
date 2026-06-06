# CLAUDE.md — Modeltell

## Vision

Modeltell is a computational linguistics project that systematically measures the lexical and syntactic fingerprints of large language models. Unlike surface-level "AI detector" tools or meme lists about "delve", this project analyzes **grammatical constructions** — the sentence structures, rhetorical patterns, and compositional habits that define each model's linguistic identity.

The key differentiator is the **syntactic pattern layer**: not just which words LLMs overuse, but which sentence structures they default to (tricolons, hedging openers, pseudo-inclusive "Whether you're X or Y" constructions, em-dash dramatic pivots, etc.).

This is an open source project by Third Shift Lab. The data, analysis, and CLI tool are MIT-licensed. A SaaS layer with MCP integration is planned for later (see "Future: SaaS Layer" below) but is NOT part of the current scope.

## Project Structure

```
modeltell/
├── CLAUDE.md                          ← You are here
├── README.md                          ← Public-facing docs
├── package.json
├── tsconfig.json
├── .env.example
├── .github/workflows/monthly-run.yml  ← Automated monthly re-runs
│
├── prompts/
│   └── catalog.json                   ← 30 standardized content prompts
│
├── patterns/
│   └── definitions.json               ← 15 syntactic patterns + lexical watchlists
│
├── src/
│   ├── runner/
│   │   ├── types.ts                   ← Shared type definitions
│   │   ├── models.ts                  ← Model registry (12 models, 3 tiers)
│   │   └── runner.ts                  ← Multi-provider API runner
│   │
│   ├── analysis/
│   │   ├── lexical.ts                 ← TF-IDF, word frequency, n-grams
│   │   └── syntactic.ts              ← Grammar pattern detection, structural metrics
│   │
│   ├── publish/
│   │   └── publish.ts                 ← Transforms analysis into community-friendly JSON
│   │
│   └── cli/
│       └── check.ts                   ← CLI linter: `npx modeltell check "text"`
│
├── data/                              ← Raw outputs per run (gitignored; only published/ is committed)
│   └── {run-id}/
│       ├── manifest.json
│       ├── {model-id}.json            ← Raw generations
│       ├── _lexical_analysis.json
│       └── _syntactic_analysis.json
│
├── published/                         ← Community-friendly data (auto-generated)
│   ├── index.json
│   ├── models/{model-id}.json
│   ├── watchlist/words.json
│   ├── watchlist/constructions.json
│   ├── comparisons/tier-summary.json
│   └── comparisons/similarity-matrix.json
│
└── frontend/                          ← Scrollytelling visualization (TODO)
```

## Stack

- **Pipeline**: TypeScript, tsx, Node.js 22+
- **APIs**: Anthropic, OpenAI, Google Gemini, Together AI (Llama/DeepSeek/Qwen), Mistral
- **Frontend**: React, Vite, Framer Motion, D3.js or Recharts
- **Deployment**: Vercel (frontend), GitHub Actions (pipeline), GitHub Pages (data API)
- **No database** — JSON files; the curated `published/` dataset is committed (raw `data/` is gitignored to keep the repo small)

## Models Tracked

| Tier | Models | Provider |
|------|--------|----------|
| Frontier | Claude Opus 4, Claude Sonnet 4, GPT-4o, GPT-4.1, Gemini 2.5 Pro | Anthropic, OpenAI, Google |
| Mid | Claude 3.5 Haiku, GPT-4.1 Mini, Gemini 2.5 Flash | Anthropic, OpenAI, Google |
| Open Source | Llama 3.3 70B, DeepSeek V3, Mistral Large, Qwen 2.5 72B | Together, Mistral |

Models are defined in `src/runner/models.ts`. Adding a new model = adding one entry to the registry.

## Pipeline Flow

```
1. GENERATE   prompts/catalog.json → runner.ts → data/{run-id}/{model}.json
2. ANALYZE    data/{run-id}/ → lexical.ts + syntactic.ts → _*_analysis.json
3. PUBLISH    data/{run-id}/ → publish.ts → published/
4. VISUALIZE  published/ → frontend → deployed website
```

Each step is independent and idempotent. You can re-run analysis without re-generating. You can re-publish without re-analyzing.

## Commands

```bash
npm install

# Generation (needs API keys in .env)
npm run run:all                          # All 12 models
npm run run:anthropic                    # Just Anthropic models
ONLY_MODELS=gpt-4o npm run run:all      # Single model

# Analysis
npm run analyze:lexical -- data/{run-id}
npm run analyze:syntactic -- data/{run-id}

# Publish community data
npm run publish:data -- data/{run-id}

# CLI linter
npm run check -- "Your text here"
npm run check -- --file input.md --json
```

## What's Done

- [x] Prompt catalog (30 use cases, 5 categories)
- [x] Pattern definitions (15 syntactic patterns + lexical watchlists)
- [x] Multi-model runner with 5 provider adapters
- [x] Lexical analyzer (TF-IDF, frequencies, n-grams)
- [x] Syntactic analyzer (pattern matching, openers/closers, structural metrics, radar profiles)
- [x] Data publisher (community JSON format with schema versioning)
- [x] CLI linter with scoring, grades, and actionable tips
- [x] GitHub Actions workflow for monthly automated runs
- [x] Type definitions for the entire pipeline
- [x] README
- [x] Pipeline validated end-to-end (mock data) + critical bug fixes: regex `(?i)` flags, ESM `__dirname`, published/ path, lexical idempotency, computed data-quality fields
- [x] Mock data generator (`scripts/mock-run.ts`) for keyless local/frontend development
- [x] Frontend scaffold: Vite + React + TS + Tailwind + Framer Motion (`frontend/`), all 9 scroll sections built against the published schema with a shared model/tier filter

## What Needs To Be Done

### Priority 1: First Run + Data Validation
- [ ] Run the pipeline end-to-end with at least 2-3 models to validate
- [ ] Check that regex patterns actually match real model outputs (tune false positive/negative rates)
- [ ] Verify TF-IDF scoring produces meaningful distinctiveness rankings
- [ ] Sanity check the radar profile dimensions — are they discriminative enough?

### Priority 2: Frontend (Scrollytelling Website)

This is the primary deliverable for public launch. The aesthetic should be **editorial/data journalism** — think pudding.cool, NYT Upshot, or The Economist data visualizations. NOT a dashboard. NOT a SaaS landing page. It's a **scroll-driven data story**.

#### Design Direction
- Dark theme, high contrast, monospace/editorial typography
- Generous whitespace, full-bleed sections
- Scroll-triggered transitions using Framer Motion or GSAP ScrollTrigger
- Data visualizations that animate into view and transform as you scroll
- No generic chart library aesthetics — custom styled D3 or heavily themed Recharts
- Mobile-responsive but desktop-first (the data story reads best wide)

#### Frontend Stack
- React + Vite (in `frontend/` directory)
- Framer Motion for scroll-triggered animations
- D3.js for custom data visualizations (radar charts, similarity heatmaps, bump charts)
- Recharts acceptable for simpler bar/line charts if heavily styled
- Tailwind CSS for layout, custom CSS for the editorial feel
- Data source: static import from `published/` directory (no API needed)

#### Page Structure (Single-Page Scroll Story)

**Section 1: Hook**
- Full-screen typographic opener
- A single AI-generated sentence with each pattern highlighted/annotated inline
- Scroll to "explode" the sentence into its component patterns
- Sets the tone: "We analyzed X million words from Y models. Here's what we found."

**Section 2: The Word Cloud (Aggregate)**
- All models combined — most overused words
- Starts as a dense cloud, scroll causes words to separate by frequency
- Each word sized by overuse score, colored by category (power word, hedge, connector, filler)
- Subtle animation: words gently pulse at their frequency rate

**Section 3: Model Fingerprints (Radar Charts)**
- One radar chart per model showing the 8 syntactic dimensions
- Scroll through models one by one, each chart morphs into the next
- Or: all charts visible in a grid, hover to enlarge
- Tier grouping visible (frontier / mid / open source colored)

**Section 4: Head to Head**
- Interactive: pick 2-3 models to compare
- Overlaid radar charts with difference highlighting
- Side-by-side example outputs for the same prompt, with patterns highlighted in-text
- "Similarity score" between the selected models

**Section 5: The Pattern Deep-Dive**
- Each syntactic pattern gets its own mini-section
- Real examples from actual model outputs (highlighted)
- Bar chart: which models use this pattern most
- The tip/recommendation from the linter

**Section 6: Evolution (Future-Proofed)**
- Timeline view showing how patterns shift across model versions
- Initially will only have one data point per model
- Designed to grow richer with each monthly re-run
- Bump chart or connected dot plot showing rank changes

**Section 7: Tier Analysis**
- Frontier vs Mid vs Open Source
- Aggregated radar overlays per tier
- Key insight: do all tiers converge on the same patterns, or do cheaper models have different linguistic habits?

**Section 8: Similarity Heatmap**
- Full model-to-model cosine similarity matrix
- Interactive: hover a cell to see which dimensions drive similarity/difference
- Cluster visualization: which models form natural groups?

**Section 9: The Watchlist (CTA)**
- Scrollable list of all detected patterns with severity badges
- Direct link to the CLI tool
- GitHub star CTA
- "Run this on your own content" prompt

#### Key Frontend Interactions
- Smooth scroll-snapping between major sections
- Scroll progress indicator (subtle, editorial style)
- Model filter: toggle models on/off globally, persists across sections
- Tier filter: quick toggle frontier/mid/opensource
- Dark/light mode toggle (default dark)
- Share buttons for individual findings ("Claude uses 3.2x more tricolons than GPT-4o")

#### Data Loading Strategy
- Import published JSON at build time (Vite static import or JSON import)
- No runtime API calls needed for v1
- When evolution data grows, consider lazy loading older runs

### Priority 3: GitHub Repo Polish
- [ ] Add LICENSE file (MIT)
- [ ] Add CONTRIBUTING.md
- [ ] Create GitHub Topics: `llm`, `linguistics`, `ai-detection`, `nlp`, `language-model`
- [ ] Add social preview image (generated from the radar chart visualization)
- [ ] Set up GitHub Pages to serve `published/` as a static JSON API
- [ ] Add badges to README (last run date, model count, pattern count)

### Priority 4: Launch Content
- [ ] Write a launch blog post for Third Shift Lab blog
- [ ] Create a Twitter/X thread with key findings (most overused pattern per model, most similar pair, biggest surprise)
- [ ] LinkedIn post (English + German version)
- [ ] Hacker News "Show HN" post
- [ ] Reddit posts: r/MachineLearning, r/LanguageTechnology, r/artificial
- [ ] ProductHunt launch (for the website, not the CLI)

## Future: SaaS Layer (Post-Launch)

NOT in current scope. Build this after open source traction is established.

### Concept
- Hosted API: `POST /api/check` with text body, returns lint results
- MCP Server: `modeltell://check` — any AI coding tool (Claude Code, Cursor, etc.) can call it as a tool to self-check its own output before responding
- Credit-based pricing: 100 checks/month free, then paid tiers
- Team features: custom pattern rules, brand voice profiles, CI/CD integration

### MCP Server Architecture
```
User's AI Tool (Claude Code, Cursor, etc.)
  → connects to modeltell MCP server
  → tool: check_text(text: string) → LintResult
  → tool: get_model_fingerprint(model: string) → ModelFingerprint
  → tool: compare_models(a: string, b: string) → ComparisonResult
```

The MCP angle is the real differentiator for SaaS: the model checks its own output for AI patterns. Meta and useful. This could be a standalone MCP server npm package even before the full SaaS.

### Monetization Path
1. Open source launch → GitHub stars, community adoption
2. Hosted API with free tier → developer adoption
3. MCP server package → integration into AI workflows
4. Team/Enterprise tier → custom patterns, dashboards, CI integration
5. Data licensing → sell access to historical evolution data to researchers

## Code Style & Conventions

- TypeScript everywhere, strict mode
- No external dependencies unless absolutely necessary (the CLI is zero-dep by design)
- JSON as the universal data format (no databases, no YAML)
- Schema versioning on all published data (`schema_version: "1.0.0"`)
- Idempotent scripts — re-running any step should be safe
- Console output with emoji indicators: 🔬 analysis, 📦 publishing, ✅ success, ✗ errors

## Key Design Decisions

1. **3 runs per prompt per model** — statistical robustness without excessive API cost. Can increase to 5 later if needed.
2. **Same system prompt for all models** — "You are a professional copywriter. Follow the instructions precisely." Ensures comparable outputs.
3. **Regex over NLP for pattern detection** — keeps the project zero-dep and fast. spaCy/transformers would be more accurate but adds massive complexity. Start simple, upgrade if needed.
4. **JSON on GitHub over database** — maximum transparency, easy forking, no infrastructure cost. The published/ directory IS the API.
5. **CLI exit code 1 on grade C or below** — makes it usable in CI/CD pipelines out of the box.
6. **Per-model JSON files are self-contained** — you can fetch one model's fingerprint without needing any other file. Reduces coupling for consumers.

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AI...
TOGETHER_API_KEY=...
MISTRAL_API_KEY=...
ONLY_MODELS=                    # optional, comma-separated filter
```

## Estimated API Costs Per Full Run

30 prompts × 3 runs × 12 models = 1,080 API calls
Average ~300 output tokens per call = ~324K output tokens total

Rough cost estimate:
- Anthropic (Opus + Sonnet + Haiku): ~$8-12
- OpenAI (4o + 4.1 + Mini): ~$3-5
- Google (Pro + Flash): ~$1-2
- Together (Llama + DeepSeek + Qwen): ~$0.50
- Mistral (Large): ~$0.50
- **Total: ~$15-20 per full run**

Monthly cadence = ~$200/year. Very manageable.
