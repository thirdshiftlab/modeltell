/**
 * Modeltell — Mock Run Generator (DEV ONLY)
 *
 * Produces a synthetic run under data/{date}_mock so the analysis
 * and publish steps (and the frontend) have realistic-looking data
 * to work against WITHOUT spending money on real API calls.
 *
 * Each model gets a "personality" dial that scales how many AI
 * patterns appear in its output, so the radar profiles and
 * similarity matrix actually differ between models.
 *
 * Usage:
 *   npx tsx scripts/mock-run.ts
 *   → data/{date}_mock/{model}.json + manifest.json
 *
 * Then run the normal pipeline:
 *   npx tsx src/analysis/lexical.ts data/{date}_mock
 *   npx tsx src/analysis/syntactic.ts data/{date}_mock
 *   npx tsx src/publish/publish.ts data/{date}_mock
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { MODEL_REGISTRY } from "../src/runner/models";
import type { GenerationResult, RunManifest, PromptCatalog } from "../src/runner/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const LOCALE = (process.env.LOCALE || "en").toLowerCase();

// Pattern-rich sentence fragments, tagged by the pattern they exhibit.
const AI_FRAGMENTS_EN = [
  "In today's fast-paced digital landscape, businesses face unprecedented challenges.",
  "Whether you're a seasoned professional or just starting out, our platform adapts to you.",
  "It's worth noting that this approach has transformed entire industries.",
  "This is not just a tool, but a partner in your growth journey.",
  "By leveraging cutting-edge technology, teams unlock new possibilities.",
  "Imagine a world where every decision is backed by data.",
  "One platform — endless possibilities — zero friction.",
  "We drive growth, boost engagement, and accelerate revenue.",
  "Let's dive into what makes this approach so powerful.",
  "Here are three key pillars: speed, accuracy, and trust.",
  "What if there was a better, smarter, more efficient way?",
  "At its core, our mission is to empower teams to innovate.",
  "As we look ahead, the future of analytics is already here.",
  "Our seamless, robust, and holistic solution streamlines your workflow.",
  "Moreover, it fosters a culture of continuous innovation.",
];

// Plain, human-ish fragments with low AI-pattern density.
const PLAIN_FRAGMENTS_EN = [
  "The battery lasts 30 hours on a single charge.",
  "Setup took about ten minutes on a standard laptop.",
  "We reduced average response time from 800ms to 210ms.",
  "The bank cut security incidents by 73% in six weeks.",
  "Support replied within an hour every time we asked.",
  "Pricing starts at $49 per month for up to five seats.",
  "The headphones weigh 250 grams and fold flat for travel.",
  "Our team grew from four people to nine this quarter.",
  "The API returns JSON and handles roughly 2,000 requests per second.",
  "Shipping is free above $40 and takes two to three days.",
  "We tested it on three devices and saw consistent results.",
  "Revenue reached $2.3M ARR, up 15% month over month.",
];

// German pattern-rich fragments (mirror the German definitions).
const AI_FRAGMENTS_DE = [
  "In der heutigen schnelllebigen digitalen Welt stehen Unternehmen vor beispiellosen Herausforderungen.",
  "Egal, ob erfahrener Profi oder Einsteiger — unsere Plattform passt sich Ihnen an.",
  "Es ist wichtig zu betonen, dass dieser Ansatz ganze Branchen transformiert hat.",
  "Das ist nicht nur ein Werkzeug, sondern ein Partner auf Ihrer Wachstumsreise.",
  "Durch den Einsatz modernster Technologie erschließen Teams neue Möglichkeiten.",
  "Stellen Sie sich eine Welt vor, in der jede Entscheidung datenbasiert ist.",
  "Eine Plattform — unendliche Möglichkeiten — null Reibung.",
  "Wir treiben Wachstum voran, beschleunigen Prozesse und maximieren den Mehrwert.",
  "Lassen Sie uns gemeinsam eintauchen, was diesen Ansatz so wirkungsvoll macht.",
  "Folgende Vorteile erwarten Sie: Geschwindigkeit, Präzision und Vertrauen.",
  "Was wäre, wenn es einen besseren, smarteren und effizienteren Weg gäbe?",
  "Im Kern geht es darum, Teams zu befähigen, zu innovieren.",
  "Blicken wir gemeinsam nach vorn — die Zukunft der Analytik ist bereits hier.",
  "Unsere nahtlose, robuste und ganzheitliche Lösung optimiert Ihren Workflow.",
  "Darüber hinaus fördert sie eine Kultur kontinuierlicher Innovation.",
];

const PLAIN_FRAGMENTS_DE = [
  "Der Akku hält 30 Stunden bei einer Ladung.",
  "Die Einrichtung dauerte etwa zehn Minuten auf einem normalen Laptop.",
  "Wir senkten die Antwortzeit von 800 ms auf 210 ms.",
  "Die Bank reduzierte Sicherheitsvorfälle in sechs Wochen um 73 Prozent.",
  "Der Support antwortete jedes Mal innerhalb einer Stunde.",
  "Die Preise beginnen bei 49 Euro pro Monat für bis zu fünf Plätze.",
  "Der Kopfhörer wiegt 250 Gramm und lässt sich flach zusammenklappen.",
  "Unser Team wuchs in diesem Quartal von vier auf neun Personen.",
  "Die API liefert JSON und verarbeitet rund 2.000 Anfragen pro Sekunde.",
  "Der Versand ist ab 40 Euro kostenlos und dauert zwei bis drei Tage.",
  "Wir haben es auf drei Geräten getestet und konsistente Ergebnisse gesehen.",
  "Der Umsatz erreichte 2,3 Mio. Euro ARR, plus 15 Prozent im Monatsvergleich.",
];

const AI_FRAGMENTS = LOCALE === "de" ? AI_FRAGMENTS_DE : AI_FRAGMENTS_EN;
const PLAIN_FRAGMENTS = LOCALE === "de" ? PLAIN_FRAGMENTS_DE : PLAIN_FRAGMENTS_EN;

function buildOutput(aiDensity: number, seed: number): string {
  // aiDensity in [0,1]: fraction of fragments drawn from the AI pool.
  const pick = (arr: string[], i: number) => arr[(seed * 7 + i * 13) % arr.length];
  const lines: string[] = [];
  const count = 5 + (seed % 3); // 5-7 sentences
  for (let i = 0; i < count; i++) {
    const useAi = ((seed * 31 + i * 17) % 100) / 100 < aiDensity;
    lines.push(useAi ? pick(AI_FRAGMENTS, i + seed) : pick(PLAIN_FRAGMENTS, i + seed));
  }
  // Occasionally add markdown structure for the heavier models.
  if (aiDensity > 0.55) {
    lines.unshift(`**${pick(AI_FRAGMENTS, seed)}**`);
    lines.push(
      LOCALE === "de"
        ? "\n- Schnelleres Onboarding\n- Bessere Einblicke\n- Geringere Kosten"
        : "\n- Faster onboarding\n- Better insights\n- Lower costs"
    );
  }
  return lines.join(" ");
}

/** Deterministic per-model density so radar/similarity aren't degenerate. */
function densityFor(modelId: string): number {
  let h = 0;
  for (let i = 0; i < modelId.length; i++) h = (h * 31 + modelId.charCodeAt(i)) >>> 0;
  return 0.4 + (h % 40) / 100; // 0.40–0.79
}

