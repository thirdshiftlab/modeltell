/**
 * Modeltell - Data Publisher
 *
 * Transforms raw analysis results into a clean, documented,
 * community-friendly data format. Outputs:
 *
 *   published/
 *     index.json                   ← manifest + metadata
 *     models/
 *       claude-sonnet-4.json       ← per-model fingerprint
 *       gpt-4o.json
 *       ...
 *     patterns/
 *       all-patterns.json          ← pattern definitions + global stats
 *     watchlist/
 *       words.json                 ← overused words ranked
 *       constructions.json         ← overused constructions ranked
 *     comparisons/
 *       tier-summary.json          ← frontier vs mid vs opensource
 *       similarity-matrix.json     ← cosine similarity between models
 *
 * Usage:
 *   npx tsx src/publish/publish.ts data/2026-06-01_v1
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import type { Tier } from "../runner/models";
import { MODEL_REGISTRY, TIERS } from "../runner/models";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Published Data Types (this IS the public API contract) ────

/**
 * Root index - entry point for consumers.
 * Fetch this first, then drill into what you need.
 */
interface PublishedIndex {
  /** Schema version for breaking change detection */
  schema_version: "1.0.0";
  /** Project metadata */
  project: {
    name: "Modeltell";
    url: "https://github.com/thirdshiftlab/modeltell";
    license: "MIT";
    description: string;
  };
  /** When this dataset was generated */
  generated_at: string;
  /** Which run produced this data */
  run_id: string;
  /** Corpus language ("en" | "de" | …) */
  locale: string;
  /** How many prompts were used */
  prompt_count: number;
  /** How many runs per prompt (for statistical robustness) */
  runs_per_prompt: number;
  /** Available model files */
  models: Array<{
    id: string;
    label: string;
    tier: string;
    file: string;
    family?: string;
    version?: string;
  }>;
  /** Available data files */
  files: {
    patterns: string;
    watchlist_words: string;
    watchlist_constructions: string;
    tier_summary: string;
    similarity_matrix: string;
    delta_matrix: string;
    /** Only present when a manual precision audit exists for this locale. */
    regex_precision?: string;
  };
}

/**
 * Per-model fingerprint - the main data file per model.
 * Designed to be self-contained: you can use one model file
 * without needing any other files.
 */
interface PublishedModelFingerprint {
  /** Schema version */
  schema_version: "1.0.0";
  /** Model identification */
  model: {
    id: string;
    label: string;
    provider: string;
    api_model: string;
    tier: string;
    family?: string;
    version?: string;
  };
  /** When this was analyzed */
  analyzed_at: string;
  run_id: string;
  /** Corpus statistics */
  corpus: {
    total_words: number;
    total_outputs: number;
    unique_word_ratio: number;
    avg_sentence_length: number;
    sentence_length_std_dev: number;
  };
  /** Radar chart dimensions (normalized 0-1 for easy visualization) */
  radar: {
    tricolon_density: number;
    hedge_density: number;
    power_verb_density: number;
    pseudo_inclusivity: number;
    escalation_patterns: number;
    future_filler: number;
    em_dash_frequency: number;
    formatting_density: number;
  };
  /** Top overused words with frequency per 1000 words */
  top_words: Array<{
    word: string;
    frequency_per_1k: number;
    distinctiveness: number; // how much more than average (1.0 = average)
    category: "power_word" | "hedge" | "connector" | "filler" | "other";
  }>;
  /** Syntactic pattern frequencies */
  patterns: Array<{
    id: string;
    label: string;
    severity: "critical" | "high" | "medium" | "low";
    count: number;
    per_1k_words: number;
    /** 95% bootstrap confidence interval (per 1,000 words) */
    ci_low?: number;
    ci_high?: number;
    /** Permutation test vs. rest of field, FDR-adjusted */
    q_value?: number;
    significant?: boolean;
    direction?: "above" | "below";
    examples: string[];
  }>;
  /** How this model opens content */
  opener_distribution: Record<string, number>;
  /** How this model closes content */
  closer_distribution: Record<string, number>;
  /** Structural tendencies */
  structure: {
    bullet_point_ratio: number;
    bold_per_1k_words: number;
    headers_per_1k_words: number;
    exclamations_per_1k_words: number;
    em_dashes_per_1k_words: number;
    colons_per_1k_words: number;
  };
}

/**
 * Community watchlist - the "just give me the list" format.
 * Devs can use this to lint their AI-generated content.
 */
