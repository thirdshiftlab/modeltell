import type { ReactNode } from "react";

export type Lang = "en" | "de";

export interface HookVars {
  prompts: string;
  models: number;
  runs: number;
  words: string;
  patterns: number;
}

type PatternMeta = { label: string; description: string; tip: string };

export interface Strings {
  nav: { methodology: string; backToStory: string };
  common: { loading: string; noDataTitle: string; noDataLede: string; modelsLabel: string };
  newsletter: {
    eyebrow: string;
    title: string;
    body: string;
    placeholder: string;
    cta: string;
    sending: string;
    success: string;
    privacy: string;
    dismiss: string;
  };
  hook: {
    eyebrow: string;
    titleFaint: string;
    titleStrong: string;
    parts: Array<{ t: string; pattern?: string }>;
    lede: (v: HookVars) => ReactNode;
    scroll: string;
  };
  words: { eyebrow: string; title: string; lede: string; noModels: string };
  fingerprints: { eyebrow: string; title: string; lede: string; noModels: string; legendTitle: string };
  headToHead: {
    eyebrow: string;
    title: string;
    lede: string;
    vs: string;
    similarity: string;
    similarityNote: string;
    divergences: string;
  };
  drift: {
    eyebrow: string;
    title: string;
    lede: string;
    biggestShifts: string;
    legend: (newest: string) => string;
  };
  patterns: {
    eyebrow: string;
    title: string;
    lede: string;
    perThousand: string;
    theFix: string;
    note: (runs: number, prompts: number) => string;
    sigTitle: (dir: "above" | "below") => string;
    fallbackTip: string;
  };
  tierAnalysis: { eyebrow: string; title: string; lede: string; models: string; note: string };
  similarity: {
    eyebrow: string;
    title: string;
    ledeSimilarity: string;
    ledeDelta: string;
    radarSimilarity: string;
    burrowsDelta: string;
    mostAlike: string;
    mostDifferent: string;
    selectedPair: string;
    deltaFootnote: (mfw: number) => string;
    similar: string;
  };
  watchlist: {
    eyebrow: string;
    title: string;
    lede: string;
    openSource: string;
    starGithub: string;
    runLinter: string;
    linterNote: string;
    beforeCite: string;
    beforeCiteBody: string;
    readMethodology: string;
    footer: (v: { runId: string; date: string; models: number; patterns: number }) => ReactNode;
  };
  methodology: {
    eyebrow: (v: { schema: string; runId: string }) => string;
    title: ReactNode;
    intro: ReactNode;
    importantLabel: string;
    important: ReactNode;
    premiseH: string;
    premise: ReactNode;
    corpusH: string;
    corpus: (v: { prompts: string; models: number; runs: number; gens: string; words: string }) => ReactNode;
    featureH: string;
    lexicalLabel: string;
    lexical: ReactNode;
    syntacticLabel: string;
    syntactic: (patterns: number) => ReactNode;
    accuracyH: string;
    accuracyIntro: (sampled: number, pct: number) => ReactNode;
    accuracyTakeaways: (firstCaveat: string) => ReactNode;
    numbersH: string;
    radarNorm: ReactNode;
    similarityMetric: ReactNode;
    versionDrift: ReactNode;
    reproH: string;
    repro: ReactNode;
    limitsH: string;
    limitsIntro: string;
    limits: Array<{ h: string; b: string }>;
    roadmapH: string;
    roadmap: ReactNode;
    refsH: string;
  };
  filter: { title: string; reset: string };
  severity: Record<"critical" | "high" | "medium" | "low", string>;
  tierLabels: Record<"frontier" | "mid" | "opensource", string>;
  categories: Record<"power_word" | "hedge" | "connector" | "filler" | "other", string>;
  radar: Record<string, string>;
  radarHelp: Record<string, string>;
  patternMeta: Record<string, PatternMeta>;
}

// ── Shared data-derived strings (English source) ─────────
const RADAR_EN: Record<string, string> = {
  tricolon_density: "Tricolon",
  hedge_density: "Hedging",
  power_verb_density: "Power Verbs",
  pseudo_inclusivity: "Pseudo-Incl.",
  escalation_patterns: "Escalation",
  future_filler: "Future",
  em_dash_frequency: "Em-Dash",
  formatting_density: "Formatting",
};
const RADAR_DE: Record<string, string> = {
  tricolon_density: "Trikolon",
  hedge_density: "Absicherung",
  power_verb_density: "Power-Verben",
  pseudo_inclusivity: "Pseudo-Inklusiv.",
  escalation_patterns: "Eskalation",
  future_filler: "Zukunft",
  em_dash_frequency: "Gedankenstrich",
  formatting_density: "Formatierung",
};
const RADAR_HELP_EN: Record<string, string> = {
  tricolon_density: "Three-part lists like faster, smarter, stronger.",
  hedge_density: "Softening phrases and pseudo-depth openers.",
  power_verb_density: "Action verbs such as optimize, unlock, transform.",
  pseudo_inclusivity: "Whether-you're and imagine-this audience hooks.",
  escalation_patterns: "Not-just-but frames and dramatic dash pivots.",
  future_filler: "Landscape/world openers and vague future-facing closes.",
  em_dash_frequency: "How often long-dash pivots appear per 1,000 words.",
  formatting_density: "Bullets, headings, and bold formatting density.",
};
const RADAR_HELP_DE: Record<string, string> = {
  tricolon_density: "Dreiteilige Listen wie schneller, smarter, effizienter.",
  hedge_density: "Absicherungen und pseudo-tiefe Eröffnungen.",
  power_verb_density: "Aktionsverben wie optimieren, skalieren, transformieren.",
  pseudo_inclusivity: "Egal-ob- und Stellen-Sie-sich-vor-Hooks.",
  escalation_patterns: "Nicht-nur-sondern-Muster und dramatische Gedankenstriche.",
  future_filler: "Heutige-Welt-Eröffnungen und vage Zukunftsschlüsse.",
  em_dash_frequency: "Wie oft Gedankenstrich-Pivots pro 1.000 Wörter vorkommen.",
  formatting_density: "Dichte von Listenpunkten, Überschriften und Fettdruck.",
};