async function main() {
  const catalogFile = LOCALE === "en" ? "catalog.json" : `catalog.${LOCALE}.json`;
  const catalogPath = path.resolve(__dirname, `../prompts/${catalogFile}`);
  const catalog: PromptCatalog = JSON.parse(await fs.readFile(catalogPath, "utf-8"));
  const prompts = catalog.prompts;
  const RUNS_PER_PROMPT = 3;

  const localeTag = LOCALE === "en" ? "" : `_${LOCALE}`;
  const runId = new Date().toISOString().slice(0, 10) + `${localeTag}_mock`;
  const runDir = path.join(DATA_DIR, runId);
  await fs.mkdir(runDir, { recursive: true });

  const modelIds = Object.keys(MODEL_REGISTRY);
  let total = 0;

  for (const modelId of modelIds) {
    const density = densityFor(modelId);
    const results: GenerationResult[] = [];
    let seed = modelId.length * 3;
    for (const prompt of prompts) {
      for (let run = 0; run < RUNS_PER_PROMPT; run++) {
        seed++;
        const output = buildOutput(density, seed);
        results.push({
          modelId,
          promptId: prompt.id,
          runIndex: run,
          timestamp: new Date().toISOString(),
          output,
          tokenCount: output.split(/\s+/).length,
          latencyMs: 100 + (seed % 400),
        });
        total++;
      }
    }
    await fs.writeFile(path.join(runDir, `${modelId}.json`), JSON.stringify(results, null, 2));
  }

  const manifest: RunManifest = {
    runId,
    locale: LOCALE,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    models: modelIds,
    promptCount: prompts.length,
    runsPerPrompt: RUNS_PER_PROMPT,
    totalGenerations: total,
    results: [],
  };
  await fs.writeFile(path.join(runDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(`🧪 Mock run written: ${runDir}`);
  console.log(`   ${modelIds.length} models × ${prompts.length} prompts × ${RUNS_PER_PROMPT} runs = ${total} generations`);
}

main().catch((err) => {
  console.error("Mock run failed:", err);
  process.exit(1);
});
