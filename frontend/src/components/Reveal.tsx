import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Fades + lifts children into view once, on scroll. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeader({
  index,
  eyebrow,
  title,
  lede,
}: {
  index: string;
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-prose">
      <Reveal>
        <div className="mb-4 flex items-baseline gap-3">
          <span className="font-mono text-sm text-accent-gold">{index}</span>
          <span className="eyebrow">{eyebrow}</span>
        </div>
      </Reveal>
      <Reveal delay={0.05}>
        <h2 className="display-lg mb-6">{title}</h2>
      </Reveal>
      {lede && (
        <Reveal delay={0.1}>
          <p className="lede">{lede}</p>
        </Reveal>
      )}
    </div>
  );
}
