import { useMemo } from "react";
import { Section } from "../components/Section";
import { SectionHeader, Reveal } from "../components/Reveal";
import { RadarChart } from "../components/RadarChart";
import type { ModeltellData } from "../types";
import { RADAR_DIMENSIONS } from "../types";
import { radarMaxima, normalizeRadar, tierColor } from "../lib/utils";
import { useFilters } from "../state/filters";
import { useT } from "../i18n";

export function Fingerprints({ data }: { data: ModeltellData }) {
  const t = useT();
  const { enabledIds } = useFilters();
  const maxima = useMemo(() => radarMaxima(data.fingerprints), [data]);
  const axes = RADAR_DIMENSIONS.map((d) => t.radar[d.key]);
  const legendItems = RADAR_DIMENSIONS.map((d) => ({
    key: d.key,
    label: t.radar[d.key],
    help: t.radarHelp[d.key],
  }));

  const models = enabledIds
    .map((id) => data.fingerprints[id])
    .filter(Boolean)
    .sort((a, b) => a.model.tier.localeCompare(b.model.tier));

  return (
    <Section id="fingerprints">
      <SectionHeader
        index="03"
        eyebrow={t.fingerprints.eyebrow}
        title={t.fingerprints.title}
        lede={t.fingerprints.lede}
      />

      <div className="mx-auto mt-14 grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {models.map((fp, i) => (
          <Reveal key={fp.model.id} delay={Math.min(i * 0.04, 0.4)}>
            <figure
              className="group relative rounded-2xl border border-ink-line bg-ink-card/40 p-3 transition-colors hover:border-paper/20 focus-within:border-paper/20"
              tabIndex={0}
            >
              <RadarChart
                axes={axes}
                showLabels={false}
                size={220}
                series={[
                  {
                    label: fp.model.label,
                    color: tierColor(fp.model.tier),
                    values: normalizeRadar(fp.radar, maxima),
                  },
                ]}
                className="w-full"
              />
              <figcaption className="mt-1 text-center">
                <div className="font-display text-sm font-semibold text-paper">{fp.model.label}</div>
                <div className="font-mono text-[10px] uppercase tracking-wider" style={{ color: tierColor(fp.model.tier) }}>
                  {t.tierLabels[fp.model.tier]}
                </div>
              </figcaption>
              <div className="pointer-events-none absolute inset-x-2 bottom-2 z-10 translate-y-2 rounded-lg border border-ink-line bg-ink/95 p-3 text-left opacity-0 shadow-2xl shadow-black/40 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted">{t.fingerprints.legendTitle}</div>
                <dl className="grid gap-1.5">
                  {legendItems.map((item) => (
                    <div key={item.key} className="grid grid-cols-[5.5rem_1fr] gap-2">
                      <dt className="truncate font-mono text-[10px] text-paper/80">{item.label}</dt>
                      <dd className="text-[10px] leading-snug text-paper/60">{item.help}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </figure>
          </Reveal>
        ))}
      </div>

      {models.length === 0 && (
        <p className="mt-12 text-center font-mono text-sm text-muted">
          {t.fingerprints.noModels}
        </p>
      )}
    </Section>
  );
}