interface PublishedWatchlistWords {
  schema_version: "1.0.0";
  description: string;
  generated_at: string;
  /** Sorted by corpus frequency (highest first) */
  words: Array<{
    word: string;
    /** Frequency per 1,000 words across the whole corpus */
    overuse_score: number;
    /** Per-model frequency per 1,000 words for UI filtering */
    per_model: Record<string, number>;
    /** Which models use it most */
    worst_offenders: string[];
    /** Category for filtering */
    category: string;
  }>;
}

interface PublishedWatchlistConstructions {
  schema_version: "1.0.0";
  description: "Grammatical constructions disproportionately used by LLMs. These are harder to detect than individual words and represent deeper stylistic patterns.";
  generated_at: string;
  constructions: Array<{
    id: string;
    label: string;
    description: string;
    severity: string;
    /** Regex that detects this pattern */
    regex: string;
    /** Aggregate frequency across all models (per 1k words) */
    avg_frequency: number;
    /** Examples from actual model outputs */
    examples: string[];
    /** Which models use it most */
    worst_offenders: Array<{ model: string; per_1k: number }>;
  }>;
}

// ── Publisher Logic ──────────────────────────────────────

async function publish(runDir: string) {
  // Load analysis results (manifest first - it carries the corpus locale).
  const lexicalPath = path.join(runDir, "_lexical_analysis.json");
  const syntacticPath = path.join(runDir, "_syntactic_analysis.json");
  const manifestPath = path.join(runDir, "manifest.json");

  const [lexical, syntactic, manifest] = await Promise.all([
    fs.readFile(lexicalPath, "utf-8").then(JSON.parse),
    fs.readFile(syntacticPath, "utf-8").then(JSON.parse),
    fs.readFile(manifestPath, "utf-8").then(JSON.parse),
  ]);

  const modelIds = manifest.models as string[];
  const runId = manifest.runId as string;
  const locale = String(manifest.locale || "en").toLowerCase();
  const defFile = locale === "en" ? "definitions.json" : `definitions.${locale}.json`;
  const now = new Date().toISOString();

  // Each language publishes into its own namespace: published/<locale>/…
  const outDir = path.resolve(runDir, `../../published/${locale}`);
  await fs.mkdir(path.join(outDir, "models"), { recursive: true });
  await fs.mkdir(path.join(outDir, "patterns"), { recursive: true });
  await fs.mkdir(path.join(outDir, "watchlist"), { recursive: true });
  await fs.mkdir(path.join(outDir, "comparisons"), { recursive: true });
  await fs.mkdir(path.join(outDir, "validation"), { recursive: true });

  console.log(`\n📦 Publishing ${locale} data for ${modelIds.length} models → published/${locale}/\n`);

  // ── Per-Model Files ────────────────────────────────────

  for (const modelId of modelIds) {
    const config = MODEL_REGISTRY[modelId];
    if (!config) continue;

    const structural = syntactic.structuralMetrics?.[modelId] || {};
    const radar = syntactic.radarProfiles?.[modelId] || {};
    const openers = syntactic.openerAnalysis?.[modelId] || {};
    const closers = syntactic.closingAnalysis?.[modelId] || {};

    // Normalize radar to 0-1 range (we'll compute max across all models)
    // For now, output raw - frontend can normalize

    const modelPatterns = syntactic.patternFrequencies
      ?.map((pf: any) => ({
        id: pf.patternId,
        label: pf.label,
        severity: pf.severity,
        count: pf.perModel?.[modelId]?.count || 0,
        per_1k_words: pf.perModel?.[modelId]?.per1000Words || 0,
        ci_low: pf.perModel?.[modelId]?.ci_low,
        ci_high: pf.perModel?.[modelId]?.ci_high,
        q_value: pf.perModel?.[modelId]?.q_value,
        significant: pf.perModel?.[modelId]?.significant,
        direction: pf.perModel?.[modelId]?.direction,
        examples: pf.perModel?.[modelId]?.exampleMatches || [],
      }))
      .filter((p: any) => p.count > 0)
      .sort((a: any, b: any) => b.per_1k_words - a.per_1k_words) || [];

    const distinctiveWords = lexical.modelDistinctiveWords?.[modelId] || [];
    const watchlist = syntactic.watchlistCounts?.[modelId] || {};
    const lexStats = lexical.modelStats?.[modelId] || {};
    const totalWords = structural.wordCount || 0;
    const per1k = (n: number) => (totalWords > 0 ? Math.round((n / totalWords) * 1000 * 10) / 10 : 0);

    const topWords = distinctiveWords.slice(0, 50).map((w: any) => ({
      word: w.word,
      frequency_per_1k: Math.round(w.freq * 100) / 100,
      distinctiveness: w.score,
      category: categorizeWord(w.word),
    }));

    const fingerprint: PublishedModelFingerprint = {
      schema_version: "1.0.0",
      model: {
        id: modelId,
        label: config.label,
        provider: config.provider,
        api_model: config.apiModel,
        tier: config.tier,
        ...(config.family ? { family: config.family } : {}),
        ...(config.version ? { version: config.version } : {}),
      },
      analyzed_at: now,
      run_id: runId,
      corpus: {
        total_words: totalWords,
        total_outputs: manifest.promptCount * manifest.runsPerPrompt,
        unique_word_ratio: lexStats.uniqueWordRatio || 0,
        avg_sentence_length: structural.avgSentenceLength || 0,
        sentence_length_std_dev: structural.sentenceLengthStdDev || 0,
      },
      radar: {
        tricolon_density: radar.tricolonDensity || 0,
        hedge_density: radar.hedgeDensity || 0,
        power_verb_density: radar.powerVerbDensity || 0,
        pseudo_inclusivity: radar.pseudoInclusivity || 0,
        escalation_patterns: radar.escalationPatterns || 0,
        future_filler: radar.futureFiller || 0,
        em_dash_frequency: radar.emDashFreq || 0,
        formatting_density: radar.formattingDensity || 0,
      },
      top_words: topWords,
      patterns: modelPatterns,
      opener_distribution: openers,
      closer_distribution: closers,
      structure: {
        bullet_point_ratio: structural.bulletPointRatio || 0,
        bold_per_1k_words: per1k(structural.boldCount || 0),
        headers_per_1k_words: per1k(structural.headerCount || 0),
        exclamations_per_1k_words: structural.exclamationsPerK || 0,
        em_dashes_per_1k_words: structural.emDashesPerK || 0,
        colons_per_1k_words: structural.colonsPerK || 0,
      },
    };

    const modelPath = path.join(outDir, "models", `${modelId}.json`);
    await fs.writeFile(modelPath, JSON.stringify(fingerprint, null, 2));
    console.log(`   ✓ ${config.label} → models/${modelId}.json`);
  }

  // ── Watchlist: Words ───────────────────────────────────
  // Build from the CURATED AI-tell words actually measured in the corpus
  // (watchlistCounts), not raw word frequency - raw frequency is dominated by
  // topical nouns and prompt placeholders like "[Company Name]", which makes
  // for a boring, misleading cloud.

  const wlDefs = JSON.parse(
    await fs.readFile(path.resolve(__dirname, `../../patterns/${defFile}`), "utf-8")
  ).lexical_watchlist || {};
  const wordCategory: Record<string, string> = {};
  const canonicalWord: Record<string, string> = {};
  const addWords = (words: string[] | undefined, category: string) => {
    for (const w of words || []) {
      const key = String(w).toLowerCase();
      wordCategory[key] = category;
      canonicalWord[key] = String(w);
    }
  };
  addWords(wlDefs.power_words, "power_word");
  addWords(wlDefs.hedge_words, "hedge");
  addWords(wlDefs.connector_overuse, "connector");
  addWords(wlDefs.filler_phrases, "filler");

  const wcCounts: Record<string, Record<string, number>> = syntactic.watchlistCounts || {};
  const structuralAll: Record<string, any> = syntactic.structuralMetrics || {};
  const corpusWords = Object.values(structuralAll).reduce((s: number, m: any) => s + (m.wordCount || 0), 0) || 1;

  const wordAgg: Record<string, { total: number; perModel: Record<string, number> }> = {};
  for (const [mid, counts] of Object.entries(wcCounts)) {
    for (const [word, c] of Object.entries(counts)) {
      const canonical = canonicalWord[word.toLowerCase()] || word;
      (wordAgg[canonical] ??= { total: 0, perModel: {} });
      wordAgg[canonical].total += c;
      wordAgg[canonical].perModel[mid] = c;
    }
  }

  const wordWatchlist: PublishedWatchlistWords = {
    schema_version: "1.0.0",
    description:
      "Curated AI-associated words and how often they appear across the corpus (per 1,000 words). These are known LLM tells (power words, hedges, connectors, fillers), measured in this run.",
    generated_at: now,
    words: Object.entries(wordAgg)
      .map(([word, d]) => ({
        word,
        overuse_score: Math.round((d.total / corpusWords) * 1000 * 100) / 100,
        per_model: Object.fromEntries(
          Object.entries(d.perModel).map(([m, c]) => [
            m,
            Math.round((c / (structuralAll[m]?.wordCount || 1)) * 1000 * 100) / 100,
          ])
        ),
        worst_offenders: Object.entries(d.perModel)
          .map(([m, c]) => ({ m, per1k: c / ((structuralAll[m]?.wordCount || 1)) }))
          .sort((a, b) => b.per1k - a.per1k)
          .slice(0, 3)
          .map((o) => o.m),
        category: wordCategory[word.toLowerCase()] || categorizeWord(word),
      }))
      .sort((a, b) => b.overuse_score - a.overuse_score)
      .slice(0, 100),
  };
  await fs.writeFile(
    path.join(outDir, "watchlist", "words.json"),
    JSON.stringify(wordWatchlist, null, 2)
  );

  // ── Watchlist: Constructions ───────────────────────────

  const patternDefs = JSON.parse(
    await fs.readFile(path.resolve(__dirname, `../../patterns/${defFile}`), "utf-8")
  );

  const constructionWatchlist: PublishedWatchlistConstructions = {
    schema_version: "1.0.0",
    description: "Grammatical constructions disproportionately used by LLMs. These are harder to detect than individual words and represent deeper stylistic patterns.",
    generated_at: now,
    constructions: (syntactic.patternFrequencies || []).map((pf: any) => {
      const def = patternDefs.syntactic_patterns.find((d: any) => d.id === pf.patternId);
      const modelEntries = Object.entries(pf.perModel || {}) as [string, any][];
      const sorted = modelEntries.sort(([, a]: any, [, b]: any) => b.per1000Words - a.per1000Words);
      const avgFreq = modelEntries.length > 0
        ? modelEntries.reduce((sum: number, [, d]: any) => sum + d.per1000Words, 0) / modelEntries.length
        : 0;

      return {
        id: pf.patternId,
        label: pf.label,
        description: def?.description || "",
        severity: pf.severity,
        regex: def?.regex || "",
        avg_frequency: Math.round(avgFreq * 100) / 100,
        examples: sorted[0]?.[1]?.exampleMatches?.slice(0, 3) || def?.examples || [],
        worst_offenders: sorted.slice(0, 3).map(([m, d]: any) => ({
          model: m,
          per_1k: d.per1000Words,
        })),
      };
    }),
  };
  await fs.writeFile(
    path.join(outDir, "watchlist", "constructions.json"),
    JSON.stringify(constructionWatchlist, null, 2)
  );

  // ── Tier Summary ───────────────────────────────────────

  const tierSummary: Record<string, any> = {};
  for (const [tier, tierMeta] of Object.entries(TIERS)) {
    const tierModels = modelIds.filter((m) => MODEL_REGISTRY[m]?.tier === tier);
    if (tierModels.length === 0) continue;

    const radars = tierModels.map((m) => syntactic.radarProfiles?.[m]).filter(Boolean);
    const avgRadar: Record<string, number> = {};
    if (radars.length > 0) {
      for (const key of Object.keys(radars[0])) {
        avgRadar[key] = Math.round(
          (radars.reduce((sum: number, r: any) => sum + (r[key] || 0), 0) / radars.length) * 100
        ) / 100;
      }
    }

    tierSummary[tier] = {
      label: tierMeta.label,
      color: tierMeta.color,
      model_count: tierModels.length,
      models: tierModels,
      avg_radar: avgRadar,
    };
  }
  await fs.writeFile(
    path.join(outDir, "comparisons", "tier-summary.json"),
    JSON.stringify({ schema_version: "1.0.0", generated_at: now, tiers: tierSummary }, null, 2)
  );

  // ── Similarity Matrix ──────────────────────────────────
  // Cosine similarity on the raw radar vectors is NOT discriminative here:
  // every vector lives in the all-positive orthant, so all pairs score ~0.9-1.0.
  // Instead we min-max normalize each dimension across models (stretching it to
  // 0..1), then use a Euclidean-distance-based similarity. This measures how
  // close two models sit on each pattern *relative to the field*, so the scores
  // actually spread across the range.

  const radarKeys = Object.keys(syntactic.radarProfiles?.[modelIds[0]] || {});
  const profiles: Record<string, Record<string, number>> = syntactic.radarProfiles || {};

  // Per-dimension min/max across all models.
  const dimMin: Record<string, number> = {};
  const dimMax: Record<string, number> = {};
  for (const key of radarKeys) {
    const vals = modelIds.map((m) => profiles[m]?.[key] ?? 0);
    dimMin[key] = Math.min(...vals);
    dimMax[key] = Math.max(...vals);
  }
  const norm = (m: string, key: string) => {
    const span = dimMax[key] - dimMin[key];
    return span > 0 ? ((profiles[m]?.[key] ?? 0) - dimMin[key]) / span : 0;
  };

  const maxDist = Math.sqrt(radarKeys.length); // max possible distance in [0,1]^n
  const matrix: Record<string, Record<string, number>> = {};
  for (const a of modelIds) {
    matrix[a] = {};
    for (const b of modelIds) {
      if (a === b) { matrix[a][b] = 1; continue; }
      if (!profiles[a] || !profiles[b]) { matrix[a][b] = 0; continue; }
      let sumSq = 0;
      for (const key of radarKeys) sumSq += (norm(a, key) - norm(b, key)) ** 2;
      const similarity = 1 - Math.sqrt(sumSq) / maxDist; // 1 = identical, 0 = maximally far
      matrix[a][b] = Math.round(similarity * 1000) / 1000;
    }
  }

  await fs.writeFile(
    path.join(outDir, "comparisons", "similarity-matrix.json"),
    JSON.stringify({
      schema_version: "1.0.0",
      generated_at: now,
      description: "Similarity between model fingerprints, from Euclidean distance on per-dimension min-max-normalized radar profiles. 1.0 = identical relative pattern usage, 0.0 = maximally different.",
      dimensions: radarKeys,
      matrix,
    }, null, 2)
  );

  // ── Burrows's Delta Matrix ─────────────────────────────
  // The standard stylometric distance (Burrows 2002): mean absolute difference
  // of z-scored most-frequent-word frequencies. Lower = more similar style.
  const bd = lexical.burrowsDelta;
  if (bd?.vectors) {
    const deltaMatrix: Record<string, Record<string, number>> = {};
    const vec = bd.vectors as Record<string, number[]>;
    const dModels = modelIds.filter((m) => vec[m]);
    for (const a of dModels) {
      deltaMatrix[a] = {};
      for (const b of dModels) {
        if (a === b) { deltaMatrix[a][b] = 0; continue; }
        const za = vec[a], zb = vec[b];
        let sum = 0;
        for (let i = 0; i < za.length; i++) sum += Math.abs(za[i] - zb[i]);
        deltaMatrix[a][b] = Math.round((sum / za.length) * 1000) / 1000;
      }
    }
    await fs.writeFile(
      path.join(outDir, "comparisons", "delta-matrix.json"),
      JSON.stringify({
        schema_version: "1.0.0",
        generated_at: now,
        method: "Burrows's Delta (Burrows 2002)",
        description: "Stylometric distance between models: mean absolute difference of z-scored relative frequencies of the most-frequent words. 0 = identical style; higher = more different. This is the established authorship-attribution metric, reported alongside our radar-based similarity.",
        mfw_count: bd.mfwCount,
        most_frequent_words: bd.mfw,
        matrix: deltaMatrix,
      }, null, 2)
    );
    console.log(`   ✓ Burrows's Delta matrix (${bd.mfwCount} MFW)`);
  }

  // ── Copy manual regex precision audit for this locale, if present ──
  // (Done before the index so we only advertise the file when it exists.)
  let auditWritten = false;
  try {
    const auditFile = locale === "en" ? "regex-precision.json" : `regex-precision.${locale}.json`;
    const auditSrc = path.resolve(__dirname, `../../validation/${auditFile}`);
    await fs.writeFile(
      path.join(outDir, "validation", "regex-precision.json"),
      await fs.readFile(auditSrc, "utf-8")
    );
    auditWritten = true;
  } catch {
    /* no audit for this locale - the index simply omits regex_precision */
  }

  // ── Index ──────────────────────────────────────────────

  const index: PublishedIndex = {
    schema_version: "1.0.0",
    project: {
      name: "Modeltell",
      url: "https://github.com/thirdshiftlab/modeltell",
      license: "MIT",
      description: "Computational linguistics analysis of AI-generated text - lexical and syntactic fingerprints across models and versions.",
    },
    generated_at: now,
    run_id: runId,
    locale,
    prompt_count: manifest.promptCount,
    runs_per_prompt: manifest.runsPerPrompt,
    models: modelIds
      .filter((m) => MODEL_REGISTRY[m])
      .map((m) => ({
        id: m,
        label: MODEL_REGISTRY[m].label,
        tier: MODEL_REGISTRY[m].tier,
        file: `models/${m}.json`,
        ...(MODEL_REGISTRY[m].family ? { family: MODEL_REGISTRY[m].family } : {}),
        ...(MODEL_REGISTRY[m].version ? { version: MODEL_REGISTRY[m].version } : {}),
      })),
    files: {
      patterns: "patterns/all-patterns.json",
      watchlist_words: "watchlist/words.json",
      watchlist_constructions: "watchlist/constructions.json",
      tier_summary: "comparisons/tier-summary.json",
      similarity_matrix: "comparisons/similarity-matrix.json",
      delta_matrix: "comparisons/delta-matrix.json",
      ...(auditWritten ? { regex_precision: "validation/regex-precision.json" } : {}),
    },
  };

  await fs.writeFile(path.join(outDir, "index.json"), JSON.stringify(index, null, 2));

  // ── Copy pattern definitions to published ──────────────

  await fs.writeFile(
    path.join(outDir, "patterns", "all-patterns.json"),
    await fs.readFile(path.resolve(__dirname, `../../patterns/${defFile}`), "utf-8")
  );

  // ── Top-level discovery entry point: published/locales.json ──
  // Lists every locale that currently has a dataset. Consumers fetch this first,
  // then drill into published/<locale>/index.json.
  const publishedRoot = path.resolve(outDir, "..");
  const entries = await fs.readdir(publishedRoot, { withFileTypes: true });
  const locales: string[] = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    try {
      await fs.access(path.join(publishedRoot, e.name, "index.json"));
      locales.push(e.name);
    } catch {
      /* not a locale dataset */
    }
  }
  locales.sort();
  await fs.writeFile(
    path.join(publishedRoot, "locales.json"),
    JSON.stringify(
      {
        schema_version: "1.0.0",
        generated_at: now,
        default: locales.includes("en") ? "en" : locales[0] ?? "en",
        locales: locales.map((l) => ({ locale: l, index: `${l}/index.json` })),
      },
      null,
      2
    )
  );

  console.log(`\n✅ Published to ${outDir}/`);
  console.log(`   ${modelIds.length} model fingerprints`);
  console.log(`   ${wordWatchlist.words.length} watchlist words`);
  console.log(`   ${constructionWatchlist.constructions.length} watchlist constructions`);
  console.log(`   Tier summary + similarity matrix`);
}

