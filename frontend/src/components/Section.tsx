import type { ReactNode } from "react";

export function Section({
  id,
  children,
  className = "",
  tone = "ink",
}: {
  id: string;
  children: ReactNode;
  className?: string;
  tone?: "ink" | "soft";
}) {
  return (
    <section
      id={id}
      className={`section-pad ${tone === "soft" ? "bg-ink-soft" : "bg-ink"} ${className}`}
    >
      {children}
    </section>
  );
}
