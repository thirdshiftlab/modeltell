import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ModeltellData, Tier } from "../types";
import { TIER_META } from "../types";
import { useFilters } from "../state/filters";
import { useT } from "../i18n";

const TIER_ORDER: Tier[] = ["frontier", "mid", "opensource"];

/** Floating, collapsible global model/tier filter shared across all sections. */
export function FilterBar({ data }: { data: ModeltellData }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const { activeModels, toggleModel, setTier, isTierFullyOn, enabledIds, reset } = useFilters();

  const byTier = (tier: Tier) => data.index.models.filter((m) => m.tier === tier);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-[min(92vw,340px)] rounded-2xl border border-ink-line bg-ink-card/95 p-4 shadow-2xl backdrop-blur"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="eyebrow">{t.filter.title}</span>
              <button onClick={reset} className="font-mono text-[11px] text-muted hover:text-paper">
                {t.filter.reset}
              </button>
            </div>

            <div className="space-y-3">
              {TIER_ORDER.map((tier) => (
                <div key={tier}>
                  <button
                    onClick={() => setTier(tier, !isTierFullyOn(tier))}
                    className="mb-1.5 flex items-center gap-2"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: TIER_META[tier].color }}
                    />
                    <span className="font-mono text-xs uppercase tracking-wider text-paper/90">
                      {t.tierLabels[tier]}
                    </span>
                  </button>
                  <div className="flex flex-wrap gap-1.5">
                    {byTier(tier).map((m) => {
                      const on = activeModels.has(m.id);
                      return (
                        <button
                          key={m.id}
                          onClick={() => toggleModel(m.id)}
                          className="rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors"
                          style={{
                            borderColor: on ? TIER_META[tier].color : "#26262b",
                            background: on ? `${TIER_META[tier].color}22` : "transparent",
                            color: on ? "#f4f1ea" : "#8a8a93",
                          }}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-ink-line bg-ink-card/95 px-4 py-2.5 font-mono text-xs text-paper shadow-xl backdrop-blur transition-colors hover:border-accent-gold"
      >
        <span className="h-2 w-2 rounded-full bg-accent-gold" />
        {enabledIds.length}/{data.index.models.length} {t.common.modelsLabel}
      </button>
    </div>
  );
}