// ── Helpers ──────────────────────────────────────────────

const POWER_WORDS = new Set([
  "seamless", "seamlessly", "leverage", "leveraging", "robust", "cutting-edge",
  "game-changer", "game-changing", "groundbreaking", "revolutionary", "transformative",
  "innovative", "innovation", "disruptive", "empower", "empowering", "unlock",
  "elevate", "supercharge", "streamline", "optimize", "maximize", "harness",
  "foster", "cultivate", "navigate", "delve", "synergy", "holistic",
  "comprehensive", "unparalleled", "unprecedented",
]);

const HEDGE_WORDS = new Set([
  "arguably", "perhaps", "essentially", "effectively", "virtually",
  "relatively", "generally", "typically", "potentially", "certainly",
]);

const CONNECTORS = new Set([
  "moreover", "furthermore", "additionally", "consequently",
  "nevertheless", "nonetheless", "accordingly", "subsequently",
]);

function categorizeWord(word: string): "power_word" | "hedge" | "connector" | "filler" | "other" {
  const lower = word.toLowerCase();
  if (POWER_WORDS.has(lower)) return "power_word";
  if (HEDGE_WORDS.has(lower)) return "hedge";
  if (CONNECTORS.has(lower)) return "connector";
  return "other";
}

// ── Entry Point ──────────────────────────────────────────

const runDir = process.argv[2];
if (!runDir) {
  console.error("Usage: npx tsx src/publish/publish.ts <run-directory>");
  process.exit(1);
}

publish(runDir).catch((err) => {
  console.error("Publishing failed:", err);
  process.exit(1);
});
