import { useMemo, useState } from "react";
import { Section } from "../components/Section";
import { SectionHeader, Reveal } from "../components/Reveal";
import { RadarChart } from "../components/RadarChart";
import type { ModeltellData } from "../types";
import { RADAR_DIMENSIONS } from "../types";
import { radarMaxima, normalizeRadar, modelLabel } from "../lib/utils";
import { useT } from "../i18n";

// Fixed contrasting palette so two same-tier models stay distinguishable.
const COLOR_A = "#e9c46a"; // gold
const COLOR_B = "#4ea8de"; // blue

export function HeadToHead({ data }: { data: ModeltellData }) {
  const t = useT();
  const ids = data.index.models.map((m) => m.id);
  const [a, setA] = useState(ids[0]);
  const [b, setB] = useState(ids[1] ?? ids[0]);
  const maxima = useMemo(() => radarMaxima(data.fingerprints), [data]);
  const axes = RADAR_DIMENSIONS.map((d) => t.radar[d.key]);

  const fpA = data.fingerprints[a];
  const fpB = data.fingerprints[b];
  const similarity = data.similarity.matrix[a]?.[b] ?? 0;

  const Picker = ({ value, onChange, color }: { value: string; onChange: (v: string) => void; color: string }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border bg-ink-card px-3 py-2 font-mono text-sm text-paper outline-none"
      style={{ borderColor: color }}
    >
      {data.index.models.map((m) => (
        <option key={m.id} value={m.id}>
          {m.label}
        </option>
      ))}
    </select>
  );

  // biggest per-dimension gaps
  const gaps = RADAR_DIMENSIONS.map((d) => ({
    label: t.radar[d.key],
    a: fpA?.radar[d.key] ?? 0,
    b: fpB?.radar[d.key] ?? 0,
  }))
    .map((g) => ({ ...g, diff: Math.abs(g.a - g.b) }))
    .sort((x, y) => y.diff - x.diff)
    .slice(0, 3);

  return (
    <Section id="head-to-head" tone="soft">
      <SectionHeader
        index="04"
        eyebrow={t.headToHead.eyebrow}
        title={t.headToHead.title}
        lede={t.headToHead.lede}
      />

      <div className="mx-auto mt-12 max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
          <Picker value={a} onChange={setA} color={COLOR_A} />
          <span className="font-display text-2xl text-muted">{t.headToHead.vs}</span>
          <Picker value={b} onChange={setB} color={COLOR_B} />
        </div>

        <div className="grid items-center gap-10 md:grid-cols-2">
          <Reveal>
            <RadarChart
              axes={axes}
              size={400}
              series={[
                fpA && {
                  label: fpA.model.label,
                  color: COLOR_A,
                  values: normalizeRadar(fpA.radar, maxima),
                },
                fpB && {
                  label: fpB.model.label,
                  color: COLOR_B,
                  values: normalizeRadar(fpB.radar, maxima),
                },
              ].filter(Boolean) as any}
              className="mx-auto w-full max-w-md"
            />
          </Reveal>

          <Reveal delay={0.1}>
            <div>
              <div className="mb-6">
                <div className="eyebrow mb-1">{t.headToHead.similarity}</div>
                <div className="font-display text-6xl font-black text-accent-gold">
                  {(similarity * 100).toFixed(0)}
                  <span className="text-2xl text-muted">%</span>
                </div>
                <p className="mt-1 font-mono text-xs text-muted">
                  {t.headToHead.similarityNote}
                </p>
              </div>

              <div className="space-y-3">
                <div className="eyebrow">{t.headToHead.divergences}</div>
                {gaps.map((g) => (
                  <div key={g.label}>
                    <div className="mb-1 flex justify-between font-mono text-xs">
                      <span className="text-paper/80">{g.label}</span>
                      <span className="text-muted">
                        {g.a.toFixed(1)} vs {g.b.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-ink">
                      <div
                        className="h-full"
                        style={{
                          width: `${(g.a / (g.a + g.b || 1)) * 100}%`,
                          background: COLOR_A,
                        }}
                      />
                      <div
                        className="h-full"
                        style={{
                          width: `${(g.b / (g.a + g.b || 1)) * 100}%`,
                          background: COLOR_B,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-4 font-mono text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-4 rounded" style={{ background: COLOR_A }} />
                  {modelLabel(data, a)}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-4 rounded" style={{ background: COLOR_B }} />
                  {modelLabel(data, b)}
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
