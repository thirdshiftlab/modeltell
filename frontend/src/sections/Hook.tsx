import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import type { ModeltellData } from "../types";
import { fmt } from "../lib/utils";
import { useT, useLang } from "../i18n";

export function Hook({ data }: { data: ModeltellData }) {
  const t = useT();
  const { lang } = useLang();
  const loc = lang === "de" ? "de-DE" : "en-US";
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const annotOpacity = useTransform(scrollYProgress, [0.15, 0.45], [0, 1]);
  const sentenceScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.94]);

  const totalWords = Object.values(data.fingerprints).reduce(
    (s, fp) => s + (fp.corpus.total_words || 0),
    0
  );
  const patternCount = data.patterns.syntactic_patterns.length;

  return (
    <section ref={ref} id="hook" className="relative min-h-[170vh]">
      <div className="sticky top-0 flex min-h-screen flex-col justify-center px-6 md:px-12">
        <div className="mx-auto w-full max-w-5xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="eyebrow mb-8"
          >
            {t.hook.eyebrow}
          </motion.p>

          <motion.h1 style={{ scale: sentenceScale }} className="display-xl origin-left">
            <span className="text-paper/40">{t.hook.titleFaint}</span>{" "}
            <span className="text-paper">{t.hook.titleStrong}</span>
          </motion.h1>

          <motion.div
            style={{ opacity: annotOpacity }}
            className="mt-12 max-w-3xl font-display text-2xl leading-relaxed md:text-3xl"
          >
            {t.hook.parts.map((p, i) =>
              p.pattern ? (
                <span key={i} className="relative inline">
                  <span className="rounded bg-accent-gold/15 px-1 text-accent-gold decoration-accent-gold/50 underline-offset-4">
                    {p.t}
                  </span>
                  <sup className="ml-0.5 align-super font-mono text-[10px] text-muted">
                    {p.pattern}
                  </sup>
                </span>
              ) : (
                <span key={i} className="text-paper/85">
                  {p.t}
                </span>
              )
            )}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="lede mt-12 max-w-prose"
          >
            {t.hook.lede({
              prompts: fmt(data.index.prompt_count, 0, loc),
              models: data.index.models.length,
              runs: data.index.runs_per_prompt,
              words: fmt(totalWords, 0, loc),
              patterns: patternCount,
            })}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-16 flex items-center gap-2 font-mono text-xs text-muted"
          >
            <span className="inline-block h-4 w-px animate-pulse bg-muted" />
            {t.hook.scroll}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