const PATTERNS_EN: Record<string, PatternMeta> = {
  tricolon: { label: "Tricolon (Rule of Three)", description: "Three-part lists, especially with ascending complexity or dramatic escalation.", tip: "Break the three-part pattern. Use two items, four items, or restructure entirely." },
  whether_opener: { label: "Whether-You're Pseudo-Inclusivity", description: "Opening with “Whether you're X or Y” to fake audience inclusivity.", tip: "Pick your actual audience and address them directly instead of hedging." },
  hedge_opening: { label: "Hedging Opener", description: "Softening phrases that add no information.", tip: "Delete the hedge. State the point directly." },
  not_just_but: { label: "Not-Just-But Escalation", description: "Pseudo-dramatic contrast construction.", tip: "Pick the stronger claim and lead with it. The ‘not just X’ frame weakens both sides." },
  by_gerund: { label: "By-Gerund Instruction", description: "Starting sentences with “By [verb]ing” as a pseudo-authoritative move.", tip: "Vary your sentence openers. Too many ‘By [doing X]’ reads robotic." },
  landscape_world: { label: "In-Today's-Landscape", description: "Opening with “In today's [adjective] landscape/world/era”.", tip: "Delete entirely. Start with something specific to your actual context." },
  imagine_opener: { label: "Imagine-This Opening", description: "Opening with “Imagine” to create forced engagement.", tip: "Show, don't imagine. Use a concrete example or story instead." },
  em_dash_pivot: { label: "Em-Dash Dramatic Pivot", description: "Using an em-dash for dramatic effect mid-sentence.", tip: "One em-dash per paragraph max. Overuse kills the dramatic effect." },
  power_verb_stacking: { label: "Power Verb Stacking", description: "Clustering action verbs for artificial energy.", tip: "Replace with concrete verbs. ‘Reduced load time by 40%’ beats ‘supercharged performance’." },
  lets_dive: { label: "Let's-Dive Transition", description: "Conversational transitions that signal section breaks.", tip: "Just start the next section. The reader doesn't need a verbal cue." },
  colon_list_intro: { label: "Colon-Introduced List", description: "Setting up bullet points with a colon clause.", tip: "Vary how you introduce lists; the colon-clause gets repetitive fast." },
  rhetorical_question: { label: "Rhetorical Question Hook", description: "Using questions as engagement bait, especially at the start.", tip: "Lead with the answer. Rhetorical hooks read as filler in clusters." },
  future_forward: { label: "Future-Forward Closing", description: "Ending with vague future-facing statements.", tip: "End with something concrete: a specific next step, a number, or a direct CTA." },
  parenthetical_aside: { label: "Parenthetical Aside", description: "Parenthetical clarifications that over-explain.", tip: "Trim asides. If it matters, put it in the sentence; if not, cut it." },
  at_its_core: { label: "At-Its-Core Pretension", description: "Pseudo-depth construction claiming to reveal an essence.", tip: "If you need to announce depth, you're not being deep. Just make the point." },
};

const PATTERNS_DE: Record<string, PatternMeta> = {
  tricolon: { label: "Trikolon (Dreierregel)", description: "Dreiteilige Aufzählungen, gern mit ansteigender Komplexität oder dramatischer Steigerung.", tip: "Brich das Dreier-Muster. Nimm zwei, vier Elemente oder formuliere ganz um." },
  whether_opener: { label: "„Egal-ob“-Pseudo-Inklusivität", description: "Eröffnung mit „(Egal,) ob X oder Y“, um Publikums-Inklusivität vorzutäuschen.", tip: "Wähle dein echtes Publikum und sprich es direkt an, statt dich abzusichern." },
  hedge_opening: { label: "Absichernde Eröffnung", description: "Weichmacher-Floskeln, die keine Information hinzufügen.", tip: "Streich die Absicherung. Sag den Punkt direkt." },
  not_just_but: { label: "„Nicht-nur-sondern“-Steigerung", description: "Pseudo-dramatische Kontrast-Konstruktion.", tip: "Wähl die stärkere Aussage und führe damit. Das „nicht nur X“-Muster schwächt beide Seiten." },
  by_gerund: { label: "„Durch/Indem“-Eröffnung", description: "Sätze, die pseudo-autoritativ mit „Durch …“ oder „Indem …“ beginnen.", tip: "Variiere deine Satzanfänge. Zu viele „Durch …“/„Indem …“ wirken robotisch." },
  landscape_world: { label: "„In-der-heutigen-Welt“", description: "Eröffnung mit „In der heutigen [Adjektiv] Welt/Zeit/Landschaft“.", tip: "Komplett streichen. Beginne mit etwas Konkretem aus deinem echten Kontext." },
  imagine_opener: { label: "„Stellen-Sie-sich-vor“-Eröffnung", description: "Eröffnung mit „Stellen Sie sich vor“, um erzwungene Aufmerksamkeit zu erzeugen.", tip: "Zeigen statt „Stellen Sie sich vor“. Nimm ein konkretes Beispiel oder eine Geschichte." },
  em_dash_pivot: { label: "Gedankenstrich-Dramatik", description: "Gedankenstrich für dramatischen Effekt mitten im Satz.", tip: "Höchstens ein Gedankenstrich pro Absatz. Übermaß killt den Effekt." },
  power_verb_stacking: { label: "Power-Verben-Stapelung", description: "Häufung von Aktionsverben für künstliche Energie.", tip: "Durch konkrete Verben ersetzen. „Ladezeit um 40 % reduziert“ schlägt „Performance supercharged“." },
  lets_dive: { label: "„Lassen-Sie-uns“-Überleitung", description: "Umgangssprachliche Überleitungen, die Abschnittswechsel ankündigen.", tip: "Beginn einfach den nächsten Abschnitt. Der Leser braucht kein verbales Signal." },
  colon_list_intro: { label: "Doppelpunkt-Liste", description: "Aufzählungen, die mit einem Doppelpunkt-Satz eingeleitet werden.", tip: "Variiere die Einleitung von Listen; die Doppelpunkt-Phrase wird schnell repetitiv." },
  rhetorical_question: { label: "Rhetorische Frage als Hook", description: "Fragen als Aufmerksamkeits-Köder, besonders am Anfang.", tip: "Beginn mit der Antwort. Rhetorische Hooks wirken gehäuft wie Füllmaterial." },
  future_forward: { label: "Zukunftsgewandter Schluss", description: "Abschluss mit vagen, zukunftsgerichteten Aussagen.", tip: "Schließe mit etwas Konkretem: ein nächster Schritt, eine Zahl, ein direkter CTA." },
  parenthetical_aside: { label: "Klammer-Einschub", description: "Erklärende Klammer-Einschübe, die über-erklären.", tip: "Einschübe kürzen. Wenn es wichtig ist, in den Satz; sonst raus." },
  at_its_core: { label: "„Im-Kern“-Anmaßung", description: "Pseudo-Tiefe, die vorgibt, ein „Wesen“ freizulegen.", tip: "Wer Tiefe ankündigen muss, ist nicht tief. Sag einfach den Punkt." },
};

