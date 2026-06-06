// Mirrors the published/ JSON schema produced by src/publish/publish.ts.

export type Tier = "frontier" | "mid" | "opensource";
export type Severity = "critical" | "high" | "medium" | "low";

export interface PublishedIndex {
  schema_version: string;
  project: { name: string; url: string; license: string; description: string };
  generated_at: string;
  run_id: string;
  prompt_count: number;
  runs_per_prompt: number;
  models: Array<{ id: string; label: string; tier: Tier; file: string; family?: string; version?: string }>;
  files: Record<string, string>;
}

export interface RadarProfile {
  tricolon_density: number;
  hedge_density: number;
  power_verb_density: number;
  pseudo_inclusivity: number;
  escalation_patterns: number;
  future_filler: number;
  em_dash_frequency: number;
  formatting_density: number;
}

export interface ModelFingerprint {
  schema_version: string;
  model: { id: string; label: string; provider: string; api_model: string; tier: Tier; family?: string; version?: string };
  analyzed_at: string;
  run_id: string;
  corpus: {
    total_words: number;
    total_outputs: number;
    unique_word_ratio: number;
    avg_sentence_length: number;
    sentence_length_std_dev: number;
  };
  radar: RadarProfile;
  top_words: Array<{
    word: string;
    frequency_per_1k: number;
    distinctiveness: number;
    category: "power_word" | "hedge" | "connector" | "filler" | "other";
  }>;
  patterns: Array<{
    id: string;
    label: string;
    severity: Severity;
    count: number;
    per_1k_words: number;
    ci_low?: number;
    ci_high?: number;
    q_value?: number;
    significant?: boolean;
    direction?: "above" | "below";
    examples: string[];
  }>;
  opener_distribution: Record<string, number>;
  closer_distribution: Record<string, number>;
  structure: {
    bullet_point_ratio: number;
    bold_per_1k_words: number;
    headers_per_1k_words: number;
    exclamations_per_1k_words: number;
    em_dashes_per_1k_words: number;
    colons_per_1k_words: number;
  };
}

export interface WatchlistWords {
  schema_version: string;
  description: string;
  generated_at: string;
  words: Array<{
    word: string;
    overuse_score: number;
    per_model?: Record<string, number>;
    worst_offenders: string[];
    category: string;
  }>;
}

export interface WatchlistConstructions {
  schema_version: string;
  description: string;
  generated_at: string;
  constructions: Array<{
    id: string;
    label: string;
    description: string;
    severity: Severity;
    regex: string;
    avg_frequency: number;
    examples: string[];
    worst_offenders: Array<{ model: string; per_1k: number }>;
  }>;
}

export interface TierSummary {
  schema_version: string;
  generated_at: string;
  tiers: Record<
    string,
    {
      label: string;
      color: string;
      model_count: number;
      models: string[];
      avg_radar: Record<string, number>;
    }
  >;
}

export interface SimilarityMatrix {
  schema_version: string;
  generated_at: string;
  description: string;
  dimensions: string[];
  matrix: Record<string, Record<string, number>>;
}

export interface DeltaMatrix {
  schema_version: string;
  generated_at: string;
  method: string;
  description: string;
  mfw_count: number;
  most_frequent_words: string[];
  matrix: Record<string, Record<string, number>>;
}

export interface RegexAudit {
  schema_version: string;
  method: string;
  caveats: string[];
  patterns: Array<{
    id: string;
    label: string;
    sample_size: number;
    true_positives: number;
    precision: number;
    note: string;
    false_positive_examples: string[];
  }>;
  summary: { audited_patterns: number; total_sampled: number; total_true_positives: number; micro_precision: number };
}

export interface PatternDefinitions {
  syntactic_patterns: Array<{
    id: string;
    label: string;
    description: string;
    examples: string[];
    regex: string;
    severity: Severity;
    notes: string;
  }>;
  lexical_watchlist: Record<string, string[] | string>;
}

export interface ModeltellData {
  index: PublishedIndex;
  fingerprints: Record<string, ModelFingerprint>;
  watchlistWords: WatchlistWords;
  watchlistConstructions: WatchlistConstructions;
  tierSummary: TierSummary;
  similarity: SimilarityMatrix;
  delta?: DeltaMatrix;
  regexAudit?: RegexAudit;
  patterns: PatternDefinitions;
}

// The 8 radar dimensions in display order, with human-readable labels.
export const RADAR_DIMENSIONS: Array<{ key: keyof RadarProfile; label: string }> = [
  { key: "tricolon_density", label: "Tricolon" },
  { key: "hedge_density", label: "Hedging" },
  { key: "power_verb_density", label: "Power Verbs" },
  { key: "pseudo_inclusivity", label: "Pseudo-Incl." },
  { key: "escalation_patterns", label: "Escalation" },
  { key: "future_filler", label: "Future" },
  { key: "em_dash_frequency", label: "Em-Dash" },
  { key: "formatting_density", label: "Formatting" },
];

export const TIER_META: Record<Tier, { label: string; color: string }> = {
  frontier: { label: "Frontier", color: "#e63946" },
  mid: { label: "Mid-Tier", color: "#457b9d" },
  opensource: { label: "Open Source", color: "#2a9d8f" },
};

export const SEVERITY_META: Record<Severity, { label: string; color: string }> = {
  critical: { label: "Critical", color: "#e63946" },
  high: { label: "High", color: "#e9c46a" },
  medium: { label: "Medium", color: "#457b9d" },
  low: { label: "Low", color: "#8a8a93" },
};
