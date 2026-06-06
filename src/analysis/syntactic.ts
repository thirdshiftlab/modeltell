/**
 * Modeltell - Syntactic Pattern Analyzer
 *
 * Detects grammatical construction patterns across model outputs.
 * This is the key differentiator - not just what words LLMs overuse,
 * but what sentence structures they default to.
 *
 * Usage:
 *   npx tsx src/analysis/syntactic.ts data/2026-06-01_v1
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import type { GenerationResult, PatternFrequency, SyntacticPatternMatch } from "../runner/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load Pattern Definitions ─────────────────────────────

interface PatternDef {
  id: string;
  label: string;
  description: string;
  examples: string[];
  regex: string;
  regex_extended?: string;
  severity: string;
  notes: string;
}

interface PatternConfig {
  syntactic_patterns: PatternDef[];
  lexical_watchlist: {
    power_words: string[];
    filler_phrases: string[];
    hedge_words: string[];
    connector_overuse: string[];
  };
}

// ── Bootstrap Confidence Intervals ───────────────────────

const BOOTSTRAP_ITERATIONS = 1000;
const BOOTSTRAP_SEED = 1234567; // fixed for reproducibility

/** mulberry32 - tiny deterministic PRNG so CIs are identical across re-runs. */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 95% bootstrap CI for a per-1000-words rate. Resamples the generations (the
 * natural unit) with replacement and recomputes the aggregate rate each round.
 */
function bootstrapRateCI(
  gens: Array<{ words: number; counts: Record<string, number> }>,
  patternId: string,
  rng: () => number
): { ci_low: number; ci_high: number } {
  const n = gens.length;
  if (n === 0) return { ci_low: 0, ci_high: 0 };
  const ests: number[] = [];
  for (let b = 0; b < BOOTSTRAP_ITERATIONS; b++) {
    let m = 0;
    let w = 0;
    for (let k = 0; k < n; k++) {
      const g = gens[(rng() * n) | 0];
      m += g.counts[patternId] || 0;
      w += g.words;
    }
    ests.push(w > 0 ? (m / w) * 1000 : 0);
  }
  ests.sort((x, y) => x - y);
  const at = (p: number) => ests[Math.min(ests.length - 1, Math.max(0, Math.floor(p * ests.length)))];
  return {
    ci_low: Math.round(at(0.025) * 100) / 100,
    ci_high: Math.round(at(0.975) * 100) / 100,
  };
}

// ── Permutation test: model vs. rest of the field ────────

const PERMUTATIONS = 1000;

type Gen = { words: number; counts: Record<string, number> };

/**
 * Two-sample permutation test for one model's pattern rate vs. the pooled rate
 * of all other models. Returns a two-sided p-value and the observed direction.
 * Resampling unit is the generation (exchangeable under the null).
 */
function permutationTest(
  modelGens: Gen[],
  restGens: Gen[],
  patternId: string,
  rng: () => number
): { p: number; direction: "above" | "below" } {
  const pool = [...modelGens, ...restGens];
  const nA = modelGens.length;
  const counts = pool.map((g) => g.counts[patternId] || 0);
  const words = pool.map((g) => g.words);
  const totM = counts.reduce((a, b) => a + b, 0);
  const totW = words.reduce((a, b) => a + b, 0);
  const P = pool.length;

  const diffFrom = (idx: number[]) => {
    let aM = 0, aW = 0;
    for (const i of idx) { aM += counts[i]; aW += words[i]; }
    const rA = aW > 0 ? (aM / aW) * 1000 : 0;
    const rRest = totW - aW > 0 ? ((totM - aM) / (totW - aW)) * 1000 : 0;
    return rA - rRest;
  };

  const obs = diffFrom(Array.from({ length: nA }, (_, i) => i));
  // Partial Fisher-Yates: draw nA distinct indices per permutation.
  const perm = Array.from({ length: P }, (_, i) => i);
  let extreme = 0;
  for (let b = 0; b < PERMUTATIONS; b++) {
    for (let k = 0; k < nA; k++) {
      const j = k + ((rng() * (P - k)) | 0);
      const t = perm[k]; perm[k] = perm[j]; perm[j] = t;
    }
    if (Math.abs(diffFrom(perm.slice(0, nA))) >= Math.abs(obs)) extreme++;
  }
  return { p: (extreme + 1) / (PERMUTATIONS + 1), direction: obs >= 0 ? "above" : "below" };
}