// ── English ──────────────────────────────────────────────
const en: Strings = {
  nav: { methodology: "Methodology", backToStory: "← Back to the data story" },
  common: {
    loading: "Loading the corpus…",
    noDataTitle: "No data yet",
    noDataLede: "Couldn’t load the published dataset. Generate it first:",
    modelsLabel: "models",
  },
  newsletter: {
    eyebrow: "Newsletter",
    title: "More where this came from",
    body: "We dig into how AI writes — patterns, data, and the tools we build. Occasional, no spam.",
    placeholder: "you@example.com",
    cta: "Subscribe",
    sending: "Sending…",
    success: "Almost there — check your inbox to confirm.",
    privacy: "Sent via Brevo. Unsubscribe anytime.",
    dismiss: "Maybe later",
  },
  hook: {
    eyebrow: "Modeltell · A data story",
    titleFaint: "Every AI writes",
    titleStrong: "with an accent.",
    parts: [
      { t: "In today’s fast-paced landscape", pattern: "In-today’s opener" },
      { t: ", we don’t just build tools" },
      { t: "-", pattern: "Em-dash pivot" },
      { t: "we " },
      { t: "empower, elevate, and transform", pattern: "Power-verb tricolon" },
      { t: " the way teams work. " },
      { t: "Whether you’re a startup or an enterprise", pattern: "Pseudo-inclusivity" },
      { t: ", the future is here.", pattern: "Future-forward close" },
    ],
    lede: (v) => (
      <>
        We sent {v.prompts} prompts to {v.models} models, {v.runs}× each, and measured{" "}
        <span className="text-paper">{v.words} words</span> against{" "}
        <span className="text-paper">{v.patterns} grammatical patterns</span>. Not just which words
        AI overuses: which <em className="font-display italic">sentence structures</em> it can’t
        stop reaching for.
      </>
    ),
    scroll: "scroll to begin",
  },
  words: {
    eyebrow: "The aggregate vocabulary",
    title: "The words AI can’t put down",
    lede: "The known AI tells: power words, hedges, connectors, fillers, pooled across the currently selected models and sized by how often they actually appear. Select one model to see its vocabulary alone.",
    noModels: "No models selected. Enable some in the filter.",
  },
  fingerprints: {
    eyebrow: "One shape per model",
    title: "Linguistic fingerprints",
    lede: "Eight syntactic dimensions, normalized so the biggest user of each pattern hits the edge. The silhouette is the tell: every model leans a different direction.",
    noModels: "No models selected. Enable some in the filter.",
    legendTitle: "Axes",
  },
  headToHead: {
    eyebrow: "Two models, one chart",
    title: "Head to head",
    lede: "Overlay any two fingerprints. The similarity score below sums up how much their pattern habits overlap, relative to the whole field.",
    vs: "vs",
    similarity: "Similarity",
    similarityNote: "fingerprint similarity, relative to the field",
    divergences: "Biggest divergences",
  },
  drift: {
    eyebrow: "The same model, across its own versions",
    title: "Does a model’s accent drift?",
    lede: "When several versions of one family are in the run, we can watch the fingerprint move. Faint is the oldest version, bright is the newest, and the shifts below are where the writing style changed most.",
    biggestShifts: "Biggest shifts",
    legend: (newest) => `▲ more frequent in ${newest} · ▼ less · per 1,000 words`,
  },
  patterns: {
    eyebrow: "The syntactic layer",
    title: "Patterns, one by one",
    lede: "This is the part the meme lists miss. Below: each construction, a real example, who reaches for it most, and how to stop.",
    perThousand: "Per 1,000 words · 95% CI",
    theFix: "The fix",
    note: (runs, prompts) =>
      `Whiskers = 95% bootstrap CI (${runs}×${prompts} generations). ▲/▼ = significantly above/below the field (permutation test, FDR < 0.05).`,
    sigTitle: (dir) => `Significantly ${dir} the field (permutation test, FDR < 0.05)`,
    fallbackTip: "Use it sparingly and vary your phrasing.",
  },
  tierAnalysis: {
    eyebrow: "Frontier vs mid vs open source",
    title: "Does price buy a different accent?",
    lede: "Averaged by tier. The question that matters: do cheaper and open models converge on the same habits as the frontier, or do they have their own tells?",
    models: "models",
    note: "Toggle tiers and models in the filter to watch the overlays redraw. With a single run this is a snapshot; each monthly re-run sharpens the trend.",
  },
  similarity: {
    eyebrow: "Every pair, scored",
    title: "Who writes like whom",
    ledeSimilarity: "How close two models sit on every pattern, relative to the whole field. Brighter means they reach for the same constructions at the same rates.",
    ledeDelta: "Burrows’s Delta: the standard stylometric distance, on the 150 most frequent words. Brighter = smaller distance = more alike.",
    radarSimilarity: "Radar similarity",
    burrowsDelta: "Burrows’s Delta",
    mostAlike: "Most alike",
    mostDifferent: "Most different",
    selectedPair: "Selected pair",
    deltaFootnote: (mfw) =>
      `Burrows’s Delta (Burrows 2002) on the ${mfw} most-frequent words: the established authorship-attribution metric. See the methodology page.`,
    similar: "similar",
  },
  watchlist: {
    eyebrow: "The watchlist",
    title: "Now go check your own writing",
    lede: "The full pattern list, by severity. The same engine runs as a zero-dependency CLI: point it at your copy and get a grade.",
    openSource: "Open source · MIT",
    starGithub: "Star it on GitHub ★",
    runLinter: "Run the linter",
    linterNote: "Exits non-zero on grade C or below. Drop it in CI.",
    beforeCite: "Before you cite this",
    beforeCiteBody: "How the corpus, features, and metrics work, and what these numbers can’t support. We’re explicit about the limitations. ",
    readMethodology: "Read the methodology & limitations →",
    footer: (v) => (
      <>
        Modeltell · run <span className="text-paper/70">{v.runId}</span> · {v.date} · {v.models}{" "}
        models · {v.patterns} patterns
      </>
    ),
  },
  methodology: {
    eyebrow: (v) => `How this was made · v${v.schema} · run ${v.runId}`,
    title: (
      <>
        Methodology &<br />
        limitations
      </>
    ),
    intro: (
      <>
        Modeltell measures the lexical and syntactic regularities of text produced by large language
        models. This page documents exactly what we do, how we compute it, and, importantly, what
        these numbers can and cannot support. We’d rather be precise about the limits than oversell
        the findings.
      </>
    ),
    importantLabel: "Important",
    important: (
      <>
        This is <strong>not an AI-text detector</strong>. Published detectors are unreliable and
        biased. One widely cited study found they misclassified <strong>61% of essays by
        non-native English writers</strong> as AI-generated. Do not use Modeltell to judge whether a
        person wrote something. It describes tendencies of model output in aggregate, not the
        provenance of any single text.
      </>
    ),
    premiseH: "The premise is sound",
    premise: (
      <>
        That LLMs leave measurable stylistic fingerprints is well supported. Recent peer-reviewed
        work shows models can be told apart, and told apart from humans, by the frequency of
        lexical and morphosyntactic features, with reported accuracies of 88 to 98% in short samples.
        Fingerprints tend to persist across versions of the same model family, which is what our
        version-drift view leans on. So the object of study is real. The open question is always one
        of <em>method</em>.
      </>
    ),
    corpusH: "The corpus",
    corpus: (v) => (
      <>
        We send <strong>{v.prompts} fixed prompts</strong> across 5 content categories (marketing,
        business, creative, professional, content) to <strong>{v.models} models</strong>,{" "}
        <strong>{v.runs}× each</strong>, with one shared system prompt. That yields {v.gens}{" "}
        generations per model and roughly <strong>{v.words} words</strong> total in this run. Every
        model is called through the same gateway (OpenRouter); the backend that served each request
        is recorded for provenance.
      </>
    ),
    featureH: "Feature extraction",
    lexicalLabel: "Lexical",
    lexical: (
      <>
        Text is lowercased and tokenized; we count a curated watchlist of known LLM-associated terms
        (power words, hedges, connectors, fillers) and report frequencies{" "}
        <strong>per 1,000 words</strong>. We also compute a cross-model TF-IDF-style score to surface
        words one model uses far more than the others.
      </>
    ),
    syntacticLabel: "Syntactic",
    syntactic: (patterns) => (
      <>
        {patterns} grammatical constructions (tricolon, hedging openers, “whether you’re X or Y”,
        em-dash pivots, power-verb stacking, …) are detected with regular expressions, plus
        structural metrics. These feed an 8-dimensional “radar” fingerprint per model. Regexes are
        fast and transparent but <strong>heuristic</strong>. See limitations.
      </>
    ),
    accuracyH: "How accurate is the detection?",
    accuracyIntro: (sampled, pct) => (
      <>
        We ran a manual precision audit: for a sample of patterns we read real matches in context
        and judged each true or false. Micro-precision across {sampled} sampled matches was{" "}
        <strong>{pct}%</strong>. The spread is the honest part: some patterns are clean, one is
        broken:
      </>
    ),
    accuracyTakeaways: (firstCaveat) => (
      <>
        Takeaways: <strong>parenthetical aside</strong> is effectively noise (it catches functional
        parentheticals like “(30 chars)”), <strong>tricolon</strong> and <strong>em-dash pivot</strong>{" "}
        over-count inside longer lists, while <strong>not-just-but</strong> and the power-verb counter
        are clean. Caveats: {firstCaveat} Recall (missed instances) is not yet measured.
      </>
    ),
    numbersH: "How the numbers are computed",
    radarNorm: (
      <>
        <strong>Radar normalization.</strong> Each of the 8 dimensions is min-max scaled across the
        models in the run, so the heaviest user of a pattern sits at the edge. This is a{" "}
        <em>relative</em> view: it shows where a model sits in the field, not an absolute rate.
      </>
    ),
    similarityMetric: (
      <>
        <strong>Similarity.</strong> We min-max normalize each dimension across models, then take a
        Euclidean-distance-based similarity. Plain cosine would score every pair ≈ 0.9 to 1.0. We{" "}
        <strong>also report Burrows’s Delta</strong>, the field-standard authorship distance over
        the 150 most-frequent words. Notably, Delta independently finds the closest pair to be two
        versions of the <em>same</em> model family.
      </>
    ),
    versionDrift: (
      <>
        <strong>Version drift.</strong> When several versions of one family are in the run, we overlay
        their radars and report the per-dimension change from oldest to newest.
      </>
    ),
    reproH: "What holds up: reproducibility",
    repro: (
      <>
        The pipeline is built for transparency. Prompts are fixed and versioned; every raw generation
        is committed to the repository; analysis and publishing are deterministic and idempotent;
        open-model backends are pinned and the serving provider is recorded; published data carries a
        schema version. Anyone can re-run the exact pipeline or audit the raw outputs.
      </>
    ),
    limitsH: "Limitations",
    limitsIntro: "We hold these openly. They are the difference between a data story and a study.",
    limits: [
      { h: "No human baseline.", b: "We measure relative frequencies across models, not “overuse versus humans.” That would require a matched human-written corpus, which this run does not include." },
      { h: "Heuristic feature detection.", b: "Syntactic patterns are regular expressions. Our manual precision audit measured ~71% micro-precision with a wide spread: clean for some, ~0% for “parenthetical aside.” Recall is still unmeasured, and the audit is single-annotator." },
      { h: "Significance is tested at the pattern level only.", b: "Each frequency carries a 95% bootstrap CI and an FDR-corrected permutation test (model vs. field). Full pairwise tests and significance on the radar/similarity views are not yet done." },
      { h: "Two distance metrics.", b: "Our default radar similarity is intuitive but ad hoc; we also report Burrows’s Delta, and the two can disagree. That disagreement is itself informative." },
      { h: "Task and sampling confounds.", b: "One domain (business/marketing copy), one system prompt, default decoding. “Model style” is entangled with “task style,” and temperature is not ablated." },
      { h: "Construct validity.", b: "The 8 radar dimensions were chosen by hand, not derived from the data, so they may not be the most discriminative axes." },
    ],
    roadmapH: "Roadmap to rigor",
    roadmap: (
      <>
        Concretely: add a matched human-written baseline corpus; extend significance testing to full
        pairwise model comparisons (bootstrap CIs, Burrows’s Delta, and FDR-corrected model-vs-field
        permutation tests are already reported); measure regex recall and add a second annotator;
        tighten or drop the low-precision patterns; broaden the prompt set across domains; and ablate
        temperature and system-prompt effects.
      </>
    ),
    refsH: "References",
  },
  filter: { title: "Filter models", reset: "reset" },
  severity: { critical: "Critical", high: "High", medium: "Medium", low: "Low" },
  tierLabels: { frontier: "Frontier", mid: "Mid-Tier", opensource: "Open Source" },
  categories: { power_word: "Power word", hedge: "Hedge", connector: "Connector", filler: "Filler", other: "Other" },
  radar: RADAR_EN,
  radarHelp: RADAR_HELP_EN,
  patternMeta: PATTERNS_EN,
};

