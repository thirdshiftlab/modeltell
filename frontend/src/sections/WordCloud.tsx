import { useMemo } from "react";
import { motion } from "framer-motion";
import { Section } from "../components/Section";
import { SectionHeader } from "../components/Reveal";
import type { ModeltellData } from "../types";
import { useT } from "../i18n";
import { useFilters } from "../state/filters";
import { modelLabel } from "../lib/utils";

const CATEGORY_COLOR: Record<string, string> = {
  power_word: "#e9c46a",
  hedge: "#457b9d",
  connector: "#2a9d8f",
  filler: "#8a8a93",
  other: "#cfcad1",
};

export function WordCloud({ data }: { data: ModeltellData }) {
  const t = useT();
  const { enabledIds } = useFilters();
  const words = useMemo(() => {
    const active = new Set(enabledIds);
    return data.watchlistWords.words
      .map((word) => ({
        ...word,
        overuse_score: word.per_model
          ? enabledIds.reduce((sum, id) => sum + (word.per_model?.[id] ?? 0), 0) / Math.max(enabledIds.length, 1)
          : word.overuse_score,
        worst_offenders: word.per_model
          ? Object.entries(word.per_model)
              .filter(([id]) => active.has(id))
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([id]) => id)
          : word.worst_offenders.filter((id) => active.has(id)),
      }))
      .filter((word) => word.overuse_score > 0)
      .sort((a, b) => b.overuse_score - a.overuse_score)
      .slice(0, 70);
  }, [data.watchlistWords.words, enabledIds]);
  const max = words[0]?.overuse_score ?? 1;
  const min = words[words.length - 1]?.overuse_score ?? 0;
  const sizeOf = (s: number) => {
    const t = (s - min) / (max - min || 1);
    return 0.9 + t * 2.6; // rem
  };

  const cats = Array.from(new Set(words.map((w) => w.category)));

  return (
    <Section id="words" tone="soft">
      <SectionHeader
        index="02"
        eyebrow={t.words.eyebrow}
        title={t.words.title}
        lede={t.words.lede}
      />

      <div className="mx-auto mt-14 max-w-5xl">
        <div className="mb-8 flex flex-wrap gap-4">
          {cats.map((c) => (
            <span key={c} className="flex items-center gap-2 font-mono text-xs text-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_COLOR[c] }} />
              {t.categories[c as keyof typeof t.categories] ?? c}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-baseline justify-center gap-x-5 gap-y-2">
          {words.map((w, i) => (
            <motion.span
              key={w.word}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: Math.min(i * 0.012, 0.5) }}
              title={`${w.word} · ${w.overuse_score.toFixed(2)} per 1k · top: ${w.worst_offenders
                .map((id) => modelLabel(data, id))
                .join(", ")}`}
              className="font-display font-semibold leading-none transition-colors hover:!text-paper"
              style={{ fontSize: `${sizeOf(w.overuse_score)}rem`, color: CATEGORY_COLOR[w.category] ?? "#cfcad1" }}
            >
              {w.word}
            </motion.span>
          ))}
        </div>

        {words.length === 0 && (
          <p className="mt-10 text-center font-mono text-sm text-muted">{t.words.noModels}</p>
        )}
      </div>
    </Section>
  );
}
