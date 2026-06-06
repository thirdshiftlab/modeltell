import { useMemo, useState } from "react";
import { interpolateRgb } from "d3";
import { Section } from "../components/Section";
import { SectionHeader } from "../components/Reveal";
import type { ModeltellData } from "../types";
import { modelLabel, tierColor, modelTier } from "../lib/utils";
import { useFilters } from "../state/filters";
import { useT } from "../i18n";

const colorRamp = interpolateRgb("#16161a", "#e9c46a");

type Metric = "similarity" | "delta";

export function SimilarityHeatmap({ data }: { data: ModeltellData }) {
  const t = useT();
  const { enabledIds } = useFilters();
  const ids = enabledIds.filter((id) => data.fingerprints[id]);
  const hasDelta = !!data.delta?.matrix;
  const [metric, setMetric] = useState<Metric>("similarity");
  const active: Metric = metric === "delta" && hasDelta ? "delta" : "similarity";
  const [hover, setHover] = useState<{ a: string; b: string; v: number } | null>(null);

  const matrix = active === "delta" ? data.delta!.matrix : data.similarity.matrix;

  // Off-diagonal min/max over the visible models, for color scaling + extremes.
  const { lo, hi } = useMemo(() => {
    let lo: { a: string; b: string; v: number } | null = null;
    let hi: { a: string; b: string; v: number } | null = null;
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) {
        const v = matrix[ids[i]]?.[ids[j]] ?? 0;
        if (!lo || v < lo.v) lo = { a: ids[i], b: ids[j], v };
        if (!hi || v > hi.v) hi = { a: ids[i], b: ids[j], v };
      }
    return { lo, hi };
  }, [matrix, ids]);

  const vmin = lo?.v ?? 0;
  const vmax = hi?.v ?? 1;
  // Brightness: similarity → high is bright; delta (a distance) → low is bright.
  const brightness = (v: number) => {
    if (active === "delta") {
      const span = vmax - vmin || 1;
      return 1 - (v - vmin) / span;
    }
    return v; // similarity already ~0..1
  };
  const colorFor = (v: number) => colorRamp(Math.max(0, Math.min(1, brightness(v))));
  const fmtCell = (v: number) => (active === "delta" ? `Δ ${v.toFixed(2)}` : `${(v * 100).toFixed(0)}%`);

  // "Most alike" / "most different" flip meaning between a similarity and a distance.
  const alike = active === "delta" ? lo : hi;
  const different = active === "delta" ? hi : lo;

  return (
    <Section id="similarity">
      <SectionHeader
        index="08"
        eyebrow={t.similarity.eyebrow}
        title={t.similarity.title}
        lede={active === "delta" ? t.similarity.ledeDelta : t.similarity.ledeSimilarity}
      />

      {hasDelta && (
        <div className="mx-auto mt-8 flex max-w-6xl items-center gap-1 font-mono text-xs">
          {(["similarity", "delta"] as Metric[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className="rounded-full border px-3 py-1.5 transition-colors"
              style={{
                borderColor: active === m ? "#e9c46a" : "#26262b",
                background: active === m ? "#e9c46a22" : "transparent",
                color: active === m ? "#f4f1ea" : "#8a8a93",
              }}
            >
              {m === "similarity" ? t.similarity.radarSimilarity : t.similarity.burrowsDelta}
            </button>
          ))}
        </div>
      )}

      <div className="mx-auto mt-8 grid max-w-6xl gap-10 lg:grid-cols-[1fr_280px]">
        <div className="overflow-x-auto">
          <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${ids.length}, minmax(26px, 1fr))` }}>
            <div />
            {ids.map((id) => (
              <div key={id} className="flex h-32 items-end justify-center pb-2">
                <span
                  className="whitespace-nowrap font-mono text-[11px] leading-none"
                  style={{ color: tierColor(modelTier(data, id)), writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                >
                  {modelLabel(data, id)}
                </span>
              </div>
            ))}

            {ids.map((rowId) => (
              <Row key={rowId} {...{ rowId, ids, data, matrix, colorFor, fmtCell, setHover }} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {hover && (
            <div className="rounded-xl border border-ink-line bg-ink-card p-4">
              <div className="eyebrow mb-1">{t.similarity.selectedPair}</div>
              <div className="font-display text-lg text-paper">
                {modelLabel(data, hover.a)} ↔ {modelLabel(data, hover.b)}
              </div>
              <div className="mt-1 font-mono text-3xl text-accent-gold">{fmtCell(hover.v)}</div>
            </div>
          )}

          {alike && <Callout title={t.similarity.mostAlike} data={data} pair={alike} fmt={fmtCell} accent="#e9c46a" />}
          {different && <Callout title={t.similarity.mostDifferent} data={data} pair={different} fmt={fmtCell} accent="#457b9d" />}

          {active === "delta" && (
            <p className="font-mono text-[11px] leading-relaxed text-muted">
              {t.similarity.deltaFootnote(data.delta!.mfw_count)}
            </p>
          )}
        </div>
      </div>
    </Section>
  );
}

function Row({
  rowId,
  ids,
  data,
  matrix,
  colorFor,
  fmtCell,
  setHover,
}: {
  rowId: string;
  ids: string[];
  data: ModeltellData;
  matrix: Record<string, Record<string, number>>;
  colorFor: (v: number) => string;
  fmtCell: (v: number) => string;
  setHover: (h: { a: string; b: string; v: number } | null) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-end pr-2 font-mono text-[10px]" style={{ color: tierColor(modelTier(data, rowId)) }}>
        {modelLabel(data, rowId)}
      </div>
      {ids.map((colId) => {
        const v = matrix[rowId]?.[colId] ?? 0;
        return (
          <button
            key={colId}
            onMouseEnter={() => setHover({ a: rowId, b: colId, v })}
            onMouseLeave={() => setHover(null)}
            className="aspect-square rounded-sm transition-transform hover:scale-110"
            style={{ background: colorFor(v) }}
            title={`${modelLabel(data, rowId)} ↔ ${modelLabel(data, colId)}: ${fmtCell(v)}`}
          />
        );
      })}
    </>
  );
}

function Callout({
  title,
  data,
  pair,
  fmt,
  accent,
}: {
  title: string;
  data: ModeltellData;
  pair: { a: string; b: string; v: number };
  fmt: (v: number) => string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-ink-line bg-ink-card/50 p-4">
      <div className="eyebrow mb-1" style={{ color: accent }}>
        {title}
      </div>
      <div className="font-display text-base text-paper">
        {modelLabel(data, pair.a)} & {modelLabel(data, pair.b)}
      </div>
      <div className="font-mono text-sm text-muted">{fmt(pair.v)}</div>
    </div>
  );
}
