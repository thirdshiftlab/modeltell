/**
 * Modeltell - Multi-Model Runner
 *
 * Sends each prompt to each model N times, collects outputs,
 * writes results to data/{runId}/.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... OPENAI_API_KEY=... npx tsx src/runner/runner.ts
 *
 * Env vars needed:
 *   ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY,
 *   TOGETHER_API_KEY, MISTRAL_API_KEY
 */

import fs from "fs/promises";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MODEL_REGISTRY } from "./models";
import type {
  Provider,
  ModelConfig,
  Prompt,
  PromptCatalog,
  GenerationResult,
  RunManifest,
} from "./types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Minimal .env loader (zero-dep) ───────────────────────
// Loads KEY=VALUE pairs from a repo-root .env into process.env without
// overwriting anything already set in the real environment.
function loadDotEnv() {
  const envPath = path.resolve(__dirname, "../../.env");
  if (!existsSync(envPath)) return;
  for (const raw of readFileSync(envPath, "utf-8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = val;
  }
}
loadDotEnv();

// ── Config ───────────────────────────────────────────────

// Runs per prompt - override with RUNS_PER_PROMPT=1 for a fast smoke run.
const RUNS_PER_PROMPT = Math.max(1, Number(process.env.RUNS_PER_PROMPT) || 3);
const RATE_LIMIT_MS = Number(process.env.RATE_LIMIT_MS) || 1000; // min delay between calls
const DATA_DIR = path.resolve(__dirname, "../../data");

// Language of the corpus: "en" (default) or "de". Picks the prompt catalog,
// the system prompt, and is recorded in the manifest for downstream steps.
const LOCALE = (process.env.LOCALE || "en").toLowerCase();

// Optional: filter models via env
const ONLY_MODELS = process.env.ONLY_MODELS?.split(",").map((s) => s.trim()).filter(Boolean) ?? null;

// Which env var holds each provider's key.
const PROVIDER_ENV: Record<Provider, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  google: "GOOGLE_API_KEY",
  together: "TOGETHER_API_KEY",
  mistral: "MISTRAL_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
};

const hasKey = (provider: Provider) => !!process.env[PROVIDER_ENV[provider]];

// Route every model through OpenRouter (one key for all providers).
// Enabled explicitly, or implicitly if OPENROUTER_API_KEY is the only key set.
const USE_OPENROUTER =
  /^(1|true|yes)$/i.test(process.env.USE_OPENROUTER ?? "") ||
  (!!process.env.OPENROUTER_API_KEY &&
    !["anthropic", "openai", "google", "together", "mistral"].some((p) =>
      hasKey(p as Provider)
    ));

// ── Provider Adapters ────────────────────────────────────

const SYSTEM_PROMPTS: Record<string, string> = {
  en: "You are a professional copywriter. Follow the instructions precisely. Do not add meta-commentary about the task. Just produce the requested content.",
  de: "Du bist ein:e professionelle:r Werbetexter:in. Befolge die Anweisungen genau. Füge keine Meta-Kommentare zur Aufgabe hinzu. Erstelle einfach den gewünschten Inhalt auf Deutsch.",
};
const SYSTEM_PROMPT = SYSTEM_PROMPTS[LOCALE] ?? SYSTEM_PROMPTS.en;

async function callAnthropic(model: ModelConfig, prompt: string): Promise<{ text: string; tokens: number }> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model.apiModel,
      max_tokens: model.maxTokens,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";
  const tokens = data.usage?.output_tokens ?? text.split(/\s+/).length;
  return { text, tokens };
}

async function callOpenAI(model: ModelConfig, prompt: string): Promise<{ text: string; tokens: number }> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
    },
    body: JSON.stringify({
      model: model.apiModel,
      max_tokens: model.maxTokens,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  const tokens = data.usage?.completion_tokens ?? text.split(/\s+/).length;
  return { text, tokens };
}

async function callGoogle(model: ModelConfig, prompt: string): Promise<{ text: string; tokens: number }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model.apiModel}:generateContent?key=${process.env.GOOGLE_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: model.maxTokens },
    }),
  });
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const tokens = data.usageMetadata?.candidatesTokenCount ?? text.split(/\s+/).length;
  return { text, tokens };
}

