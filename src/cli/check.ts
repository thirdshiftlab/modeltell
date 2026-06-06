#!/usr/bin/env node

/**
 * Modeltell - CLI Linter (bilingual: EN + DE)
 *
 * Checks text for AI-patterned language. Self-contained - embeds its own
 * patterns/words per language, no external files, so it works standalone.
 *
 * Usage:
 *   npx modeltell check "Your marketing copy here"
 *   npx modeltell check --locale de "In der heutigen schnelllebigen Welt …"
 *   echo "Some text" | npx modeltell check -
 *   npx modeltell check --file landing-page.md --json
 *
 * Language is auto-detected from the text; override with --locale en|de.
 */

import fs from "fs/promises";

type Severity = "critical" | "high" | "medium" | "low";

interface Pattern {
  id: string;
  label: string;
  regex: RegExp;
  severity: Severity;
  tip: string;
}

// ── English patterns ─────────────────────────────────────
const PATTERNS_EN: Pattern[] = [
  { id: "tricolon", label: "Tricolon (Rule of Three)", regex: /\b(\w+),\s+(\w+),\s+and\s+(\w+)\b/gi, severity: "high", tip: "Break the three-part pattern. Use two items, four items, or restructure entirely." },
  { id: "whether_opener", label: "Whether-You're Opener", regex: /whether\s+you(?:'re|\s+are)\s+.{5,60}\s+or\s+/gi, severity: "critical", tip: "Pick your actual audience and address them directly instead of hedging." },
  { id: "hedge_opening", label: "Hedging Opener", regex: /it(?:'s|\s+is)\s+(worth|important|no secret|safe|fair)\s+(?:to\s+)?(not(?:ing|e)|remember|say|mention)/gi, severity: "high", tip: "Delete the hedge. State the point directly." },
  { id: "not_just_but", label: "Not-Just-But Escalation", regex: /not\s+just\s+.{3,50}(?:,\s*but|\u2014\s*(?:it(?:'s)?\s+)?)/gi, severity: "high", tip: "Pick the stronger claim and lead with it. The 'not just X' frame weakens both sides." },
  { id: "landscape_world", label: "In-Today's-Landscape", regex: /in\s+(?:today(?:'s)?|an?|the\s+current)\s+(?:\w+\s+){0,2}(?:landscape|world|era|environment|age|marketplace|ecosystem)/gi, severity: "critical", tip: "Delete entirely. Start with something specific to your actual context." },
  { id: "by_gerund", label: "By-Gerund Instruction", regex: /(?:^|[.!?]\s+)by\s+\w+ing\b/gi, severity: "medium", tip: "Vary your sentence openers. Too many 'By [doing X]' reads robotic." },
  { id: "imagine_opener", label: "Imagine-This Opening", regex: /(?:^|[.!?]\s+)(?:imagine|picture\s+this)\s+/gi, severity: "medium", tip: "Show, don't imagine. Use a concrete example or story instead." },
  { id: "em_dash_pivot", label: "Em-Dash Dramatic Pivot", regex: /\w+\s+[\u2014\u2013]\s+\w+/g, severity: "low", tip: "One em-dash per paragraph max. Overuse kills the dramatic effect." },
  { id: "power_verb_stacking", label: "Power Verb Stacking", regex: /\b(?:drive|boost|accelerate|streamline|optimize|transform|empower|unlock|elevate|supercharge|revolutionize|harness|amplify)\b/gi, severity: "high", tip: "Replace with specific, concrete verbs. 'Reduced load time by 40%' beats 'supercharged performance'." },
  { id: "lets_dive", label: "Let's-Dive Transition", regex: /let(?:'s|\s+us)\s+(?:dive|explore|take\s+a\s+(?:closer\s+)?look|break\s+(?:it|this)\s+down|unpack)/gi, severity: "medium", tip: "Just start the next section. The reader doesn't need a verbal cue." },
  { id: "future_forward", label: "Future-Forward Closing", regex: /(?:the\s+future\s+(?:of|is)|as\s+we\s+(?:move|look|continue|step)\s+(?:forward|ahead)|looking\s+ahead|poised\s+(?:to|for))/gi, severity: "high", tip: "End with something concrete: a specific next step, a number, or a direct CTA." },
  { id: "at_its_core", label: "At-Its-Core Pretension", regex: /(?:at\s+(?:its|the|our)\s+(?:core|heart|foundation)|fundamentally|when\s+you\s+strip\s+(?:it|everything))/gi, severity: "medium", tip: "If you need to announce depth, you're not being deep. Just make the point." },
];

// ── German patterns (native, not translated) ─────────────
const PATTERNS_DE: Pattern[] = [
  { id: "tricolon", label: "Trikolon (Dreierregel)", regex: /\b([A-Za-zÄÖÜäöüß]+),\s+([A-Za-zÄÖÜäöüß]+)\s+und\s+([A-Za-zÄÖÜäöüß]+)\b/gi, severity: "high", tip: "Brich das Dreier-Muster. Nimm zwei, vier Elemente oder formuliere ganz um." },
  { id: "whether_opener", label: "„Egal-ob“-Pseudo-Inklusivität", regex: /\b(?:egal,?\s+)?ob\s+\S[^.?!]{2,45}?\s+oder\s+\S/gi, severity: "critical", tip: "Wähl dein echtes Publikum und sprich es direkt an, statt dich abzusichern." },
  { id: "hedge_opening", label: "Absichernde Eröffnung", regex: /\bes\s+(?:ist\s+(?:wichtig|entscheidend|hervorzuheben|erwähnenswert)|sei\s+(?:erwähnt|angemerkt|betont|darauf\s+hingewiesen)|gilt\s+(?:festzuhalten|zu\s+beachten))\b/gi, severity: "high", tip: "Streich die Absicherung. Sag den Punkt direkt." },
  { id: "not_just_but", label: "„Nicht-nur-sondern“-Steigerung", regex: /\bnicht\s+nur\s+[^.?!]{2,60}?,?\s+sondern\s+(?:auch\s+)?/gi, severity: "high", tip: "Wähl die stärkere Aussage und führe damit. Das „nicht nur X“-Muster schwächt beide Seiten." },
  { id: "landscape_world", label: "„In-der-heutigen-Welt“", regex: /\bin\s+(?:der\s+heutigen|unserer\s+heutigen)\s+(?:[A-Za-zÄÖÜäöüß]+\s+){0,2}(?:welt|zeit|ära|landschaft|geschäftswelt|wirtschaft|gesellschaft)|in\s+einer\s+welt,\s+in\s+der/gi, severity: "critical", tip: "Komplett streichen. Beginne mit etwas Konkretem aus deinem echten Kontext." },
  { id: "by_gerund", label: "„Durch/Indem“-Eröffnung", regex: /(?:^|[.!?]\s+)(?:Durch|Indem)\s+\S/gi, severity: "medium", tip: "Variiere deine Satzanfänge. Zu viele „Durch …“/„Indem …“ wirken robotisch." },
  { id: "imagine_opener", label: "„Stellen-Sie-sich-vor“-Eröffnung", regex: /(?:^|[.!?]\s+)stell(?:en\s+sie\s+sich|\s+dir)\s+(?:einmal\s+|mal\s+)?(?:[^.?!]{2,40}?\s+)?vor/gi, severity: "medium", tip: "Zeigen statt „Stellen Sie sich vor“. Nimm ein konkretes Beispiel oder eine Geschichte." },
  { id: "em_dash_pivot", label: "Gedankenstrich-Dramatik", regex: /[A-Za-zÄÖÜäöüß]+\s+[\u2014\u2013]\s+[A-Za-zÄÖÜäöüß]+/g, severity: "low", tip: "Höchstens ein Gedankenstrich pro Absatz. Übermaß killt den Effekt." },
  { id: "power_verb_stacking", label: "Power-Verben-Stapelung", regex: /\b(?:optimier|maximier|transformier|revolutionier|ermöglich|vorantreib|beschleunig|skalier|steiger|freisetz|gestalt|effizienzsteiger|katapultier|befähig|stärk)[a-zäöüß]*/gi, severity: "high", tip: "Durch konkrete Verben ersetzen. „Ladezeit um 40 % reduziert“ schlägt „Performance supercharged“." },
  { id: "lets_dive", label: "„Lassen-Sie-uns“-Überleitung", regex: /\blass(?:en\s+sie\s+uns|t\s+uns)\s+(?:gemeinsam\s+)?(?:einen\s+(?:genaueren\s+)?blick|eintauchen|erkunden|näher\s+betrachten|aufschlüsseln|werfen)/gi, severity: "medium", tip: "Beginn einfach den nächsten Abschnitt. Der Leser braucht kein verbales Signal." },
  { id: "future_forward", label: "Zukunftsgewandter Schluss", regex: /\b(?:die\s+zukunft\s+(?:ist|von|gehört|beginnt)|blicken\s+wir\s+(?:gemeinsam\s+)?nach\s+vorn|gemeinsam\s+in\s+die\s+zukunft|zukunftssicher|zukunftsweisend|wegweisend)\b/gi, severity: "high", tip: "Schließe mit etwas Konkretem: ein nächster Schritt, eine Zahl, ein direkter CTA." },
  { id: "at_its_core", label: "„Im-Kern“-Anmaßung", regex: /\b(?:im\s+kern|im\s+grunde(?:\s+genommen)?|im\s+wesentlichen|letztlich\s+geht\s+es|im\s+herzen|im\s+endeffekt)\b/gi, severity: "medium", tip: "Wer Tiefe ankündigen muss, ist nicht tief. Sag einfach den Punkt." },
];

const WORDS_EN = new Set([
  "seamless", "seamlessly", "leverage", "leveraging", "robust", "cutting-edge",
  "state-of-the-art", "game-changer", "game-changing", "groundbreaking",
  "revolutionary", "revolutionize", "transformative", "innovative", "innovation",
  "disruptive", "empower", "empowering", "unlock", "unlocking", "elevate",
  "supercharge", "turbocharge", "streamline", "optimize", "maximize", "harness",
  "harnessing", "spearhead", "foster", "fostering", "cultivate", "navigate",
  "navigating", "delve", "delving", "synergy", "synergies", "holistic",
  "comprehensive", "unparalleled", "unprecedented", "tapestry", "landscape",
  "paradigm", "ecosystem", "journey",
]);

const WORDS_DE = new Set([
  "nahtlos", "ganzheitlich", "holistisch", "innovativ", "innovation",
  "zukunftsweisend", "zukunftssicher", "wegweisend", "bahnbrechend",
  "revolutionär", "transformativ", "leistungsstark", "hochmodern", "modernst",
  "robust", "skalierbar", "maßgeschneidert", "passgenau", "mehrwert", "synergie",
  "synergien", "optimieren", "maximieren", "ermöglichen", "vorantreiben",
  "beschleunigen", "freisetzen", "befähigen", "branchenführend", "erstklassig",
  "herausragend", "beispiellos", "einzigartig", "intuitiv", "nachhaltig",
  "kundenzentriert", "wertschöpfend", "spielend",
]);

interface Ui {
  title: string;
  score: string;
  words: string;
  findings: string;
  sevLong: Record<Severity, string>;
  sevTag: Record<Severity, string>;
  none: string;
  findingsHead: string;
  matchLabel: string;
  tipLabel: string;
  overusedHead: string;
  overusedLabel: string;
  overusedTip: (w: string) => string;
  noText: string;
  unknownCmd: (c: string) => string;
  help: string;
}

const UI_EN: Ui = {
  title: "Modeltell - Content Lint",
  score: "Score", words: "Words", findings: "Findings",
  sevLong: { critical: "critical", high: "high", medium: "medium", low: "low" },
  sevTag: { critical: "CRITICAL", high: "HIGH", medium: "MEDIUM", low: "LOW" },
  none: "✓ No AI patterns detected. Nice.",
  findingsHead: "── Findings ──",
  matchLabel: "Match", tipLabel: "Tip",
  overusedHead: "── Overused Words ──",
  overusedLabel: "Overused AI Word",
  overusedTip: (w) => `Find a more specific alternative to "${w}".`,
  noText: "No text provided. Pass text as argument, --file, or pipe via stdin.",
  unknownCmd: (c) => `Unknown command: ${c}. Use "check".`,
  help: `
Modeltell - AI Content Pattern Linter

Usage:
  npx modeltell check "Your text here"
  npx modeltell check --locale de "Dein Text hier"
  npx modeltell check --file input.md
  echo "Some text" | npx modeltell check -

Options:
  --locale <en|de>  Force a language (default: auto-detect)
  --file <path>     Read text from a file
  --json            Output results as JSON
  -                 Read from stdin
  --help            Show this help
`,
};

const UI_DE: Ui = {
  title: "Modeltell - Content-Lint",
  score: "Score", words: "Wörter", findings: "Befunde",
  sevLong: { critical: "kritisch", high: "hoch", medium: "mittel", low: "niedrig" },
  sevTag: { critical: "KRITISCH", high: "HOCH", medium: "MITTEL", low: "NIEDRIG" },
  none: "✓ Keine KI-Muster gefunden. Stark.",
  findingsHead: "── Befunde ──",
  matchLabel: "Treffer", tipLabel: "Tipp",
  overusedHead: "── Übernutzte Wörter ──",
  overusedLabel: "Übernutztes KI-Wort",
  overusedTip: (w) => `Finde eine konkretere Alternative zu „${w}“.`,
  noText: "Kein Text übergeben. Text als Argument, --file oder via stdin angeben.",
  unknownCmd: (c) => `Unbekannter Befehl: ${c}. Nutze „check“.`,
  help: `
Modeltell - KI-Muster-Linter

Verwendung:
  npx modeltell check "Dein Text hier"
  npx modeltell check --locale de "In der heutigen schnelllebigen Welt …"
  npx modeltell check --file input.md
  echo "Text" | npx modeltell check -

Optionen:
  --locale <en|de>  Sprache erzwingen (Standard: automatisch erkannt)
  --file <pfad>     Text aus Datei lesen
  --json            Ergebnis als JSON ausgeben
  -                 Von stdin lesen
  --help            Diese Hilfe anzeigen
`,
};

type Lang = "en" | "de";
interface Pack { patterns: Pattern[]; words: Set<string>; letters: string; ui: Ui }
const PACKS: Record<Lang, Pack> = {
  en: { patterns: PATTERNS_EN, words: WORDS_EN, letters: "a-z", ui: UI_EN },
  de: { patterns: PATTERNS_DE, words: WORDS_DE, letters: "a-zäöüß", ui: UI_DE },
};

/** Cheap language detector: weigh common function words of each language. */
function detectLang(text: string): Lang {
  const t = ` ${text.toLowerCase()} `;
  const de = (/[äöüß]/.test(text) ? 2 : 0) +
    (t.match(/\b(?:der|die|das|und|ist|sie|wir|nicht|für|mit|auch|sich|werden|oder|ein|eine|sind)\b/g) || []).length;
  const en = (t.match(/\b(?:the|and|is|are|you|we|not|for|with|of|to|a|an|this|that|our)\b/g) || []).length;
  return de > en ? "de" : "en";
}

// ── Analysis Engine ──────────────────────────────────────

interface Finding {
  pattern: string;
  label: string;
  severity: Severity;
  match: string;
  position: number;
  tip: string;
}

interface LintResult {
  locale: Lang;
  score: number;
  grade: string;
  word_count: number;
  findings: Finding[];
  overused_words: Array<{ word: string; count: number }>;
  summary: { critical: number; high: number; medium: number; low: number; total: number };
}

function lint(text: string, pack: Pack, locale: Lang): LintResult {
  const findings: Finding[] = [];

  for (const pattern of pack.patterns) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      findings.push({
        pattern: pattern.id,
        label: pattern.label,
        severity: pattern.severity,
        match: match[0].slice(0, 80),
        position: match.index,
        tip: pattern.tip,
      });
    }
  }

  // Overused word detection (locale-aware cleaning so umlauts survive).
  const cleanRe = new RegExp(`[^${pack.letters}-]`, "g");
  const words = text.toLowerCase().split(/\s+/);
  const wordCount = words.length;
  const overusedCounts: Record<string, number> = {};
  for (const word of words) {
    const clean = word.replace(cleanRe, "");
    if (pack.words.has(clean)) overusedCounts[clean] = (overusedCounts[clean] || 0) + 1;
  }

  const overusedWords = Object.entries(overusedCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([word, count]) => ({ word, count }));

  for (const { word, count } of overusedWords) {
    findings.push({
      pattern: "overused_word",
      label: pack.ui.overusedLabel,
      severity: count >= 3 ? "high" : "medium",
      match: `"${word}" (${count}x)`,
      position: text.toLowerCase().indexOf(word),
      tip: pack.ui.overusedTip(word),
    });
  }

  const summary = {
    critical: findings.filter((f) => f.severity === "critical").length,
    high: findings.filter((f) => f.severity === "high").length,
    medium: findings.filter((f) => f.severity === "medium").length,
    low: findings.filter((f) => f.severity === "low").length,
    total: findings.length,
  };

  const rawPenalty = summary.critical * 10 + summary.high * 5 + summary.medium * 2 + summary.low * 1;
  const scaledPenalty = (rawPenalty / Math.max(wordCount / 100, 1)) * 10;
  const score = Math.max(0, Math.min(100, 100 - scaledPenalty));
  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 65 ? "C" : score >= 50 ? "D" : "F";

  return {
    locale,
    score: Math.round(score),
    grade,
    word_count: wordCount,
    findings: findings.sort((a, b) => {
      const sev = { critical: 0, high: 1, medium: 2, low: 3 };
      return sev[a.severity] - sev[b.severity];
    }),
    overused_words: overusedWords,
    summary,
  };
}

// ── CLI Output ───────────────────────────────────────────

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: "\x1b[31m", high: "\x1b[33m", medium: "\x1b[36m", low: "\x1b[90m",
};
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

function printResult(result: LintResult, ui: Ui) {
  const gradeColors: Record<string, string> = { A: "\x1b[32m", B: "\x1b[32m", C: "\x1b[33m", D: "\x1b[33m", F: "\x1b[31m" };
  const s = result.summary;

  console.log(`\n${BOLD}${ui.title}${RESET}\n`);
  console.log(`   ${ui.score}: ${gradeColors[result.grade]}${BOLD}${result.score}/100 (${result.grade})${RESET}`);
  console.log(`   ${ui.words}: ${result.word_count}`);
  console.log(`   ${ui.findings}: ${s.total} (${s.critical} ${ui.sevLong.critical}, ${s.high} ${ui.sevLong.high}, ${s.medium} ${ui.sevLong.medium}, ${s.low} ${ui.sevLong.low})`);

  if (result.findings.length === 0) {
    console.log(`\n   ${BOLD}${ui.none}${RESET}\n`);
    return;
  }

  console.log(`\n${BOLD}${ui.findingsHead}${RESET}\n`);
  for (const f of result.findings) {
    const color = SEVERITY_COLORS[f.severity];
    console.log(`   ${color}${ui.sevTag[f.severity].padEnd(9)}${RESET} ${BOLD}${f.label}${RESET}`);
    console.log(`            ${ui.matchLabel}: "${f.match}"`);
    console.log(`            ${ui.tipLabel}: ${f.tip}`);
    console.log();
  }

  if (result.overused_words.length > 0) {
    console.log(`${BOLD}${ui.overusedHead}${RESET}\n`);
    for (const w of result.overused_words) console.log(`   ${w.word.padEnd(20)} ${w.count}x`);
    console.log();
  }
}

// ── CLI Entry Point ──────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // --locale / --lang
  let forced: Lang | undefined;
  const locIdx = args.findIndex((a) => a === "--locale" || a === "--lang");
  if (locIdx >= 0) {
    const v = (args[locIdx + 1] || "").toLowerCase();
    if (v === "de" || v === "en") forced = v;
  }
  const localeArg = locIdx >= 0 ? args[locIdx + 1] : undefined;

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log((forced ? PACKS[forced] : PACKS.en).ui.help);
    process.exit(0);
  }

  const command = args[0];
  if (command !== "check") {
    console.error((forced ? PACKS[forced] : PACKS.en).ui.unknownCmd(command));
    process.exit(1);
  }

  const jsonOutput = args.includes("--json");
  const modelIdx = args.indexOf("--model");
  const fileIdx = args.indexOf("--file");

  let text: string;
  if (fileIdx >= 0 && args[fileIdx + 1]) {
    text = await fs.readFile(args[fileIdx + 1], "utf-8");
  } else if (args[1] === "-") {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
    text = Buffer.concat(chunks).toString("utf-8");
  } else {
    const skip = new Set([args[modelIdx + 1], args[fileIdx + 1], localeArg].filter(Boolean) as string[]);
    text = args
      .slice(1)
      .filter((a) => !a.startsWith("--") && !skip.has(a))
      .join(" ");
  }

  const locale: Lang = forced ?? detectLang(text);
  const pack = PACKS[locale];

  if (!text.trim()) {
    console.error(pack.ui.noText);
    process.exit(1);
  }

  const result = lint(text, pack, locale);
  if (jsonOutput) console.log(JSON.stringify(result, null, 2));
  else printResult(result, pack.ui);

  // Exit code: 0 if B or above, 1 if C or below - CI-friendly.
  process.exit(result.score >= 80 ? 0 : 1);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