/** Benjamini-Hochberg FDR correction. Returns q-values aligned to input order. */
function benjaminiHochberg(pvals: number[]): number[] {
  const n = pvals.length;
  const order = pvals.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p);
  const q = new Array(n).fill(0);
  let prev = 1;
  for (let k = n - 1; k >= 0; k--) {
    const { p, i } = order[k];
    prev = Math.min(prev, (p * n) / (k + 1));
    q[i] = Math.round(Math.min(1, prev) * 10000) / 10000;
  }
  return q;
}

// ── Additional Structural Metrics ────────────────────────

function computeStructuralMetrics(text: string) {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.length > 0);

  // Sentence length distribution
  const sentenceLengths = sentences.map((s) => s.trim().split(/\s+/).length);
  const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length || 0;
  const sentenceLengthVariance =
    sentenceLengths.reduce((sum, l) => sum + Math.pow(l - avgSentenceLength, 2), 0) /
      sentenceLengths.length || 0;

  // Paragraph structure
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

  // Bullet point / list detection
  const bulletLines = text.split("\n").filter((l) => /^\s*[-•*]\s/.test(l) || /^\s*\d+[.)]\s/.test(l));

  // Markdown formatting density
  const boldCount = (text.match(/\*\*[^*]+\*\*/g) || []).length;
  const headerCount = (text.match(/^#{1,3}\s/gm) || []).length;

  // Exclamation mark frequency (enthusiasm signal)
  const exclamationCount = (text.match(/!/g) || []).length;

  // Em-dash vs regular dash usage
  const emDashCount = (text.match(/[\u2014\u2013]/g) || []).length;

  // Colon usage (often precedes lists)
  const colonCount = (text.match(/:/g) || []).length;

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    sentenceLengthStdDev: Math.round(Math.sqrt(sentenceLengthVariance) * 10) / 10,
    paragraphCount: paragraphs.length,
    bulletPointCount: bulletLines.length,
    bulletPointRatio: Math.round((bulletLines.length / (sentences.length || 1)) * 100) / 100,
    boldCount,
    headerCount,
    exclamationsPerK: Math.round((exclamationCount / (words.length || 1)) * 1000 * 10) / 10,
    emDashesPerK: Math.round((emDashCount / (words.length || 1)) * 1000 * 10) / 10,
    colonsPerK: Math.round((colonCount / (words.length || 1)) * 1000 * 10) / 10,
    formattingDensity: Math.round(((boldCount + headerCount + bulletLines.length) / (words.length || 1)) * 1000 * 10) / 10,
  };
}

// ── Opener Analysis ──────────────────────────────────────