// ── German ───────────────────────────────────────────────
const de: Strings = {
  nav: { methodology: "Methodik", backToStory: "← Zurück zur Daten-Story" },
  common: {
    loading: "Korpus wird geladen…",
    noDataTitle: "Noch keine Daten",
    noDataLede: "Der publizierte Datensatz konnte nicht geladen werden. Erst generieren:",
    modelsLabel: "Modelle",
  },
  newsletter: {
    eyebrow: "Newsletter",
    title: "Mehr davon?",
    body: "Wir sezieren, wie KI schreibt — Muster, Daten und die Tools, die wir bauen. Selten, kein Spam.",
    placeholder: "du@beispiel.de",
    cta: "Abonnieren",
    sending: "Wird gesendet…",
    success: "Fast geschafft — bestätige bitte die E-Mail in deinem Postfach.",
    privacy: "Versand über Brevo. Jederzeit abbestellbar.",
    dismiss: "Vielleicht später",
  },
  hook: {
    eyebrow: "Modeltell · Eine Daten-Story",
    titleFaint: "Jede KI schreibt",
    titleStrong: "mit einem Akzent.",
    parts: [
      { t: "In der heutigen schnelllebigen Welt", pattern: "„Heutige Welt“-Eröffnung" },
      { t: " bauen wir nicht nur Tools" },
      { t: "-", pattern: "Gedankenstrich-Dramatik" },
      { t: "wir " },
      { t: "optimieren, skalieren und transformieren", pattern: "Power-Verb-Trikolon" },
      { t: " die Arbeit von Teams. " },
      { t: "Egal, ob Start-up oder Konzern", pattern: "Pseudo-Inklusivität" },
      { t: ": die Zukunft beginnt jetzt.", pattern: "Zukunftsgewandter Schluss" },
    ],
    lede: (v) => (
      <>
        Wir haben {v.prompts} Prompts an {v.models} Modelle geschickt, je {v.runs}×, und{" "}
        <span className="text-paper">{v.words} Wörter</span> gegen{" "}
        <span className="text-paper">{v.patterns} grammatikalische Muster</span> gemessen. Nicht nur,
        welche Wörter KI übernutzt: welche <em className="font-display italic">Satzstrukturen</em>{" "}
        sie nicht lassen kann.
      </>
    ),
    scroll: "scrollen zum Start",
  },
  words: {
    eyebrow: "Der aggregierte Wortschatz",
    title: "Die Wörter, die KI nicht lassen kann",
    lede: "Die bekannten KI-Tells: Power-Wörter, Absicherungen, Konnektoren, Füllwörter, über die aktuell ausgewählten Modelle gepoolt und nach tatsächlicher Häufigkeit skaliert. Wähle ein einzelnes Modell, um nur dessen Wortschatz zu sehen.",
    noModels: "Keine Modelle ausgewählt. Im Filter aktivieren.",
  },
  fingerprints: {
    eyebrow: "Eine Form pro Modell",
    title: "Linguistische Fingerabdrücke",
    lede: "Acht syntaktische Dimensionen, normalisiert, sodass der stärkste Nutzer eines Musters am Rand sitzt. Die Silhouette ist der Tell: jedes Modell neigt in eine andere Richtung.",
    noModels: "Keine Modelle ausgewählt. Im Filter aktivieren.",
    legendTitle: "Achsen",
  },
  headToHead: {
    eyebrow: "Zwei Modelle, ein Diagramm",
    title: "Direktvergleich",
    lede: "Lege zwei Fingerabdrücke übereinander. Der Ähnlichkeitswert unten fasst zusammen, wie stark sich ihre Muster-Gewohnheiten überschneiden, relativ zum gesamten Feld.",
    vs: "vs",
    similarity: "Ähnlichkeit",
    similarityNote: "Fingerabdruck-Ähnlichkeit, relativ zum Feld",
    divergences: "Größte Abweichungen",
  },
  drift: {
    eyebrow: "Dasselbe Modell über seine eigenen Versionen",
    title: "Driftet der Akzent eines Modells?",
    lede: "Wenn mehrere Versionen einer Familie im Lauf sind, sehen wir den Fingerabdruck wandern. Blass ist die älteste Version, hell die neueste, und die Verschiebungen unten zeigen, wo sich der Stil am stärksten geändert hat.",
    biggestShifts: "Größte Verschiebungen",
    legend: (newest) => `▲ häufiger in ${newest} · ▼ seltener · pro 1.000 Wörter`,
  },
  patterns: {
    eyebrow: "Die syntaktische Ebene",
    title: "Muster, eines nach dem anderen",
    lede: "Das ist der Teil, den die Meme-Listen verpassen. Unten: jede Konstruktion, ein echtes Beispiel, wer am meisten dazu greift, und wie man aufhört.",
    perThousand: "Pro 1.000 Wörter · 95 % KI",
    theFix: "Die Lösung",
    note: (runs, prompts) =>
      `Whisker = 95 % Bootstrap-KI (${runs}×${prompts} Generierungen). ▲/▼ = signifikant über/unter dem Feld (Permutationstest, FDR < 0,05).`,
    sigTitle: (dir) => `Signifikant ${dir === "above" ? "über" : "unter"} dem Feld (Permutationstest, FDR < 0,05)`,
    fallbackTip: "Sparsam verwenden und die Formulierung variieren.",
  },
  tierAnalysis: {
    eyebrow: "Spitzenklasse vs. Mittelklasse vs. Open Source",
    title: "Kauft man sich mit Geld einen anderen Akzent?",
    lede: "Nach Klasse gemittelt. Die entscheidende Frage: Konvergieren günstigere und offene Modelle auf dieselben Gewohnheiten wie die Spitzenklasse, oder haben sie eigene Tells?",
    models: "Modelle",
    note: "Schalte Klassen und Modelle im Filter um, um die Overlays neu zu zeichnen. Mit einem einzelnen Lauf ist das eine Momentaufnahme; jeder Monatslauf schärft den Trend.",
  },
  similarity: {
    eyebrow: "Jedes Paar, bewertet",
    title: "Wer schreibt wie wer",
    ledeSimilarity: "Wie nah zwei Modelle bei jedem Muster beieinanderliegen, relativ zum gesamten Feld. Heller heißt: Sie greifen zu denselben Konstruktionen in denselben Raten.",
    ledeDelta: "Burrows's Delta: das Standard-Distanzmaß der Stilometrie, auf den 150 häufigsten Wörtern. Heller = geringere Distanz = ähnlicher.",
    radarSimilarity: "Radar-Ähnlichkeit",
    burrowsDelta: "Burrows's Delta",
    mostAlike: "Am ähnlichsten",
    mostDifferent: "Am verschiedensten",
    selectedPair: "Ausgewähltes Paar",
    deltaFootnote: (mfw) =>
      `Burrows's Delta (Burrows 2002) auf den ${mfw} häufigsten Wörtern: das etablierte Authorship-Attribution-Maß. Siehe Methodik-Seite.`,
    similar: "ähnlich",
  },
  watchlist: {
    eyebrow: "Die Watchlist",
    title: "Jetzt prüf deinen eigenen Text",
    lede: "Die vollständige Muster-Liste nach Schweregrad. Dieselbe Engine läuft als CLI ohne Abhängigkeiten: richte sie auf deinen Text und bekomm eine Note.",
    openSource: "Open Source · MIT",
    starGithub: "Auf GitHub sternen ★",
    runLinter: "Linter ausführen",
    linterNote: "Beendet mit Fehlercode ab Note C. Direkt CI-tauglich.",
    beforeCite: "Bevor du das zitierst",
    beforeCiteBody: "Wie Korpus, Features und Metriken funktionieren, und was diese Zahlen nicht hergeben. Wir benennen die Grenzen offen. ",
    readMethodology: "Methodik & Grenzen lesen →",
    footer: (v) => (
      <>
        Modeltell · Lauf <span className="text-paper/70">{v.runId}</span> · {v.date} · {v.models}{" "}
        Modelle · {v.patterns} Muster
      </>
    ),
  },
  methodology: {
    eyebrow: (v) => `Wie das entstand · v${v.schema} · Lauf ${v.runId}`,
    title: (
      <>
        Methodik &<br />
        Grenzen
      </>
    ),
    intro: (
      <>
        Modeltell misst die lexikalischen und syntaktischen Regelmäßigkeiten von Text, den große
        Sprachmodelle erzeugen. Diese Seite dokumentiert genau, was wir tun, wie wir es berechnen
        und, vor allem, was diese Zahlen hergeben und was nicht. Lieber präzise über die Grenzen
        als die Befunde überverkaufen.
      </>
    ),
    importantLabel: "Wichtig",
    important: (
      <>
        Das ist <strong>kein KI-Text-Detektor</strong>. Veröffentlichte Detektoren sind unzuverlässig
        und verzerrt. Eine viel zitierte Studie fand, dass sie <strong>61 % der Essays von
        Nicht-Muttersprachlern</strong> fälschlich als KI-generiert einstuften. Nutze Modeltell nicht,
        um zu beurteilen, ob ein Mensch etwas geschrieben hat. Es beschreibt Tendenzen von
        Modell-Output im Aggregat, nicht die Herkunft eines einzelnen Textes.
      </>
    ),
    premiseH: "Die Prämisse hält",
    premise: (
      <>
        Dass LLMs messbare stilistische Fingerabdrücke hinterlassen, ist gut belegt. Aktuelle
        peer-reviewte Arbeiten zeigen, dass Modelle, und Mensch vs. Modell, über die Häufigkeit
        lexikalischer und morphosyntaktischer Merkmale unterscheidbar sind, mit berichteten
        Genauigkeiten von 88 bis 98 % bei kurzen Texten. Fingerabdrücke bleiben über Versionen einer
        Modellfamilie hinweg meist bestehen, worauf unsere Drift-Ansicht aufbaut. Der
        Untersuchungsgegenstand ist also real. Die offene Frage ist immer eine der <em>Methode</em>.
      </>
    ),
    corpusH: "Der Korpus",
    corpus: (v) => (
      <>
        Wir schicken <strong>{v.prompts} feste Prompts</strong> über 5 Inhaltskategorien (Marketing,
        Business, Kreativ, Professionell, Content) an <strong>{v.models} Modelle</strong>, je{" "}
        <strong>{v.runs}×</strong>, mit einem gemeinsamen System-Prompt. Das ergibt {v.gens}{" "}
        Generierungen pro Modell und rund <strong>{v.words} Wörter</strong> in diesem Lauf. Jedes
        Modell wird über dasselbe Gateway (OpenRouter) aufgerufen; der Backend-Provider, der jede
        Anfrage bediente, wird zur Nachvollziehbarkeit erfasst.
      </>
    ),
    featureH: "Merkmals-Extraktion",
    lexicalLabel: "Lexikalisch",
    lexical: (
      <>
        Text wird kleingeschrieben und tokenisiert; wir zählen eine kuratierte Watchlist bekannter
        LLM-typischer Begriffe (Power-Wörter, Absicherungen, Konnektoren, Füllwörter) und berichten
        Häufigkeiten <strong>pro 1.000 Wörter</strong>. Zusätzlich berechnen wir einen
        modellübergreifenden TF-IDF-artigen Score, der Wörter hervorhebt, die ein Modell weit mehr
        nutzt als die anderen.
      </>
    ),
    syntacticLabel: "Syntaktisch",
    syntactic: (patterns) => (
      <>
        {patterns} grammatikalische Konstruktionen (Trikolon, absichernde Eröffnungen, „whether
        you’re X or Y“, Gedankenstrich-Dramatik, Power-Verb-Stapelung, …) werden per Regex erkannt,
        plus strukturelle Metriken. Diese speisen einen 8-dimensionalen „Radar“-Fingerabdruck pro
        Modell. Regexes sind schnell und transparent, aber <strong>heuristisch</strong>. Siehe
        Grenzen.
      </>
    ),
    accuracyH: "Wie genau ist die Erkennung?",
    accuracyIntro: (sampled, pct) => (
      <>
        Wir haben ein manuelles Precision-Audit gemacht: für eine Stichprobe von Mustern echte
        Treffer im Kontext gelesen und jeden als richtig oder falsch beurteilt. Die Mikro-Precision
        über {sampled} Stichproben-Treffer lag bei <strong>{pct} %</strong>. Die Spreizung ist der
        ehrliche Teil: manche Muster sind sauber, eines ist kaputt:
      </>
    ),
    accuracyTakeaways: (firstCaveat) => (
      <>
        Erkenntnisse: <strong>Klammer-Einschub</strong> ist faktisch Rauschen (er fängt funktionale
        Klammern wie „(30 chars)“), <strong>Trikolon</strong> und <strong>Gedankenstrich-Dramatik</strong>{" "}
        überzählen in längeren Listen, während <strong>Not-Just-But</strong> und der Power-Verb-Zähler
        sauber sind. Vorbehalte: {firstCaveat} Recall (verpasste Instanzen) ist noch nicht gemessen.
      </>
    ),
    numbersH: "Wie die Zahlen berechnet werden",
    radarNorm: (
      <>
        <strong>Radar-Normalisierung.</strong> Jede der 8 Dimensionen wird über die Modelle des Laufs
        min-max-skaliert, sodass der stärkste Nutzer eines Musters am Rand sitzt. Das ist eine{" "}
        <em>relative</em> Sicht: Sie zeigt, wo ein Modell im Feld steht, nicht eine absolute Rate.
      </>
    ),
    similarityMetric: (
      <>
        <strong>Ähnlichkeit.</strong> Wir min-max-normalisieren jede Dimension über die Modelle und
        bilden dann eine auf euklidischer Distanz basierende Ähnlichkeit. Reines Cosinus würde jedes
        Paar mit ≈ 0,9 bis 1,0 bewerten. Wir <strong>berichten zusätzlich Burrows's Delta</strong>, das
        Feld-Standard-Authorship-Distanzmaß auf den 150 häufigsten Wörtern. Bemerkenswert: Delta
        findet unabhängig als ähnlichstes Paar zwei Versionen <em>derselben</em> Modellfamilie.
      </>
    ),
    versionDrift: (
      <>
        <strong>Versions-Drift.</strong> Wenn mehrere Versionen einer Familie im Lauf sind, legen wir
        ihre Radare übereinander und berichten die Änderung pro Dimension von alt zu neu.
      </>
    ),
    reproH: "Was hält: Reproduzierbarkeit",
    repro: (
      <>
        Die Pipeline ist auf Transparenz gebaut. Prompts sind fest und versioniert; jede Roh-Generierung
        ist im Repository committet; Analyse und Publishing sind deterministisch und idempotent;
        Open-Modell-Backends sind gepinnt und der bedienende Provider wird erfasst; publizierte Daten
        tragen eine Schema-Version. Jede:r kann die exakte Pipeline neu laufen lassen oder die
        Roh-Outputs prüfen.
      </>
    ),
    limitsH: "Grenzen",
    limitsIntro: "Wir benennen sie offen. Sie sind der Unterschied zwischen einer Daten-Story und einer Studie.",
    limits: [
      { h: "Keine menschliche Baseline.", b: "Wir messen relative Häufigkeiten zwischen Modellen, nicht „Übernutzung ggü. Menschen“. Das bräuchte ein gematchtes, menschlich geschriebenes Korpus, das dieser Lauf nicht enthält." },
      { h: "Heuristische Merkmalserkennung.", b: "Syntaktische Muster sind Regexes. Unser manuelles Precision-Audit maß ~71 % Mikro-Precision mit breiter Spreizung: sauber bei manchen, ~0 % bei „Klammer-Einschub“. Recall ist noch ungemessen, und das Audit ist Single-Annotator." },
      { h: "Signifikanz nur auf Muster-Ebene.", b: "Jede Häufigkeit trägt ein 95 %-Bootstrap-KI und einen FDR-korrigierten Permutationstest (Modell vs. Feld). Volle paarweise Tests und Signifikanz auf Radar/Ähnlichkeit fehlen noch." },
      { h: "Zwei Distanzmaße.", b: "Unsere Standard-Radar-Ähnlichkeit ist intuitiv, aber ad hoc; wir berichten zusätzlich Burrows's Delta. Beide können sich widersprechen, was selbst informativ ist." },
      { h: "Task- und Sampling-Confounds.", b: "Eine Domäne (Business/Marketing-Texte), ein System-Prompt, Default-Decoding. „Modell-Stil“ ist mit „Task-Stil“ verwoben, und Temperatur ist nicht abladiert." },
      { h: "Konstrukt-Validität.", b: "Die 8 Radar-Dimensionen sind handverlesen, nicht aus den Daten abgeleitet. Sie sind also evtl. nicht die diskriminativsten Achsen." },
    ],
    roadmapH: "Roadmap zur Belastbarkeit",
    roadmap: (
      <>
        Konkret: ein gematchtes, menschlich geschriebenes Baseline-Korpus ergänzen;
        Signifikanztests auf volle paarweise Modellvergleiche ausweiten (Bootstrap-KIs, Burrows's
        Delta und FDR-korrigierte Modell-vs-Feld-Permutationstests werden bereits berichtet);
        Regex-Recall messen und eine:n zweite:n Annotator:in hinzunehmen; die niedrig-präzisen Muster
        schärfen oder entfernen; den Prompt-Satz über Domänen verbreitern; und Temperatur- und
        System-Prompt-Effekte abladieren.
      </>
    ),
    refsH: "Quellen",
  },
  filter: { title: "Modelle filtern", reset: "zurücksetzen" },
  severity: { critical: "Kritisch", high: "Hoch", medium: "Mittel", low: "Niedrig" },
  tierLabels: { frontier: "Spitzenklasse", mid: "Mittelklasse", opensource: "Open Source" },
  categories: { power_word: "Power-Wort", hedge: "Absicherung", connector: "Konnektor", filler: "Füllwort", other: "Sonstige" },
  radar: RADAR_DE,
  radarHelp: RADAR_HELP_DE,
  patternMeta: PATTERNS_DE,
};

export const strings: Record<Lang, Strings> = { en, de };