async function callTogether(model: ModelConfig, prompt: string): Promise<{ text: string; tokens: number }> {
  const res = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TOGETHER_API_KEY!}`,
    },
    body: JSON.stringify({
      model: model.apiModel,
      max_tokens: model.maxTokens,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  const tokens = data.usage?.completion_tokens ?? text.split(/\s+/).length;
  return { text, tokens };
}

async function callMistral(model: ModelConfig, prompt: string): Promise<{ text: string; tokens: number }> {
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY!}`,
    },
    body: JSON.stringify({
      model: model.apiModel,
      max_tokens: model.maxTokens,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  const tokens = data.usage?.completion_tokens ?? text.split(/\s+/).length;
  return { text, tokens };
}

// OpenAI-compatible gateway to every provider. Used when USE_OPENROUTER=1.
async function callOpenRouter(model: ModelConfig, prompt: string): Promise<{ text: string; tokens: number; servedBy?: string }> {
  const slug = model.openrouterSlug;
  if (!slug) throw new Error(`No openrouterSlug for "${model.label}" - add one to models.ts`);

  const body: Record<string, unknown> = {
    model: slug,
    max_tokens: model.maxTokens,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  };
  // Prefer the pinned backend for reproducibility, but allow fallback so a
  // single flaky provider doesn't drop the model. servedBy records the truth.
  if (model.openrouterProviders?.length) {
    body.provider = { order: model.openrouterProviders, allow_fallbacks: true };
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY!}`,
      "X-Title": "Modeltell",
      "HTTP-Referer": "https://github.com/thirdshiftlab/modeltell",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error?.message ?? JSON.stringify(data.error));
  const text = data.choices?.[0]?.message?.content ?? "";
  const tokens = data.usage?.completion_tokens ?? text.split(/\s+/).length;
  return { text, tokens, servedBy: data.provider };
}

const PROVIDER_CALLERS: Record<Provider, (m: ModelConfig, p: string) => Promise<{ text: string; tokens: number; servedBy?: string }>> = {
  anthropic: callAnthropic,
  openai: callOpenAI,
  google: callGoogle,
  together: callTogether,
  mistral: callMistral,
  openrouter: callOpenRouter,
};

// ── Runner Logic ─────────────────────────────────────────

async function generate(modelId: string, model: ModelConfig, prompt: Prompt, runIndex: number): Promise<GenerationResult> {
  const caller = USE_OPENROUTER ? callOpenRouter : PROVIDER_CALLERS[model.provider];
  const start = Date.now();
  const { text, tokens, servedBy } = await caller(model, prompt.prompt);
  const latencyMs = Date.now() - start;

  return {
    modelId,
    promptId: prompt.id,
    runIndex,
    timestamp: new Date().toISOString(),
    output: text,
    tokenCount: tokens,
    latencyMs,
    ...(servedBy ? { servedBy } : {}),
  };
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runAll() {
  // Load prompts for the active locale (catalog.json / catalog.de.json / …).
  const catalogFile = LOCALE === "en" ? "catalog.json" : `catalog.${LOCALE}.json`;
  const catalogPath = path.resolve(__dirname, `../../prompts/${catalogFile}`);
  const catalog: PromptCatalog = JSON.parse(await fs.readFile(catalogPath, "utf-8"));
  const prompts = catalog.prompts;

  // Filter models: honor ONLY_MODELS, then skip any we can't actually call.
  // - OpenRouter mode: need OPENROUTER_API_KEY + an openrouterSlug per model.
  // - Direct mode: need the model's own provider key.
  const requested = Object.entries(MODEL_REGISTRY).filter(
    ([id]) => !ONLY_MODELS || ONLY_MODELS.includes(id)
  );
  const runnable = ([, m]: [string, ModelConfig]) =>
    USE_OPENROUTER ? hasKey("openrouter") && !!m.openrouterSlug : hasKey(m.provider);
  const skipped = requested.filter((e) => !runnable(e));
  const modelEntries = requested.filter(runnable);

  if (skipped.length > 0) {
    const missing = USE_OPENROUTER
      ? skipped.map(([, m]) => (m.openrouterSlug ? "OPENROUTER_API_KEY" : `${m.label}: no openrouterSlug`))
      : skipped.map(([, m]) => PROVIDER_ENV[m.provider]);
    console.log(`\n⏭️  Skipping ${skipped.length} model(s): ${[...new Set(missing)].join(", ")}`);
  }
  if (modelEntries.length === 0) {
    console.error(
      USE_OPENROUTER
        ? "\n✗ No runnable models. Set OPENROUTER_API_KEY in .env (see .env.example)."
        : "\n✗ No runnable models. Add at least one provider key to .env (see .env.example)."
    );
    process.exit(1);
  }

  const localeTag = LOCALE === "en" ? "" : `_${LOCALE}`;
  const runId = process.env.RUN_ID || new Date().toISOString().slice(0, 10) + `${localeTag}_v1`;
  const runDir = path.join(DATA_DIR, runId);
  await fs.mkdir(runDir, { recursive: true });

  console.log(`\n🔬 Modeltell Run: ${runId}`);
  console.log(`   Locale: ${LOCALE}`);
  console.log(`   Mode: ${USE_OPENROUTER ? "OpenRouter (single key)" : "Direct provider APIs"}`);
  console.log(`   Models: ${modelEntries.length}`);
  console.log(`   Prompts: ${prompts.length}`);
  console.log(`   Runs/prompt: ${RUNS_PER_PROMPT}`);
  console.log(`   Total generations: ${modelEntries.length * prompts.length * RUNS_PER_PROMPT}\n`);

  const allResults: GenerationResult[] = [];
  let completed = 0;
  const total = modelEntries.length * prompts.length * RUNS_PER_PROMPT;

  for (const [modelId, model] of modelEntries) {
    console.log(`\n── ${model.label} (${model.tier}) ──`);
    const modelResults: GenerationResult[] = [];

    for (const prompt of prompts) {
      for (let run = 0; run < RUNS_PER_PROMPT; run++) {
        try {
          const result = await generate(modelId, model, prompt, run);
          modelResults.push(result);
          allResults.push(result);
          completed++;

          const pct = ((completed / total) * 100).toFixed(1);
          process.stdout.write(`\r   [${pct}%] ${prompt.id} run ${run + 1}/${RUNS_PER_PROMPT} - ${result.tokenCount} tokens, ${result.latencyMs}ms`);
        } catch (err: any) {
          console.error(`\n   ✗ ${prompt.id} run ${run}: ${err.message}`);
          completed++;
        }

        await sleep(RATE_LIMIT_MS);
      }
    }

    // Write per-model results
    const modelFile = path.join(runDir, `${modelId}.json`);
    await fs.writeFile(modelFile, JSON.stringify(modelResults, null, 2));
    console.log(`\n   → Saved ${modelResults.length} results to ${modelFile}`);
  }

  // Write manifest
  const manifest: RunManifest = {
    runId,
    locale: LOCALE,
    startedAt: allResults[0]?.timestamp ?? new Date().toISOString(),
    completedAt: new Date().toISOString(),
    models: modelEntries.map(([id]) => id),
    promptCount: prompts.length,
    runsPerPrompt: RUNS_PER_PROMPT,
    totalGenerations: allResults.length,
    results: [], // results are in per-model files
  };
  await fs.writeFile(path.join(runDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(`\n✅ Run complete. ${allResults.length} generations saved to ${runDir}/\n`);
}

// ── Entry Point ──────────────────────────────────────────

runAll().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
