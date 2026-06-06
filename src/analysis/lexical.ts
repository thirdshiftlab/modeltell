/**
 * Modeltell - Lexical Analyzer
 *
 * Computes word frequencies, TF-IDF scores against a baseline,
 * and n-gram analysis across all model outputs.
 *
 * Usage:
 *   npx tsx src/analysis/lexical.ts data/2026-06-01_v1
 */

import fs from "fs/promises";
import path from "path";
import type { GenerationResult, WordFrequency } from "../runner/types";

// ── Locale ───────────────────────────────────────────────
// Resolved per run inside analyzeRun() (from the run manifest, with LOCALE env
// as a fallback). These are mutable so the tokenizers pick up the right set
// regardless of how the script is invoked.

let LETTERS = "a-z"; // letters kept by the tokenizers (German adds umlauts + ß)

// ── Stopwords ────────────────────────────────────────────

const STOPWORDS_DE = new Set([
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem",
  "einer", "eines", "und", "oder", "aber", "auch", "noch", "nur", "schon",
  "wie", "als", "wenn", "dann", "denn", "doch", "sehr", "mehr", "so", "zu",
  "ich", "du", "er", "sie", "es", "wir", "ihr", "mir", "mich", "dir", "dich",
  "sich", "uns", "euch", "ihm", "ihn", "ihnen", "mein", "dein", "sein", "ihre",
  "unser", "euer", "ist", "sind", "war", "waren", "bin", "bist", "seid",
  "hat", "habe", "haben", "hatte", "hätte", "wird", "werden", "wurde", "würde",
  "kann", "können", "muss", "müssen", "soll", "sollen", "darf", "dürfen",
  "will", "wollen", "mag", "mögen", "im", "am", "an", "auf", "aus", "bei",
  "mit", "nach", "von", "vor", "zur", "zum", "über", "unter", "durch", "für",
  "gegen", "ohne", "um", "bis", "seit", "während", "wegen", "innerhalb",
  "dieser", "diese", "dieses", "diesem", "diesen", "jener", "welche", "man",
  "jede", "jeder", "jedes", "alle", "alles", "kein", "keine", "nicht", "ja",
  "nein", "hier", "dort", "wo", "was", "wer", "wann", "warum", "ihren", "ihrem",
]);

const STOPWORDS_EN = new Set([
  // English function words
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "shall", "can", "need", "must",
  "it", "its", "this", "that", "these", "those", "i", "you", "he", "she",
  "we", "they", "me", "him", "her", "us", "them", "my", "your", "his",
  "our", "their", "mine", "yours", "hers", "ours", "theirs",
  "what", "which", "who", "whom", "whose", "when", "where", "why", "how",
  "if", "then", "than", "so", "as", "just", "also", "very", "too",
  "not", "no", "nor", "only", "own", "same", "such", "both", "each",
  "all", "any", "few", "more", "most", "other", "some", "about", "up",
  "out", "into", "over", "after", "before", "between", "under", "again",
  "there", "here", "once", "during", "while", "through",
  // Common verbs that aren't interesting
  "get", "got", "make", "made", "take", "took", "know", "see", "come",
  "think", "look", "want", "give", "use", "find", "tell", "ask", "work",
  "seem", "feel", "try", "leave", "call", "keep", "let", "begin", "show",
  "hear", "play", "run", "move", "like", "live", "believe", "bring",
  "go", "going", "say", "said", "new", "well", "way", "even",
]);

let STOPWORDS: Set<string> = STOPWORDS_EN;

// ── Tokenizer ────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(new RegExp(`[^${LETTERS}\\s'-]`, "g"), " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

/**
 * Tokenizer for Burrows's Delta: keeps ALL words including function words
 * (the, of, and, a, …) - Delta operates on the most-frequent words, which are
 * dominated by exactly the stopwords the main tokenizer removes.
 */
function tokenizeAll(text: string): string[] {
  return text
    .toLowerCase()
    .replace(new RegExp(`[^${LETTERS}\\s']`, "g"), " ")
    .split(/\s+/)
    .filter((w) => w.length >= 1);
}

function extractNgrams(tokens: string[], n: number): string[] {
  const ngrams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(" "));
  }
  return ngrams;
}

// ── Frequency Analysis ───────────────────────────────────

interface FrequencyMap {
  [word: string]: number;
}

function countFrequencies(tokens: string[]): FrequencyMap {
  const freq: FrequencyMap = {};
  for (const t of tokens) {
    freq[t] = (freq[t] || 0) + 1;
  }
  return freq;
}

