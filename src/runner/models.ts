import type { ModelConfig } from "./types";

/**
 * Modeltell - Model Registry
 *
 * Each model entry defines how to call it and how to group it.
 * Add new models here; the runner picks them up automatically.
 *
 * We run through OpenRouter (one key for everything), so `apiModel` holds the
 * OpenRouter slug and `provider` is "openrouter". `family` + `version` let the
 * frontend group a model's versions and show linguistic drift over a generation
 * (e.g. Claude Opus 4.6 → 4.7 → 4.8, DeepSeek V3.2 → V4).
 *
 * `openrouterProviders` sets a PREFERRED backend (for reproducibility); the
 * runner allows fallback, so a flaky provider won't drop the model. `servedBy`
 * in each result records which backend actually answered.
 *
 * ⚠️ Slugs/provider names drift - verified against openrouter.ai/models on the
 *    last update; re-verify before a fresh run if anything 404s.
 */
export const MODEL_REGISTRY: Record<string, ModelConfig> = {
  // ── Frontier Tier ──────────────────────────────────────
  // Claude Opus drift ladder (3 versions of one family) ↓
  "claude-opus-4.8": {
    provider: "openrouter",
    apiModel: "anthropic/claude-opus-4.8",
    tier: "frontier",
    label: "Claude Opus 4.8",
    maxTokens: 1024,
    family: "claude-opus",
    version: "4.8",
    openrouterSlug: "anthropic/claude-opus-4.8",
  },
  "claude-opus-4.7": {
    provider: "openrouter",
    apiModel: "anthropic/claude-opus-4.7",
    tier: "frontier",
    label: "Claude Opus 4.7",
    maxTokens: 1024,
    family: "claude-opus",
    version: "4.7",
    openrouterSlug: "anthropic/claude-opus-4.7",
  },
  "claude-opus-4.6": {
    provider: "openrouter",
    apiModel: "anthropic/claude-opus-4.6",
    tier: "frontier",
    label: "Claude Opus 4.6",
    maxTokens: 1024,
    family: "claude-opus",
    version: "4.6",
    openrouterSlug: "anthropic/claude-opus-4.6",
  },
  "gpt-5.5": {
    provider: "openrouter",
    apiModel: "openai/gpt-5.5",
    tier: "frontier",
    label: "GPT-5.5",
    maxTokens: 1024,
    family: "gpt",
    version: "5.5",
    openrouterSlug: "openai/gpt-5.5",
  },
  "gemini-3.1-pro": {
    provider: "openrouter",
    apiModel: "google/gemini-3.1-pro-preview",
    tier: "frontier",
    label: "Gemini 3.1 Pro",
    maxTokens: 1024,
    family: "gemini-pro",
    version: "3.1",
    openrouterSlug: "google/gemini-3.1-pro-preview",
  },

  // ── Mid Tier ───────────────────────────────────────────
  "claude-sonnet-4.6": {
    provider: "openrouter",
    apiModel: "anthropic/claude-sonnet-4.6",
    tier: "mid",
    label: "Claude Sonnet 4.6",
    maxTokens: 1024,
    family: "claude-sonnet",
    version: "4.6",
    openrouterSlug: "anthropic/claude-sonnet-4.6",
  },
  "gpt-5.4-mini": {
    provider: "openrouter",
    apiModel: "openai/gpt-5.4-mini",
    tier: "mid",
    label: "GPT-5.4 Mini",
    maxTokens: 1024,
    family: "gpt-mini",
    version: "5.4",
    openrouterSlug: "openai/gpt-5.4-mini",
  },
  "gemini-3.5-flash": {
    provider: "openrouter",
    apiModel: "google/gemini-3.5-flash",
    tier: "mid",
    label: "Gemini 3.5 Flash",
    maxTokens: 1024,
    family: "gemini-flash",
    version: "3.5",
    openrouterSlug: "google/gemini-3.5-flash",
  },

  // ── Open Source ─────────────────────────────────────────
  "llama-4-maverick": {
    provider: "openrouter",
    apiModel: "meta-llama/llama-4-maverick",
    tier: "opensource",
    label: "Llama 4 Maverick",
    maxTokens: 1024,
    family: "llama",
    version: "4-maverick",
    openrouterSlug: "meta-llama/llama-4-maverick",
    openrouterProviders: ["DeepInfra"],
  },
  // DeepSeek drift ladder (V3.2 → V4), both pinned to DeepInfra for a fair compare ↓
  "deepseek-v4-pro": {
    provider: "openrouter",
    apiModel: "deepseek/deepseek-v4-pro",
    tier: "opensource",
    label: "DeepSeek V4 Pro",
    maxTokens: 1024,
    family: "deepseek",
    version: "4-pro",
    openrouterSlug: "deepseek/deepseek-v4-pro",
    openrouterProviders: ["DeepInfra"],
  },
  "deepseek-v3.2": {
    provider: "openrouter",
    apiModel: "deepseek/deepseek-v3.2",
    tier: "opensource",
    label: "DeepSeek V3.2",
    maxTokens: 1024,
    family: "deepseek",
    version: "3.2",
    openrouterSlug: "deepseek/deepseek-v3.2",
    openrouterProviders: ["DeepInfra"],
  },
  "mistral-large-2512": {
    provider: "openrouter",
    apiModel: "mistralai/mistral-large-2512",
    tier: "opensource",
    label: "Mistral Large (2512)",
    maxTokens: 1024,
    family: "mistral-large",
    version: "2512",
    openrouterSlug: "mistralai/mistral-large-2512",
    openrouterProviders: ["Mistral"],
  },
  "qwen3.7-max": {
    provider: "openrouter",
    apiModel: "qwen/qwen3.7-max",
    tier: "opensource",
    label: "Qwen3.7 Max",
    maxTokens: 1024,
    family: "qwen",
    version: "3.7-max",
    openrouterSlug: "qwen/qwen3.7-max",
    openrouterProviders: ["Alibaba"],
  },
};

export const TIERS = {
  frontier: { label: "Frontier", color: "#e63946" },
  mid: { label: "Mid-Tier", color: "#457b9d" },
  opensource: { label: "Open Source", color: "#2a9d8f" },
} as const;

export type Tier = keyof typeof TIERS;
