import { useMemo } from "react";
import { Section } from "../components/Section";
import { SectionHeader, Reveal } from "../components/Reveal";
import { RadarChart, type RadarSeries } from "../components/RadarChart";
import type { ModeltellData, Tier } from "../types";
import { RADAR_DIMENSIONS, TIER_META } from "../types";
import { radarMaxima, normalizeRadar, averageRadar } from "../lib/utils";
import { useFilters } from "../state/filters";
import { useT } from "../i18n";

const TIERS: Tier[] = ["frontier", "mid", "opensource"];

export function TierAnalysis({ data }: { data: ModeltellData }) {
  const t = useT();
  const { enabledIds } = useFilters();
  const maxima = useMemo(() => radarMaxima(data.fingerprints), [data]);
  const axes = RADAR_DIMENSIONS.map((d) => t.radar[d.key]);

  const series: RadarSeries[] = TIERS.map((tier) => {
    const fps = enabledIds
      .map((id) => data.fingerprints[id])
      .filter((fp) => fp && fp.model.tier === tier);
    if (fps.length === 0) return null;
    const avg = averageRadar(fps.map((fp) => fp.radar));
    return { label: t.tierLabels[tier], color: TIER_META[tier].color, values: normalizeRadar(avg, maxima) };
  }).filter(Boolean) as RadarSeries[];

  return (
    <Section id="tiers" tone="soft">
      <SectionHeader
        index="07"
        eyebrow={t.tierAnalysis.eyebrow}
        title={t.tierAnalysis.title}
        lede={t.tierAnalysis.lede}
      />

      <div className="mx-auto mt-12 grid max-w-5xl items-center gap-10 md:grid-cols-2">
        <Reveal>
          <RadarChart axes={axes} size={420} series={series} className="mx-auto w-full max-w-md" />
        </Reveal>
        <Reveal delay={0.1}>
          <div className="space-y-5">
            {TIERS.map((tier) => {
              const tmeta = TIER_META[tier];
              const count = enabledIds.filter((id) => data.fingerprints[id]?.model.tier === tier).length;
              return (
                <div key={tier} className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ background: tmeta.color }} />
                  <span className="font-display text-lg text-paper">{t.tierLabels[tier]}</span>
                  <span className="font-mono text-xs text-muted">{count} {t.tierAnalysis.models}</span>
                </div>
              );
            })}
            <p className="max-w-prose pt-2 text-sm text-paper/70">{t.tierAnalysis.note}</p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