function normalizePerK(freq: FrequencyMap, totalTokens: number): FrequencyMap {
  const result: FrequencyMap = {};
  for (const [word, count] of Object.entries(freq)) {
    result[word] = (count / totalTokens) * 1000;
  }
  return result;
}

// ── TF-IDF ───────────────────────────────────────────────

/**
 * Simple TF-IDF: compare model word frequencies against
 * an aggregate "expected" frequency from all models combined.
 * Words that one model uses much more than average get high scores.
 */
function computeTfIdf(
  modelFreqs: Record<string, FrequencyMap>,
  globalFreq: FrequencyMap
): Record<string, Record<string, number>> {
  const modelCount = Object.keys(modelFreqs).length;
  const result: Record<string, Record<string, number>> = {};

  for (const [modelId, freq] of Object.entries(modelFreqs)) {
    result[modelId] = {};

    for (const [word, modelRate] of Object.entries(freq)) {
      const globalRate = globalFreq[word] || 0.001;
      // TF-IDF-like: how much more does this model use this word vs average?
      const score = modelRate / globalRate;
      if (score > 1.5) {
        // Only track words used 50% more than average
        result[modelId][word] = Math.round(score * 100) / 100;
      }
    }
  }

  return result;
}

// ── Main Analysis ────────────────────────────────────────