function analyzeOpeners(texts: string[]): Record<string, number> {
  const openerPatterns: Record<string, RegExp> = {
    "In today's/current...": /^in\s+(today's|the\s+current|an?\s+(?:era|age|world))/i,
    "Imagine/Picture...": /^(?:imagine|picture\s+this)/i,
    "When it comes to...": /^when\s+it\s+comes\s+to/i,
    "As a/an...": /^as\s+a(?:n)?\s+/i,
    "At [company]...": /^at\s+[A-Z]/,
    "We believe/understand...": /^we\s+(?:believe|understand|know|recognize)/i,
    "The [noun] is...": /^the\s+\w+\s+(?:is|are|has|have)/i,
    "Question opener": /^(?:what|how|why|have\s+you|are\s+you|ever\s+wonder)/i,
    "Number/Stat opener": /^(?:\d|over\s+\d|more\s+than\s+\d)/,
    "Direct address (You...)": /^you(?:'re|r|\s+)/i,
    "[Noun] is/are...": /^[A-Z]\w+\s+(?:is|are|has|have)\s+/,
    "Gerund opener (-ing)": /^[A-Z]\w+ing\s+/,
  };

  const counts: Record<string, number> = {};
  for (const [label] of Object.entries(openerPatterns)) {
    counts[label] = 0;
  }
  counts["Other"] = 0;

  for (const text of texts) {
    // Get first sentence of each output
    const firstSentence = text.trim().split(/[.!?\n]/)[0]?.trim() || "";
    // Strip markdown
    const clean = firstSentence.replace(/^#+\s*/, "").replace(/^\*\*/, "");

    let matched = false;
    for (const [label, regex] of Object.entries(openerPatterns)) {
      if (regex.test(clean)) {
        counts[label]++;
        matched = true;
        break;
      }
    }
    if (!matched) counts["Other"]++;
  }

  return counts;
}

// ── Closing Analysis ─────────────────────────────────────

function analyzeClosings(texts: string[]): Record<string, number> {
  const closingPatterns: Record<string, RegExp> = {
    "Future-forward": /(?:the\s+future|as\s+we\s+(?:move|look|continue)|looking\s+ahead|poised\s+(?:to|for))/i,
    "Call to action": /(?:get\s+started|join\s+us|sign\s+up|learn\s+more|try\s+it|reach\s+out|contact\s+us)/i,
    "Question close": /\?\s*$/,
    "Together/partnership": /(?:together|partner|side\s+by\s+side|hand\s+in\s+hand)/i,
    "Exclamation": /!\s*$/,
    "Summary restatement": /(?:in\s+(?:short|summary|conclusion)|(?:the\s+)?bottom\s+line)/i,
  };

  const counts: Record<string, number> = {};
  for (const [label] of Object.entries(closingPatterns)) {
    counts[label] = 0;
  }
  counts["Neutral"] = 0;

  for (const text of texts) {
    const lastParagraph = text.trim().split(/\n\n+/).pop()?.trim() || "";
    const lastSentences = lastParagraph.split(/[.!?]/).slice(-3).join(". ");

    let matched = false;
    for (const [label, regex] of Object.entries(closingPatterns)) {
      if (regex.test(lastSentences)) {
        counts[label]++;
        matched = true;
        break;
      }
    }
    if (!matched) counts["Neutral"]++;
  }

  return counts;
}

// ── Main Analysis ────────────────────────────────────────

async function analyzeRun(runDir: string) {
  console.log(`\n🔬 Syntactic Analysis: ${runDir}\n`);

  // Determine the corpus locale from the run manifest (fallback: LOCALE env / en).
  let locale = (process.env.LOCALE || "en").toLowerCase();
  try {
    const mf = JSON.parse(await fs.readFile(path.join(runDir, "manifest.json"), "utf-8"));
    if (mf.locale) locale = String(mf.locale).toLowerCase();
  } catch {
    /* no manifest - keep default */
  }
  // Word characters for umlaut-safe watchlist boundaries.
  const WORD_CHARS = locale === "de" ? "A-Za-zÀ-ÿ" : "A-Za-z";

  // Load pattern definitions for the locale.
  const defFile = locale === "en" ? "definitions.json" : `definitions.${locale}.json`;
  const patternsPath = path.resolve(__dirname, `../../patterns/${defFile}`);
  const config: PatternConfig = JSON.parse(await fs.readFile(patternsPath, "utf-8"));
  const patterns = config.syntactic_patterns;
  console.log(`   Locale: ${locale} · patterns: ${defFile}`);

  // Load all model result files
  const files = (await fs.readdir(runDir)).filter(
    (f) => f.endsWith(".json") && !f.startsWith("_") && f !== "manifest.json"
  );

  const allMatches: SyntacticPatternMatch[] = [];
  const modelOutputs: Record<string, string[]> = {};
  const modelWordCounts: Record<string, number> = {};
  // Per-generation records (the resampling unit for bootstrap CIs):
  // perGen[modelId][i] = { words, counts: { patternId: n } }
  const perGen: Record<string, Array<{ words: number; counts: Record<string, number> }>> = {};

  for (const file of files) {
    const modelId = file.replace(".json", "");
    const results: GenerationResult[] = JSON.parse(
      await fs.readFile(path.join(runDir, file), "utf-8")
    );
    const outputs = results.map((r) => r.output);
    modelOutputs[modelId] = outputs;

    const totalWords = outputs.join(" ").split(/\s+/).length;
    modelWordCounts[modelId] = totalWords;

    perGen[modelId] = results.map((r) => ({
      words: r.output.split(/\s+/).filter(Boolean).length,
      counts: {},
    }));

    // Run each pattern against every generation, tracking per-generation counts.
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.regex, "gi");

      results.forEach((result, gi) => {
        regex.lastIndex = 0;
        let match;
        let n = 0;
        while ((match = regex.exec(result.output)) !== null) {
          n++;
          allMatches.push({
            patternId: pattern.id,
            matchText: match[0].slice(0, 100), // truncate long matches
            promptId: result.promptId,
            modelId,
            position: match.index,
          });
        }
        perGen[modelId][gi].counts[pattern.id] = n;
      });
    }
  }

  // ── Aggregate Pattern Frequencies ──────────────────────

  const rng = makeRng(BOOTSTRAP_SEED);
  const patternFreqs: PatternFrequency[] = patterns.map((pattern) => {
    const matches = allMatches.filter((m) => m.patternId === pattern.id);
    const perModel: PatternFrequency["perModel"] = {};

    for (const [modelId, wordCount] of Object.entries(modelWordCounts)) {
      const modelMatches = matches.filter((m) => m.modelId === modelId);
      const { ci_low, ci_high } = bootstrapRateCI(perGen[modelId] || [], pattern.id, rng);
      perModel[modelId] = {
        count: modelMatches.length,
        per1000Words: Math.round((modelMatches.length / wordCount) * 1000 * 100) / 100,
        ci_low,
        ci_high,
        exampleMatches: [...new Set(modelMatches.map((m) => m.matchText))].slice(0, 5),
      };
    }

    return {
      patternId: pattern.id,
      label: pattern.label,
      severity: pattern.severity,
      totalMatches: matches.length,
      perModel,
    };
  });

  // ── Significance: permutation test (model vs. field) + FDR ──
  const modelIds = Object.keys(modelWordCounts);
  const permRng = makeRng(BOOTSTRAP_SEED + 1);
  const tests: Array<{ patternId: string; modelId: string; p: number; direction: "above" | "below" }> = [];
  for (const pattern of patterns) {
    for (const modelId of modelIds) {
      const modelGens = perGen[modelId] || [];
      const restGens = modelIds.filter((m) => m !== modelId).flatMap((m) => perGen[m] || []);
      if (modelGens.length === 0 || restGens.length === 0) continue;
      const { p, direction } = permutationTest(modelGens, restGens, pattern.id, permRng);
      tests.push({ patternId: pattern.id, modelId, p, direction });
    }
  }
  const qvals = benjaminiHochberg(tests.map((t) => t.p));
  tests.forEach((t, i) => {
    const cell = patternFreqs.find((pf) => pf.patternId === t.patternId)?.perModel[t.modelId];
    if (cell) {
      cell.p_value = Math.round(t.p * 10000) / 10000;
      cell.q_value = qvals[i];
      cell.significant = qvals[i] < 0.05;
      cell.direction = t.direction;
    }
  });
  console.log(`   Significance: ${tests.filter((_, i) => qvals[i] < 0.05).length}/${tests.length} model×pattern cells significant (FDR<0.05)`);

  // ── Structural Metrics Per Model ───────────────────────

  const structuralMetrics: Record<string, ReturnType<typeof computeStructuralMetrics>> = {};
  for (const [modelId, outputs] of Object.entries(modelOutputs)) {
    const combined = outputs.join("\n\n---\n\n");
    structuralMetrics[modelId] = computeStructuralMetrics(combined);
  }

  // ── Opener & Closer Analysis ───────────────────────────

  const openerAnalysis: Record<string, Record<string, number>> = {};
  const closingAnalysis: Record<string, Record<string, number>> = {};
  for (const [modelId, outputs] of Object.entries(modelOutputs)) {
    openerAnalysis[modelId] = analyzeOpeners(outputs);
    closingAnalysis[modelId] = analyzeClosings(outputs);
  }

  // ── Lexical Watchlist Counting ─────────────────────────

  const watchlistCounts: Record<string, Record<string, number>> = {};
  for (const [modelId, outputs] of Object.entries(modelOutputs)) {
    const combined = outputs.join(" ").toLowerCase();
    watchlistCounts[modelId] = {};

    const allWatchWords = [
      ...config.lexical_watchlist.power_words,
      ...config.lexical_watchlist.filler_phrases,
      ...config.lexical_watchlist.hedge_words,
      ...config.lexical_watchlist.connector_overuse,
    ];

    for (const word of allWatchWords) {
      const esc = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Umlaut-safe word boundaries (ASCII \b breaks on ä/ö/ü/ß).
      const regex = new RegExp(`(?<![${WORD_CHARS}])${esc}(?![${WORD_CHARS}])`, "gi");
      const matches = combined.match(regex);
      if (matches && matches.length > 0) {
        watchlistCounts[modelId][word] = matches.length;
      }
    }
  }

  // ── Radar Chart Dimensions ─────────────────────────────

  const radarProfiles: Record<string, Record<string, number>> = {};
  for (const [modelId, wordCount] of Object.entries(modelWordCounts)) {
    const pf = (patternId: string) => {
      const f = patternFreqs.find((p) => p.patternId === patternId);
      return f?.perModel[modelId]?.per1000Words ?? 0;
    };

    radarProfiles[modelId] = {
      tricolonDensity: pf("tricolon"),
      hedgeDensity: pf("hedge_opening") + pf("at_its_core"),
      powerVerbDensity: pf("power_verb_stacking"),
      pseudoInclusivity: pf("whether_opener") + pf("imagine_opener"),
      escalationPatterns: pf("not_just_but") + pf("em_dash_pivot"),
      futureFiller: pf("future_forward") + pf("landscape_world"),
      emDashFreq: structuralMetrics[modelId]?.emDashesPerK ?? 0,
      formattingDensity: structuralMetrics[modelId]?.formattingDensity ?? 0,
    };
  }

  // ── Write Results ──────────────────────────────────────

  const report = {
    analyzedAt: new Date().toISOString(),
    modelCount: Object.keys(modelOutputs).length,
    totalPatternMatches: allMatches.length,
    patternFrequencies: patternFreqs,
    structuralMetrics,
    openerAnalysis,
    closingAnalysis,
    watchlistCounts,
    radarProfiles,
  };

  const outPath = path.join(runDir, "_syntactic_analysis.json");
  await fs.writeFile(outPath, JSON.stringify(report, null, 2));
  console.log(`✅ Syntactic analysis saved to ${outPath}`);

  // ── Pretty Print ───────────────────────────────────────

  console.log(`\n── Pattern Frequencies (per 1000 words) ──\n`);

  const sortedPatterns = [...patternFreqs].sort((a, b) => b.totalMatches - a.totalMatches);
  for (const pf of sortedPatterns) {
    console.log(`   ${pf.label} [${pf.severity}] - ${pf.totalMatches} total matches`);
    const modelBars = Object.entries(pf.perModel)
      .sort(([, a], [, b]) => b.per1000Words - a.per1000Words)
      .map(([m, d]) => `${m.slice(0, 12).padEnd(12)} ${d.per1000Words.toFixed(2)}`)
      .join("\n      ");
    console.log(`      ${modelBars}\n`);
  }

  console.log(`\n── Radar Profiles ──\n`);
  for (const [modelId, profile] of Object.entries(radarProfiles)) {
    console.log(`   ${modelId}:`);
    for (const [dim, val] of Object.entries(profile)) {
      const bar = "█".repeat(Math.min(Math.round(val * 10), 30));
      console.log(`      ${dim.padEnd(22)} ${val.toFixed(2)} ${bar}`);
    }
    console.log();
  }
}

// ── Entry Point ──────────────────────────────────────────

const runDir = process.argv[2];
if (!runDir) {
  console.error("Usage: npx tsx src/analysis/syntactic.ts <run-directory>");
  process.exit(1);
}

analyzeRun(runDir).catch((err) => {
  console.error("Analysis failed:", err);
  process.exit(1);
});
