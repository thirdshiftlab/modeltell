import { Section } from "../components/Section";
import { SectionHeader, Reveal } from "../components/Reveal";
import type { ModeltellData } from "../types";
import { SEVERITY_META } from "../types";
import { tierColor, modelLabel, modelTier } from "../lib/utils";
import { useFilters } from "../state/filters";
import { useT } from "../i18n";

export function PatternDeepDive({ data }: { data: ModeltellData }) {
  const t = useT();
  const { enabledIds } = useFilters();

  const constructions = [...data.watchlistConstructions.constructions].sort(
    (a, b) => b.avg_frequency - a.avg_frequency
  );

  // For a construction id, per-model per_1k (+ 95% bootstrap CI) from each enabled fingerprint.
  const perModel = (id: string) =>
    enabledIds
      .map((mid) => {
        const fp = data.fingerprints[mid];
        const p = fp?.patterns.find((x) => x.id === id);
        return {
          id: mid,
          value: p?.per_1k_words ?? 0,
          ciLow: p?.ci_low ?? p?.per_1k_words ?? 0,
          ciHigh: p?.ci_high ?? p?.per_1k_words ?? 0,
          significant: !!p?.significant,
          direction: p?.direction,
        };
      })
      .sort((a, b) => b.value - a.value);

  return (
    <Section id="patterns">
      <SectionHeader
        index="06"
        eyebrow={t.patterns.eyebrow}
        title={t.patterns.title}
        lede={t.patterns.lede}
      />

      <div className="mx-auto mt-14 max-w-4xl space-y-6">
        {constructions.map((c, i) => {
          const bars = perModel(c.id);
          const max = Math.max(...bars.map((b) => b.ciHigh), 0.001);
          const sev = SEVERITY_META[c.severity];
          const example = c.examples?.[0];
          return (
            <Reveal key={c.id} delay={Math.min(i * 0.03, 0.3)}>
              <article className="rounded-2xl border border-ink-line bg-ink-card/40 p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-display text-2xl font-semibold text-paper">
                    {t.patternMeta[c.id]?.label ?? c.label}
                  </h3>
                  <span
                    className="rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                    style={{ background: `${sev.color}22`, color: sev.color }}
                  >
                    {t.severity[c.severity]}
                  </span>
                </div>
                <p className="mt-2 max-w-prose text-sm text-paper/70">
                  {t.patternMeta[c.id]?.description ?? c.description}
                </p>

                {example && (
                  <p className="mt-4 border-l-2 border-accent-gold/50 pl-4 font-display text-lg italic text-paper/85">
                    “{example}”
                  </p>
                )}

                <div className="mt-6 grid gap-6 md:grid-cols-[1.3fr_1fr]">
                  <div className="space-y-2">
                    <div className="eyebrow mb-2">{t.patterns.perThousand}</div>
                    {bars.slice(0, 6).map((m) => (
                      <div key={m.id} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 truncate font-mono text-[11px] text-paper/70">
                          {modelLabel(data, m.id)}
                        </span>
                        <div
                          className="relative h-3 flex-1 rounded-sm bg-ink"
                          title={`${m.value.toFixed(2)} per 1k · 95% CI ${m.ciLow.toFixed(2)} to ${m.ciHigh.toFixed(2)}`}
                        >
                          <div
                            className="absolute inset-y-0 left-0 rounded-sm"
                            style={{ width: `${(m.value / max) * 100}%`, background: tierColor(modelTier(data, m.id)) }}
                          />
                          {/* 95% bootstrap CI whisker */}
                          <div
                            className="absolute top-1/2 h-px -translate-y-1/2"
                            style={{ left: `${(m.ciLow / max) * 100}%`, width: `${((m.ciHigh - m.ciLow) / max) * 100}%`, background: "rgba(244,241,234,0.9)" }}
                          />
                          <div className="absolute top-1/2 h-2 w-px -translate-y-1/2" style={{ left: `${(m.ciLow / max) * 100}%`, background: "rgba(244,241,234,0.9)" }} />
                          <div className="absolute top-1/2 h-2 w-px -translate-y-1/2" style={{ left: `${(m.ciHigh / max) * 100}%`, background: "rgba(244,241,234,0.9)" }} />
                        </div>
                        <span className="flex w-12 items-center justify-end gap-1 text-right font-mono text-[11px] text-muted">
                          {m.value.toFixed(1)}
                          {m.significant && (
                            <span
                              title={t.patterns.sigTitle(m.direction ?? "above")}
                              style={{ color: m.direction === "above" ? "#2a9d8f" : "#e63946" }}
                            >
                              {m.direction === "above" ? "▲" : "▼"}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                    <p className="pt-1 font-mono text-[10px] leading-relaxed text-muted">
                      {t.patterns.note(data.index.runs_per_prompt, data.index.prompt_count)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-ink-soft p-4">
                    <div className="eyebrow mb-1.5">{t.patterns.theFix}</div>
                    <p className="text-sm text-paper/80">{t.patternMeta[c.id]?.tip ?? t.patterns.fallbackTip}</p>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
