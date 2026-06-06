import type { ModeltellData } from "../types";
import { Reveal } from "../components/Reveal";
import { fmt } from "../lib/utils";
import { useT, useLang, LangSwitcher } from "../i18n";

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="display-lg mb-5 mt-20 first:mt-0">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-paper/80 leading-relaxed">{children}</p>;
}
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow mb-3">{children}</div>;
}

const REFS = [
  { n: 1, cite: "Burrows, J. (2002). ‘Delta’: a Measure of Stylistic Difference and a Guide to Likely Authorship. Literary and Linguistic Computing 17(3).", url: "https://academic.oup.com/dsh/article/17/3/267/928151" },
  { n: 2, cite: "McGovern, H. et al. (2024). Your Large Language Models Are Leaving Fingerprints. arXiv:2405.14057.", url: "https://arxiv.org/abs/2405.14057" },
  { n: 3, cite: "Stylometric comparisons of human versus AI-generated creative writing (2025). Humanities and Social Sciences Communications (Nature).", url: "https://www.nature.com/articles/s41599-025-05986-3" },
  { n: 4, cite: "Przystalski, K. et al. (2025). Stylometry recognizes human and LLM-generated texts in short samples. arXiv:2507.00838.", url: "https://arxiv.org/abs/2507.00838" },
  { n: 5, cite: "Liang, W. et al. (2023). GPT detectors are biased against non-native English writers. arXiv:2304.02819 (Patterns, Cell Press).", url: "https://arxiv.org/abs/2304.02819" },
  { n: 6, cite: "Dror, R. et al. (2018). The Hitchhiker’s Guide to Testing Statistical Significance in NLP. ACL.", url: "https://aclanthology.org/P18-1128/" },
];

function Ref({ ids }: { ids: number[] }) {
  return <sup className="ml-0.5 font-mono text-[10px] text-accent-gold">[{ids.join(",")}]</sup>;
}

export function Methodology({ data }: { data: ModeltellData }) {
  const t = useT();
  const { lang } = useLang();
  const loc = lang === "de" ? "de-DE" : "en-US";
  const m = t.methodology;
  const totalWords = Object.values(data.fingerprints).reduce((s, fp) => s + (fp.corpus.total_words || 0), 0);
  const patternCount = data.patterns.syntactic_patterns.length;

  return (
    <main className="min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-ink-line bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <a href="#/" className="font-mono text-xs text-muted transition-colors hover:text-paper">
            ← Modeltell
          </a>
          <div className="flex items-center gap-4">
            <span className="eyebrow">{t.nav.methodology}</span>
            <LangSwitcher />
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <Reveal>
          <Eyebrow>{m.eyebrow({ schema: data.index.schema_version, runId: data.index.run_id })}</Eyebrow>
          <h1 className="display-xl mb-8" style={{ fontSize: "clamp(2.25rem,6vw,4.5rem)" }}>
            {m.title}
          </h1>
          <P>{m.intro}</P>
        </Reveal>

        <Reveal>
          <div className="my-10 rounded-2xl border border-accent-frontier/40 bg-accent-frontier/5 p-6">
            <Eyebrow>
              <span className="text-accent-frontier">{m.importantLabel}</span>
            </Eyebrow>
            <p className="text-paper/90">
              {m.important}
              <Ref ids={[5]} />
            </p>
          </div>
        </Reveal>

        <Reveal>
          <H>{m.premiseH}</H>
          <P>
            {m.premise}
            <Ref ids={[2, 3, 4]} />
          </P>
        </Reveal>

        <Reveal>
          <H>{m.corpusH}</H>
          <P>
            {m.corpus({
              prompts: fmt(data.index.prompt_count, 0, loc),
              models: data.index.models.length,
              runs: data.index.runs_per_prompt,
              gens: fmt(data.index.prompt_count * data.index.runs_per_prompt, 0, loc),
              words: fmt(totalWords, 0, loc),
            })}
          </P>
        </Reveal>

        <Reveal>
          <H>{m.featureH}</H>
          <Eyebrow>{m.lexicalLabel}</Eyebrow>
          <P>{m.lexical}</P>
          <Eyebrow>{m.syntacticLabel}</Eyebrow>
          <P>{m.syntactic(patternCount)}</P>
        </Reveal>

        {data.regexAudit && (
          <Reveal>
            <H>{m.accuracyH}</H>
            <P>
              {m.accuracyIntro(
                data.regexAudit.summary.total_sampled,
                Math.round(data.regexAudit.summary.micro_precision * 100)
              )}
            </P>
            <div className="my-6 overflow-hidden rounded-xl border border-ink-line">
              {[...data.regexAudit.patterns]
                .sort((a, b) => a.precision - b.precision)
                .map((p) => (
                  <div key={p.id} className="flex items-center gap-4 border-b border-ink-line bg-ink-card/40 px-4 py-3 last:border-b-0">
                    <span className="flex-1 text-sm text-paper/85">{t.patternMeta[p.id]?.label ?? p.label}</span>
                    <span className="font-mono text-xs text-muted">{p.true_positives}/{p.sample_size}</span>
                    <span
                      className="w-12 text-right font-mono text-sm"
                      style={{ color: p.precision >= 0.9 ? "#2a9d8f" : p.precision >= 0.7 ? "#e9c46a" : "#e63946" }}
                    >
                      {Math.round(p.precision * 100)}%
                    </span>
                  </div>
                ))}
            </div>
            <P>{m.accuracyTakeaways(data.regexAudit.caveats[0])}</P>
          </Reveal>
        )}

        <Reveal>
          <H>{m.numbersH}</H>
          <P>{m.radarNorm}</P>
          <P>
            {m.similarityMetric}
            <Ref ids={[1]} />
          </P>
          <P>{m.versionDrift}</P>
        </Reveal>

        <Reveal>
          <H>{m.reproH}</H>
          <P>{m.repro}</P>
        </Reveal>

        <Reveal>
          <H>{m.limitsH}</H>
          <P>{m.limitsIntro}</P>
          <ol className="space-y-4">
            {m.limits.map((l, i) => (
              <li key={i} className="flex gap-4">
                <span className="font-mono text-sm text-accent-gold">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <strong className="text-paper">{l.h}</strong>{" "}
                  <span className="text-paper/75">{l.b}</span>
                </span>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal>
          <H>{m.roadmapH}</H>
          <P>
            {m.roadmap}
            <Ref ids={[6]} />
          </P>
        </Reveal>

        <Reveal>
          <H>{m.refsH}</H>
          <ol className="space-y-3">
            {REFS.map((r) => (
              <li key={r.n} className="flex gap-3 text-sm">
                <span className="font-mono text-accent-gold">[{r.n}]</span>
                <a href={r.url} target="_blank" rel="noreferrer" className="text-paper/70 underline decoration-ink-line underline-offset-4 hover:text-paper">
                  {r.cite}
                </a>
              </li>
            ))}
          </ol>
        </Reveal>

        <div className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-ink-line pt-8">
          <a href="#/" className="font-mono text-sm text-accent-gold hover:underline">
            {t.nav.backToStory}
          </a>
          <div className="flex items-center gap-4 font-mono text-xs">
            <a href="https://thirdshiftlab.com" target="_blank" rel="noreferrer" className="text-muted transition-colors hover:text-accent-gold">
              thirdshiftlab.com
            </a>
            <span className="text-ink-line">·</span>
            <a href="mailto:hello@thirdshiftlab.com" className="text-muted transition-colors hover:text-accent-gold">
              hello@thirdshiftlab.com
            </a>
          </div>
        </div>
      </article>
    </main>
  );
}