async function analyzeRun(runDir: string) {
  console.log(`\n📊 Lexical Analysis: ${runDir}\n`);

  // Resolve corpus locale from the run manifest (fallback: LOCALE env / en),
  // then configure the tokenizers (German keeps umlauts + German stopwords).
  let locale = (process.env.LOCALE || "en").toLowerCase();
  try {
    const mf = JSON.parse(await fs.readFile(path.join(runDir, "manifest.json"), "utf-8"));
    if (mf.locale) locale = String(mf.locale).toLowerCase();
  } catch {
    /* no manifest - keep default */
  }
  LETTERS = locale === "de" ? "a-zäöüß" : "a-z";
  STOPWORDS = locale === "de" ? STOPWORDS_DE : STOPWORDS_EN;
  console.log(`   Locale: ${locale}`);

  // Load all model result files
  const files = (await fs.readdir(runDir)).filter(
    (f) => f.endsWith(".json") && !f.startsWith("_") && f !== "manifest.json"
  );

  const modelOutputs: Record<string, string[]> = {};
  const modelTokens: Record<string, string[]> = {};
  let allTokens: string[] = [];

  for (const file of files) {
    const modelId = file.replace(".json", "");
    const results: GenerationResult[] = JSON.parse(
      await fs.readFile(path.join(runDir, file), "utf-8")
    );

    const outputs = results.map((r) => r.output);
    modelOutputs[modelId] = outputs;

    const tokens = outputs.flatMap(tokenize);
    modelTokens[modelId] = tokens;
    allTokens = allTokens.concat(tokens);
  }

  // Per-model frequencies (per 1000 words)
  const modelFreqs: Record<string, FrequencyMap> = {};
  const modelStats: Record<string, { totalTokens: number; uniqueTokens: number; uniqueWordRatio: number }> = {};
  for (const [modelId, tokens] of Object.entries(modelTokens)) {
    const raw = countFrequencies(tokens);
    modelFreqs[modelId] = normalizePerK(raw, tokens.length);
    const uniqueTokens = Object.keys(raw).length;
    modelStats[modelId] = {
      totalTokens: tokens.length,
      uniqueTokens,
      uniqueWordRatio: tokens.length > 0 ? Math.round((uniqueTokens / tokens.length) * 1000) / 1000 : 0,
    };
    console.log(`   ${modelId}: ${tokens.length} tokens, ${uniqueTokens} unique`);
  }

  // ── Burrows's Delta: z-scored most-frequent-word vectors ──
  // (Burrows 2002 - the standard stylometric distance. Computed on the N most
  //  frequent words across the corpus, NOT stopword-filtered.)
  const N_MFW = 150;
  const modelAllTokens: Record<string, string[]> = {};
  let allAllTokens: string[] = [];
  for (const [modelId, outputs] of Object.entries(modelOutputs)) {
    const toks = outputs.flatMap(tokenizeAll);
    modelAllTokens[modelId] = toks;
    allAllTokens = allAllTokens.concat(toks);
  }
  const globalAllFreq = countFrequencies(allAllTokens);
  const mfw = Object.entries(globalAllFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, N_MFW)
    .map(([w]) => w);

  const deltaModels = Object.keys(modelAllTokens);
  // Per-model relative frequency of each MFW.
  const relFreq: Record<string, number[]> = {};
  for (const m of deltaModels) {
    const raw = countFrequencies(modelAllTokens[m]);
    const total = modelAllTokens[m].length || 1;
    relFreq[m] = mfw.map((w) => (raw[w] || 0) / total);
  }
  // Mean and population std of each MFW's relative frequency across models.
  const means = mfw.map((_, i) => deltaModels.reduce((s, m) => s + relFreq[m][i], 0) / deltaModels.length);
  const stds = mfw.map((_, i) => {
    const v = deltaModels.reduce((s, m) => s + (relFreq[m][i] - means[i]) ** 2, 0) / deltaModels.length;
    return Math.sqrt(v);
  });
  // Z-score vector per model (0 where a word is invariant across models).
  const deltaVectors: Record<string, number[]> = {};
  for (const m of deltaModels) {
    deltaVectors[m] = relFreq[m].map((f, i) => (stds[i] > 0 ? (f - means[i]) / stds[i] : 0));
  }

  // Global frequency
  const globalRaw = countFrequencies(allTokens);
  const globalFreq = normalizePerK(globalRaw, allTokens.length);

  // TF-IDF: per-model distinctiveness
  const tfidf = computeTfIdf(modelFreqs, globalFreq);

  // ── Output: Global Top Words ───────────────────────────

  const globalRanking: WordFrequency[] = Object.entries(globalRaw)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 200)
    .map(([word, count]) => ({
      word,
      count,
      frequency: globalFreq[word],
      tfidfScore: 0, // global doesn't have TF-IDF
      models: Object.fromEntries(
        Object.entries(modelFreqs).map(([m, f]) => [m, f[word] || 0])
      ),
    }));

  // ── Output: Per-Model Top Distinctive Words ────────────

  const modelDistinctive: Record<string, Array<{ word: string; score: number; freq: number }>> = {};
  for (const [modelId, scores] of Object.entries(tfidf)) {
    modelDistinctive[modelId] = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50)
      .map(([word, score]) => ({
        word,
        score,
        freq: modelFreqs[modelId][word] || 0,
      }));
  }

  // ── Output: N-gram analysis (bigrams & trigrams) ───────

  const modelBigrams: Record<string, FrequencyMap> = {};
  const modelTrigrams: Record<string, FrequencyMap> = {};

  for (const [modelId, tokens] of Object.entries(modelTokens)) {
    const bigrams = extractNgrams(tokens, 2);
    const trigrams = extractNgrams(tokens, 3);
    modelBigrams[modelId] = countFrequencies(bigrams);
    modelTrigrams[modelId] = countFrequencies(trigrams);
  }

  // Top bigrams per model
  const topBigrams: Record<string, Array<{ ngram: string; count: number }>> = {};
  for (const [modelId, freq] of Object.entries(modelBigrams)) {
    topBigrams[modelId] = Object.entries(freq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 30)
      .map(([ngram, count]) => ({ ngram, count }));
  }

  // ── Write Results ──────────────────────────────────────

  const report = {
    analyzedAt: new Date().toISOString(),
    totalTokens: allTokens.length,
    modelCount: Object.keys(modelOutputs).length,
    modelStats,
    globalTopWords: globalRanking,
    modelDistinctiveWords: modelDistinctive,
    topBigramsPerModel: topBigrams,
    // Burrows's Delta inputs: the MFW list + per-model z-scored vectors.
    burrowsDelta: { mfwCount: N_MFW, mfw, vectors: deltaVectors },
  };

  const outPath = path.join(runDir, "_lexical_analysis.json");
  await fs.writeFile(outPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Lexical analysis saved to ${outPath}`);

  // ── Pretty Print Summary ───────────────────────────────

  console.log(`\n── Global Top 20 Words ──`);
  for (const w of globalRanking.slice(0, 20)) {
    const modelBars = Object.entries(w.models)
      .map(([m, f]) => `${m.slice(0, 8)}:${f.toFixed(1)}`)
      .join("  ");
    console.log(`   ${w.word.padEnd(20)} ${w.frequency.toFixed(2)}/1k   ${modelBars}`);
  }

  console.log(`\n── Most Distinctive Words Per Model ──`);
  for (const [modelId, words] of Object.entries(modelDistinctive)) {
    console.log(`\n   ${modelId}:`);
    for (const w of words.slice(0, 10)) {
      console.log(`      ${w.word.padEnd(20)} ${w.score.toFixed(1)}x above avg`);
    }
  }
}

// ── Entry Point ──────────────────────────────────────────

const runDir = process.argv[2];
if (!runDir) {
  console.error("Usage: npx tsx src/analysis/lexical.ts <run-directory>");
  process.exit(1);
}

analyzeRun(runDir).catch((err) => {
  console.error("Analysis failed:", err);
  process.exit(1);
});
