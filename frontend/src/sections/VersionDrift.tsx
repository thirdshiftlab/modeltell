import { useMemo } from "react";
import { interpolateRgb } from "d3";
import { Section } from "../components/Section";
import { SectionHeader, Reveal } from "../components/Reveal";
import { RadarChart, type RadarSeries } from "../components/RadarChart";
import type { ModeltellData, ModelFingerprint } from "../types";
import { RADAR_DIMENSIONS } from "../types";
import { radarMaxima, normalizeRadar } from "../lib/utils";
import { useT } from "../i18n";

interface Family {
  family: string;
  label: string;
  versions: ModelFingerprint[]; // oldest → newest
}

function familyLabel(fp: ModelFingerprint): string {
  // "Claude Opus 4.8" → "Claude Opus"
  const v = fp.model.version;
  return v ? fp.model.label.replace(new RegExp(`\\s*${v}.*$`), "").trim() : fp.model.label;
}

export function VersionDrift({ data }: { data: ModeltellData }) {
  const t = useT();
  const maxima = useMemo(() => radarMaxima(data.fingerprints), [data]);
  const axes = RADAR_DIMENSIONS.map((d) => t.radar[d.key]);

  // Group fingerprints by family, keep only families with ≥2 versions.
  const families = useMemo<Family[]>(() => {
    const byFamily: Record<string, ModelFingerprint[]> = {};
    for (const fp of Object.values(data.fingerprints)) {
      const fam = fp.model.family;
      if (!fam) continue;
      (byFamily[fam] ??= []).push(fp);
    }
    return Object.entries(byFamily)
      .filter(([, v]) => v.length >= 2)
      .map(([family, v]) => ({
        family,
        label: familyLabel(v[0]),
        versions: v.sort((a, b) => (a.model.version ?? "").localeCompare(b.model.version ?? "", undefined, { numeric: true })),
      }));
  }, [data]);

  if (families.length === 0) return null;

  return (
    <Section id="drift" tone="soft">
      <SectionHeader
        index="05"
        eyebrow={t.drift.eyebrow}
        title={t.drift.title}
        lede={t.drift.lede}
      />

      <div className="mx-auto mt-14 max-w-5xl space-y-16">
        {families.map((fam, fi) => {
          const n = fam.versions.length;
          const grad = interpolateRgb("#5b6470", "#e9c46a"); // old → new
          const series: RadarSeries[] = fam.versions.map((fp, i) => ({
            label: fp.model.version ?? fp.model.label,
            color: grad(n === 1 ? 1 : i / (n - 1)),
            values: normalizeRadar(fp.radar, maxima),
          }));

          // Biggest shifts: newest vs oldest, per dimension.
          const oldest = fam.versions[0];
          const newest = fam.versions[n - 1];
          const shifts = RADAR_DIMENSIONS.map((d) => ({
            label: t.radar[d.key],
            from: oldest.radar[d.key] ?? 0,
            to: newest.radar[d.key] ?? 0,
          }))
            .map((s) => ({ ...s, delta: s.to - s.from }))
            .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
            .slice(0, 4);

          return (
            <Reveal key={fam.family} delay={Math.min(fi * 0.05, 0.3)}>
              <div className="grid items-center gap-10 md:grid-cols-2">
                <div>
                  <RadarChart axes={axes} size={400} series={series} className="mx-auto w-full max-w-md" />
                </div>
                <div>
                  <div className="mb-1 font-display text-2xl font-semibold text-paper">{fam.label}</div>
                  <div className="mb-5 flex flex-wrap gap-2">
                    {fam.versions.map((fp, i) => (
                      <span key={fp.model.id} className="flex items-center gap-1.5 font-mono text-xs">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: grad(n === 1 ? 1 : i / (n - 1)) }}
                        />
                        <span className="text-paper/80">{fp.model.version}</span>
                      </span>
                    ))}
                  </div>

                  <div className="eyebrow mb-2">
                    {t.drift.biggestShifts} · {oldest.model.version} → {newest.model.version}
                  </div>
                  <div className="space-y-2.5">
                    {shifts.map((s) => {
                      const up = s.delta >= 0;
                      const mag = Math.min(Math.abs(s.delta) / (Math.max(...shifts.map((x) => Math.abs(x.delta))) || 1), 1);
                      return (
                        <div key={s.label} className="flex items-center gap-3">
                          <span className="w-28 shrink-0 font-mono text-[11px] text-paper/70">{s.label}</span>
                          <div className="flex flex-1 items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${mag * 100}%`, background: up ? "#2a9d8f" : "#e63946" }}
                              />
                            </div>
                            <span className="w-16 shrink-0 text-right font-mono text-[11px]" style={{ color: up ? "#2a9d8f" : "#e63946" }}>
                              {up ? "▲" : "▼"} {Math.abs(s.delta).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-4 font-mono text-[11px] text-muted">
                    {t.drift.legend(newest.model.version ?? "")}
                  </p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
