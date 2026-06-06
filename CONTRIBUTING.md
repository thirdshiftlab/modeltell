# Contributing to Modeltell

Thanks for your interest! Modeltell is an open research project - contributions
of patterns, models, prompts, fixes, and frontend polish are all welcome.

## Ground rules

- **Zero runtime dependencies in the pipeline and CLI.** The core (`src/`) is
  intentionally dependency-free except `tsx` for execution. Don't add npm
  packages to the root project. (The `frontend/` is the exception - it has its
  own dependencies.)
- **TypeScript, strict mode.** `npx tsc --noEmit` must pass at the repo root and
  in `frontend/`.
- **JSON is the only data format.** No databases, no YAML.
- **Idempotent scripts.** Re-running any pipeline step must be safe.
- **Schema versioning.** Any change to the shape of files in `published/` bumps
  `schema_version`.

## Common contributions

### Add a syntactic pattern

Edit [`patterns/definitions.json`](patterns/definitions.json):

```jsonc
{
  "id": "your_pattern_id",
  "label": "Human-Readable Name",
  "description": "What it detects",
  "examples": ["a real example", "another example"],
  "regex": "your\\s+javascript\\s+regex",   // NO inline flags like (?i) - the
                                             // analyzer applies "gi" itself
  "severity": "critical | high | medium | low",
  "notes": "Why this is an LLM tell"
}
```

Then, if the pattern should appear in the standalone linter, mirror it in
[`src/cli/check.ts`](src/cli/check.ts) (with a `tip`) and add a fix tip to the
frontend's `PatternDeepDive` `TIPS` map.

> ⚠️ Regexes are JavaScript `RegExp`. Do **not** use Python-style inline flags
> like `(?i)` - they throw. Case-insensitivity is applied by the analyzer.

### Add a model

Add one entry to [`src/runner/models.ts`](src/runner/models.ts) with its
provider, API model string, tier, label, and `maxTokens`. The runner, analysis,
and publisher pick it up automatically.

### Add a prompt

Append to [`prompts/catalog.json`](prompts/catalog.json). Keep prompts neutral
and reusable across models - they're sent verbatim to every model.

## Developing without API keys

Use the mock generator to produce a full dataset for testing analysis,
publishing, and the frontend:

```bash
npx tsx scripts/mock-run.ts
RUN=$(ls -td data/*_mock | head -1)
npx tsx src/analysis/lexical.ts   "$RUN"
npx tsx src/analysis/syntactic.ts "$RUN"
npx tsx src/publish/publish.ts    "$RUN"
```

## Before opening a PR

```bash
npx tsc --noEmit                       # root pipeline type-checks
npm run check -- "a quick smoke test"  # CLI still runs
cd frontend && npm run build           # frontend builds
```

Describe what you changed and, for new patterns, include a real example that
the regex matches (and ideally one it should *not* match).
