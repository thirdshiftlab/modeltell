// ── Model & Runner Types ─────────────────────────────────

export type Provider = "anthropic" | "openai" | "google" | "together" | "mistral" | "openrouter";

export interface ModelConfig {
  provider: Provider;
  apiModel: string;
  tier: "frontier" | "mid" | "opensource";
  label: string;
  maxTokens: number;
  /** Stable model family for grouping versions over time (e.g. "claude-opus"). */
  family?: string;
  /** Human-readable version within the family (e.g. "4.8"). */
  version?: string;
  /** OpenRouter model slug, used when USE_OPENROUTER=1 (e.g. "openai/gpt-4o"). */
  openrouterSlug?: string;
  /**
   * Optional OpenRouter provider pin for reproducibility (e.g. ["Together"]).
   * Mainly for open models that multiple backends can serve; closed models map
   * to a single canonical provider and don't need this.
   */
  openrouterProviders?: string[];
}

export interface Prompt {
  id: string;
  category: string;
  label: string;
  prompt: string;
}

export interface PromptCatalog {
  meta: { version: string; description: string; instructions: string };
  prompts: Prompt[];
}

export interface GenerationResult {
  modelId: string;
  promptId: string;
  runIndex: number;        // 0, 1, 2 for 3 runs per prompt
  timestamp: string;       // ISO 8601
  output: string;
  tokenCount: number;
  latencyMs: number;
  servedBy?: string;       // actual backend provider (OpenRouter routing), for provenance
}

export interface RunManifest {
  runId: string;           // e.g. "2026-06-01_v1"
  locale?: string;         // "en" | "de" | … (corpus language)
  startedAt: string;
  completedAt: string | null;
  models: string[];
  promptCount: number;
  runsPerPrompt: number;
  totalGenerations: number;
  results: GenerationResult[];
}

// ── Analysis Types ───────────────────────────────────────

export interface WordFrequency {
  word: string;
  count: number;
  frequency: number;       // per 1000 words
  tfidfScore: number;      // vs human baseline
  models: Record<string, number>; // frequency per model
}

export interface SyntacticPatternMatch {
  patternId: string;
  matchText: string;
  promptId: string;
  modelId: string;
  position: number;        // char offset in output
}

export interface PatternFrequency {
  patternId: string;
  label: string;
  severity: string;
  totalMatches: number;
  perModel: Record<string, {
    count: number;
    per1000Words: number;
    ci_low?: number;        // 95% bootstrap CI lower bound (per 1000 words)
    ci_high?: number;       // 95% bootstrap CI upper bound (per 1000 words)
    p_value?: number;       // permutation test: this model vs. rest of field
    q_value?: number;       // Benjamini-Hochberg FDR-adjusted p-value
    significant?: boolean;  // q_value < 0.05
    direction?: "above" | "below"; // model uses pattern more/less than the field
    exampleMatches: string[];
  }>;
}

export interface ModelFingerprint {
  modelId: string;
  label: string;
  tier: string;
  wordCount: number;
  uniqueWordRatio: number;
  avgSentenceLength: number;
  topOverusedWords: WordFrequency[];
  patternProfile: Record<string, number>; // patternId -> frequency per 1000 words
  radarDimensions: {
    tricolonDensity: number;
    hedgeDensity: number;
    powerVerbDensity: number;
    openerDiversity: number;    // inverse of how often same openers repeat
    emDashFrequency: number;
    rhetoricalQuestionRate: number;
  };
}

export interface AnalysisReport {
  runId: string;
  analyzedAt: string;
  modelFingerprints: ModelFingerprint[];
  globalWordRanking: WordFrequency[];
  globalPatternRanking: PatternFrequency[];
  crossModelComparisons: {
    mostSimilarPair: [string, string];
    leastSimilarPair: [string, string];
    tierAverages: Record<string, ModelFingerprint["radarDimensions"]>;
  };
}

// ── Evolution Types ──────────────────────────────────────

export interface EvolutionEntry {
  runId: string;
  date: string;
  modelId: string;
  modelVersion: string;    // specific API model string at time of run
  fingerprint: ModelFingerprint;
}

export interface EvolutionTimeline {
  modelId: string;
  entries: EvolutionEntry[];
}
