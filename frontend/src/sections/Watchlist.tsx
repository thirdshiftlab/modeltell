import { Section } from "../components/Section";
import { SectionHeader, Reveal } from "../components/Reveal";
import type { ModeltellData } from "../types";
import { SEVERITY_META, type Severity } from "../types";
import { useT } from "../i18n";
import { useLang } from "../i18n";

const SEV_ORDER: Severity[] = ["critical", "high", "medium", "low"];

export function Watchlist({ data }: { data: ModeltellData }) {
  const t = useT();
  const { lang } = useLang();
  const constructions = [...data.watchlistConstructions.constructions].sort(
    (a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity)
  );
  const repo = data.index.project.url;
  const date = new Date(data.index.generated_at).toLocaleDateString(lang === "de" ? "de-DE" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Section id="watchlist" tone="soft">
      <SectionHeader
        index="09"
        eyebrow={t.watchlist.eyebrow}
        title={t.watchlist.title}
        lede={t.watchlist.lede}
      />

      <div className="mx-auto mt-12 max-w-4xl">
        <Reveal>
          <div className="mb-10 grid gap-3 sm:grid-cols-2">
            <a
              href={repo}
              target="_blank"
              rel="noreferrer"
              className="group rounded-2xl border border-ink-line bg-ink-card p-6 transition-colors hover:border-accent-gold"
            >
              <div className="eyebrow mb-2 text-accent-gold">{t.watchlist.openSource}</div>
              <div className="font-display text-xl text-paper">{t.watchlist.starGithub}</div>
              <p className="mt-1 font-mono text-xs text-muted group-hover:text-paper/70">{repo}</p>
            </a>
            <div className="rounded-2xl border border-ink-line bg-ink p-6">
              <div className="eyebrow mb-2">{t.watchlist.runLinter}</div>
              <pre className="overflow-x-auto font-mono text-sm text-accent-gold">npx modeltell check "your text"</pre>
              <p className="mt-2 font-mono text-xs text-muted">{t.watchlist.linterNote}</p>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="mb-10 rounded-2xl border border-ink-line bg-ink-card/40 p-6">
            <div className="eyebrow mb-2">{t.watchlist.beforeCite}</div>
            <p className="text-sm text-paper/80">
              {t.watchlist.beforeCiteBody}
              <a href="#/methodology" className="text-accent-gold underline underline-offset-4 hover:text-paper">
                {t.watchlist.readMethodology}
              </a>
            </p>
          </div>
        </Reveal>

        <div className="overflow-hidden rounded-2xl border border-ink-line">
          {constructions.map((c, i) => {
            const sev = SEVERITY_META[c.severity];
            return (
              <Reveal key={c.id} delay={Math.min(i * 0.02, 0.25)}>
                <div className="flex items-center gap-4 border-b border-ink-line bg-ink-card/40 px-5 py-4 last:border-b-0">
                  <span
                    className="w-16 shrink-0 rounded-full px-2 py-0.5 text-center font-mono text-[10px] uppercase tracking-wider"
                    style={{ background: `${sev.color}22`, color: sev.color }}
                  >
                    {t.severity[c.severity]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-base text-paper">{t.patternMeta[c.id]?.label ?? c.label}</div>
                    <div className="truncate font-mono text-xs text-muted">{t.patternMeta[c.id]?.description ?? c.description}</div>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-muted">
                    {c.avg_frequency.toFixed(1)}/1k
                  </span>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <footer className="mt-16 border-t border-ink-line pt-8 text-center">
            <div className="mb-3 flex items-center justify-center gap-5 font-mono text-xs">
              <a href="https://thirdshiftlab.com" target="_blank" rel="noreferrer" className="text-muted transition-colors hover:text-accent-gold">
                thirdshiftlab.com
              </a>
              <span className="text-ink-line">·</span>
              <a href="mailto:hello@thirdshiftlab.com" className="text-muted transition-colors hover:text-accent-gold">
                hello@thirdshiftlab.com
              </a>
            </div>
            <p className="font-mono text-xs text-muted">
              {t.watchlist.footer({
                runId: data.index.run_id,
                date,
                models: data.index.models.length,
                patterns: data.patterns.syntactic_patterns.length,
              })}
            </p>
          </footer>
        </Reveal>
      </div>
    </Section>
  );
}
